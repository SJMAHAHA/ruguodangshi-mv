import React from "react";
import { P, ik2, limb, smoothClosed, smoothOpen } from "../lib/geom";
import { Shape, L } from "../draw/Shape";
import { Design, TShapes, handShapes } from "./front";

/**
 * 侧身行走（面朝画面右侧），男女共用。局部坐标：原点 = 两脚之间的地面，y 向下为正。
 * phase：步态相位（弧度），每 2π 走两步。holdNear：近侧的手提着东西（手臂几乎不摆）。
 */
export type WalkOpts = { holdNear?: boolean };

const walkBody = (phase: number, d: Design, stride: number) => {
  const f = d.sex === "f";
  const bob = -Math.abs(Math.cos(phase)) * 8 * stride;
  const shoulder: P = [6, (f ? -800 : -862) + bob];
  return { f, bob, shoulder };
};

/** 近侧手腕的位置（给提在手里的花束定位） */
export const walkNearHand = (phase: number, d: Design, stride = 1, opts: WalkOpts = {}): { wrist: P; angle: number } => {
  const { shoulder } = walkBody(phase, d, stride);
  const f = d.sex === "f";
  const ph = phase + Math.PI;
  const amp = opts.holdNear ? 6 : 22;
  const sw = (Math.sin(ph) * amp * Math.PI) / 180;
  const up = f ? 134 : 150;
  const lo = f ? 120 : 136;
  const elbow: P = [shoulder[0] + Math.sin(sw) * up, shoulder[1] + Math.cos(sw) * up];
  const sw2 = sw + ((opts.holdNear ? 4 : 8 + Math.max(0, Math.sin(ph)) * 18) * Math.PI) / 180;
  const wrist: P = [elbow[0] + Math.sin(sw2) * lo, elbow[1] + Math.cos(sw2) * lo];
  return { wrist, angle: (-sw2 * 180) / Math.PI };
};

export const walkShapes = (phase: number, d: Design, stride = 1, armSwing = 1, opts: WalkOpts = {}): Shape[] => {
  const out: Shape[] = [];
  const { f, bob, shoulder } = walkBody(phase, d, stride);
  const hip: P = [0, (f ? -506 : -520) + bob];
  const thigh = f ? 228 : 240;
  const shin = f ? 230 : 240;
  const leg = (ph: number, back: boolean) => {
    const swing = Math.sin(ph) * 12 * stride; // 大腿摆角（度）
    const lift = Math.max(0, Math.sin(ph + 1.3)) * 40 * stride; // 抬脚时屈膝
    const a = ((90 - swing) * Math.PI) / 180;
    // 先给出脚踝目标，再用 IK 求膝盖（膝盖朝前）
    const footX = Math.cos(a) * (thigh + shin) * 0.98 + (back ? -4 : 4);
    const footY = hip[1] + Math.sin(a) * (thigh + shin) * 0.98 - lift;
    const ankle: P = [footX, Math.min(-12, footY)];
    const knee = ik2(hip, ankle, thigh, shin, -1);
    const col = back ? d.legsShade : d.legs;
    out.push({ d: limb(hip, knee, f ? 66 : 80, f ? 48 : 60, 4), fill: col, line: d.line });
    out.push({ d: limb(knee, ankle, f ? 46 : 58, f ? 30 : 46, 3), fill: col, line: d.line });
    const toe = Math.max(-0.35, Math.min(0.5, -Math.cos(ph) * 0.4 * stride));
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
    const amp = hold ? 6 : 22 * armSwing;
    const sw = (Math.sin(ph) * amp * Math.PI) / 180;
    const up = f ? 134 : 150;
    const lo = f ? 120 : 136;
    const elbow: P = [shoulder[0] + Math.sin(sw) * up, shoulder[1] + Math.cos(sw) * up];
    const sw2 = sw + ((hold ? 4 : 8 + Math.max(0, Math.sin(ph)) * 18 * armSwing) * Math.PI) / 180;
    const wrist: P = [elbow[0] + Math.sin(sw2) * lo, elbow[1] + Math.cos(sw2) * lo];
    out.push({ d: limb(shoulder, elbow, f ? 42 : 52, f ? 36 : 44, 2), fill: back ? d.coatShade : d.coat, line: d.line });
    out.push({ d: limb(elbow, wrist, f ? 36 : 44, f ? 30 : 38, 1), fill: back ? d.coatShade : d.coat, line: d.line });
    const dir = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
    out.push(...handShapes(wrist, (dir * 180) / Math.PI - 90, { at: wrist, curl: hold ? 0.8 : 0.4 }, d, 1));
  };
  arm(phase, true, false);
  const sway = Math.sin(phase * 2) * 6 * stride;
  if (f) {
    // 风衣（侧面），下摆随步子摆动
    const coat: P[] = [
      [shoulder[0] - 34, shoulder[1] + 6], [shoulder[0] + 20, shoulder[1] - 6], [46, -744 + bob], [36, -662 + bob], [46, -600 + bob],
      [64 + sway, -430], [90 + sway * 1.6, -200], [24 + sway, -186], [-44 + sway, -188], [-76 + sway * 1.4, -196], [-62 + sway, -430], [-44, -580 + bob], [-42, -706 + bob],
    ];
    out.push({ d: smoothClosed(coat, 0.8), fill: d.coat, line: d.line });
    out.push({ d: smoothClosed([[-42, -706 + bob], [-14, -692 + bob], [-18, -440], [-64 + sway, -220], [-62 + sway, -430], [-44, -580 + bob]], 0.8), fill: d.coatShade, line: null, op: 0.6 });
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
  out.push(...profileHead(d, [shoulder[0] + 6, shoulder[1] - (f ? 120 : 130)], f ? 1 : 1.05));
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
    <TShapes shapes={walkShapes(phase, design, stride, 1, { holdNear })} line={design.line} lw={design.lw} filter={filter} />
  </g>
);

/** 侧面头部（朝右）。center 为头部中心（局部坐标），f=女/m=男 */
export const profileHead = (d: Design, center: P, k = 1, eyeOpen = 0.8): Shape[] => {
  const f = d.sex === "f";
  const [cx, cy] = center;
  const T = (pts: P[]): P[] => pts.map(([x, y]) => [cx + x * k, cy + y * k] as P);
  const out: Shape[] = [];
  // 脖子
  out.push({ d: smoothClosed(T([[-18, 30], [8, 34], [12, 96], [-22, 96]]), 0.6), fill: d.look.skinShade, line: d.line });
  // 女：后发垂到肩上（在脸后面）
  if (f) out.push({ d: smoothClosed(T([[-46, -20], [-50, 30], [-40, 72], [-14, 78], [0, 40], [-6, -10]]), 0.8), fill: d.look.hair, line: d.line });
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
