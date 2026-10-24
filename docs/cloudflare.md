# Hosting at the edge (Cloudflare)

The game is published by GitHub Pages at `https://xiondigital.net/kankakombat/`. This
runbook covers putting that origin behind Cloudflare: real `301`s for the pre-rename
`/KankaKombat/` address and edge caching for the hashed build assets.

## Where things stand

- `xiondigital.net` is proxied through Cloudflare. The apex and `www` records are CNAMEs
  to `xiondigital.github.io` (flattened at the apex), both answering with
  `Server: cloudflare`. SSL/TLS is **Full (strict)**.
- `/KankaKombat/` answers a real `301` at the edge, query string intact:
  `/KankaKombat/?room=ABCDE` → `https://xiondigital.net/kankakombat/?room=ABCDE`.
  Old subpaths land on the game root; the Free plan does not entitle `regex_replace` in
  a dynamic redirect target.
- Hashed build assets under `/kankakombat/assets/` are cached at the edge and in browsers
  for a year. HTML keeps Pages' `max-age=600`.
- Cloudflare's RUM / Web Analytics auto-injection is off (`rum = off`), so the game page
  loads no third-party beacon.
- `npm run verify:live` passes 3/3 against the proxied build (checked 2026-10-22).
- The connected Cloudflare integration still returns `403` / `9109` on zone-scoped calls
  and exposes no rules endpoints. Apply changes with a scoped API token or the dashboard;
  the token needs `Zone:Read`, `DNS:Edit`, `Zone Settings:Edit`, `Single Redirect:Edit`
  and `Cache Rules:Edit`.

Pages cannot issue redirects and ignores `_redirects`-style files, so the redirect has
to happen at the edge.

## 1. Proxy the records (applied)

DNS → Records. These are **Proxied** (orange cloud); the values are GitHub Pages'.

| Type | Name | Content |
| --- | --- | --- |
| CNAME | `xiondigital.net` | `xiondigital.github.io` (flattened at the apex) |
| CNAME | `www` | `xiondigital.github.io` |

**SSL/TLS → Overview must be Full (strict).** Pages serves a valid certificate for this
hostname; Flexible would loop between Cloudflare's HTTPS and Pages' HTTPS redirect.

## 2. Redirect the old path with a 301 (applied)

Rules → Redirect Rules. Two rules, in this order:

1. **Rule name:** `old uppercase game index`
   - **When:** `http.request.uri.path eq "/KankaKombat/index.html"`
   - **Then:** static redirect to `https://xiondigital.net/kankakombat/`, `301`,
     preserve query string. This must sit above the generic rule or the old index would
     become `/kankakombat/index.html` (a 404).
2. **Rule name:** `old uppercase game path`
   - **When:** `starts_with(http.request.uri.path, "/KankaKombat")`
   - **Then:** static redirect to `https://xiondigital.net/kankakombat/`, `301`,
     preserve query string.

That keeps invite links intact: `/KankaKombat/?room=ABCDE` →
`/kankakombat/?room=ABCDE`. A path-preserving dynamic target needs
`regex_replace`, which Cloudflare only allows on Business/WAF Advanced plans; on Free,
old subpaths land on the game root instead.

Cloudflare's match here is case-sensitive, which covers the historical links. Other
casings (`/KANKAKOMBAT/`) would need their own rules or a Worker; they never existed in
practice.

Keep the forwarder page in `xiondigital.github.io` as the fallback for the windows when
the proxy is switched off.

### With an API token instead of the dashboard

A token scoped to `Zone → Single Redirect → Edit` (plus `Zone → Cache Rules → Edit` for
step 3, `Zone → DNS → Edit` for step 1 and `Zone → Zone Settings → Edit` for SSL) can do
the same thing. The redirect rules are zone ruleset entries, so it is a `PUT` on the whole
`http_request_dynamic_redirect` ruleset — read it first, then send the full rule list back
with the new rules included, otherwise the existing rules are replaced:

```bash
ZONE=<zone id>; TOKEN=<api token>
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/rulesets/phases/http_request_dynamic_redirect/entrypoint"
```

Rulesets, unlike the old Page Rules, survive a dashboard edit; re-read the entrypoint after
any change to confirm both redirect rules are present. Cache rules live in the
`http_request_cache_settings` phase entrypoint and are merged the same way.

## 3. Cache the build output at the edge (applied)

The build emits content-hashed files (`dist/assets/index-BsuTmXdV.css`), so they are safe
to cache hard. Caching → Cache Rules → Create rule:

- **When:** `starts_with(http.request.uri.path, "/kankakombat/assets/")`
- **Then:** Eligible for cache, Edge TTL **1 year**, Browser TTL **1 year**.

Leave HTML on the default (`max-age=600` from Pages) so a new deploy shows up within ten
minutes; `dist/assets/*` names change on every build anyway. `og.png`, `favicon.png` and
`/fonts/*` can take a shorter custom TTL (a day) if they are hit often.

The soundtrack sits under that same rule (`/kankakombat/assets/music/*.mp3`) but its
filenames are **not** content-hashed. `musicUrl()` therefore appends the theme's `rev`
(`/kankakombat/assets/music/nyc.mp3?v=1`) and Cloudflare's default cache key includes the
query string, so a replaced master is a different URL and a different cache entry.
**When a track is replaced, bump its `rev` in `src/shared/data/music.ts`** — the filename
may stay the same, and nothing has to be purged. If a replacement ever ships without a
bump, it is stale for up to a year; a higher-priority rule for the soundtrack narrows that
to a day:

- **When:** `starts_with(http.request.uri.path, "/kankakombat/assets/music/")`
- **Then:** Eligible for cache, Edge TTL **1 day**, Browser TTL **1 day**.

Cache rules stop at the first match, so this one has to sit above the `/assets/` rule.

## 4. Verify

`npm run verify:live` runs all three checks below in one pass (redirect, edge cache
headers on a hashed asset, and the deployed fighter select) and exits non-zero if any
fails. The equivalent one-liners:

```bash
# proxy is on
curl -sI https://xiondigital.net/kankakombat/ | head -3          # Server: cloudflare

# assets are served from the edge on the second hit
curl -sI https://xiondigital.net/kankakombat/assets/index-XXXX.js | grep -i cf-cache-status  # MISS, then HIT

# the old address is a real redirect, code and hash preserved
curl -sI "https://xiondigital.net/KankaKombat/?room=ABCDE"       # 301 + Location: .../kankakombat/?room=ABCDE
curl -sI "https://xiondigital.net/KankaKombat/index.html"        # 301 + Location: .../kankakombat/

# the canonical URL never redirects to itself
curl -sI https://xiondigital.net/kankakombat/                    # 200
```

The script already loads the game and fails on console errors or 404s; to check a
room create/join by hand, open the title screen in a browser. A proxy change shows up as
mixed-content or redirect loops first. Give the audio one manual listen: the title theme
should start on the first click, and a chapter's city theme should carry into its boss
fight instead of going silent.

## Caveats

- GitHub renews the Pages certificate with an HTTP-01 challenge served by Pages itself.
  Proxying passes that through as long as no "Cache Everything" rule covers the whole
  zone. If renewal ever fails, grey-cloud the apex records for a few minutes.
- GitHub Pages' own `Cache-Control: max-age=600` still applies to HTML behind the proxy.
- Web Analytics auto-injection is off (`rum = off`). Turning it back on adds Cloudflare's
  `static.cloudflareinsights.com` beacon to the game page; `verify:live` treats a failed
  third-party request as a failure, so leave it off unless the beacon is wanted.
- Previewing a new build is unaffected: run it locally (`npm run dev`) or a Pages preview
  deployment before pushing to `main`.
