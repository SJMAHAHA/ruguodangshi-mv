import React from "react";
import { HEIGHT, WIDTH } from "../config/timeline";

/** 镜头：世界坐标 (x,y) 落在画面中心，scale 为放大倍数，rot 为轻微旋转（度） */
export type Cam = { x: number; y: number; scale: number; rot?: number };

export const CAM_IDENTITY: Cam = { x: WIDTH / 2, y: HEIGHT / 2, scale: 1 };

export const camTransform = (c: Cam) =>
  `translate(${WIDTH / 2},${HEIGHT / 2}) rotate(${c.rot ?? 0}) scale(${c.scale}) translate(${-c.x},${-c.y})`;

/** Canvas 2D 用的同一变换 */
export const applyCam = (ctx: CanvasRenderingContext2D, c: Cam, pxRatio = 1) => {
  const r = ((c.rot ?? 0) * Math.PI) / 180;
  const s = c.scale * pxRatio;
  const cos = Math.cos(r) * s;
  const sin = Math.sin(r) * s;
  // T(center) · R · S · T(-cam)
  const tx = (WIDTH / 2) * pxRatio - (cos * c.x - sin * c.y);
  const ty = (HEIGHT / 2) * pxRatio - (sin * c.x + cos * c.y);
  ctx.setTransform(cos, sin, -sin, cos, tx, ty);
};

/** 世界坐标 → 画面坐标 */
export const toScreen = (c: Cam, p: readonly [number, number]): [number, number] => {
  const r = ((c.rot ?? 0) * Math.PI) / 180;
  const dx = (p[0] - c.x) * c.scale;
  const dy = (p[1] - c.y) * c.scale;
  return [WIDTH / 2 + dx * Math.cos(r) - dy * Math.sin(r), HEIGHT / 2 + dx * Math.sin(r) + dy * Math.cos(r)];
};

export const WorldSvg: React.FC<{ cam: Cam; children: React.ReactNode; style?: React.CSSProperties; filter?: string }> = ({ cam, children, style, filter }) => (
  <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute", left: 0, top: 0, ...style }}>
    <g transform={camTransform(cam)} filter={filter}>
      {children}
    </g>
  </svg>
);
