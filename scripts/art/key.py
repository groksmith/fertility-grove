"""Usage: key.py <in.png> <out.webp> <max_w>
Magenta (#FF00FF) chroma key -> transparent webp, trimmed, with spill removal."""
import sys, cv2, numpy as np
src, out, mw = sys.argv[1], sys.argv[2], int(sys.argv[3])
keep_top = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0   # drop a floor band below this fraction
im = cv2.imread(src, cv2.IMREAD_COLOR).astype(np.float32)  # BGR
im = im[: round(im.shape[0] * keep_top)]
b, g, r = im[..., 0], im[..., 1], im[..., 2]
# Magentaness: how far R and B both rise above G, relative to brightness.
# Works on gradients and darker magenta bands, not just the corner colour.
h, w = g.shape
mx = np.maximum(np.maximum(r, b), 1)
m = (np.minimum(r, b) - g) / mx
a = 1 - np.clip((m - 0.28) / 0.5, 0, 1)
a = cv2.GaussianBlur(a, (3, 3), 0)
a[a < 0.05] = 0
sel = m > 0.85
bg = np.median(im[sel], axis=0) if sel.any() else np.array([255, 0, 255], np.float32)
# Unmix the background colour out of edge pixels.
safe = np.maximum(a, 1e-3)[..., None]
col = (im - (1 - a)[..., None] * bg) / safe
col = np.clip(col, 0, 255)
# Kill leftover magenta spill: cap R and B at G + a little where they both exceed it.
spill = np.minimum(col[..., 2], col[..., 0]) - col[..., 1]
fix = (spill > 25) & (a < 0.98)
avg = (col[..., 2] + col[..., 0]) / 2
col[..., 2][fix] = np.minimum(col[..., 2][fix], col[..., 1][fix] + 25)
col[..., 0][fix] = np.minimum(col[..., 0][fix], col[..., 1][fix] + 25)
# Glass and thin edges carry the magenta through: anything still purple
# (B close to R, both well above G) becomes a pale neutral, half see-through.
cr, cg, cb = col[..., 2], col[..., 1], col[..., 0]
purple = ((np.minimum(cr, cb) - cg) > 18) & (cb > cr * 0.82) & (a > 0)
neutral = (cg + np.minimum(cr, cb)) / 2 + 20
for ch in range(3):
    col[..., ch][purple] = np.clip(neutral[purple], 0, 255)
a = np.where(purple, a * 0.55, a)
# Keep the subject, drop stray specks of floor or smudge.
n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.2).astype(np.uint8), connectivity=8)
if n > 2:
    big = st[1:, 4].max()
    keep = np.isin(lab, [i for i in range(1, n) if st[i, 4] >= big * 0.12])
    a = np.where(keep | (cv2.dilate(keep.astype(np.uint8), np.ones((5, 5))) > 0), a, 0)
# Nothing survives outside the solid subject's box (faint smudges, mist).
ys0, xs0 = np.where(a > 0.6)
if len(ys0):
    m2 = round(0.02 * w)
    box = np.zeros_like(a, bool)
    box[max(ys0.min() - m2, 0): ys0.max() + m2, max(xs0.min() - m2, 0): xs0.max() + m2] = True
    a = np.where(box, a, 0)
rgba = np.dstack([col, a * 255]).astype(np.uint8)
ys, xs = np.where(a > 0.05)
pad = 8
y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad, h), max(xs.min() - pad, 0), min(xs.max() + pad, w)
rgba = rgba[y0:y1, x0:x1]
if rgba.shape[1] > mw:
    s = mw / rgba.shape[1]
    rgba = cv2.resize(rgba, (mw, round(rgba.shape[0] * s)), interpolation=cv2.INTER_AREA)
cv2.imwrite(out, rgba, [cv2.IMWRITE_WEBP_QUALITY, 86])
print(out, rgba.shape[1], rgba.shape[0])
