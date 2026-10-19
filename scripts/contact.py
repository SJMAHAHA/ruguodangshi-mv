"""把若干帧拼成联系表，并标注帧号与秒数。python3 scripts/contact.py out.jpg cols f1.jpg f2.jpg ..."""
import sys, re
from PIL import Image, ImageDraw, ImageFont

out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
except Exception:
    font = ImageFont.load_default()
ims = []
for p in files:
    im = Image.open(p).convert("RGB")
    m = re.search(r"f(\d+)\.jpg$", p)
    if m:
        f = int(m.group(1))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, 200, 30), fill=(0, 0, 0))
        d.text((6, 3), f"f{f}  {f/30:.2f}s", fill=(255, 230, 0), font=font)
    ims.append(im)
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (w * cols, h * rows), (16, 16, 16))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(out, quality=88)
print(out)
