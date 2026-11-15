"""Cuts a sprite sheet (many drawings on a white background) into separate, aligned frames.

    python web/tools/cut_sprites.py dibujos/sprites/E2_espejo_despierta.png [--center] [--max 900]

Writes web/assets/sprites/<name>/00.png, 01.png ... (same size, aligned on the ground line, or
centred with --center for effects) and updates web/data/sprites.js with the frame count and size.
Frames are read left to right, top to bottom.

    python web/tools/cut_sprites.py sheet.png --grid 4x4 --body [--center]

With --body (for characters), the sheet is cut by whole drawings instead of by cell edges, so a
hand that reaches into the next cell stays whole; every frame is placed so that the character's
body (its biggest solid part, without arms and hands) sits at the same point, and the size of that
body is written to sprites.js ("u"), so the film can draw every sheet of a character at one size.
"""
import io
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def grid_boxes(im, cols, rows):
    """For sheets drawn inside a grid with lines: equal cells, cell borders trimmed away."""
    w, h = im.size
    out = []
    for r in range(rows):
        for c in range(cols):
            x0, y0 = int(c * w / cols), int(r * h / rows)
            x1, y1 = int((c + 1) * w / cols), int((r + 1) * h / rows)
            pad = max(4, int(min(x1 - x0, y1 - y0) * 0.03))
            out.append((x0 + pad, y0 + pad, x1 - pad, y1 - pad))
    return out


def cut(path, center=False, max_side=900, grid=None):
    name = os.path.splitext(os.path.basename(path))[0]
    im = Image.open(path).convert("RGB")
    if grid and BODY:
        return cut_bodies(name, im, grid, center)
    if grid:
        # cut each cell on its own, then treat it as a one-drawing sheet
        cells = [im.crop(b) for b in grid_boxes(im, grid[0], grid[1])]
        return cut_cells(name, cells, center, max_side)
    a = np.asarray(im).astype(np.int16)
    # white or near-white paper that touches the border is the background
    light = (a.min(axis=2) > 228) & (a.max(axis=2) - a.min(axis=2) < 28)
    lab, _ = ndimage.label(light)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8)))
    rgba = np.dstack([np.asarray(im), alpha])
    # one drawing = one blob, after joining nearby pieces (loose sparkles, fingers, puffs)
    solid = alpha > 40
    grow = max(6, int(min(im.size) * 0.012))
    joined = ndimage.binary_dilation(solid, iterations=grow)
    blobs, n = ndimage.label(joined)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(blobs), 1):
        if sl is None:
            continue
        ys, xs = sl
        area = int((blobs[sl] == i).sum())
        if area < solid.size * 0.002:
            continue
        sub = solid[sl] & (blobs[sl] == i)
        yy, xx = np.nonzero(sub)
        boxes.append([xs.start + xx.min(), ys.start + yy.min(), xs.start + xx.max() + 1, ys.start + yy.max() + 1, int(sub.sum())])
    # loose bits (stray speed lines, specks) are much smaller than a real drawing: drop them
    if boxes:
        med = float(np.median([b[4] for b in boxes]))
        boxes = [b[:4] for b in boxes if b[4] >= med * 0.18]
    if not boxes:
        raise SystemExit("no drawings found in " + path)
    # rows: drawings whose vertical centres are close belong to the same row
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows, cur = [], [boxes[0]]
    for b in boxes[1:]:
        h = np.median([c[3] - c[1] for c in cur])
        if abs((b[1] + b[3]) / 2 - np.mean([(c[1] + c[3]) / 2 for c in cur])) < h * 0.5:
            cur.append(b)
        else:
            rows.append(cur)
            cur = [b]
    rows.append(cur)
    frames = [b for r in rows for b in sorted(r, key=lambda b: b[0])]
    fw = max(b[2] - b[0] for b in frames) + 8
    fh = max(b[3] - b[1] for b in frames) + 8
    k = min(1.0, max_side / max(fw, fh))
    out = os.path.join(WEB, "assets", "sprites", name)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    src = Image.fromarray(rgba, "RGBA")
    for i, b in enumerate(frames):
        piece = src.crop(b)
        canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        x = (fw - piece.width) // 2
        y = (fh - piece.height) // 2 if center else fh - 4 - piece.height      # characters stand on the same ground line
        canvas.alpha_composite(piece, (x, y))
        if k < 1:
            canvas = canvas.resize((round(fw * k), round(fh * k)), Image.LANCZOS)
        canvas.save(os.path.join(out, "%02d.png" % i), optimize=True)
    # the list of sprite sets the story can use
    js = os.path.join(WEB, "data", "sprites.js")
    data = {}
    if os.path.exists(js):
        txt = io.open(js, encoding="utf-8").read()
        data = json.loads(txt[txt.index("=") + 1:].strip().rstrip(";"))
    data[name] = {"n": len(frames), "w": round(fw * k), "h": round(fh * k), "center": center}
    io.open(js, "w", encoding="utf-8", newline="\n").write(
        "// Sprite sets cut from the team's sprite sheets by web/tools/cut_sprites.py (frames, size).\n"
        "window.SPRITES = " + json.dumps(data, indent=1) + ";\n")
    print(name, len(frames), "frames,", round(fw * k), "x", round(fh * k), "| rows:", [len(r) for r in rows])


def cut_cells(name, cells, center, max_side):
    pieces = []
    for cell in cells:
        a = np.asarray(cell).astype(np.int16)
        light = (a.min(axis=2) > 228) & (a.max(axis=2) - a.min(axis=2) < 28)
        lab, _ = ndimage.label(light)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(border))
        alpha = np.where(bg, 0, 255).astype(np.uint8)
        alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8)))
        rgba = Image.fromarray(np.dstack([np.asarray(cell), alpha]), "RGBA")
        bb = rgba.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
        pieces.append(rgba.crop(bb) if bb else rgba)
    fw = max(p.width for p in pieces) + 8
    fh = max(p.height for p in pieces) + 8
    k = min(1.0, max_side / max(fw, fh))
    out = os.path.join(WEB, "assets", "sprites", name)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    for i, piece in enumerate(pieces):
        canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        x = (fw - piece.width) // 2
        y = (fh - piece.height) // 2 if center else fh - 4 - piece.height
        canvas.alpha_composite(piece, (x, y))
        if k < 1:
            canvas = canvas.resize((round(fw * k), round(fh * k)), Image.LANCZOS)
        canvas.save(os.path.join(out, "%02d.png" % i), optimize=True)
    write_index(name, len(pieces), round(fw * k), round(fh * k), center)
    print(name, len(pieces), "frames (grid),", round(fw * k), "x", round(fh * k))


BODY = False


def body_of(mask, cell):
    """The character's body in a frame: its biggest solid part once thin things (arms, hands, booms,
    speed lines) are worn away. Returns (centre x, centre y, size) in pixels of the mask."""
    q = 4
    m = mask[::q, ::q]
    r = max(3, int(cell / q * 0.10))
    core = ndimage.binary_opening(m, structure=np.ones((r, r), bool))
    lab, n = ndimage.label(core)
    if n == 0:
        ys, xs = np.nonzero(mask)
        return (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2, float(np.sqrt((xs.max() - xs.min()) * (ys.max() - ys.min())))
    sizes = ndimage.sum(core, lab, range(1, n + 1))
    sl = ndimage.find_objects(lab)[int(np.argmax(sizes))]
    y0, y1, x0, x1 = sl[0].start * q, sl[0].stop * q, sl[1].start * q, sl[1].stop * q
    return (x0 + x1) / 2, (y0 + y1) / 2, float(np.sqrt((x1 - x0) * (y1 - y0)))


def cut_bodies(name, im, grid, center):
    cols, rows = grid
    W, H = im.size
    cw, ch = W / cols, H / rows
    a = np.asarray(im).astype(np.int16)
    # the paper: white that touches the border of the whole sheet (so a closed glove stays white inside)
    light = (a.min(axis=2) > 228) & (a.max(axis=2) - a.min(axis=2) < 28)
    lab, _ = ndimage.label(light)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8)))
    solid = alpha > 40
    # every separate drawing goes, whole, to the cell where most of it lies
    parts, n = ndimage.label(solid, structure=np.ones((3, 3), int))
    owner = np.zeros(n + 1, int) - 1
    cell_of = np.full(solid.shape, -1, int)
    yy, xx = np.indices(solid.shape)
    grid_id = (np.minimum(yy // ch, rows - 1) * cols + np.minimum(xx // cw, cols - 1)).astype(int)
    for i, sl in enumerate(ndimage.find_objects(parts), 1):
        if sl is None:
            continue
        m = parts[sl] == i
        if (sl[1].stop - sl[1].start) > cw * 1.5 or (sl[0].stop - sl[0].start) > ch * 1.5:
            cell_of[sl][m] = grid_id[sl][m]              # two drawings touch: split them at the cell edge
            continue
        ids = np.bincount(grid_id[sl][m], minlength=cols * rows)
        cell_of[sl][m] = int(np.argmax(ids))
    frames = []
    for k in range(cols * rows):
        m = cell_of == k
        if not m.any():
            raise SystemExit("empty cell %d in %s" % (k, name))
        ys, xs = np.nonzero(m)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        sub = m[y0:y1, x0:x1]
        bx, by, u = body_of(sub, min(cw, ch))
        soft = ndimage.binary_dilation(sub, iterations=2)
        rgba = np.dstack([np.asarray(im)[y0:y1, x0:x1], np.where(soft, alpha[y0:y1, x0:x1], 0).astype(np.uint8)])
        frames.append(dict(im=Image.fromarray(rgba, "RGBA"), bx=bx, by=by, u=u, w=x1 - x0, h=y1 - y0))
    u = float(np.median([f["u"] for f in frames]))
    # the body sits at the same point of every frame; without --center the ground line is where the
    # drawings of this sheet usually end below the body
    left = max(f["bx"] for f in frames) + 4
    right = max(f["w"] - f["bx"] for f in frames) + 4
    top = max(f["by"] for f in frames) + 4
    below = max(f["h"] - f["by"] for f in frames) + 4
    drop = float(np.median([f["h"] - f["by"] for f in frames]))
    fw, fh = int(round(left + right)), int(round(top + below))
    out = os.path.join(WEB, "assets", "sprites", name)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    for i, f in enumerate(frames):
        canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        canvas.alpha_composite(f["im"], (int(round(left - f["bx"])), int(round(top - f["by"]))))
        canvas.save(os.path.join(out, "%02d.png" % i), optimize=True)
    extra = {"u": round(u, 1), "cx": round(left, 1), "cy": round(top, 1), "g": round(top + (0 if center else drop), 1)}
    write_index(name, len(frames), fw, fh, center, extra)
    print(name, len(frames), "frames (bodies),", fw, "x", fh, "| body", round(u), "| ground/body %.3f" % (drop / u))


def write_index(name, n, w, h, center, extra=None):
    js = os.path.join(WEB, "data", "sprites.js")
    data = {}
    if os.path.exists(js):
        txt = io.open(js, encoding="utf-8").read()
        data = json.loads(txt[txt.index("=") + 1:].strip().rstrip(";"))
    data[name] = {"n": n, "w": w, "h": h, "center": center}
    if extra:
        data[name].update(extra)
    io.open(js, "w", encoding="utf-8", newline="\n").write(
        "// Sprite sets cut from the team's sprite sheets by web/tools/cut_sprites.py (frames, size).\n"
        "window.SPRITES = " + json.dumps(data, indent=1) + ";\n")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    mx = 900
    if "--max" in sys.argv:
        mx = int(sys.argv[sys.argv.index("--max") + 1])
        args = [a for a in args if a != str(mx)]
    grid = None
    if "--grid" in sys.argv:
        g = sys.argv[sys.argv.index("--grid") + 1]
        grid = tuple(int(v) for v in g.lower().split("x"))
        args = [a for a in args if a != g]
    BODY = "--body" in sys.argv
    for p in args:
        cut(p, center="--center" in sys.argv, max_side=mx, grid=grid)
