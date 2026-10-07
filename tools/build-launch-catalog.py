from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "ressources-sources" / "housing-launch-catalog-source.png"
OUTPUT = ROOT / "assets" / "housing" / "launch"
PREVIEW = ROOT / "exports" / "housing-launch-catalog-preview.png"


# The sheet is intentionally split into useful scene-scale clusters rather than
# every cup or cushion. Coordinates are pixel rectangles on the 1536 x 1024
# source sheet, with enough empty border to recover a clean alpha matte.
ASSETS = {
    "atelier-marche": (350, 12, 620, 250),
    "pergola-fleurie": (600, 20, 875, 265),
    "salon-voile": (855, 35, 1075, 250),
    "cuisine-cheminee": (1040, 0, 1325, 270),
    "rotonde": (1310, 0, 1536, 275),
    "etal-fruits": (0, 235, 215, 445),
    "sechoir-herbes": (205, 245, 425, 455),
    "etendoir-linge": (410, 250, 605, 455),
    "puits": (565, 245, 725, 445),
    "etabli-ombrage": (690, 250, 935, 455),
    "atelier-textile": (990, 245, 1160, 455),
    "armurerie": (1120, 240, 1340, 455),
    "chariot-marchand": (1310, 245, 1536, 455),
    "table-repas": (10, 430, 255, 585),
    "salon-tapis": (255, 445, 545, 575),
    "salon-coussins": (565, 450, 710, 570),
    "lit": (710, 430, 930, 585),
    "coffre-bleu": (920, 455, 1005, 555),
    "coffre-bois": (990, 430, 1080, 525),
    "ecritoire": (1065, 420, 1220, 555),
    "banc-long": (1200, 435, 1360, 555),
    "banc-court": (1340, 440, 1445, 560),
    "caisse": (1420, 425, 1536, 555),
    "buches": (1095, 505, 1200, 585),
    "rouleaux": (1190, 525, 1315, 605),
    "tapis-carre": (455, 535, 630, 625),
    "couchage-roule": (640, 530, 825, 625),
    "lanternes": (0, 545, 165, 710),
    "torche-simple": (165, 545, 245, 710),
    "brasero": (240, 545, 355, 715),
    "brasero-bas": (485, 620, 555, 715),
    "marmite-trepied": (580, 580, 695, 715),
    "tabouret-livre": (690, 615, 785, 710),
    "siege-lecture": (800, 600, 905, 710),
    "paravent-lin": (895, 545, 1025, 705),
    "linge-clair": (1010, 550, 1140, 710),
    "banniere-trident": (1140, 565, 1230, 710),
    "tissus-sechoir": (1230, 565, 1365, 715),
    "drapeaux": (1370, 560, 1536, 715),
    "olivier-pot": (0, 680, 115, 865),
    "arbuste-pot": (95, 690, 200, 865),
    "buissons": (170, 690, 350, 865),
    "jardiniere-rose": (335, 690, 460, 865),
    "buisson-fruitier": (455, 720, 560, 865),
    "pots-herbes": (550, 690, 705, 865),
    "bosquet-cypres": (700, 700, 830, 875),
    "oliviers": (835, 700, 1035, 880),
    "arbre-rose": (1035, 705, 1150, 880),
    "arbre-feuillu": (1150, 705, 1280, 880),
    "arbuste-feuillu": (1270, 720, 1375, 865),
    "bac-fleurs": (1350, 705, 1530, 875),
    "statue-victoire": (15, 825, 120, 1024),
    "statue-philosophe": (110, 825, 235, 1024),
    "buste": (240, 825, 315, 1024),
    "sphinx": (305, 825, 440, 1024),
    "colonnes-brisees": (440, 850, 590, 1024),
    "colonne-lierre": (585, 860, 675, 1024),
    "colonne": (655, 860, 740, 1024),
    "ruines-lierre": (725, 860, 880, 1024),
    "rocher-majeur": (885, 875, 1025, 1024),
    "rochers-doubles": (1020, 875, 1155, 1024),
    "rochers-bosquet": (1135, 875, 1280, 1024),
    "blocs-vegetalises": (1295, 875, 1430, 1024),
    "blocs-pierre": (1415, 875, 1536, 1024),
}

MULTI_COMPONENTS = {
    "table-repas": 2,
    "salon-tapis": 2,
    "salon-coussins": 2,
    "coffre-bleu": 1,
    "coffre-bois": 1,
    "lanternes": 2,
    "tissus-sechoir": 1,
    "drapeaux": 1,
    "pots-herbes": 3,
    "bosquet-cypres": 1,
    "oliviers": 2,
    "colonnes-brisees": 3,
    "rochers-doubles": 2,
    "rochers-bosquet": 2,
    "blocs-vegetalises": 3,
    "blocs-pierre": 3,
}


def fit_background(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    yy, xx = np.mgrid[0:h, 0:w]
    x = xx / max(w - 1, 1)
    y = yy / max(h - 1, 1)
    basis = np.stack((np.ones_like(x), x, y, x * x, y * y, x * y), axis=-1)
    border = np.zeros((h, w), dtype=bool)
    band = max(4, min(h, w) // 18)
    border[:band] = True
    border[-band:] = True
    border[:, :band] = True
    border[:, -band:] = True
    a = basis[border]
    prediction = np.empty_like(rgb, dtype=np.float32)
    for channel in range(3):
        coeff, *_ = np.linalg.lstsq(a, rgb[..., channel][border], rcond=None)
        prediction[..., channel] = basis @ coeff
    return np.clip(prediction, 0, 255)


def keep_components(mask: np.ndarray, min_area: int, amount: int) -> np.ndarray:
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    components = []
    for sy in range(h):
        for sx in range(w):
            if not mask[sy, sx] or seen[sy, sx]:
                continue
            queue = deque([(sx, sy)])
            seen[sy, sx] = True
            points = []
            while queue:
                x, y = queue.popleft()
                points.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((nx, ny))
            if len(points) >= min_area:
                center_x = sum(point[0] for point in points) / len(points)
                center_y = sum(point[1] for point in points) / len(points)
                distance = ((center_x / w - .5) ** 2 + (center_y / h - .5) ** 2) ** .5
                rank = len(points) ** .62 / (.12 + distance)
                components.append((rank, points))
    kept = np.zeros_like(mask, dtype=bool)
    for _, points in sorted(components, reverse=True, key=lambda item: item[0])[:amount]:
        for x, y in points:
            kept[y, x] = True
    return kept


def cutout(sheet: Image.Image, name: str, box: tuple[int, int, int, int]) -> Image.Image:
    crop = sheet.crop(box).convert("RGBA")
    rgba = np.asarray(crop).copy()
    rgb = rgba[..., :3].astype(np.float32)
    background = fit_background(rgb)

    # Weighted difference rejects the broad warm background while retaining
    # pale marble and dark wood. A local-detail term restores fine leaves,
    # ropes, and thin columns that are close in colour to the backdrop.
    delta = np.sqrt(np.sum((rgb - background) ** 2, axis=2))
    blurred = np.asarray(crop.convert("RGB").filter(ImageFilter.GaussianBlur(5))).astype(np.float32)
    detail = np.sqrt(np.sum((rgb - blurred) ** 2, axis=2))
    score = delta + detail * 1.35

    core_seed = score > 58
    core_seed[:4] = False
    core_seed[-4:] = False
    core_seed[:, :4] = False
    core_seed[:, -4:] = False
    core = keep_components(
        core_seed,
        max(14, crop.width * crop.height // 7500),
        MULTI_COMPONENTS.get(name, 1),
    )
    core_image = Image.fromarray((core * 255).astype(np.uint8), "L")
    core_image = core_image.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(5))
    support = np.asarray(core_image).astype(np.float32) / 255
    alpha = np.clip((score - 10) / 22, 0, 1) * support
    alpha = Image.fromarray((alpha * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(.65))
    rgba[..., 3] = np.minimum(np.asarray(alpha), rgba[..., 3])
    result = Image.fromarray(rgba, "RGBA")

    bbox = result.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError(f"No foreground recovered from {box}")
    pad = 4
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(result.width, bbox[2] + pad)
    bottom = min(result.height, bbox[3] + pad)
    return result.crop((left, top, right, bottom))


def make_preview(images: dict[str, Image.Image]) -> None:
    cell_w, cell_h = 190, 170
    columns = 6
    rows = (len(images) + columns - 1) // columns
    preview = Image.new("RGB", (columns * cell_w, rows * cell_h), "#ddd2c3")
    draw = ImageDraw.Draw(preview)
    font = ImageFont.load_default()
    for index, (name, image) in enumerate(images.items()):
        x = index % columns * cell_w
        y = index // columns * cell_h
        checker = Image.new("RGB", (cell_w - 10, cell_h - 28), "#e9e2d7")
        tile = Image.new("RGBA", checker.size, (0, 0, 0, 0))
        sample = image.copy()
        sample.thumbnail((checker.width - 8, checker.height - 8), Image.Resampling.LANCZOS)
        tile.alpha_composite(sample, ((tile.width - sample.width) // 2, tile.height - sample.height - 4))
        checker.paste(tile, (0, 0), tile)
        preview.paste(checker, (x + 5, y + 5))
        draw.text((x + 7, y + cell_h - 20), name, fill="#30282a", font=font)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW, optimize=True)


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGBA")
    if sheet.size != (1536, 1024):
        raise RuntimeError(f"Unexpected source size: {sheet.size}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    built: dict[str, Image.Image] = {}
    for name, box in ASSETS.items():
        image = cutout(sheet, name, box)
        image.save(OUTPUT / f"{name}.webp", "WEBP", quality=92, method=6)
        built[name] = image
        print(f"{name}: {image.width}x{image.height}")
    make_preview(built)
    print(f"Preview: {PREVIEW}")


if __name__ == "__main__":
    main()
