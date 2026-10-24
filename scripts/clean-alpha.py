#!/usr/bin/env python3
"""
清掉抠像贴图背景上残留的半透明雾（alpha 5–60 的大片底色）。
做法：主体 = alpha≥160 → 先腐蚀去掉零星噪点，再膨胀回来并多留几像素 → 稍微羽化 → 乘到原 alpha 上。
主体边缘原有的抗锯齿过渡保留，离主体几像素以外的雾全部清零。

  python3 scripts/clean-alpha.py public/plates/hand_reach-him.png [...]   # 原地改写
  python3 scripts/clean-alpha.py --check public/plates/*.png              # 只统计，不改
"""
import sys
from PIL import Image, ImageFilter, ImageChops

def core_mask(a: Image.Image) -> Image.Image:
    core = a.point(lambda v: 255 if v >= 160 else 0)
    core = core.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(15))
    return core.filter(ImageFilter.GaussianBlur(1.5))

def haze(a: Image.Image, m: Image.Image) -> int:
    """主体以外 alpha≥5 的像素数"""
    outside = ImageChops.multiply(a, ImageChops.invert(m))
    h = outside.histogram()
    return sum(h[5:])

check = "--check" in sys.argv
for p in [x for x in sys.argv[1:] if not x.startswith("--")]:
    im = Image.open(p)
    if im.mode != "RGBA":
        continue
    a = im.getchannel("A")
    m = core_mask(a)
    n = haze(a, m)
    print(f"{p}: {im.size[0]}x{im.size[1]} 背景残留 {n} px ({100 * n / (im.size[0] * im.size[1]):.1f}%)")
    if check or n == 0:
        continue
    na = ImageChops.multiply(a, m).point(lambda v: 0 if v < 6 else v)
    im.putalpha(na)
    im.save(p)
    print("  → 已清理")
