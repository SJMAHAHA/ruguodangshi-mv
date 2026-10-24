import React from "react";
import { P, ik2, limb, smoothClosed, smoothOpen } from "../lib/geom";
import { Shape, L } from "../draw/Shape";
import { Design, TShapes, handShapes, HEAD_K } from "./front";

/**
 * 侧身行走（面朝画面右侧），男女共用。局部坐标：原点 = 两脚之间的地面，y 向下为正。
 * phase：步态相位（弧度），每 2π 走两步（近侧腿在 phase=0 时脚跟着地）。holdNear：近侧的手提着东西（手臂几乎不摆）。
 *
 * 步态按真实走路的节奏：每条腿 62% 的时间在支撑（脚踝在地面上不动，身体从上面跨过去），
 * 38% 的时间在摆动（抬脚、屈膝、向前送）。身体在支撑中期最高、双脚着地时最低。
 * 只要用 gaitPhase / gait 由行进距离换算相位，支撑脚就不会在地面上打滑。
 */
export type WalkOpts = { holdNear?: boolean };

/** 支撑期占一个周期的比例 */
const STANCE = 0.62;
// 比例与正面站姿一致：裆部约在身高 46–47%，女主上身比旧版长（肩 -830、髋 -480）
const legLen = (f: boolean) => (f ? 432 : 480);
const hipRest = (f: boolean) => (f ? -480 : -520);
/** 半步幅：支撑期里脚踝相对髋部从 +A 移到 -A（局部单位）。女主穿长风衣，步子略小 */
const stepAmp = (f: boolean) => legLen(f) * 0.98 * Math.sin(((f ? 17 : 19) * Math.PI) / 180);
/** 支撑脚脚踝的高度（与原来站姿的脚底位置一致） */
const ankleY = (f: boolean) => hipRest(f) + legLen(f) * 0.98;

/** 脚跟着地时，脚踝在髋部前方多远（局部单位） */
export const heelReach = (d: Design, stride = 1) => stepAmp(d.sex === "f") * stride;

/** 一个步态周期（两步）在世界坐标里走过的距离 */
export const cycleLen = (d: Design, scale: number, stride = 1) => (2 * stepAmp(d.sex === "f") * Math.max(0.05, stride) * scale) / STANCE;

/** 匀速行走：由行进距离得到相位，支撑脚不打滑 */
export const gaitPhase = (dist: number, d: Design, scale: number, stride = 1) => (2 * Math.PI * dist) / cycleLen(d, scale, stride);

/**
 * 起步 / 停步：速度和步幅都随时间变化时，对 速度 / 周期长度 积分得到相位（固定步长，结果只取决于 t）。
 * speed(t)、stride(t) 的 t 从 0 开始（开始走的那一刻）。
 */
export const gait = (t: number, speed: (t: number) => number, stride: (t: number) => number, d: Design, scale: number) => {
  const dt = 1 / 240;
  let ph = 0;
  let dist = 0;
  const n = Math.max(0, Math.floor(t / dt));
  const step = (a: number, b: number) => {
    const tm = (a + b) / 2;
    const v = speed(tm);
    ph += ((2 * Math.PI * v) / cycleLen(d, scale, stride(tm))) * (b - a);
    dist += v * (b - a);
  };
  for (let i = 0; i < n; i++) step(i * dt, (i + 1) * dt);
  if (t > n * dt) step(n * dt, t);
  return { phase: ph, dist, stride: stride(Math.max(0, t)) };
};

const frac = (x: number) => x - Math.floor(x);
const ease = (x: number) => x * x * (3 - 2 * x);

/** 身体起伏（局部单位，y 向下）：支撑中期腿伸直、身体最高；双脚着地时最低（倒立摆） */
export const walkBob = (phase: number, stride = 1) => {
  const u = frac(phase / (2 * Math.PI));
  return (9 - 17 * Math.cos(4 * Math.PI * (u - STANCE / 2))) * stride;
};

const walkBody = (phase: number, d: Design, stride: number) => {
  const f = d.sex === "f";
  const bob = walkBob(phase, stride);
  const shoulder: P = [6, (f ? -830 : -862) + bob];
  return { f, bob, shoulder };
};

/** 一条腿在周期 u 的位置：脚踝相对髋部的水平位置、离地高度、脚掌角度（正值 = 脚尖朝下） */
const legAt = (u: number, A: number, stride: number) => {
  if (u < STANCE) {
    const s = u / STANCE;
    const x = A * (1 - 2 * s);
    // 脚跟着地时脚尖翘起，很快放平；最后 30% 脚跟抬起、以脚尖为轴蹬地
    const toe = s < 0.15 ? -0.28 * (1 - ease(s / 0.15)) : s > 0.7 ? 0.5 * ease((s - 0.7) / 0.3) : 0;
    return { x, lift: 0, toe: toe * stride };
  }
  const s = (u - STANCE) / (1 - STANCE);
  const x = -A + 2 * A * ease(s);
  // 抬脚高度：前半段更高（避免脚尖拖地），落地前放低
  const lift = Math.sin(Math.PI * Math.pow(s, 0.8)) * 46;
  const toe = 0.5 * (1 - ease(Math.min(1, s / 0.45))) - 0.28 * ease(Math.max(0, (s - 0.55) / 0.45));
  return { x, lift: lift * stride, toe: toe * stride };
};

/** 手臂向前摆的程度（-1..1），与同一相位的腿同步、略微滞后 */
const armFwd = (phase: number) => Math.cos(2 * Math.PI * (frac(phase / (2 * Math.PI)) - 0.07));

const armJoint = (phase: number, shoulder: P, f: boolean, hold: boolean, armSwing: number) => {
  const amp = hold ? 5 : 20 * armSwing;
  const k = armFwd(phase);
  const sw = (k * amp * Math.PI) / 180;
  const up = f ? 148 : 162;
  const lo = f ? 128 : 142;
  const elbow: P = [shoulder[0] + Math.sin(sw) * up, shoulder[1] + Math.cos(sw) * up];
  // 前摆时肘部弯得多，后摆时手臂几乎伸直
  const sw2 = sw + ((hold ? 4 : 6 + Math.max(0, k) * 22 * armSwing) * Math.PI) / 180;
  const wrist: P = [elbow[0] + Math.sin(sw2) * lo, elbow[1] + Math.cos(sw2) * lo];
  return { elbow, wrist, sw2 };
};

/** 近侧手腕的位置（给提在手里的花束定位） */
export const walkNearHand = (phase: number, d: Design, stride = 1, opts: WalkOpts = {}): { wrist: P; angle: number } => {
  const { shoulder, f } = walkBody(phase, d, stride);
  const { wrist, sw2 } = armJoint(phase + Math.PI, shoulder, f, !!opts.holdNear, 1);
  return { wrist, angle: (-sw2 * 180) / Math.PI };
};

export const walkShapes = (phase: number, d: Design, stride = 1, armSwing = 1, opts: WalkOpts = {}): Shape[] => {
  const out: Shape[] = [];
  const { f, bob, shoulder } = walkBody(phase, d, stride);
  const hip: P = [0, hipRest(f) + bob];
  const thigh = f ? 214 : 240;
  const shin = f ? 218 : 240;
  const A = stepAmp(f) * stride;
  const ankleGround = ankleY(f);
  const leg = (ph: number, back: boolean) => {
    const u = frac(ph / (2 * Math.PI));
    const g = legAt(u, A, stride);
    const toe = g.toe;
    // 蹬地时以脚尖为轴，脚踝跟着抬起
    const heelUp = toe > 0 ? Math.sin(toe) * 44 : 0;
    const ankle: P = [g.x + (back ? -4 : 4), ankleGround - g.lift - heelUp];
    const knee = ik2(hip, ankle, thigh, shin, -1);
    const col = back ? d.legsShade : d.legs;
    out.push({ d: limb(hip, knee, f ? 66 : 80, f ? 48 : 60, 4), fill: col, line: d.line });
    out.push({ d: limb(knee, ankle, f ? 46 : 58, f ? 30 : 46, 3), fill: col, line: d.line });
    const c = Math.cos(toe);
    const s = Math.sin(toe);
    const R = (x: number, y: number): P => [ankle[0] + x * c - y * s, ankle[1] + x * s + y * c];
    if (f) {
      // 短靴（侧面）
      out.push({ d: smoothClosed([R(-18, -70), R(14, -70), R(18, -4), R(44, 2), R(48, 12), R(-20, 14)], 0.6), fill: d.shoes, line: d.line });
      out.push(L(smoothOpen([R(10, -64), R(13, -10)]), "#7b828a", 2, 0.4));
    } else {
      // 男鞋（侧面）+ 裤脚
      out.push({ d: smoothClosed([R(-26, -14), R(20, -16), R(54, -2), R(62, 12), R(-28, 14)], 0.6), fill: d.shoes, line: d.line });
      out.push(L(smoothOpen([R(-24, -20), R(22, -22)]), d.line, 1.6, 0.6));
    }
  };
  leg(phase + Math.PI, true);
  // 前腿也画在大衣之前：大腿被衣摆盖住，只露出下摆以下
  leg(phase, false);
  const arm = (ph: number, back: boolean, hold: boolean) => {
    const { elbow, wrist } = armJoint(ph, shoulder, f, hold, armSwing);
    out.push({ d: limb(shoulder, elbow, f ? 42 : 52, f ? 36 : 44, 2), fill: back ? d.coatShade : d.coat, line: d.line });
    out.push({ d: limb(elbow, wrist, f ? 36 : 44, f ? 30 : 38, 1), fill: back ? d.coatShade : d.coat, line: d.line });
    const dir = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
    out.push(...handShapes(wrist, (dir * 180) / Math.PI - 90, { at: wrist, curl: hold ? 0.8 : 0.4 }, d, 1));
  };
  arm(phase, true, false);
  // 衣摆比身体慢半拍（跟随动作）
  const sway = Math.sin(4 * Math.PI * (frac(phase / (2 * Math.PI)) - STANCE / 2) - 0.9) * 7 * stride;
  if (f) {
    // 风衣（侧面），下摆随步子摆动
    const coat: P[] = [
      [shoulder[0] - 34, shoulder[1] + 6], [shoulder[0] + 20, shoulder[1] - 6], [46, -768 + bob], [36, -662 + bob], [46, -600 + bob],
      [64 + sway, -430], [90 + sway * 1.6, -200], [24 + sway, -186], [-44 + sway, -188], [-76 + sway * 1.4, -196], [-62 + sway, -430], [-44, -580 + bob], [-42, -730 + bob],
    ];
    out.push({ d: smoothClosed(coat, 0.8), fill: d.coat, line: d.line });
    out.push({ d: smoothClosed([[-42, -730 + bob], [-14, -716 + bob], [-18, -440], [-64 + sway, -220], [-62 + sway, -430], [-44, -580 + bob]], 0.8), fill: d.coatShade, line: null, op: 0.6 });
    out.push(L(smoothOpen([[-30, -560 + bob], [-40 + sway, -420], [-56 + sway * 1.3, -206]]), d.line, 1.3, 0.45));
    out.push({ d: smoothClosed([[-38, -672 + bob], [36, -672 + bob], [38, -650 + bob], [-38, -650 + bob]], 0.3), fill: d.coatShade, line: d.line });
    out.push(L(smoothOpen([[30, -650 + bob], [46 + sway, -500], [70 + sway * 1.5, -206]]), d.line, 1.4, 0.5));
  } else {
    // 男：及大腿中部的大衣
    const coat: P[] = [
      [shoulder[0] - 44, shoulder[1] + 8], [shoulder[0] + 26, shoulder[1] - 6], [54, -800 + bob], [48, -700 + bob], [54, -600 + bob],
      [62 + sway, -470], [70 + sway * 1.3, -352], [10 + sway, -340], [-60 + sway, -346], [-70 + sway, -470], [-58, -620 + bob], [-54, -760 + bob],
    ];
    out.push({ d: smoothClosed(coat, 0.8), fill: d.coat, line: d.line });
    out.push({ d: smoothClosed([[-54, -760 + bob], [-20, -740 + bob], [-24, -500], [-66 + sway, -360], [-70 + sway, -470], [-58, -620 + bob]], 0.8), fill: d.coatShade, line: null, op: 0.6 });
    out.push(L(smoothOpen([[40, -720 + bob], [48 + sway, -540], [60 + sway * 1.2, -358]]), d.line, 1.4, 0.55));
    out.push(L(smoothOpen([[20, -520 + bob], [52, -512 + bob]]), d.line, 1.6, 0.6));
  }
  // 前臂
  arm(phase + Math.PI, false, !!opts.holdNear);
  // 头（侧面，朝右）
  // 头发比身体慢半拍：身体往上时发梢还在往下
  const hairSwing: P = [-8 * stride, (walkBob(phase - 1.1, stride) - walkBob(phase, stride)) * 1.4];
  out.push(...profileHead(d, [shoulder[0] + 6, shoulder[1] - (f ? 124 : 134)], (f ? 1 : 1.05) * HEAD_K, 0.8, hairSwing));
  return out;
};

export const WalkFigure: React.FC<{ phase: number; design: Design; x: number; y: number; scale: number; stride?: number; filter?: string; opacity?: number; holdNear?: boolean }> = ({
  phase,
  design,
  x,
  y,
  scale,
  stride = 1,
  filter,
  opacity,
  holdNear,
}) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
    <TShapes shapes={walkShapes(phase, design, stride, 1, { holdNear })} line={design.line} lw={design.lw} filter={filter} paint />
  </g>
);

/** 侧面头部（朝右）。center 为头部中心（局部坐标），f=女/m=男 */
export const profileHead = (d: Design, center: P, k = 1, eyeOpen = 0.8, hairSwing: P = [0, 0]): Shape[] => {
  const f = d.sex === "f";
  const [cx, cy] = center;
  const T = (pts: P[]): P[] => pts.map(([x, y]) => [cx + x * k, cy + y * k] as P);
  const out: Shape[] = [];
  // 脖子
  out.push({ d: smoothClosed(T([[-18, 30], [8, 34], [12, 96], [-22, 96]]), 0.6), fill: d.look.skinShade, line: d.line });
  // 女：后发垂到肩上（在脸后面）
  // 后发：发梢随步伐向后甩、上下颠（hairSwing 只作用在下半段）
  const swing = (pts: P[]) => pts.map(([x, y]) => [x + hairSwing[0] * Math.max(0, (y - 10) / 70), y + hairSwing[1] * Math.max(0, (y - 10) / 70)] as P);
  if (f) out.push({ d: smoothClosed(T(swing([[-46, -20], [-50, 30], [-40, 72], [-14, 78], [0, 40], [-6, -10]])), 0.8), fill: d.look.hair, line: d.line });
  // 脸与后脑
  const face: P[] = [
    [-40, -24], [-30, -50], [-4, -60], [24, -52], [36, -34], [40, -14], [43, -2], [52, 12], [46, 18], [45, 24], [47, 29], [44, 32], [45, 36], [40, 46], [24, 54], [4, 50], [-12, 38], [-30, 20],
  ];
  out.push({ d: smoothClosed(T(face), 0.7), fill: d.look.skin, line: d.line });
  // 耳
  out.push({ d: smoothClosed(T([[-8, -4], [4, -8], [6, 10], [-4, 18], [-10, 8]]), 0.9), fill: d.look.skin, line: d.line });
  // 眼、眉、嘴
  const eh = 4 * eyeOpen;
  out.push(L(smoothOpen(T([[22, -4], [28, -6 - eh], [35, -4]])), d.look.line, 2.4 * k));
  if (eyeOpen > 0.2) out.push({ d: smoothClosed(T([[25, -5], [31, -6 - eh * 0.6], [34, -4], [30, -2]]), 0.8), fill: "#1c1f24", line: null });
  out.push(L(smoothOpen(T([[20, -16], [30, -19], [38, -15]])), d.look.hair, (f ? 2.4 : 3.4) * k));
  out.push(L(smoothOpen(T([[38, 31], [44, 30]])), d.look.line, 1.8 * k, 0.8));
  if (d.look.blush) out.push({ d: smoothClosed(T([[16, 14], [26, 10], [30, 18], [20, 22]]), 0.9), fill: d.look.blush, line: null, op: 0.4 });
  // 前发 / 刘海
  out.push({
    d: smoothClosed(T(f ? [[-48, -8], [-46, -40], [-24, -62], [8, -66], [34, -50], [40, -30], [30, -26], [18, -36], [0, -28], [-10, 0], [-24, 12]] : [[-44, 0], [-46, -36], [-26, -60], [6, -66], [32, -54], [42, -34], [32, -30], [24, -38], [10, -34], [-4, -26], [-18, -8]]), 0.85),
    fill: d.look.hair,
    line: d.line,
  });
  out.push(L(smoothOpen(T([[-20, -54], [6, -58], [24, -48]])), d.look.hairLit, 2.6 * k, 0.6));
  return out;
};
