#!/usr/bin/env python3
"""把 Codex 交来的水粉人物图（incoming/chars/<镜头>/）接入到 public/chars/<镜头>/。

只读 manifest.json 里列出的成品（source/ 等工作文件不拷），统一缩放到指定宽度：
交付画布是 3840×2160 的注册画布（不是原生 4K），按镜头里画布在画面上的最大尺寸留一点余量即可。
  python3 scripts/ingest-chars.py A3 2560
  python3 scripts/ingest-chars.py S2 2880
"""
import json, os, sys, shutil
from PIL import Image

shot, width = sys.argv[1], int(sys.argv[2])
src = f"incoming/chars/{shot}"
dst = f"public/chars/{shot}"
m = json.load(open(f"{src}/manifest.json"))
W, H = m["canvas"]
height = round(width * H / W)
n = 0
for a in m["assets"]:
    f = a["file"]
    os.makedirs(os.path.dirname(f"{dst}/{f}"), exist_ok=True)
    im = Image.open(f"{src}/{f}").convert("RGBA")
    assert im.size == (W, H), (f, im.size)
    # 先预乘 alpha 再缩放，避免透明边缘发黑 / 发白
    im.resize((width, height), Image.LANCZOS, reducing_gap=3.0).save(f"{dst}/{f}", optimize=True)
    n += 1
shutil.copy(f"{src}/manifest.json", f"{dst}/manifest.json")
print(f"{shot}: {n} 张 → {dst}（{width}×{height}）")
