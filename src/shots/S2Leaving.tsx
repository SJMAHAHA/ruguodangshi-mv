import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BusStopWorld, STOP } from "../env/BusStop";
import { FRONT_NEUTRAL, FrontPose } from "../characters/front";
import { WalkFigure } from "../characters/walk";
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
  y: 548,
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
  const lean = track(t, [[S2_T.lean[0], 0], [S2_T.lean[1], 1, E.in], [S2_T.rise[1], 0.15, E.out]]);
  const stand = track(t, [[S2_T.rise[0], 0], [S2_T.rise[1], 1, E.inOut]]);
  const rise = -250 * stand * stand * (3 - 2 * stand);
  const hes = track(t, [[S2_T.hesitate[0], 0], [S2_T.hesitate[0] + 0.25, 1, E.out], [S2_T.hesitate[1], 0, E.in]]);
  const turnAway = track(t, [[S2_T.turn[0] - 0.1, 0], [S2_T.turn[1], 1, E.in]]);
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.2 + 1);
  const hx = lerp(-112, -46, w);
  const hy = lerp(-18, -38, w) - lift * 26;
  // 坐 → 双手撑在大腿上起身 → 站直后手臂自然下垂（犹豫时靠他那侧的手微微抬起）
  const hipY = rise + 6;
  const sk = Math.min(1, stand * 1.25);
  const lx = lerp(lerp(hx, -44, lean), -84 - hes * 16, sk);
  const ly = lerp(lerp(hy, -26, lean), -256 - hes * 22, sk * sk) + (hipY - 6) * (1 - sk * sk) * 0.92;
  const rx = lerp(lerp(42, 44, lean), 84, sk);
  const ry = lerp(-36, -258, sk * sk) + (hipY - 6) * (1 - sk * sk) * 0.92;
  return {
    ...FRONT_NEUTRAL,
    head: {
      turn: lerp(0.6, 0.2, w) + lean * 0.1,
      pitch: lerp(-0.1, 0.35, w) + lean * 0.3,
      eyeOpen: lerp(0.9, 0.6, w),
      gaze: 0.4,
      brow: 0.45,
      mouth: -0.3,
    },
    headTilt: lerp(0, -2, w),
    shoulderLift: track(t, [[9.75, 0], [10.05, 0.5, E.out], [10.9, 0, E.inOut]]),
    slump: lerp(0, 0.2, w) * (1 - stand),
    bodyTurn: lerp(lerp(0.3, 0.45, w) * (1 - stand * 0.6), 1, turnAway) - hes * 0.25,
    stand,
    legSlant: 1,
    handL: { at: [lx, ly], fore: lerp(lerp(1, 0.6, w), 1, sk) },
    handR: { at: [rx, ry], fore: lerp(0.6, 1, sk) },
    breathe,
  };
};

export const S2Leaving: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (SHOTS.s2.from + frame) / FPS;
  const cam = s2Cam(t);
  const man = manPoseS2(t);
  const woman = womanPoseS2(t);
  // 正面站姿转到侧身后（头部已在画外），在一帧内换成侧身行走画法
  const walking = t >= S2_T.turn[1];
  const walkT = Math.max(0, t - S2_T.turn[1]);
  // 起步慢，随后匀速：距离 = 加速段 + 匀速段
  const v = 760;
  const acc = 0.55;
  const dist = walkT < acc ? (0.5 * v * walkT * walkT) / acc : 0.5 * v * acc + v * (walkT - acc);
  const phase = (dist / 380) * Math.PI;
  const walkX = STOP.womanX + 6 + dist;
  const groundY = STOP.seatY - 8 + 262 * STOP.figScale;
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={cam}
        t={t}
        man={man}
        woman={walking ? null : woman}
        womanScaleX={track(t, [[S2_T.turn[0], 1], [S2_T.turn[1], 0.66, E.in]])}
        extraFigures={
          walking ? <WalkFigure phase={phase} design={WOMAN} x={walkX} y={groundY} scale={STOP.figScale} stride={Math.min(1, 0.35 + walkT * 1.5)} filter="url(#pencil)" /> : null
        }
      />
    </AbsoluteFill>
  );
};
