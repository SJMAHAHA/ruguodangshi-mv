import { P, smoothClosed, smoothOpen, limb, rot } from "../lib/geom";
import { Shape, L } from "../draw/Shape";
import { Design } from "./front";
import { ellipse } from "./head";
import { HEAD_K } from "./front";

/**
 * 背面坐姿（S4 远景、S5 背面中景）。局部坐标与正面一致：原点 = 臀部中心在座面上。
 * headTurn：头向画面右侧转（-1..1），转过来时露出一点侧脸轮廓与耳朵。
 */
export type BackPose = { headTurn: number; headTilt: number; slump: number; lean: number; headOffset?: P };

export const backShapes = (pose: BackPose, d: Design): Shape[] => {
  const f = d.sex === "f";
  const out: Shape[] = [];
  const tip = f ? 88 : 104;
  const shY = (f ? -330 : -336) + pose.slump * 14;
  const waist = f ? 66 : 94;
  const hip = f ? 96 : 106;
  const c: P = [0, -20];
  const U = (p: P): P => rot(p, pose.lean, c);
  // 手臂（自然下垂，手放在腿上，背面只看到袖子外侧）
  for (const s of [-1, 1] as const) {
    const J = U([s * (tip - 14), shY + 18]);
    const E2: P = U([s * (tip + 4), shY + (f ? 162 : 176)]);
    const W: P = U([s * (tip - 18), -40]);
    out.push({ d: limb(J, E2, f ? 44 : 54, f ? 38 : 46, 2), fill: d.coatShade, line: d.line });
    out.push({ d: limb(E2, W, f ? 36 : 44, f ? 30 : 38, 1), fill: d.coatShade, line: d.line });
  }
  // 背部外套
  const torso: P[] = [
    U([0, shY - 36]), U([-22, shY - 34]), U([-tip * 0.8, shY - 16]), U([-tip, shY + 2]), U([-tip - 4, shY + 40]), U([-tip + 4, shY + 110]),
    U([-waist, -150]), U([-waist - 6, -70]), U([-hip, 0]), U([-hip - 4, 30]), U([hip + 4, 30]), U([hip, 0]), U([waist + 6, -70]), U([waist, -150]),
    U([tip - 4, shY + 110]), U([tip + 4, shY + 40]), U([tip, shY + 2]), U([tip * 0.8, shY - 16]), U([22, shY - 34]),
  ];
  const torsoD = smoothClosed(torso, 0.85);
  out.push({ d: torsoD, fill: d.coat, line: d.line });
  // 受光的一侧（月光从画面右上）
  out.push({ clip: torsoD, d: smoothClosed([U([tip * 0.3, shY - 30]), U([tip + 10, shY]), U([waist + 10, -120]), U([hip, 20]), U([hip * 0.6, 20]), U([waist * 0.5, -140]), U([tip * 0.4, shY + 40])], 0.9), fill: d.coatLit, line: null, op: 0.55 });
  // 背缝、后领、腰带
  out.push(L(smoothOpen([U([0, shY - 20]), U([2, -160]), U([0, 20])]), d.line, 1.4, 0.45));
  out.push({ d: smoothClosed([U([-30, shY - 36]), U([30, shY - 36]), U([34, shY - 10]), U([0, shY]), U([-34, shY - 10])], 0.6), fill: d.coatLit, line: d.line });
  if (f) out.push({ d: smoothClosed([U([-waist - 2, -150]), U([waist + 2, -150]), U([waist + 3, -130]), U([-waist - 3, -130])], 0.3), fill: d.coatShade, line: d.line });
  // 头（后脑勺 + 头发）
  const hy = (f ? -438 : -454) + pose.slump * 16;
  const ht = pose.headTurn;
  const H = U([(pose.headOffset?.[0] ?? 0) + 0, hy + (pose.headOffset?.[1] ?? 0)]);
  const tf = `translate(${H[0].toFixed(2)},${H[1].toFixed(2)}) rotate(${(pose.headTilt + pose.lean).toFixed(2)}) scale(${HEAD_K})`;
  const head: Shape[] = [];
  // 脖子
  head.push({ d: smoothClosed([[-15, 30], [15, 30], [18, 80], [-18, 80]], 0.5), fill: d.look.skinShade, line: d.line });
  // 转头时露出的耳朵与脸颊轮廓
  if (ht > 0.05) {
    head.push({ d: smoothClosed([[38 + ht * 8, -10], [52 + ht * 8, -4], [52 + ht * 6, 16], [40 + ht * 6, 20]], 0.9), fill: d.look.skin, line: d.line, op: Math.min(1, ht * 3) });
    head.push({ d: smoothClosed([[30, 0], [44 + ht * 14, 14], [40 + ht * 12, 44], [22, 56], [10, 40]], 0.8), fill: d.look.skin, line: d.line, op: Math.min(1, ht * 2.5) });
  } else {
    for (const s of [-1, 1] as const) head.push({ d: smoothClosed([[s * 44, -10], [s * 54, -4], [s * 54, 14], [s * 44, 18]], 0.9), fill: d.look.skinShade, line: d.line });
  }
  if (f) {
    head.push({
      d: smoothClosed([[-54, -36], [-60, 0], [-62, 40], [-64, 72], [-56, 92], [-30, 96], [0, 92], [30, 96], [56, 92], [64, 72], [62, 40], [60, 0], [54, -36], [42, -62], [18, -76], [-18, -76], [-42, -62]], 0.9),
      fill: d.look.hair,
      line: d.line,
    });
    head.push(L(smoothOpen([[-20, -70], [-28, 0], [-34, 80]]), d.look.hairLit, 1.4, 0.5));
    head.push(L(smoothOpen([[16, -72], [22, 10], [26, 84]]), d.look.hairLit, 1.4, 0.45));
  } else {
    head.push({
      d: smoothClosed([[-50, 0], [-54, -30], [-46, -62], [-24, -82], [6, -86], [32, -76], [50, -54], [54, -24], [50, 6], [40, 34], [20, 48], [0, 50], [-22, 46], [-40, 30]], 0.9),
      fill: d.look.hair,
      line: d.line,
    });
    head.push(L(smoothOpen([[-24, 40], [-10, 52], [10, 52], [26, 40]]), d.look.hairLit, 1.6, 0.4));
    head.push(L(smoothOpen([[12, -82], [36, -70], [50, -46]]), d.look.hairLit, 3, 0.55));
  }
  out.push(...head.map((h) => ({ ...h, d: `${tf}|${h.d}` })));
  // 后颈的阴影
  out.push({ d: ellipse(H[0], H[1] + 74, 22, 8), fill: d.coatShade, line: null, op: 0.6 });
  return out;
};
