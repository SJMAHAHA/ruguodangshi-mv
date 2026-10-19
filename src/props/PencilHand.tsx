import React from "react";
import { C } from "../config/palette";
import { smoothClosed, smoothOpen, P } from "../lib/geom";

/**
 * 握笔的手（特写，从上方看）。原点 = 笔尖；笔杆沿 (0.5,-0.87) 方向伸向右上，
 * 手在笔杆中段，手腕和袖口伸出画面右上方。angle 整体旋转（度）。
 * 用 (u, v) 坐标作画：u 沿笔杆，v 垂直于笔杆（向右下为正）。
 */
const UX = 0.5;
const UY = -0.866;
const uv = (u: number, v: number): P => [u * UX + v * -UY, u * UY + v * UX];
const shape = (pts: [number, number][]) => smoothClosed(pts.map(([u, v]) => uv(u, v)), 0.9);

export const PencilHand: React.FC<{ x: number; y: number; angle?: number; scale?: number; skin: string; sleeve: string; line?: string; flip?: boolean }> = ({
  x,
  y,
  angle = 0,
  scale = 1,
  skin,
  sleeve,
  line = C.graphite,
  flip,
}) => {
  const shade = "rgba(120,80,60,0.18)";
  return (
    <g transform={`translate(${x},${y}) rotate(${angle}) scale(${flip ? -scale : scale},${scale})`}>
      {/* 袖口 */}
      <path d={shape([[250, -70], [300, -110], [440, -120], [470, 80], [330, 120], [260, 70]])} fill={sleeve} stroke={line} strokeWidth={2.6} />
      {/* 中指：在笔杆下面，只露出指尖 */}
      <path d={shape([[62, 14], [80, 2], [150, 10], [150, 40], [80, 34]])} fill={skin} stroke={line} strokeWidth={2.4} />
      {/* 笔 */}
      <path d={`M0,0 L${uv(34, -9).join(",")} L${uv(34, 9).join(",")} Z`} fill="#e3c9a0" stroke={line} strokeWidth={2} />
      <path d={`M0,0 L${uv(12, -3).join(",")} L${uv(12, 3).join(",")} Z`} fill="#3a3a3a" />
      <path d={`M${uv(34, -9).join(",")} L${uv(330, -9).join(",")} L${uv(330, 9).join(",")} L${uv(34, 9).join(",")} Z`} fill="#d9a441" stroke={line} strokeWidth={2.2} />
      <path d={`M${uv(36, -4).join(",")} L${uv(328, -4).join(",")}`} stroke="#efc46a" strokeWidth={4} opacity={0.8} />
      {/* 手背 */}
      <path d={shape([[120, -40], [170, -66], [250, -74], [300, -40], [300, 60], [240, 96], [170, 80], [130, 40]])} fill={skin} stroke={line} strokeWidth={2.6} />
      <path d={shape([[170, -40], [250, -50], [270, 30], [200, 60]])} fill={shade} stroke="none" />
      {/* 拇指：贴着笔杆左侧，指尖朝笔尖 */}
      <path d={shape([[70, -14], [92, -32], [170, -48], [200, -30], [150, -12]])} fill={skin} stroke={line} strokeWidth={2.4} />
      <path d={smoothOpen([uv(84, -22), uv(96, -18)])} stroke={line} strokeWidth={1.6} opacity={0.6} />
      {/* 食指：压在笔杆上方 */}
      <path d={shape([[56, -4], [70, -14], [150, -18], [210, -12], [214, 14], [150, 12], [72, 8]])} fill={skin} stroke={line} strokeWidth={2.4} />
      <path d={smoothOpen([uv(64, -6), uv(66, 6)])} stroke={line} strokeWidth={1.6} opacity={0.6} />
      <path d={smoothOpen([uv(130, -14), uv(132, 10)])} stroke={line} strokeWidth={1.4} opacity={0.4} />
      {/* 无名指、小指收在手掌下 */}
      <path d={shape([[160, 40], [200, 50], [240, 92], [200, 104], [160, 76]])} fill={skin} stroke={line} strokeWidth={2.2} />
    </g>
  );
};
