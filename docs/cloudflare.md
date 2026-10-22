# Hosting at the edge (Cloudflare)

The game is published by GitHub Pages at `https://xiondigital.net/kankakombat/`. This
runbook covers putting that origin behind Cloudflare: real `301`s for the pre-rename
`/KankaKombat/` address and edge caching for the hashed build assets.

## Where things stand

- `xiondigital.net` is already delegated to Cloudflare
  (`mira.ns.cloudflare.com`, `kenneth.ns.cloudflare.com`), but its records are
  **DNS-only** (grey cloud). Requests reach GitHub Pages directly — responses carry
  `Server: GitHub.com` and `Cache-Control: max-age=600`.
- Because nothing sits in front of Pages, the only answer for `/KankaKombat/` is the
  forwarder page in the `xiondigital.github.io` repo: it works, but it is an HTTP `200`
  with a client-side jump, not a `301`.
- Pages cannot issue redirects and ignores `_redirects`-style files, so the redirect has
  to happen at the edge.

> Blocked from inside the agent session: the connected Cloudflare integration can read
> the account, but every zone-scoped call returns `403` with error `9109` ("Invalid
> access token"). No DNS, redirect or cache change could be applied from here. Either
> reconnect the Cloudflare integration, or make the changes below in the dashboard.

## 1. Proxy the records

DNS → Records. Flip these to **Proxied** (orange cloud); leave the values alone, they are
GitHub Pages' published addresses:

| Type | Name | Content |
| --- | --- | --- |
| A | `xiondigital.net` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA | `xiondigital.net` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www` | `xiondigital.github.io` |

**SSL/TLS → Overview must be Full (strict).** Pages serves a valid certificate for this
hostname; Flexible would loop between Cloudflare's HTTPS and Pages' HTTPS redirect.

## 2. Redirect the old path with a 301

Rules → Redirect Rules → Create rule.

- **Rule name:** `old uppercase game path`
- **When incoming requests match:** Custom filter expression
  ```
  starts_with(http.request.uri.path, "/KankaKombat")
  ```
- **Then:** Dynamic redirect
  ```
  concat("https://xiondigital.net", regex_replace(http.request.uri.path, "^/KankaKombat", "/kankakombat"))
  ```
  Status code **301**, **Preserve query string** on.

That keeps invite links intact: `/KankaKombat/?room=ABCDE` →
`/kankakombat/?room=ABCDE`.

Add a second rule *above* it for the old asset-style link, because the generic rule would
otherwise turn `/KankaKombat/index.html` into `/kankakombat/index.html` (a 404):

```
http.request.uri.path eq "/KankaKombat/index.html"
```
→ static redirect to `https://xiondigital.net/kankakombat/`, `301`.

Cloudflare's match here is case-sensitive, which covers the historical links. Other
casings (`/KANKAKOMBAT/`) would need their own rules or a Worker; they never existed in
practice.

Keep the forwarder page in `xiondigital.github.io` as the fallback for the windows when
the proxy is switched off.

## 3. Cache the build output at the edge

The build emits content-hashed files (`dist/assets/index-BsuTmXdV.css`), so they are safe
to cache hard. Caching → Cache Rules → Create rule:

- **When:** `starts_with(http.request.uri.path, "/kankakombat/assets/")`
- **Then:** Eligible for cache, Edge TTL **1 year**, Browser TTL **1 year**.

Leave HTML on the default (`max-age=600` from Pages) so a new deploy shows up within ten
minutes; `dist/assets/*` names change on every build anyway. `og.png`, `favicon.png` and
`/fonts/*` can take a shorter custom TTL (a day) if they are hit often.

## 4. Verify

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

Then load the game in a browser and confirm the title screen, a room create/join, and no
console errors — a proxy change shows up as mixed-content or redirect loops first.

## Caveats

- GitHub renews the Pages certificate with an HTTP-01 challenge served by Pages itself.
  Proxying passes that through as long as no "Cache Everything" rule covers the whole
  zone. If renewal ever fails, grey-cloud the apex records for a few minutes.
- GitHub Pages' own `Cache-Control: max-age=600` still applies to HTML behind the proxy.
- Previewing a new build is unaffected: run it locally (`npm run dev`) or a Pages preview
  deployment before pushing to `main`.
