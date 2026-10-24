import React from "react";
import { P, ik2, limb, smoothClosed, smoothOpen, rot, mix } from "../lib/geom";
import { Shape, L, Shapes } from "../draw/Shape";
import { HeadLook, HeadPose, HEAD_NEUTRAL, headShapes, ellipse } from "./head";
import { lerp } from "../lib/anim";

/**
 * 正面坐姿角色（男女共用一套骨架，比例和服装由 Design 决定）。
 * 局部坐标：原点 = 臀部中心落在座面上，y 向下为正；头顶约 y=-500。
 */

export type HandPose = {
  /** 手腕目标位置（局部坐标） */
  at: P;
  /** 手指弯曲 0..1 */
  curl?: number;
  /** 手掌朝向角度修正（度） */
  angle?: number;
  /** 前臂透视缩短 0..1（1=不缩短） */
  fore?: number;
};

export type FrontPose = {
  head: HeadPose;
  headTilt: number; // 度
  headOffset: P; // 头部额外位移（如靠在肩上）
  lean: number; // 上身侧倾（度，正值向右）
  slump: number; // 0..1 塌肩
  stand: number; // 0..1 起身
  shoulderLift: number; // -1..1 正值耸肩
  handL: HandPose; // 画面左侧的手
  handR: HandPose; // 画面右侧的手
  breathe: number; // 0..1
  /** 腿向画面右侧斜放 */
  legSlant: number;
  /** 上身朝向（-1..1，正值转向画面右侧；圆柱投影） */
  bodyTurn?: number;
  /**
   * 上身前倾 0..1（正面看是躯干被压短、肩和头往下沉）。
   * 不给时沿用旧的规则：随 stand 自动前倾一点。起身动作应显式给出：先前倾、再起身、最后挺直。
   */
  bend?: number;
};

export const FRONT_NEUTRAL: FrontPose = {
  head: HEAD_NEUTRAL,
  headTilt: 0,
  headOffset: [0, 0],
  lean: 0,
  slump: 0,
  stand: 0,
  shoulderLift: 0,
  handL: { at: [-52, -26], fore: 0.62 },
  handR: { at: [52, -26], fore: 0.62 },
  breathe: 0,
  legSlant: 0,
};

export type Design = {
  sex: "m" | "f";
  look: HeadLook;
  coat: string;
  coatShade: string;
  coatLit: string;
  inner: string; // 毛衣/内搭
  collar: string; // 衬衫领
  legs: string; // 裤子 / 丝袜
  legsShade: string;
  shoes: string;
  line: string;
  lw: number;
};

type Dim = {
  headY: number;
  neckW: number;
  shoulderTip: number;
  shoulderY: number;
  joint: P;
  upper: number;
  fore: number;
  sleeve: [number, number, number];
  waist: number;
  hip: number;
  kneeX: number;
  kneeY: number;
  ankleX: number;
  ankleY: number;
  shin: [number, number];
  hand: number;
};

/**
 * 比例（按真人量过）：站立时肩在身高 80%、腰 62%、裆 47%，约 7.2 头身；坐着时座面到头顶约为身高的 52%。
 * 坐姿的脚和座面高度不动（与长椅一致），上身比旧版长 30–40、起身抬升从 250 降到 214（腿短一截），
 * 手臂加长到垂手时手腕在裆部高度，头放大 7%。
 */
const DIM: Record<"m" | "f", Dim> = {
  m: {
    headY: -454, neckW: 16, shoulderTip: 104, shoulderY: -336, joint: [90, -320], upper: 162, fore: 142,
    sleeve: [54, 46, 40], waist: 94, hip: 108, kneeX: 58, kneeY: 58, ankleX: 66, ankleY: 250, shin: [56, 44], hand: 1.06,
  },
  f: {
    headY: -438, neckW: 13, shoulderTip: 88, shoulderY: -330, joint: [76, -316], upper: 148, fore: 128,
    sleeve: [44, 38, 32], waist: 68, hip: 100, kneeX: 22, kneeY: 58, ankleX: 18, ankleY: 238, shin: [40, 27], hand: 0.92,
  },
};
/** 起身时臀部抬高多少（站直后裆部在身高 47% 处） */
export const RISE = 214;
/** 头部整体放大 */
export const HEAD_K = 1.07;

/** 前倾时上身（肩、头）最多下沉的像素；显式的 bend 给得更多，才看得出是在前倾发力 */
const forwardSink = (pose: FrontPose) =>
  pose.bend !== undefined ? pose.bend * 95 : Math.sin(Math.PI * Math.min(1, pose.stand * 1.1)) * (pose.stand < 0.92 ? 1 : 0.3) * 30;

const smoothstep = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

export const frontShapes = (pose: FrontPose, d: Design): Shape[] => {
  const D = DIM[d.sex];
  const f = d.sex === "f";
  const out: Shape[] = [];
  const st = smoothstep(pose.stand);
  const fwd = forwardSink(pose); // 前倾时上身下沉的像素
  const rise = -RISE * st;
  const sl = pose.legSlant * (1 - st);
  const leanC: P = [0, rise - 20];
  /** 上半身点：加上起身位移、前倾下沉、侧倾 */
  const bt = (pose.bodyTurn ?? 0) * 0.42;
  const RB = D.shoulderTip + 14;
  const turnX = (x: number, y: number) => {
    if (bt === 0) return x;
    // 越往上转得越多（腰以下几乎不转）
    const k = Math.max(0, Math.min(1, (-y - 20) / 220));
    const c = Math.max(-1, Math.min(1, x / RB));
    return RB * Math.sin(Math.asin(c) + bt * k);
  };
  const U = (p: P, sink = 1): P => rot([turnX(p[0], p[1]), p[1] + rise + fwd * sink * Math.min(1, -p[1] / 300)], pose.lean, leanC);
  const slump = pose.slump * 12 - pose.shoulderLift * 9 - (pose.breathe - 0.5) * 2.4; // 吸气时肩膀微微抬起
  const shY = D.shoulderY + slump;
  const tip = D.shoulderTip;
  const br = pose.breathe * 2.5;

  // ================= 腿 =================
  for (const s of [-1, 1] as const) {
    const kneeSeated: P = [s * D.kneeX + sl * 18, D.kneeY];
    const kneeStand: P = [s * (f ? 26 : 44), D.ankleY - (f ? 226 : 236)];
    const knee = mix(kneeSeated, kneeStand, st);
    const ankle: P = [s * D.ankleX + sl * 40, D.ankleY];
    // 小腿（裤管 / 丝袜）
    out.push({ d: limb(knee, ankle, D.shin[0], D.shin[1], f ? 3 : 1), fill: d.legs, line: d.line });
    if (!f) out.push(L(smoothOpen([[knee[0] + s * 4, knee[1] + 24], [mix(knee, ankle, 0.5)[0] + s * 3, mix(knee, ankle, 0.5)[1]], [ankle[0] + s * 2, ankle[1] - 18]]), d.line, 1.2, 0.35));
    // 小腿受光
    out.push(L(smoothOpen([[knee[0] - s * D.shin[0] * 0.3, knee[1] + 30], [ankle[0] - s * D.shin[1] * 0.3, ankle[1] - 30]]), d.legsShade === d.legs ? d.coatLit : "#ffffff", 3, 0.07));
    // 鞋（鞋尖朝镜头）
    const a = ankle;
    const shoe: P[] = f
      ? [[a[0] - 15, a[1] - 8], [a[0] + 15, a[1] - 8], [a[0] + 17, a[1] + 10], [a[0] + 9, a[1] + 24], [a[0] - 9, a[1] + 24], [a[0] - 17, a[1] + 10]]
      : [[a[0] - 26, a[1] - 2], [a[0] + 26, a[1] - 2], [a[0] + 30, a[1] + 16], [a[0] + 18, a[1] + 31], [a[0] - 18, a[1] + 31], [a[0] - 30, a[1] + 16]];
    out.push({ d: smoothClosed(shoe, 0.8), fill: d.shoes, line: d.line });
    out.push(L(smoothOpen([[a[0] - (f ? 8 : 14), a[1] + (f ? 6 : 10)], [a[0], a[1] + (f ? 4 : 7)], [a[0] + (f ? 8 : 14), a[1] + (f ? 6 : 10)]]), "#ffffff", 2, 0.12));
    // 大腿 / 膝盖（坐姿时朝镜头，被压短）
    const hip: P = [s * (f ? 30 : 44), rise + 6];
    if (st < 0.98) {
      out.push({ d: limb(hip, knee, f ? 62 : 80, f ? 46 : 64, 4), fill: d.legs, line: d.line, op: 1 });
    }
    out.push({ d: ellipse(knee[0] - 4 * s, knee[1] - 6, f ? 10 : 14, f ? 6 : 7), fill: "#ffffff", line: null, op: 0.08 });
  }

  // ================= 脖子 =================
  const headBase: P = U([pose.headOffset[0], D.headY + pose.headOffset[1] + pose.slump * 16]);
  {
    const nw = D.neckW;
    const top: P = [headBase[0], headBase[1] + 40];
    const bot = U([0, shY - 30]);
    const neck: P[] = [[top[0] - nw, top[1] - 8], [top[0] + nw, top[1] - 8], [bot[0] + nw + 2, bot[1] + 6], [bot[0] + nw + 6, bot[1] + 22], [bot[0] - nw - 6, bot[1] + 22], [bot[0] - nw - 2, bot[1] + 6]];
    out.push({ d: smoothClosed(neck, 0.5), fill: d.look.skin, line: d.line });
    out.push({ d: smoothClosed([[top[0] - nw, top[1] - 6], [top[0] + nw, top[1] - 6], [top[0] + nw * 0.7, top[1] + 12], [top[0] - nw * 0.7, top[1] + 12]]), fill: d.look.skinShade, line: null, op: 0.7 });
  }

  // ================= 躯干 =================
  {
    const waist = lerp(D.waist, f ? 60 : D.waist, st);
    const hemSeated = f ? 60 : 54;
    const hemStand = rise + (f ? 300 : 160);
    const hem = lerp(hemSeated, hemStand, st);
    const w = lerp(D.hip, f ? 94 : D.hip - 6, st); // 下摆宽
    const wh = lerp(D.hip, f ? 80 : D.hip - 10, st); // 臀部宽
    // 斜放的腿让下摆从腰部到底边逐渐偏移
    const so = (y: number) => sl * 22 * Math.max(0, Math.min(1, (y + 110) / 170));
    const hy = lerp(-4, hem - 40, st);
    const torso: P[] = [
      U([0, shY - 40]), U([-20, shY - 38]), U([-50, shY - 30]), U([-tip * 0.8, shY - 18]), U([-tip, shY]), U([-tip - 4, shY + 36]),
      U([-tip + 6 - br, shY + 100]), U([-waist, -150]), U([-waist - 4, -80]),
      [-wh + so(hy), hy], [-w + 2 + so(hem), hem - 10], [-w * 0.55 + so(hem), hem + 3], [-14 + so(hem), hem - 1],
      [14 + so(hem), hem - 1], [w * 0.55 + so(hem), hem + 3], [w - 2 + so(hem), hem - 10], [wh + so(hy), hy],
      U([waist + 4, -80]), U([waist, -150]), U([tip - 6 + br, shY + 100]), U([tip + 4, shY + 36]),
      U([tip, shY]), U([tip * 0.8, shY - 18]), U([50, shY - 30]), U([20, shY - 38]),
    ];
    const torsoD = smoothClosed(torso, 0.85);
    out.push({ d: torsoD, fill: d.coat, line: d.line });
    // 背光侧暗部（大块水粉阴影，裁在躯干轮廓内）
    const ls = -d.look.light;
    out.push({
      clip: torsoD,
      d: smoothClosed([U([ls * (tip * 0.6), shY - 10]), U([ls * (tip + 2), shY + 20]), U([ls * (waist + 2), -150]), U([ls * (D.hip - 4), -10]), U([ls * (D.hip - 34), -10]), U([ls * (waist - 26), -140]), U([ls * (tip - 40), shY + 50])], 0.9),
      fill: d.coatShade,
      line: null,
      op: 0.7,
    });
    // 前襟分开处露出的裤/腿
    const gapTop: P = U([f ? 6 : 4, f ? -112 : -36]);
    out.push({
      d: smoothClosed([gapTop, [gapTop[0] + 5 + so(gapTop[1]), lerp(gapTop[1], hem, 0.5)], [11 + so(hem), hem], [-7 + so(hem), hem], [gapTop[0] - 3 + so(gapTop[1]), lerp(gapTop[1], hem, 0.5)]], 0.6),
      fill: d.legsShade,
      line: d.line,
      lw: d.lw * 0.8,
    });
    // 腿间褶皱阴影与衣纹
    out.push({ clip: torsoD, d: smoothClosed([[-w * 0.4 + so(hem), hem - 36], [-w * 0.18 + so(hem), hem - 44], [-w * 0.16 + so(hem), hem], [-w * 0.42 + so(hem), hem + 2]]), fill: d.coatShade, line: null, op: 0.4 });
    out.push(L(smoothOpen([[-w * 0.62 + so(hem), hem - 34], [-w * 0.52 + so(hem), hem - 6]]), d.line, 1.3, 0.4));
    out.push(L(smoothOpen([[w * 0.64 + so(hem), hem - 36], [w * 0.54 + so(hem), hem - 8]]), d.line, 1.3, 0.4));
    // 腰下横向压痕（坐下时衣服在大腿根堆起）
    if (st < 0.5) out.push(L(smoothOpen([[-w * 0.8 + so(0), 2], [-w * 0.3 + so(0), 10], [-16, 8]]), d.line, 1.2, 0.3 * (1 - st * 2)));
    // 受光肩线
    out.push(L(smoothOpen([U([-ls * 30, shY - 34]), U([-ls * (tip * 0.75), shY - 18]), U([-ls * (tip + 2), shY + 6])]), d.coatLit, 3.4, 0.55));
    // 内搭 V 领
    const vBottom = f ? -236 : -244;
    out.push({ d: smoothClosed([U([-22, shY - 36]), U([22, shY - 36]), U([f ? 8 : 6, vBottom]), U([f ? -8 : -6, vBottom])], 0.35), fill: d.inner, line: d.line });
    if (!f) {
      // 衬衫领
      for (const s of [-1, 1] as const)
        out.push({ d: smoothClosed([U([s * 20, shY - 40]), U([s * 4, shY - 24]), U([s * 12, shY - 2]), U([s * 28, shY - 22])], 0.6), fill: d.collar, line: d.line });
      out.push(L(smoothOpen([U([-9, shY - 14]), U([0, shY + 4]), U([9, shY - 14])]), d.line, 1.4, 0.5));
    } else {
      // 高领毛衣领口
      out.push({ d: smoothClosed([U([-18, shY - 42]), U([18, shY - 42]), U([20, shY - 22]), U([-20, shY - 22])], 0.6), fill: d.inner, line: d.line });
    }
    // 翻领
    for (const s of [-1, 1] as const) {
      const lap: P[] = f
        ? [U([s * 22, shY - 38]), U([s * 60, shY - 18]), U([s * 66, shY + 10]), U([s * 52, shY + 4]), U([s * 50, shY + 44]), U([s * 26, shY + 64]), U([s * 9, vBottom])]
        : [U([s * 24, shY - 38]), U([s * 52, shY - 24]), U([s * 50, shY + 4]), U([s * 40, shY + 10]), U([s * 38, shY + 40]), U([s * 18, shY + 50]), U([s * 7, vBottom])];
      out.push({ d: smoothClosed(lap, 0.45), fill: d.coatLit, line: d.line, op: 0.95 });
    }
    // 门襟与纽扣
    out.push(L(smoothOpen([U([f ? 9 : 6, vBottom]), U([f ? 12 : 7, -100]), U([f ? 8 : 5, f ? -112 : -36])]), d.line, d.lw * 0.75, 0.75));
    for (const by of f ? [-200, -165] : [-205, -145, -85]) {
      const b = U([f ? -16 : -14, by]);
      out.push({ d: ellipse(b[0], b[1], 3.6, 3.6), fill: d.coatShade, line: d.line, lw: 1.1 });
      if (f) {
        const b2 = U([f ? 30 : 0, by]);
        out.push({ d: ellipse(b2[0], b2[1], 3.6, 3.6), fill: d.coatShade, line: d.line, lw: 1.1 });
      }
    }
    if (f) {
      // 风衣腰带
      out.push({ d: smoothClosed([U([-waist - 3, -152]), U([waist + 3, -152]), U([waist + 4, -130]), U([-waist - 4, -130])], 0.25), fill: d.coatShade, line: d.line });
      out.push({ d: smoothClosed([U([-14, -155]), U([10, -155]), U([10, -127]), U([-14, -127])], 0.15), fill: "none", line: d.line, lw: 1.5 });
      out.push(L(smoothOpen([U([4, -130]), U([10, -96]), U([6, -70])]), d.line, 2.2, 0.85));
    } else {
      // 口袋
      for (const s of [-1, 1] as const) out.push(L(smoothOpen([U([s * 40, -78]), U([s * 74, -70])]), d.line, 1.6, 0.6));
    }
    // 衣褶
    out.push(L(smoothOpen([U([-waist + 22, -120]), U([-waist + 30, -70]), U([-waist + 22, -24])]), d.line, 1.3, 0.35));
    out.push(L(smoothOpen([U([waist - 20, -110]), U([waist - 26, -60])]), d.line, 1.3, 0.35));
  }

  // ================= 手臂 =================
  const arm = (s: -1 | 1, hp: HandPose) => {
    const J = U([s * D.joint[0], D.joint[1] + slump]);
    const tipP = U([s * (tip + 1), shY + 6]);
    const pit = U([s * (tip - 30), shY + 64]);
    const wrist: P = [hp.at[0], hp.at[1]];
    const foreL = D.fore * (hp.fore ?? 1);
    const elbow = ik2(J, wrist, D.upper, foreL, s === -1 ? 1 : -1);
    const [, w1, w2] = D.sleeve;
    const nrm = (a: P, b: P): P => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      let nx = -dy / l;
      let ny = dx / l;
      if (nx * s < 0) {
        nx = -nx;
        ny = -ny;
      }
      return [nx, ny];
    };
    const n1 = nrm(J, elbow);
    const n2 = nrm(elbow, wrist);
    const ne: P = [(n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2];
    const eo: P = [elbow[0] + ne[0] * w1 * 0.55, elbow[1] + ne[1] * w1 * 0.55];
    const ei: P = [elbow[0] - ne[0] * w1 * 0.45, elbow[1] - ne[1] * w1 * 0.45];
    const wo: P = [wrist[0] + n2[0] * w2 * 0.5, wrist[1] + n2[1] * w2 * 0.5];
    const wi: P = [wrist[0] - n2[0] * w2 * 0.5, wrist[1] - n2[1] * w2 * 0.5];
    const midO: P = [(tipP[0] + eo[0]) / 2 + n1[0] * 4, (tipP[1] + eo[1]) / 2 + n1[1] * 4];
    const midI: P = [(pit[0] + ei[0]) / 2 - n1[0] * 1, (pit[1] + ei[1]) / 2 - n1[1] * 1];
    const inside = U([s * (tip - 40), shY + 20]);
    out.push({ d: smoothClosed([tipP, midO, eo, wo, wi, ei, midI, pit, inside], 0.7), fill: d.coat, line: null });
    out.push(L(smoothOpen([tipP, midO, eo, wo], 0.9), d.line, d.lw));
    out.push(L(smoothOpen([wi, ei, midI, pit], 0.9), d.line, d.lw));
    // 肘部褶与受光边
    out.push(L(smoothOpen([[ei[0] + n2[0] * 4, ei[1] + 6], [elbow[0], elbow[1] + 2]]), d.line, 1.3, 0.45));
    const litSide = s * d.look.light > 0;
    out.push(L(smoothOpen([[tipP[0] - n1[0] * 5, tipP[1] + 12], [eo[0] - n1[0] * 5, eo[1]]]), litSide ? d.coatLit : d.coatShade, 3.2, litSide ? 0.6 : 0.5));
    // 袖口
    out.push(L(`M${wo[0] - (wo[0] - wi[0]) * 0.02},${wo[1] - (wo[1] - wi[1]) * 0.02}L${wi[0]},${wi[1]}`, d.line, 1.8, 0.8));
    const dir = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
    // 手的形状带上标记，握东西时可以单独把手再画一次（画在道具上面）
    out.push(...handShapes(wrist, (dir * 180) / Math.PI - 90 + (hp.angle ?? 0), hp, d, s).map((sh, i) => ({ ...sh, key: `hand${s === -1 ? "L" : "R"}-${i}` })));
  };
  arm(-1, pose.handL);
  arm(1, pose.handR);

  // ================= 头 =================
  const hs = headShapes(pose.head, d.look);
  const tilt = pose.headTilt + pose.lean;
  const tf = `translate(${headBase[0].toFixed(2)},${headBase[1].toFixed(2)}) rotate(${tilt.toFixed(2)}) scale(${HEAD_K})`;
  out.unshift(...hs.back.map((x) => ({ ...x, d: `${tf}|${x.d}` })));
  out.push(...hs.front.map((x) => ({ ...x, d: `${tf}|${x.d}` })));
  return out;
};

/**
 * 手：手背朝外，angle=0 时手指朝下。手背靠手腕的一端窄、指节处宽；四根手指分开画（中指最长、小指最短，略微张开），
 * 蜷起（curl）时手指变短、指尖变圆；拇指在靠身体中线的一侧斜着收进来。
 */
export const handShapes = (wrist: P, angle: number, hp: HandPose, d: Design, side: -1 | 1): Shape[] => {
  const k = DIM[d.sex].hand;
  const curl = hp.curl ?? 0;
  const pw = 15 * k; // 半掌宽（指节处）
  const pl = 26 * k; // 手背长
  const ts = -side; // 拇指朝身体中线
  const T = (pts: P[]) => pts.map((p) => rot(p, angle)).map(([x, y]) => [x + wrist[0], y + wrist[1]] as P);
  const out: Shape[] = [];
  const skin = d.look.skin;
  const shade = d.look.skinShade;
  // 拇指（在手背后面伸出来）
  const thLen = (21 - curl * 7) * k;
  const tb: P = [ts * pw * 0.72, pl * 0.12];
  const tdir = (ts * (24 + curl * 18) * Math.PI) / 180; // 往中线斜
  const tt: P = [tb[0] + Math.sin(tdir) * thLen, tb[1] + Math.cos(tdir) * thLen];
  const tn: P = [Math.cos(tdir), -Math.sin(tdir)];
  const thumb: P[] = [
    [tb[0] - tn[0] * 6 * k, tb[1] - tn[1] * 6 * k],
    [tb[0] + tn[0] * 5.5 * k, tb[1] + tn[1] * 5.5 * k],
    [tt[0] + tn[0] * 3.6 * k, tt[1] + tn[1] * 3.6 * k],
    [tt[0] + (tt[0] - tb[0]) * 0.08, tt[1] + (tt[1] - tb[1]) * 0.08],
    [tt[0] - tn[0] * 3.4 * k, tt[1] - tn[1] * 3.4 * k],
  ];
  out.push({ d: smoothClosed(T(thumb), 0.9), fill: skin, line: d.line, lw: d.lw * 0.8 });
  // 手背：手腕窄，指节宽
  const back: P[] = [
    [-pw * 0.66, -2], [pw * 0.66, -2], [pw * 0.92, pl * 0.5], [pw * 1.0, pl * 0.96], [0, pl * 1.04], [-pw * 1.0, pl * 0.96], [-pw * 0.92, pl * 0.5],
  ];
  out.push({ d: smoothClosed(T(back), 0.8), fill: skin, line: d.line, lw: d.lw * 0.8 });
  // 四根手指：从拇指一侧（食指）到另一侧（小指）
  const fingers = [
    { x: 0.7, len: 0.94, w: 3.5, spread: -5 },
    { x: 0.24, len: 1.0, w: 3.7, spread: -1.5 },
    { x: -0.22, len: 0.95, w: 3.5, spread: 2 },
    { x: -0.66, len: 0.76, w: 3.0, spread: 6 },
  ];
  const fl = 25 * k * (1 - curl * 0.48);
  for (const fg of fingers) {
    const bx = ts * fg.x * pw;
    const base: P = [bx, pl * 0.92];
    const a = (ts * fg.spread * Math.PI) / 180;
    const flen = fl * fg.len;
    const tip: P = [base[0] - Math.sin(a) * flen, base[1] + Math.cos(a) * flen];
    const n: P = [Math.cos(a), Math.sin(a)];
    const w0 = fg.w * k;
    const w1 = fg.w * k * (0.78 + curl * 0.15);
    const finger: P[] = [
      [base[0] - n[0] * w0, base[1] - n[1] * w0],
      [base[0] + n[0] * w0, base[1] + n[1] * w0],
      [tip[0] + n[0] * w1, tip[1] + n[1] * w1],
      [tip[0] - Math.sin(a) * w1 * 0.9, tip[1] + Math.cos(a) * w1 * 0.9],
      [tip[0] - n[0] * w1, tip[1] - n[1] * w1],
    ];
    out.push({ d: smoothClosed(T(finger), 0.85), fill: skin, line: d.line, lw: d.lw * 0.7 });
    // 指甲：手指伸直时指尖露出一点淡色
    if (curl < 0.5) {
      const nail: P = [tip[0] - Math.sin(a) * w1 * 0.1, tip[1] + Math.cos(a) * w1 * 0.1 - 1.5 * k];
      out.push({ d: smoothClosed(T([[nail[0] - w1 * 0.55, nail[1] - 2 * k], [nail[0] + w1 * 0.55, nail[1] - 2 * k], [nail[0] + w1 * 0.45, nail[1] + 2 * k], [nail[0] - w1 * 0.45, nail[1] + 2 * k]]), 0.9), fill: "#f6ece2", line: null, op: 0.35 * (1 - curl * 2) });
    }
    // 第二指节的褶
    const mid: P = [base[0] + (tip[0] - base[0]) * 0.45, base[1] + (tip[1] - base[1]) * 0.45];
    out.push(L(smoothOpen(T([[mid[0] - n[0] * w0 * 0.6, mid[1] - n[1] * w0 * 0.6], [mid[0] + n[0] * w0 * 0.6, mid[1] + n[1] * w0 * 0.6]])), d.line, 0.9, 0.3 + curl * 0.2));
  }
  // 指节的明暗：靠小指一侧（背光）压一层阴影，指节一排小高光
  out.push({ d: smoothClosed(T([[-ts * pw * 0.2, pl * 0.3], [-ts * pw * 0.98, pl * 0.45], [-ts * pw * 1.0, pl * 0.98], [-ts * pw * 0.3, pl * 1.02]]), 0.8), fill: shade, line: null, op: 0.35 });
  for (const fg of fingers.slice(0, 3)) {
    const kx = ts * fg.x * pw;
    out.push({ d: smoothClosed(T([[kx - 2.4 * k, pl * 0.86], [kx + 2.4 * k, pl * 0.86], [kx + 1.8 * k, pl * 0.94], [kx - 1.8 * k, pl * 0.94]]), 0.9), fill: "#ffffff", line: null, op: 0.12 + curl * 0.08 });
  }
  return out;
};

/** 渲染：把 "transform|d" 形式的 path 交给 <g transform> */
export const TShapes: React.FC<{ shapes: Shape[]; line: string; lw: number; filter?: string; paint?: boolean }> = ({ shapes, line, lw, filter, paint = false }) => {
  const uid = React.useId().replace(/:/g, "");
  return (
    <g filter={filter}>
      {shapes.map((s, i) => {
        const idx = s.d.indexOf("|");
        const tf = idx >= 0 ? s.d.slice(0, idx) : undefined;
        const dd = idx >= 0 ? s.d.slice(idx + 1) : s.d;
        const cl = s.clip && s.clip.includes("|") ? s.clip.slice(s.clip.indexOf("|") + 1) : s.clip;
        return <Shapes key={i} idBase={`${uid}-${i}`} shapes={[{ ...s, d: dd, clip: cl }]} defaultLine={line} defaultLw={lw} transform={tf} paint={paint} />;
      })}
    </g>
  );
};

export const FigureFront: React.FC<{
  pose: FrontPose;
  design: Design;
  x: number;
  y: number;
  scale: number;
  filter?: string;
  opacity?: number;
}> = ({ pose, design, x, y, scale, filter, opacity }) => {
  const shapes = frontShapes(pose, design);
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <TShapes shapes={shapes} line={design.line} lw={design.lw} filter={filter} paint />
    </g>
  );
};

/**
 * 头部中心与耳朵的局部坐标（与 frontShapes 同一套计算），
 * 用于耳机线、发光等需要贴着头部的附加物。
 */
export const headAnchor = (pose: FrontPose, d: Design): { head: P; tilt: number; earL: P; earR: P } => {
  const D = DIM[d.sex];
  const st = smoothstep(pose.stand);
  const fwd = forwardSink(pose);
  const rise = -RISE * st;
  const leanC: P = [0, rise - 20];
  const bt = (pose.bodyTurn ?? 0) * 0.42;
  const RB = D.shoulderTip + 14;
  const turnX = (x: number, y: number) => {
    if (bt === 0) return x;
    const k = Math.max(0, Math.min(1, (-y - 20) / 220));
    const c = Math.max(-1, Math.min(1, x / RB));
    return RB * Math.sin(Math.asin(c) + bt * k);
  };
  const U = (p: P): P => rot([turnX(p[0], p[1]), p[1] + rise + fwd * Math.min(1, -p[1] / 300)], pose.lean, leanC);
  const head = U([pose.headOffset[0], D.headY + pose.headOffset[1] + pose.slump * 16]);
  const tilt = pose.headTilt + pose.lean;
  const R = (d.sex === "f" ? 44 : 47) * HEAD_K;
  const yaw = pose.head.turn * 0.62;
  const ear = (s: -1 | 1): P => rot([head[0] + R * Math.sin((s * Math.PI) / 2 + yaw) - s * 2 * HEAD_K, head[1] + (d.sex === "f" ? 4 : 2) * HEAD_K], tilt, head);
  return { head, tilt, earL: ear(-1), earR: ear(1) };
};

/** 站直、手臂自然下垂时手腕的位置（局部坐标）：手腕约在裆部高度，手臂几乎伸直 */
export const HANG = (d: Design, side: -1 | 1): P => [side * (d.sex === "f" ? 84 : 96), d.sex === "f" ? -258 : -240];

/**
 * 起身时一只手腕的位置（局部坐标）。side：-1 画面左手 / 1 画面右手。
 * 坐着时在 rest；前倾时滑到大腿上；起身的前半段撑着大腿跟着一起升高；
 * 腿蹬直以后松开，向外一荡再垂到身侧（hang）。所有位置都限制在手臂够得着的范围内，不会把手臂拉长。
 */
export const riseHand = (
  pose: Pick<FrontPose, "stand" | "bend" | "slump" | "shoulderLift" | "legSlant">,
  d: Design,
  side: -1 | 1,
  rest: P,
  hang: P = HANG(d, side)
): { at: P; fore: number; curl: number } => {
  const D = DIM[d.sex];
  const st = smoothstep(pose.stand);
  const bend = pose.bend ?? 0;
  const rise = -RISE * st;
  const sl = (pose.legSlant ?? 0) * (1 - st);
  // 大腿上靠近膝盖的一点（坐着时大腿朝向镜头，被压短）
  const hipP: P = [side * (d.sex === "f" ? 30 : 44), rise + 6];
  const knee = mix([side * D.kneeX + sl * 18, D.kneeY], [side * (d.sex === "f" ? 26 : 44), D.ankleY - (d.sex === "f" ? 226 : 236)], st);
  const thigh: P = [lerp(hipP[0], knee[0], 0.6) + side * 10, lerp(hipP[1], knee[1], 0.6) - 16];
  // 前倾：从 rest 滑到大腿上
  const onThigh = smoothstep(Math.min(1, bend * 1.6));
  // 腿基本蹬直后松手
  const release = smoothstep((pose.stand - 0.62) / 0.33);
  let at: P = mix(mix(rest, thigh, onThigh), hang, release);
  // 松手时向外荡一下（跟随动作）
  at = [at[0] + side * Math.sin(Math.PI * release) * 14, at[1] - Math.sin(Math.PI * release) * 10];
  // 够不着就沿着肩膀方向收回来
  const slump = (pose.slump ?? 0) * 12 - (pose.shoulderLift ?? 0) * 9;
  const J: P = [side * D.joint[0], D.joint[1] + slump + rise + forwardSink(pose as FrontPose) * Math.min(1, -D.joint[1] / 300)];
  const fore = lerp(lerp(0.62, 0.9, onThigh), 1, release);
  const reach = (D.upper + D.fore * fore) * 0.97;
  const dx = at[0] - J[0];
  const dy = at[1] - J[1];
  const dist = Math.hypot(dx, dy);
  if (dist > reach) at = [J[0] + (dx / dist) * reach, J[1] + (dy / dist) * reach];
  return { at, fore, curl: lerp(0.15, 0.45, onThigh * (1 - release)) };
};

/** 只取一只手的形状（和 frontShapes 里完全同一个位置），用于把握着道具的手画在道具上面 */
export const handOnlyShapes = (pose: FrontPose, d: Design, which: "L" | "R"): Shape[] => frontShapes(pose, d).filter((sh) => sh.key?.startsWith(`hand${which}-`));
