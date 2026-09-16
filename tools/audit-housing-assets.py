from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageStat


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "housing"
OUTPUT = ROOT / "tools" / "map-editor" / ".audit"

FILES = [
    ("Tente I", "tente1.webp"),
    ("Tente II", "tente2.webp"),
    ("Tente III", "tente3.webp"),
    ("Tente IV", "tente4.webp"),
    ("Kiosque", "kiosque.webp"),
    ("Autel", "autel_athena.webp"),
    ("Feu", "feu-preview-v2.webp"),
    ("Flambeau", "flambeau-preview.webp"),
    ("Fontaine", "fontaine-preview.webp"),
    ("Olivier", "arbuste.webp"),
    ("Armes", "armes.webp"),
    ("Lopin fleuri", "lopin-fleurs.webp"),
    ("Table", "table.webp"),
    ("Table carrée", "table-carree.webp"),
    ("Banc", "banc.webp"),
    ("Potager — étalon", "potager.webp"),
]


def metrics(path: Path) -> dict[str, object]:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError(f"Asset vide: {path}")
    opaque = image.crop(bbox)
    opaque_alpha = alpha.crop(bbox)
    rgb = Image.new("RGB", opaque.size, "white")
    rgb.paste(opaque.convert("RGB"), mask=opaque_alpha)
    hsv = rgb.convert("HSV")
    stat = ImageStat.Stat(hsv, mask=opaque_alpha)
    width, height = image.size
    left, top, right, bottom = bbox
    return {
        "file": path.name,
        "canvas": [width, height],
        "alpha_bbox": list(bbox),
        "aspect": round(width / height, 4),
        "anchor_bottom_ratio": round(bottom / height, 4),
        "transparent_margin": {
            "left": round(left / width, 4),
            "top": round(top / height, 4),
            "right": round((width - right) / width, 4),
            "bottom": round((height - bottom) / height, 4),
        },
        "mean_saturation": round(stat.mean[1] / 255, 4),
        "mean_value": round(stat.mean[2] / 255, 4),
    }


def thumbnail(path: Path, size: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox:
        image = image.crop(bbox)
    return ImageOps.contain(image, size, Image.Resampling.LANCZOS)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    cell_w, cell_h = 280, 300
    cols = 4
    rows = (len(FILES) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "#e7ded3")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=16)
    data = []

    for index, (label, filename) in enumerate(FILES):
        path = ASSETS / filename
        info = metrics(path)
        info["label"] = label
        data.append(info)
        x = (index % cols) * cell_w
        y = (index // cols) * cell_h
        draw.rounded_rectangle((x + 7, y + 7, x + cell_w - 7, y + cell_h - 7), 16, fill="#f6f0e8", outline="#b9a99c", width=2)
        thumb = thumbnail(path, (236, 236))
        px = x + (cell_w - thumb.width) // 2
        py = y + 14 + (236 - thumb.height) // 2
        sheet.paste(thumb, (px, py), thumb)
        draw.text((x + 14, y + 258), label, fill="#2f2740", font=font)
        draw.text((x + 14, y + 279), f"{info['canvas'][0]}×{info['canvas'][1]}  base {info['anchor_bottom_ratio']}", fill="#6f6070", font=font)

    sheet.save(OUTPUT / "housing-v43-contact-sheet.png", optimize=True)
    (OUTPUT / "housing-v43-metrics.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
