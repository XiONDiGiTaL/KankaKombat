import { describe, it, expect } from 'vitest';
import { HostSession } from '../src/shared/net/session';
import { ServerMsg, PROTOCOL_VERSION } from '../src/shared/net/protocol';
import { decode } from '../src/shared/sim/snapshot';
import { CHAPTERS } from '../src/shared/data/stages';

function room() {
  const inbox = new Map<string, ServerMsg[]>();
  let now = 0;
  const s = new HostSession({ code: 'TEST1', send: (p, m) => { if (!inbox.has(p)) inbox.set(p, []); inbox.get(p)!.push(m); }, seed: 11, now: () => now });
  const hello = (peer: string, token: string, f: 'bt' | 'sc' = 'bt') => s.onMessage(peer, { t: 'hello', v: PROTOCOL_VERSION, name: peer, token, f });
  const last = (peer: string, t: string) => [...(inbox.get(peer) ?? [])].reverse().find((m) => m.t === t);
  return { s, inbox, hello, last, tick: (n = 1) => { for (let i = 0; i < n; i++) { now += 16; s.tick(); } }, advance: (ms: number) => (now += ms) };
}

describe('room session', () => {
  it('lobby: join, unique fighters, ready-up and host-only start', () => {
    const r = room();
    r.hello('a', 'tokA', 'bt'); r.hello('b', 'tokB', 'bt');
    const lobby = r.last('a', 'lobby') as Extract<ServerMsg, { t: 'lobby' }>;
    expect(lobby.players.map((p) => p.f)).toEqual(['bt', 'sc']);
    expect(lobby.players[0].host).toBe(true);
    r.s.onMessage('a', { t: 'ready', r: true });
    r.s.onMessage('a', { t: 'start' });
    expect(r.s.inGame).toBe(false); // b not ready
    r.s.onMessage('b', { t: 'ready', r: true });
    r.s.onMessage('b', { t: 'start' });
    expect(r.s.inGame).toBe(false); // b is not the host
    expect((r.last('b', 'err') as { code: string }).code).toBe('not-host');
    r.s.onMessage('a', { t: 'start' });
    expect(r.s.inGame).toBe(true);
    expect(r.s.sim!.players().length).toBe(2);
  });

  it('applies inputs in order and ignores replayed sequence numbers', () => {
    const r = room();
    r.hello('a', 'tokA'); r.s.onMessage('a', { t: 'ready', r: true }); r.s.onMessage('a', { t: 'start' });
    r.tick(130);
    const p = r.s.sim!.players()[0];
    const x0 = p.x;
    r.s.onMessage('a', { t: 'in', s: 10, h: 2, p: 0 });
    r.tick(20);
    expect(p.x).toBeGreaterThan(x0);
    r.s.onMessage('a', { t: 'in', s: 11, h: 0, p: 0 });
    r.s.onMessage('a', { t: 'in', s: 10, h: 2, p: 0 }); // replay: ignored
    r.tick(5);
    const x1 = p.x; r.tick(10);
    expect(p.x).toBe(x1);
  });

  it('broadcasts snapshots with acks that decode on the client', () => {
    const r = room();
    r.hello('a', 'tokA'); r.s.onMessage('a', { t: 'ready', r: true }); r.s.onMessage('a', { t: 'start' });
    r.tick(9);
    const snap = r.last('a', 'snap') as Extract<ServerMsg, { t: 'snap' }>;
    expect(snap).toBeTruthy();
    const v = decode(snap.s);
    expect(v.players.length).toBe(1);
  });

  it('a disconnect parks the player; reconnecting with the same token restores them', () => {
    const r = room();
    r.hello('a', 'tokA'); r.hello('b', 'tokB');
    r.s.onMessage('a', { t: 'ready', r: true }); r.s.onMessage('b', { t: 'ready', r: true }); r.s.onMessage('a', { t: 'start' });
    r.tick(10);
    const pb = r.s.sim!.players().find((p) => p.name === 'b')!;
    pb.money = 123; pb.lives = 2; pb.bag = ['ayran'];
    r.s.onDisconnect('b');
    expect(r.s.sim!.players().length).toBe(1);
    r.tick(60);
    r.hello('b2', 'tokB'); // new transport, same token
    const back = r.s.sim!.players().find((p) => p.name === 'b')!;
    expect(back.money).toBe(123);
    expect(back.lives).toBe(2);
    expect(back.bag).toEqual(['ayran']);
    expect((r.last('b2', 'welcome') as { inGame: boolean }).inGame).toBe(true);
  });

  it('silent peers time out; host rights move to someone still connected', () => {
    const r = room();
    r.hello('a', 'tokA'); r.hello('b', 'tokB');
    r.advance(9000);
    r.s.onMessage('b', { t: 'ping', ts: 1 });
    r.tick(1);
    const lobby = r.last('b', 'lobby') as Extract<ServerMsg, { t: 'lobby' }>;
    expect(lobby.players.find((p) => p.id.startsWith('P1'))!.conn).toBe(false);
    expect(lobby.players.find((p) => p.host)!.name).toBe('b');
  });

  it('drop-in: a player joining mid-game spawns into the running sim; the room caps at 4', () => {
    const r = room();
    r.hello('a', 'tokA'); r.s.onMessage('a', { t: 'ready', r: true }); r.s.onMessage('a', { t: 'start' });
    r.hello('b', 'tokB'); r.hello('c', 'tokC'); r.hello('d', 'tokD');
    expect(r.s.sim!.players().length).toBe(4);
    r.hello('e', 'tokE');
    expect((r.last('e', 'err') as { code: string }).code).toBe('room-full');
  });

  it('purchases are validated by the authority and answered with the nonce', () => {
    const r = room();
    r.hello('a', 'tokA'); r.s.onMessage('a', { t: 'ready', r: true }); r.s.onMessage('a', { t: 'start' });
    r.s.onMessage('a', { t: 'cmd', c: 'buy', item: 'nutella', nonce: 'n1' });
    const res = r.last('a', 'res') as Extract<ServerMsg, { t: 'res' }>;
    expect(res.nonce).toBe('n1');
    expect(res.ok).toBe(false); // not in a shop
  });

  it('two players on one boss: a single KO, a single reward, coins credited once', () => {
    const r = room();
    r.hello('a', 'tokA', 'bt'); r.hello('b', 'tokB', 'sc');
    r.s.onMessage('a', { t: 'ready', r: true }); r.s.onMessage('b', { t: 'ready', r: true });
    (r.s.opts as { allowDebugStart?: boolean }).allowDebugStart = true;
    // the boss arena is wherever the chapter puts it, after the streets and the peaceful plaza
    r.s.onMessage('a', { t: 'start', ch: 0, se: CHAPTERS[0].sections.findIndex((s) => s.boss) });
    const sim = r.s.sim!;
    r.tick(200);
    const boss = sim.byId(sim.bossId)!;
    let kos = 0;
    const totalBefore = sim.players().reduce((n, p) => n + p.money, 0);
    boss.phase = 1; boss.hp = 3; boss.inv = 0; // already in phase two
    const [pa, pb] = sim.players();
    for (const p of [pa, pb]) { p.x = boss.x - 18; p.z = boss.z; p.face = 1; }
    pb.x = boss.x + 18; pb.face = -1;
    for (let i = 0; i < 120; i++) {
      r.s.onMessage('a', { t: 'in', s: 100 + i, h: i % 2 ? 16 : 0, p: i % 2 ? 16 : 0 });
      r.s.onMessage('b', { t: 'in', s: 100 + i, h: i % 2 ? 16 : 0, p: i % 2 ? 16 : 0 });
      r.tick(1);
      kos += sim.events.filter((e) => e.k === 'ko').length;
      for (const m of r.inbox.get('a') ?? []) if (m.t === 'snap') kos += 0;
    }
    const allKos = (r.inbox.get('a') ?? []).filter((m): m is Extract<ServerMsg, { t: 'snap' }> => m.t === 'snap').flatMap((m) => m.s.ev).filter((e) => e.k === 'ko' && e.boss);
    expect(allKos.length).toBe(1);
    expect(['bossdown', 'chapterclear']).toContain(sim.phase);
    const gained = sim.players().reduce((n, p) => n + p.money, 0) - totalBefore;
    expect(gained).toBe(120); // the boss purse, exactly once, split between both
    void kos;
  });
});
