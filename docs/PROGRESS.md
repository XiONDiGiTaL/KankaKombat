# Progress log

Status legend: [x] done and verified · [~] partially done · [ ] not started

- [x] Directive written (docs/AI_HANDOFF_DIRECTIVE.md)
- [x] Phase A: LeapBuddies inspected (static GitHub Pages site; Supabase Realtime broadcast relay; host-authoritative; see docs/ARCHITECTURE.md)
- [x] Phase A: ROM looked at only for its header (RIVERCRANSOM / BDTE). Its text is compressed, and REA (a native-binary RE MCP that drives Hopper/Ghidra/Frida) is not set up for GBA ARM ROMs here. Mechanics come from public, high-level genre knowledge. The ROM is never committed (.gitignore).
- [x] Sprite pipeline (tools/sprites): rig + hand-authored hero heads + procedural enemy heads → 23 PNG sheets + JSON atlases
- [x] B.T. and S.C. full animation sets (idle, walk, run, jump, fall, land, crouch, light chains, heavy, jump attack, run attack, hurt, knockdown, down, getup, grab, hold, grab attack, throw, block, dodge, eat, pickup, victory, defeat, ready, dizzy, held, thrown)
- [x] Authoritative simulation (src/shared/sim): movement, depth axis, combat, combos, block, dodge, grabs and throws, juggle cap, dizzy, poise and armor, props, hazards, projectiles, AI tokens, bosses with phases, telegraphs and tired windows
- [x] Items: 6 foods with real effects, bag, shops, currency per country with conversion at the US border, XP and levels
- [x] Campaign: 4 chapters × 3 sections, waves, shops, 4 named bosses, continues
- [x] Networking: versioned and validated protocol, HostSession (server and relay), reconnect by token, drop-in, rate limiting
- [x] Client: renderer, 12 procedural backgrounds, HUD, overlays, FX, WebAudio chiptunes and SFX, keyboard (remappable), gamepad, touch, all menus
- [x] Tests: 46 vitest unit/integration tests (including a full 4-chapter bot campaign); 3 Playwright e2e tests with two separate browser contexts (dedicated server boss fight; relay street fight, shop, reconnect; bad room code)
- [ ] Deployment workflow (GitHub Pages) plus server deployment config
- [ ] README, screenshots, promo MP4
- [ ] Visual polish pass per chapter
