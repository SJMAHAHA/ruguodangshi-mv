import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BusStopWorld, STOP } from "../env/BusStop";
import { FRONT_NEUTRAL, FrontPose, riseHand } from "../characters/front";
import { WalkFigure, gait } from "../characters/walk";
import { WOMAN } from "../characters/designs";
import { E, track, lerp } from "../lib/anim";
import { noise1 } from "../lib/random";
import { FPS, SHOTS } from "../config/timeline";
import { Cam } from "../lib/camera";

/**
 * S2「手先松开」 帧 289–527（9.63–17.57 s）
 * 先有她的动作（抽手、起身、离开），再有他的反应（低头看手、抬头追看）。
 * 时间全部用全片秒数，方便对照歌词。
 */
export const S2_T = {
  withdraw: [9.86, 10.8] as const, // 她抽回手
  lookHand: [11.05, 11.85] as const, // 他低头看手
  curl: [11.5, 12.5] as const, // 他的手指慢慢收拢
  lean: [12.98, 13.5] as const, // 她前倾
  rise: [13.42, 14.4] as const, // 起身（头部出画）
  hesitate: [14.4, 14.95] as const, // 站定，手朝他抬了一下又放下
  turn: [14.95, 15.2] as const, // 转身
  walk: [15.2, 16.6] as const, // 走出画面
  follow: [14.75, 15.85] as const, // 他抬头追看
  settle: [16.85, 17.5] as const, // 他的视线落回空位
};

export const s2Cam = (t: number): Cam => ({
  x: 985 + track(t, [[9.63, 0], [17.57, -10, E.drift]]),
  // 她站起来时镜头轻轻上摇，跟住她犹豫回看的那一下；她走开后落回长椅
  y: track(t, [[S2_T.rise[0] + 0.1, 510], [S2_T.hesitate[0] + 0.05, 340, E.inOut], [S2_T.turn[1], 352], [S2_T.settle[0], 510, E.inOut]]),
  scale: track(t, [[9.63, 1.3], [17.57, 1.33, E.drift]]),
});

export const manPoseS2 = (t: number): FrontPose => {
  const look = track(t, [[S2_T.lookHand[0], 0], [S2_T.lookHand[1], 1, E.inOut]]);
  const follow = track(t, [[S2_T.follow[0], 0], [S2_T.follow[1], 1, E.out]]);
  const settle = track(t, [[S2_T.settle[0], 0], [S2_T.settle[1], 1, E.inOut]]);
  const curl = track(t, [[S2_T.curl[0], 0], [S2_T.curl[1], 0.75, E.inOut], [15.1, 0.75], [15.7, 0.45, E.inOut]]);
  const breathe = 0.5 + 0.5 * Math.sin(t * 1.9);
  // 头：看她 → 低头看手 → 抬头追看右侧 → 落回空位
  const turn = lerp(lerp(lerp(0.42, 0.3, look), 0.8, follow), 0.62, settle);
  const pitch = lerp(lerp(lerp(0.12, 0.62, look), -0.25, follow), 0.3, settle);
  return {
    ...FRONT_NEUTRAL,
    head: {
      turn: turn + noise1(t * 0.7, 3) * 0.015,
      pitch,
      eyeOpen: lerp(lerp(0.85, 0.55, look), 0.95, follow) - settle * 0.25,
      gaze: lerp(0.5, 0.8, follow),
      brow: lerp(0.25, 0.6, look),
      mouth: -0.25,
    },
    headTilt: lerp(-2, 3, follow) + noise1(t * 0.5, 9) * 0.6,
    slump: lerp(0.2, 0.5, look) - follow * 0.3 + settle * 0.4,
    lean: lerp(0, -1.5, look) + follow * 2,
    bodyTurn: lerp(0.22, 0.12, look) + follow * 0.25 - settle * 0.08,
    handL: { at: [-34, -40], fore: 0.5, angle: 18 },
    // 他的左手（画面右）原本压着她的手，她抽走后留在原处，手指慢慢收拢
    handR: { at: [130 - curl * 3, -12 - curl * 2], fore: 1, angle: -4, curl },
    breathe,
  };
};

export const womanPoseS2 = (t: number): FrontPose => {
  const w = track(t, [[S2_T.withdraw[0], 0], [S2_T.withdraw[1], 1, E.inOut]]);
  const lift = Math.sin(Math.PI * w); // 抽手时手略微抬起
  // 起身：先前倾（重心移到脚上）→ 撑着大腿站起来 → 上身最后才挺直
  const bend = track(t, [[S2_T.lean[0], 0], [S2_T.lean[1], 0.9, E.inOut], [S2_T.rise[0] + 0.35, 1, E.inOut], [S2_T.rise[1] + 0.05, 0, E.out]]);
  const stand = track(t, [[S2_T.rise[0], 0], [S2_T.rise[1], 1, E.inOut]]);
  const hes = track(t, [[S2_T.hesitate[0], 0], [S2_T.hesitate[0] + 0.25, 1, E.out], [S2_T.hesitate[1], 0, E.in]]);
  const turnAway = track(t, [[S2_T.turn[0] - 0.1, 0], [S2_T.turn[1], 1, E.in]]);
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.2 + 1);
  const hx = lerp(-112, -46, w);
  const hy = lerp(-18, -38, w) - lift * 26;
  const base = { stand, bend, slump: lerp(0, 0.2, w) * (1 - stand), shoulderLift: 0, legSlant: 1 };
  const hl = riseHand(base, WOMAN, -1, [hx, hy]);
  const hr = riseHand(base, WOMAN, 1, [42, -36]);
  return {
    ...FRONT_NEUTRAL,
    head: {
      turn: lerp(0.6, 0.2, w) + bend * 0.05,
      pitch: lerp(-0.1, 0.35, w) + bend * 0.3 - stand * 0.15,
      eyeOpen: lerp(0.9, 0.6, w),
      gaze: 0.4,
      brow: 0.45,
      mouth: -0.3,
    },
    headTilt: lerp(0, -2, w),
    shoulderLift: track(t, [[9.75, 0], [10.05, 0.5, E.out], [10.9, 0, E.inOut]]),
    slump: base.slump,
    bodyTurn: lerp(lerp(0.3, 0.45, w) * (1 - stand * 0.6), 1, turnAway) - hes * 0.25,
    stand,
    bend,
    legSlant: 1,
    // 犹豫：靠他那侧的手朝他抬了一下又放下（前臂向前伸，正面看是透视缩短，肘部贴着身体）
    handL: {
      at: [lerp(hl.at[0], -66, hes), lerp(hl.at[1], -334, hes)],
      fore: lerp(lerp(lerp(1, 0.6, w), hl.fore, Math.min(1, bend * 2 + stand)), 0.45, hes),
      curl: lerp(hl.curl, 0.35, hes),
      angle: hes * 25,
    },
    handR: hr,
    breathe,
  };
};

/** 正面 ↔ 侧身两种画法交叉淡化的时长（秒）：切换点前后各一半 */
export const TURN_X = 0.1;
/** 转身时正面画法的不透明度 */
export const turnFade = (t: number) => track(t, [[S2_T.turn[1] - TURN_X, 1], [S2_T.turn[1] + 0.07, 0, E.inOut]]);

/** 她转身之后的步态（F3 的铅笔草稿重演同一段，所以单独导出） */
export const s2Walk = (t: number) => {
  const walkT = Math.max(0, t - S2_T.turn[1]);
  // 起步 0.55 s 加速到 560/s（约每秒 2.4 步，走得很快）；步幅从小到大
  const v = 560;
  const acc = 0.55;
  const g = gait(walkT, (u) => (u < acc ? (v * u) / acc : v), (u) => Math.min(1, 0.35 + u * 1.5), WOMAN, STOP.figScale);
  return { walking: t >= S2_T.turn[1], walkT, ...g, x: STOP.womanX + 6 + g.dist, groundY: STOP.seatY - 8 + 262 * STOP.figScale };
};

export const S2Leaving: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (SHOTS.s2.from + frame) / FPS;
  const cam = s2Cam(t);
  const man = manPoseS2(t);
  const woman = womanPoseS2(t);
  // 正面站姿收窄到侧身宽度时，和侧身行走画法交叉淡化（侧身在下层先出现，正面在上层淡出）
  const w = s2Walk(t);
  const front = turnFade(t);
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={cam}
        t={t}
        man={man}
        woman={front > 0.001 ? woman : null}
        womanOpacity={front}
        womanOnTop
        womanScaleX={track(t, [[S2_T.turn[0], 1], [S2_T.turn[1], 0.66, E.in]])}
        extraFigures={t >= S2_T.turn[1] - TURN_X ? <WalkFigure phase={w.phase} design={WOMAN} x={w.x} y={w.groundY} scale={STOP.figScale} stride={w.stride} filter="url(#pencil)" /> : null}
      />
    </AbsoluteFill>
  );
};
