"""Colours the line-art sprite frames with the film's flat palette, so they match the puppets.

    python web/tools/color_sprites.py

Each frame is black ink on white. Every closed white area is painted with a colour chosen by
its size and its place in the drawing (the rules below), keeping the soft edge of the ink.
Written with an AI coding assistant, directed and reviewed by team Unsigned Int.
"""
import glob
import os

import numpy as np
from PIL import Image
from scipy import ndimage

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GOLD, CREAM, GLASS, GRAY, BLUE, STEEL, YELLOW, IVORY, TAN = (
    "#f2d27c", "#fbf3dc", "#bfe3ee", "#cfc8b8", "#8fb3d1", "#dfe3e6", "#ffe07a", "#f6f0e2", "#d9a77a")


def rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=float)


def regions(a):
    """Closed white areas inside the drawing, with their size and place."""
    alpha = a[..., 3] > 30
    gray = a[..., :3].mean(axis=2)
    white = alpha & (gray > 190)
    lab, n = ndimage.label(white)
    ys, xs = np.nonzero(alpha)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    bw, bh = box[2] - box[0], box[3] - box[1]
    total = alpha.sum()
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None:
            continue
        m = lab[sl] == i
        area = m.sum()
        if area < 12:
            continue
        cy, cx = ndimage.center_of_mass(m)
        cy += sl[0].start
        cx += sl[1].start
        w = sl[1].stop - sl[1].start
        h = sl[0].stop - sl[0].start
        out.append(dict(i=i, sl=sl, area=area, frac=area / total, rx=(cx - box[0]) / bw, ry=(cy - box[1]) / bh,
                        w=w, h=h, fill=area / max(1, w * h), cx=cx, cy=cy, holes=0))
    # how many tiny areas (reflectors, eyes) each big area really surrounds
    tiny = [q for q in out if q["frac"] < 0.004]
    for r in out:
        if r["frac"] < 0.01:
            continue
        sl = r["sl"]
        filled = ndimage.binary_fill_holes(lab[sl] == r["i"])
        for q in tiny:
            y, x = int(q["cy"]) - sl[0].start, int(q["cx"]) - sl[1].start
            if 0 <= y < filled.shape[0] and 0 <= x < filled.shape[1] and filled[y, x]:
                r["holes"] += 1
    return lab, out, gray


def paint(a, lab, regs, gray, rule):
    out = a.copy().astype(float)
    for r in regs:
        col = rule(r, regs)
        if col is None:
            continue
        zone = ndimage.binary_dilation(lab == r["i"], iterations=2) & (a[..., 3] > 30)
        shade = (gray[zone] / 255.0)[:, None]
        out[..., :3][zone] = rgb(col) * shade
    return out.clip(0, 255).astype(np.uint8)


def rover(r, regs):
    if r["ry"] > 0.76 or (r["ry"] > 0.6 and r["frac"] < 0.012):
        return GRAY                                   # wheels and suspension
    if r["ry"] > 0.5 and r["frac"] >= 0.012 and r["w"] < 2.4 * r["h"]:
        return GOLD                                   # the box body under the panels
    if r["frac"] < 0.006 and (r["rx"] < 0.06 or r["rx"] > 0.94 or r["ry"] < 0.05):
        return TAN                                    # little dust puffs flying around
    if r["ry"] < 0.40:
        if r["frac"] < 0.012 and r["fill"] > 0.55:
            return None                               # eye whites stay white
        return STEEL                                  # camera head and neck
    if r["w"] > 2.4 * r["h"] or (r["frac"] < 0.02 and r["ry"] < 0.56):
        return BLUE                                   # solar panels
    return GOLD                                       # the box body


def mirror(r, regs):
    """The Mirror: a cream tray full of round reflectors, a gold face window in its middle, a grey stand,
    and white gloves, eyes, teeth and reflectors."""
    if r["frac"] < 0.004:
        return None                                   # reflectors, eyes, teeth: white

    def inside(q, box):
        cy = q["sl"][0].start + q["h"] / 2
        cx = q["sl"][1].start + q["w"] / 2
        s = box["sl"]
        return s[0].start < cy < s[0].stop and s[1].start < cx < s[1].stop

    # tray pieces are full of reflectors (many per area); the face window only surrounds the eyes and the mouth
    trays = [q for q in regs if q["frac"] > 0.008 and q["holes"] >= 4 and q["holes"] * 1400 > q["area"]]
    if any(r is q for q in trays):
        return CREAM                                  # the tray (every piece of it, if an arm cuts it in two)
    if trays:
        # the tray's box (all its pieces together)
        y0 = min(q["sl"][0].start for q in trays); y1 = max(q["sl"][0].stop for q in trays)
        x0 = min(q["sl"][1].start for q in trays); x1 = max(q["sl"][1].stop for q in trays)
        th, tw = y1 - y0, x1 - x0
        beside = r["cx"] < x0 + 0.08 * tw or r["cx"] > x1 - 0.08 * tw
        if r["cy"] > y1 - 0.12 * th:
            return None if beside else GRAY           # below the tray: a glove resting beside it, or the stand
        within = lambda q: y0 < q["cy"] < y1 and x0 < q["cx"] < x1
        cands = [q for q in regs if q["frac"] > 0.01 and within(q) and not any(q is z for z in trays) and q["cy"] <= y1 - 0.12 * th]
        if cands and r is max(cands, key=lambda q: q["area"]):
            return GOLD                               # the face window
        if any(r is q for q in cands):
            return GOLD if r["fill"] > 0.62 else None  # another piece of the window, or a glove in front of the tray
    if r["rx"] < 0.17 or r["rx"] > 0.83:
        return None                                   # the gloves stay white
    if r["ry"] > 0.86:
        return GRAY                                   # the frame it stands on
    if r["frac"] < 0.03 and r["fill"] < 0.62:
        return None                                   # a glove (fingers make it lumpy) stays white
    return GOLD


def photon(r, regs):
    body = max(regs, key=lambda q: q["area"])
    if r is not body and r["frac"] < 0.05:
        sl = body["sl"]
        cy = r["sl"][0].start + r["h"] / 2
        cx = r["sl"][1].start + r["w"] / 2
        if sl[0].start < cy < sl[0].stop and sl[1].start < cx < sl[1].stop:
            return None                               # eye whites
    return YELLOW


def bags(r, regs):
    if r["ry"] > 0.7 and r["frac"] < 0.03:
        return TAN                                    # dust
    return IVORY


def observatory(r, regs):
    if r["rx"] > 0.68 and r["ry"] < 0.4 and r["frac"] < 0.06:
        return YELLOW                                 # the burst of light leaving the telescope
    if r["frac"] < 0.004:
        return None                                   # eyes and small details
    if r["ry"] < 0.52:
        return "#d8dade"                              # the dome and the telescope
    return CREAM                                      # the round building


def probe(r, regs):
    dish = max(regs, key=lambda q: q["area"])
    if r is dish:
        return CREAM                                  # the big dish
    if (r["rx"] < 0.08 or r["rx"] > 0.72 or r["ry"] < 0.12 or r["ry"] > 0.92) and r["frac"] < 0.08:
        return "#9a8670"                              # flying rocks
    sl = dish["sl"]
    cy = r["sl"][0].start + r["h"] / 2
    cx = r["sl"][1].start + r["w"] / 2
    if r["frac"] < 0.03 and sl[0].start < cy < sl[0].stop and sl[1].start < cx < sl[1].stop:
        return None                                   # eyes on the dish
    if r["frac"] > 0.015:
        return GOLD                                   # the small body
    return STEEL                                      # booms


def probe_plain(r, regs):
    """Pioneer 10: only the big dish gets colour (cream); eyes, gloves, booms and the small body stay white,
    so every sheet of the probe looks the same."""
    dish = max(regs, key=lambda q: q["area"])
    return CREAM if r is dish else None


def probe_rocks(r, regs):
    """Pioneer 10 among the asteroids: the dish is cream and the loose round rocks far from it are brown."""
    dish = max(regs, key=lambda q: q["area"])
    if r is dish:
        return CREAM
    dx, dy = r["cx"] - dish["cx"], r["cy"] - dish["cy"]
    d = (dx * dx + dy * dy) ** 0.5 / max(dish["w"], dish["h"])
    if dx < 0 and dy > 0 and d < 0.85:
        return None                                   # the small body, below and to the left of the dish
    if d > 0.5 and r["frac"] > 0.008 and r["fill"] > 0.55:
        return "#9a8670"
    return None


RULES = {"R1_rover_avanza": rover, "R2_rover_despliega": rover, "R5_rover_tormenta": rover, "R6_rover_sacude": rover,
         "E2_espejo_despierta": mirror, "F1_foton_vuela": photon, "O2_bolsas_rebotan": bags,
         "E7_espejo_atrapa": mirror, "E6_espejo_cuenta": mirror, "E9_espejo_secreto": mirror, "E5_espejo_anios": mirror, "E3_espejo_saluda": mirror, "E11_espejo_mira_lejos": mirror, "E12_espejo_habla": mirror, "E13_espejo_gestos": mirror, "E14_espejo_escucha": mirror, "E2_espejo_despierta_brazos": mirror, "R3_rover_mira_sol": rover, "R8_rover_celebra": rover, "R10_rover_saluda": rover, "P1_sonda_despliega": probe_plain, "P3_sonda_jupiter": probe_plain, "P4_sonda_llama": probe_plain, "R4_rover_excava": rover,
         "R7_rover_ultimos_dias": rover, "P2_sonda_esquiva": probe_rocks, "P5_sonda_se_apaga": probe_plain}

ONLY = None   # set from the command line to colour just some sets

if __name__ == "__main__":
    import sys
    only = set(sys.argv[1:])
    for name, rule in RULES.items():
        if only and name not in only:
            continue
        d = os.path.join(WEB, "assets", "sprites", name)
        for f in sorted(glob.glob(os.path.join(d, "*.png"))):
            a = np.asarray(Image.open(f).convert("RGBA"))
            lab, regs, gray = regions(a)
            if regs:
                Image.fromarray(paint(a, lab, regs, gray, rule), "RGBA").save(f, optimize=True)
        print("coloured", name)
