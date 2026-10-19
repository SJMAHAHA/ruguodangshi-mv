import { mulberry32 } from "../lib/random";
import { Cam } from "../lib/camera";
import { WIDTH, HEIGHT } from "../config/timeline";

/** 一片花瓣（单位大小），带一点不对称 */
const petalPath = () => {
  const p = new Path2D();
  p.moveTo(0, -1);
  p.bezierCurveTo(0.62, -0.92, 0.86, 0.2, 0.08, 1);
  p.quadraticCurveTo(0, 0.86, -0.1, 1);
  p.bezierCurveTo(-0.84, 0.25, -0.6, -0.9, 0, -1);
  p.closePath();
  return p;
};
let PETAL: Path2D | null = null;

const COLORS = ["167,84,88", "134,57,63", "191,109,111", "150,70,76", "176,96,98"];

export type PetalState = { x: number; y: number; size: number; rot: number; flip: number; color: string; alpha: number };

export const drawPetal = (ctx: CanvasRenderingContext2D, p: PetalState) => {
  if (!PETAL) PETAL = petalPath();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  const fx = Math.max(0.16, Math.abs(p.flip));
  ctx.scale(p.size * 0.62 * fx, p.size);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = `rgb(${p.color})`;
  ctx.fill(PETAL);
  // 背面略暗
  if (p.flip < 0) {
    ctx.fillStyle = "rgba(40,10,16,0.22)";
    ctx.fill(PETAL);
  }
  // 中脉
  ctx.strokeStyle = "rgba(70,20,28,0.35)";
  ctx.lineWidth = 0.06;
  ctx.beginPath();
  ctx.moveTo(0, -0.8);
  ctx.quadraticCurveTo(0.12, 0, 0, 0.85);
  ctx.stroke();
  // 边缘提亮
  ctx.strokeStyle = "rgba(230,190,180,0.25)";
  ctx.lineWidth = 0.07;
  ctx.stroke(PETAL);
  ctx.restore();
};

export type Flight = {
  seed: number;
  count: number;
  /** 出现时间区间（秒） */
  spawn: [number, number];
  /** 出现区域（世界坐标） */
  from: { x0: number; x1: number; y0: number; y1: number };
  vel: [number, number]; // 平均速度 px/s
  velJitter: [number, number];
  gravity?: number; // px/s²
  sway: number; // 左右飘动幅度
  size: [number, number];
  /** 消失：到达 y 后淡出 */
  fadeY?: number;
  life?: number;
};

/** 每片花瓣的轨迹是时间的解析函数，不依赖上一帧 */
export const petalAt = (f: Flight, i: number, t: number): PetalState | null => {
  const r = mulberry32(f.seed * 977 + i * 131);
  const t0 = f.spawn[0] + r() * (f.spawn[1] - f.spawn[0]);
  const age = t - t0;
  if (age < 0) return null;
  const life = f.life ?? 99;
  if (age > life) return null;
  const x0 = f.from.x0 + r() * (f.from.x1 - f.from.x0);
  const y0 = f.from.y0 + r() * (f.from.y1 - f.from.y0);
  const vx = f.vel[0] + (r() - 0.5) * 2 * f.velJitter[0];
  const vy = f.vel[1] + (r() - 0.5) * 2 * f.velJitter[1];
  const g = f.gravity ?? 0;
  const w = 0.8 + r() * 1.6;
  const ph = r() * 6.28;
  const size = f.size[0] + r() * (f.size[1] - f.size[0]);
  const x = x0 + vx * age + Math.sin(age * w + ph) * f.sway;
  const y = y0 + vy * age + 0.5 * g * age * age + Math.cos(age * w * 1.3 + ph) * f.sway * 0.3;
  const rot = ph + age * (0.6 + r() * 1.4) * (r() < 0.5 ? -1 : 1);
  const flip = Math.cos(age * (1.5 + r() * 2.5) + ph);
  const color = COLORS[Math.floor(r() * COLORS.length)];
  let alpha = Math.min(1, age / 0.25);
  if (f.fadeY !== undefined && y > f.fadeY) alpha *= Math.max(0, 1 - (y - f.fadeY) / 80);
  if (age > life - 0.6) alpha *= Math.max(0, (life - age) / 0.6);
  return { x, y, size, rot, flip, color, alpha };
};

export const drawFlight = (ctx: CanvasRenderingContext2D, cam: Cam, t: number, f: Flight, blurFar = false) => {
  const s = cam.scale;
  ctx.save();
  ctx.setTransform(s, 0, 0, s, WIDTH / 2 - cam.x * s, HEIGHT / 2 - cam.y * s);
  for (let i = 0; i < f.count; i++) {
    const p = petalAt(f, i, t);
    if (!p || p.alpha <= 0.01) continue;
    if (blurFar && p.size < (f.size[0] + f.size[1]) * 0.35) ctx.filter = "blur(1px)";
    drawPetal(ctx, p);
    ctx.filter = "none";
  }
  ctx.restore();
};
