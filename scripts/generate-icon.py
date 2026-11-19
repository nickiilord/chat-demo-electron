"""生成扁平化应用图标：纯色圆角底 + 白色字母 C，输出 PNG 与 Windows ICO。"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 1024
SCALE = 4
W = SIZE * SCALE

root = Path(__file__).resolve().parent.parent
out = root / "resources"
out.mkdir(parents=True, exist_ok=True)


def make_background() -> Image.Image:
    """扁平的单色圆角方块。"""
    image = Image.new("RGBA", (W, W), (37, 99, 235, 255))
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, W - 1, W - 1], radius=int(230 * SCALE), fill=255
    )
    image.putalpha(mask)
    return image


def make_letter_c() -> Image.Image:
    """圆环遮罩切出缺口，并在两端补圆头，形成干净的字母 C。"""
    mask = Image.new("L", (W, W), 0)
    draw = ImageDraw.Draw(mask)
    center = 512 * SCALE
    radius = 292 * SCALE
    line_width = 104 * SCALE
    outer = radius + line_width / 2
    inner = radius - line_width / 2

    draw.ellipse(
        [center - outer, center - outer, center + outer, center + outer], fill=255
    )
    draw.ellipse(
        [center - inner, center - inner, center + inner, center + inner], fill=0
    )

    # 右侧楔形缺口，开口角度约 96 度。
    gap_half_angle = 48
    points = [(center, center)]
    for angle in range(-gap_half_angle, gap_half_angle + 1, 2):
        radians = math.radians(angle)
        points.append(
            (
                center + (outer + 10) * math.cos(radians),
                center + (outer + 10) * math.sin(radians),
            )
        )
    draw.polygon(points, fill=0)

    # 缺口两端画圆头，覆盖楔形留下的直角。
    for angle in (-gap_half_angle, gap_half_angle):
        radians = math.radians(angle)
        x = center + radius * math.cos(radians)
        y = center + radius * math.sin(radians)
        draw.ellipse(
            [x - line_width / 2, y - line_width / 2, x + line_width / 2, y + line_width / 2],
            fill=255,
        )

    white = Image.new("RGBA", (W, W), (255, 255, 255, 255))
    white.putalpha(mask)
    return white


icon = Image.alpha_composite(make_background(), make_letter_c())
icon = icon.resize((SIZE, SIZE), Image.LANCZOS)
icon.save(out / "icon.png")
icon.save(
    out / "icon.ico",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print(f"icon written to {out}")
