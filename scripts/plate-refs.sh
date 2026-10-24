#!/usr/bin/env bash
# 渲染 Seedream 用的全部参考底稿 → out/ref/（scripts/plates.jobs.mjs 里的 refs 指向这里）
#   bash scripts/plate-refs.sh
# 之后：node scripts/seedream.mjs --list 查看任务，node scripts/seedream.mjs <id> 重新生成某一张。
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/ref
npx remotion still PlateRefAlley out/ref/alley_night.png --props='{"tod":"night","lamp":1}'
npx remotion still PlateRefRiver out/ref/river_night.png
npx remotion still PlateRefJetty out/ref/jetty_night.png
npx remotion still PlateRefBench out/ref/bench_false.png --props='{"memory":false}'
npx remotion still PlateRefBench out/ref/bench_true.png --props='{"memory":true}'
npx remotion still PlateRefPhoto out/ref/photo.png
npx remotion still PlateRefFace out/ref/face.png
npx remotion still PlateRefD1 out/ref/d1_strip.png
npx remotion still PlateRefD2 out/ref/d2_shutter.png
npx remotion still PlateRefE1 out/ref/e1_sunwall.png
for k in pencil-her pencil-him point-her point-him reach-him; do npx remotion still "PlateRefHand-$k" "out/ref/hand_$k.png"; done
npx remotion still PlateRefPhoneHand out/ref/hand_phone.png
# 角色设定页：回忆配色那一块给插画当人物参考
npx remotion still CharacterSheet out/ref/charsheet.png
python3 -c "from PIL import Image; Image.open('out/ref/charsheet.png').convert('RGB').crop((1100, 0, 1920, 640)).save('out/ref/charsheet_memory.png')"
