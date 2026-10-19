import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { E, track, lerp, clamp } from "../../lib/anim";
import { Cam, WorldSvg } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { Defs, Sky, Moon, Skyline, Water, Jetty, Boat, BenchBack } from "../../env/Waterside";
import { PencilDefs } from "../../draw/Defs";
import { TShapes, FRONT_NEUTRAL, FrontPose } from "../../characters/front";
import { headShapes } from "../../characters/head";
import { backShapes } from "../../characters/back";
import { MAN, WOMAN, MAN_MEM, WOMAN_MEM } from "../../characters/designs";
import { WalkFigure } from "../../characters/walk";
import { FxCanvas } from "../../fx/FxCanvas";
import { drawRipples } from "../../fx/rain";
import { drawPetal } from "../../fx/petals";
import { BusStopWorld, STOP } from "../../env/BusStop";
import { C } from "../../config/palette";
import { PaperOverlay } from "../../draw/Paper";

/**
 * 第四幕「渡口」C1–C3（1:37.29–1:56.75）
 * C1 水面浮出她的回忆近景，眼睛睁开，花瓣落水把倒影揉碎；
 * C2 她从他身边走过，登船离开，船变成水面上的一个光点（句点）；
 * C3 初见：白天的公交站，她在长椅另一头坐下，两人对视，回忆褪成白纸。
 */

// ---------------- C1 水中的她 ----------------
const STRIPS = 45;
export const C1: React.FC = () => {
  const t = useSongT("C1");
  const appear = track(t, [[97.35, 0], [99.0, 1, E.inOut]]);
  const open = track(t, [[99.4, 0.05], [100.3, 0.95, E.inOut]]);
  const dropT = 101.35;
  const shatter = clamp((t - dropT) / 2.1);
  const fade = track(t, [[102.4, 1], [103.6, 0, E.in]]);
  const hs = headShapes({ turn: -0.08, pitch: -0.12, eyeOpen: open, gaze: 0.05, brow: 0.05, mouth: 0.35 + open * 0.15 }, { ...WOMAN_MEM.look, light: -1 });
  const H = 1080;
  const stripH = H / STRIPS;
  const cx = 900;
  const cy = 560;
  const sc = 3.8;
  const amp = (y: number) => {
    const base = 5 + shatter * 70 * Math.max(0, 1 - Math.abs(y - 560) / 900);
    return Math.sin(y * 0.045 + t * 2.4) * base + Math.sin(y * 0.11 - t * 3.1) * base * 0.4;
  };
  const drawRings = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // 花瓣落水的同心涟漪
      if (t > dropT) {
        const age = t - dropT;
        for (let k = 0; k < 4; k++) {
          const a = age - k * 0.28;
          if (a <= 0) continue;
          const r = a * 420;
          ctx.strokeStyle = `rgba(226,218,196,${Math.max(0, 0.45 - a * 0.18)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(1010, 600, r, r * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      drawRipples(ctx, { x: 960, y: 540, scale: 1 }, t, { seed: 71, count: 10, region: { x0: 0, x1: 1920, y0: 300, y1: 1080 }, period: [1.4, 2.6], size: [20, 60], alpha: 0.25, flat: 0.35, color: "220,214,196" });
      // 落下的那片花瓣
      const pk = clamp((t - (dropT - 1.1)) / 1.1);
      if (pk > 0 && pk < 1) drawPetal(ctx, { x: lerp(820, 1010, pk), y: lerp(-40, 600, pk * pk), size: 26, rot: pk * 5, flip: Math.cos(pk * 8), color: "167,84,88", alpha: 1 });
      if (pk >= 1) drawPetal(ctx, { x: 1010 + (t - dropT) * 12, y: 600 + Math.sin((t - dropT) * 3) * 3, size: 26, rot: 0.6, flip: 0.75, color: "167,84,88", alpha: clamp(1 - (t - dropT - 1.2) / 1.5) });
    },
    [t]
  );
  return (
    <AbsoluteFill style={{ background: "#121b25" }}>
      <svg width={1920} height={1080}>
        <PencilDefs />
        <Defs />
        <rect width={1920} height={1080} fill="url(#wsWater)" />
        {/* 月亮在水里的倒影（右上） */}
        <Water y0={-40} y1={1120} moonX={1560} t={t} reflW={140} seed={12} />
        <defs>
          {Array.from({ length: STRIPS }, (_, i) => (
            <clipPath key={i} id={`strip-${i}`}>
              <rect x={0} y={i * stripH} width={1920} height={stripH} shapeRendering="crispEdges" />
            </clipPath>
          ))}
        </defs>
        {/* 她的脸：按水平条带左右错位，像水里的倒影 */}
        <g opacity={appear * fade * 0.85} style={{ mixBlendMode: "screen" }}>
          {Array.from({ length: STRIPS }, (_, i) => {
            const y = i * stripH + stripH / 2;
            return (
              <g key={i} clipPath={`url(#strip-${i})`}>
                <g transform={`translate(${cx + amp(y)},${cy}) scale(${sc})`}>
                  <TShapes shapes={[...hs.back, ...hs.front]} line={C.memSepia} lw={1.2} />
                </g>
              </g>
            );
          })}
        </g>
        <rect width={1920} height={1080} fill="#1b2a36" opacity={0.25} />
      </svg>
      <FxCanvas draw={drawRings} />
    </AbsoluteFill>
  );
};

// ---------------- C2 她登船离开，船变成一个光点 ----------------
const MOON = { x: 1300, y: 104, r: 70 };
const TinyWalker: React.FC<{ x: number; y: number; s: number; phase: number; design: typeof WOMAN; back?: boolean }> = ({ x, y, s, phase, design }) => {
  const sw = Math.sin(phase) * 7;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={`M-9,-40 L${-8 + sw},0 L${-2 + sw},0 L-3,-40 Z`} fill={design.legs} />
      <path d={`M3,-40 L${4 - sw},0 L${10 - sw},0 L9,-40 Z`} fill={design.legs} />
      <path d="M-16,-118 Q0,-126 16,-118 L22,-36 Q0,-30 -22,-36 Z" fill={design.coat} stroke={C.graphite} strokeWidth={2} />
      <path d="M-16,-104 L-20,-60 M16,-104 L20,-60" stroke={design.coatShade} strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={0} cy={-136} rx={13} ry={15} fill={design.look.hair} />
      <path d="M-14,-140 Q-16,-112 -12,-108 L12,-108 Q16,-112 14,-140 Z" fill={design.look.hair} />
    </g>
  );
};

export const C2: React.FC = () => {
  const t = useSongT("C2");
  const cam: Cam = { x: 1040, y: 640 + track(t, [[103.65, 0], [109.75, -10, E.drift]]), scale: track(t, [[103.65, 1.45], [109.75, 1.5, E.drift]]) };
  // 她沿栈桥走向尽头（越走越小）
  const w = track(t, [[103.75, 0], [106.6, 1, E.inOut]]);
  const step = track(t, [[106.6, 0], [107.25, 1, E.inOut]]);
  const sail = track(t, [[107.4, 0], [109.75, 1, E.in]]);
  const herY = lerp(1060, 700, w) + step * -6;
  const herX = lerp(985, 1000, w) + step * 92;
  const herS = lerp(1.25, 0.42, w) * (1 - step * 0.1);
  const boatX = 1172 + sail * 260;
  const boatY = 672 - sail * 40;
  const boatS = 0.5 * (1 - sail * 0.85);
  const dot = clamp((t - 109.0) / 0.5);
  const drawRings = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawRipples(ctx, cam, t, { seed: 41, count: 14, region: { x0: 0, x1: 1920, y0: 600, y1: 1040 }, period: [1.1, 2.4], size: [14, 42], alpha: 0.35, flat: 0.16, color: "220,214,196" });
    },
    [cam, t]
  );
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <Sky y0={-800} y1={562} />
        <Moon x={MOON.x} y={MOON.y} r={MOON.r} glow={1.6} />
        <g filter="url(#pencil-soft)">
          <Skyline base={562} x0={-300} x1={2240} seed={7} />
        </g>
        <Water y0={560} y1={1260} moonX={MOON.x} t={t} reflW={90} />
        <ellipse cx={MOON.x} cy={780} rx={240} ry={320} fill="#c2c0aa" opacity={0.12} filter="url(#soft-blur-60)" />
        <Jetty near={[690, 1250, 1262]} far={[886, 1050, 650]} t={t} />
        {/* 船（她坐上去之后一起离开） */}
        <g>
          <Boat x={boatX} y={boatY} scale={boatS} t={t} />
          {step > 0.6 ? <TinyWalker x={boatX + 6 * boatS / 0.5} y={boatY + 4 * boatS} s={0.42 * boatS / 0.5} phase={0} design={WOMAN} /> : null}
          <circle cx={boatX + 30 * boatS} cy={boatY - 46 * boatS} r={4 + 30 * boatS} fill="#e7c992" opacity={0.25 + dot * 0.3} filter="url(#soft-blur-6)" />
          <circle cx={boatX + 30 * boatS} cy={boatY - 46 * boatS} r={2.5 + 4 * boatS} fill="#f3dfb2" opacity={0.95} />
        </g>
        {/* 长椅与他（背影），她从他身边走过 */}
        <BenchBack x={968} y={690} w={900} scale={0.25} part="legs" />
        <g transform={`translate(928,${690 - 2}) scale(0.25)`}>
          <TShapes shapes={backShapes({ headTurn: clamp((w - 0.55) * 4) * 0.4, headTilt: 3, slump: 0.6, lean: 1 }, MAN)} line={MAN.line} lw={MAN.lw * 1.3} />
        </g>
        <BenchBack x={968} y={690} w={900} scale={0.25} part="back" />
        {step < 0.6 ? <TinyWalker x={herX} y={herY} s={herS} phase={t * 7.5} design={WOMAN} /> : null}
      </WorldSvg>
      <FxCanvas draw={drawRings} />
    </AbsoluteFill>
  );
};

// ---------------- C3 初见 ----------------
export const C3: React.FC = () => {
  const t = useSongT("C3");
  const cam: Cam = { x: 1020, y: 470, scale: track(t, [[109.75, 0.96], [116.75, 1.0, E.drift]]) };
  const SIT_X = 1250;
  // 她从右边走来 → 转成正面 → 坐下
  const walkEnd = 111.2;
  const walking = t < walkEnd;
  const wk = clamp((t - 109.75) / (walkEnd - 109.75));
  const walkX = lerp(2050, SIT_X + 10, 1 - Math.pow(1 - wk, 1.6));
  const sit = track(t, [[111.35, 1], [112.3, 0, E.inOut]]);
  const glance = track(t, [[112.2, 0], [112.8, 1, E.inOut], [113.8, 1], [114.3, 0.3, E.inOut]]);
  const shy = track(t, [[113.6, 0], [114.2, 1, E.inOut]]);
  const her: FrontPose = {
    ...FRONT_NEUTRAL,
    stand: sit,
    head: { turn: lerp(0.1, -0.5, glance) + shy * 0.3, pitch: 0.05 + shy * 0.2, eyeOpen: 0.85 - shy * 0.3, gaze: lerp(0, -0.6, glance), brow: 0, mouth: 0.2 + shy * 0.4 },
    headTilt: -2 * glance,
    bodyTurn: -0.1,
    legSlant: -0.5,
    handL: { at: [-40, lerp(-30, -256, sit)], fore: lerp(0.55, 1, sit) },
    handR: { at: [42, lerp(-30, -256, sit)], fore: lerp(0.55, 1, sit) },
  };
  const man: FrontPose = {
    ...FRONT_NEUTRAL,
    head: { turn: lerp(0.05, 0.55, clamp((t - 110.4) / 0.8)) - glance * 0.05, pitch: 0.12, eyeOpen: 0.8 + glance * 0.15, gaze: 0.6, brow: 0, mouth: 0.1 + glance * 0.3 + shy * 0.2 },
    bodyTurn: 0.08,
    slump: 0.15,
    handL: { at: [-34, -40], fore: 0.5, angle: 18 },
    handR: { at: [36, -40], fore: 0.5, angle: -18 },
  };
  // 「何须感伤离别」：画面褪成白纸
  const bleach = track(t, [[114.4, 0], [116.6, 1, E.in]]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: `brightness(${1 + bleach * 0.9}) contrast(${1 - bleach * 0.7}) saturate(${1 - bleach * 0.6})` }}>
        <BusStopWorld
          cam={cam}
          t={t}
          tod="day"
          rain={0}
          glassDrops={0}
          lampGlow={0}
          man={man}
          woman={walking ? null : her}
          manDesign={MAN_MEM}
          womanDesign={WOMAN_MEM}
          manX={790}
          womanX={SIT_X}
          bouquet={null}
          extraFigures={walking ? <WalkFigure phase={((walkX - 2050) / 380) * Math.PI} design={WOMAN_MEM} x={walkX} y={STOP.seatY - 8 + 262 * STOP.figScale} scale={STOP.figScale} stride={1 - Math.max(0, wk - 0.85) * 4} filter="url(#pencil)" /> : null}
        />
        <PaperOverlay memory opacity={0.55} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 160px rgba(120,90,60,0.35)", pointerEvents: "none" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#f3ecdc", opacity: bleach * 0.85 }} />
      <PaperOverlay memory opacity={bleach * 0.6} />
    </AbsoluteFill>
  );
};

