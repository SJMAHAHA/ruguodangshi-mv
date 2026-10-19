import { mulberry32 } from "../lib/random";
import { Cam } from "../lib/camera";
import { WIDTH, HEIGHT } from "../config/timeline";

/** 空中的雨丝（世界坐标，随镜头移动）。位置 = 初始位置 + 速度 × 时间，取模循环。 */
export type RainLayer = {
  seed: number;
  count: number;
  speed: [number, number]; // px/s
  len: [number, number];
  width: [number, number];
  alpha: [number, number];
  wind: number; // 水平/垂直
  color: string; // "r,g,b"
  region: { x0: number; x1: number; y0: number; y1: number };
};

export const drawRain = (ctx: CanvasRenderingContext2D, cam: Cam, t: number, L: RainLayer, intensity = 1) => {
  const r = mulberry32(L.seed);
  const { x0, x1, y0, y1 } = L.region;
  const H = y1 - y0;
  const n = Math.round(L.count * Math.min(1.6, intensity));
  ctx.save();
  // 世界→画面
  const s = cam.scale;
  ctx.setTransform(s, 0, 0, s, WIDTH / 2 - cam.x * s, HEIGHT / 2 - cam.y * s);
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const sx = x0 + r() * (x1 - x0);
    const sy = r() * H;
    const v = L.speed[0] + r() * (L.speed[1] - L.speed[0]);
    const len = L.len[0] + r() * (L.len[1] - L.len[0]);
    const w = L.width[0] + r() * (L.width[1] - L.width[0]);
    const a = L.alpha[0] + r() * (L.alpha[1] - L.alpha[0]);
    const span = H + len;
    const yy = y0 - len + ((((sy + v * t) % span) + span) % span);
    const xx = sx + L.wind * (yy - y0);
    const g = ctx.createLinearGradient(xx, yy, xx + L.wind * len, yy + len);
    g.addColorStop(0, `rgba(${L.color},0)`);
    g.addColorStop(1, `rgba(${L.color},${a})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    ctx.lineTo(xx + L.wind * len, yy + len);
    ctx.stroke();
  }
  ctx.restore();
};

/** 玻璃上的水珠与下滑的水痕（画面坐标，玻璃贴着镜头）。 */
export type GlassOpts = {
  seed: number;
  beads: number;
  sliders: number;
  /** 0..1 整体可见度 */
  amount: number;
  /** 水珠受光颜色 */
  lit: string; // "r,g,b"
  /** 灯光方向上的亮斑中心（画面坐标），水珠在这里更亮 */
  glowAt?: [number, number];
  /** 0..1 灯光强度（车灯扫过时增大） */
  glow?: number;
  region?: { x0: number; x1: number; y0: number; y1: number };
  sizeK?: number;
};

const bead = (ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, a: number, lit: string, bright: number) => {
  // 水珠本体：略亮的折射
  ctx.fillStyle = `rgba(${lit},${0.08 * a + 0.12 * a * bright})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rad, rad * 1.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // 下缘暗边
  ctx.strokeStyle = `rgba(12,16,22,${0.32 * a})`;
  ctx.lineWidth = Math.max(0.8, rad * 0.28);
  ctx.beginPath();
  ctx.ellipse(x, y, rad, rad * 1.08, 0, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // 高光
  ctx.fillStyle = `rgba(245,248,240,${(0.45 + 0.4 * bright) * a})`;
  ctx.beginPath();
  ctx.ellipse(x - rad * 0.35, y - rad * 0.4, Math.max(0.6, rad * 0.26), Math.max(0.6, rad * 0.2), -0.5, 0, Math.PI * 2);
  ctx.fill();
};

export const drawGlass = (ctx: CanvasRenderingContext2D, t: number, o: GlassOpts) => {
  const r = mulberry32(o.seed);
  const reg = o.region ?? { x0: 0, x1: WIDTH, y0: 0, y1: HEIGHT };
  const k = o.sizeK ?? 1;
  const glow = o.glow ?? 0;
  const brightAt = (x: number, y: number) => {
    if (!o.glowAt) return 0;
    const d = Math.hypot(x - o.glowAt[0], y - o.glowAt[1]);
    return Math.max(0, 1 - d / 900) * (0.25 + glow);
  };
  // 静止的小水珠
  for (let i = 0; i < o.beads; i++) {
    const x = reg.x0 + r() * (reg.x1 - reg.x0);
    const y = reg.y0 + r() * (reg.y1 - reg.y0);
    const rr = (1.2 + Math.pow(r(), 2.6) * 6.5) * k;
    const born = r() * 6 - 3;
    const a = Math.min(1, Math.max(0, (t - born) / 1.5)) * o.amount;
    if (a <= 0) continue;
    bead(ctx, x, y, rr, a, o.lit, brightAt(x, y));
  }
  // 下滑的水痕：走走停停，留下细痕和小珠
  for (let i = 0; i < o.sliders; i++) {
    const x = reg.x0 + r() * (reg.x1 - reg.x0);
    const y0 = reg.y0 + r() * (reg.y1 - reg.y0) * 0.7;
    const start = r() * 30 - 8;
    const speed = 30 + r() * 90;
    const rr = (3.5 + r() * 4) * k;
    const wob = r() * 1000;
    const tt = t - start;
    if (tt < 0) continue;
    // 走走停停：用平滑阶梯函数
    const steps = tt * (0.6 + r() * 0.5);
    const stepped = Math.floor(steps) + Math.pow(steps - Math.floor(steps), 3);
    const y = y0 + stepped * speed;
    if (y > reg.y1 + 40) continue;
    const xx = x + Math.sin((y + wob) * 0.02) * 3;
    const a = o.amount;
    // 水痕
    ctx.strokeStyle = `rgba(${o.lit},${0.1 * a})`;
    ctx.lineWidth = rr * 0.55;
    ctx.beginPath();
    for (let yy = y0; yy <= y; yy += 6) {
      const px = x + Math.sin((yy + wob) * 0.02) * 3;
      if (yy === y0) ctx.moveTo(px, yy);
      else ctx.lineTo(px, yy);
    }
    ctx.stroke();
    // 痕迹上留下的小珠（固定位置）
    const rr2 = mulberry32(o.seed * 31 + i);
    for (let yy = y0 + 20; yy < y - 10; yy += 26 + rr2() * 30) {
      bead(ctx, x + Math.sin((yy + wob) * 0.02) * 3 + (rr2() - 0.5) * 2, yy, rr * (0.25 + rr2() * 0.2), a * 0.8, o.lit, brightAt(x, yy));
    }
    bead(ctx, xx, y, rr, a, o.lit, brightAt(xx, y));
  }
};

/** 地面积水上的雨点涟漪（世界坐标）。每个涟漪按固定周期重生，半径随年龄扩大、透明度衰减。 */
export const drawRipples = (
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  t: number,
  o: { seed: number; count: number; region: { x0: number; x1: number; y0: number; y1: number }; period: [number, number]; size: [number, number]; alpha: number; flat?: number; color?: string }
) => {
  const r = mulberry32(o.seed);
  const s = cam.scale;
  ctx.save();
  ctx.setTransform(s, 0, 0, s, WIDTH / 2 - cam.x * s, HEIGHT / 2 - cam.y * s);
  const flat = o.flat ?? 0.28;
  const col = o.color ?? "200,210,206";
  for (let i = 0; i < o.count; i++) {
    const period = o.period[0] + r() * (o.period[1] - o.period[0]);
    const off = r() * period;
    const xs = r();
    const ys = r();
    const size = o.size[0] + r() * (o.size[1] - o.size[0]);
    const cycle = Math.floor((t + off) / period);
    const age = ((t + off) % period) / 0.9;
    if (age > 1) continue;
    // 每一轮换一个位置（由轮次和索引决定）
    const rr = mulberry32(o.seed * 7919 + i * 104729 + cycle * 15485863);
    const x = o.region.x0 + ((xs + rr()) % 1) * (o.region.x1 - o.region.x0);
    const y = o.region.y0 + ((ys + rr()) % 1) * (o.region.y1 - o.region.y0);
    const rad = size * (0.15 + age * 0.85);
    ctx.strokeStyle = `rgba(${col},${o.alpha * (1 - age)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * flat, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (age < 0.5) {
      ctx.beginPath();
      ctx.ellipse(x, y, rad * 0.5, rad * 0.5 * flat, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
};
