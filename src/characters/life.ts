import { hash01, noise1 } from "../lib/random";
import type { FrontPose } from "./front";

/**
 * 「活着」的小动作：眨眼。只由时间和种子决定（同一帧永远一样），不保存跨帧状态。
 *
 * 时间轴切成 3.6 s 一格，每格里随机一个时刻眨一次（相邻两次间隔约 2.5–5 s），
 * 约 1/5 的眨眼是连眨两下。一次眨眼：0.05 s 闭上、停 0.03 s、0.12 s 慢慢睁开。
 */
const SLOT = 3.6;
const CLOSE = 0.05;
const HOLD = 0.03;
const OPEN = 0.12;
const DUR = CLOSE + HOLD + OPEN;

const blinkShape = (dt: number) => {
  if (dt < 0 || dt > DUR) return 0;
  if (dt < CLOSE) return dt / CLOSE;
  if (dt < CLOSE + HOLD) return 1;
  const u = (dt - CLOSE - HOLD) / OPEN;
  return 1 - u * u * (3 - 2 * u);
};

/** t 时刻眼睛闭合的程度 0..1 */
export const blinkAt = (t: number, seed: number) => {
  const i = Math.floor(t / SLOT);
  let c = 0;
  for (let k = i - 1; k <= i; k++) {
    const at = k * SLOT + 0.3 + hash01(k, seed) * (SLOT - 0.6);
    c = Math.max(c, blinkShape(t - at));
    if (hash01(k, seed + 7) < 0.2) c = Math.max(c, blinkShape(t - at - DUR - 0.08));
  }
  return c;
};

/**
 * 给姿势加上眨眼。眼睛已经很小（闭眼、低垂）时不再眨。
 * seed 每个角色不同，两个人不会同时眨眼。
 */
export const withBlink = (pose: FrontPose, t: number, seed: number): FrontPose => {
  const open = pose.head.eyeOpen;
  if (open < 0.3) return pose;
  const c = blinkAt(t, seed);
  if (c <= 0) return pose;
  return { ...pose, head: { ...pose.head, eyeOpen: open * (1 - c * 0.97) } };
};

/**
 * 眨眼 + 头发随风轻摆。wind：风的大小（公交站棚下 0.35，栈桥上 1）。
 * 摆动由慢噪声决定，偶尔有一阵稍大的风。
 */
export const withLife = (pose: FrontPose, t: number, seed: number, wind = 0.35): FrontPose => {
  const p = withBlink(pose, t, seed);
  const gust = 0.6 * noise1(t * 0.35, seed + 3) + 0.4 * noise1(t * 1.1, seed + 5);
  return { ...p, head: { ...p.head, sway: (p.head.sway ?? 0) + gust * wind } };
};

export const SEED_MAN = 401;
export const SEED_WOMAN = 733;
