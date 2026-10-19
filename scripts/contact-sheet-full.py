"""完整版关键帧联系表：从成片按帧号抽 20 个代表时刻，拼成 4×5（带时间码与说明）。
用法：python3 scripts/contact-sheet-full.py <成片.mp4> <输出.jpg>
"""
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw, ImageFont

MOMENTS = [
    (150, "A1 黄昏", "路灯亮起，两个人坐在长椅两头"),
    (880, "A5", "他手机锁屏里的合影"),
    (1260, "B1 夏天的长椅", "回忆：分一副耳机"),
    (1800, "B4", "在诗集插图上画胡子"),
    (2240, "S1 雨夜（试片）", "隔着雨窗，他的手碰到她的手"),
    (3000, "C1 渡口", "水面浮出她的回忆近景"),
    (3420, "C3 初见", "白天的公交站，两人对视"),
    (3700, "D1 独行", "提着倒垂的花束走过旧街"),
    (4040, "D2", "卷帘门上的回忆纸被风掀起"),
    (4820, "E3 雾玻璃", "执子之手 / 与子偕老，玻璃里的两张笑脸"),
    (5000, "E4", "他呵一口气，当年的字又显出来"),
    (5480, "F3 再次雨夜", "空位上的铅笔草稿重演起身"),
    (6080, "G2 河灯", "每盏河灯上画着一段回忆"),
    (6290, "G3", "月亮前的小船，她回头"),
    (7060, "G7", "她笑了一下，化作花瓣散开"),
    (7250, "G8", "月亮的倒影落在空位前"),
    (7650, "H1 天将亮", "月亮沉向城市，灯熄了"),
    (8380, "J2 黎明", "回忆纸层最后一次对齐"),
    (8720, "J4", "他把花束留在她的位置上，离开"),
    (9290, "K2 尾声", "画面褪成纸上的铅笔稿"),
]

src, out = sys.argv[1], sys.argv[2]
tmp = tempfile.mkdtemp()
font_path = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
try:
    f_big = ImageFont.truetype(font_path, 22)
    f_small = ImageFont.truetype(font_path, 18)
    f_title = ImageFont.truetype(font_path, 28)
except Exception:
    f_big = f_small = f_title = ImageFont.load_default()
W, H = 480, 270
cells = []
for frame, title, note in MOMENTS:
    p = os.path.join(tmp, f"{frame}.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"select=eq(n\\,{frame}),scale={W}:{H}", "-vframes", "1", p], check=True)
    im = Image.open(p).convert("RGB")
    cell = Image.new("RGB", (W, H + 62), (22, 26, 31))
    cell.paste(im, (0, 0))
    d = ImageDraw.Draw(cell)
    m, s = divmod(frame / 30, 60)
    d.text((10, H + 6), f"{title}   {int(m)}:{s:05.2f}", fill=(221, 211, 189), font=f_big)
    d.text((10, H + 34), note, fill=(160, 166, 160), font=f_small)
    cells.append(cell)
cols = 4
rows = (len(cells) + cols - 1) // cols
pad = 10
sheet = Image.new("RGB", (cols * W + (cols + 1) * pad, rows * (H + 62) + (rows + 1) * pad + 60), (14, 17, 21))
d = ImageDraw.Draw(sheet)
d.text((pad, 14), "《如果当时》完整版 MV · 关键帧（全曲 0:00–5:14.23，9427 帧）", fill=(221, 211, 189), font=f_title)
for i, c in enumerate(cells):
    x = pad + (i % cols) * (W + pad)
    y = 60 + pad + (i // cols) * (H + 62 + pad)
    sheet.paste(c, (x, y))
sheet.save(out, quality=92)
print(out)
