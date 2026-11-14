"""Prepares the character illustrations for animation.

Input:  dibujos/*.png  (illustrations made with an AI image generator, white background)
Output: web/assets/art/*.png  (transparent background, separate pieces, flat colour)

What it does:
  1. Removes the outer white background and keeps the inside of each figure.
  2. Paints the inner areas with flat colours, chosen by size and position.
  3. Crops the loose pieces (eyes, brows, mouths, arms) from the part sheets.

Usage: python web/tools/cut_art.py   (from the project folder)

Written with an AI coding assistant, directed and reviewed by team Unsigned Int.
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "dibujos")
OUT = os.path.join(ROOT, "web", "assets", "art")
os.makedirs(OUT, exist_ok=True)

WHITE = 200  # a partir de este gris se considera papel


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=float)


def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert("RGB")).astype(float)


def regions(rgb):
    """Devuelve (gris, máscara de fondo exterior, etiquetas de zonas blancas interiores)."""
    gray = rgb.mean(axis=2)
    white = gray >= WHITE
    lab, n = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border.discard(0)
    bg = np.isin(lab, list(border))
    inner = np.where(bg, 0, lab)
    return gray, bg, inner


def paint(rgb, gray, inner, rule):
    """Pinta cada zona interior con el color que devuelva rule(área, cx, cy, ancho)."""
    out = rgb.copy()
    ids = [i for i in np.unique(inner) if i != 0]
    if not ids:
        return out
    areas = ndimage.sum(np.ones_like(inner), inner, ids)
    cents = ndimage.center_of_mass(np.ones_like(inner), inner, ids)
    boxes = ndimage.find_objects(inner)
    for i, area, (cy, cx) in zip(ids, areas, cents):
        width = boxes[i - 1][1].stop - boxes[i - 1][1].start
        color = rule(area, cx, cy, width)
        if color is None:
            continue
        zone = ndimage.binary_dilation(inner == i, iterations=2)
        shade = (gray[zone] / 255.0)[:, None]  # conserva el suavizado del trazo
        out[zone] = hex_rgb(color) * shade
    return out


def cut_out(rgb, gray, bg):
    """Hace transparente el fondo exterior, con borde suave sobre el trazo negro."""
    alpha = np.where(bg, 0, 255).astype(float)
    near = ndimage.binary_dilation(bg, iterations=2) & ~bg
    alpha[near] = np.clip((255 - gray[near]) * 1.7, 0, 255)
    out = rgb.copy()
    out[near] = 0
    return np.dstack([out, alpha]).clip(0, 255).astype(np.uint8)


def save(rgba, name, box=None):
    im = Image.fromarray(rgba, "RGBA")
    if box:
        im = im.crop(box)
    if box:
        a = np.asarray(im.getchannel("A")) > 16
        lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=6))
        if n > 1:
            sizes = ndimage.sum(a, lab, range(1, n + 1))
            keep = np.isin(lab, [k + 1 for k, s in enumerate(sizes) if s >= 0.12 * sizes.max()])
            arr = np.asarray(im).copy()
            arr[~keep] = 0
            im = Image.fromarray(arr, "RGBA")
    bb = im.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox()
    if bb:
        im = im.crop((max(bb[0] - 4, 0), max(bb[1] - 4, 0), bb[2] + 4, bb[3] + 4))
    im.save(os.path.join(OUT, name))
    return im.size


def whole(src, dst, rule):
    rgb = load(src)
    gray, bg, inner = regions(rgb)
    rgb = paint(rgb, gray, inner, rule)
    print(dst, save(cut_out(rgb, gray, bg), dst))


def parts(src, prefix, boxes, rule=None):
    rgb = load(src)
    gray, bg, inner = regions(rgb)
    if rule:
        rgb = paint(rgb, gray, inner, rule)
    rgba = cut_out(rgb, gray, bg)
    for name, box in boxes.items():
        print(f"{prefix}_{name}.png", save(rgba, f"{prefix}_{name}.png", box))


# ---------- Paleta apagada, tipo dibujo animado antiguo ----------
CREAM = "#fbf3dc"
GOLD = "#f2d27c"
GLASS = "#bfe3ee"
GRAY = "#cfc8b8"
RUST = "#d98a5f"
BLUE = "#7fa8c9"
STEEL = "#dfe3e6"


def espejo(area, cx, cy, width):
    if area < 2600:
        return GLASS            # los reflectores
    if 380 < cx < 700 and 330 < cy < 580 and area > 50000:
        return CREAM if width < 500 else "#f7e6ae"  # la ventana de la cara / el panel de reflectores
    if cy > 700:
        return GRAY             # la base
    return GOLD                 # la bandeja


def rover(area, cx, cy, width):
    if cy < 300 and cx > 520:
        return STEEL            # la antena
    if cy < 520 and area > 1200:
        return BLUE if area < 12000 else "#9db9cf"  # los paneles solares
    if cy > 520 and area < 9000:
        return GRAY             # ruedas y suspensión
    return GOLD                 # el cuerpo


def sonda(area, cx, cy, width):
    if area > 150000:
        return CREAM            # el plato
    if cx < 360 and 650 < cy < 900 and area > 20000:
        return GOLD             # la placa
    return STEEL


def piezas_metal(area, cx, cy, width):
    if cy > 760:
        return None             # los ojos se quedan blancos
    return STEEL if area > 400 else None


whole("espejo_cuerpo.png", "espejo_cuerpo.png", espejo)
whole("rover_cuerpo_v2.png", "rover_cuerpo.png", rover)  # la versión con paneles en forma de ala
whole("sonda_cuerpo.png", "sonda_cuerpo.png", sonda)

parts("espejo_cara.png", "espejo", {
    "ojos_abiertos": (70, 60, 450, 310),
    "ojos_cerrados": (540, 160, 975, 250),
    "ojos_medio": (55, 370, 465, 595),
    "cejas": (540, 430, 975, 525),
    "boca_cerrada": (45, 775, 255, 828),
    "boca_poco": (290, 765, 368, 860),
    "boca_abierta": (400, 755, 612, 880),
    "boca_oh": (635, 732, 750, 874),
    "boca_sonrisa": (775, 772, 985, 852),
})

parts("rover_partes.png", "rover", {
    "mastil": (80, 70, 440, 735),
    "brazo": (530, 90, 950, 625),
    "ojos_abiertos": (55, 795, 310, 945),
    "ojos_cerrados": (380, 840, 655, 905),
    "ojos_medio": (710, 795, 970, 945),
}, piezas_metal)

parts("sonda_partes.png", "sonda", {
    "brazo_largo": (40, 55, 450, 720),
    "brazo_a": (415, 150, 705, 705),
    "brazo_b": (690, 150, 975, 705),
    "ojos_abiertos": (45, 790, 305, 950),
    "ojos_cerrados": (385, 815, 645, 925),
    "ojos_medio": (710, 795, 985, 945),
}, piezas_metal)


# ---------- Segunda tanda: fotones, Sol y polvo, observatorio, carta, marco ----------
SUN = "#ffd866"
RAY = "#ffb84d"
DUST = "#dcb38a"
PHOTON = "#fff3a6"
SEAL = "#c8553d"


def fotones(area, cx, cy, width):
    return PHOTON if area > 5000 else None      # solo la bola; ojos y puntas quedan blancos


def sol_polvo(area, cx, cy, width):
    if cx < 500 and cy < 500:
        return SUN if area > 20000 else RAY
    return DUST


def observatorio(area, cx, cy, width):
    if area < 3500:
        return GLASS
    return STEEL if cy < 470 else CREAM


def carta(area, cx, cy, width):
    if 520 < cx < 690 and 500 < cy < 680 and area < 12000:
        return SEAL
    if cx < 300 or cx > 790:
        return None                              # las alas quedan blancas
    return CREAM


parts("fotones.png", "foton", {
    "rapido": (190, 130, 430, 395),
    "decidido": (665, 135, 955, 420),
    "cansado": (375, 378, 650, 648),
    "feliz": (85, 583, 370, 872),
    "dormido": (665, 583, 955, 872),
}, fotones)

parts("sol_polvo.png", "cielo", {
    "sol": (35, 35, 495, 485),
    "nube_a": (550, 40, 990, 370),
    "nube_b": (145, 515, 390, 725),
    "nube_c": (550, 405, 990, 730),
    "tormenta": (35, 750, 990, 990),
}, sol_polvo)

whole("observatorio.png", "observatorio.png", observatorio)
whole("carta.png", "carta.png", carta)

# El marco de los carteles: líneas color papel sobre fondo transparente
frame = np.asarray(Image.open(os.path.join(SRC, "marco_cartel.png")).convert("L")).astype(float)
rgba = np.zeros(frame.shape + (4,), dtype=np.uint8)
rgba[..., :3] = hex_rgb("#f4ecd8").astype(np.uint8)
rgba[..., 3] = (255 - frame).clip(0, 255).astype(np.uint8)
Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, "marco_cartel.png"))
print("marco_cartel.png", rgba.shape[1::-1])
