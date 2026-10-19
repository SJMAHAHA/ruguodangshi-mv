import { Easing, interpolate } from "remotion";
import { FPS } from "../config/timeline";

export type Ease = (t: number) => number;

export const E = {
  linear: Easing.linear,
  /** 柔和的起止 */
  inOut: Easing.bezier(0.45, 0, 0.25, 1),
  /** 起步快、落点慢（动作落定） */
  out: Easing.bezier(0.2, 0.7, 0.2, 1),
  /** 起步慢（带重量的启动） */
  in: Easing.bezier(0.55, 0, 0.85, 0.35),
  /** 很慢的推拉镜 */
  drift: Easing.bezier(0.35, 0.05, 0.4, 1),
  /** 落定时有一点点过冲 */
  settle: Easing.bezier(0.25, 0.9, 0.3, 1.08),
} satisfies Record<string, Ease>;

/**
 * 关键帧轨道（以秒为单位，便于对照分镜修改）。
 * keys: [秒, 值, 进入该关键帧所用的缓动?]
 */
export type Key = readonly [number, number, Ease?];

export const track = (t: number, keys: readonly Key[]): number => {
  if (keys.length === 0) return 0;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, ease] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) {
      if (t1 === t0) return v1;
      return interpolate(t, [t0, t1], [v0, v1], {
        easing: ease ?? E.inOut,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
  }
  return keys[keys.length - 1][1];
};

/** 帧 → 秒 */
export const fsec = (frame: number) => frame / FPS;

/** 区间内 0→1 的进度 */
export const prog = (t: number, a: number, b: number, ease: Ease = E.inOut) =>
  interpolate(t, [a, b], [0, 1], { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
