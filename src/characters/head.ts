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
  /** 头发被风吹得往一侧摆（-1..1，正值向画面右侧）；越靠近发梢摆得越多 */
  sway?: number;
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
    const sw = (pose.sway ?? 0) * 7;
    /** 后发的点：越往下（发梢）摆得越多 */
    const hs = (pts: P[]): P[] => pts.map(([x, y]) => [x + sw * Math.max(0, Math.min(1, (y - 10) / 90)) ** 1.5, y] as P);
    const backHair: P[] = [
      [-54 + bx, -36], [-60 + bx, 0], [-62 + bx, 40], [-62 + bx, 78], [-57 + bx, 100], [-46, 97], [-38, 102], [-28, 96], [0, 94], [28, 96], [38, 102], [46, 97],
      [57 + bx, 100], [62 + bx, 78], [62 + bx, 40], [60 + bx, 0], [54 + bx, -36], [42, -62], [18, -74], [-18, -74], [-42, -62],
    ];
    back.push(S(smoothClosed(hs(backHair), 0.9), look.hair, look.line));
    // 后发的发丝
    for (const sx of [-1, 1]) back.push(L(smoothOpen([[sx * 50 + bx, -20], [sx * 56 + bx, 30], [sx * 55 + bx, 80]]), look.hairLit, 1.2, 0.3));
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
      const rx = 6.5 * vis + 2;
      front.push({ d: ellipse(cx, 19 + p * 5, rx, 4.2), fill: look.blush, line: null, op: 0.3 });
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
    const h = (f ? 7.2 : 6.0) * open;
    // 内眼角（靠鼻梁）、外眼角
    const xi = cx - (s * w) / 2;
    const xo = cx + (s * w) / 2;
    // 杏仁形：上眼睑的高点偏外侧，外眼角略高于内眼角
    const upper: P[] = [
      [xi, eyeY + 1.2],
      [cx - s * w * 0.18, eyeY - h - 1.1],
      [cx + s * w * 0.2, eyeY - h - 1.3],
      [xo, eyeY - 0.3],
    ];
    const lower: P[] = [
      [cx + s * w * 0.16, eyeY + h * 0.5 + 1.8],
      [cx - s * w * 0.2, eyeY + h * 0.45 + 2.1],
    ];
    if (open > 0.12) {
      const opening = smoothClosed([...upper, ...lower], 0.9);
      const ir = (f ? 5.4 : 4.9) * Math.max(0.45, Math.min(1, h / 5.5));
      const gx = cx + pose.gaze * w * 0.2;
      const sx = Math.max(0.6, vis);
      // 眼白（很淡的暖灰，上缘被眼睑压出一点阴影）
      front.push({ d: opening, fill: look.light < 0 ? "#f3eadb" : "#e6e0d6", line: null, op: 0.92 });
      front.push({ d: smoothOpen(upper, 1), fill: undefined, line: look.skinShade, lw: 2.6, op: 0.55, clip: opening });
      // 虹膜：外圈深、下半圈透一点暖棕；瞳孔；高光
      front.push({ d: ellipse(gx, eyeY + 0.3, (ir + 0.4) * sx, ir + 0.6), fill: f ? "#33261f" : "#25221f", line: null, clip: opening });
      front.push({ d: ellipse(gx, eyeY + ir * 0.38, ir * 0.72 * sx, ir * 0.55), fill: f ? "#7a5a42" : "#5d4a3a", line: null, op: 0.55, clip: opening });
      front.push({ d: ellipse(gx, eyeY + 0.3, ir * 0.45 * sx, ir * 0.48), fill: "#0f1113", line: null, clip: opening });
      front.push({ d: ellipse(gx + 1.7, eyeY - 2.0, 1.45, 1.45), fill: "#fbf6ec", line: null, op: 0.92, clip: opening });
      front.push({ d: ellipse(gx - 1.6, eyeY + 2.2, 0.7, 0.7), fill: "#fbf6ec", line: null, op: 0.5, clip: opening });
    }
    // 上眼睑：整条细线 + 外侧 2/3 加粗（睫毛的重量），女主外眼角带一点上扬
    front.push(L(smoothOpen(upper, 1), look.line, 1.5, 0.9));
    // 女主外眼角带一点点上扬（睫毛），男主不加
    const lash: P[] = f ? [[xo + s * 1.8, eyeY - 1.2]] : [];
    front.push(L(smoothOpen([[cx - s * w * 0.06, eyeY - h - 1.3], [cx + s * w * 0.26, eyeY - h - 1.1], [xo, eyeY - 0.3], ...lash], 0.6), look.line, f ? 2.9 : 2.5, 0.95));
    if (open > 0.3) {
      // 双眼皮的褶线（很淡）、下眼睑外半段
      front.push(L(smoothOpen([[cx - s * w * 0.28, eyeY - h - 3.8], [cx + s * w * 0.12, eyeY - h - 4.6], [xo - s * 1.2, eyeY - h * 0.45 - 3.0]], 1), look.line, 1.1, 0.3));
      front.push(L(smoothOpen([[cx + s * w * 0.02, eyeY + h * 0.48 + 2.4], [xo - s * 1.0, eyeY + 0.6]], 1), look.line, 1.0, 0.3));
    }
    // 眉：笔刷形，眉头粗、眉尾细
    const by = eyeY - (f ? 15 : 14) - p * 2;
    const bw = (f ? 20 : 22) * Math.max(0.4, vis);
    const inner = cx - (s * bw) / 2;
    const outer = cx + (s * bw) / 2;
    const worry = pose.brow;
    const t0 = f ? 1.4 : 2.0; // 眉头半宽
    const iy = by + 1 - worry * 3.5;
    const my = by - (f ? 2.5 : 1.5) - worry * 1.5;
    const oy = by + (f ? 1 : 0.5) + worry * 1.5;
    front.push({
      d: smoothClosed([
        [inner, iy - t0],
        [cx, my - t0 * 0.8],
        [outer, oy],
        [cx, my + t0 * 0.7],
        [inner, iy + t0],
      ], 0.7),
      fill: look.hair,
      line: null,
      op: 0.92,
    });
  }
  // 鼻：背光一侧一小块阴影（鼻梁到鼻翼），鼻底一笔
  {
    const nx = proj(0, R + 5);
    const ny = (f ? 17 : 19) + p * 6;
    const side = pose.turn >= 0 ? -1 : 1;
    front.push({ d: smoothClosed([[nx + side * 1.5, ny - 16], [nx + side * 4.5, ny - 6], [nx + side * 5, ny + 1], [nx + side * 1.5, ny + 1.5], [nx + side * 2.2, ny - 8]], 0.8), fill: look.skinShade, line: null, op: 0.45 });
    front.push(L(smoothOpen([[nx - 4.5, ny + 1], [nx - 1.5, ny + 2.8], [nx + 1.5, ny + 2.8], [nx + 4.5, ny + 1]]), look.line, 1.4, 0.55));
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
    // 侧分短发：发缝在画面左侧，刘海是几缕朝右扫的发绺，发梢圆润，越往右越长（不是锯齿）
    const fringe: P[] = [
      [47, -8], [44 + fs * 0.45, -20], [38 + fs * 0.6, -27], [30 + fs * 0.75, -26], [23 + fs * 0.85, -31], [15 + fs, -29],
      [7 + fs, -33], [-1 + fs * 0.9, -36], [-9 + fs * 0.8, -35], [-17 + fs * 0.65, -40], [-27 + fs * 0.45, -44], [-38, -38], [-46, -22],
    ].map(([x, y], i, arr) => [x + (i > 0 && i < arr.length - 1 ? (pose.sway ?? 0) * 1.6 : 0), y] as P);
    const hair: P[] = [
      [-47, -4], [-51, -24], [-54, -46], [-47, -67], [-30, -81], [-8, -88], [16, -86], [35, -78], [50, -61], [55, -40], [53, -18], [48, -4],
      ...fringe,
    ];
    // 刘海在额头上投下的一道影子（刘海形状往下挪一点，裁在脸里）
    front.push({ d: smoothClosed([[-46, -14], ...fringe.map(([x, y]) => [x + 1, y + 6] as P).reverse(), [47, 2], [47, -60], [-47, -60]], 0.85), fill: look.skinShade, line: null, op: 0.42, clip: faceD });
    front.push(S(smoothClosed(hair, 0.85), look.hair, look.line));
    // 发丝：从发缝顺着发流扫到每一缕发梢
    const part: P = [-20, -82];
    for (const [tx, ty] of [fringe[1], fringe[3], fringe[5], fringe[7]]) {
      front.push(L(smoothOpen([part, [part[0] + (tx - part[0]) * 0.45 + 6, -68], [tx - 4, ty - 10]]), look.hairLit, 1.2, 0.4));
    }
    // 头顶的一道柔和高光
    front.push(L(smoothOpen([[-26 * lx, -76], [0, -84], [24 * lx, -79], [42 * lx, -62]]), look.hairLit, 5, 0.32));
    front.push(L(smoothOpen([[-12 * lx, -80], [8 * lx, -84], [26 * lx, -78]]), look.hairLit, 2, 0.5));
  } else {
    // 侧分刘海：发缝在画面左侧，刘海向右扫
    const capEdge: P[] = [
      [44 + fs * 0.3, 2], [40 + fs * 0.5, -12], [30 + fs * 0.7, -22], [16 + fs * 0.85, -28], [2 + fs, -31], [-12 + fs * 0.9, -36],
      [-24 + fs * 0.6, -45], [-34 + fs * 0.4, -38], [-42, -24], [-46, -6],
    ];
    const cap: P[] = [[-47, 8], [-52, -20], [-50, -48], [-38, -67], [-20, -77], [4, -79], [28, -73], [44, -59], [52, -37], [52, -9], [48, 12], ...capEdge];
    // 刘海在额头上的影子
    front.push({ d: smoothClosed([...capEdge.map(([x, y]) => [x + 1, y + 6] as P), [-47, -60], [48, -60]], 0.85), fill: look.skinShade, line: null, op: 0.4, clip: faceD });
    front.push(S(smoothClosed(cap, 0.85), look.hair, look.line));
    // 两侧垂发：细长的几缕，发尾收尖，不描轮廓（和后发连成一片）
    const locks: P[][] = [
      [[-52, -18], [-58, 16], [-60, 50], [-57, 82], [-51, 100], [-47, 78], [-43, 44], [-43, 6]],
      [[48, -4], [56, 22], [59, 52], [56, 84], [51, 100], [46, 76], [42, 42], [42, 10]],
    ];
    for (const lock of locks) {
      // 垂发：发根不动，发梢随风摆
      const sw = (pose.sway ?? 0) * 6;
      const pts = lock.map(([x, y]) => [x + fs * 0.2 + sw * Math.max(0, Math.min(1, (y + 10) / 110)) ** 1.5, y] as P);
      front.push({ d: smoothClosed(pts, 0.9), fill: look.hair, line: null });
      front.push(L(smoothOpen([pts[0], pts[2], pts[4]].map(([x, y]) => [x + (x < 0 ? 4 : -4), y] as P)), look.hairLit, 1.1, 0.35));
    }
    front.push(L(smoothOpen([[lx * 4, -74], [lx * 26, -67], [lx * 44, -48]]), look.hairLit, 4.5, 0.3));
    front.push(L(smoothOpen([[lx * 10, -73], [lx * 26, -68], [lx * 38, -56]]), look.hairLit, 2, 0.5));
    front.push(L(smoothOpen([[-18 + fs * 0.5, -66], [0 + fs * 0.8, -46], [24 + fs * 0.8, -30]]), look.hairLit, 1.3, 0.45));
    front.push(L(smoothOpen([[-30 + fs * 0.5, -56], [-14 + fs * 0.8, -40], [8 + fs * 0.9, -32]]), look.hairLit, 1.1, 0.38));
  }

  return { back, front };
};

export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 ${-rx * 2},0Z`;
