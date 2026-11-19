"""生成应用图标：紫蓝渐变底 + 白色圆形对话气泡，输出 PNG 与 Windows ICO。"""

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
    """左上到右下的紫蓝渐变，裁成圆角方块。"""
    x = np.linspace(0.0, 1.0, W)
    y = np.linspace(0.0, 1.0, W)
    xx, yy = np.meshgrid(x, y)
    t = np.clip(xx * 0.4 + yy * 0.6, 0.0, 1.0)[..., None]
    start = np.array([124, 58, 237], dtype=float)
    end = np.array([37, 99, 235], dtype=float)
    pixels = (start * (1 - t) + end * t).astype(np.uint8)
    gradient = Image.fromarray(pixels, "RGB").convert("RGBA")

    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, W - 1, W - 1], radius=int(230 * SCALE), fill=255
    )
    gradient.putalpha(mask)
    return gradient


def make_bubble() -> Image.Image:
    """白色圆形气泡、左下角尾巴，内部三条紫色消息线条。"""
    bubble = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bubble)
    center_x, center_y, radius = 512, 470, 245
    draw.ellipse(
        [
            int((center_x - radius) * SCALE),
            int((center_y - radius) * SCALE),
            int((center_x + radius) * SCALE),
            int((center_y + radius) * SCALE),
        ],
        fill=(255, 255, 255, 255),
    )
    draw.polygon(
        [
            (int(355 * SCALE), int(640 * SCALE)),
            (int(335 * SCALE), int(805 * SCALE)),
            (int(495 * SCALE), int(690 * SCALE)),
        ],
        fill=(255, 255, 255, 255),
    )
    line_height = 30
    for left, right, top in ((382, 646, 392), (382, 610, 456), (382, 560, 520)):
        draw.rounded_rectangle(
            [
                int(left * SCALE),
                int(top * SCALE),
                int(right * SCALE),
                int((top + line_height) * SCALE),
            ],
            radius=int((line_height / 2) * SCALE),
            fill=(79, 70, 229, 255),
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
