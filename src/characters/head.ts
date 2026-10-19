import { P, smoothClosed, smoothOpen } from "../lib/geom";
import { Shape, S, L } from "../draw/Shape";

/**
 * 正面（可小角度转头）的头部绘制。
 * 坐标以头部中心为原点：头顶约 y=-62，下巴约 y=+60。
 * 转头采用椭球投影：五官 x = R·sin(θ + yaw)，轮廓保持，下颌随转向偏移。
 */
export type HeadPose = {
  /** -1..1，正值向画面右侧转 */
  turn: number;
  /** -1..1，正值低头 */
  pitch: number;
  /** 眼睛睁开程度 0..1 */
  eyeOpen: number;
  /** 眼珠水平偏移 -1..1 */
  gaze: number;
  /** 眉头上扬（忧伤）0..1 */
  brow: number;
  /** 嘴角 -1 下垂 .. 1 上扬 */
  mouth: number;
};

export const HEAD_NEUTRAL: HeadPose = { turn: 0, pitch: 0, eyeOpen: 1, gaze: 0, brow: 0, mouth: 0 };

export type HeadLook = {
  sex: "m" | "f";
  skin: string;
  skinShade: string;
  hair: string;
  hairLit: string;
  line: string;
  lips: string;
  blush?: string;
  /** 光从哪边来 -1 左 / 1 右 */
  light: number;
};

const YAW_MAX = 0.62;

export const headShapes = (pose: HeadPose, look: HeadLook): { back: Shape[]; front: Shape[] } => {
  const f = look.sex === "f";
  const R = f ? 44 : 47;
  const yaw = pose.turn * YAW_MAX;
  const p = pose.pitch;
  const proj = (theta: number, r = R) => r * Math.sin(theta + yaw);
  const facing = (theta: number) => Math.cos(theta + yaw);

  // ---------- 轮廓 ----------
  const chinY = (f ? 55 : 60) - p * 3;
  const jawShift = pose.turn * (f ? 9 : 11);
  const raw: P[] = f
    ? [
        [0, -58], [28, -54], [41, -38], [44, -14], [43, 6], [38, 24], [29, 39], [16, 50], [6, chinY - 1], [0, chinY],
        [-6, chinY - 1], [-16, 50], [-29, 39], [-38, 24], [-43, 6], [-44, -14], [-41, -38], [-28, -54],
      ]
    : [
        [0, -62], [30, -57], [44, -40], [47, -14], [46, 6], [42, 26], [33, 42], [20, 54], [7, chinY - 1], [0, chinY],
        [-7, chinY - 1], [-20, 54], [-33, 42], [-42, 26], [-46, 6], [-47, -14], [-44, -40], [-30, -57],
      ];
  const face: P[] = raw.map(([x, y]) => {
    const k = y > 8 ? (y - 8) / 52 : 0;
    // 远侧下颌收窄，近侧略放宽
    const side = Math.sign(x) === Math.sign(pose.turn) ? 1 - 0.1 * Math.abs(pose.turn) * k : 1 + 0.04 * Math.abs(pose.turn) * k;
    return [x * side + jawShift * k, y];
  });
  const faceD = smoothClosed(face, 1);

  const back: Shape[] = [];
  const front: Shape[] = [];

  // ---------- 女性后发（在脸后面） ----------
  if (f) {
    const bx = -pose.turn * 6;
    const backHair: P[] = [
      [-54 + bx, -36], [-60 + bx, 0], [-62 + bx, 40], [-60 + bx, 78], [-50 + bx, 98], [-30, 100], [0, 96], [30, 100],
      [50 + bx, 98], [60 + bx, 78], [62 + bx, 40], [60 + bx, 0], [54 + bx, -36], [42, -62], [18, -74], [-18, -74], [-42, -62],
    ];
    back.push(S(smoothClosed(backHair), look.hair, look.line));
  }

  // ---------- 耳朵 ----------
  for (const s of [-1, 1] as const) {
    const th = (s * Math.PI) / 2;
    const vis = facing(th);
    if (vis < -0.18) continue;
    const ex = proj(th) - s * 2;
    const ey = f ? 2 : 0;
    const w = 9 + 4 * Math.max(0, vis);
    const ear: P[] = [
      [ex, ey - 14], [ex + s * w, ey - 10], [ex + s * (w + 1), ey + 2], [ex + s * (w - 2), ey + 14], [ex, ey + 16],
    ];
    if (!f) front.push(S(smoothClosed(ear), look.skin, look.line));
    else back.push(S(smoothClosed(ear), look.skin, look.line));
  }

  // ---------- 脸 ----------
  front.push({ d: faceD, fill: look.skin, line: look.line });
  // 背光侧阴影：沿轮廓的新月形，两端收尖
  {
    const sd = -look.light;
    const top = -40;
    const bottom = chinY - 4;
    const side = face.filter(([x, y]) => x * sd > 4 && y > top && y < bottom);
    if (side.length > 2) {
      side.sort((a, b) => a[1] - b[1]);
      const inner = [...side].reverse().map(([x, y]) => {
        const k = Math.sin((Math.PI * (y - top)) / (bottom - top));
        return [x - sd * (3 + 13 * k), y] as P;
      });
      front.push({ d: smoothClosed([[side[0][0], top], ...side, ...inner], 0.9), fill: look.skinShade, line: null, op: 0.5 });
    }
    // 下巴下方的阴影
    front.push({ d: ellipse(jawShift, chinY - 6, 14, 5), fill: look.skinShade, line: null, op: 0.25 });
  }
  if (look.blush) {
    for (const s of [-1, 1] as const) {
      const cx = proj(s * 0.62, R - 8);
      const vis = facing(s * 0.62);
      if (vis < 0.2) continue;
      const rx = 9 * vis + 2;
      front.push({ d: ellipse(cx, 18 + p * 5, rx, 6), fill: look.blush, line: null, op: 0.45 });
    }
  }

  // ---------- 五官 ----------
  const eyeY = (f ? 0 : -2) + p * 7;
  const eyeTheta = f ? 0.5 : 0.47;
  const eyeW = f ? 18 : 17;
  for (const s of [-1, 1] as const) {
    const th = s * eyeTheta;
    const vis = facing(th);
    if (vis < 0.12) continue;
    const cx = proj(th);
    const w = eyeW * Math.max(0.35, vis);
    const open = Math.max(0, Math.min(1, pose.eyeOpen - p * 0.25));
    const h = (f ? 7.5 : 6.2) * open;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    // 上眼睑
    const lid = smoothOpen(
      [
        [x0, eyeY + 1],
        [cx - w * 0.15, eyeY - h - 1.5],
        [cx + w * 0.2, eyeY - h - 1],
        [x1, eyeY + (f ? 0 : 1)],
      ],
      1
    );
    // 虹膜：裁在眼眶开口内，上眼睑会盖住虹膜上缘
    if (open > 0.12) {
      const ir = f ? 5.6 : 5.0;
      const gx = cx + pose.gaze * w * 0.2;
      const opening = smoothClosed(
        [
          [x0, eyeY + 1],
          [cx - w * 0.15, eyeY - h - 1.2],
          [cx + w * 0.2, eyeY - h - 0.8],
          [x1, eyeY + (f ? 0 : 1)],
          [cx + w * 0.15, eyeY + 3.6],
          [cx - w * 0.2, eyeY + 3.4],
        ],
        0.9
      );
      front.push({ d: opening, fill: "#d9d2c6", line: null, op: 0.32 });
      front.push({ d: ellipse(gx, eyeY - 0.6, ir * Math.max(0.55, vis), ir), fill: "#1c1f24", line: null, clip: opening });
      front.push({ d: ellipse(gx + 1.5, eyeY - 2.4, 1.1, 1.1), fill: "#ece6da", line: null, op: 0.7, clip: opening });
    }
    front.push(L(lid, look.line, f ? 2.6 : 2.4));
    if (f) {
      // 外眼角睫毛
      const ox = s > 0 ? x1 : x0;
      front.push(L(`M${ox},${eyeY + 0.5} l${s * 4},${-3}`, look.line, 2));
    }
    // 下眼睑（很淡）
    if (open > 0.3) front.push(L(smoothOpen([[x0 + 3, eyeY + 3], [cx, eyeY + 4.5], [x1 - 3, eyeY + 3]]), look.line, 1.1, 0.35));
    // 眉
    const by = eyeY - (f ? 15 : 14) - p * 2;
    const bw = (f ? 20 : 22) * Math.max(0.4, vis);
    const inner = cx - (s * bw) / 2;
    const outer = cx + (s * bw) / 2;
    const worry = pose.brow;
    const bd = smoothOpen([
      [inner, by + 1 - worry * 3.5],
      [cx, by - (f ? 2.5 : 1.5) - worry * 1.5],
      [outer, by + (f ? 1 : 0.5) + worry * 1.5],
    ]);
    front.push(L(bd, look.hair, f ? 2.4 : 3.6, 0.95));
  }
  // 鼻
  {
    const nx = proj(0, R + 5);
    const ny = (f ? 17 : 19) + p * 6;
    const side = pose.turn >= 0 ? -1 : 1; // 鼻梁线画在远离光的一侧
    const d = smoothOpen([
      [nx + side * 3, ny - 15],
      [nx + side * 4, ny - 5],
      [nx + side * 1, ny],
    ]);
    front.push(L(d, look.line, 1.6, 0.55));
    front.push(L(smoothOpen([[nx - 4, ny + 1.5], [nx, ny + 3], [nx + 4, ny + 1.5]]), look.line, 1.6, 0.6));
  }
  // 嘴
  {
    const mx = proj(0, R - 1);
    const my = (f ? 33 : 36) + p * 5;
    const mw = (f ? 15 : 17) * Math.max(0.6, facing(0));
    const c = pose.mouth;
    if (f) {
      front.push({
        d: smoothClosed([
          [mx - mw / 2, my],
          [mx, my - 1.5],
          [mx + mw / 2, my],
          [mx + mw * 0.2, my + 4],
          [mx - mw * 0.2, my + 4],
        ]),
        fill: look.lips,
        line: null,
        op: 0.7,
      });
    }
    front.push(
      L(
        smoothOpen([
          [mx - mw / 2, my - c * 2.2],
          [mx - mw * 0.15, my + c * 0.8],
          [mx + mw * 0.15, my + c * 0.8],
          [mx + mw / 2, my - c * 2.2],
        ]),
        look.line,
        1.9,
        0.85
      )
    );
  }

  // ---------- 前发 ----------
  const fs = Math.sin(yaw) * (f ? 30 : 34); // 刘海随转头的偏移
  const lx = look.light > 0 ? 1 : -1;
  if (!f) {
    const hair: P[] = [
      [-47, -4], [-51, -24], [-55, -46], [-48, -67], [-31, -81], [-9, -88], [15, -87], [35, -79], [50, -62], [55, -40], [52, -18], [47, -6],
      // 刘海（右→左）：长短不一的几缕，略向右扫
      [46 + fs * 0.4, -34], [43 + fs * 0.6, -23], [36 + fs * 0.8, -31], [28 + fs, -15], [20 + fs, -31], [12 + fs, -24],
      [4 + fs, -37], [-7 + fs * 0.95, -19], [-14 + fs * 0.9, -35], [-24 + fs * 0.8, -27], [-32 + fs * 0.6, -38], [-41 + fs * 0.4, -25], [-46, -27],
    ];
    front.push(S(smoothClosed(hair, 0.8), look.hair, look.line));
    // 发丝高光
    front.push(L(smoothOpen([[lx * 6, -84], [lx * 30, -76], [lx * 46, -56]]), look.hairLit, 3.2, 0.75));
    front.push(L(smoothOpen([[-18 + fs * 0.5, -72], [-8 + fs * 0.8, -54], [0 + fs, -40]]), look.hairLit, 1.5, 0.5));
    front.push(L(smoothOpen([[12 + fs * 0.5, -74], [20 + fs * 0.8, -56], [26 + fs, -42]]), look.hairLit, 1.5, 0.45));
  } else {
    // 侧分刘海：发缝在画面左侧，刘海向右扫
    const cap: P[] = [
      [-47, 8], [-52, -20], [-50, -48], [-38, -67], [-20, -77], [4, -79], [28, -73], [44, -59], [52, -37], [52, -9], [48, 12],
      [44 + fs * 0.3, 2], [40 + fs * 0.5, -12], [30 + fs * 0.7, -22], [16 + fs * 0.85, -28], [2 + fs, -31], [-12 + fs * 0.9, -36],
      [-24 + fs * 0.6, -45], [-34 + fs * 0.4, -38], [-42, -24], [-46, -6],
    ];
    front.push(S(smoothClosed(cap, 0.85), look.hair, look.line));
    // 两侧垂发
    const locks: P[][] = [
      [[-52, -18], [-58, 18], [-59, 50], [-53, 76], [-45, 60], [-42, 26], [-44, -4]],
      [[48, -4], [56, 20], [58, 50], [53, 74], [45, 58], [42, 28], [42, 8]],
    ];
    for (const lock of locks) front.push(S(smoothClosed(lock.map(([x, y]) => [x + fs * 0.2, y] as P), 0.9), look.hair, look.line));
    front.push(L(smoothOpen([[lx * 4, -74], [lx * 26, -67], [lx * 44, -48]]), look.hairLit, 3.2, 0.7));
    front.push(L(smoothOpen([[-18 + fs * 0.5, -66], [0 + fs * 0.8, -46], [24 + fs * 0.8, -30]]), look.hairLit, 1.4, 0.5));
    front.push(L(smoothOpen([[-30 + fs * 0.5, -56], [-14 + fs * 0.8, -40], [8 + fs * 0.9, -32]]), look.hairLit, 1.2, 0.4));
  }

  return { back, front };
};

export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 ${-rx * 2},0Z`;
