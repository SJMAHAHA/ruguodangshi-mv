import React from "react";
import { C } from "../config/palette";
import { smoothClosed, smoothOpen, P } from "../lib/geom";
import { ASSETS } from "../config/assets";
import { SvgImage } from "../env/Plate";

/** 花束贴图在局部坐标里的范围（原点 = 花束和座面的接触点；参考底稿见 dev/PlateRef 的 BouquetPlateRef） */
export const BOUQUET_RECT = { x: -140, y: -120, w: 300, h: 150 };

/**
 * 一小束暗红花（包装纸 + 5 朵花 + 几片叶子），横放在长椅上。
 * 局部坐标：原点在花束与座面接触的中心，长约 230，花头朝画面右侧。
 * missing：已经被风带走的花瓣数（花头逐渐变小、露出花心）
 */
export const Bouquet: React.FC<{ x: number; y: number; scale: number; rot?: number; memory?: boolean; flip?: boolean; missing?: number; filter?: string }> = ({
  x,
  y,
  scale,
  rot = 0,
  memory,
  flip,
  missing = 0,
  filter = "url(#pencil)",
}) => {
  const line = memory ? C.memSepia : C.graphite;
  const paper = memory ? "#e3d2ad" : "#7f7a6d";
  const paperShade = memory ? "#c9b48a" : "#625f55";
  const paperLit = memory ? "#efe3c8" : "#9a958a";
  const leaf = memory ? "#a7a77a" : "#56645a";
  const red = memory ? "#c46b66" : C.red;
  const redDeep = memory ? "#a2524f" : C.redDeep;
  const redLit = memory ? "#da8f86" : C.redLight;
  const heads: { c: P; r: number }[] = [
    { c: [66, -40], r: 22 },
    { c: [96, -28], r: 21 },
    { c: [84, -62], r: 19 },
    { c: [112, -54], r: 18 },
    { c: [56, -70], r: 16 },
  ];
  const wrap: P[] = [
    [-118, -10], [-60, -16], [10, -30], [44, -78], [70, -96], [92, -84], [118, -80], [138, -40], [128, -6], [80, 2], [10, 2], [-60, 0], [-118, 2],
  ];
  if (ASSETS.bouquet)
    return (
      <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -scale : scale},${scale})`}>
        <SvgImage src={memory ? "plates/bouquet_memory.png" : "plates/bouquet_night.png"} rect={BOUQUET_RECT} />
      </g>
    );
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -scale : scale},${scale})`} filter={filter}>
      {/* 包装纸背面 */}
      <path d={smoothClosed(wrap, 0.7)} fill={paperShade} stroke={line} strokeWidth={2} />
      {/* 叶子 */}
      {(
        [
          [[40, -50], [20, -92], [56, -66]],
          [[120, -40], [158, -68], [132, -26]],
          [[100, -70], [118, -112], [116, -66]],
        ] as P[][]
      ).map((pts, i) => (
        <path key={i} d={smoothClosed(pts, 0.9)} fill={leaf} stroke={line} strokeWidth={1.6} />
      ))}
      {/* 花头 */}
      {heads.map((h, i) => {
        const k = Math.max(0.55, 1 - Math.max(0, missing - i * 1.5) * 0.08);
        const r = h.r * k;
        return (
          <g key={i}>
            <path
              d={smoothClosed(
                Array.from({ length: 9 }, (_, j) => {
                  const a = (j / 9) * Math.PI * 2 + i;
                  const rr = r * (0.92 + 0.12 * Math.sin(j * 2.3 + i));
                  return [h.c[0] + Math.cos(a) * rr, h.c[1] + Math.sin(a) * rr * 0.92] as P;
                }),
                0.9
              )}
              fill={red}
              stroke={line}
              strokeWidth={1.7}
            />
            <path d={smoothOpen([[h.c[0] - r * 0.5, h.c[1] + r * 0.1], [h.c[0], h.c[1] - r * 0.45], [h.c[0] + r * 0.45, h.c[1] + r * 0.05], [h.c[0], h.c[1] + r * 0.35], [h.c[0] - r * 0.2, h.c[1]]])} fill="none" stroke={redDeep} strokeWidth={2.2} />
            <path d={smoothOpen([[h.c[0] - r * 0.75, h.c[1] - r * 0.2], [h.c[0] - r * 0.3, h.c[1] - r * 0.78], [h.c[0] + r * 0.4, h.c[1] - r * 0.7]])} fill="none" stroke={redLit} strokeWidth={2} opacity={0.7} />
          </g>
        );
      })}
      {/* 包装纸前片 */}
      <path d={smoothClosed([[-118, -6], [-40, -12], [30, -24], [74, -58], [96, -36], [126, -18], [118, 4], [40, 4], [-118, 4]], 0.6)} fill={paper} stroke={line} strokeWidth={2} />
      <path d={smoothOpen([[-110, -6], [-30, -10], [40, -20], [80, -46]])} fill="none" stroke={paperLit} strokeWidth={3} opacity={0.8} />
      <path d={smoothOpen([[30, -22], [44, -6], [60, 2]])} fill="none" stroke={line} strokeWidth={1.3} opacity={0.5} />
      {/* 丝带 */}
      <path d={smoothClosed([[-52, -16], [-38, -18], [-36, 4], [-50, 4]], 0.4)} fill={memory ? "#9c6e5c" : "#3b2f33"} stroke={line} strokeWidth={1.6} />
      <path d={smoothOpen([[-46, 2], [-56, 22], [-66, 30]])} fill="none" stroke={memory ? "#9c6e5c" : "#3b2f33"} strokeWidth={3} />
      <path d={smoothOpen([[-42, 2], [-34, 24], [-22, 34]])} fill="none" stroke={memory ? "#9c6e5c" : "#3b2f33"} strokeWidth={3} />
      {/* 花茎末端 */}
      <path d="M-118,-6 l-16,-2 M-118,-1 l-18,1 M-118,3 l-14,4" stroke={leaf} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};
