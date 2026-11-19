"""生成应用图标：圆角渐变底 + 白色聊天气泡，输出 PNG 与 Windows ICO。"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

SIZE = 1024
SCALE = 4
W = SIZE * SCALE

root = Path(__file__).resolve().parent.parent
out = root / "resources"
out.mkdir(parents=True, exist_ok=True)


def make_background() -> Image.Image:
    """左上到右下的蓝色渐变，裁成圆角方块。"""
    x = np.linspace(0.0, 1.0, W)
    y = np.linspace(0.0, 1.0, W)
    xx, yy = np.meshgrid(x, y)
    t = np.clip(xx * 0.35 + yy * 0.65, 0.0, 1.0)[..., None]
    start = np.array([91, 124, 255], dtype=float)
    end = np.array([42, 59, 213], dtype=float)
    pixels = (start * (1 - t) + end * t).astype(np.uint8)
    gradient = Image.fromarray(pixels, "RGB").convert("RGBA")

    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, W - 1, W - 1], radius=int(230 * SCALE), fill=255
    )
    gradient.putalpha(mask)
    return gradient


def make_bubble() -> Image.Image:
    """白色圆角气泡与左下角尾巴，内部三个蓝色圆点。"""
    bubble = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bubble)
    draw.rounded_rectangle(
        [int(250 * SCALE), int(300 * SCALE), int(774 * SCALE), int(690 * SCALE)],
        radius=int(110 * SCALE),
        fill=(255, 255, 255, 255),
    )
    draw.polygon(
        [
            (int(360 * SCALE), int(660 * SCALE)),
            (int(318 * SCALE), int(790 * SCALE)),
            (int(470 * SCALE), int(676 * SCALE)),
        ],
        fill=(255, 255, 255, 255),
    )
    dot_radius = int(34 * SCALE)
    for center_x in (430, 512, 594):
        draw.ellipse(
            [
                int(center_x * SCALE) - dot_radius,
                int(495 * SCALE) - dot_radius,
                int(center_x * SCALE) + dot_radius,
                int(495 * SCALE) + dot_radius,
            ],
            fill=(59, 85, 230, 255),
        )
    return bubble


icon = Image.alpha_composite(make_background(), make_bubble())
icon = icon.resize((SIZE, SIZE), Image.LANCZOS)
icon.save(out / "icon.png")
icon.save(
    out / "icon.ico",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print(f"icon written to {out}")
