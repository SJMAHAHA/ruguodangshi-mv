#!/usr/bin/env bash
# 完整版成片封装：把分段渲染的视频流按起始帧顺序无损拼接（先检查首尾相接、没有缺帧），
# 再用原曲 WAV 重新编码 AAC，视频与音频都严格为 9427 帧 = 314.233 s。
#   用法：bash scripts/finalize-full.sh out/segs/seg_*.mp4
# 需要 ffmpeg ≥ 6：ffmpeg 4.x 的 concat 在每个接缝处会多出 0.3–0.7 ms，全片累计约 47 ms 的音画漂移。
# 系统 ffmpeg 太旧时，可以用 Remotion 自带的（Linux arm64 为例）：
#   FFMPEG="env LD_LIBRARY_PATH=$PWD/node_modules/@remotion/compositor-linux-arm64-gnu $PWD/node_modules/@remotion/compositor-linux-arm64-gnu/ffmpeg" \
#     bash scripts/finalize-full.sh out/segs/seg_*.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
FFMPEG="${FFMPEG:-ffmpeg}"
OUT="${OUT:-deliverables/ruguodangshi_full_1080p.mp4}"
TOTAL=9427
mkdir -p "$(dirname "$OUT")" out
LIST="out/concat_list.txt"
: > "$LIST"
expect=0
for f in $(printf '%s\n' "$@" | grep -v '\.tmp\.mp4$' | sort); do
  s=$(basename "$f" .mp4); s=$((10#${s#seg_}))
  n=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$f")
  if [ "$s" -ne "$expect" ]; then echo "缺帧或重叠：期望从 $expect 开始，实际 $f 从 $s 开始" >&2; exit 1; fi
  expect=$((s + n))
  echo "file '$(realpath "$f")'" >> "$LIST"
done
if [ "$expect" -ne "$TOTAL" ]; then echo "总帧数 $expect ≠ $TOTAL" >&2; exit 1; fi
$FFMPEG -v error -y -f concat -safe 0 -i "$LIST" -c copy -an out/full_video_only.mp4
# 检查时间戳：最后一帧的显示时间必须正好是 (9427-1)/30 s（容差 1 ms）
last=$(ffprobe -v error -select_streams v -show_entries packet=pts_time -of csv=p=0 out/full_video_only.mp4 | sort -g | tail -1)
python3 -c "import sys; d=abs($last-($TOTAL-1)/30); print(f'最后一帧 {float($last):.6f} s，偏差 {d*1000:.3f} ms'); sys.exit(1 if d>0.001 else 0)" \
  || { echo "拼接后时间戳漂移，请换用 ffmpeg ≥ 6（见脚本开头说明）" >&2; exit 1; }
$FFMPEG -v error -y -i out/full_video_only.mp4 -i public/audio/ruguodangshi_full.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -t 314.233333 -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt,color_space,color_range,r_frame_rate,nb_frames,duration,sample_rate:format=duration -of compact "$OUT"
