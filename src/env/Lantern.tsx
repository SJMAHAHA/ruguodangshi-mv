import React from "react";
import { C } from "../config/palette";
import { mulberry32 } from "../lib/random";
import { headShapes } from "../characters/head";
import { TShapes } from "../characters/front";
import { MAN_MEM, WOMAN_MEM } from "../characters/designs";
import { HAND_FONT, BOOK_FONT } from "../ui/fonts";
import { SvgImage } from "./Plate";

/**
 * 河灯：木底座上一只方形纸灯，纸面朝镜头的一侧画着一小段回忆（棕褐铅笔线）。
 * 局部坐标：原点在水线中心，纸灯宽 100、高 100（y 向上为负）。
 */
export type LanternArt = "none" | "wire" | "book" | "glass" | "bench" | "boat";

const SEP = C.memSepia;

/** 纸面上的回忆小画：Seedream 画在白纸上的铅笔淡彩，白纸转成透明（scripts/chroma-key.py --white），透出灯光 */
const PAINTED: Partial<Record<LanternArt, string>> = {
  wire: "plates/lantern_wire.png",
  book: "plates/lantern_book.png",
  bench: "plates/lantern_bench.png",
  boat: "plates/lantern_boat.png",
};

const Art: React.FC<{ art: LanternArt }> = ({ art }) => {
  const painted = PAINTED[art];
  if (painted)
    return (
      <SvgImage src={painted} rect={{ x: -49, y: -103, w: 98, h: 96 }} />
    );
  return <ArtSvg art={art} />;
};

/** 原来的线描小画（「执子之手」仍用手写字体） */
const ArtSvg: React.FC<{ art: LanternArt }> = ({ art }) => {
  if (art === "wire") {
    const m = headShapes({ turn: 0.45, pitch: 0.1, eyeOpen: 0.6, gaze: 0.5, brow: 0, mouth: 0.6 }, MAN_MEM.look);
    const w = headShapes({ turn: -0.4, pitch: 0.15, eyeOpen: 0.3, gaze: -0.4, brow: 0, mouth: 0.7 }, WOMAN_MEM.look);
    return (
      <g>
        <g transform="translate(-22,-58) scale(0.3)">
          <TShapes shapes={[...m.back, ...m.front]} line={SEP} lw={3} />
        </g>
        <g transform="translate(22,-54) scale(0.28) rotate(-8)">
          <TShapes shapes={[...w.back, ...w.front]} line={SEP} lw={3} />
        </g>
        <path d="M-10,-56 C-6,-30 6,-30 10,-50" stroke={SEP} strokeWidth={1.2} fill="none" />
        <path d="M0,-34 L0,-8" stroke={SEP} strokeWidth={1.2} fill="none" />
      </g>
    );
  }
  if (art === "book") {
    return (
      <g stroke={SEP} fill="none" strokeWidth={1.4}>
        <path d="M-38,-30 Q-20,-38 0,-30 Q20,-38 38,-30 L38,-74 Q20,-82 0,-74 Q-20,-82 -38,-74 Z" fill="#f2deb0" />
        <path d="M0,-74 L0,-30" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${8 + i * 7},-68 v28`} strokeWidth={1} opacity={0.6} />
        ))}
        <text x={-30} y={-46} fontFamily={BOOK_FONT} fontSize={13} fill={SEP} stroke="none">
          赤壁
        </text>
        {/* 书页上画的胡子 */}
        <path d="M-26,-38 q4,-4 8,0 q4,-4 8,0" strokeWidth={1.1} />
      </g>
    );
  }
  if (art === "glass") {
    return (
      <g fontFamily={HAND_FONT} fontSize={30} fill={SEP}>
        <text x={-34} y={-58}>执子</text>
        <text x={-34} y={-22}>之手</text>
      </g>
    );
  }
  if (art === "bench") {
    return (
      <g stroke={SEP} fill="none" strokeWidth={1.3}>
        <path d="M-42,-34 h84 M-42,-46 h84 M-36,-34 v24 M36,-34 v24" />
        {/* 两个小小的坐着的人 */}
        <circle cx={-12} cy={-70} r={6} fill="#f2deb0" />
        <path d="M-20,-36 q0,-22 8,-26 q8,4 8,26" fill="#f2deb0" />
        <circle cx={13} cy={-67} r={5.5} fill="#f2deb0" />
        <path d="M5,-36 q0,-20 8,-24 q8,4 7,24" fill="#f2deb0" />
        <path d="M-4,-48 q4,-3 9,0" strokeWidth={1} />
      </g>
    );
  }
  if (art === "boat") {
    return (
      <g stroke={SEP} fill="none" strokeWidth={1.3}>
        <circle cx={14} cy={-70} r={14} />
        <path d="M-36,-32 q36,12 72,0 q-10,8 -36,8 q-26,0 -36,-8 Z" fill="#f2deb0" />
        <path d="M-14,-34 q10,-20 26,-2" />
        <path d="M-40,-22 h80 M-30,-16 h60" strokeWidth={1} opacity={0.6} />
      </g>
    );
  }
  return null;
};

export const Lantern: React.FC<{ x: number; y: number; scale: number; t: number; seed?: number; art?: LanternArt; lit?: number; reflect?: boolean; uid: string }> = ({
  x,
  y,
  scale,
  t,
  seed = 1,
  art = "none",
  lit = 1,
  reflect = true,
  uid,
}) => {
  const r = mulberry32(seed);
  const ph = r() * 6.28;
  const bob = Math.sin(t * 1.3 + ph) * 3;
  const tilt = Math.sin(t * 0.9 + ph * 1.7) * 2.5;
  const flick = 0.9 + 0.06 * Math.sin(t * 9.1 + ph) + 0.04 * Math.sin(t * 13.7 + ph * 2);
  const L = lit * flick;
  return (
    <g transform={`translate(${x},${y + bob * scale}) scale(${scale})`}>
      {/* 水里的暖色倒影 */}
      {reflect ? (
        <g opacity={0.5 * lit}>
          <ellipse cx={0} cy={56} rx={46} ry={70} fill="#c99a5c" opacity={0.45} filter="url(#soft-blur-20)" />
          {[0, 1, 2, 3, 4].map((k) => (
            <line key={k} x1={-40 + Math.sin(t * 2 + k) * 6} y1={16 + k * 22} x2={40 + Math.sin(t * 2.3 + k) * 6} y2={16 + k * 22} stroke="#e7c992" strokeWidth={3} opacity={0.5 - k * 0.08} strokeLinecap="round" />
          ))}
        </g>
      ) : null}
      {/* 光晕 */}
      <circle cx={0} cy={-50} r={190} fill="url(#lanternGlow)" opacity={0.55 * L} />
      <g transform={`rotate(${tilt})`}>
        {/* 木底座 */}
        <path d="M-62,2 L58,2 L70,-8 L-50,-8 Z" fill="#3a2f27" stroke={C.graphite} strokeWidth={2} />
        <path d="M-62,2 L58,2 L58,8 L-62,8 Z" fill="#2a221d" />
        {/* 右侧纸面（透视） */}
        <path d="M50,-6 L66,-16 L68,-114 L52,-104 Z" fill="#d7ad6c" stroke="#6b4a33" strokeWidth={1.6} opacity={0.95} />
        {/* 顶口：烛光 */}
        <path d="M-52,-104 L52,-104 L68,-114 L-36,-114 Z" fill="#f6e2b0" opacity={0.85 * L} />
        <ellipse cx={8} cy={-112} rx={22} ry={8} fill="#fff4d6" opacity={0.6 * L} filter="url(#soft-blur-6)" />
        {/* 正面纸：从里面透出的暖光 */}
        <defs>
          <radialGradient id={`lp-${uid}`} cx="0.5" cy="0.62" r="0.7">
            <stop offset="0" stopColor="#fbe8bd" />
            <stop offset="0.6" stopColor="#efcf92" />
            <stop offset="1" stopColor="#cf9e5c" />
          </radialGradient>
          <clipPath id={`lc-${uid}`}>
            <path d="M-50,-6 L50,-6 L52,-104 L-52,-104 Z" />
          </clipPath>
        </defs>
        <path d="M-50,-6 L50,-6 L52,-104 L-52,-104 Z" fill={`url(#lp-${uid})`} opacity={0.75 + 0.25 * L} />
        <g clipPath={`url(#lc-${uid})`} opacity={0.85}>
          <Art art={art} />
        </g>
        <path d="M-50,-6 L50,-6 L52,-104 L-52,-104 Z" fill="none" stroke="#6b4a33" strokeWidth={2.2} />
        {/* 竹骨 */}
        <path d="M-51,-55 L51,-55" stroke="#8a6440" strokeWidth={1} opacity={0.35} />
      </g>
    </g>
  );
};
