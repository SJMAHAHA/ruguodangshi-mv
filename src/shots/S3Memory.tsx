import React, { useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BusStopWorld, STOP } from "../env/BusStop";
import { LAMP } from "../env/Alley";
import { FigureFront, FRONT_NEUTRAL, FrontPose } from "../characters/front";
import { MAN_MEM, WOMAN_MEM } from "../characters/designs";
import { Bench } from "../props/Bench";
import { Bouquet } from "../props/Bouquet";
import { E, track, lerp } from "../lib/anim";
import { noise1 } from "../lib/random";
import { C } from "../config/palette";
import { FPS, SHOTS } from "../config/timeline";
import { Cam, WorldSvg, toScreen } from "../lib/camera";
import { smoothClosed, P } from "../lib/geom";
import { mulberry32 } from "../lib/random";
import { FxCanvas } from "../fx/FxCanvas";
import { drawFlight, Flight } from "../fx/petals";

/**
 * S3「两层纸」 帧 527–716（17.57–23.86 s）
 * 只剩他一个人。暖色描图纸滑进来，过去的两个人与现在的位置对齐；
 * 随后纸层慢慢错开，从边缘散去。花束上的花瓣被风带起，镜头随之推向路灯光晕。
 */
export const S3_T = {
  slideIn: [17.7, 19.05] as const,
  aligned: [19.05, 20.6] as const,
  drift: [20.6, 22.9] as const,
  dissolve: [21.9, 23.65] as const,
  petals: [22.2, 23.5] as const,
  toLamp: [22.55, 23.86] as const,
};

export const s3Cam = (t: number): Cam => {
  const k = track(t, [[S3_T.toLamp[0], 0], [S3_T.toLamp[1], 1, E.in]]);
  return {
    x: lerp(1010 + track(t, [[17.57, 0], [22.55, 14, E.drift]]), 1390, k),
    y: lerp(435, 330, k),
    scale: lerp(track(t, [[17.57, 1.5], [22.55, 1.6, E.drift]]), 1.9, k),
  };
};

const manPose = (t: number): FrontPose => {
  const feel = track(t, [[19.1, 0], [20.1, 1, E.inOut], [21.1, 1], [21.9, 0, E.inOut]]);
  const close = track(t, [[22.1, 0], [22.9, 1, E.inOut]]);
  return {
    ...FRONT_NEUTRAL,
    head: {
      turn: 0.6 - feel * 0.1 + noise1(t * 0.6, 2) * 0.012,
      pitch: 0.32 - feel * 0.2 + close * 0.08,
      eyeOpen: 0.6 + feel * 0.25 - close * 0.4,
      gaze: 0.55,
      brow: 0.55 - feel * 0.15,
      mouth: -0.25 + feel * 0.15,
    },
    headTilt: 2 + noise1(t * 0.4, 5) * 0.6,
    slump: 0.55 - feel * 0.2,
    bodyTurn: 0.18,
    lean: 0.5,
    handL: { at: [-34, -40], fore: 0.5, angle: 18 },
    handR: { at: [127, -14], fore: 1, angle: -4, curl: 0.45 },
    breathe: 0.5 + 0.5 * Math.sin(t * 1.7),
  };
};

/** 回忆里的两个人（同一张长椅，她靠在他肩上，抱着那束花） */
const memMan: FrontPose = {
  ...FRONT_NEUTRAL,
  head: { turn: 0.42, pitch: 0.08, eyeOpen: 0.75, gaze: 0.5, brow: 0, mouth: 0.6 },
  headTilt: 3,
  bodyTurn: 0.2,
  handL: { at: [-48, -24], fore: 0.6 },
  handR: { at: [92, -40], fore: 0.62 },
};
const memWoman: FrontPose = {
  ...FRONT_NEUTRAL,
  head: { turn: -0.3, pitch: 0.22, eyeOpen: 0.25, gaze: -0.2, brow: 0, mouth: 0.75 },
  headTilt: -15,
  headOffset: [-36, 24],
  lean: -7,
  bodyTurn: -0.25,
  legSlant: -0.4,
  handL: { at: [-30, -60], fore: 0.5 },
  handR: { at: [34, -58], fore: 0.5 },
};
const MEM_WOMAN_X = 1010;

/** 描图纸的毛边轮廓 */
const sheetPath = (() => {
  const r = mulberry32(42);
  const x0 = 430, x1 = 1640, y0 = 128, y1 = 860;
  const pts: P[] = [];
  const n = 18;
  for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + (r() - 0.5) * 6]);
  for (let i = 0; i < 10; i++) pts.push([x1 + (r() - 0.5) * 6, y0 + ((y1 - y0) * i) / 10]);
  for (let i = 0; i < n; i++) pts.push([x1 - ((x1 - x0) * i) / n, y1 + (r() - 0.5) * 6]);
  for (let i = 0; i < 10; i++) pts.push([x0 + (r() - 0.5) * 6, y1 - ((y1 - y0) * i) / 10]);
  return smoothClosed(pts, 0.5);
})();

const PETALS_UP: Flight = {
  seed: 31,
  count: 11,
  spawn: [S3_T.petals[0], S3_T.petals[1]],
  from: { x0: STOP.bouquet.x + 30, x1: STOP.bouquet.x + 110, y0: STOP.bouquet.y - 80, y1: STOP.bouquet.y - 30 },
  vel: [70, -150],
  velJitter: [30, 40],
  gravity: -40,
  sway: 16,
  size: [11, 17],
};

export const S3Memory: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (SHOTS.s3.from + frame) / FPS;
  const cam = s3Cam(t);
  const slide = track(t, [[S3_T.slideIn[0], 0], [S3_T.slideIn[1], 1, E.out]]);
  const drift = track(t, [[S3_T.drift[0], 0], [S3_T.drift[1], 1, E.inOut]]);
  const dis = track(t, [[S3_T.dissolve[0], 0], [S3_T.dissolve[1], 1, E.inOut]]);
  const glow = track(t, [[S3_T.toLamp[0], 1], [S3_T.toLamp[1], 2.6, E.in]]);
  const dx = lerp(-1250, 0, slide) + drift * 74;
  const dy = lerp(18, 0, slide) + drift * 14;
  const rot = lerp(-3.5, 0, slide) + drift * 1.8;
  const sheetOpacity = Math.min(1, slide * 1.6) * (1 - dis * dis * 0.7);
  // 散去：噪声 + 边缘渐变的阈值，越往后越多纸面透明
  const th = lerp(-0.05, 0.95, dis);

  const drawPetals = useCallback((ctx: CanvasRenderingContext2D) => drawFlight(ctx, cam, t, PETALS_UP), [cam, t]);
  const [lx, ly] = toScreen(cam, [LAMP.x, LAMP.y + 8]);
  const bloom = Math.max(0, glow - 1) / 1.3;
  return (
    <AbsoluteFill>
      <BusStopWorld cam={cam} t={t} man={manPose(t)} woman={null} lampGlow={glow} bouquetMissing={track(t, [[22.2, 0], [23.5, 3]])} />
      {/* 回忆层：一张暖色描图纸，和现实画面对位后错开 */}
      {sheetOpacity > 0.001 ? (
        <WorldSvg cam={cam} style={{ opacity: sheetOpacity }}>
          <defs>
            <radialGradient id="sheetFall" cx="0.5" cy="0.5" r="0.62">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.6" stopColor="#c8c8c8" />
              <stop offset="1" stopColor="#000" />
            </radialGradient>
            <filter id="sheetDissolve" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.0065" numOctaves={3} seed={17} result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="na" />
              <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="ga" />
              <feComposite in="ga" in2="na" operator="arithmetic" k1={0} k2={0.62} k3={0.5} k4={-0.12} result="mix" />
              <feComponentTransfer in="mix">
                <feFuncR type="linear" slope={0} intercept={1} />
                <feFuncG type="linear" slope={0} intercept={1} />
                <feFuncB type="linear" slope={0} intercept={1} />
                <feFuncA type="linear" slope={3} intercept={-3 * th + 0.6} />
              </feComponentTransfer>
            </filter>
            <mask id="sheetMask" maskUnits="userSpaceOnUse" x={300} y={0} width={1500} height={1000}>
              <rect x={430} y={128} width={1210} height={732} fill="url(#sheetFall)" filter="url(#sheetDissolve)" />
            </mask>
            <clipPath id="sheetClip">
              <path d={sheetPath} />
            </clipPath>
          </defs>
          <g transform={`translate(${dx},${dy}) rotate(${rot} 1035 494)`}>
            <g mask="url(#sheetMask)">
              <g clipPath="url(#sheetClip)">
                <path d={sheetPath} fill={C.warmPaper} opacity={0.4} filter="url(#pencil-soft)" />
                {/* 铅笔起稿线 */}
                <g stroke={C.memSepia} strokeWidth={1.2} fill="none" opacity={0.35}>
                  <path d="M440,852 L1630,846" />
                  <path d="M470,330 C800,318 1200,326 1600,316" />
                  <path d="M520,140 L512,850 M1560,136 L1566,856" opacity={0.6} />
                </g>
                <g opacity={0.8}>
                  <Bench w={STOP.benchW} x={STOP.benchX} y={STOP.seatY} scale={STOP.benchScale} memory />
                  <FigureFront pose={memWoman} design={WOMAN_MEM} x={MEM_WOMAN_X} y={STOP.seatY - 8} scale={STOP.figScale} filter="url(#pencil)" />
                  <Bouquet x={MEM_WOMAN_X + 6} y={STOP.seatY - 40} scale={0.66} rot={-14} memory />
                  <FigureFront pose={{ ...memMan, breathe: 0.5 + 0.5 * Math.sin(t * 1.5) }} design={MAN_MEM} x={STOP.manX} y={STOP.seatY - 8} scale={STOP.figScale} filter="url(#pencil)" />
                </g>
              </g>
              <path d={sheetPath} fill="none" stroke="#efe6d1" strokeWidth={2} opacity={0.7} />
            </g>
          </g>
        </WorldSvg>
      ) : null}
      <FxCanvas draw={drawPetals} />
      {/* 推向路灯：光晕扩大，准备在副歌下拍变成月亮 */}
      {bloom > 0.001 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${lx}px ${ly}px, rgba(242,236,216,${bloom}) 0px, rgba(236,230,208,${0.85 * bloom}) ${30 + 50 * bloom}px, rgba(200,204,190,${0.35 * bloom}) ${140 + 120 * bloom}px, rgba(120,135,130,${0.12 * bloom}) ${420 + 200 * bloom}px, rgba(0,0,0,0) ${900}px)`,
            mixBlendMode: "screen",
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
