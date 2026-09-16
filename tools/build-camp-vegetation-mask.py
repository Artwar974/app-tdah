from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "tools" / "map-editor" / ".audit" / "camp-video"
OUTPUT = ROOT / "assets" / "CAMP_VIDEO_VEGETATION_MASK.png"


def max_filter(mask: np.ndarray, size: int) -> np.ndarray:
    image = Image.fromarray((mask.astype(np.uint8) * 255), "L")
    return np.asarray(image.filter(ImageFilter.MaxFilter(size))) > 0


def min_filter(mask: np.ndarray, size: int) -> np.ndarray:
    image = Image.fromarray((mask.astype(np.uint8) * 255), "L")
    return np.asarray(image.filter(ImageFilter.MinFilter(size))) > 0


frames = np.stack([
    np.asarray(Image.open(AUDIT / f"frame-{index}.png").convert("RGB"), dtype=np.int16)
    for index in range(6)
])

motion = (frames.max(axis=0) - frames.min(axis=0)).max(axis=2)
rgb = frames.astype(np.float32)
r = rgb[..., 0]
g = rgb[..., 1]
b = rgb[..., 2]
maximum = rgb.max(axis=3)
minimum = rgb.min(axis=3)
saturation = (maximum - minimum) / np.maximum(maximum, 1)

# Colour is used only to reject moving compression contours on pale stone.  The
# two families cover blue-green cypresses and warmer olive shrubs respectively.
very_dark_foliage = (maximum < 82) & (saturation > .06)
olive_foliage = (
    (maximum < 150)
    & (saturation > .08)
    & (r < g * 1.16)
    & (g > b * 1.06)
)
vegetation_colour = np.any(very_dark_foliage | olive_foliage, axis=0)
# The high threshold isolates genuine silhouette displacement from codec grain.
# A lower threshold is accepted only close to one of those reliable seeds; this
# recovers the tree's internal pixels while leaving static cliff texture alone.
motion_seed = motion >= 16
motion_detail = motion >= 5
vegetation = motion_seed | (motion_detail & max_filter(motion_seed, 31))
vegetation &= max_filter(vegetation_colour, 9)

# The moving material starts below the temple cap.  Removing the upper sky also
# guarantees that the app's current sky and cloud animation remain untouched.
height, width = vegetation.shape
y, x = np.ogrid[:height, :width]
vegetation &= y >= 72

# The sea is composited through its own precise shoreline mask.  Reusing that
# authored boundary is more accurate than a geometric approximation.
water_image = np.asarray(
    Image.open(ROOT / "assets" / "WATER_EFFECT_MASK_V2.png").convert("L")
)
water = water_image >= 96
vegetation &= ~water

# Close small codec gaps, then soften only the final edge.  The slight expansion
# hides the static tree beneath throughout its entire animated displacement.
vegetation = min_filter(max_filter(vegetation, 7), 5)
vegetation = max_filter(vegetation, 5)

mask = Image.fromarray((vegetation.astype(np.uint8) * 255), "L")
mask = mask.filter(ImageFilter.GaussianBlur(1.25))
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
rgba_mask = Image.new("RGBA", mask.size, (255, 255, 255, 0))
rgba_mask.putalpha(mask)
rgba_mask.save(OUTPUT, optimize=True)

# Keep an opaque diagnostic over frame zero for visual QA.
preview = Image.open(AUDIT / "frame-0.png").convert("RGBA")
overlay = Image.new("RGBA", preview.size, (255, 48, 120, 0))
overlay.putalpha(mask.point(lambda value: int(value * .58)))
Image.alpha_composite(preview, overlay).save(AUDIT / "vegetation-mask-preview.png", optimize=True)

print({
    "output": str(OUTPUT),
    "coverage": round(float(vegetation.mean()), 4),
    "motion_seed": round(float(motion_seed.mean()), 4),
})
