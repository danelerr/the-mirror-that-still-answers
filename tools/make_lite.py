"""Half-size copies of the film's pictures for phones and tablets (web/assets_m/, same paths as web/assets/).
Decoded pictures take a quarter of the memory, so iOS does not close the page. Run from the repository root:
python web/tools/make_lite.py"""
import glob
import os
from PIL import Image

SRC, DST = "web/assets", "web/assets_m"
files = (glob.glob(SRC + "/sprites/*/*.webp") + glob.glob(SRC + "/scenes/*.jpg") + glob.glob(SRC + "/scenes/*.webp")
         + glob.glob(SRC + "/photos/*.jpg") + [SRC + "/earth.webp", SRC + "/moon.webp", SRC + "/tranquility_as11-40-5948.jpg"])
n = 0
for f in files:
    out = DST + f[len(SRC):]
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
        continue
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im = Image.open(f)
    im.load()
    w, h = max(1, (im.width + 1) // 2), max(1, (im.height + 1) // 2)
    small = im.resize((w, h), Image.LANCZOS)
    tmp = out + ".part"
    if f.endswith(".webp"):
        small.save(tmp, "WEBP", quality=86, method=4)
    else:
        small.convert("RGB").save(tmp, "JPEG", quality=86, optimize=True)
    os.replace(tmp, out)
    n += 1
print(len(files), "pictures,", n, "written to", DST)
