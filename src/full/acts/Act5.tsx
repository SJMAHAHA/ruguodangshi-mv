import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { E, track, lerp, clamp } from "../../lib/anim";
import { Cam, WorldSvg, applyCam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { PencilDefs } from "../../draw/Defs";
import { AlleyStripWall, AlleyStripGround, AlleyStripNear, SHUTTER_X } from "../../env/AlleyStrip";
import { WalkFigure, walkNearHand } from "../../characters/walk";
import { MAN, MAN_MEM, WOMAN_MEM } from "../../characters/designs";
import { Bouquet } from "../../props/Bouquet";
import { Bench } from "../../props/Bench";
import { FigureFront, FRONT_NEUTRAL } from "../../characters/front";
import { FxCanvas } from "../../fx/FxCanvas";
import { C } from "../../config/palette";
import { smoothClosed, smoothOpen, P } from "../../lib/geom";

/**
 * 第五幕「独行」D1–D2（1:56.75–2:22.4，间奏）
 * D1 雨停后，他提着倒垂的花束走过旧街（只拍腰以下，横移跟拍）；
 * D2 他停在卷帘门前：门上贴着一张褪色的回忆纸，他伸手去碰，纸被风吹走。
 */

const FIG = 0.55; // 人物在街景坐标里的缩放
const SPEED = 290; // 街景单位/秒（约 0.9 m/s）
const STEP = 108; // 半个步态周期走过的距离
const T0 = 116.75;
const T_SLOW = 128.2;
const T_STOP = 129.3;
const STOP_X = SHUTTER_X - 300;
/** 走过的距离（匀速 → 减速停下） */
const distAt = (t: number) => {
  const vEnd = (T_STOP - T_SLOW) * SPEED * 0.5;
  const total = (T_SLOW - T0) * SPEED + vEnd;
  let d: number;
  if (t <= T_SLOW) d = (t - T0) * SPEED;
  else if (t <= T_STOP) {
    const u = (t - T_SLOW) / (T_STOP - T_SLOW);
    d = (T_SLOW - T0) * SPEED + (T_STOP - T_SLOW) * SPEED * (u - 0.5 * u * u);
  } else d = total;
  return { d, total };
};

export const D1: React.FC = () => {
  const t = useSongT("D1");
  const { d, total } = distAt(t);
  const himX = STOP_X - total + d;
  const phase = (d / STEP) * Math.PI;
  const stride = t > T_SLOW ? clamp(1 - (t - T_SLOW) / (T_STOP - T_SLOW)) * 0.8 + 0.2 * clamp((T_STOP - t) / 0.3) : 1;
  const k = 2.45;
  const cam: Cam = { x: himX + (960 - 700) / k + track(t, [[128.6, 0], [129.5, 60, E.inOut]]), y: (540 - 860) / k, scale: k };
  const nearCam: Cam = { x: cam.x * 1.35 - 900, y: cam.y, scale: k * 1.12 };
  const hand = walkNearHand(phase, MAN, stride, { holdNear: true });
  const hw: P = [himX + hand.wrist[0] * FIG, hand.wrist[1] * FIG];
  const swing = Math.sin(phase + Math.PI) * 4 + Math.sin(t * 2.3) * 2;
  const drawSplash = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      applyCam(ctx, cam);
      // 每一步落地时在湿地面上留下一圈涟漪
      const lastStep = Math.floor(d / STEP);
      for (let s = Math.max(0, lastStep - 4); s <= lastStep; s++) {
        const stepD = s * STEP;
        const tt = T0 + stepD / SPEED;
        const age = t - tt;
        if (age < 0 || age > 0.9) continue;
        const x = STOP_X - total + stepD + (s % 2 === 0 ? 30 : -10);
        const r = 10 + age * 60;
        ctx.strokeStyle = `rgba(210,214,206,${0.4 * (1 - age / 0.9)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(x, 6, r, r * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    [cam, t, d, total]
  );
  return (
    <AbsoluteFill style={{ background: "#151c22" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <g filter="url(#pencil-soft)">
          <AlleyStripWall lamp={1} />
        </g>
        <AlleyStripGround lamp={1} />
        <ellipse cx={himX} cy={8} rx={120} ry={10} fill="#0e1317" opacity={0.5} />
        <WalkFigure phase={phase} design={MAN} x={himX} y={0} scale={FIG} stride={stride} filter="url(#pencil)" holdNear />
        {/* 倒提的花束：花朝下，随步子轻轻晃 */}
        <Bouquet x={hw[0] + 4} y={hw[1] + 8} scale={0.56} rot={96 + swing} />
      </WorldSvg>
      <FxCanvas draw={drawSplash} />
      <WorldSvg cam={nearCam} style={{ filter: "blur(3px)" }}>
        <AlleyStripNear lamp={1} />
      </WorldSvg>
    </AbsoluteFill>
  );
};

// ---------------- D2 卷帘门上的回忆纸 ----------------
const MemorySheet: React.FC<{ lift: number; fly: number; t: number }> = ({ lift, fly, t }) => {
  // 右上角被风掀起：折角大小随风变化
  const flap = lift * (0.6 + 0.4 * Math.sin(t * 7.3) * Math.sin(t * 2.1));
  const fx = 520 - flap * 150;
  const fy = flap * 120;
  const flyX = fly * fly * 1400;
  const flyY = -fly * 700 + Math.sin(fly * 6) * 60;
  const flyRot = fly * 160;
  const sx = 1 - fly * 0.4 + Math.cos(fly * 9) * 0.2 * fly;
  return (
    <g transform={`translate(${flyX},${flyY}) rotate(${flyRot} 260 300) scale(${sx},1)`} opacity={1 - clamp((fly - 0.7) / 0.3)}>
      <path d={`M0,0 L${fx},0 L520,${fy} L520,600 L0,600 Z`} fill="#e7dcc3" stroke={C.memSepia} strokeWidth={3} />
      <clipPath id="sheetClipD2">
        <path d={`M0,0 L${fx},0 L520,${fy} L520,600 L0,600 Z`} />
      </clipPath>
      <g clipPath="url(#sheetClipD2)">
        <rect width={520} height={600} fill="#e7dcc3" />
        <g transform="translate(260,430) scale(0.42)" opacity={0.85}>
          <Bench w={900} x={0} y={30} scale={1} memory />
          <FigureFront
            pose={{ ...FRONT_NEUTRAL, head: { turn: -0.3, pitch: 0.2, eyeOpen: 0.25, gaze: -0.2, brow: 0, mouth: 0.75 }, headTilt: -15, headOffset: [-36, 24], lean: -7, bodyTurn: -0.25, legSlant: -0.4, handL: { at: [-30, -60], fore: 0.5 }, handR: { at: [34, -58], fore: 0.5 } }}
            design={WOMAN_MEM}
            x={130}
            y={22}
            scale={1.1}
          />
          <FigureFront pose={{ ...FRONT_NEUTRAL, head: { turn: 0.42, pitch: 0.08, eyeOpen: 0.75, gaze: 0.5, brow: 0, mouth: 0.6 }, bodyTurn: 0.2, handL: { at: [-34, -40], fore: 0.5, angle: 18 }, handR: { at: [90, -40], fore: 0.6 } }} design={MAN_MEM} x={-150} y={22} scale={1.1} />
        </g>
      </g>
      {/* 掀起的纸角背面 */}
      {flap > 0.02 ? <path d={`M${fx},0 L520,${fy} L${fx + (520 - fx) * 0.15},${fy * 0.95} Z`} fill="#cdbf9f" stroke={C.memSepia} strokeWidth={2} /> : null}
      {/* 胶带 */}
      <rect x={-20} y={-14} width={90} height={30} fill="#e9e2cf" opacity={0.7} transform="rotate(-20 25 0)" />
      <rect x={-30} y={570} width={90} height={30} fill="#e9e2cf" opacity={0.7} transform="rotate(18 15 585)" />
    </g>
  );
};

export const D2: React.FC = () => {
  const t = useSongT("D2");
  const lift = track(t, [[129.6, 0.15], [131.0, 0.5, E.inOut], [133.5, 0.45], [136.5, 0.9, E.inOut]]);
  const fly = track(t, [[138.2, 0], [141.4, 1, E.in]]);
  const reach = track(t, [[134.2, 0], [135.6, 1, E.inOut], [137.7, 1], [138.4, 0.75, E.out], [140.4, 0.7], [141.4, 0.1, E.inOut]]);
  const cam = { s: track(t, [[129.5, 1.0], [142.4, 1.06, E.drift]]) };
  // 他的手（从画面左下伸进来，停在纸角前，没有碰到）
  const hand: P = [lerp(-260, 860, reach), lerp(1300, 820, reach)];
  return (
    <AbsoluteFill style={{ background: "#151c22" }}>
      <svg width={1920} height={1080}>
        <PencilDefs />
        <g transform={`translate(960,540) scale(${cam.s}) translate(-960,-540)`}>
          {/* 卷帘门特写 */}
          <rect x={-100} y={-100} width={2120} height={1300} fill="#5a6461" />
          {Array.from({ length: 34 }, (_, k) => (
            <g key={k}>
              <line x1={-100} y1={k * 36} x2={2120} y2={k * 36} stroke="#454f4c" strokeWidth={5} />
              <line x1={-100} y1={k * 36 + 4} x2={2120} y2={k * 36 + 4} stroke="#6c7672" strokeWidth={1.5} opacity={0.6} />
            </g>
          ))}
          <ellipse cx={1500} cy={300} rx={900} ry={700} fill="#cfcab4" opacity={0.12} filter="url(#soft-blur-60)" />
          {/* 旧贴纸残迹 */}
          <rect x={1300} y={720} width={260} height={180} fill="#7c7a6c" opacity={0.3} transform="rotate(4 1300 720)" />
          <g transform="translate(700,200) rotate(-4)">
            <MemorySheet lift={lift} fly={fly} t={t} />
          </g>
          {/* 纸被吹走后，门上留下浅浅的四方印子 */}
          <rect x={700} y={200} width={520} height={600} fill="#4d5653" opacity={0.25 * fly} transform="rotate(-4 700 200)" />
          {/* 他的手：手背朝外、手指伸直，指尖停在纸角前 */}
          <g transform={`translate(${hand[0]},${hand[1]}) rotate(${-38 + reach * 8})`}>
            <path d={smoothClosed([[-60, 60], [60, 40], [80, 120], [40, 700], [-300, 700], [-200, 200]], 0.7)} fill={MAN.coat} stroke={C.graphite} strokeWidth={3.5} />
            <path d={smoothOpen([[-50, 80], [70, 70]])} stroke={C.graphite} strokeWidth={3} />
            <path d={smoothClosed([[-58, 64], [-70, -40], [-50, -120], [60, -130], [86, -40], [66, 50]], 0.8)} fill={MAN.look.skin} stroke={C.graphite} strokeWidth={3.5} />
            {[[-46, -110, -56, -250], [-6, -124, -8, -290], [34, -124, 40, -280], [66, -100, 82, -220]].map(([x0, y0, x1, y1], i) => (
              <path key={i} d={smoothClosed([[x0 - 16, y0 + 10], [x1 - 12, y1 + 10], [x1, y1], [x1 + 14, y1 + 12], [x0 + 18, y0 + 6]], 0.8)} fill={MAN.look.skin} stroke={C.graphite} strokeWidth={3.2} />
            ))}
            <path d={smoothClosed([[-66, -20], [-120, -80], [-150, -140], [-130, -150], [-80, -100], [-50, -60]], 0.8)} fill={MAN.look.skin} stroke={C.graphite} strokeWidth={3.2} />
            <path d={smoothClosed([[-40, -40], [50, -60], [60, 20], [-30, 30]], 0.8)} fill={MAN.look.skinShade} opacity={0.35} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

