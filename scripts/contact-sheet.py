"""从成片抽取代表时刻，拼成 3×3 关键帧联系表（带时间码与说明）。
用法：python3 scripts/contact-sheet.py <成片.mp4> <输出.jpg>
"""
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw, ImageFont

MOMENTS = [
    (66, "S1 雨夜·玻璃后", "对焦从雨玻璃移到两个人"),
    (207, "S1", "他转头看她，手碰到她的手"),
    (318, "S2 手先松开", "她先把手抽回"),
    (437, "S2", "她起身离开，他抬头追看"),
    (594, "S3 两层纸", "回忆纸层与现在对齐"),
    (657, "S3", "纸层错开：两个他分开"),
    (752, "S4 红雨·渡口", "路灯变成月亮，空间展开"),
    (820, "S5 留下的位置", "她的回忆轮廓还坐在那里"),
    (897, "S5", "擦去后只剩空位与花瓣"),
]

src, out = sys.argv[1], sys.argv[2]
tmp = tempfile.mkdtemp()
font_path = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
try:
    f_big = ImageFont.truetype(font_path, 26)
    f_small = ImageFont.truetype(font_path, 22)
except Exception:
    f_big = f_small = ImageFont.load_default()
W, H = 640, 360
cells = []
for frame, title, note in MOMENTS:
    p = os.path.join(tmp, f"{frame}.png")
    # 精确到帧：用 select 过滤器按帧号取
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"select=eq(n\\,{frame}),scale={W}:{H}", "-vframes", "1", p], check=True)
    im = Image.open(p).convert("RGB")
    cell = Image.new("RGB", (W, H + 70), (22, 26, 31))
    cell.paste(im, (0, 0))
    d = ImageDraw.Draw(cell)
    d.text((12, H + 8), f"{title}   f{frame} · {frame/30:05.2f}s", fill=(221, 211, 189), font=f_big)
    d.text((12, H + 40), note, fill=(160, 166, 160), font=f_small)
    cells.append(cell)
cols = 3
rows = (len(cells) + cols - 1) // cols
pad = 10
sheet = Image.new("RGB", (cols * W + (cols + 1) * pad, rows * (H + 70) + (rows + 1) * pad + 60), (14, 17, 21))
d = ImageDraw.Draw(sheet)
d.text((pad, 14), "《如果当时》30 秒试片 · 关键帧（原曲 01:07.290–01:37.290）", fill=(221, 211, 189), font=f_big)
for i, c in enumerate(cells):
    x = pad + (i % cols) * (W + pad)
    y = 60 + pad + (i // cols) * (H + 70 + pad)
    sheet.paste(c, (x, y))
sheet.save(out, quality=92)
print(out)
