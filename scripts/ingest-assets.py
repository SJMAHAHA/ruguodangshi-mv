"""把 Codex 交来的素材（incoming/）处理好放进 public/plates/。
用法：python3 scripts/ingest-assets.py            处理 incoming/ 里所有认识的文件
透明背景的 PNG 直接缩放；没有透明通道的 PNG 当作纯绿底抠像（scripts/chroma-key.py）；JPG 直接缩放。
处理完把 src/config/assets.ts 里对应的开关改成 true。
"""
import os, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
# 文件名 → (输出路径, 尺寸, 对应的开关)
SPEC = {
    "hand_write-her.png": ("public/plates/hand_write-her.png", (1200, 1800), "writeHands"),
    "hand_write-him.png": ("public/plates/hand_write-him.png", (1200, 1800), "writeHands"),
    "bouquet_night.png": ("public/plates/bouquet_night.png", (1200, 600), "bouquet"),
    "bouquet_memory.png": ("public/plates/bouquet_memory.png", (1200, 600), "bouquet"),
    "jetty_far.png": ("public/plates/jetty_far.png", (1320, 1580), "jettyFar"),
    "floor_night.jpg": ("public/plates/floor_night.jpg", (2960, 548), "floor"),
    "floor_day.jpg": ("public/plates/floor_day.jpg", (2960, 548), "floor"),
    "floor_dusk.jpg": ("public/plates/floor_dusk.jpg", (2960, 548), "floorDusk"),
    "d1_strip-a.jpg": ("public/plates/d1_strip-a.jpg", (4800, 1160), "d1Tiles"),
    "d1_strip-b.jpg": ("public/plates/d1_strip-b.jpg", (4800, 1160), "d1Tiles"),
}
done = []
for name in sorted(os.listdir("incoming")) if os.path.isdir("incoming") else []:
    if name not in SPEC:
        if name != "done":
            print(f"  跳过（不认识的文件名）：{name}")
        continue
    src = os.path.join("incoming", name)
    out, (w, h), flag = SPEC[name]
    im = Image.open(src)
    if im.size[0] * h != im.size[1] * w:
        print(f"  注意：{name} 是 {im.size[0]}×{im.size[1]}，和要求的 {w}×{h} 比例不同，会被拉伸")
    if out.endswith(".jpg"):
        im.convert("RGB").resize((w, h), Image.LANCZOS).save(out, quality=93)
    elif im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        im.convert("RGBA").resize((w, h), Image.LANCZOS).save(out, optimize=True)
    else:
        subprocess.run([sys.executable, "scripts/chroma-key.py", src, out, str(w), str(h)], check=True)
    print(f"✓ {name} → {out}（开关 {flag}）")
    done.append(flag)
if done:
    print("记得把 src/config/assets.ts 里这些开关改成 true：", ", ".join(sorted(set(done))))
else:
    print("incoming/ 里没有可处理的文件")
