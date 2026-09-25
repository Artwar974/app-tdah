from pathlib import Path
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "tools" / "map-editor" / ".audit" / "camp-video"
OUTPUT = ROOT / "assets" / "CAMP_VIDEO_VEGETATION_MASK_V2.png"
FIXED_TREE_OUTPUT = ROOT / "assets" / "CAMP_FIXED_CONIFER_MASK.png"
WATER_SEAM_OUTPUT = ROOT / "assets" / "CAMP_VIDEO_WATER_SEAM_MASK.png"
FULL_COVERAGE_OUTPUT = ROOT / "assets" / "CAMP_VIDEO_CONIFER_FULL_COVERAGE_MASK.png"
GRADE_DIR = ROOT / "assets" / "camp_vegetation_grade"
BACKGROUND_DIR = ROOT / "assets" / "camp_conifer_background"


def max_filter(mask: np.ndarray, size: int) -> np.ndarray:
    image = Image.fromarray((mask.astype(np.uint8) * 255), "L")
    return np.asarray(image.filter(ImageFilter.MaxFilter(size))) > 0


frames = np.stack([
    np.asarray(Image.open(AUDIT / f"frame-{index}.png").convert("RGB"), dtype=np.int16)
    for index in range(8)
])
master = np.asarray(
    Image.open(ROOT / "assets" / "geometry_locked" / "MASTER_DAY_FIXED.png")
    .convert("RGB"),
    dtype=np.int16,
)
base_water_alpha = np.asarray(
    Image.open(ROOT / "assets" / "WATER_EFFECT_MASK_V2.png")
    .convert("RGBA"),
    dtype=np.uint8,
)[..., 3]

# The fixed masters stay untouched everywhere except on the conifers outside
# Mount Olympus.  The animated plate replaces those conifers completely; umbrella
# pines, bushes, cliffs, ground and every tree on Olympus remain painted.
height, width = frames.shape[1:3]
cypress_mask = Image.new("L", (width, height), 0)
cypress_draw = ImageDraw.Draw(cypress_mask)
tree_specs: list[tuple[int, int, int, int, int, int]] = []

def add_cypress(
    cx: int,
    top: int,
    bottom: int,
    half_width: int,
    sway: int = 4,
    margin: int = 6,
) -> None:
    # This is only a tight search window.  The final alpha follows the union of
    # the real painted and animated silhouettes inside it, so no triangular
    # patch of neighbouring water, rock or grass is exposed.
    outer = half_width + margin
    shoulder = max(3, int(outer * .40))
    middle = top + int((bottom - top) * .58)
    base = min(height - 1, bottom + 2)
    cypress_draw.polygon([
        (cx - sway - 3, max(0, top - 6)),
        (cx + sway + 3, max(0, top - 6)),
        (cx + shoulder, middle),
        (cx + outer, base),
        (cx - outer, base),
        (cx - shoulder, middle),
    ], fill=255)
    tree_specs.append((cx, top, bottom, half_width, sway, margin))

# Side-cliff conifers and the conifer line bordering the buildable ground.
# There are deliberately no Olympus or umbrella-pine entries here.
for tree in (
    (42, 507, 605, 15), (21, 548, 604, 12), (47, 620, 772, 16),
    (651, 530, 636, 15),
    (707, 573, 725, 20), (674, 640, 726, 15),
    (470, 705, 763, 10), (528, 727, 779, 10),
    (620, 655, 782, 15), (650, 632, 784, 17), (690, 620, 784, 19),
):
    add_cypress(*tree)

# Large foreground silhouettes.
for tree in (
    (23, 878, 1280, 43, 7, 14), (63, 884, 1280, 38, 7, 14),
    (105, 1164, 1280, 23, 6, 12), (699, 1034, 1280, 39, 7, 14),
    (661, 1086, 1280, 31, 7, 14), (632, 1195, 1280, 20, 6, 12),
):
    add_cypress(*tree)

# Three silhouettes need the complete video plate inside their sway envelope.
# A colour-only matte punched stationary-looking holes through their darker and
# less saturated sides: the isolated conifer on the lower-left cliff and the
# two overlapping foreground conifers.  Restrict the full coverage to those
# exact hand-fitted envelopes so neighbouring bushes remain on the fixed plate.
full_coverage_keys = {
    (47, 620),
    (23, 878),
    (63, 884),
}
full_coverage_mask = Image.new("L", (width, height), 0)
full_coverage_draw = ImageDraw.Draw(full_coverage_mask)
for cx, top, bottom, half_width, sway, margin in tree_specs:
    if (cx, top) not in full_coverage_keys:
        continue
    outer = half_width + margin
    # These priority silhouettes overlap while swaying.  Their normal narrow
    # search shoulders left a one-pixel stationary slit between the two large
    # foreground trees and clipped the flank of the isolated cliff conifer.
    shoulder = max(half_width + sway + 2, int(outer * .72))
    middle = top + int((bottom - top) * .58)
    base = min(height - 1, bottom + 4)
    full_coverage_draw.polygon([
        (cx - sway - 5, max(0, top - 7)),
        (cx + sway + 5, max(0, top - 7)),
        (cx + shoulder, middle),
        (cx + outer, base),
        (cx - outer, base),
        (cx - shoulder, middle),
    ], fill=255)
full_coverage_pixels = np.asarray(full_coverage_mask, dtype=np.uint8) > 0
full_coverage_alpha = np.asarray(
    full_coverage_mask.filter(ImageFilter.GaussianBlur(.9)),
    dtype=np.uint8,
).copy()
full_coverage_alpha[full_coverage_pixels] = 255
full_coverage_rgba = Image.new("RGBA", (width, height), (255, 255, 255, 0))
full_coverage_rgba.putalpha(Image.fromarray(full_coverage_alpha, "L"))
full_coverage_rgba.save(FULL_COVERAGE_OUTPUT, optimize=True)

# Extract the union of the real silhouettes inside the exhaustive windows.
# Dark/saturated pixels identify foliage and trunks in both the animated plate
# and the detailed master; motion recovers lighter edge pixels. A two-pixel
# expansion removes anti-alias remnants while remaining inside the tight tree
# windows, so cliff, grass and bush texture stays on the fixed masters.
cypress_pixels = np.asarray(cypress_mask, dtype=np.uint8) > 0
rgb = frames.astype(np.float32)
frame_maximum = rgb.max(axis=3)
frame_minimum = rgb.min(axis=3)
frame_saturation = (frame_maximum - frame_minimum) / np.maximum(frame_maximum, 1)
frame_r = rgb[..., 0]
frame_g = rgb[..., 1]
frame_b = rgb[..., 2]
per_frame_video_tree = (
    (frame_maximum < 178)
    & (frame_saturation > .045)
    & (frame_g > frame_b * .70)
    & (frame_g > frame_r * .98)
    & (frame_r < frame_g * .94)
)
video_tree = np.any(per_frame_video_tree, axis=0)
master_rgb = master.astype(np.float32)
master_maximum = master_rgb.max(axis=2)
master_minimum = master_rgb.min(axis=2)
master_saturation = (master_maximum - master_minimum) / np.maximum(master_maximum, 1)
master_r = master_rgb[..., 0]
master_g = master_rgb[..., 1]
master_b = master_rgb[..., 2]
master_tree_candidates = (
    (master_maximum < 178)
    & (master_saturation > .045)
    & (master_g > master_b * .70)
    & (master_g > master_r * .98)
    & (master_r < master_g * .94)
)

# A more permissive source is used only for erasing the old painted trees.
# Its blue/green balance excludes ocean, while the higher lightness ceiling
# recovers the pale anti-aliased needles that escaped the animation matte.
fixed_master_tree_candidates = (
    (master_maximum < 190)
    & (master_saturation > .03)
    & (master_g > master_r * .90)
    & (master_b > master_r * .92)
)

# Strict material test used to keep ocean pixels out of the vegetation plate.
# It also catches pale foam that used to appear as a bright fixed outline when
# the animated conifer moved away from one of its extreme positions.
day_water = (
    (master_g > master_r + 25)
    & (master_b > master_g + 20)
    & (master_b > 118)
)


def connected_tree_component(candidate: np.ndarray, spec) -> np.ndarray:
    """Keep only dark foliage connected to the upper tree seed.

    The colour threshold alone also finds nearby water and bushes.  Starting
    from the conifer tip and following connected pixels preserves the complete
    tree silhouette without filling the triangular search window.
    """
    cx, top, bottom, half_width, sway, margin = spec
    outer = half_width + margin
    x0 = max(0, cx - outer - sway - 4)
    x1 = min(width, cx + outer + sway + 5)
    y0 = max(0, top - 8)
    y1 = min(height, bottom + 5)
    local = candidate[y0:y1, x0:x1] & cypress_pixels[y0:y1, x0:x1]
    visited = np.zeros(local.shape, dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    seed_x0 = max(0, cx - sway - 7 - x0)
    seed_x1 = min(local.shape[1], cx + sway + 8 - x0)
    seed_y1 = min(local.shape[0], max(20, int((bottom - top) * .42)))
    for sy, sx in np.argwhere(local[:seed_y1, seed_x0:seed_x1]):
        sx += seed_x0
        if not visited[sy, sx]:
            visited[sy, sx] = True
            queue.append((sy, sx))
    while queue:
        y, x = queue.popleft()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                ny, nx = y + dy, x + dx
                if (
                    0 <= ny < local.shape[0]
                    and 0 <= nx < local.shape[1]
                    and local[ny, nx]
                    and not visited[ny, nx]
                ):
                    visited[ny, nx] = True
                    queue.append((ny, nx))
    result = np.zeros((height, width), dtype=bool)
    result[y0:y1, x0:x1] = visited
    return result


# Extract each fixed and animated silhouette independently.  This avoids the
# rectangular/triangular colour patches produced when neighbouring water was
# accidentally classified as foliage inside the search windows.
master_tree = master_tree_candidates & cypress_pixels
fixed_master_tree = np.zeros((height, width), dtype=bool)
for spec in tree_specs:
    fixed_master_tree |= connected_tree_component(fixed_master_tree_candidates, spec)
video_tree = np.zeros((height, width), dtype=bool)
for spec in tree_specs:
    for frame_index in range(frames.shape[0]):
        video_tree |= connected_tree_component(per_frame_video_tree[frame_index], spec)

detected_tree_pixels = video_tree | master_tree
cypress_tree_pixels = cypress_pixels & detected_tree_pixels
# A four-pixel safety rim removes anti-alias fragments while remaining close to
# the complete sampled sway envelope.
cypress_core = max_filter(cypress_tree_pixels, 9) & cypress_pixels

# The old mask let a few pieces of ocean travel with the vegetation plate.  As
# that plate is composited after the ocean grade, foam and shoreline pixels were
# drawn a second time and became conspicuously pale.  Keep the complete moving
# and fixed-tree union, but remove water pixels that are never occupied by a
# tree in any sampled video frame.  A tiny protective rim preserves soft leaf
# edges without retaining the larger blue/white water fragments.
stable_ocean_inside_tree_windows = (
    ((base_water_alpha >= 224) | day_water)
    & ~video_tree
    & ~master_tree
)
cypress_core &= ~stable_ocean_inside_tree_windows
cypress_soft = np.asarray(
    Image.fromarray((cypress_core.astype(np.uint8) * 255), "L").filter(
        ImageFilter.GaussianBlur(.65)
    ),
    dtype=np.uint8,
).copy()
cypress_alpha = cypress_soft
cypress_alpha[cypress_core] = 255

mask_array = cypress_alpha
mask = Image.fromarray(mask_array, "L")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
rgba_mask = Image.new("RGBA", mask.size, (255, 255, 255, 0))
rgba_mask.putalpha(mask)
rgba_mask.save(OUTPUT, optimize=True)

# Separate opaque erasure mask for the old fixed conifers. Colour extraction
# left stationary dark strips on the blue side of several silhouettes. Use a
# tight hand-fitted conifer polygon instead: it covers the whole painted tree,
# while remaining much narrower than the animated sway/search envelope.
fixed_geometry_mask = Image.new("L", (width, height), 0)
fixed_geometry_draw = ImageDraw.Draw(fixed_geometry_mask)
priority_fixed_geometry_mask = Image.new("L", (width, height), 0)
priority_fixed_geometry_draw = ImageDraw.Draw(priority_fixed_geometry_mask)
for cx, top, bottom, half_width, sway, margin in tree_specs:
    outer = half_width + 3
    base = min(height - 1, bottom + 2)
    fixed_polygon = [
        (cx - 3, max(0, top - 5)),
        (cx + 3, max(0, top - 5)),
        (cx + outer, base),
        (cx - outer, base),
    ]
    fixed_geometry_draw.polygon(fixed_polygon, fill=255)
    if (cx, top) in full_coverage_keys:
        priority_fixed_geometry_draw.polygon(fixed_polygon, fill=255)
fixed_geometry_pixels = np.asarray(fixed_geometry_mask, dtype=np.uint8) > 0
priority_fixed_geometry_pixels = (
    np.asarray(priority_fixed_geometry_mask, dtype=np.uint8) > 0
)
fixed_core = max_filter(fixed_master_tree, 7) & fixed_geometry_pixels
# In the problem zones remove the old painted silhouettes as complete, tight
# tree shapes.  The wider sway envelope remains only a limit for the dynamic
# matte and is never painted as a solid video patch.
fixed_core |= priority_fixed_geometry_pixels
fixed_soft = np.asarray(
    Image.fromarray((fixed_core.astype(np.uint8) * 255), "L").filter(
        ImageFilter.GaussianBlur(.28)
    ),
    dtype=np.uint8,
).copy()
fixed_soft[fixed_core] = 255
fixed_rgba = Image.new("RGBA", (width, height), (255, 255, 255, 0))
fixed_rgba.putalpha(Image.fromarray(fixed_soft, "L"))
fixed_rgba.save(FIXED_TREE_OUTPUT, optimize=True)


def inpaint_nearest(source: np.ndarray, hole: np.ndarray) -> np.ndarray:
    """Fill a small masked silhouette from its nearest surrounding pixels."""
    result = source.copy()
    assigned = np.zeros(hole.shape, dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    neighbours = (
        (-1, -1), (-1, 0), (-1, 1),
        (0, -1), (0, 1),
        (1, -1), (1, 0), (1, 1),
    )
    for y, x in np.argwhere(hole):
        samples = []
        for dy, dx in neighbours:
            ny, nx = y + dy, x + dx
            if 0 <= ny < height and 0 <= nx < width and not hole[ny, nx]:
                samples.append(source[ny, nx].astype(np.float32))
        if samples:
            result[y, x] = np.round(np.mean(samples, axis=0)).astype(np.uint8)
            assigned[y, x] = True
            queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for dy, dx in neighbours:
            ny, nx = y + dy, x + dx
            if (
                0 <= ny < height
                and 0 <= nx < width
                and hole[ny, nx]
                and not assigned[ny, nx]
            ):
                result[ny, nx] = result[y, x]
                assigned[ny, nx] = True
                queue.append((ny, nx))
    softened = np.asarray(
        Image.fromarray(result, "RGB").filter(ImageFilter.GaussianBlur(1.05)),
        dtype=np.uint8,
    )
    result[hole] = softened[hole]
    return result


# Build a tree-free detailed background for every temporal master.  These
# layers replace the old painted silhouette on land; animated ocean remains in
# charge of water pixels.  This avoids both static tree fragments and the flat
# video-colour plates that appeared when the branch moved away.
BACKGROUND_DIR.mkdir(parents=True, exist_ok=True)
for state in ("sunrise", "day", "sunset", "night"):
    state_master = np.asarray(
        Image.open(
            ROOT / "assets" / "geometry_locked" / f"MASTER_{state.upper()}_FIXED.png"
        ).convert("RGB"),
        dtype=np.uint8,
    )
    repaired = inpaint_nearest(state_master, fixed_core)
    background_pixels = np.zeros((height, width, 4), dtype=np.uint8)
    visible_background = fixed_soft > 0
    background_pixels[visible_background, :3] = repaired[visible_background]
    background_pixels[..., 3] = fixed_soft
    background = Image.fromarray(background_pixels, "RGBA")
    background.save(BACKGROUND_DIR / f"{state}.png", optimize=True)

# Start with an empty correction and add only verified holes from the historic
# ocean mask.  The animated-tree envelope is intentionally excluded: a static
# correction there would reveal its own silhouette while the branches sway.
water_seam = np.zeros((height, width), dtype=bool)

# Recover small holes left by the historical ocean mask along the side cliffs
# and the shoreline in front of the camp.  The strict blue-channel separation
# selects water only, not blue-grey rock faces or vegetation.
day_master = np.asarray(
    Image.open(ROOT / "assets" / "geometry_locked" / "MASTER_DAY_FIXED.png")
    .convert("RGB"),
    dtype=np.float32,
)
day_water = (
    (day_master[..., 1] > day_master[..., 0] + 25)
    & (day_master[..., 2] > day_master[..., 1] + 20)
    & (day_master[..., 2] > 118)
)
water_band = np.zeros((height, width), dtype=bool)
water_band[470:770, :] = True
missing_static_water = day_water & water_band & (base_water_alpha < 224)
missing_static_water &= ~max_filter(master_tree, 7)
water_seam |= missing_static_water

# Wherever a moving conifer reveals genuine water in at least one sampled
# frame, extend the main ocean mask through the old painted silhouette.  The
# normal ocean pipeline (including its depth treatment) can then remain visible
# behind the moving tree instead of a separately graded rectangular patch.
frame_water = (
    (frame_g > frame_r + 22)
    & (frame_b > frame_g + 18)
    & (frame_b > 108)
)
water_seam |= np.any(frame_water, axis=0) & fixed_core & water_band
water_seam_alpha = np.asarray(
    Image.fromarray((water_seam.astype(np.uint8) * 255), "L").filter(
        ImageFilter.GaussianBlur(.55)
    ),
    dtype=np.uint8,
)
water_seam_rgba = Image.new("RGBA", (width, height), (255, 255, 255, 0))
water_seam_rgba.putalpha(Image.fromarray(water_seam_alpha, "L"))
water_seam_rgba.save(WATER_SEAM_OUTPUT, optimize=True)

grade_tree_area = cypress_core
reference_color = frames[0].astype(np.float32)[grade_tree_area].mean(axis=0)

# Build one neutral colour transform per temporal state from the conifer area
# itself.  A former local map reproduced fixed water/rock shapes as dark plates;
# a uniform transform preserves every animated pixel while matching the state.
GRADE_DIR.mkdir(parents=True, exist_ok=True)
for state in ("sunrise", "day", "sunset", "night"):
    target_master = np.asarray(
        Image.open(
            ROOT / "assets" / "geometry_locked" / f"MASTER_{state.upper()}_FIXED.png"
        ).convert("RGB"),
        dtype=np.uint8,
    )
    target_color = target_master.astype(np.float32)[grade_tree_area].mean(axis=0)
    multiply_color = np.ones(3, dtype=np.float32)
    screen_color = np.zeros(3, dtype=np.float32)
    darker = target_color < reference_color
    multiply_color[darker] = target_color[darker] / np.maximum(reference_color[darker], 8)
    lighter = ~darker
    screen_color[lighter] = (
        (target_color[lighter] - reference_color[lighter])
        / np.maximum(255 - reference_color[lighter], 8)
    )
    multiply_color = np.clip(multiply_color, .28, 1)
    screen_color = np.clip(screen_color, 0, .72)
    multiply_image = Image.new(
        "RGB", (width, height), tuple(np.round(multiply_color * 255).astype(np.uint8))
    )
    screen_image = Image.new(
        "RGB", (width, height), tuple(np.round(screen_color * 255).astype(np.uint8))
    )
    multiply_image.save(GRADE_DIR / f"{state}-multiply.png", optimize=True)
    screen_image.save(GRADE_DIR / f"{state}-screen.png", optimize=True)

# Keep an opaque diagnostic over frame zero for visual QA.
preview = Image.open(AUDIT / "frame-0.png").convert("RGBA")
overlay = Image.new("RGBA", preview.size, (255, 48, 120, 0))
overlay.putalpha(mask.point(lambda value: int(value * .58)))
preview = Image.alpha_composite(preview, overlay)
water_overlay = Image.new("RGBA", preview.size, (0, 240, 255, 0))
water_overlay.putalpha(Image.fromarray(water_seam_alpha, "L").point(lambda value: int(value * .82)))
Image.alpha_composite(preview, water_overlay).save(
    AUDIT / "vegetation-mask-preview.png", optimize=True
)

print({
    "output": str(OUTPUT),
    "fixed_tree_output": str(FIXED_TREE_OUTPUT),
    "water_seam_output": str(WATER_SEAM_OUTPUT),
    "full_coverage_output": str(FULL_COVERAGE_OUTPUT),
    "coverage": round(float(mask_array.mean() / 255), 4),
    "cypresses": len(tree_specs),
    "umbrella_pines": 0,
    "olympus_trees": "fixed",
})
