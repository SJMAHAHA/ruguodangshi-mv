#!/usr/bin/env python3
"""给 Codex 的角色比例图：两人的身高、头身比和关键部位的高度（站姿 + 坐姿）。
用法：python3 scripts/char-proportions.py asset-requests/refs/chars/model/proportions.png
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

FONT = next(f for f in ["/System/Library/Fonts/Hiragino Sans GB.ttc", "/System/Library/Fonts/STHeiti Light.ttc", "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"] if os.path.exists(f))
f28 = ImageFont.truetype(FONT, 28)
f22 = ImageFont.truetype(FONT, 22)
f34 = ImageFont.truetype(FONT, 34)

W, H = 2400, 1500
im = Image.new("RGB", (W, H), (236, 232, 222))
d = ImageDraw.Draw(im)
GROUND = 1360
PX_PER_CM = 6.6  # 178 cm → 1175 px

# 从脚底算起、占身高的比例
MARKS = [
    (1.0, "头顶"),
    (1 - 1 / 7.2, "下巴（1 头）"),
    (0.80, "肩（80%）"),
    (0.62, "腰（62%）"),
    (0.47, "裆 / 下垂的手腕（47%）"),
    (0.285, "膝（28%）"),
    (0.0, "脚底"),
]

def figure(cx, height_cm, name, coat, inner, legs, hair):
    h = height_cm * PX_PER_CM
    y = lambda r: GROUND - h * r
    head = h / 7.2
    # 头身刻度
    for k in range(8):
        yy = GROUND - h + min(k * head, h)
        d.line([(cx - 260, yy), (cx - 230, yy)], fill=(120, 110, 100), width=2)
        if k < 8 and k * head <= h:
            d.text((cx - 300, yy - 12), str(k), font=f22, fill=(120, 110, 100))
    d.line([(cx - 245, GROUND - h), (cx - 245, GROUND)], fill=(120, 110, 100), width=2)
    # 简单的人台：头、躯干、腿、手臂
    hw = head * 0.42
    d.ellipse([cx - hw, y(1.0), cx + hw, y(1 - 1 / 7.2)], fill=(222, 200, 180), outline=(60, 55, 50), width=3)
    d.chord([cx - hw - 6, y(1.0) - 8, cx + hw + 6, y(1 - 0.55 / 7.2)], 180, 360, fill=hair)
    sh = head * (0.78 if name.startswith("他") else 0.66)  # 半肩宽（男约 1.55 个头高，女约 1.3）
    neck_top = y(1 - 1 / 7.2)
    d.rectangle([cx - head * 0.13, neck_top, cx + head * 0.13, y(0.80)], fill=(222, 200, 180))
    waist = sh * 0.72
    d.polygon([(cx - sh, y(0.80)), (cx + sh, y(0.80)), (cx + waist, y(0.62)), (cx + waist * 1.05, y(0.47)), (cx - waist * 1.05, y(0.47)), (cx - waist, y(0.62))], fill=inner, outline=(60, 55, 50))
    # 大衣下摆
    hem = 0.40 if name.startswith("他") else 0.27
    d.polygon([(cx - sh, y(0.80)), (cx - sh * 0.35, y(0.80)), (cx - waist * 0.9, y(0.62)), (cx - sh * 0.95, y(hem)), (cx - waist * 1.25, y(hem))], fill=coat)
    d.polygon([(cx + sh, y(0.80)), (cx + sh * 0.35, y(0.80)), (cx + waist * 0.9, y(0.62)), (cx + sh * 0.95, y(hem)), (cx + waist * 1.25, y(hem))], fill=coat)
    leg = head * 0.3
    for s in (-1, 1):
        d.polygon([(cx + s * leg * 0.2, y(0.47)), (cx + s * leg * 1.9, y(0.47)), (cx + s * leg * 1.5, y(0.03)), (cx + s * leg * 0.45, y(0.03))], fill=legs)
        d.ellipse([cx + s * leg * 1.0 - leg * 1.1, y(0.035), cx + s * leg * 1.0 + leg * 1.1, GROUND], fill=(40, 36, 34))
        # 手臂垂下，手腕到裆部高度
        ax = cx + s * (sh + 6)
        d.line([(ax, y(0.79)), (ax + s * 10, y(0.47))], fill=coat, width=int(head * 0.32))
        d.ellipse([ax + s * 10 - head * 0.14, y(0.47) - 4, ax + s * 10 + head * 0.14, y(0.47) + head * 0.62], fill=(222, 200, 180), outline=(60, 55, 50))
    for r, label in MARKS:
        yy = y(r)
        d.line([(cx - 225, yy), (cx + 230, yy)], fill=(176, 80, 70), width=1)
        d.text((cx + 236, yy - 14), label, font=f22, fill=(150, 60, 50))
    d.text((cx - 150, GROUND + 40), f"{name}  约 {height_cm} cm，7.2 头身", font=f28, fill=(40, 36, 34))

figure(560, 178, "他", coat=(45, 61, 79), inner=(127, 138, 132), legs=(37, 46, 57), hair=(26, 28, 32))
figure(1260, 165, "她", coat=(186, 184, 172), inner=(94, 107, 99), legs=(58, 65, 74), hair=(26, 28, 32))

# 坐姿：座面高约 45 cm；坐高（座面到头顶）约 0.52 × 身高 ≈ 2 × 座面高
x0 = 1800
seat_y = GROUND - 45 * PX_PER_CM
d.rectangle([x0 - 40, seat_y, x0 + 420, seat_y + 18], fill=(110, 90, 70))
for x in (x0, x0 + 380):
    d.rectangle([x, seat_y, x + 16, GROUND], fill=(80, 66, 52))
for (cx, hcm, coat) in [(x0 + 90, 178, (45, 61, 79)), (x0 + 310, 165, (186, 184, 172))]:
    hh = 0.52 * hcm * PX_PER_CM
    head = hcm * PX_PER_CM / 7.2
    d.rectangle([cx - head * 0.62, seat_y - hh + head * 1.15, cx + head * 0.62, seat_y], fill=coat)
    d.rectangle([cx - head * 0.12, seat_y - hh + head * 0.95, cx + head * 0.12, seat_y - hh + head * 1.15], fill=(222, 200, 180))
    d.ellipse([cx - head * 0.42, seat_y - hh, cx + head * 0.42, seat_y - hh + head], fill=(222, 200, 180), outline=(60, 55, 50), width=3)
    d.line([(cx - 240 if cx < x0 + 200 else cx + 140, seat_y - hh), (cx + 140, seat_y - hh)], fill=(176, 80, 70), width=1)
d.text((x0 - 60, seat_y - 0.52 * 178 * PX_PER_CM - 60), "坐姿：坐高（座面到头顶）≈ 身高 × 0.52", font=f22, fill=(150, 60, 50))
d.text((x0 - 60, GROUND + 40), "座面高约 45 cm（≈ 坐高的一半）", font=f22, fill=(150, 60, 50))

d.text((60, 40), "《如果当时》人物比例：写实、不要长腿。腰在身高 62%，裆在 47%，下垂的手腕到裆部高度。", font=f34, fill=(40, 36, 34))
d.text((60, 92), "示意图只看比例和各部位高度；画法、脸、发型、衣服以 A3 试片（identity_present.png）为准。", font=f28, fill=(90, 80, 70))
im.save(sys.argv[1])
print(sys.argv[1])
