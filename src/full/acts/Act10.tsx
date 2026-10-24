import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { BusStopWorld, STOP } from "../../env/BusStop";
import { WalkFigure, gait } from "../../characters/walk";
import { MAN } from "../../characters/designs";
import { E, track, lerp, clamp } from "../../lib/anim";
import { noise1 } from "../../lib/random";
import { Cam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { riseHand, HANG } from "../../characters/front";
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
  const cam: Cam = { x: 975, y: 525, scale: track(t, [[269.68, 1.1], [275.95, 1.16, E.drift]]) };
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
  const cam: Cam = { x: track(t, [[275.95, 975], [282.2, 960, E.drift]]), y: 505, scale: track(t, [[275.95, 1.22], [282.2, 1.3, E.drift]]) };
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
  // 起身：先前倾、双手撑在大腿上，再站起来，上身最后挺直
  const bend = track(t, [[285.2, 0], [285.75, 0.9, E.inOut], [286.2, 1, E.inOut], [287.25, 0, E.out]]);
  const stand = track(t, [[285.65, 0], [287.2, 1, E.inOut]]);
  const cam: Cam = { x: 965, y: lerp(505, 330, track(t, [[285.6, 0], [287.4, 1, E.inOut]])), scale: lerp(1.3, 1.08, track(t, [[285.4, 0], [287.4, 1, E.inOut]])) };
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
      bend,
      handR: bend > 0 ? { ...riseHand({ stand, bend, slump: 0.4, shoulderLift: 0, legSlant: 0 }, MAN, 1, hand), angle: -18 } : { at: hand, fore: lerp(0.9, 0.6, release), angle: lerp(-30, -18, release), curl: lerp(0.7, 0.3, release) },
      // 画面左手：接 J2 结尾握着花茎（curl 0.85），另一只手把花束拿走时慢慢松开
      handL: (() => {
        const rh = riseHand({ stand, bend, slump: 0.4, shoulderLift: 0, legSlant: 0 }, MAN, -1, [-74, -34]);
        return { ...rh, angle: 30, curl: lerp(0.85, rh.curl, clamp(place * 2.5)) };
      })(),
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
  const walkT = Math.max(0, t - 289.1);
  // 慢慢起步，稳定在每秒约 1.5 步
  const v = 380;
  const acc = 0.7;
  const g = gait(walkT, (u) => (u < acc ? (v * u) / acc : v), (u) => clamp(0.3 + u * 1.2, 0, 1), MAN, K * WALK_FIT);
  const dist = g.dist;
  const groundY = SEAT_Y + 262 * K;
  const man = manAlone(
    t,
    { turn: lerp(0.22, 0.6, turnU), pitch: 0.1, eyeOpen: 0.7, gaze: 0.5, brow: 0.2, mouth: 0 },
    // 手的位置接上 J3 结尾（起身后自然下垂）
    { stand: 1, bend: 0, slump: 0.2, bodyTurn: lerp(0.02, 1, turnU), handR: { at: HANG(MAN, 1), fore: 1 }, handL: { at: HANG(MAN, -1), fore: 1, angle: 30 } }
  );
  // 转身：正面画法收窄后，在上层淡出，下层的侧身画法接上
  const frontOp = track(t, [[289.0, 1], [289.17, 0, E.inOut]]);
  const showWalker = t >= 289.0;
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={cam}
        t={t}
        tod="dawn"
        man={man}
        hideMan={frontOp <= 0.001}
        manOpacity={frontOp}
        manScaleX={lerp(1, 0.66, track(t, [[288.7, 0], [289.1, 1, E.in]]))}
        woman={null}
        bouquet={BOUQUET_SEAT}
        rain={0}
        lampGlow={0}
        glassDrops={1}
        glassLight={GLASS_LIGHT(1)}
        extraFigures={showWalker ? <WalkFigure phase={g.phase} design={MAN} x={STOP.manX + 10 + dist} y={groundY} scale={K * WALK_FIT} stride={g.stride} filter="url(#pencil)" /> : null}
      />
      <DawnLight k={1} />
    </AbsoluteFill>
  );
};
