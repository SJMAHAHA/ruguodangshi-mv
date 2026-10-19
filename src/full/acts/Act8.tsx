import React, { useCallback, useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { E, track, lerp, clamp } from "../../lib/anim";
import { Cam, WorldSvg, applyCam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { Defs, Sky, Moon, Skyline, Water, Jetty, Willow, BenchBack } from "../../env/Waterside";
import { Lantern, LanternArt } from "../../env/Lantern";
import { PencilDefs } from "../../draw/Defs";
import { TShapes, FigureFront, FRONT_NEUTRAL, FrontPose, frontShapes } from "../../characters/front";
import { backShapes } from "../../characters/back";
import { walkShapes } from "../../characters/walk";
import { MAN, WOMAN, WOMAN_MEM } from "../../characters/designs";
import { Bench } from "../../props/Bench";
import { STOP } from "../../env/BusStop";
import { FxCanvas } from "../../fx/FxCanvas";
import { drawFlight, drawPetal, Flight } from "../../fx/petals";
import { drawRipples } from "../../fx/rain";
import { drawShapesCanvas } from "../../fx/shapesCanvas";
import { mulberry32, noise1 } from "../../lib/random";
import { P } from "../../lib/geom";
import { C } from "../../config/palette";
import { Bloom, silhouetteOf } from "./shared";

/**
 * 第八幕「月下」G1–G8（3:13.86–4:06.2，最后两遍副歌）
 * G1 光晕变成月亮，镜头沿花瓣下摇到水面，河灯漂来；
 * G2 河灯从他面前漂过，每盏灯的纸面上画着一段回忆；
 * G3 载着她的小船从月亮前经过，她回头；
 * G4 他的近景，河灯的暖光映在脸上，他松开手，花瓣被风带走；
 * G5 大远景：花瓣和河灯连成一条河，流向对岸的城市；
 * G6 栈桥长椅正面：他坐左边，回忆里的她坐右边，两层纸错开；
 * G7 她转头对他笑，随后化作花瓣被风吹散；
 * G8 背面：他独坐，右边空着，月亮的倒影落在空位前。
 */

const MOON = { x: 1300, y: 104, r: 70 };
const SEAT_Y = STOP.seatY - 8;
const K = STOP.figScale;

/** 透视：水面上 y 越大越近 */
const depthScale = (y: number) => 0.06 + ((y - 560) / 700) * 0.62;

// ======================= G1 =======================
const G1_LANTERNS = Array.from({ length: 12 }, (_, i) => {
  const r = mulberry32(6100 + i);
  const left = i % 2 === 0;
  return { x0: left ? -260 + r() * 820 : 1330 + r() * 1100, y: 610 + Math.pow(r(), 0.8) * 560, seed: 61 + i, v: 10 + r() * 14 };
});
const G1_PETALS: Flight = {
  seed: 611,
  count: 150,
  spawn: [189.4, 199.6],
  from: { x0: -700, x1: 2100, y0: -900, y1: -200 },
  vel: [150, 250],
  velJitter: [70, 70],
  sway: 34,
  size: [8, 20],
  fadeY: 1250,
};

const JettyWithHim: React.FC<{ t: number; turn?: number }> = ({ t, turn = 0 }) => (
  <g>
    <Jetty near={[690, 1250, 1262]} far={[886, 1050, 650]} t={t} />
    <BenchBack x={968} y={690} w={900} scale={0.25} part="legs" />
    <g transform={`translate(928,${688}) scale(0.25)`}>
      <TShapes shapes={backShapes({ headTurn: turn, headTilt: 3, slump: 0.6, lean: 1 }, MAN)} line={MAN.line} lw={MAN.lw * 1.3} />
    </g>
    <BenchBack x={968} y={690} w={900} scale={0.25} part="back" />
  </g>
);

export const G1: React.FC = () => {
  const t = useSongT("G1");
  const k = track(t, [[194.25, 0], [198.9, 1, E.inOut]]);
  const cam: Cam = { x: lerp(MOON.x, 1080, k), y: lerp(MOON.y, 640, k), scale: 1.65 * Math.pow(1 / 1.65, k) };
  const bloom = track(t, [[193.86, 1], [194.75, 0, E.out]]);
  const lanterns = G1_LANTERNS.map((l) => ({ ...l, x: l.x0 - l.v * (t - 193.86) })).sort((a, b) => a.y - b.y);
  const drawFx = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawRipples(ctx, cam, t, { seed: 612, count: 22, region: { x0: -300, x1: 2300, y0: 600, y1: 1200 }, period: [1.0, 2.2], size: [14, 40], alpha: 0.35, flat: 0.16, color: "220,214,196" });
      drawFlight(ctx, cam, t, G1_PETALS, true);
    },
    [cam, t]
  );
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <Sky y0={-900} y1={562} />
        <Moon x={MOON.x} y={MOON.y} r={MOON.r} glow={1.6 + bloom} />
        <ellipse cx={MOON.x} cy={MOON.y} rx={900} ry={520} fill="#7f8f96" opacity={0.08} filter="url(#soft-blur-60)" />
        <g filter="url(#pencil-soft)">
          <Skyline base={562} x0={-500} x1={2500} seed={7} />
        </g>
        <Water y0={560} y1={1300} moonX={MOON.x} t={t} reflW={90} />
        <ellipse cx={MOON.x} cy={780} rx={240} ry={320} fill="#c2c0aa" opacity={0.12} filter="url(#soft-blur-60)" />
        <rect x={-600} y={520} width={3200} height={80} fill="#8b989a" opacity={0.16} filter="url(#soft-blur-20)" />
        {lanterns
          .filter((l) => l.y < 700)
          .map((l, i) => (
            <Lantern key={`f${i}`} uid={`g1f${i}`} x={l.x} y={l.y} scale={depthScale(l.y)} t={t} seed={l.seed} />
          ))}
        <JettyWithHim t={t} />
        {lanterns
          .filter((l) => l.y >= 700)
          .map((l, i) => (
            <Lantern key={`n${i}`} uid={`g1n${i}`} x={l.x} y={l.y} scale={depthScale(l.y)} t={t} seed={l.seed} />
          ))}
        <Willow x={-40} y={-260} t={t} scale={1.1} />
      </WorldSvg>
      <FxCanvas draw={drawFx} />
      <Bloom k={bloom} />
    </AbsoluteFill>
  );
};

// ======================= 栈桥正面（G2 / G4 / G6 / G7） =======================
/** 从水面看向栈桥尽头的长椅：身后是岸、柳树、挂灯的木柱；月光从镜头这边照过去 */
const JettyFront: React.FC<{ t: number; children?: React.ReactNode; front?: React.ReactNode }> = ({ t, children, front }) => {
  const shore = useMemo(() => {
    const r = mulberry32(7070);
    const roofs: { x: number; w: number; h: number }[] = [];
    let x = -700;
    while (x < 2700) {
      const w = 160 + r() * 220;
      roofs.push({ x, w, h: 60 + r() * 70 });
      x += w + r() * 30;
    }
    const lights = Array.from({ length: 16 }, () => ({ x: -600 + r() * 3200, y: 640 + r() * 40, a: 0.4 + r() * 0.5 }));
    return { roofs, lights };
  }, []);
  return (
    <g>
      <defs>
        <linearGradient id="jfSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#111a24" />
          <stop offset="1" stopColor="#2a3845" />
        </linearGradient>
        <linearGradient id="jfWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2a34" />
          <stop offset="1" stopColor="#121b23" />
        </linearGradient>
      </defs>
      <rect x={-800} y={-600} width={3600} height={1300} fill="url(#jfSky)" />
      {/* 岸：老屋的屋檐剪影与零星暖灯 */}
      <g filter="url(#pencil-soft)">
        {shore.roofs.map((b, i) => (
          <g key={i}>
            <path d={`M${b.x - 20},${700 - b.h} Q${b.x + b.w / 2},${700 - b.h - 26} ${b.x + b.w + 20},${700 - b.h} L${b.x + b.w},${700 - b.h + 14} L${b.x + b.w},700 L${b.x},700 L${b.x},${700 - b.h + 14} Z`} fill={i % 2 ? "#161f27" : "#1a242d"} />
          </g>
        ))}
      </g>
      {shore.lights.map((l, i) => (
        <g key={i}>
          <circle cx={l.x} cy={l.y} r={3} fill="#e2c38c" opacity={l.a} />
          <circle cx={l.x} cy={l.y} r={18} fill="#c5a275" opacity={0.12 * l.a} />
          <line x1={l.x} y1={712} x2={l.x} y2={760} stroke="#c5a275" strokeWidth={3} opacity={0.12 * l.a} />
        </g>
      ))}
      {/* 栈桥与岸之间的水 */}
      <rect x={-800} y={700} width={3600} height={200} fill="#1a2630" />
      {/* 栈桥：伸向岸边的木板，近处是平台 */}
      <path d="M840,730 L1080,730 L2600,960 L2600,1004 L-700,1004 L-700,960 Z" fill="#3a3933" />
      {Array.from({ length: 12 }, (_, i) => {
        const k = Math.pow(i / 11, 1.6);
        const y = 730 + k * 274;
        return <line key={i} x1={lerp(840, -700, k)} y1={y} x2={lerp(1080, 2600, k)} y2={y} stroke="#24262a" strokeWidth={1 + k * 2.5} opacity={0.75} />;
      })}
      <rect x={-700} y={1004} width={3300} height={34} fill="#2a2925" stroke={C.graphite} strokeWidth={2} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={-560 + i * 400} y={1036} width={30} height={90} fill="#151b20" />
      ))}
      {/* 挂灯笼的木柱（画面左） */}
      <rect x={250} y={380} width={16} height={630} fill="#1b2025" stroke={C.graphite} strokeWidth={2} />
      <path d="M256,390 l70,0" stroke="#1b2025" strokeWidth={8} />
      <g transform={`translate(${318 + Math.sin(t * 1.2) * 3},${452})`}>
        <circle r={260} fill="url(#lanternGlow)" opacity={0.55} />
        <line x1={0} y1={-60} x2={0} y2={-34} stroke="#1b2025" strokeWidth={2} />
        <ellipse rx={26} ry={34} fill="#d9b277" stroke={C.graphite} strokeWidth={2} />
        <path d="M-26,0 h52 M-22,-18 h44 M-22,18 h44" stroke="#9e7444" strokeWidth={1.4} opacity={0.6} />
      </g>
      {children}
      {/* 近处水面 */}
      <rect x={-800} y={1060} width={3600} height={800} fill="url(#jfWater)" />
      <ellipse cx={320} cy={1170} rx={60} ry={130} fill="#c99a5c" opacity={0.18} filter="url(#soft-blur-20)" />
      {Array.from({ length: 24 }, (_, i) => {
        const r = mulberry32(7200 + i);
        const y = 1080 + Math.pow(r(), 1.3) * 500;
        const x = -600 + r() * 3200 + t * (6 + r() * 8);
        return <line key={i} x1={x} y1={y} x2={x + 60 + r() * 160} y2={y} stroke="#7d8d93" strokeWidth={1.5} opacity={0.08 + r() * 0.08} strokeLinecap="round" />;
      })}
      {front}
    </g>
  );
};

/** 他坐在左边（正面），默认看着水面 */
const manOnJetty = (t: number, head: Partial<FrontPose["head"]>, extra: Partial<FrontPose> = {}): FrontPose => ({
  ...FRONT_NEUTRAL,
  head: { turn: 0.1, pitch: 0.35, eyeOpen: 0.6, gaze: 0.1, brow: 0.4, mouth: -0.15, ...head },
  slump: 0.45,
  bodyTurn: 0.06,
  handL: { at: [-40, -40], fore: 0.5, angle: 20 },
  handR: { at: [40, -40], fore: 0.5, angle: -20 },
  breathe: 0.5 + 0.5 * Math.sin(t * 1.7),
  ...extra,
});

/** 月光（冷）与河灯的暖光（从下方）照在人物上 */
const LightOnFigures: React.FC<{ warm: number; flick: number }> = ({ warm, flick }) => (
  <g style={{ mixBlendMode: "screen" }} pointerEvents="none">
    <ellipse cx={900} cy={1000} rx={700} ry={360} fill="#c9944f" opacity={0.16 * warm * flick} filter="url(#soft-blur-60)" />
  </g>
);

// ======================= G2 =======================
const G2_PASS: { art: LanternArt; xs: number; y: number; s: number; v: number }[] = [
  { art: "wire", xs: 640, y: 862, s: 2.45, v: 150 },
  { art: "book", xs: -300, y: 930, s: 2.85, v: 178 },
  { art: "glass", xs: 1360, y: 824, s: 2.1, v: 128 },
  { art: "bench", xs: -980, y: 896, s: 2.65, v: 165 },
];
export const G2: React.FC = () => {
  const t = useSongT("G2");
  const cam: Cam = { x: 960 + track(t, [[200.05, 0], [206.35, 30, E.drift]]), y: 690, scale: 0.82 };
  const look = track(t, [[201.0, 0], [202.6, 1, E.inOut], [204.4, 1], [205.8, 1.6, E.inOut]]);
  const man = manOnJetty(t, { turn: lerp(-0.1, 0.25, look / 1.6), pitch: 0.55, eyeOpen: 0.5, gaze: lerp(-0.2, 0.4, look / 1.6), mouth: -0.05 });
  const flick = 0.92 + 0.08 * Math.sin(t * 7.3);
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      {/* 背景（失焦）：栈桥、他、长椅 */}
      <AbsoluteFill style={{ filter: "blur(4px)" }}>
        <WorldSvg cam={cam}>
          <PencilDefs />
          <Defs />
          <JettyFront t={t}>
            <Bench w={STOP.benchW} x={STOP.benchX} y={STOP.seatY} scale={STOP.benchScale} />
            <FigureFront pose={man} design={MAN} x={STOP.manX} y={SEAT_Y} scale={K} filter="url(#pencil)" />
            <LightOnFigures warm={1} flick={flick} />
          </JettyFront>
          {/* 远处的河灯 */}
          {[0, 1, 2].map((i) => (
            <Lantern key={i} uid={`g2b${i}`} x={-200 + i * 900 + (t - 200) * 30} y={1090} scale={0.7} t={t} seed={90 + i} />
          ))}
        </WorldSvg>
      </AbsoluteFill>
      {/* 前景：画着回忆的河灯，从左往右漂过 */}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <PencilDefs />
        <Defs />
        {G2_PASS.slice()
          .sort((a, b) => a.y - b.y)
          .map((l, i) => {
            const x = l.xs + (t - 200.05) * l.v;
            if (x < -500 || x > 2400) return null;
            return <Lantern key={i} uid={`g2f${i}`} x={x} y={l.y} scale={l.s} t={t} seed={70 + i} art={l.art} />;
          })}
      </svg>
    </AbsoluteFill>
  );
};

// ======================= G3 =======================
const SIL = "#0f151b";
const SIL_W = silhouetteOf(WOMAN, SIL);
const BIG_MOON = { x: 980, y: 500, r: 250 };
const G3_PETALS: Flight = {
  seed: 631,
  count: 26,
  spawn: [203.0, 212.0],
  from: { x0: -300, x1: 900, y0: -200, y1: 300 },
  vel: [180, 90],
  velJitter: [60, 50],
  sway: 40,
  size: [14, 30],
};
export const G3: React.FC = () => {
  const t = useSongT("G3");
  const bx = 330 + 175 * (t - 206.35);
  const by = 830 + Math.sin(t * 1.1) * 4;
  const turnU = track(t, [[208.9, 0], [209.6, 1, E.inOut]]);
  const sx = Math.cos(turnU * Math.PI);
  const sxSafe = Math.sign(sx || 1) * Math.max(0.1, Math.abs(sx));
  const cam: Cam = { x: 960, y: 540 + track(t, [[206.35, 0], [212.35, -14, E.drift]]), scale: 1 };
  const her = useMemo(() => (p: number) => walkShapes(p, SIL_W, 0.08), []);
  const drawFx = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawRipples(ctx, cam, t, { seed: 632, count: 12, region: { x0: 0, x1: 1920, y0: 760, y1: 1080 }, period: [1.2, 2.4], size: [20, 50], alpha: 0.3, flat: 0.14, color: "230,222,200" });
      drawFlight(ctx, cam, t, G3_PETALS);
    },
    [cam, t]
  );
  return (
    <AbsoluteFill style={{ background: "#0f1720" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <Sky y0={-200} y1={700} />
        <Moon x={BIG_MOON.x} y={BIG_MOON.y} r={BIG_MOON.r} glow={0.9} />
        <g filter="url(#pencil-soft)">
          <Skyline base={712} x0={-400} x1={2400} seed={21} scale={0.55} />
        </g>
        <Water y0={710} y1={1200} moonX={BIG_MOON.x} t={t} reflW={300} seed={23} />
        {/* 船（乌篷船剪影）与船头的她 */}
        <g transform={`translate(${bx},${by})`} filter="url(#pencil-soft)">
          <path d="M-330,-36 Q-170,40 0,44 Q190,40 340,-48 L318,-22 Q160,18 0,18 Q-170,16 -306,-18 Z" fill={SIL} />
          {/* 乌篷：低而长的拱，竹篾的纹路 */}
          <path d="M-210,-10 Q-206,-96 -40,-104 Q126,-96 136,-10 Z" fill={SIL} />
          <path d="M-224,-14 Q-214,-106 -40,-114 Q138,-106 150,-14" fill="none" stroke={SIL} strokeWidth={8} />
          {[-150, -95, -40, 15, 70].map((x) => (
            <path key={x} d={`M${x},-12 Q${x + 4},-60 ${x + 8},-98`} fill="none" stroke="#2c3740" strokeWidth={2.5} opacity={0.7} />
          ))}
          {/* 船尾的小灯 */}
          <circle cx={-300} cy={-70} r={70} fill="url(#lanternGlow)" opacity={0.6} />
          <ellipse cx={-300} cy={-70} rx={9} ry={12} fill="#e2bf86" />
          <line x1={-300} y1={-82} x2={-300} y2={-110} stroke={SIL} strokeWidth={3} />
          {/* 她 */}
          <g transform={`translate(210,-4) scale(${0.42 * sxSafe},0.42)`}>
            <TShapes shapes={her(0.4 + Math.sin(t * 0.8) * 0.15)} line={SIL} lw={2} />
          </g>
          {/* 船的倒影 */}
          <path d="M-300,52 Q0,80 320,46" fill="none" stroke="#56636a" strokeWidth={5} opacity={0.3} />
        </g>
      </WorldSvg>
      <FxCanvas draw={drawFx} />
    </AbsoluteFill>
  );
};

// ======================= G4 =======================
export const G4: React.FC = () => {
  const t = useSongT("G4");
  const cam: Cam = { x: STOP.manX + 40, y: SEAT_Y - 205 + track(t, [[212.35, 0], [219.0, -12, E.drift]]), scale: track(t, [[212.35, 1.72], [219.0, 1.8, E.drift]]) };
  const lift = track(t, [[213.6, 0], [214.7, 1, E.inOut]]);
  const open = track(t, [[215.3, 0], [215.9, 1, E.out]]);
  const follow = track(t, [[215.6, 0], [217.2, 1, E.inOut]]);
  const flick = 0.9 + 0.06 * Math.sin(t * 8.1) + 0.04 * Math.sin(t * 13.3);
  // 双手捧着花瓣：在腿上 → 抬到胸前 → 张开
  const hR: P = [lerp(26, 34, lift), lerp(-44, -150, lift)];
  const hL: P = [lerp(-30, -20, lift), lerp(-44, -146, lift)];
  const man = manOnJetty(
    t,
    {
      turn: lerp(0.05, 0.42, follow) + noise1(t * 0.5, 41) * 0.01,
      pitch: lerp(0.6, -0.12, follow),
      eyeOpen: lerp(0.45, 0.75, follow),
      gaze: lerp(0.1, 0.5, follow),
      brow: lerp(0.5, 0.25, follow),
      mouth: lerp(-0.15, 0.1, follow),
    },
    {
      slump: lerp(0.5, 0.3, lift),
      handL: { at: hL, fore: 0.8, angle: lerp(20, 48, lift), curl: lerp(0.6, 0.2, open) },
      handR: { at: hR, fore: 0.8, angle: lerp(-20, -48, lift), curl: lerp(0.6, 0.15, open) },
    }
  );
  // 手心里的花瓣，张开后被风带走（向画面右上）
  const palm: P = [STOP.manX + ((hL[0] + hR[0]) / 2) * K, SEAT_Y + ((hL[1] + hR[1]) / 2 - 20) * K];
  const drawFx = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const s = cam.scale;
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 960 - cam.x * s, 540 - cam.y * s);
      for (let i = 0; i < 26; i++) {
        const r = mulberry32(6400 + i);
        const ox = (r() - 0.5) * 60;
        const oy = (r() - 0.5) * 22;
        const t0 = 215.45 + r() * 0.9;
        const age = Math.max(0, t - t0);
        const vx = 160 + r() * 160;
        const vy = -60 - r() * 110;
        const sw = Math.sin(age * (1.4 + r()) + r() * 6) * 30 * Math.min(1, age);
        const x = palm[0] + ox + vx * age + sw + age * age * 30;
        const y = palm[1] + oy + vy * age - age * age * 12;
        const rot = r() * 6 + age * (1 + r() * 2);
        const flip = age > 0 ? Math.cos(age * (2 + r() * 2) + r() * 6) : 0.8;
        drawPetal(ctx, { x, y, size: 10 + r() * 6, rot, flip, color: ["167,84,88", "191,109,111", "150,70,76"][i % 3], alpha: clamp(1 - (age - 2.6) / 1.2) });
      }
      ctx.restore();
    },
    [cam, t, palm]
  );
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <g style={{ filter: "blur(5px)" }}>
          <JettyFront t={t} />
        </g>
        <Bench w={STOP.benchW} x={STOP.benchX} y={STOP.seatY} scale={STOP.benchScale} part="back" />
        <FigureFront pose={man} design={MAN} x={STOP.manX} y={SEAT_Y} scale={K} filter="url(#pencil)" />
      </WorldSvg>
      <FxCanvas draw={drawFx} />
      {/* 河灯的暖光从下方映上来 */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 1100px 520px at 900px 1200px, rgba(214,160,92,${0.34 * flick}), rgba(214,160,92,0) 100%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(8,12,18,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};

// ======================= G5 =======================
const RIVER: [P, P, P, P] = [
  [2500, 1250],
  [1760, 840],
  [1440, 650],
  [1310, 566],
];
const bez = (u: number): P => {
  const [a, b, c, d] = RIVER;
  const v = 1 - u;
  return [v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1]];
};
export const G5: React.FC = () => {
  const t = useSongT("G5");
  const cam: Cam = { x: 1080 + track(t, [[219.0, 0], [225.3, 40, E.drift]]), y: 420, scale: track(t, [[219.0, 0.74], [225.3, 0.7, E.drift]]) };
  const N = 34;
  const lan = Array.from({ length: N }, (_, i) => {
    const r = mulberry32(6500 + i);
    // u 越大越远；沿河缓缓漂向对岸
    const u = ((i / N + (t - 219) * 0.012 + r() * 0.01) % 1 + 1) % 1;
    const [x, y] = bez(u);
    const side = (r() - 0.5) * 240 * (1 - u);
    return { x: x + side, y: y + (r() - 0.5) * 30 * (1 - u), u, seed: 650 + i };
  }).sort((a, b) => a.y - b.y);
  const drawFx = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const s = cam.scale;
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 960 - cam.x * s, 540 - cam.y * s);
      // 水面上的花瓣带
      for (let i = 0; i < 260; i++) {
        const r = mulberry32(6600 + i);
        const u = ((r() + (t - 219) * 0.014) % 1 + 1) % 1;
        const [x, y] = bez(u);
        const sc = depthScale(y);
        const side = (r() - 0.5) * 340 * (1 - u);
        drawPetal(ctx, { x: x + side, y: y + (r() - 0.5) * 40 * (1 - u), size: 30 * sc, rot: 1.57 + (r() - 0.5) * 0.6, flip: 0.35, color: ["167,84,88", "134,57,63", "191,109,111"][i % 3], alpha: 0.85 * Math.min(1, (1 - u) * 6) });
      }
      // 空中的花瓣流（沿同一条河的方向，高一些）
      for (let i = 0; i < 120; i++) {
        const r = mulberry32(6700 + i);
        const u = ((r() + (t - 219) * 0.03) % 1 + 1) % 1;
        const [x, y] = bez(u);
        const sc = depthScale(y);
        const h = (120 + r() * 520) * sc;
        drawPetal(ctx, { x: x + (r() - 0.5) * 500 * (1 - u) + Math.sin(t * 1.3 + i) * 20 * sc, y: y - h, size: 34 * sc, rot: r() * 6 + t * (r() - 0.5) * 2, flip: Math.cos(t * (1 + r() * 2) + i), color: ["167,84,88", "191,109,111", "150,70,76"][i % 3], alpha: Math.min(1, (1 - u) * 5) * 0.9 });
      }
      ctx.restore();
    },
    [cam, t]
  );
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <Sky y0={-900} y1={562} />
        <Moon x={MOON.x} y={MOON.y} r={MOON.r} glow={1.6} />
        <ellipse cx={MOON.x} cy={MOON.y} rx={900} ry={520} fill="#7f8f96" opacity={0.08} filter="url(#soft-blur-60)" />
        <g filter="url(#pencil-soft)">
          <Skyline base={562} x0={-900} x1={3200} seed={7} />
        </g>
        <Water y0={560} y1={1500} moonX={MOON.x} t={t} reflW={90} />
        <rect x={-900} y={520} width={4200} height={80} fill="#8b989a" opacity={0.16} filter="url(#soft-blur-20)" />
        {/* 河灯的光在水上连成一条暖色的带 */}
        <path d={`M${RIVER[0][0]},${RIVER[0][1]} C${RIVER[1][0]},${RIVER[1][1]} ${RIVER[2][0]},${RIVER[2][1]} ${RIVER[3][0]},${RIVER[3][1]}`} stroke="#c99a5c" strokeWidth={90} fill="none" opacity={0.1} filter="url(#soft-blur-60)" />
        <JettyWithHim t={t} />
        {lan.map((l, i) => (
          <Lantern key={i} uid={`g5${i}`} x={l.x} y={l.y} scale={depthScale(l.y)} t={t} seed={l.seed} lit={Math.min(1, (1 - l.u) * 8)} />
        ))}
        <Willow x={-300} y={-700} t={t} scale={1.5} />
      </WorldSvg>
      <FxCanvas draw={drawFx} />
    </AbsoluteFill>
  );
};

// ======================= G6 / G7：回忆纸层里的她 =======================
let OFF: HTMLCanvasElement | null = null;
const offCanvas = () => {
  if (!OFF) {
    OFF = document.createElement("canvas");
    OFF.width = 1920;
    OFF.height = 1080;
  }
  return OFF;
};
/** 纸层的撕边（以她的座位为原点的局部坐标） */
const TORN: P[] = (() => {
  const r = mulberry32(7700);
  const pts: P[] = [];
  const box = { x0: -190, x1: 210, y0: -560, y1: 330 };
  const n = 10;
  for (let i = 0; i <= n; i++) pts.push([lerp(box.x0, box.x1, i / n), box.y0 + (r() - 0.5) * 22]);
  for (let i = 1; i <= n; i++) pts.push([box.x1 + (r() - 0.5) * 22, lerp(box.y0, box.y1, i / n)]);
  for (let i = 1; i <= n; i++) pts.push([lerp(box.x1, box.x0, i / n), box.y1 + (r() - 0.5) * 22]);
  for (let i = 1; i < n; i++) pts.push([box.x0 + (r() - 0.5) * 22, lerp(box.y1, box.y0, i / n)]);
  return pts;
})();

export const drawMemoryHer = (
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  t: number,
  pose: FrontPose,
  o: { dx: number; dy: number; rot: number; alpha: number; dissolve?: number; tint?: string }
) => {
  const off = offCanvas();
  const oc = off.getContext("2d");
  if (!oc) return;
  oc.setTransform(1, 0, 0, 1, 0, 0);
  oc.clearRect(0, 0, 1920, 1080);
  oc.save();
  applyCam(oc, cam);
  const ox = STOP.womanX + o.dx;
  const oy = SEAT_Y + o.dy;
  oc.translate(ox, oy);
  oc.rotate((o.rot * Math.PI) / 180);
  // 纸
  const torn = new Path2D();
  TORN.forEach(([x, y], i) => (i === 0 ? torn.moveTo(x, y) : torn.lineTo(x, y)));
  torn.closePath();
  const paperK = o.dissolve !== undefined ? clamp(1 - (t - o.dissolve - 0.2) / 1.4) : 1;
  oc.fillStyle = `rgba(221,211,189,${0.2 * paperK})`;
  oc.fill(torn);
  oc.strokeStyle = `rgba(236,226,204,${0.35 * paperK})`;
  oc.lineWidth = 2;
  oc.stroke(torn);
  oc.restore();
  oc.save();
  applyCam(oc, cam);
  oc.translate(ox, oy);
  oc.rotate((o.rot * Math.PI) / 180);
  oc.translate(-STOP.womanX, -SEAT_Y);
  drawShapesCanvas(oc, frontShapes(pose, WOMAN_MEM), { x: STOP.womanX, y: SEAT_Y, scale: K }, { fillAlpha: 0.9, lineAlpha: 1, line: C.memSepia, lw: 2.4 });
  oc.restore();
  // 夜里的回忆：只在已画的像素上压一层很淡的墨蓝，让暖色不至于跳出来
  oc.save();
  oc.globalCompositeOperation = "source-atop";
  oc.fillStyle = o.tint ?? "rgba(36,50,65,0.22)";
  oc.fillRect(0, 0, 1920, 1080);
  oc.restore();

  // 化作花瓣：按格子从外侧（画面右）往里散开
  const petals: { x: number; y: number; age: number; r: () => number; i: number }[] = [];
  if (o.dissolve !== undefined && t > o.dissolve) {
    const CELL = 22;
    const s = cam.scale;
    const toPx = (wx: number, wy: number): P => [960 + (wx - cam.x) * s, 540 + (wy - cam.y) * s];
    const ca = Math.cos((o.rot * Math.PI) / 180);
    const sa = Math.sin((o.rot * Math.PI) / 180);
    const world = (lx: number, ly: number): P => [ox + lx * ca - ly * sa, oy + lx * sa + ly * ca];
    // 读一次像素，判断格子里是不是她（纸的透明度很低，不算）
    const p0 = toPx(ox - 200, oy - 580);
    const p1 = toPx(ox + 220, oy + 340);
    const bx = Math.max(0, Math.floor(p0[0]));
    const by = Math.max(0, Math.floor(p0[1]));
    const bw = Math.min(1920, Math.ceil(p1[0])) - bx;
    const bh = Math.min(1080, Math.ceil(p1[1])) - by;
    const img = bw > 0 && bh > 0 ? oc.getImageData(bx, by, bw, bh).data : null;
    oc.save();
    applyCam(oc, cam);
    oc.globalCompositeOperation = "destination-out";
    let idx = 0;
    for (let ly = -560; ly <= 330; ly += CELL) {
      for (let lx = -190; lx <= 210; lx += CELL) {
        idx++;
        const r = mulberry32(7800 + idx * 7);
        const xn = (lx + 190) / 400;
        const yn = (ly + 560) / 890;
        const tc = o.dissolve + (1 - xn) * 1.1 + yn * 0.35 + r() * 0.5;
        if (t < tc) continue;
        // 格子位置与大小都打乱，避免看出网格
        const [wx, wy] = world(lx + (r() - 0.5) * CELL * 0.9, ly + (r() - 0.5) * CELL * 0.9);
        const rad = CELL * (0.85 + r() * 0.6);
        const er = Math.min(1, (t - tc) / 0.3);
        oc.globalAlpha = 0.5 * er;
        oc.beginPath();
        oc.ellipse(wx, wy, rad * 1.3, rad * 1.05, r() * 3, 0, Math.PI * 2);
        oc.fill();
        oc.globalAlpha = er;
        oc.beginPath();
        oc.ellipse(wx, wy, rad, rad * 0.8, r() * 3, 0, Math.PI * 2);
        oc.fill();
        if (img) {
          const [px, py] = toPx(wx, wy);
          const ix = Math.round(px) - bx;
          const iy = Math.round(py) - by;
          if (ix >= 0 && iy >= 0 && ix < bw && iy < bh && img[(iy * bw + ix) * 4 + 3] > 150 && r() < 0.55) petals.push({ x: wx, y: wy, age: t - tc, r, i: idx });
        }
      }
    }
    oc.restore();
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = o.alpha;
  ctx.drawImage(off, 0, 0);
  ctx.restore();
  if (petals.length) {
    ctx.save();
    applyCam(ctx, cam);
    for (const p of petals) {
      const r = p.r;
      const vx = 140 + r() * 200;
      const vy = -70 - r() * 140;
      const a = p.age;
      const sw = Math.sin(a * (1.5 + r()) + r() * 6) * 26 * Math.min(1, a);
      drawPetal(ctx, {
        x: p.x + vx * a + a * a * 40 + sw,
        y: p.y + vy * a - a * a * 10,
        size: 9 + r() * 6,
        rot: r() * 6 + a * (1 + r() * 2),
        flip: Math.cos(a * (2 + r() * 2) + r() * 6),
        color: ["196,107,102", "167,84,88", "218,143,134"][p.i % 3],
        alpha: Math.min(1, a * 4) * clamp(1 - (a - 2.4) / 1.0) * o.alpha,
      });
    }
    ctx.restore();
  }
};

export const herMemPose = (t: number, look: number, smile: number): FrontPose => ({
  ...FRONT_NEUTRAL,
  head: { turn: lerp(0.12, -0.5, look), pitch: lerp(0.2, 0.02, look), eyeOpen: lerp(0.7, 0.45, smile), gaze: lerp(0.1, -0.6, look), brow: 0.1, mouth: lerp(0.15, 0.85, smile) },
  headTilt: lerp(0, -6, look),
  bodyTurn: lerp(0.05, -0.18, look),
  legSlant: 0.6,
  handL: { at: [-40, -40], fore: 0.55, angle: 18 },
  handR: { at: [40, -40], fore: 0.55, angle: -18 },
  breathe: 0.5 + 0.5 * Math.sin(t * 2.0 + 1),
});

const JettyBenchScene: React.FC<{ t: number; cam: Cam; man: FrontPose; her: FrontPose; layer: { dx: number; dy: number; rot: number; alpha: number; dissolve?: number } }> = ({ t, cam, man, her, layer }) => {
  const draw = useCallback((ctx: CanvasRenderingContext2D) => drawMemoryHer(ctx, cam, t, her, layer), [cam, t, her, layer]);
  const flick = 0.92 + 0.08 * Math.sin(t * 7.3);
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <JettyFront t={t}>
          <Bench w={STOP.benchW} x={STOP.benchX} y={STOP.seatY} scale={STOP.benchScale} />
          <ellipse cx={STOP.benchX} cy={STOP.seatY + 300} rx={560} ry={24} fill="#10161b" opacity={0.4} />
          <FigureFront pose={man} design={MAN} x={STOP.manX} y={SEAT_Y} scale={K} filter="url(#pencil)" />
          <LightOnFigures warm={0.8} flick={flick} />
        </JettyFront>
      </WorldSvg>
      <FxCanvas draw={draw} />
    </AbsoluteFill>
  );
};

export const G6: React.FC = () => {
  const t = useSongT("G6");
  const cam: Cam = { x: 965, y: 600, scale: track(t, [[225.3, 1.06], [231.6, 1.14, E.drift]]) };
  const appear = track(t, [[225.5, 0], [226.8, 1, E.inOut]]);
  // 纸层慢慢靠拢，但始终没有完全对齐
  const align = track(t, [[226.4, 0], [231.0, 1, E.inOut]]);
  const look = track(t, [[228.6, 0], [229.8, 0.6, E.inOut]]);
  const man = manOnJetty(t, { turn: lerp(0.15, 0.45, look / 0.6), pitch: lerp(0.4, 0.2, look / 0.6), eyeOpen: 0.65, gaze: lerp(0.2, 0.55, look / 0.6), brow: 0.45, mouth: -0.1 });
  const her = herMemPose(t, 0, 0.2);
  const layer = { dx: lerp(34, 12, align), dy: lerp(-26, -8, align), rot: lerp(-2.6, -1.0, align), alpha: appear };
  return <JettyBenchScene t={t} cam={cam} man={man} her={her} layer={layer} />;
};

export const G7: React.FC = () => {
  const t = useSongT("G7");
  const cam: Cam = { x: track(t, [[231.6, 1000], [237.4, 1030, E.drift]]), y: 470, scale: track(t, [[231.6, 1.42], [237.4, 1.5, E.drift]]) };
  const look = track(t, [[231.9, 0], [233.0, 1, E.inOut]]);
  const smile = track(t, [[232.7, 0.2], [233.6, 1, E.inOut]]);
  const dissolveAt = 234.6;
  const manLook = track(t, [[232.4, 0], [233.4, 1, E.inOut]]);
  const after = track(t, [[235.4, 0], [237.0, 1, E.inOut]]);
  const man = manOnJetty(t, {
    turn: lerp(lerp(0.45, 0.62, manLook), 0.85, after),
    pitch: lerp(0.2, -0.05, after),
    eyeOpen: lerp(0.7, 0.85, manLook),
    gaze: lerp(0.55, 0.8, after),
    brow: lerp(0.45, 0.25, manLook),
    mouth: lerp(-0.1, 0.25, manLook) - after * 0.2,
  });
  const her = herMemPose(t, look, smile);
  const layer = { dx: 12, dy: -8, rot: -1.0, alpha: 1, dissolve: dissolveAt };
  return <JettyBenchScene t={t} cam={cam} man={man} her={her} layer={layer} />;
};

// ======================= G8 =======================
const BENCH8 = { x: 960, y: 800, w: 1080, scale: 1 };
const HIM8 = { x: 690, y: 792, scale: 1.02 };
const MOON8 = { x: 1196, y: 150, r: 88 };
const G8_FEW: Flight = {
  seed: 681,
  count: 16,
  spawn: [234.0, 245.0],
  from: { x0: 0, x1: 1700, y0: -300, y1: -40 },
  vel: [60, 120],
  velJitter: [40, 30],
  sway: 30,
  size: [10, 18],
  fadeY: 1100,
};
export const G8: React.FC = () => {
  const t = useSongT("G8");
  const cam: Cam = { x: 975, y: 560 + track(t, [[237.4, 0], [246.17, -30, E.drift]]), scale: track(t, [[237.4, 1.08], [246.17, 0.94, E.inOut]]) };
  const turn = track(t, [[240.2, 0], [241.6, 0.35, E.inOut], [244.4, 0.35], [245.6, 0.1, E.inOut]]);
  const drawFx = useCallback((ctx: CanvasRenderingContext2D) => drawFlight(ctx, cam, t, G8_FEW), [cam, t]);
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <Sky y0={-400} y1={436} />
        <Moon x={MOON8.x} y={MOON8.y} r={MOON8.r} />
        <g filter="url(#pencil-soft)">
          <Skyline base={436} x0={-400} x1={2400} seed={9} scale={0.8} />
        </g>
        <Water y0={434} y1={900} moonX={MOON8.x} t={t} reflW={130} seed={6} />
        <ellipse cx={MOON8.x} cy={640} rx={220} ry={190} fill="#c9c6b0" opacity={0.09} filter="url(#soft-blur-60)" />
        <rect x={-400} y={420} width={2800} height={40} fill="#8c999b" opacity={0.08} filter="url(#soft-blur-20)" />
        <g>
          <path d="M-400,770 L2400,770 L2400,1400 L-400,1400 Z" fill="#35362f" />
          {Array.from({ length: 14 }, (_, i) => {
            const y = 770 + Math.pow(i / 13, 1.7) * 600;
            return <line key={i} x1={-400} y1={y} x2={2400} y2={y} stroke="#20231f" strokeWidth={2 + i * 0.4} opacity={0.75} />;
          })}
          {Array.from({ length: 13 }, (_, i) => {
            const x = -400 + i * 240;
            return <line key={`v${i}`} x1={1000 + (x - 1000) * 0.3} y1={770} x2={x} y2={1400} stroke="#2a2c27" strokeWidth={1.5} opacity={0.6} />;
          })}
          <rect x={-400} y={766} width={2800} height={6} fill="#6f6f63" opacity={0.4} />
          <ellipse cx={MOON8.x} cy={900} rx={420} ry={150} fill="#b9b6a2" opacity={0.08} filter="url(#soft-blur-60)" />
        </g>
        <BenchBack x={BENCH8.x} y={BENCH8.y} w={BENCH8.w} scale={BENCH8.scale} part="legs" />
        <ellipse cx={BENCH8.x} cy={BENCH8.y + 246} rx={600} ry={22} fill="#141814" opacity={0.45} />
        <g transform={`translate(${HIM8.x},${HIM8.y}) scale(${HIM8.scale})`}>
          <TShapes shapes={backShapes({ headTurn: turn, headTilt: 2 + turn * 4, slump: 0.55, lean: 1 }, MAN)} line={MAN.line} lw={MAN.lw} filter="url(#pencil)" />
        </g>
        <BenchBack x={BENCH8.x} y={BENCH8.y} w={BENCH8.w} scale={BENCH8.scale} part="back" />
      </WorldSvg>
      <FxCanvas draw={drawFx} />
    </AbsoluteFill>
  );
};

