// Kanka Kombat multiplayer server.
//  - /ws?room=CODE&create=1   server-authoritative game rooms (the simulation runs here)
//  - /relay?ch=NAME           a minimal broadcast relay (self-hosted alternative to the
//                             Supabase Realtime relay; host-authoritative rooms use it)
//  - /health                  liveness probe
//  - everything else          the built client from ./dist, if present
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { HostSession } from '../shared/net/session';
import { makeRoomCode, normalizeRoomCode, parseClientPayload, MAX_MSG_BYTES, ServerMsg } from '../shared/net/protocol';
import { TICK_HZ } from '../shared/data/constants';

const PORT = Number(process.env.PORT ?? 8787);
const STATIC_DIR = process.env.STATIC_DIR ?? 'dist';
const ALLOW_DEBUG = process.env.KK_ALLOW_DEBUG === '1';
const MAX_ROOMS = Number(process.env.KK_MAX_ROOMS ?? 200);
const ROOM_IDLE_MS = 60_000;
const ORIGINS = (process.env.KK_ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

interface Room { session: HostSession; sockets: Map<string, WebSocket>; emptySince: number }
const rooms = new Map<string, Room>();
const relays = new Map<string, Set<WebSocket>>();
let peerSeq = 0;

const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, relays: relays.size }));
    return;
  }
  // static client
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  if (path.endsWith('/')) path += 'index.html';
  const file = join(STATIC_DIR, path);
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('not file');
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': path.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' });
    res.end(await readFile(file));
  } catch {
    try {
      // SPA fallback so a refresh on any client route still loads the game
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
      res.end(await readFile(join(STATIC_DIR, 'index.html')));
    } catch {
      res.writeHead(404); res.end('Kanka Kombat server. Build the client (npm run build) to serve it from here.');
    }
  }
});

const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MSG_BYTES * 4 });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const origin = req.headers.origin ?? '';
  if (ORIGINS.length && !ORIGINS.includes(origin)) { socket.destroy(); return; }
  if (url.pathname !== '/ws' && url.pathname !== '/relay') { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => (url.pathname === '/ws' ? onGameSocket(ws, url) : onRelaySocket(ws, url)));
});

function send(ws: WebSocket | undefined, msg: ServerMsg): void {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function onGameSocket(ws: WebSocket, url: URL): void {
  const create = url.searchParams.get('create') === '1';
  let code = normalizeRoomCode(url.searchParams.get('room') ?? '');
  if (create) {
    if (rooms.size >= MAX_ROOMS) { send(ws, { t: 'err', code: 'server-full', msg: 'Server is full, try again soon.' }); ws.close(); return; }
    if (!code || rooms.has(code)) { do code = makeRoomCode(); while (rooms.has(code)); }
    const room: Room = { sockets: new Map(), emptySince: 0, session: null as unknown as HostSession };
    room.session = new HostSession({ code, send: (peer, msg) => send(room.sockets.get(peer), msg), allowDebugStart: ALLOW_DEBUG });
    rooms.set(code, room);
  }
  const room = code ? rooms.get(code) : undefined;
  if (!room) { send(ws, { t: 'err', code: 'room-not-found', msg: 'Room not found. Check the code, or the room may have closed.' }); ws.close(); return; }
  const peer = 'w' + ++peerSeq;
  room.sockets.set(peer, ws);
  ws.on('message', (data, isBinary) => {
    if (isBinary) return;
    const text = data.toString();
    if (text.length > MAX_MSG_BYTES) return;
    const msg = parseClientPayload(text);
    if (msg) room.session.onMessage(peer, msg);
  });
  ws.on('close', () => { room.sockets.delete(peer); room.session.onDisconnect(peer); });
  ws.on('error', () => ws.close());
}

function onRelaySocket(ws: WebSocket, url: URL): void {
  const ch = (url.searchParams.get('ch') ?? '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  if (!ch || relays.size > MAX_ROOMS * 2) { ws.close(); return; }
  let set = relays.get(ch);
  if (!set) relays.set(ch, (set = new Set()));
  set.add(ws);
  ws.on('message', (data, isBinary) => {
    if (isBinary || data.toString().length > MAX_MSG_BYTES * 4) return;
    for (const o of set!) if (o !== ws && o.readyState === WebSocket.OPEN) o.send(data.toString());
  });
  ws.on('close', () => { set!.delete(ws); if (!set!.size) relays.delete(ch); });
  ws.on('error', () => ws.close());
}

// fixed-timestep loop shared by every room
let last = performance.now(), acc = 0;
const STEP = 1000 / TICK_HZ;
setInterval(() => {
  const now = performance.now();
  acc += Math.min(250, now - last); last = now;
  while (acc >= STEP) {
    acc -= STEP;
    for (const [code, room] of rooms) {
      room.session.tick();
      if (room.sockets.size === 0) {
        room.emptySince ||= Date.now();
        if (Date.now() - room.emptySince > ROOM_IDLE_MS) rooms.delete(code);
      } else room.emptySince = 0;
    }
  }
}, 4);

server.listen(PORT, () => console.log(`Kanka Kombat server on :${PORT} (static: ${STATIC_DIR}, debug starts: ${ALLOW_DEBUG})`));
