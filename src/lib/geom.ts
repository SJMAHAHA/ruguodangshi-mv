export type P = readonly [number, number];

const f = (n: number) => (Math.round(n * 10) / 10).toString();

/** 闭合平滑曲线（Catmull-Rom → 三次贝塞尔） */
export const smoothClosed = (pts: readonly P[], tension = 1): string => {
  const n = pts.length;
  if (n < 3) return "";
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const k = tension / 6;
    const c1x = p1[0] + (p2[0] - p0[0]) * k;
    const c1y = p1[1] + (p2[1] - p0[1]) * k;
    const c2x = p2[0] - (p3[0] - p1[0]) * k;
    const c2y = p2[1] - (p3[1] - p1[1]) * k;
    d += `C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + "Z";
};

/** 开放平滑曲线 */
export const smoothOpen = (pts: readonly P[], tension = 1): string => {
  const n = pts.length;
  if (n < 2) return "";
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const k = tension / 6;
    d += `C${f(p1[0] + (p2[0] - p0[0]) * k)},${f(p1[1] + (p2[1] - p0[1]) * k)} ${f(p2[0] - (p3[0] - p1[0]) * k)},${f(p2[1] - (p3[1] - p1[1]) * k)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
};

/** 两关节之间的锥形肢体（圆头胶囊） */
export const limb = (a: P, b: P, wa: number, wb: number, bulge = 0): string => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ux = dx / len;
  const uy = dy / len;
  const ra = wa / 2;
  const rb = wb / 2;
  const mid: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const rm = (ra + rb) / 2 + bulge;
  const pts: P[] = [
    [a[0] + nx * ra, a[1] + ny * ra],
    [mid[0] + nx * rm, mid[1] + ny * rm],
    [b[0] + nx * rb, b[1] + ny * rb],
    [b[0] + ux * rb * 0.9, b[1] + uy * rb * 0.9],
    [b[0] - nx * rb, b[1] - ny * rb],
    [mid[0] - nx * rm, mid[1] - ny * rm],
    [a[0] - nx * ra, a[1] - ny * ra],
    [a[0] - ux * ra * 0.9, a[1] - uy * ra * 0.9],
  ];
  return smoothClosed(pts, 1);
};

export const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const mix = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
export const rot = (p: P, deg: number, c: P = [0, 0]): P => {
  const r = (deg * Math.PI) / 180;
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)];
};
/** 两段骨骼的关节解算（IK），bend=1 时向右弯，-1 向左弯 */
export const ik2 = (root: P, target: P, l1: number, l2: number, bend: 1 | -1): P => {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const a = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const off = Math.acos(Math.max(-1, Math.min(1, cosA))) * bend;
  return [root[0] + Math.cos(a + off) * l1, root[1] + Math.sin(a + off) * l1];
};
/** 把点列整体平移 */
export const shift = (pts: readonly P[], dx: number, dy: number): P[] => pts.map(([x, y]) => [x + dx, y + dy] as P);
