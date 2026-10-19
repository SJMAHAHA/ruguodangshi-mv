import React from "react";
import { AbsoluteFill } from "remotion";
import { BusStopWorld, STOP } from "../../env/BusStop";
import { FRONT_NEUTRAL, FrontPose, FigureFront } from "../../characters/front";
import { MAN, MAN_MEM, WOMAN_MEM } from "../../characters/designs";
import { Bench } from "../../props/Bench";
import { Phone } from "../../props/Phone";
import { E, track, lerp } from "../../lib/anim";
import { noise1 } from "../../lib/random";
import { Cam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { C } from "../../config/palette";
import { smoothClosed, smoothOpen, P } from "../../lib/geom";
import { headShapes } from "../../characters/head";
import { TShapes } from "../../characters/front";
import { PencilDefs } from "../../draw/Defs";

/**
 * 第一幕「黄昏·冷淡」A1–A6（0:00–0:38.25）
 * 雨还没下。两人坐在长椅上，她看手机、把花束随手放到一边；他手机锁屏的合影里，她慢慢消失。
 */

const SEAT_Y = STOP.seatY - 8;
const K = STOP.figScale;
/** 她把花束放下之前，花束横在她腿上 */
const BOUQUET_LAP = { x: STOP.womanX - 30, y: SEAT_Y + 18, rot: -14, scale: 0.78, front: true };
const BOUQUET_BENCH = { x: STOP.bouquet.x, y: STOP.bouquet.y, rot: 0, scale: STOP.bouquet.scale };

const womanCold = (t: number, extra: Partial<FrontPose> = {}): FrontPose => ({
  ...FRONT_NEUTRAL,
  head: { turn: 0.22 + noise1(t * 0.4, 21) * 0.02, pitch: 0.62, eyeOpen: 0.48, gaze: 0.1, brow: 0.2, mouth: -0.1 },
  headTilt: 3,
  bodyTurn: 0.38,
  legSlant: 1,
  handL: { at: [-22, -74], fore: 0.45, angle: 30 },
  handR: { at: [30, -74], fore: 0.45, angle: -30 },
  breathe: 0.5 + 0.5 * Math.sin(t * 2.1 + 1),
  ...extra,
});

const manWaiting = (t: number, head: Partial<FrontPose["head"]> = {}, extra: Partial<FrontPose> = {}): FrontPose => ({
  ...FRONT_NEUTRAL,
  head: { turn: 0.36 + noise1(t * 0.5, 11) * 0.015, pitch: 0.22, eyeOpen: 0.8, gaze: 0.45, brow: 0.35, mouth: -0.2, ...head },
  slump: 0.35,
  bodyTurn: 0.12,
  handL: { at: [-34, -40], fore: 0.5, angle: 18 },
  handR: { at: [36, -40], fore: 0.5, angle: -18 },
  breathe: 0.5 + 0.5 * Math.sin(t * 1.8),
  ...extra,
});

/** 她手里的手机（世界坐标），屏幕冷光照在脸上 */
const HerPhone: React.FC<{ t: number; hand: P; glow: number }> = ({ t, hand, glow }) => {
  const flick = 0.85 + 0.15 * Math.sin(t * 0.7) + (Math.floor(t * 0.45) % 2) * 0.06;
  return (
    <g>
      <ellipse cx={STOP.womanX + 6} cy={SEAT_Y - 420 * K} rx={90} ry={110} fill="#cfe0e6" opacity={0.12 * glow * flick} style={{ mixBlendMode: "screen" }} filter="url(#soft-blur-20)" />
      <g transform={`translate(${hand[0]},${hand[1]}) rotate(-58)`}>
        <rect x={-30} y={-17} width={60} height={34} rx={6} fill="#1a1e23" stroke={C.graphite} strokeWidth={2} />
        <rect x={-26} y={-13} width={52} height={26} rx={4} fill="#b9cdd2" opacity={0.85 * glow * flick} />
      </g>
    </g>
  );
};

const benchCam = (t: number, t0: number, t1: number, s0 = 1.3, s1 = 1.32): Cam => ({ x: 985, y: 548, scale: track(t, [[t0, s0], [t1, s1, E.drift]]) });

// ---------------- A1 黄昏全景 ----------------
export const A1: React.FC = () => {
  const t = useSongT("A1");
  const cam: Cam = { x: 975, y: 575, scale: track(t, [[0, 0.86], [6.5, 0.9, E.drift]]) };
  // 4 s 路灯亮起：两次闪烁后稳定
  const lamp = t < 3.9 ? 0 : track(t, [[3.9, 0], [3.96, 0.6], [4.05, 0.1], [4.14, 0.85], [4.22, 0.35], [4.45, 1, E.out]]);
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={cam}
        t={t}
        tod="dusk"
        rain={0}
        glassDrops={0}
        canopy
        lampGlow={lamp}
        man={manWaiting(t, { turn: 0.3, pitch: 0.3 })}
        woman={womanCold(t)}
        bouquet={{ ...BOUQUET_LAP }}
        front={<HerPhone t={t} hand={[STOP.womanX + 4, SEAT_Y - 78 * K]} glow={1} />}
      />
    </AbsoluteFill>
  );
};

// ---------------- A2 她看手机，他看她 ----------------
export const A2: React.FC = () => {
  const t = useSongT("A2");
  const look = track(t, [[6.6, 0], [7.4, 1, E.inOut], [9.3, 1], [10.0, 0.4, E.inOut], [11.2, 0.4], [11.9, 1, E.inOut]]);
  const away = track(t, [[10.3, 0], [11.1, 1, E.inOut]]);
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={benchCam(t, 6.5, 13.05)}
        t={t}
        tod="dusk"
        rain={0}
        glassDrops={0}
        man={manWaiting(t, { turn: lerp(0.18, 0.42, look), pitch: lerp(0.4, 0.15, look) + (1 - look) * 0.1, eyeOpen: 0.75 + look * 0.1 })}
        woman={womanCold(t, { bodyTurn: 0.38 + away * 0.1, headTilt: 3 + away * 2 })}
        bouquet={{ ...BOUQUET_LAP }}
        front={<HerPhone t={t} hand={[STOP.womanX + 4, SEAT_Y - 78 * K]} glow={1} />}
      />
    </AbsoluteFill>
  );
};

// ---------------- A3 他的近景：想开口，又停住 ----------------
export const A3: React.FC = () => {
  const t = useSongT("A3");
  const inhale = track(t, [[13.4, 0], [14.2, 1, E.inOut], [16.6, 1], [17.6, 0, E.inOut]]);
  const turn = track(t, [[14.0, 0], [15.0, 1, E.inOut], [16.8, 1], [17.8, 0.2, E.inOut]]);
  const down = track(t, [[16.8, 0], [17.9, 1, E.inOut]]);
  const cam: Cam = { x: 905 + track(t, [[13.05, 0], [19, 10, E.drift]]), y: 330, scale: track(t, [[13.05, 2.0], [19, 2.06, E.drift]]) };
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={cam}
        t={t}
        tod="dusk"
        rain={0}
        glassDrops={0}
        man={manWaiting(
          t,
          { turn: lerp(0.3, 0.56, turn), pitch: lerp(0.22, 0.05, turn) + down * 0.4, eyeOpen: lerp(0.8, 0.95, turn) - down * 0.35, brow: 0.35 + turn * 0.15, mouth: -0.15 - down * 0.15 },
          { shoulderLift: inhale * 0.5, slump: 0.35 + down * 0.15 }
        )}
        woman={womanCold(t)}
        bouquet={{ ...BOUQUET_LAP }}
        front={<HerPhone t={t} hand={[STOP.womanX + 4, SEAT_Y - 78 * K]} glow={1} />}
      />
    </AbsoluteFill>
  );
};

// ---------------- A4 她把花束放到一边 ----------------
export const A4: React.FC = () => {
  const t = useSongT("A4");
  // 她的右手（画面右）：拿起腿上的花束 → 放到身旁的座位上 → 回到手机
  const hx = track(t, [[19.35, 30], [19.85, 22, E.inOut], [20.75, 150, E.inOut], [21.35, 196, E.out], [21.6, 196], [22.4, 30, E.inOut]]);
  const hy = track(t, [[19.35, -74], [19.85, -36, E.inOut], [20.75, -92, E.inOut], [21.35, -20, E.out], [21.6, -20], [22.4, -74, E.inOut]]);
  const carry = track(t, [[19.85, 0], [19.9, 1], [21.35, 1], [21.4, 0]]);
  const placed = t >= 21.37;
  const handW: P = [STOP.womanX + hx * K, SEAT_Y + hy * K];
  const bq = placed
    ? BOUQUET_BENCH
    : t < 19.88
      ? BOUQUET_LAP
      : { x: handW[0] + 30, y: handW[1] + 30, rot: lerp(-14, 0, Math.min(1, (t - 19.9) / 1.45)), scale: lerp(0.78, 0.92, Math.min(1, (t - 19.9) / 1.45)), front: true };
  const follow = track(t, [[19.9, 0], [21.2, 1, E.inOut], [23.3, 1], [24.4, 0, E.inOut]]);
  const down = track(t, [[23.4, 0], [24.6, 1, E.inOut]]);
  const lookGlance = track(t, [[19.5, 0], [19.8, 0.35, E.out], [21.0, 0.35], [21.5, 0, E.inOut]]);
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={benchCam(t, 19.0, 25.75)}
        t={t}
        tod="dusk"
        rain={0}
        glassDrops={0}
        man={manWaiting(t, { turn: lerp(0.38, 0.62, follow) - down * 0.3, pitch: lerp(0.18, 0.42, follow) + down * 0.15, eyeOpen: 0.8 - down * 0.25, brow: 0.35 + follow * 0.2 }, { slump: 0.35 + down * 0.15 })}
        woman={womanCold(t, {
          head: { turn: 0.22 + lookGlance * 0.15, pitch: 0.62 - lookGlance * 0.15, eyeOpen: 0.48, gaze: 0.1 + lookGlance * 0.5, brow: 0.2, mouth: -0.1 },
          handR: { at: [hx, hy], fore: lerp(0.45, 0.75, carry), angle: -30 + carry * 20, curl: carry * 0.6 },
          bodyTurn: 0.38 + carry * 0.08,
        })}
        bouquet={bq}
        front={<HerPhone t={t} hand={[STOP.womanX + lerp(4, -10, carry), SEAT_Y + lerp(-78, -74, carry) * K]} glow={1 - carry * 0.3} />}
      />
    </AbsoluteFill>
  );
};

// ---------------- A5 / A6 他的手机锁屏：合影 ----------------
/** 锁屏里的合影：同一张长椅，回忆配色 */
const LockPhoto: React.FC<{ herOpacity: number; t: number }> = ({ herOpacity, t }) => (
  <g>
    <rect x={-220} y={-420} width={440} height={840} fill="#d9cdb2" />
    <rect x={-220} y={-420} width={440} height={430} fill="#c9c3ac" />
    <g transform="translate(0,40) scale(0.42)">
      <rect x={-600} y={180} width={1200} height={600} fill="#b7a88a" />
      <Bench w={900} x={0} y={160} scale={1} memory />
      <g opacity={herOpacity}>
        <FigureFront
          pose={{ ...FRONT_NEUTRAL, head: { turn: -0.3, pitch: 0.18, eyeOpen: 0.3, gaze: -0.2, brow: 0, mouth: 0.8 }, headTilt: -14, headOffset: [-30, 22], lean: -7, bodyTurn: -0.25, legSlant: -0.4, handL: { at: [-30, -60], fore: 0.5 }, handR: { at: [34, -58], fore: 0.5 } }}
          design={WOMAN_MEM}
          x={150}
          y={152}
          scale={1.1}
        />
      </g>
      <FigureFront
        pose={{ ...FRONT_NEUTRAL, head: { turn: 0.38 * (0.4 + 0.6 * herOpacity), pitch: 0.08, eyeOpen: 0.75, gaze: 0.4, brow: 0, mouth: 0.6 }, bodyTurn: 0.2, handL: { at: [-34, -40], fore: 0.5, angle: 18 }, handR: { at: [90, -40], fore: 0.6 } }}
        design={MAN_MEM}
        x={-130}
        y={152}
        scale={1.1}
      />
    </g>
    {/* 锁屏时间 */}
    <text x={0} y={-300} textAnchor="middle" fontFamily="RuguoSerif" fontSize={92} fill="#f4efe2" opacity={0.92} style={{ letterSpacing: "0.04em" }}>
      19:4{Math.min(9, 6 + Math.floor((t - 25.75) / 20))}
    </text>
    <rect x={-60} y={392} width={120} height={8} rx={4} fill="#f4efe2" opacity={0.7} />
  </g>
);

/** 手机屏幕熄灭后映出的他的脸（很暗） */
const Reflection: React.FC = () => {
  const hs = headShapes({ turn: -0.1, pitch: 0.35, eyeOpen: 0.45, gaze: 0, brow: 0.5, mouth: -0.3 }, MAN.look);
  return (
    <g transform="translate(10,-60) scale(2.6)">
      <TShapes shapes={[...hs.back, ...hs.front]} line="#9aa6ab" lw={1.6} />
    </g>
  );
};

const PhoneShot: React.FC<{ t: number; herOpacity: number; screen: number; thumb: number; scale: number }> = ({ t, herOpacity, screen, thumb, scale }) => {
  const W = 1920;
  const H = 1080;
  return (
    <AbsoluteFill style={{ background: "#141b23" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <PencilDefs />
        <defs>
          <linearGradient id="coatBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#24303d" />
            <stop offset="1" stopColor="#151c25" />
          </linearGradient>
          <radialGradient id="bokeh">
            <stop offset="0" stopColor="#e6dcc0" stopOpacity={0.5} />
            <stop offset="1" stopColor="#e6dcc0" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* 背景：他大衣的衣褶（虚） */}
        <rect width={W} height={H} fill="url(#coatBg)" />
        <g filter="url(#soft-blur-20)" opacity={0.7}>
          <path d="M-50,860 C400,780 700,900 1100,820 S1700,760 2000,840" stroke="#33465a" strokeWidth={50} fill="none" />
          <path d="M-50,300 C300,360 600,250 900,330" stroke="#2c3b4c" strokeWidth={40} fill="none" />
          <circle cx={1660} cy={170} r={130} fill="url(#bokeh)" />
          <circle cx={1500} cy={120} r={60} fill="url(#bokeh)" />
        </g>
        <g transform={`translate(960,${455 + (scale - 1) * 60}) scale(${scale}) rotate(-5)`}>
          {/* 左手从下方托住：手掌包住机身左下角，食指、中指指尖从右侧露出 */}
          <path
            d={smoothClosed([[-250, 250], [-196, 330], [-120, 420], [40, 470], [150, 520], [170, 640], [-60, 660], [-300, 640], [-360, 470], [-330, 330]], 0.85)}
            fill={C.skin}
            stroke={C.graphite}
            strokeWidth={3}
          />
          <path d={smoothOpen([[-200, 560], [-90, 520], [20, 500]])} stroke={C.skinShade} strokeWidth={10} fill="none" opacity={0.5} />
          {[[218, 120], [222, 210], [216, 300]].map(([x, y], i) => (
            <path key={i} d={smoothClosed([[x - 24, y - 30], [x + 22, y - 34], [x + 40, y - 6], [x + 30, y + 26], [x - 24, y + 30]], 0.9)} fill={C.skin} stroke={C.graphite} strokeWidth={3} />
          ))}
          <Phone x={0} y={0} w={460} h={900} screen={screen} id="lock" reflection={<Reflection />}>
            <LockPhoto herOpacity={herOpacity} t={t} />
            {/* 亮屏的冷光 */}
            <rect x={-230} y={-450} width={460} height={900} fill="#dfe8ea" opacity={0.05} />
          </Phone>
          {/* 拇指沿屏幕左缘向上，A5 里轻轻摩挲 */}
          <path
            d={smoothClosed([[-286, 330], [-262, 210 + thumb * 30], [-226, 120 + thumb * 40], [-196, 112 + thumb * 40], [-192, 160 + thumb * 36], [-210, 260], [-226, 340]], 0.9)}
            fill={C.skin}
            stroke={C.graphite}
            strokeWidth={3}
          />
          <path d={smoothOpen([[-222, 140 + thumb * 40], [-204, 132 + thumb * 40]])} stroke={C.graphite} strokeWidth={2} opacity={0.6} />
          {/* 屏幕光照亮手指 */}
          <rect x={-330} y={-460} width={600} height={1120} fill="#dfe8ea" opacity={0.06 * screen} style={{ mixBlendMode: "screen" }} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const A5: React.FC = () => {
  const t = useSongT("A5");
  const thumb = track(t, [[28.3, 0], [29.1, 1, E.inOut], [29.9, 0.3, E.inOut]]);
  return <PhoneShot t={t} herOpacity={1} screen={track(t, [[25.75, 0.6], [26.3, 1, E.out]])} thumb={thumb} scale={track(t, [[25.75, 1.02], [32.35, 1.08, E.drift]])} />;
};

export const A6: React.FC = () => {
  const t = useSongT("A6");
  const her = track(t, [[33.1, 1], [36.3, 0, E.inOut]]);
  const screen = track(t, [[36.9, 1], [37.15, 0.35, E.out], [37.75, 0.35], [37.95, 0, E.in]]);
  return <PhoneShot t={t} herOpacity={her} screen={screen} thumb={0.3} scale={track(t, [[32.35, 1.08], [38.25, 1.14, E.drift]])} />;
};
