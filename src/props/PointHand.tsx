import React from "react";
import { C } from "../config/palette";
import { smoothClosed } from "../lib/geom";
import { SvgImage } from "../env/Plate";
import { POINT_RECT } from "./Hands";

/**
 * 伸出食指的手（手背朝镜头），原点 = 食指指尖，angle 为手指方向（度，0 = 指尖朝上）。
 * 用于在雾玻璃上写字。
 */
export const PointHand: React.FC<{
  x: number;
  y: number;
  angle?: number;
  scale?: number;
  /** 只有 SVG 手（没有贴图时）才用到下面的配色 */
  skin?: string;
  skinShade?: string;
  sleeve?: string;
  line?: string;
  flip?: boolean;
  opacity?: number;
  sprite?: string;
}> = ({ x, y, angle = 0, scale = 1, skin = C.skin, skinShade = C.skinShade, sleeve = C.ink, line = C.graphite, flip, opacity = 1, sprite }) => (
  <g transform={`translate(${x},${y}) rotate(${angle}) scale(${flip ? -scale : scale},${scale})`} opacity={opacity}>
    {sprite ? <SvgImage src={sprite} rect={POINT_RECT} /> : <PointHandSvg skin={skin} skinShade={skinShade} sleeve={sleeve} line={line} />}
  </g>
);

/** 原来的 SVG 手（贴图的参考底稿） */
export const PointHandSvg: React.FC<{
  skin: string;
  skinShade: string;
  sleeve: string;
  line: string;
}> = ({ skin, skinShade, sleeve, line }) => (
  <g>
    {/* 袖子 */}
    <path
      d={smoothClosed(
        [
          [-80, 480],
          [70, 470],
          [120, 900],
          [-160, 920],
        ],
        0.7,
      )}
      fill={sleeve}
      stroke={line}
      strokeWidth={3}
    />
    {/* 手掌（握拳状，只伸出食指） */}
    <path
      d={smoothClosed(
        [
          [-66, 300],
          [-76, 230],
          [-44, 180],
          [30, 186],
          [80, 230],
          [84, 350],
          [56, 480],
          [-64, 486],
        ],
        0.85,
      )}
      fill={skin}
      stroke={line}
      strokeWidth={3}
    />
    {/* 收起的三根手指的指节 */}
    {[220, 272, 324].map((yy, i) => (
      <path
        key={i}
        d={smoothClosed(
          [
            [40, yy - 30],
            [96, yy - 24],
            [102, yy + 16],
            [44, yy + 20],
          ],
          0.8,
        )}
        fill={skin}
        stroke={line}
        strokeWidth={2.6}
      />
    ))}
    {/* 大拇指 */}
    <path
      d={smoothClosed(
        [
          [-62, 330],
          [-106, 262],
          [-100, 218],
          [-72, 222],
          [-42, 290],
        ],
        0.85,
      )}
      fill={skin}
      stroke={line}
      strokeWidth={2.8}
    />
    {/* 食指 */}
    <path
      d={smoothClosed(
        [
          [-36, 200],
          [-30, 60],
          [-20, 6],
          [0, -2],
          [16, 8],
          [26, 70],
          [28, 200],
        ],
        0.7,
      )}
      fill={skin}
      stroke={line}
      strokeWidth={3}
    />
    <path d="M-30,120 q14,-6 28,0 M-32,170 q14,-5 30,0" stroke={line} strokeWidth={1.8} fill="none" opacity={0.45} />
    <path d="M-12,8 q10,-4 18,4" stroke={line} strokeWidth={1.6} fill="none" opacity={0.5} />
    <path
      d={smoothClosed(
        [
          [-44, 350],
          [44, 340],
          [52, 440],
          [-40, 460],
        ],
        0.8,
      )}
      fill={skinShade}
      opacity={0.3}
    />
  </g>
);
