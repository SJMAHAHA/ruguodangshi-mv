import React, { useCallback } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { E, track, lerp } from "../lib/anim";
import { FPS, SHOTS } from "../config/timeline";
import { Cam, WorldSvg } from "../lib/camera";
import { Defs, Moon, Water, Willow, Jetty, Boat, BenchBack, RiverBackdrop, RiverSkyClip } from "../env/Waterside";
import { PencilDefs } from "../draw/Defs";
import { TShapes } from "../characters/front";
import { backShapes } from "../characters/back";
import { MAN } from "../characters/designs";
import { Bouquet } from "../props/Bouquet";
import { FxCanvas } from "../fx/FxCanvas";
import { drawFlight, Flight } from "../fx/petals";
import { drawRipples } from "../fx/rain";
import { C } from "../config/palette";

/**
 * S4「红雨·渡口」 帧 716–810（23.86–27.0 s）
 * 副歌下拍：路灯光晕变成满月（同一屏幕位置），镜头下摇并拉开，
 * 露出水面、对岸的现代城市、木栈桥与长椅；暗红花瓣大量斜落。
 */
export const MOON4 = { x: 1300, y: 104, r: 70 } as const;

export const s4Cam = (t: number): Cam => {
  const k = track(t, [[23.86, 0], [26.4, 1, E.out]]);
  return {
    x: lerp(1078, 960, k),
    y: lerp(231, 540, k) + track(t, [[26.4, 0], [27.0, 4, E.drift]]),
    scale: lerp(1.25, 1.0, k),
  };
};

export const STORM: Flight = {
  seed: 404,
  count: 120,
  spawn: [21.6, 26.6],
  from: { x0: -500, x1: 1700, y0: -700, y1: -160 },
  vel: [200, 300],
  velJitter: [90, 80],
  gravity: 0,
  sway: 34,
  size: [9, 24],
  fadeY: 1150,
};
const NEAR: Flight = {
  seed: 405,
  count: 9,
  spawn: [23.4, 26.4],
  from: { x0: -300, x1: 1300, y0: -500, y1: -200 },
  vel: [330, 520],
  velJitter: [80, 120],
  sway: 50,
  size: [40, 64],
};

export const S4Waterside: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (SHOTS.s4.from + frame) / FPS;
  const cam = s4Cam(t);
  const drawPetals = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawRipples(ctx, cam, t, { seed: 41, count: 16, region: { x0: 0, x1: 1920, y0: 600, y1: 1040 }, period: [1.1, 2.4], size: [14, 42], alpha: 0.4, flat: 0.16, color: "220,214,196" });
      drawFlight(ctx, cam, t, STORM);
    },
    [cam, t]
  );
  const drawNear = useCallback((ctx: CanvasRenderingContext2D) => drawFlight(ctx, cam, t, NEAR), [cam, t]);
  // 光晕 → 月亮：切点处保留一点 S3 的高光，迅速收拢成月亮
  const flash = track(t, [[23.86, 1], [24.5, 0, E.out]]);
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <RiverBackdrop />
        <RiverSkyClip id="s4sky" />
        <g clipPath="url(#s4sky)">
          <Moon x={MOON4.x} y={MOON4.y} r={MOON4.r} glow={1.6 + flash} />
        </g>
        <ellipse cx={MOON4.x} cy={MOON4.y} rx={900} ry={520} fill="#7f8f96" opacity={0.08} filter="url(#soft-blur-60)" />
        <Water y0={560} y1={1260} moonX={MOON4.x} t={t} reflW={90} bare />
        {/* 近岸：现代的护栏与站牌延续到古渡口 */}
        <g filter="url(#pencil-soft)">
          <path d="M-300,860 C100,880 420,930 660,1010 L840,1260 L-300,1260 Z" fill="#161e22" stroke={C.graphite} strokeWidth={2} />
          <path d="M-300,850 C100,870 420,920 650,1000" fill="none" stroke="#2f3a3c" strokeWidth={4} />
          {/* 护栏 */}
          {Array.from({ length: 9 }, (_, i) => {
            const x = -260 + i * 100;
            const y = 850 + Math.pow(i / 8, 1.6) * 140;
            return <rect key={i} x={x} y={y - 70} width={6} height={72} fill="#20282d" />;
          })}
          <path d="M-260,780 C100,800 420,850 560,920" fill="none" stroke="#2a3337" strokeWidth={6} />
          <path d="M-260,810 C100,830 420,880 560,950" fill="none" stroke="#2a3337" strokeWidth={3} />
          {/* 公交站牌（站在渡口入口） */}
          <rect x={742} y={820} width={9} height={420} fill="#1f262b" stroke={C.graphite} strokeWidth={1.5} />
          <circle cx={746} cy={812} r={30} fill="#2f3b40" stroke={C.graphite} strokeWidth={2} />
          <circle cx={746} cy={812} r={22} fill="none" stroke="#6f7d79" strokeWidth={3} opacity={0.7} />
        </g>
        <ellipse cx={MOON4.x} cy={780} rx={240} ry={320} fill="#c2c0aa" opacity={0.12} filter="url(#soft-blur-60)" />
        <rect x={-300} y={520} width={2600} height={80} fill="#8b989a" opacity={0.16} filter="url(#soft-blur-20)" />
        <Jetty near={[690, 1250, 1262]} far={[886, 1050, 650]} t={t} />
        <Boat x={1172} y={672} scale={0.5} t={t} />
        {/* 栈桥上的长椅与他（背影），右半边空着，花束落在地上 */}
        <BenchBack x={968} y={690} w={900} scale={0.25} part="legs" />
        <g transform={`translate(928,${690 - 2}) scale(0.25)`}>
          <TShapes shapes={backShapes({ headTurn: 0, headTilt: 3, slump: 0.6, lean: 1 }, MAN)} line={MAN.line} lw={MAN.lw * 1.3} />
        </g>
        <BenchBack x={968} y={690} w={900} scale={0.25} part="back" />
        <Bouquet x={1036} y={700} scale={0.2} rot={8} filter="" />
        <Willow x={60} y={-180} t={t} scale={1.05} />
      </WorldSvg>
      <FxCanvas draw={drawPetals} />
      <AbsoluteFill style={{ filter: "blur(5px)" }}>
        <FxCanvas draw={drawNear} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
