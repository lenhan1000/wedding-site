"""Themed QR code for the wedding site -> assets/qr/wedding-qr.svg + .png

Usage: python scripts/make_qr.py [URL]      (needs: pip install segno pillow)
Palette is the site's (:root in index.html). Error correction H so the centre heart
and the rounded modules stay scannable. Quiet zone is the standard 4 modules, kept
clear of the gold keylines.
"""
import sys, os
import segno
from PIL import Image, ImageDraw

URL = sys.argv[1] if len(sys.argv) > 1 else "https://lenhan1000.github.io/wedding-site/"
NAME = sys.argv[2] if len(sys.argv) > 2 else "wedding-qr"   # output file stem
IVORY, PALM, LACQUER, GOLD = "#F5EDDD", "#2C4E2A", "#B5482E", "#B8912F"
QUIET, FRAME = 4, 2.6          # modules of quiet zone, extra decorative margin
# the site's faceted heart (same path as .heart-sep / .sb-names .heart in index.html), bbox x5-95, y12-98
HEART = [(5,35),(22,12),(42,12),(50,28),(58,12),(78,12),(95,35),(50,98)]
HEART_D = "M5,35 L22,12 L42,12 L50,28 L58,12 L78,12 L95,35 L50,98 Z"

qr = segno.make(URL, error="h", boost_error=False)
m = [list(r) for r in qr.matrix]
n = len(m)
size = n + 2 * (QUIET + FRAME)
off = QUIET + FRAME
c = n // 2                      # centre module; clear a block for the heart
R = 2 if n <= 37 else 1         # 5x5 for short links; denser codes (longer URLs) only tolerate 3x3 and still scan reliably
clear = lambda x, y: abs(x - c) <= R and abs(y - c) <= R
in_finder = lambda x, y: ((x < 8 and y < 8) or (x >= n - 8 and y < 8) or (x < 8 and y >= n - 8))
finders = [(0, 0), (n - 7, 0), (0, n - 7)]

# ---------- SVG ----------
s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size:g} {size:g}" width="1200" height="1200" shape-rendering="geometricPrecision">',
     f'<rect width="{size:g}" height="{size:g}" rx="2.4" fill="{IVORY}"/>',
     f'<rect x=".7" y=".7" width="{size-1.4:g}" height="{size-1.4:g}" rx="1.9" fill="none" stroke="{GOLD}" stroke-width=".28"/>',
     f'<rect x="1.35" y="1.35" width="{size-2.7:g}" height="{size-2.7:g}" rx="1.4" fill="none" stroke="{GOLD}" stroke-width=".12"/>',
     f'<g fill="{PALM}">']
for y in range(n):
    for x in range(n):
        if m[y][x] and not in_finder(x, y) and not clear(x, y):
            s.append(f'<circle cx="{off+x+.5:g}" cy="{off+y+.5:g}" r=".47"/>')
s.append('</g>')
for fx, fy in finders:
    X, Y = off + fx, off + fy
    s.append(f'<rect x="{X:g}" y="{Y:g}" width="7" height="7" rx="1.6" fill="{LACQUER}"/>')
    s.append(f'<rect x="{X+1:g}" y="{Y+1:g}" width="5" height="5" rx="1.3" fill="{IVORY}"/>')
    s.append(f'<rect x="{X+2:g}" y="{Y+2:g}" width="3" height="3" rx="1" fill="{PALM}"/>')
hs = (3.6 if R == 2 else 2.7) / 90   # heart ~3.6 modules wide (2.7 for the 3x3 clear), inside the cleared block
hx, hy = off + c + .5 - 50 * hs, off + c + .5 - 55 * hs   # bbox centre (50,55) on the centre module
s.append(f'<path fill="{LACQUER}" transform="translate({hx:g} {hy:g}) scale({hs:g})" d="{HEART_D}"/>')
s.append('</svg>')
out = os.path.join(os.path.dirname(__file__), "..", "assets", "qr")
os.makedirs(out, exist_ok=True)
open(os.path.join(out, NAME + ".svg"), "w", encoding="utf-8").write("\n".join(s))

# ---------- PNG (same geometry, 4x supersampled) ----------
U, SS = 50, 4
W = int(size * U * SS)
im = Image.new("RGB", (W, W), IVORY)
d = ImageDraw.Draw(im)
px = lambda v: v * U * SS
d.rounded_rectangle([px(.7), px(.7), px(size-.7), px(size-.7)], radius=px(1.9), outline=GOLD, width=int(px(.28)))
d.rounded_rectangle([px(1.35), px(1.35), px(size-1.35), px(size-1.35)], radius=px(1.4), outline=GOLD, width=int(px(.12)))
for y in range(n):
    for x in range(n):
        if m[y][x] and not in_finder(x, y) and not clear(x, y):
            cx, cy, r = off + x + .5, off + y + .5, .47
            d.ellipse([px(cx-r), px(cy-r), px(cx+r), px(cy+r)], fill=PALM)
for fx, fy in finders:
    X, Y = off + fx, off + fy
    d.rounded_rectangle([px(X), px(Y), px(X+7), px(Y+7)], radius=px(1.6), fill=LACQUER)
    d.rounded_rectangle([px(X+1), px(Y+1), px(X+6), px(Y+6)], radius=px(1.3), fill=IVORY)
    d.rounded_rectangle([px(X+2), px(Y+2), px(X+5), px(Y+5)], radius=px(1), fill=PALM)
poly = [(px(hx + hs*a), px(hy + hs*b)) for a, b in HEART]
d.polygon(poly, fill=LACQUER)
# round the outer card corners (transparent outside)
mask = Image.new("L", (W, W), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, W-1, W-1], radius=px(2.4), fill=255)
im = im.convert("RGBA"); im.putalpha(mask)
im.resize((1200, 1200), Image.LANCZOS).save(os.path.join(out, NAME + ".png"))
print("modules", n, "->", os.path.abspath(out))
