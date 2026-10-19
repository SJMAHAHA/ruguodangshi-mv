#!/usr/bin/env bash
# 从原始独立音频切出渲染用的 WAV（样本级精确）。只做首尾极短的防爆音淡入/淡出，不改变速度、音调和编曲。
#   试片：原曲 01:07.290 — 01:37.290 → public/audio/ruguodangshi_067290-097290.wav（30.000 s = 1,440,000 个 48 kHz 样本）
#   完整版：原曲 00:00.000 — 05:14.233 → public/audio/ruguodangshi_full.wav（9427 帧 = 15,083,200 个样本）
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:-../downloads/BV1JA41147Qo/ruguodangshi_BV1JA41147Qo.m4a}"
if [ ! -f "$SRC" ]; then SRC="public/audio/ruguodangshi_full.m4a"; fi

OUT="public/audio/ruguodangshi_067290-097290.wav"
START_SAMPLE=3229920   # 67.290 s × 48000
END_SAMPLE=4669920     # 97.290 s × 48000
ffmpeg -v error -y -i "$SRC" \
  -af "atrim=start_sample=${START_SAMPLE}:end_sample=${END_SAMPLE},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.02,afade=t=out:st=29.62:d=0.38:curve=qsin" \
  -ar 48000 -ac 2 -c:a pcm_s16le "$OUT"
ffprobe -v error -show_entries stream=sample_rate,channels,duration_ts,duration -of compact "$OUT"

FULL="public/audio/ruguodangshi_full.wav"
FULL_SAMPLES=15083200  # 9427 / 30 s × 48000
ffmpeg -v error -y -i "$SRC" \
  -af "apad,atrim=end_sample=${FULL_SAMPLES},asetpts=PTS-STARTPTS,afade=t=out:st=314.0:d=0.233" \
  -ar 48000 -ac 2 -c:a pcm_s16le "$FULL"
ffprobe -v error -show_entries stream=sample_rate,channels,duration_ts,duration -of compact "$FULL"
