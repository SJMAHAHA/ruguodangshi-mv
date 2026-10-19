/**
 * 时间轴：所有镜头、乐句和字幕的时间都在这里。
 * 试片秒 = 原曲秒 − SONG_OFFSET。原曲时间来自 analysis/audio-analysis.md 的实测。
 */
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 900; // 30.000 s

export const SONG_OFFSET = 67.29; // 原曲 01:07.290 = 试片 0
export const song = (songSec: number) => songSec - SONG_OFFSET;
export const fr = (sec: number) => Math.round(sec * FPS);

/** 乐句与重音（试片秒） */
export const CUE = {
  lineVision: song(67.35), // 视线要模糊了
  lineImportant: song(70.49), // 此时感觉到你的重要
  stopStart: song(76.55), // 全曲停顿
  stopEnd: song(76.9),
  lineLoveGone: song(76.93), // 爱走了 心走了
  lineYouLeave: song(80.16), // 你说你要走了
  lineLastSong: song(84.87), // 我为你唱最后的古谣
  chorus: song(91.15), // 副歌下拍
  chorusBar2: song(94.3),
  end: 30,
} as const;

/** 镜头（帧） */
export const SHOTS = {
  s1: { from: 0, to: fr(CUE.stopEnd + 0.03) }, // 0–289：切在停顿后「爱」进入的下拍
  s2: { from: fr(CUE.stopEnd + 0.03), to: fr(CUE.lineLastSong) }, // 289–527
  s3: { from: fr(CUE.lineLastSong), to: fr(CUE.chorus) }, // 527–716：切在副歌下拍
  s4: { from: fr(CUE.chorus), to: fr(CUE.chorusBar2) }, // 716–810
  s5: { from: fr(CUE.chorusBar2), to: 900 }, // 810–900
} as const;

/** 字幕（试片秒）。in 取 LRC 时间略提前，out 取 MV 擦色结束后。 */
export const LYRICS: { text: string; in: number; out: number }[] = [
  { text: "视线要模糊了", in: song(67.4), out: song(70.25) },
  { text: "此时感觉到你的重要", in: song(70.45), out: song(76.1) },
  { text: "爱走了 心走了", in: song(76.95), out: song(80.0) },
  { text: "你说你要走了", in: song(80.12), out: song(83.95) },
  { text: "我为你唱最后的古谣", in: song(84.85), out: song(90.8) },
  { text: "红雨瓢泼泛起了回忆怎么潜", in: song(91.12), out: 29.9 },
];
