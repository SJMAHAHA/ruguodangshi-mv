/**
 * 完整版时间轴：全部以「原曲秒」为单位（= 全片秒）。
 * 镜头切点见 docs/full-storyboard.md。
 */
export const FULL_FRAMES = 9427; // 314.233 s（音频 314.24 s，最后 7 ms 为静音）
export const PILOT_AT = 2019; // 试片 0 帧在全片中的位置（67.29 s × 30 = 2018.7 → 2019）

export const CUTS = {
  A1: 0, A2: 6.5, A3: 13.05, A4: 19.0, A5: 25.75, A6: 32.35,
  B1: 38.25, B2: 44.1, B3: 51.0, B4: 57.7, B5: 64.2,
  P: 67.29,
  C1: 97.29, C2: 103.65, C3: 109.75,
  D1: 116.75, D2: 129.5,
  E1: 142.4, E2: 148.35, E3: 155.1, E4: 162.0,
  F1: 168.45, F2: 174.7, F3: 180.95, F4: 187.45,
  G1: 193.86, G2: 200.05, G3: 206.35, G4: 212.35, G5: 219.0, G6: 225.3, G7: 231.6, G8: 237.4,
  H1: 246.17, H2: 258.5,
  J1: 269.68, J2: 275.95, J3: 282.2, J4: 288.2,
  K1: 294.95, K2: 306.0,
  END: 314.233,
} as const;

export type ShotId = keyof typeof CUTS;
const ORDER = Object.keys(CUTS) as ShotId[];

/** 镜头的帧区间 [from, to) */
export const shot = (id: ShotId): { from: number; to: number; dur: number; t0: number } => {
  const i = ORDER.indexOf(id);
  const from = id === "P" ? 2019 : Math.round(CUTS[id] * 30);
  const nextId = ORDER[i + 1];
  const to = nextId === "P" ? 2019 : nextId === "C1" ? 2919 : Math.round(CUTS[nextId] * 30);
  return { from, to, dur: to - from, t0: from / 30 };
};

/** 全曲的重音/段落（原曲秒） */
export const SONG = {
  vocalStart: 13.11,
  verse2: 38.31,
  pre1: 64.26,
  chorus1: 91.15,
  interlude: 117.2,
  verse2b: 142.49,
  pre2: 168.52,
  chorus2: 193.86,
  chorus3: 219.0,
  bridge: 246.17,
  chorus4: 269.68,
  outro: 295.5,
  fadeStart: 305,
} as const;
