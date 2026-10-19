import React, { useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BusStopWorld, RAIN_FRONT, STOP } from "../env/BusStop";
import { FRONT_NEUTRAL, FrontPose } from "../characters/front";
import { E, track } from "../lib/anim";
import { noise1 } from "../lib/random";
import { FPS, SHOTS, WIDTH, HEIGHT } from "../config/timeline";
import { Cam } from "../lib/camera";
import { FxCanvas } from "../fx/FxCanvas";
import { drawGlass, drawRain, drawRipples } from "../fx/rain";

/**
 * S1「雨夜·玻璃后」 帧 0–289（0–9.63 s）
 * 隔着一扇淋雨的窗看街对面的公交站：两个人并排坐着。
 * 先看到雨玻璃，再对焦到人；他转头看她、手慢慢挪过去；车灯从右侧扫来，她抬眼。
 */
export const S1_T = {
  focus: [1.0, 3.4] as const, // 对焦从玻璃移到人物
  turnToHer: [3.95, 5.05] as const, // 「此时感觉到你的重要」：他转头看她
  reach1: [5.6, 6.2] as const, // 手挪过去……
  reach2: [6.62, 7.12] as const, // ……停一下，再碰到她的手
  busLight: [7.2, 9.25] as const, // 车灯从右侧扫来
  lookUp: [7.8, 8.7] as const, // 她抬眼看向车灯
};

export const s1Cam = (t: number): Cam => ({
  x: 975 + track(t, [[0, -20], [9.63, 10, E.drift]]),
  y: 575,
  scale: track(t, [[0, 0.88], [9.63, 0.92, E.drift]]),
});

const manPose = (t: number): FrontPose => {
  const turn = track(t, [[S1_T.turnToHer[0], 0], [S1_T.turnToHer[1], 1, E.inOut]]);
  const r1 = track(t, [[S1_T.reach1[0], 0], [S1_T.reach1[1], 1, E.inOut]]);
  const r2 = track(t, [[S1_T.reach2[0], 0], [S1_T.reach2[1], 1, E.out]]);
  return {
    ...FRONT_NEUTRAL,
    head: {
      turn: 0.12 + turn * 0.3 + noise1(t * 0.6, 4) * 0.012,
      pitch: 0.45 - turn * 0.33,
      eyeOpen: 0.6 + turn * 0.25,
      gaze: 0.2 + turn * 0.3,
      brow: 0.4,
      mouth: -0.25,
    },
    headTilt: -1 + turn * -1,
    slump: 0.4 - turn * 0.2,
    bodyTurn: 0.05 + turn * 0.17,
    handL: { at: [-34, -40], fore: 0.5, angle: 18 },
    handR: { at: [112 + r1 * 10 + r2 * 8, -14 + r2 * 2], fore: 1, angle: -4, curl: 0.15 - r2 * 0.15 },
    breathe: 0.5 + 0.5 * Math.sin(t * 1.9),
  };
};

const womanPose = (t: number): FrontPose => {
  const up = track(t, [[S1_T.lookUp[0], 0], [S1_T.lookUp[1], 1, E.inOut]]);
  return {
    ...FRONT_NEUTRAL,
    head: { turn: 0.5 + up * 0.1, pitch: 0.05 - up * 0.15, eyeOpen: 0.85 + up * 0.1, gaze: 0.45 + up * 0.2, brow: 0.4, mouth: -0.2 },
    headTilt: noise1(t * 0.5, 8) * 0.5,
    bodyTurn: 0.3,
    legSlant: 1,
    handL: { at: [-112, -18], fore: 1 },
    handR: { at: [42, -36], fore: 0.6 },
    breathe: 0.5 + 0.5 * Math.sin(t * 2.2 + 1),
  };
};

/** 车灯：从画面右侧进来的冷白光，柔边扫过站台（世界坐标） */
const BusLight: React.FC<{ k: number; sweep: number }> = ({ k, sweep }) => {
  if (k <= 0.001) return null;
  const x = 2350 - sweep * 760;
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={k} filter="url(#soft-blur-60)">
      <ellipse cx={x} cy={640} rx={620} ry={520} fill="#cfdcdc" opacity={0.22} />
      <ellipse cx={x + 240} cy={760} rx={300} ry={260} fill="#e6eeea" opacity={0.25} />
    </g>
  );
};

export const S1Glass: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (SHOTS.s1.from + frame) / FPS;
  const cam = s1Cam(t);
  const focus = track(t, [[S1_T.focus[0], 0], [S1_T.focus[1], 1, E.inOut]]);
  const bus = track(t, [[S1_T.busLight[0], 0], [S1_T.busLight[1], 1, E.in]]);
  const sweep = track(t, [[S1_T.busLight[0], 0], [S1_T.busLight[1] + 0.4, 1, E.drift]]);

  const drawFront = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // 站台外的雨与地面涟漪
      drawRain(ctx, cam, t, RAIN_FRONT, 1);
      // 顶棚前缘滴下的水线
      drawRain(ctx, cam, t, { ...RAIN_FRONT, seed: 303, count: 70, len: [30, 70], alpha: [0.18, 0.4], wind: 0.02, region: { x0: -100, x1: 2020, y0: 84, y1: 900 } }, 1);
      drawRipples(ctx, cam, t, { seed: 9, count: 60, region: { x0: -300, x1: 2200, y0: 1010, y1: 1300 }, period: [0.7, 1.6], size: [10, 26], alpha: 0.35 });
    },
    [cam, t]
  );
  const drawWindow = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawGlass(ctx, t, {
        seed: 5,
        beads: 420,
        sliders: 34,
        amount: 1,
        lit: "220,228,224",
        glowAt: [WIDTH + 80, HEIGHT * 0.72],
        glow: bus * 1.4,
        sizeK: 1.5,
      });
    },
    [t, bus]
  );
  const sceneBlur = 6.5 * (1 - focus);
  const glassBlur = 0.2 + 2.4 * focus;
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={cam}
        t={t}
        man={manPose(t)}
        woman={womanPose(t)}
        canopy
        sceneBlur={sceneBlur}
        front={<BusLight k={bus} sweep={sweep} />}
      />
      <AbsoluteFill style={{ filter: sceneBlur > 0.05 ? `blur(${(sceneBlur * 0.7).toFixed(2)}px)` : undefined }}>
        <FxCanvas draw={drawFront} />
      </AbsoluteFill>
      {/* 车灯眩光（画面右缘） */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 520px 380px at ${WIDTH + 120}px ${HEIGHT * 0.74}px, rgba(232,238,232,${0.55 * bus}), rgba(200,214,212,${0.18 * bus}) 45%, rgba(0,0,0,0) 75%)`,
          mixBlendMode: "screen",
        }}
      />
      {/* 窗玻璃：冷色反光 + 水珠（对焦后变虚） */}
      <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(190,205,205,0.07) 0%, rgba(190,205,205,0) 35%, rgba(190,205,205,0.05) 60%, rgba(190,205,205,0) 80%)" }} />
      <AbsoluteFill style={{ filter: `blur(${glassBlur.toFixed(2)}px)` }}>
        <FxCanvas draw={drawWindow} />
      </AbsoluteFill>
      {/* 窗框 */}
      <AbsoluteFill>
        <svg width={WIDTH} height={HEIGHT}>
          <rect x={0} y={0} width={46} height={HEIGHT} fill="#0e1318" />
          <rect x={46} y={0} width={6} height={HEIGHT} fill="#3a464b" opacity={0.6} />
          <rect x={0} y={HEIGHT - 34} width={WIDTH} height={34} fill="#0e1318" />
          <rect x={0} y={HEIGHT - 40} width={WIDTH} height={6} fill="#3a464b" opacity={0.6} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export { STOP };
