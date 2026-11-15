"""Packs the pictures the film preloads as WebP, so the page is light to download.

    python web/tools/pack_webp.py [--force]

The drawing pipeline (cut_art.py, cut_sprites.py, color_sprites.py) works on PNG files; run this
afterwards. It writes a .webp next to every PNG that the film loads (sprite frames, character art,
props, the Earth and the Moon) when the PNG is newer than its WebP. The film loads only the WebP.
Written with an AI coding assistant, directed and reviewed by team Unsigned Int.
"""
import glob
import os
import sys

from PIL import Image

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORCE = "--force" in sys.argv
QUALITY = 86


def targets():
    a = os.path.join(WEB, "assets")
    out = glob.glob(os.path.join(a, "sprites", "*", "*.png"))
    out += glob.glob(os.path.join(a, "art", "*.png"))
    out += glob.glob(os.path.join(a, "scenes", "obj_*.png"))
    out += [os.path.join(a, "earth.png"), os.path.join(a, "moon.png")]
    return [p for p in out if os.path.exists(p)]


def main():
    n = before = after = 0
    for src in targets():
        dst = src[:-4] + ".webp"
        if FORCE or not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            tmp = dst + ".part"          # written aside and renamed, so a run cut short never leaves a broken file
            Image.open(src).convert("RGBA").save(tmp, "WEBP", quality=QUALITY, method=4, alpha_quality=100)
            os.replace(tmp, dst)
            n += 1
        before += os.path.getsize(src)
        after += os.path.getsize(dst)
    print("packed %d files; PNG %.1f MB -> WebP %.1f MB" % (n, before / 1e6, after / 1e6))


if __name__ == "__main__":
    main()
