#!/usr/bin/env bash
# 完整版分段渲染（可中断、可续跑、可在几台机器上分工）：
#   bash scripts/render-full-segments.sh [起始帧] [结束帧] [每段帧数]
#   并发数：CONCURRENCY=8 bash scripts/render-full-segments.sh（不设时用 Remotion 的默认值）
#   单帧超时（毫秒）：TIMEOUT=120000（K2 的铅笔稿滤镜很重，机器忙时可能超过默认的 30 s）
# 每段写成 out/segs/seg_<起始帧>.mp4，已存在的段会跳过。全部完成后运行：
#   bash scripts/finalize-full.sh out/segs/seg_*.mp4
# 注意：所有段必须用同一组编码参数（这里写死），才能无损拼接。
set -euo pipefail
cd "$(dirname "$0")/.."
S=${1:-0}; END=${2:-9426}; N=${3:-200}
mkdir -p out/segs
[ -d out/bundle ] || npx remotion bundle --out-dir=out/bundle
s=$S
while [ "$s" -le "$END" ]; do
  e=$((s + N - 1)); [ "$e" -gt "$END" ] && e=$END
  f=out/segs/seg_$(printf %05d "$s").mp4
  if [ ! -f "$f" ]; then
    npx remotion render out/bundle RuguoFull "$f.tmp.mp4" --frames="$s-$e" \
      --codec=h264 --image-format=png --pixel-format=yuv420p --color-space=bt709 --crf=14 --muted --log=error \
      ${CONCURRENCY:+--concurrency=$CONCURRENCY} ${TIMEOUT:+--timeout=$TIMEOUT}
    mv "$f.tmp.mp4" "$f"
    echo "seg $s-$e"
  fi
  s=$((e + 1))
done
