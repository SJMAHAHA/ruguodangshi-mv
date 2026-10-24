import React from "react";
import { AbsoluteFill } from "remotion";
import { walkShapes, gaitPhase } from "../characters/walk";
import { TShapes } from "../characters/front";
import { MAN, WOMAN } from "../characters/designs";

/** 步态检查：同一个人连续 16 帧叠在一起（洋葱皮）。支撑脚不打滑时，地面上的脚是清楚的一只。 */
export const WalkTest: React.FC = () => {
  const rows = [
    { d: MAN, v: 380, s: 0.5, y: 500 },
    { d: WOMAN, v: 560, s: 0.5, y: 1000 },
  ];
  return (
    <AbsoluteFill style={{ background: "#e8e4d8" }}>
      <svg width={1920} height={1080}>
        {rows.map((r, ri) => (
          <g key={ri}>
            <line x1={0} x2={1920} y1={r.y} y2={r.y} stroke="#999" />
            {Array.from({ length: 16 }, (_, i) => {
              const t = 1 + i / 30;
              const dist = r.v * t;
              const ph = gaitPhase(dist, r.d, r.s);
              return (
                <g key={i} transform={`translate(${200 + dist},${r.y}) scale(${r.s})`} opacity={0.18}>
                  <TShapes shapes={walkShapes(ph, r.d, 1)} line={r.d.line} lw={r.d.lw} />
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
