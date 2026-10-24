"""绿幕抠像：Seedream 在纯绿底上画的道具 → 透明底 PNG（只用 PIL）。
用法：python3 scripts/chroma-key.py 输入.jpg 输出.png [宽 高] [--white] [--grade=r,g,b,饱和度]
透明度按「绿色比红、蓝高出多少」计算（两个阈值之间平滑过渡），半透明边缘再去掉绿色溢色。
--white：白纸上的铅笔淡彩 → 越白越透明（相当于正片叠底到下面的颜色上）。
--grade=1.06,1.0,0.9,0.85：抠完后按通道乘系数、再调饱和度（生成的颜色偏了时用）。
"""
import sys
from PIL import Image, ImageChops, ImageEnhance, ImageFilter

white = "--white" in sys.argv
grade = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--grade=")), None)
args = [a for a in sys.argv[1:] if not a.startswith("--")]
src, out = args[0], args[1]
im = Image.open(src).convert("RGB")
if len(args) > 3:
    im = im.resize((int(args[2]), int(args[3])), Image.LANCZOS)
if white:
    # 不透明度 = 比纸白暗多少；颜色压暗一点补偿半透明带来的变淡
    r, g, b = im.split()
    darkest = ImageChops.darker(ImageChops.darker(r, g), b)
    alpha = darkest.point(lambda v: max(0, min(255, round((236 - v) * 255 / 150))))
    rgb = im.point(lambda v: round(v * 0.8))
    rgba = Image.merge("RGBA", (*rgb.split(), alpha))
    rgba.save(out, optimize=True)
    print(f"{out}: {rgba.size[0]}x{rgba.size[1]}（白底转透明）")
    sys.exit(0)
r, g, b = im.split()
max_rb = ImageChops.lighter(r, b)
excess = ImageChops.subtract(g, max_rb)  # 绿色超出的量（小于 0 记为 0）
T0, T1 = 28, 90  # 低于 T0：完全不透明；高于 T1：完全透明
alpha = excess.point(lambda v: 255 - max(0, min(255, round((v - T0) * 255 / (T1 - T0)))))
# 去掉孤立的小噪点，边缘收一点点（避免绿边）
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
# 图片最外圈 6 像素一律透明（生成图边缘偶尔有杂点）
border = Image.new("L", alpha.size, 0)
border.paste(255, (6, 6, alpha.size[0] - 6, alpha.size[1] - 6))
alpha = ImageChops.multiply(alpha, border)
# 去溢色：绿色不超过红蓝的较大者
g2 = ImageChops.darker(g, max_rb.point(lambda v: min(255, v + 6)))
rgb = Image.merge("RGB", (r, g2, b))
if grade:
    kr, kg, kb, sat = (float(v) for v in grade.split(","))
    rr, gg, bb = rgb.split()
    rgb = Image.merge("RGB", (rr.point(lambda v: min(255, round(v * kr))), gg.point(lambda v: min(255, round(v * kg))), bb.point(lambda v: min(255, round(v * kb)))))
    rgb = ImageEnhance.Color(rgb).enhance(sat)
rgba = Image.merge("RGBA", (*rgb.split(), alpha))
rgba.save(out, optimize=True)
hist = alpha.histogram()
print(f"{out}: {rgba.size[0]}x{rgba.size[1]}, 不透明像素 {sum(hist[128:]) / sum(hist) * 100:.1f}%")
