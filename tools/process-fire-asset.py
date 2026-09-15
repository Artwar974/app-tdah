#!/usr/bin/env python3
"""Remove a connected black matte from every fire frame and double playback speed."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageSequence


def remove_black_matte(frame: Image.Image) -> Image.Image:
    image = frame.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    connected = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        r, g, b, _ = pixels[x, y]
        index = y * width + x
        if connected[index] or max(r, g, b) > 18:
            return
        connected[index] = 1
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

    # Capture the few anti-aliased pixels touching the connected black matte,
    # without entering the dark details enclosed inside the logs and stones.
    fringe = connected
    for _ in range(4):
        expanded = bytearray(fringe)
        for y in range(1, height - 1):
            row = y * width
            for x in range(1, width - 1):
                index = row + x
                if fringe[index]:
                    continue
                if not (fringe[index - 1] or fringe[index + 1] or fringe[index - width] or fringe[index + width]):
                    continue
                r, g, b, _ = pixels[x, y]
                if max(r, g, b) <= 92:
                    expanded[index] = 1
        fringe = expanded

    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    target = output.load()
    for y in range(height):
        for x in range(width):
            r, g, b, source_alpha = pixels[x, y]
            index = y * width + x
            if not fringe[index]:
                target[x, y] = (r, g, b, source_alpha)
                continue
            maximum = max(r, g, b)
            alpha = max(0, min(255, round((maximum - 10) / 82 * 255)))
            if alpha == 0:
                target[x, y] = (0, 0, 0, 0)
                continue
            # Undo black premultiplication on the translucent edge.
            target[x, y] = tuple(min(255, round(channel * 255 / alpha)) for channel in (r, g, b)) + (alpha,)
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("preview", type=Path)
    parser.add_argument("--duration", type=int, default=50, help="Milliseconds per frame")
    args = parser.parse_args()

    source = Image.open(args.source)
    frames = [remove_black_matte(frame) for frame in ImageSequence.Iterator(source)]
    if not frames:
        raise RuntimeError("Le GIF ne contient aucune frame")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.suffix.lower() == ".gif":
        gif_frames = []
        for frame in frames:
            alpha = frame.getchannel("A")
            palette = frame.convert("RGB").quantize(colors=255, method=Image.Quantize.MEDIANCUT)
            palette.paste(255, mask=alpha.point(lambda value: 255 if value < 96 else 0))
            palette.info["transparency"] = 255
            gif_frames.append(palette)
        # GIF delays are stored in centiseconds. Alternate the surrounding
        # values for half-centisecond requests (25 ms -> 20/30 ms) so the
        # complete loop keeps the exact requested average cadence.
        duration: int | list[int] = args.duration
        if args.duration % 10 == 5:
            lower = args.duration - 5
            upper = args.duration + 5
            duration = [lower if index % 2 == 0 else upper for index in range(len(gif_frames))]
        gif_frames[0].save(
            args.output,
            format="GIF",
            save_all=True,
            append_images=gif_frames[1:],
            duration=duration,
            loop=0,
            transparency=255,
            disposal=2,
            optimize=False,
        )
    else:
        frames[0].save(
            args.output,
            format="WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=args.duration,
            loop=0,
            lossless=True,
            method=6,
        )
    frames[0].save(args.preview, format="WEBP", lossless=True, method=6)
    print(f"{len(frames)} frames · {args.duration} ms · {args.output}")


if __name__ == "__main__":
    main()
