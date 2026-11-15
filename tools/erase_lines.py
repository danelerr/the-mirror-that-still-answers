"""Paints out the long horizontal ground lines some sprite sheets draw under each figure, before cutting.

    python web/tools/erase_lines.py <sheet.jpg> <clean.png> [min_run_px]
"""
import sys
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
minrun = int(sys.argv[3]) if len(sys.argv) > 3 else 230
a = np.array(Image.open(src).convert("RGB"))
g = a.mean(axis=2)
dark = g < 140
n = 0
for y in range(a.shape[0]):
    row = dark[y]
    x = 0
    W = row.size
    while x < W:
        if row[x]:
            x0 = x
            while x < W and row[x]:
                x += 1
            if x - x0 >= minrun:
                a[y, x0:x] = 255
                n += 1
        else:
            x += 1
Image.fromarray(a).save(dst)
print("runs erased:", n)
