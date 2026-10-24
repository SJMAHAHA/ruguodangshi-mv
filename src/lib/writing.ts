import { P } from "./geom";
import { mulberry32 } from "./random";

/**
 * 写字时笔尖（或指尖）的轨迹：每个字拆成几笔（横、竖、撇、捺、点），按从上到下的笔顺写，
 * 每写完一笔先抬笔、再移到下一笔的起点。字的显出也是从上往下，所以笔尖总落在显字的前沿上。
 * 结果只由时间和种子决定。
 */
export type Glyph = {
  /** 字框左上角 */
  x: number;
  top: number;
  w: number;
  h: number;
  /** 开始写的时刻和用时（秒） */
  t0: number;
  dur: number;
  seed: number;
  /** 标点：只点一下 */
  narrow?: boolean;
};

type Stroke = { a: P; b: P };

/** 一个字的笔画（字框内 0..1 坐标），从上到下分成 k 个横带，每笔落在自己的横带里 */
const strokesOf = (g: Glyph): Stroke[] => {
  if (g.narrow) return [{ a: [0.25, 0.7], b: [0.35, 0.85] }];
  const r = mulberry32(g.seed);
  const k = 3 + Math.floor(r() * 4);
  const out: Stroke[] = [];
  for (let j = 0; j < k; j++) {
    const v0 = 0.06 + (j / k) * 0.86;
    const v1 = 0.06 + ((j + 1) / k) * 0.86;
    const mid = (v0 + v1) / 2;
    const kind = r();
    if (kind < 0.38) {
      // 横：从左到右，略微上扬
      const u0 = 0.12 + r() * 0.15;
      out.push({ a: [u0, mid + 0.02], b: [0.88 - r() * 0.15, mid - 0.01] });
    } else if (kind < 0.62) {
      // 竖
      const u = 0.3 + r() * 0.4;
      out.push({ a: [u, v0], b: [u + 0.01, Math.min(0.95, v1 + 0.08)] });
    } else if (kind < 0.8) {
      // 撇：右上 → 左下
      const u = 0.5 + r() * 0.2;
      out.push({ a: [u, v0], b: [u - 0.32, Math.min(0.95, v1 + 0.05)] });
    } else if (kind < 0.93) {
      // 捺：左上 → 右下
      const u = 0.35 + r() * 0.15;
      out.push({ a: [u, v0], b: [u + 0.36, Math.min(0.95, v1 + 0.05)] });
    } else {
      // 点
      const u = 0.35 + r() * 0.3;
      out.push({ a: [u, mid - 0.04], b: [u + 0.06, mid + 0.04] });
    }
  }
  return out;
};

const ease = (x: number) => x * x * (3 - 2 * x);
const at = (g: Glyph, q: P): P => [g.x + q[0] * g.w, g.top + q[1] * g.h];
const mixP = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** 写这个字时第一笔的起点、最后一笔的终点（世界坐标） */
export const glyphEnds = (g: Glyph): { start: P; end: P } => {
  const s = strokesOf(g);
  return { start: at(g, s[0].a), end: at(g, s[s.length - 1].b) };
};

/** 一个字之内：t 时刻笔尖的位置和抬笔程度（0 = 笔在纸上，1 = 抬到最高） */
export const tipInGlyph = (g: Glyph, t: number): { p: P; lift: number } => {
  const s = strokesOf(g);
  const u = Math.max(0, Math.min(0.9999, (t - g.t0) / g.dur)) * s.length;
  const j = Math.floor(u);
  const f = u - j;
  // 每一笔：前 72% 在写，后 28% 抬笔移到下一笔的起点
  const DRAW = 0.72;
  if (f < DRAW || j === s.length - 1) return { p: mixP(at(g, s[j].a), at(g, s[j].b), ease(Math.min(1, f / DRAW))), lift: 0 };
  const m = (f - DRAW) / (1 - DRAW);
  return { p: mixP(at(g, s[j].b), at(g, s[j + 1].a), ease(m)), lift: Math.sin(Math.PI * m) };
};

/**
 * 一行字：写字时笔尖的位置和抬笔程度；两个字之间抬笔移过去。
 * 不在这一行的时间范围内时返回 null。
 */
export const tipOnLine = (glyphs: Glyph[], t: number): { p: P; lift: number } | null => {
  if (!glyphs.length || t < glyphs[0].t0 || t > glyphs[glyphs.length - 1].t0 + glyphs[glyphs.length - 1].dur) return null;
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    if (t <= g.t0 + g.dur) {
      if (t >= g.t0) return tipInGlyph(g, t);
      // 上一个字写完、这个字还没开始：抬笔移过去
      const prev = glyphs[i - 1];
      const k = (t - (prev.t0 + prev.dur)) / (g.t0 - (prev.t0 + prev.dur));
      return { p: mixP(glyphEnds(prev).end, glyphEnds(g).start, ease(k)), lift: Math.sin(Math.PI * k) };
    }
  }
  return null;
};

/** 字从上往下显出的进度 0..1（和笔顺一致） */
export const revealOf = (g: Glyph, t: number) => Math.max(0, Math.min(1, (t - g.t0) / g.dur));

/**
 * 手腕的转动：小臂的支点（肘）在画面外不动，手写到哪里，手就绕着肘转多少。
 * natural：贴图本身的手臂方向（从笔尖指向肘，度）；k：跟随的比例（真人写字时小臂也会滑动，不全靠转）。
 */
export const wristTurn = (tip: P, elbow: P, natural: number, k = 0.35) => {
  const a = (Math.atan2(elbow[1] - tip[1], elbow[0] - tip[0]) * 180) / Math.PI;
  let d = a - natural;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d * k;
};
