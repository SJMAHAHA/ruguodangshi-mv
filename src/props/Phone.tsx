import React from "react";
import { C } from "../config/palette";

/**
 * 手机（竖握）。局部原点在机身中心，w×h 为机身尺寸。
 * screen：0 熄屏（黑镜面）… 1 亮屏；children 画在屏幕里（已裁剪）。
 */
export const Phone: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  screen: number;
  id: string;
  children?: React.ReactNode;
  reflection?: React.ReactNode;
}> = ({ x, y, w, h, rot = 0, screen, id, children, reflection }) => {
  const r = w * 0.12;
  const bz = w * 0.045;
  const sw = w - bz * 2;
  const sh = h - bz * 2;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <defs>
        <clipPath id={`scr-${id}`}>
          <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} rx={r * 0.8} />
        </clipPath>
        <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.1} />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0.04} />
        </linearGradient>
      </defs>
      {/* 机身 */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill="#1a1e23" stroke={C.graphite} strokeWidth={2.5} />
      <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={h - 4} rx={r - 2} fill="none" stroke="#4b545c" strokeWidth={1.5} opacity={0.6} />
      {/* 屏幕 */}
      <g clipPath={`url(#scr-${id})`}>
        <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} fill="#0b0e12" />
        {reflection ? <g opacity={0.35 * (1 - screen)}>{reflection}</g> : null}
        <g opacity={screen}>{children}</g>
        <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} fill={`url(#glass-${id})`} />
      </g>
      {/* 侧键 */}
      <rect x={w / 2 - 1} y={-h * 0.22} width={4} height={h * 0.1} rx={2} fill="#2a3036" />
    </g>
  );
};
