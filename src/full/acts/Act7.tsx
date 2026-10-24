import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { BusStopWorld, STOP } from "../../env/BusStop";
import { LAMP } from "../../env/Alley";
import { FRONT_NEUTRAL, FrontPose, frontShapes } from "../../characters/front";
import { walkShapes } from "../../characters/walk";
import { WOMAN_MEM } from "../../characters/designs";
import { E, track, lerp } from "../../lib/anim";
import { noise1 } from "../../lib/random";
import { Cam, applyCam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { FxCanvas } from "../../fx/FxCanvas";
import { drawShapesCanvas } from "../../fx/shapesCanvas";
import { drawFlight, Flight } from "../../fx/petals";
import { womanPoseS2, S2_T, s2Walk, turnFade } from "../../shots/S2Leaving";
import { C } from "../../config/palette";
import { Bloom } from "./shared";

/**
 * 第七幕「再次雨夜」F2–F4（2:54.7–3:13.86）
 * F2 他一个人坐回长椅左边，花束横在腿上，看着右边的空位；
 * F3 空位上浮出她的铅笔草稿，把那晚的起身、离开重演一遍，只有线条；
 * F4 他闭上眼，花瓣从花束上升起，镜头推向路灯的光晕（下一镜光晕变成月亮）。
 * （F1 雨水冲掉玻璃上的字在 Act6。）
 */

const SEAT_Y = STOP.seatY - 8;
const K = STOP.figScale;
/** 他腿上的花束：花头朝向空位 */
/** 他腿上的花束：花茎从他右手（画面左边那只）里穿过，手指从上面握住 */
export const BOUQUET_HIS = { x: STOP.manX - 38, y: SEAT_Y - 4, rot: -8, scale: 0.74, front: "over" as const, grip: "L" as const };

export const manAlone = (t: number, head: Partial<FrontPose["head"]>, extra: Partial<FrontPose> = {}): FrontPose => ({
  ...FRONT_NEUTRAL,
  head: { turn: 0.1, pitch: 0.5, eyeOpen: 0.55, gaze: 0.2, brow: 0.5, mouth: -0.25, ...head },
  slump: 0.55,
  bodyTurn: 0.08,
  // 两只手拢着腿上的花束
  handL: { at: [-74, -34], fore: 0.5, angle: 30, curl: 0.85 },
  handR: { at: [40, -52], fore: 0.5, angle: -20, curl: 0.5 },
  breathe: 0.5 + 0.5 * Math.sin(t * 1.7),
  ...extra,
});

// ---------------- F2 ----------------
export const F2: React.FC = () => {
  const t = useSongT("F2");
  const look = track(t, [[176.3, 0], [177.7, 1, E.inOut]]);
  const reach = track(t, [[178.5, 0], [179.5, 1, E.inOut], [180.3, 1], [180.9, 0.85, E.out]]);
  const cam: Cam = { x: track(t, [[174.7, 975], [180.95, 990, E.drift]]), y: 520, scale: track(t, [[174.7, 1.16], [180.95, 1.22, E.drift]]) };
  const man = manAlone(
    t,
    {
      turn: lerp(0.06, 0.55, look) + noise1(t * 0.5, 31) * 0.015,
      pitch: lerp(0.52, 0.2, look),
      eyeOpen: lerp(0.45, 0.7, look),
      gaze: lerp(0.1, 0.5, look),
    },
    {
      bodyTurn: 0.08 + look * 0.12,
      // 他的左手（画面右）离开花束，在空位前的座面上停住
      handR: { at: [lerp(40, 120, reach), lerp(-52, -12, reach)], fore: lerp(0.5, 1, reach), angle: lerp(-20, -4, reach), curl: lerp(0.5, 0.2, reach) },
    }
  );
  return (
    <AbsoluteFill>
      <BusStopWorld cam={cam} t={t} man={man} woman={null} bouquet={BOUQUET_HIS} rain={1} glassDrops={1} />
    </AbsoluteFill>
  );
};

// ---------------- F3 ----------------
/** 把 F3 的时间映射回试片段 S2 的时间（放慢到 0.85 倍） */
const s2Time = (t: number) => 12.75 + (t - 180.95) * 0.85;

const HerSketch: React.FC<{ t: number; cam: Cam }> = ({ t, cam }) => {
  const st = s2Time(t);
  const appear = track(t, [[181.0, 0], [181.8, 1, E.out]]);
  const vanish = track(t, [[185.9, 0], [187.0, 1, E.inOut]]);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const a0 = appear * (1 - vanish);
      if (a0 <= 0.01) return;
      applyCam(ctx, cam);
      // 转身：正面草稿和侧身草稿交叉淡化（与 S2 同一时刻）
      const fFront = turnFade(st);
      const passes = [
        { dx: 0, dy: 0, la: 0.85, fa: 0.16, lw: 2.4 },
        { dx: 1.6, dy: -1.2, la: 0.3, fa: 0, lw: 1.4 },
      ];
      if (fFront > 0.001) {
        const a = a0 * fFront;
        const pose = womanPoseS2(st);
        const shapes = frontShapes(pose, WOMAN_MEM);
        const sx = track(st, [[S2_T.turn[0], 1], [S2_T.turn[1], 0.66, E.in]]);
        for (const p of passes) {
          ctx.save();
          ctx.translate(STOP.womanX, 0);
          ctx.scale(sx, 1);
          ctx.translate(-STOP.womanX, 0);
          drawShapesCanvas(ctx, shapes, { x: STOP.womanX + p.dx, y: SEAT_Y + p.dy, scale: K }, { fillAlpha: p.fa * a, lineAlpha: p.la * a, line: C.memSepia, lw: p.lw, linesOnly: p.fa === 0 });
          ctx.restore();
        }
      }
      if (fFront < 0.999) {
        const a = a0 * (1 - fFront);
        const w = s2Walk(st);
        const x = w.x;
        const groundY = SEAT_Y + 262 * K;
        const shapes = walkShapes(w.phase, WOMAN_MEM, w.stride);
        for (const p of passes) {
          drawShapesCanvas(ctx, shapes, { x: x + p.dx, y: groundY + p.dy, scale: K }, { fillAlpha: p.fa * a, lineAlpha: p.la * a, line: C.memSepia, lw: p.lw, linesOnly: p.fa === 0 });
        }
      }
    },
    [cam, st, appear, vanish]
  );
  return <FxCanvas draw={draw} />;
};

export const F3: React.FC = () => {
  const t = useSongT("F3");
  const st = s2Time(t);
  const cam: Cam = { x: track(t, [[180.95, 1010], [187.45, 1030, E.drift]]), y: 520, scale: track(t, [[180.95, 1.24], [187.45, 1.28, E.drift]]) };
  // 他看着草稿：她起身时抬头，离开时目光追到右边，最后落回空位
  const up = track(st, [[S2_T.rise[0], 0], [S2_T.rise[1], 1, E.inOut]]);
  const follow = track(st, [[S2_T.walk[0], 0], [S2_T.walk[1], 1, E.inOut]]);
  const back = track(t, [[185.6, 0], [186.8, 1, E.inOut]]);
  const man = manAlone(
    t,
    {
      turn: lerp(lerp(0.55, 0.5, up), 0.82, follow) - back * 0.25 + noise1(t * 0.5, 33) * 0.012,
      pitch: lerp(lerp(0.2, -0.12, up), -0.05, follow) + back * 0.4,
      eyeOpen: lerp(0.7, 0.85, up) - back * 0.3,
      gaze: lerp(0.5, 0.8, follow) - back * 0.2,
      brow: 0.55,
    },
    {
      bodyTurn: 0.2 + follow * 0.08 - back * 0.08,
      slump: 0.5 - up * 0.15 + back * 0.2,
      handR: { at: [120, -12], fore: 1, angle: -4, curl: lerp(0.2, 0.7, back) },
    }
  );
  return (
    <AbsoluteFill>
      <BusStopWorld cam={cam} t={t} man={man} woman={null} bouquet={BOUQUET_HIS} rain={1} glassDrops={1} />
      <HerSketch t={t} cam={cam} />
    </AbsoluteFill>
  );
};

// ---------------- F4 ----------------
const RISE: Flight = {
  seed: 404,
  count: 70,
  spawn: [188.6, 192.6],
  from: { x0: STOP.manX + 20, x1: STOP.manX + 110, y0: SEAT_Y - 60, y1: SEAT_Y - 20 },
  vel: [150, -150],
  velJitter: [60, 50],
  gravity: -14,
  sway: 26,
  size: [9, 15],
  life: 5.5,
};
export const F4_END_CAM: Cam = { x: LAMP.x, y: LAMP.y, scale: 3.4 };

export const F4: React.FC = () => {
  const t = useSongT("F4");
  const close = track(t, [[187.9, 0], [188.7, 1, E.inOut]]);
  const gather = track(t, [[187.6, 0], [188.5, 1, E.inOut]]);
  const lift = track(t, [[188.8, 0], [190.4, 1, E.inOut]]);
  const push = track(t, [[189.6, 0], [193.86, 1, E.in]]);
  const c0: Cam = { x: 1000, y: 520, scale: 1.24 };
  // 推镜：先缓后快，落到灯头上
  const cam: Cam = { x: lerp(c0.x, F4_END_CAM.x, push), y: lerp(c0.y, F4_END_CAM.y, push), scale: c0.scale * Math.pow(F4_END_CAM.scale / c0.scale, push) };
  const bloom = track(t, [[192.3, 0], [193.86, 1, E.in]]);
  const man = manAlone(
    t,
    {
      // 开头接 F3 结尾：头还转向空位
      turn: lerp(0.57, 0.12, close),
      pitch: lerp(lerp(0.35, 0.45, close), -0.08, lift),
      eyeOpen: lerp(0.55, 0.04, close),
      gaze: lerp(0.6, 0.2, close),
      brow: lerp(0.55, 0.3, lift),
      mouth: lerp(-0.25, -0.05, lift),
    },
    {
      slump: lerp(lerp(0.55, 0.6, close), 0.35, lift),
      bodyTurn: lerp(0.2, 0.08, close),
      // 右手从空位的座面上收回来，拢住怀里的花束
      handR: { at: [lerp(120, 40, gather), lerp(-12, -52, gather)], fore: lerp(1, 0.5, gather), angle: lerp(-4, -20, gather), curl: lerp(0.7, 0.5, gather) },
    }
  );
  const drawPetals = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawFlight(ctx, cam, t, RISE, true);
    },
    [cam, t]
  );
  return (
    <AbsoluteFill>
      <BusStopWorld cam={cam} t={t} man={man} woman={null} bouquet={{ ...BOUQUET_HIS }} rain={lerp(1, 0.35, push)} glassDrops={1 - push * 0.5} lampGlow={1 + push * 0.4} />
      <FxCanvas draw={drawPetals} />
      {/* 光晕：推近时铺满画面，下一镜在同一位置变成月亮 */}
      <Bloom k={bloom} />
    </AbsoluteFill>
  );
};
