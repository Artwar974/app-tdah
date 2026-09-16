from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / "tools" / "map-editor" / ".audit" / "camp-video"


def main() -> None:
    images = [Image.open(FRAMES / f"frame-{index}.png").convert("RGB") for index in range(5)]
    stack = np.stack([np.asarray(image, dtype=np.int16) for image in images], axis=0)
    channel_range = stack.max(axis=0) - stack.min(axis=0)
    motion = channel_range.max(axis=2).astype(np.uint8)
    Image.fromarray(motion, "L").save(FRAMES / "motion-raw.png")

    # A light blur absorbs compression grain without closing the narrow gaps
    # around moving branches and wave tips.
    smooth = Image.fromarray(motion, "L").filter(ImageFilter.GaussianBlur(1.15))
    smooth.save(FRAMES / "motion-smooth.png")
    for threshold in (3, 6, 10, 16, 24):
        mask = smooth.point(lambda value, limit=threshold: 255 if value >= limit else 0)
        mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.4))
        mask.save(FRAMES / f"motion-mask-{threshold}.png")

    # False-colour heatmap: red/yellow = strong motion, dark blue = stable.
    normalized = np.clip(motion.astype(np.float32) / 32.0, 0, 1)
    heat = np.zeros((*motion.shape, 3), dtype=np.uint8)
    heat[..., 0] = np.clip(normalized * 510, 0, 255).astype(np.uint8)
    heat[..., 1] = np.clip((normalized - .45) * 420, 0, 255).astype(np.uint8)
    heat[..., 2] = np.clip((1 - normalized) * 90, 0, 255).astype(np.uint8)
    Image.fromarray(heat, "RGB").save(FRAMES / "motion-heatmap.png")

    print({
        "max_motion": int(motion.max()),
        "mean_motion": round(float(motion.mean()), 3),
        "pixels_gt_6": round(float((motion >= 6).mean()), 4),
        "pixels_gt_16": round(float((motion >= 16).mean()), 4),
    })


if __name__ == "__main__":
    main()
