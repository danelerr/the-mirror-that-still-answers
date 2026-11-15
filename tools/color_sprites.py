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
                        w=w, h=h, fill=area / max(1, w * h)))
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
    face = max((q for q in regs if 0.3 < q["rx"] < 0.7 and 0.2 < q["ry"] < 0.75), key=lambda q: q["area"], default=None)
    if r["rx"] < 0.17 or r["rx"] > 0.83:
        return None                                   # the gloves stay white
    if r["ry"] > 0.86:
        return GRAY                                   # the frame it stands on
    if face is not None and r is face:
        return CREAM                                  # the face window
    if r["frac"] < 0.004:
        if face is not None:
            sl = face["sl"]
            cy = r["sl"][0].start + r["h"] / 2
            cx = r["sl"][1].start + r["w"] / 2
            if sl[0].start < cy < sl[0].stop and sl[1].start < cx < sl[1].stop:
                return None                           # eyes and teeth inside the face
        return GLASS                                  # the round reflectors
    return GOLD                                       # the tray


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
    """Pioneer 10 without flying rocks: only the dish (cream) and the small body (gold) get colour;
    gloves, eyes and booms stay white, so no glove or eye is painted by mistake."""
    dish = max(regs, key=lambda q: q["area"])
    if r is dish:
        return CREAM
    sl = dish["sl"]

    def inside(q):
        cy = q["sl"][0].start + q["h"] / 2
        cx = q["sl"][1].start + q["w"] / 2
        return sl[0].start < cy < sl[0].stop and sl[1].start < cx < sl[1].stop
    if inside(r):
        return None
    rest = sorted((q for q in regs if q is not dish and not inside(q)), key=lambda q: -q["area"])
    if rest and r is rest[0] and r["frac"] > 0.01 and r["fill"] > 0.6 and r["ry"] > 0.45:
        return GOLD
    return None


RULES = {"R1_rover_avanza": rover, "R2_rover_despliega": rover, "R5_rover_tormenta": rover, "R6_rover_sacude": rover,
         "E2_espejo_despierta": mirror, "F1_foton_vuela": photon, "O2_bolsas_rebotan": bags,
         "E7_espejo_atrapa": mirror, "E6_espejo_cuenta": mirror, "E9_espejo_secreto": mirror, "E5_espejo_anios": mirror, "E3_espejo_saluda": mirror, "E11_espejo_mira_lejos": mirror, "E12_espejo_habla": mirror, "E13_espejo_gestos": mirror, "E2_espejo_despierta_brazos": mirror, "R3_rover_mira_sol": rover, "R8_rover_celebra": rover, "P1_sonda_despliega": probe_plain, "P3_sonda_jupiter": probe_plain, "P4_sonda_llama": probe_plain, "R4_rover_excava": rover,
         "R7_rover_ultimos_dias": rover, "P2_sonda_esquiva": probe, "P5_sonda_se_apaga": probe}

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
