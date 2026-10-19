"""生成静态纸纹（固定随机种子，可重复）。输出到 public/textures/。
用法：python3 scripts/make-textures.py
"""
import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "textures"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1920, 1080


def blurred_noise(rng, scale, blur):
    n = rng.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    im = Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    im = im.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(im).astype(np.float32) / 255.0
    return (a - a.mean()) / (a.std() + 1e-6)


def fibers(rng, count, length, width):
    im = Image.new("L", (W, H), 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(im)
    for _ in range(count):
        x, y = rng.random() * W, rng.random() * H
        ang = rng.random() * np.pi
        L = length * (0.4 + rng.random())
        pts = []
        for k in range(6):
            t = k / 5
            bend = np.sin(t * np.pi) * (rng.random() - 0.5) * 6
            pts.append((x + np.cos(ang) * L * t - np.sin(ang) * bend,
                        y + np.sin(ang) * L * t + np.cos(ang) * bend))
        d.line(pts, fill=int(60 + rng.random() * 120), width=width)
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    return np.asarray(im).astype(np.float32) / 255.0


def make_paper(seed, name, mottle_amt, grain_amt, fiber_amt):
    rng = np.random.default_rng(seed)
    mottle = 0.55 * blurred_noise(rng, 64, 40) + 0.3 * blurred_noise(rng, 16, 10) + 0.15 * blurred_noise(rng, 6, 3)
    grain = rng.normal(0, 1, (H, W)).astype(np.float32)
    grain = np.asarray(Image.fromarray(((grain * 30) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)
    grain = (grain - 128) / 30
    fib = fibers(rng, 2600, 26, 1)
    v = 1.0 - mottle_amt * (mottle * 0.5 + 0.5) - grain_amt * grain - fiber_amt * fib
    v = v.clip(0, 1)
    Image.fromarray((v * 255).astype(np.uint8), "L").save(OUT / name, optimize=True)


# 乘法叠加用的纸纹：接近白色，只有很淡的斑驳、颗粒和纤维
make_paper(20261019, "paper_multiply.png", mottle_amt=0.10, grain_amt=0.018, fiber_amt=0.07)
# 回忆层暖纸：斑驳更明显
make_paper(19861205, "paper_memory.png", mottle_amt=0.16, grain_amt=0.022, fiber_amt=0.10)


# 水粉笔触底纹：用于大色块的轻微不均匀
def make_gouache(seed, name):
    rng = np.random.default_rng(seed)
    a = 0.6 * blurred_noise(rng, 24, 14) + 0.4 * blurred_noise(rng, 8, 4)
    # 横向拉长的刷痕
    streak = rng.normal(0, 1, (H // 2, W // 24)).astype(np.float32)
    s_im = Image.fromarray(((streak * 40) + 128).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(2))
    s = (np.asarray(s_im).astype(np.float32) - 128) / 40
    v = 0.5 + 0.11 * a + 0.05 * s
    Image.fromarray((v.clip(0, 1) * 255).astype(np.uint8), "L").save(OUT / name, optimize=True)


make_gouache(7, "gouache_soft.png")
print("textures written to", OUT)
