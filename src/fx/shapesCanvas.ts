import { Shape } from "../draw/Shape";

/**
 * 在 Canvas 上绘制与 SVG 相同的 Shape 列表（Path2D 直接吃 SVG path 字符串）。
 * 用于回忆轮廓的擦除：先画，再用 destination-out 擦，全部是同步绘制。
 */
const parseTf = (tf: string) => {
  const t = /translate\(([-\d.]+),([-\d.]+)\)/.exec(tf);
  const r = /rotate\(([-\d.]+)\)/.exec(tf);
  return { tx: t ? parseFloat(t[1]) : 0, ty: t ? parseFloat(t[2]) : 0, rot: r ? (parseFloat(r[1]) * Math.PI) / 180 : 0 };
};

export type CanvasShapeStyle = {
  fillAlpha: number;
  lineAlpha: number;
  line: string;
  lw: number;
  /** 只画线 */
  linesOnly?: boolean;
};

export const drawShapesCanvas = (ctx: CanvasRenderingContext2D, shapes: Shape[], at: { x: number; y: number; scale: number }, st: CanvasShapeStyle) => {
  for (const s of shapes) {
    const idx = s.d.indexOf("|");
    const tf = idx >= 0 ? s.d.slice(0, idx) : null;
    const d = idx >= 0 ? s.d.slice(idx + 1) : s.d;
    ctx.save();
    ctx.translate(at.x, at.y);
    ctx.scale(at.scale, at.scale);
    if (tf) {
      const p = parseTf(tf);
      ctx.translate(p.tx, p.ty);
      ctx.rotate(p.rot);
    }
    if (s.clip) ctx.clip(new Path2D(s.clip.includes("|") ? s.clip.slice(s.clip.indexOf("|") + 1) : s.clip));
    const path = new Path2D(d);
    const op = s.op ?? 1;
    if (!st.linesOnly && s.fill && s.fill !== "none") {
      ctx.globalAlpha = st.fillAlpha * op;
      ctx.fillStyle = s.fill;
      ctx.fill(path);
    }
    const lineColor = s.line === undefined ? st.line : s.line;
    if (lineColor) {
      ctx.globalAlpha = st.lineAlpha * (s.lineOp ?? 0.92) * op;
      ctx.strokeStyle = s.line === undefined ? st.line : lineColor;
      ctx.lineWidth = s.lw ?? st.lw;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(path);
    }
    ctx.restore();
  }
};
