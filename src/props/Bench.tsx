import React from "react";
import { C } from "../config/palette";

/** 公交站长椅：木条座面 + 金属腿。坐标：座面前缘中心 (0,0)，宽 w。*/
export const Bench: React.FC<{ w: number; x: number; y: number; scale: number; memory?: boolean; part?: "back" | "seat" | "all" }> = ({ w, x, y, scale, memory, part = "all" }) => {
  const wood = memory ? "#cdb38a" : "#5f625a";
  const woodLit = memory ? "#e3cfa6" : "#767a70";
  const woodShade = memory ? "#a88f69" : "#454841";
  const metal = memory ? "#8c7a63" : "#2c333a";
  const line = memory ? C.memSepia : C.graphite;
  const lw = 2.2;
  const hw = w / 2;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {part !== "seat" && (
        <g>
          {/* 靠背两根木条 */}
          <rect x={-hw} y={-250} width={w} height={34} rx={6} fill={wood} stroke={line} strokeWidth={lw} />
          <rect x={-hw} y={-250} width={w} height={8} rx={4} fill={woodLit} opacity={0.7} />
          <rect x={-hw} y={-198} width={w} height={34} rx={6} fill={wood} stroke={line} strokeWidth={lw} />
          <rect x={-hw} y={-198} width={w} height={8} rx={4} fill={woodLit} opacity={0.7} />
          {/* 立柱 */}
          {[-hw + 40, hw - 40].map((px) => (
            <rect key={px} x={px - 7} y={-262} width={14} height={262} fill={metal} stroke={line} strokeWidth={lw} />
          ))}
        </g>
      )}
      {part !== "back" && (
        <g>
          {/* 座面（正面看到的厚度） */}
          <rect x={-hw - 6} y={-14} width={w + 12} height={26} rx={6} fill={wood} stroke={line} strokeWidth={lw} />
          <rect x={-hw - 6} y={-14} width={w + 12} height={7} rx={4} fill={woodLit} opacity={0.8} />
          <rect x={-hw - 6} y={6} width={w + 12} height={6} rx={3} fill={woodShade} opacity={0.8} />
          {/* 腿 */}
          {[-hw + 40, hw - 40].map((px) => (
            <g key={px}>
              <rect x={px - 7} y={12} width={14} height={230} fill={metal} stroke={line} strokeWidth={lw} />
              <rect x={px - 30} y={236} width={60} height={10} rx={4} fill={metal} stroke={line} strokeWidth={lw} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};
