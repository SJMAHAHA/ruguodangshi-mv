import React from "react";
import { AbsoluteFill } from "remotion";
import { headShapes, HeadPose } from "../characters/head";
import { TShapes, HEAD_K } from "../characters/front";
import { MAN, WOMAN, MAN_MEM, WOMAN_MEM } from "../characters/designs";
import { PencilDefs } from "../draw/Defs";

/** 脸部设定页：四个人物配色 × 三个朝向，放大看五官和头发 */
const POSES: HeadPose[] = [
  { turn: 0, pitch: 0, eyeOpen: 1, gaze: 0, brow: 0, mouth: 0 },
  { turn: 0.45, pitch: 0.15, eyeOpen: 0.85, gaze: 0.5, brow: 0.3, mouth: -0.2 },
  { turn: -0.35, pitch: -0.05, eyeOpen: 0.7, gaze: -0.4, brow: 0, mouth: 0.6 },
];
export const FaceSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#7d8a86" }}>
    <svg width={1920} height={1080}>
      <PencilDefs />
      {[MAN, WOMAN, MAN_MEM, WOMAN_MEM].map((d, row) =>
        POSES.map((p, col) => {
          const hs = headShapes(p, d.look);
          const y = 280 + Math.floor(row / 2) * 520;
          return (
            <g key={`${row}-${col}`} transform={`translate(${row % 2 ? 1060 + col * 300 : 140 + col * 300},${y}) scale(${2.3 * HEAD_K})`} filter="url(#pencil)">
              <TShapes shapes={[...hs.back, ...hs.front]} line={d.line} lw={d.lw} paint />
            </g>
          );
        })
      )}
    </svg>
  </AbsoluteFill>
);
