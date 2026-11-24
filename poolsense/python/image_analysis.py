#!/usr/bin/env python3
"""Optional offline tool: detect balls in a table photo with OpenCV.
Usage: python3 image_analysis.py photo.jpg > scene.json   (same mm coordinates as the web app)
Not run in the browser; it is a development/calibration aid only."""
import sys, json
import cv2, numpy as np
W, H, R = 2540, 1270, 28.575

def analyse(path):
    img = cv2.imread(path)
    if img is None: raise SystemExit("cannot read " + path)
    img = cv2.resize(img, None, fx=640 / img.shape[1], fy=640 / img.shape[1])
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    sat = (hsv[..., 1] > 90) & (hsv[..., 2] > 60)
    hue = int(np.argmax(np.bincount(hsv[..., 0][sat], minlength=180)))
    felt = cv2.inRange(hsv, (max(hue - 10, 0), 64, 40), (min(hue + 10, 179), 255, 255))
    felt = cv2.morphologyEx(felt, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    cs, _ = cv2.findContours(felt, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    x, y, w, h = cv2.boundingRect(max(cs, key=cv2.contourArea))
    hs = hsv[y:y + h, x:x + w]
    r = R * w / W
    g = cv2.GaussianBlur(cv2.cvtColor(img[y:y + h, x:x + w], cv2.COLOR_BGR2GRAY), (5, 5), 0)
    c = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, 1, 1.6 * r, param1=100, param2=16,
                         minRadius=int(.7 * r), maxRadius=int(1.4 * r))
    corners = [(0, 0), (w / 2, 0), (w, 0), (0, h), (w / 2, h), (w, h)]
    found = []
    for cx, cy, cr in (c[0] if c is not None else []):
        m = np.zeros(g.shape, np.uint8); cv2.circle(m, (int(cx), int(cy)), int(cr * .8), 255, -1)
        p = hs[m > 0]
        if len(p) == 0: continue
        if np.mean((abs(p[:, 0].astype(int) - hue) <= 10) & (p[:, 1] > 64)) > .5: continue  # felt
        s, v = p[:, 1].mean(), p[:, 2].mean()
        if v < 80 and min(np.hypot(cx - a, cy - b) for a, b in corners) < 2.5 * r: continue  # pocket
        found.append((cx, cy, s, v))
    cue = max((i for i, f in enumerate(found) if f[2] < 64 and f[3] > 180), key=lambda i: found[i][3] - found[i][2], default=None)
    out, n = [], 0
    for i, (cx, cy, s, v) in enumerate(found):
        if i == cue: bid = "cue"
        else: n += 1; bid = n
        out.append({"id": bid, "x": round(min(max(cx / w * W, R), W - R), 1), "y": round(min(max(cy / h * H, R), H - R), 1)})
    return {"balls": out}

if __name__ == "__main__":
    print(json.dumps(analyse(sys.argv[1]) if len(sys.argv) > 1 else sys.exit(__doc__)))
