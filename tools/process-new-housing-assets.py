#!/usr/bin/env python3
"""Prepare the second housing asset set without regenerating its artwork."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageSequence


SOURCE = Path(r"C:/Users/berri/Desktop/APPLI/ASSETS")
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "housing"


def remove_connected_white(frame: Image.Image) -> Image.Image:
    """Remove only near-white pixels connected to the canvas boundary."""
    image = frame.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    outside = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_matte(x: int, y: int) -> bool:
        r, g, b, alpha = pixels[x, y]
        return alpha > 0 and min(r, g, b) >= 244 and max(r, g, b) - min(r, g, b) <= 12

    def seed(x: int, y: int) -> None:
        index = y * width + x
        if outside[index] or not is_matte(x, y):
            return
        outside[index] = 1
        queue.append((x, y))

    for x in range(width):
        seed(x, 0)
        seed(x, height - 1)
    for y in range(height):
        seed(0, y)
        seed(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                seed(nx, ny)

    output = image.copy()
    target = output.load()
    for y in range(height):
        for x in range(width):
            if outside[y * width + x]:
                target[x, y] = (0, 0, 0, 0)
    return output


def discard_tiny_components(image: Image.Image, alpha_floor: int = 24) -> Image.Image:
    """Drop invisible colour-noise and isolated export specks around the artwork."""
    output = image.convert("RGBA")
    width, height = output.size
    pixels = output.load()
    seen = bytearray(width * height)
    components: list[list[tuple[int, int]]] = []

    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or pixels[x, y][3] < alpha_floor:
                continue
            seen[index] = 1
            queue: deque[tuple[int, int]] = deque([(x, y)])
            component: list[tuple[int, int]] = []
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if not (0 <= nx < width and 0 <= ny < height):
                        continue
                    neighbour = ny * width + nx
                    if seen[neighbour] or pixels[nx, ny][3] < alpha_floor:
                        continue
                    seen[neighbour] = 1
                    queue.append((nx, ny))
            components.append(component)

    keep = max(components, key=len, default=[])
    keep_mask = bytearray(width * height)
    for x, y in keep:
        keep_mask[y * width + x] = 1
    for y in range(height):
        for x in range(width):
            if not keep_mask[y * width + x]:
                pixels[x, y] = (0, 0, 0, 0)
    return output


def save_transparent_gif(frames: list[Image.Image], output: Path, duration: int) -> None:
    paletted = []
    for frame in frames:
        alpha = frame.getchannel("A")
        palette = frame.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT)
        palette.paste(255, mask=alpha.point(lambda value: 255 if value < 96 else 0))
        palette.info["transparency"] = 255
        paletted.append(palette)
    paletted[0].save(
        output,
        format="GIF",
        save_all=True,
        append_images=paletted[1:],
        duration=duration,
        loop=0,
        transparency=255,
        disposal=2,
        optimize=False,
    )


def process_gif(source_name: str, output_name: str, preview_name: str, duration: int, clean_white: bool) -> None:
    source = Image.open(SOURCE / source_name)
    frames = [frame.convert("RGBA") for frame in ImageSequence.Iterator(source)]
    if clean_white:
        frames = [discard_tiny_components(remove_connected_white(frame), 1) for frame in frames]
    save_transparent_gif(frames, OUTPUT / output_name, duration)
    frames[0].save(OUTPUT / preview_name, format="WEBP", lossless=True, method=6)
    print(f"{source_name}: {len(frames)} frames, {duration} ms")


def process_static(source_name: str, output_name: str) -> None:
    image = discard_tiny_components(Image.open(SOURCE / source_name).convert("RGBA"))
    image.save(OUTPUT / output_name, format="WEBP", lossless=True, method=6)
    print(f"{source_name}: {image.size[0]}x{image.size[1]}")


def process_static_preserve(source_name: str, output_name: str) -> None:
    """Convert an already transparent PNG without dropping detached ornaments."""
    image = Image.open(SOURCE / source_name).convert("RGBA")
    image.save(OUTPUT / output_name, format="WEBP", lossless=True, method=6)
    print(f"{source_name}: {image.size[0]}x{image.size[1]} (all components preserved)")


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    process_gif("Flambeau1.gif", "flambeau-anime-x2.gif", "flambeau-preview.webp", 50, False)
    process_gif("fontaine_anime.gif", "fontaine-anime.gif", "fontaine-preview.webp", 100, True)
    process_static_preserve("arbuste.png", "arbuste.webp")
    process_static_preserve("armes.png", "armes.webp")
    process_static_preserve("autel_athena.png", "autel_athena.webp")
    process_static_preserve("banc.png", "banc.webp")
    process_static_preserve("lopin_fleurs.png", "lopin-fleurs.webp")
    process_static_preserve("potager.png", "potager.webp")
    process_static_preserve("table.png", "table.webp")
    process_static_preserve("table_carré.png", "table-carree.webp")
    process_static_preserve("kiosque.png", "kiosque.webp")


if __name__ == "__main__":
    main()
