import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { E, track, lerp, clamp } from "../../lib/anim";
import { Cam, WorldSvg, applyCam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { PencilDefs } from "../../draw/Defs";
import { SvgImage } from "../../env/Plate";
import { ReachHand } from "../../props/Hands";
import { ASSETS } from "../../config/assets";
import { AlleyStripNear, SHUTTER_X } from "../../env/AlleyStrip";
import { WalkFigure, walkNearHand, gait, heelReach } from "../../characters/walk";
import { MAN } from "../../characters/designs";
import { Bouquet } from "../../props/Bouquet";
import { FxCanvas } from "../../fx/FxCanvas";
import { C } from "../../config/palette";
import { P } from "../../lib/geom";

/**
 * 第五幕「独行」D1–D2（1:56.75–2:22.4，间奏）
 * D1 雨停后，他提着倒垂的花束走过旧街（只拍腰以下，横移跟拍）；
 * D2 他停在卷帘门前：门上贴着一张褪色的回忆纸，他伸手去碰，纸被风吹走。
 */

const FIG = 0.55; // 人物在街景坐标里的缩放
/** 他走在墙根前那条窄人行道上：鞋底落在世界 y≈+5（墙根 y=0，路沿 y≈+11） */
const WALK_Y = 25;
/** D1 背景板在街景坐标里的范围（覆盖整段跟拍） */
export const D1_RECT = { x: 2600, y: -420, w: 4600, h: 580 };
/** 分两段重画的长卷（Codex），中间重叠 200，拼接处用渐变过渡 */
export const D1_TILES = [
  { x: 2600, y: -420, w: 2400, h: 580 },
  { x: 4800, y: -420, w: 2400, h: 580 },
] as const;
const SPEED = 290; // 街景单位/秒（约 0.9 m/s）
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

/** 速度：匀速 → 线性减速停下（与 distAt 一致） */
const speedAt = (u: number) => {
  const t = T0 + u;
  return t <= T_SLOW ? SPEED : t <= T_STOP ? SPEED * (1 - (t - T_SLOW) / (T_STOP - T_SLOW)) : 0;
};
/** 减速时步子变小，停下时双脚并拢 */
const strideAt = (u: number) => {
  const t = T0 + u;
  return t > T_SLOW ? clamp(1 - (t - T_SLOW) / (T_STOP - T_SLOW)) * 0.8 + 0.2 * clamp((T_STOP - t) / 0.3) : 1;
};
const gaitD1 = (t: number) => gait(Math.max(0, t - T0), speedAt, strideAt, MAN, FIG);

export const D1: React.FC = () => {
  const t = useSongT("D1");
  const { d, total } = distAt(t);
  const himX = STOP_X - total + d;
  const { phase, stride } = gaitD1(t);
  const k = 2.45;
  const cam: Cam = {
    x:
      himX +
      (960 - 700) / k +
      track(t, [
        [128.6, 0],
        [129.5, 60, E.inOut],
      ]),
    y: (540 - 860) / k,
    scale: k,
  };
  const nearCam: Cam = { x: cam.x * 1.35 - 900, y: cam.y, scale: k * 1.12 };
  const hand = walkNearHand(phase, MAN, stride, { holdNear: true });
  const hw: P = [himX + hand.wrist[0] * FIG, WALK_Y + hand.wrist[1] * FIG];
  const swing = Math.sin(phase + Math.PI) * 4 + Math.sin(t * 2.3) * 2;
  const drawSplash = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      applyCam(ctx, cam);
      // 每一步脚跟着地时，在湿地面上留下一圈涟漪（逐帧往回找最近 0.9 s 内的落脚）
      let prev = gaitD1(t - 28 / 30).phase;
      for (let k = 27; k >= 0; k--) {
        const tk = t - k / 30;
        const g = gaitD1(tk);
        if (Math.floor(g.phase / Math.PI) > Math.floor(prev / Math.PI) && g.stride > 0.25) {
          const near = Math.floor(g.phase / Math.PI) % 2 === 0;
          const age = t - tk;
          const x = STOP_X - total + distAt(tk).d + (heelReach(MAN, g.stride) + (near ? 4 : -4)) * FIG;
          const r = 10 + age * 60;
          ctx.strokeStyle = `rgba(210,214,206,${0.4 * (1 - age / 0.9)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(x, WALK_Y - 19, r, r * 0.22, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        prev = g.phase;
      }
    },
    [cam, t, d, total],
  );
  return (
    <AbsoluteFill style={{ background: "#151c22" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        {/* 湿漉漉的旧街墙面与地面：Seedream 背景板（参考底稿是 AlleyStripWall + AlleyStripGround） */}
        {ASSETS.d1Tiles ? (
          <g>
            <defs>
              <linearGradient id="d1seam" gradientUnits="userSpaceOnUse" x1={D1_TILES[1].x} y1={0} x2={D1_TILES[0].x + D1_TILES[0].w} y2={0}>
                <stop offset="0" stopColor="#fff" stopOpacity={0} />
                <stop offset="1" stopColor="#fff" stopOpacity={1} />
              </linearGradient>
              <mask id="d1seamMask" maskUnits="userSpaceOnUse" x={D1_TILES[1].x} y={D1_TILES[1].y} width={D1_TILES[1].w} height={D1_TILES[1].h}>
                <rect x={D1_TILES[1].x} y={D1_TILES[1].y} width={D1_TILES[1].w} height={D1_TILES[1].h} fill="url(#d1seam)" />
              </mask>
            </defs>
            <SvgImage src="plates/d1_strip-a.jpg" rect={D1_TILES[0]} />
            <g mask="url(#d1seamMask)">
              <SvgImage src="plates/d1_strip-b.jpg" rect={D1_TILES[1]} />
            </g>
          </g>
        ) : (
          <SvgImage src="plates/d1_strip.jpg" rect={D1_RECT} />
        )}
        <ellipse cx={himX} cy={WALK_Y - 17} rx={110} ry={6} fill="#0e1317" opacity={0.45} />
        <WalkFigure phase={phase} design={MAN} x={himX} y={WALK_Y} scale={FIG} stride={stride} filter="url(#pencil)" holdNear />
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

/** D2 卷帘门特写的范围（画面坐标，镜头只做缩放） */
export const SHUTTER_RECT = { x: -100, y: -100, w: 2220, h: 1300 };

/**
 * D2 卷帘门特写：有 D1 新长卷时，直接把长卷右段里同一扇卷帘门放大铺满画面（板条、锈迹、光线和 D1 最后几秒一致）。
 * 取 d1_strip-b.jpg 画布 x 3445–4684、y 90–787（卷帘门的门框以内、墙根以上），放大 1.55 倍；
 * 一块板条在画面里约 82px，回忆纸（520px 宽）约 6 块板条宽。
 */
const D2_ZOOM = 1.55;
const D2_FROM = { x: 3445, y: 90 };
const D2_FROM_D1_RECT = { x: -D2_FROM.x * D2_ZOOM, y: -D2_FROM.y * D2_ZOOM, w: 4800 * D2_ZOOM, h: 1160 * D2_ZOOM };

/** D2 卷帘门特写原来的 SVG（背景板的参考底稿） */
export const ShutterWallSvg: React.FC = () => (
  <g>
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
  </g>
);

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
        {/* 和他手机锁屏同一张合影（取下半部：长椅和两个人），褪色 */}
        <g opacity={0.82}>
          <SvgImage src="plates/memory_photo.jpg" rect={{ x: 10, y: -380, w: 500, h: 955 }} />
        </g>
        <rect width={520} height={600} fill="#e7dcc3" opacity={0.18} />
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
  const lift = track(t, [
    [129.6, 0.15],
    [131.0, 0.5, E.inOut],
    [133.5, 0.45],
    [136.5, 0.9, E.inOut],
  ]);
  const fly = track(t, [
    [138.2, 0],
    [141.4, 1, E.in],
  ]);
  const reach = track(t, [
    [134.2, 0],
    [135.6, 1, E.inOut],
    [137.7, 1],
    [138.4, 0.75, E.out],
    [140.4, 0.7],
    [141.4, 0.1, E.inOut],
  ]);
  const cam = {
    s: track(t, [
      [129.5, 1.0],
      [142.4, 1.06, E.drift],
    ]),
  };
  // 他的手（从画面左下伸进来，停在纸角前，没有碰到）
  const hand: P = [lerp(-260, 860, reach), lerp(1300, 820, reach)];
  return (
    <AbsoluteFill style={{ background: "#151c22" }}>
      <svg width={1920} height={1080}>
        <PencilDefs />
        <defs>
          {/* 纸和手压一点夜色（偏冷、偏暗），再在卷帘门上投一层软影；纸被吹离门面时影子拉远、变淡 */}
          <filter id="d2-sheet" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.86 0 0 0 0  0 0.87 0 0 0  0 0 0.93 0 0.015  0 0 0 1 0" result="c" />
            <feDropShadow in="c" dx={8 + 40 * fly} dy={12 + 50 * fly} stdDeviation={7 + 12 * fly} floodColor="#0a0f14" floodOpacity={0.55 * (1 - 0.6 * fly)} />
          </filter>
          <filter id="d2-hand" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.78 0 0 0 0  0 0.78 0 0 0  0 0 0.8 0 0.01  0 0 0 1 0" result="c" />
            {/* 手离门面十来厘米，路灯在左上：影子落在右下方，比纸的影子远、虚 */}
            <feDropShadow in="c" dx={34} dy={44} stdDeviation={12} floodColor="#06090c" floodOpacity={0.62} />
          </filter>
        </defs>
        <g transform={`translate(960,540) scale(${cam.s}) translate(-960,-540)`}>
          {/* 卷帘门特写：D1 长卷里的同一扇门；没有新长卷时用旧的 Seedream 背景板（参考底稿是 ShutterWallSvg） */}
          {ASSETS.d1Tiles ? <SvgImage src="plates/d1_strip-b.jpg" rect={D2_FROM_D1_RECT} /> : <SvgImage src="plates/d2_shutter.jpg" rect={SHUTTER_RECT} />}
          <g transform="translate(700,200) rotate(-4)" filter={ASSETS.d1Tiles ? "url(#d2-sheet)" : undefined}>
            <MemorySheet lift={lift} fly={fly} t={t} />
          </g>
          {/* 纸被吹走后，门上留下浅浅的四方印子（被纸挡住的地方没那么脏，略浅） */}
          <rect x={700} y={200} width={520} height={600} fill={ASSETS.d1Tiles ? "#9aa6ae" : "#4d5653"} opacity={(ASSETS.d1Tiles ? 0.14 : 0.25) * fly} transform="rotate(-4 700 200)" />
          {/* 他的手：手背朝外、手指伸直，指尖停在纸角前 */}
          <g filter={ASSETS.d1Tiles ? "url(#d2-hand)" : undefined}>
            <ReachHand x={hand[0]} y={hand[1]} angle={-38 + reach * 8} sprite="plates/hand_reach-him.png" />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
