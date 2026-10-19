import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { E, track, lerp, clamp } from "../../lib/anim";
import { Cam, WorldSvg } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { Defs, Moon, Skyline, Water, Jetty, BenchBack } from "../../env/Waterside";
import { PencilDefs } from "../../draw/Defs";
import { TShapes } from "../../characters/front";
import { backShapes } from "../../characters/back";
import { MAN } from "../../characters/designs";
import { BusStopWorld } from "../../env/BusStop";
import { FxCanvas } from "../../fx/FxCanvas";
import { drawPetal } from "../../fx/petals";
import { mulberry32, seededList } from "../../lib/random";
import { smoothClosed, P } from "../../lib/geom";
import { BOUQUET_HIS, manAlone } from "./Act7";

/**
 * 第九幕「天将亮」H1–H2（4:06.17–4:29.68，间奏）
 * H1 月亮沉向对岸的城市，天色从墨蓝转为黎明的灰蓝，栈桥上的灯熄灭，城里的窗灯一盏盏关掉；
 * H2 湖面的倒影接到公交站地上的积水：天亮了，雨停了，水洼里倒映着长椅和他。
 */

const mixHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(",")})`;
};

const NIGHT = ["#141e2a", "#243342", "#3b4b57"];
const DAWN = ["#3f4e5c", "#7a8790", "#c8bfa8"];

// ---------------- H1 ----------------
const BIRDS = seededList(7, 909, (r) => ({ dx: (r() - 0.5) * 160, dy: (r() - 0.5) * 70, ph: r() * 6.28, s: 0.7 + r() * 0.5 }));
export const H1: React.FC = () => {
  const t = useSongT("H1");
  const d = track(t, [[247.0, 0], [257.6, 1, E.inOut]]);
  const moonK = track(t, [[246.17, 0], [257.0, 1, E.inOut]]);
  const moon = { x: lerp(1300, 1500, moonK), y: lerp(104, 600, moonK), r: lerp(70, 78, moonK) };
  const cam: Cam = { x: 1080 + track(t, [[246.17, 0], [258.5, 60, E.drift]]), y: 430, scale: track(t, [[246.17, 0.8], [258.5, 0.86, E.drift]]) };
  const lit = track(t, [[251.2, 1], [251.3, 0.4], [251.38, 0.8], [251.6, 0, E.out]]);
  const sky = NIGHT.map((c, i) => mixHex(c, DAWN[i], d));
  const stars = seededList(60, 88, (r) => ({ x: -500 + r() * 3000, y: -800 + r() * 1200, a: 0.2 + r() * 0.5, s: 0.8 + r() * 1.4 }));
  const birdsX = lerp(-300, 2300, clamp((t - 253.2) / 5.5));
  return (
    <AbsoluteFill style={{ background: sky[1] }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <defs>
          <linearGradient id="h1Sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={sky[0]} />
            <stop offset="0.6" stopColor={sky[1]} />
            <stop offset="1" stopColor={sky[2]} />
          </linearGradient>
        </defs>
        <rect x={-900} y={-900} width={4200} height={1462} fill="url(#h1Sky)" />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#d9d6c8" opacity={s.a * (1 - d)} />
        ))}
        {/* 天边的一线晨光 */}
        <ellipse cx={1500} cy={560} rx={1500} ry={180} fill="#d8c6a2" opacity={0.35 * d} filter="url(#soft-blur-60)" />
        <Moon x={moon.x} y={moon.y} r={moon.r} glow={1.4 * (1 - d * 0.7)} />
        <g filter="url(#pencil-soft)">
          <Skyline base={562} x0={-900} x1={3200} seed={7} />
        </g>
        {/* 城里的窗灯一盏盏熄灭：用天色盖住 */}
        <rect x={-900} y={300} width={4200} height={262} fill={sky[2]} opacity={0.22 * d} />
        <Water y0={560} y1={1500} moonX={moon.x} t={t} reflW={90 * (1 - d * 0.6)} />
        {/* 水面也跟着天色变亮 */}
        <rect x={-900} y={560} width={4200} height={940} fill={mixHex("#2a3946", "#8d968f", d)} opacity={0.5 * d} style={{ mixBlendMode: "screen" }} />
        <rect x={-900} y={520} width={4200} height={90} fill="#c9c7b8" opacity={0.1 + 0.2 * d} filter="url(#soft-blur-20)" />
        <Jetty near={[690, 1250, 1262]} far={[886, 1050, 650]} t={t} lit={lit} />
        <BenchBack x={968} y={690} w={900} scale={0.25} part="legs" />
        <g transform="translate(928,688) scale(0.25)">
          <TShapes shapes={backShapes({ headTurn: track(t, [[254.5, 0], [256.0, -0.25, E.inOut]]), headTilt: 3, slump: lerp(0.6, 0.4, d), lean: 1 }, MAN)} line={MAN.line} lw={MAN.lw * 1.3} />
        </g>
        <BenchBack x={968} y={690} w={900} scale={0.25} part="back" />
        {/* 清晨的一小群鸟 */}
        {t > 253.2 && t < 258.8
          ? BIRDS.map((b, i) => {
              const flap = Math.sin(t * 9 + b.ph);
              const x = birdsX + b.dx;
              const y = 120 + b.dy - (birdsX + 300) * 0.06;
              return <path key={i} d={`M${x - 14 * b.s},${y - flap * 6 * b.s} Q${x - 6 * b.s},${y - 2} ${x},${y} Q${x + 6 * b.s},${y - 2} ${x + 14 * b.s},${y - flap * 6 * b.s}`} stroke="#2b333b" strokeWidth={2.2} fill="none" />;
            })
          : null}
      </WorldSvg>
      {/* 雾气 */}
      <AbsoluteFill style={{ background: `linear-gradient(rgba(200,200,190,0) 40%, rgba(200,200,190,${0.18 * d}) 62%, rgba(200,200,190,0) 85%)` }} />
    </AbsoluteFill>
  );
};

// ---------------- H2 ----------------
/** 水洼的形状（画面坐标） */
const PUDDLE: P[] = [
  [290, 210], [700, 120], [1150, 170], [1600, 110], [1790, 330], [1720, 690], [1470, 900], [960, 950], [520, 905], [250, 760], [190, 460],
];
const PUDDLE_D = smoothClosed(PUDDLE, 0.85);

export const H2: React.FC = () => {
  const t = useSongT("H2");
  const toPuddle = track(t, [[262.0, 0], [263.8, 1, E.inOut]]);
  // 湖面：黎明的天色倒影（横向的明暗带）+ 碎开的晨光 + 漂过的一片花瓣
  const drawLake = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      for (let i = 0; i < 160; i++) {
        const r = mulberry32(8100 + i);
        const y = Math.pow(r(), 0.8) * 1080;
        const persp = 0.4 + y / 1080;
        const x = ((r() * 2600 + t * (8 + r() * 16)) % 2600) - 340;
        const w = (60 + r() * 240) * persp;
        const light = r() < 0.45;
        ctx.strokeStyle = light ? `rgba(214,212,196,${0.1 + r() * 0.14})` : `rgba(28,38,46,${0.12 + r() * 0.16})`;
        ctx.lineWidth = (2 + r() * 3) * persp;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.stroke();
      }
      // 天边那一点亮光在水里的倒影：一列碎光
      for (let i = 0; i < 46; i++) {
        const r = mulberry32(8300 + i);
        const y = 40 + Math.pow(r(), 1.2) * 1000;
        const persp = 0.35 + y / 1080;
        const sh = 0.5 + 0.5 * Math.sin(t * (1.5 + r() * 2) + r() * 6);
        const w = (40 + r() * 120) * persp * (0.6 + 0.4 * sh);
        const x = 1240 + (r() - 0.5) * 160 * persp + Math.sin(t * 0.8 + i) * 6;
        ctx.strokeStyle = `rgba(236,224,196,${(0.2 + 0.4 * sh) * (1 - y / 1400)})`;
        ctx.lineWidth = (2.5 + 2 * persp);
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.lineTo(x + w / 2, y);
        ctx.stroke();
      }
      drawPetal(ctx, { x: 360 + (t - 258.5) * 70, y: 700 + Math.sin(t * 1.2) * 6, size: 30, rot: 1.2 + Math.sin(t * 0.7) * 0.2, flip: 0.45, color: "167,84,88", alpha: 1 });
    },
    [t]
  );
  // 水洼：从棚檐滴下的水滴
  const drawDrips = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const drips = [
        { t0: 264.4, x: 1180, y: 380 },
        { t0: 266.1, x: 640, y: 560 },
        { t0: 267.5, x: 1420, y: 640 },
        { t0: 268.6, x: 900, y: 300 },
      ];
      for (const dp of drips) {
        const age = t - dp.t0;
        if (age < 0 || age > 2.4) continue;
        for (let k = 0; k < 3; k++) {
          const a = age - k * 0.22;
          if (a <= 0) continue;
          const rad = 8 + a * 150;
          ctx.strokeStyle = `rgba(225,226,214,${Math.max(0, 0.5 - a * 0.22)})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.ellipse(dp.x, dp.y, rad, rad * 0.62, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    },
    [t]
  );
  // 倒影：整幅公交站画面上下翻转后放进水洼（近处的水洼映出天空，远处的边缘映出长椅底部）
  const camR: Cam = { x: 990, y: 600 + track(t, [[262.0, 0], [269.68, -30, E.drift]]), scale: track(t, [[262.0, 0.84], [269.68, 0.9, E.drift]]) };
  const man = manAlone(t, { turn: 0.1, pitch: 0.45, eyeOpen: 0.5, gaze: 0.1 });
  const ripple = Math.sin(t * 1.7) * 0.004;
  return (
    <AbsoluteFill style={{ background: "#2a3036" }}>
      {/* 湖面（先） */}
      <AbsoluteFill style={{ opacity: 1 - toPuddle }}>
        <AbsoluteFill style={{ background: "linear-gradient(#8e958f, #66727a 30%, #4a5760 70%, #3a464e)" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 260px 520px at 1240px 300px, rgba(226,214,186,0.35), rgba(226,214,186,0) 100%)" }} />
        <FxCanvas draw={drawLake} />
      </AbsoluteFill>
      {/* 水洼（后） */}
      <AbsoluteFill style={{ opacity: toPuddle }}>
        {/* 湿的柏油地 */}
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <defs>
            <filter id="asphalt" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={5} result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.75  0 0 0 0 0.77  0 0 0 0 0.76  0 0 0 0.55 -0.12" />
            </filter>
          </defs>
          <rect width={1920} height={1080} fill="#2b3137" />
          <rect width={1920} height={1080} filter="url(#asphalt)" opacity={0.5} />
        </svg>
        <AbsoluteFill style={{ clipPath: `path('${PUDDLE_D}')` }}>
          <AbsoluteFill style={{ transform: `scaleY(-1) skewX(${ripple * 100}deg)`, filter: "blur(1.4px) brightness(0.92)" }}>
            <BusStopWorld cam={camR} t={t} tod="dawn" man={man} woman={null} bouquet={BOUQUET_HIS} rain={0} glassDrops={0.6} lampGlow={0} canopy />
          </AbsoluteFill>
          <AbsoluteFill style={{ background: "linear-gradient(rgba(20,28,34,0.15), rgba(20,28,34,0.35))" }} />
          <FxCanvas draw={drawDrips} />
        </AbsoluteFill>
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <path d={PUDDLE_D} fill="none" stroke="#9aa3a3" strokeWidth={3} opacity={0.35} />
          <path d={PUDDLE_D} fill="none" stroke="#14191d" strokeWidth={10} opacity={0.35} style={{ filter: "blur(4px)" }} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
