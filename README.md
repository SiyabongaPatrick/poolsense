# PoolSense
Offline-first PWA: pool-table photo analysis, ghost-ball aiming, bank shots and a physics sandbox. Vanilla HTML/CSS/JS, no dependencies, no build step.

## Run locally
    python3 -m http.server 8000     # or any static server
    # open http://localhost:8000 (localhost counts as secure, so the service worker works)
Test: `for t in geometry physics analyzer; do node tests/$t.test.js; done`

## Use
Load a top-down photo (or "Sample photo"), drag balls to correct detection, tap a numbered ball to target it, choose pocket and Direct/bank rail, then Shoot. Scenarios save to localStorage.

## Deploy (static hosting)
Upload the folder as-is to GitHub Pages, Netlify, Cloudflare Pages or any HTTPS host. Open once online to install; it then works offline. Bump `V` in `sw.js` on each release so clients refresh the cache. For better installability on some Android browsers add 192/512 px PNG icons to `manifest.json`.

## Notes and limits
- Units are mm on a 9-ft table (2540x1270); ball radius 28.575. Edit `TABLE` in `geometry.js` for other sizes.
- Detection: felt found by dominant hue, balls by blob size/shape. Works best on clear top-down photos; touching balls merge and balls the same hue as the felt are missed, so correct by dragging.
- Physics: constant cloth deceleration, no spin or throw; cue-ball path after contact assumes stun (no spin).
- `python/image_analysis.py` (needs `opencv-python`, `numpy`) is an optional desktop tool, not run in the browser.
- No screen capture, cross-app integration, overlays or automated input. A PWA cannot inspect another app's screen; use photos/screenshots you load yourself.
