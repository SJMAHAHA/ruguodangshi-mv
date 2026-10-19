import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { BusStopWorld, STOP } from "../../env/BusStop";
import { WalkFigure } from "../../characters/walk";
import { MAN } from "../../characters/designs";
import { E, track, lerp, clamp } from "../../lib/anim";
import { noise1 } from "../../lib/random";
import { Cam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { FxCanvas } from "../../fx/FxCanvas";
import { BOUQUET_HIS, manAlone } from "./Act7";
import { drawMemoryHer, herMemPose } from "./Act8";

/**
 * 第十幕「黎明·放下」J1–J4（4:29.68–4:54.95，最后一遍副歌）
 * J1 黎明的公交站：他抱着花束独坐，路灯熄灭，玻璃上的水珠被天光照亮；
 * J2 回忆纸层最后一次对齐：她坐在旁边对他笑，他也很轻地笑了；
 * J3 他把花束放到她的位置上，纸层散去，他站起来；
 * J4 他向右走出画面，长椅上只剩花束。
 */

const SEAT_Y = STOP.seatY - 8;
const K = STOP.figScale;
/** 放在她座位上的花束 */
export const BOUQUET_SEAT = { x: 1040, y: STOP.seatY - 4, rot: 2, scale: 0.84 };
/** 侧身行走画法比正面站姿略高，换画法时按头顶高度对齐 */
const WALK_FIT = 0.943;
const DAWN_TINT = "rgba(70,78,88,0.1)";
const GLASS_LIGHT = (k: number) => ({ at: [260, 220] as [number, number], glow: 0.3 + 0.9 * k, lit: "236,226,204" });

/** 天光：从画面左上方斜进来的暖灰色 */
const DawnLight: React.FC<{ k: number }> = ({ k }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 1500px 900px at 120px 80px, rgba(236,214,176,${0.34 * k}), rgba(236,214,176,0) 100%)`,
      mixBlendMode: "screen",
      pointerEvents: "none",
    }}
  />
);

// ---------------- J1 ----------------
export const J1: React.FC = () => {
  const t = useSongT("J1");
  const cam: Cam = { x: 975, y: 560, scale: track(t, [[269.68, 1.1], [275.95, 1.16, E.drift]]) };
  const lamp = track(t, [[271.5, 1], [271.62, 0.3], [271.72, 0.8], [271.86, 0.15], [272.3, 0, E.out]]);
  const sun = track(t, [[269.68, 0.3], [275.95, 1, E.inOut]]);
  const up = track(t, [[272.4, 0], [273.6, 1, E.inOut]]);
  const toSeat = track(t, [[274.6, 0], [275.9, 1, E.inOut]]);
  const man = manAlone(t, {
    turn: lerp(lerp(0.08, -0.18, up), 0.4, toSeat) + noise1(t * 0.5, 51) * 0.01,
    pitch: lerp(lerp(0.5, 0.05, up), 0.25, toSeat),
    eyeOpen: lerp(0.5, 0.75, up),
    gaze: lerp(lerp(0.1, -0.3, up), 0.45, toSeat),
    brow: lerp(0.5, 0.3, up),
    mouth: -0.12,
  }, { slump: lerp(0.55, 0.4, up) });
  return (
    <AbsoluteFill>
      <BusStopWorld cam={cam} t={t} tod="dawn" man={man} woman={null} bouquet={BOUQUET_HIS} rain={0} lampGlow={lamp} glassDrops={1} glassLight={GLASS_LIGHT(sun)} />
      <DawnLight k={sun} />
    </AbsoluteFill>
  );
};

// ---------------- J2 ----------------
export const J2: React.FC = () => {
  const t = useSongT("J2");
  const cam: Cam = { x: track(t, [[275.95, 975], [282.2, 960, E.drift]]), y: 540, scale: track(t, [[275.95, 1.22], [282.2, 1.3, E.drift]]) };
  const appear = track(t, [[276.1, 0], [277.3, 1, E.inOut]]);
  const align = track(t, [[276.6, 0], [279.2, 1, E.inOut]]);
  const look = track(t, [[277.2, 0], [278.3, 1, E.inOut]]);
  const smile = track(t, [[277.9, 0.2], [278.9, 1, E.inOut]]);
  const hisSmile = track(t, [[279.4, 0], [280.6, 1, E.inOut]]);
  const man = manAlone(t, {
    turn: 0.45 + hisSmile * 0.05 + noise1(t * 0.5, 52) * 0.01,
    pitch: lerp(0.25, 0.12, hisSmile),
    eyeOpen: lerp(0.75, 0.55, hisSmile),
    gaze: 0.5,
    brow: lerp(0.35, 0.05, hisSmile),
    mouth: lerp(-0.1, 0.4, hisSmile),
  }, { slump: 0.38, bodyTurn: 0.14 });
  const her = herMemPose(t, look, smile);
  const layer = { dx: lerp(22, 0, align), dy: lerp(-16, 0, align), rot: lerp(-1.8, 0, align), alpha: appear, tint: DAWN_TINT };
  const draw = useCallback((ctx: CanvasRenderingContext2D) => drawMemoryHer(ctx, cam, t, her, layer), [cam, t, her, layer]);
  return (
    <AbsoluteFill>
      <BusStopWorld cam={cam} t={t} tod="dawn" man={man} woman={null} bouquet={BOUQUET_HIS} rain={0} lampGlow={0} glassDrops={1} glassLight={GLASS_LIGHT(1)} />
      <FxCanvas draw={draw} />
      <DawnLight k={1} />
    </AbsoluteFill>
  );
};

// ---------------- J3 ----------------
export const J3: React.FC = () => {
  const t = useSongT("J3");
  const place = track(t, [[282.5, 0], [284.2, 1, E.inOut]]);
  const release = track(t, [[284.3, 0], [284.9, 1, E.inOut]]);
  const fade = track(t, [[283.9, 0], [285.3, 1, E.inOut]]);
  const stand = track(t, [[285.6, 0], [287.2, 1, E.inOut]]);
  const cam: Cam = { x: 965, y: lerp(540, 340, track(t, [[285.6, 0], [287.4, 1, E.inOut]])), scale: lerp(1.3, 1.08, track(t, [[285.4, 0], [287.4, 1, E.inOut]])) };
  // 花束：从腿上抬起 → 弧线 → 落在她的座位上
  const arc = Math.sin(place * Math.PI) * 46;
  const bq = {
    x: lerp(BOUQUET_HIS.x, BOUQUET_SEAT.x, place),
    y: lerp(BOUQUET_HIS.y, BOUQUET_SEAT.y, place) - arc,
    rot: lerp(BOUQUET_HIS.rot, BOUQUET_SEAT.rot, place),
    scale: lerp(BOUQUET_HIS.scale, BOUQUET_SEAT.scale, place),
    front: place < 1 || release < 1 ? ("over" as const) : false,
  };
  // 他的左手（画面右）跟着花束走；放下后收回腿上，然后起身
  const handAt: [number, number] = [(bq.x + 40 * bq.scale - STOP.manX) / K, (bq.y - 10 - SEAT_Y) / K];
  const rest: [number, number] = [40, -40];
  const hand: [number, number] = [lerp(handAt[0], rest[0], release), lerp(handAt[1], rest[1], release)];
  const reach = Math.sin(Math.min(1, place * 1.2) * Math.PI * 0.5) * (1 - release);
  const man = manAlone(
    t,
    {
      turn: lerp(0.5, 0.62, place) - stand * 0.4,
      pitch: lerp(0.3, 0.55, place) - stand * 0.45,
      eyeOpen: 0.7,
      gaze: lerp(0.55, 0.7, place) - stand * 0.5,
      brow: 0.3,
      mouth: lerp(0.15, -0.05, fade),
    },
    {
      lean: reach * 10,
      bodyTurn: 0.12 + reach * 0.22 - stand * 0.1,
      slump: lerp(0.4, 0.2, stand),
      stand,
      handR: { at: stand > 0 ? [lerp(hand[0], 92, stand), lerp(hand[1], -252, stand * stand)] : hand, fore: lerp(0.9, 0.6, release), angle: lerp(-30, -18, release), curl: lerp(0.7, 0.3, release) },
      handL: { at: [lerp(-74, -92, stand), lerp(-34, -250, stand * stand)], fore: 0.6, angle: 30 },
    }
  );
  const layer = { dx: fade * 60, dy: -fade * 40, rot: fade * 4, alpha: 1 - fade, tint: DAWN_TINT };
  const her = herMemPose(t, 1, 1 - fade * 0.4);
  const draw = useCallback((ctx: CanvasRenderingContext2D) => drawMemoryHer(ctx, cam, t, her, layer), [cam, t, her, layer]);
  return (
    <AbsoluteFill>
      <BusStopWorld cam={cam} t={t} tod="dawn" man={man} woman={null} bouquet={bq} rain={0} lampGlow={0} glassDrops={1} glassLight={GLASS_LIGHT(1)} />
      <FxCanvas draw={draw} />
      <DawnLight k={1} />
    </AbsoluteFill>
  );
};

// ---------------- J4 ----------------
export const J4: React.FC = () => {
  const t = useSongT("J4");
  const cam: Cam = { x: track(t, [[288.2, 970], [294.95, 1010, E.drift]]), y: 450 + track(t, [[291.8, 0], [294.95, 100, E.inOut]]), scale: track(t, [[288.2, 0.88], [291.8, 0.88], [294.95, 1.02, E.inOut]]) };
  const turnU = track(t, [[288.5, 0], [289.1, 1, E.in]]);
  const walking = t >= 289.1;
  const walkT = Math.max(0, t - 289.1);
  const v = 330;
  const acc = 0.7;
  const dist = walkT < acc ? (0.5 * v * walkT * walkT) / acc : 0.5 * v * acc + v * (walkT - acc);
  const phase = (dist / 300) * Math.PI;
  const groundY = SEAT_Y + 262 * K;
  const man = manAlone(
    t,
    { turn: lerp(0.22, 0.6, turnU), pitch: 0.1, eyeOpen: 0.7, gaze: 0.5, brow: 0.2, mouth: 0 },
    { stand: 1, slump: 0.2, bodyTurn: lerp(0.02, 1, turnU), handR: { at: [92, -252], fore: 0.6 }, handL: { at: [-92, -250], fore: 0.6, angle: 30 } }
  );
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={cam}
        t={t}
        tod="dawn"
        man={man}
        hideMan={walking}
        manScaleX={lerp(1, 0.66, track(t, [[288.7, 0], [289.1, 1, E.in]]))}
        woman={null}
        bouquet={BOUQUET_SEAT}
        rain={0}
        lampGlow={0}
        glassDrops={1}
        glassLight={GLASS_LIGHT(1)}
        extraFigures={walking ? <WalkFigure phase={phase} design={MAN} x={STOP.manX + 10 + dist} y={groundY} scale={K * WALK_FIT} stride={clamp(0.3 + walkT * 1.2, 0, 1)} filter="url(#pencil)" /> : null}
      />
      <DawnLight k={1} />
    </AbsoluteFill>
  );
};
