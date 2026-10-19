#!/usr/bin/env bash
# 成片封装：保留 Remotion 渲染的视频流，用同一份原曲切片重新封装 AAC 音轨，
# 使视频与音频都严格为 30.000 s（AAC 补齐帧会让 Remotion 直出的容器显示 30.016 s）。
set -euo pipefail
cd "$(dirname "$0")/.."
IN="${1:-out/render_raw_1080p.mp4}"
OUT="${2:-deliverables/ruguodangshi_pilot_1080p.mp4}"
mkdir -p "$(dirname "$OUT")"
ffmpeg -v error -y -i "$IN" -i public/audio/ruguodangshi_067290-097290.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -t 30 -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt,r_frame_rate,nb_frames,duration,sample_rate:format=duration -of compact "$OUT"
