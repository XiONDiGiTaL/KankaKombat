# AI Handoff Directive: Kanka Kombat: Nutella Nights

> **Read this first if you are an AI agent continuing this project.**
> The first agent session wrote this file before doing anything else, so the plan survives even if
> that session ran out of budget partway through. Check `docs/PROGRESS.md` for what is actually done.

## The mission (condensed from the owner's full directive)
Build a **complete, original, playable 2D pixel-art beat-'em-up** for the browser (desktop and mobile)
with **online co-op multiplayer**. It's inspired mechanically by River City Ransom, but every asset is original.

- Title: **Kanka Kombat: Nutella Nights**, by XiØN / XiONDiGiTaL (https://xiondigital.net).
  Title, repo name and route must stay configurable (`src/shared/config/branding.ts`).
- Target URL: https://xiondigital.net/kankakombat
- Repo: https://github.com/XiONDiGiTaL/kankakombat (was `KankaKombat`; the lowercase name is what makes the
  public Pages path /kankakombat/, since GitHub Pages project paths are case-sensitive).
- Architecture reference: https://github.com/XiONDiGiTaL/leapbuddies. Never modify that repo.
- **NEVER commit the River City Ransom ROM** or any extracted proprietary asset. `.gitignore` blocks
  `*.gba *.nes *.sfc *.smc *.zip`.

### Priority order
1. Responsive, fun gameplay
2. Reliable online multiplayer
3. Combat, AI, progression, stage design
4. Consistent original pixel art
5. Production deploy
6. Docs, tests, architecture

### Playable protagonists (both available from the start)
- **B.T.** (woman): long dark-brown hair, white collared shirt with red accents, blue jeans, brown shoes.
  Speed and combo fighter: fast light chains, quick dodge, agile jump kick.
- **S.C.** (man): big dark curly hair, full beard, black graphic tee with a blue/red design, dark jeans,
  silver chain and wrist accessories, red-accented sneakers. Power and grappler: heavy hits, strong
  throws, longer grab hold.

Both need full animation sets: idle, walk, run, jump, fall, land, crouch, light1-3, heavy, jump attack,
hurt, knockdown, getup, grab, grab-hold, grab-attack, throw, block, dodge, eat, victory, defeat, ready.

### Campaign (4 chapters, each with several sections, a shop and a named boss)
1. **İstanbul** (TRY ₺): Bosphorus, narrow streets, tea shops, tram. Signature enemy: *Rıza Dondurmacı*
   (fez, handlebar mustache, belly charge, ice-cream feint). Boss: a neighborhood enforcer.
2. **İzmir** (TRY ₺): Aegean promenade at sunset. Boss: an agile street-fight promoter with feints and
   a phase change.
3. **New York** (USD $): brick, fire escapes, subway. Signature enemy: an original, dignified comedic
   street character ("Rooftop Ray"-style, with improvised-object attacks). Boss: an underground fight
   organizer who boxes.
4. **Tampa** (USD $): palms, strip malls. Signature enemy: *Angry Grandpa* (cane swing, furious charge,
   grumbling get-up). Boss: a grappling neighborhood fixer.

Currency rule: money carries over between chapters and is **converted at the chapter boundary**
(₺ → $ at a fixed in-game rate).

### Food items
| Item | Effect |
|---|---|
| Nutella | small heal |
| Banana | small heal plus a short speed buff |
| Baklava | moderate heal |
| Sujuk | moderate heal plus a short damage buff |
| Lahmacun | full heal |
| Ayran | +1 life (capped) |

All values live in config. Server-validated. Items can't be consumed twice. Picking up food at full HP
stores it in the inventory (4 slots) instead of wasting it.

## Architecture decisions
- **TypeScript monorepo-lite**: `src/shared` (pure deterministic simulation and protocol),
  `src/client` (Canvas2D renderer, input, UI, audio), `src/server` (Node `ws` authoritative room server).
- **Shared simulation**: the same `Simulation` class runs on the server (authoritative) and in the
  client for solo/offline play. The protocol is versioned (`PROTOCOL_VERSION`) and validated.
- **Networking**: server-authoritative at 30 Hz. Clients send input bitmasks with sequence numbers.
  The server broadcasts snapshots at 15 to 20 Hz. Clients interpolate remote entities. The local player
  is rendered from snapshots, with light smoothing; no full prediction in v1.
- **Rendering**: a custom lightweight Canvas2D engine at 384x216 internal resolution, integer-scaled,
  `imageSmoothingEnabled=false`. No Phaser, to keep it small and keep simulation and render separate.
- **Art**: sprites are **generated programmatically** from code-defined pixel parts (`tools/sprites/`
  → PNG sheets plus JSON atlases in `public/assets/`). They're deterministic, original, and easy to restyle.
- **Audio**: WebAudio chiptune synth (original sequences) plus procedural SFX. No audio files needed.
- **Hosting**: static client builds with Vite (`base` = `/kankakombat/`). The WebSocket server is a separate
  Node service (Render/Fly/Railway). The client reads the server URL from `VITE_WS_URL`. If no server is
  reachable, the game still offers solo play.

## Phase checklist (update docs/PROGRESS.md as you go)
A. Inspect leapbuddies and write the plan → B. Vertical slice (one stage, both heroes, enemy, combat,
grab/throw, money, food, shop) → C. Multiplayer (ws server, lobby, room code, ready, sync) →
D. Four chapters plus bosses → E. Art and audio polish → F. Tests (vitest unit tests plus a Playwright
two-client test) → G. Deploy → H. README and handoff.

## Rules for continuing agents
- Read `docs/PROGRESS.md`, run `npm install && npm test && npm run build`, then continue from the first
  unchecked item.
- Keep the simulation deterministic and free of DOM. Put all tunables in `src/shared/data/*`.
- Don't claim deployment or features that weren't verified.
