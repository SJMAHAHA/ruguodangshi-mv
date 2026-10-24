import { REF_CAM, REF_CLEAN, REF_NO_PEOPLE } from "../config/refs";
import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { Cam, WorldSvg, applyCam } from "../lib/camera";
import { ShelterFrame, LAMP, Tod } from "./Alley";
import { AlleyPlate, LampBoost } from "./Plate";
import { FxCanvas } from "../fx/FxCanvas";
import { drawGlass, drawRain, RainLayer } from "../fx/rain";
import { Bench } from "../props/Bench";
import { Bouquet } from "../props/Bouquet";
import { FigureFront, FrontPose, TShapes, handOnlyShapes } from "../characters/front";
import { MAN, WOMAN } from "../characters/designs";
import { Design } from "../characters/front";
import { PencilDefs } from "../draw/Defs";
import { withLife, SEED_MAN, SEED_WOMAN } from "../characters/life";
import { FPS } from "../config/timeline";

/** 公交站世界里的固定布局（世界坐标） */
export const STOP = {
  benchX: 960,
  seatY: 706,
  benchScale: 1.1,
  benchW: 900,
  figScale: 1.1,
  manX: 800,
  womanX: 1096,
  bouquet: { x: 1318, y: 700, scale: 0.92 },
} as const;

const RAIN_ALLEY: RainLayer = {
  seed: 101,
  count: 220,
  speed: [1500, 2100],
  len: [26, 60],
  width: [0.8, 1.4],
  alpha: [0.08, 0.22],
  wind: 0.1,
  color: "200,212,210",
  region: { x0: -560, x1: 2480, y0: -340, y1: 720 },
};

export const RAIN_FRONT: RainLayer = {
  seed: 202,
  count: 160,
  speed: [2300, 3100],
  len: [70, 140],
  width: [1.2, 2.2],
  alpha: [0.1, 0.26],
  wind: 0.12,
  color: "205,216,214",
  region: { x0: -560, x1: 2480, y0: -200, y1: 1460 },
};

export type BusStopProps = {
  cam: Cam;
  /** 用于雨和水珠的时间（秒，连续） */
  t: number;
  man: FrontPose;
  woman: FrontPose | null;
  /** 女主的整体不透明度（用于离开） */
  womanOpacity?: number;
  /** 女主水平压缩（转身时从正面收窄到侧面宽度） */
  womanScaleX?: number;
  /** 起身后的侧身行走层（由镜头自己画） */
  extraFigures?: React.ReactNode;
  bouquetMissing?: number;
  lampGlow?: number;
  rain?: number;
  canopy?: boolean;
  /** 场景整体模糊（对焦用，px） */
  sceneBlur?: number;
  /** 场景上方（人物前面）额外内容，世界坐标 */
  front?: React.ReactNode;
  /** 人物后面的额外内容（世界坐标） */
  behind?: React.ReactNode;
  /** 时段（完整版用） */
  tod?: Tod;
  manDesign?: Design;
  womanDesign?: Design;
  manX?: number;
  womanX?: number;
  /** 花束：null 表示不画；默认在她右手边的座位上 */
  bouquet?: { x: number; y: number; scale: number; rot?: number; memory?: boolean; front?: boolean | "over"; grip?: "L" | "R" } | null;
  /** 玻璃水珠的数量系数（0 = 没有） */
  glassDrops?: number;
  /** 人物（男）不画 */
  hideMan?: boolean;
  /** 玻璃水珠被另一束光照亮（黎明的天光），默认跟随路灯 */
  glassLight?: { at: [number, number]; glow: number; lit?: string };
  /** 男主水平压缩（转身） */
  manScaleX?: number;
  /** 男主整体不透明度（转身时和侧身画法交叉淡化） */
  manOpacity?: number;
  /** 女主画在 extraFigures 之上（转身时正面画法在上层淡出 / 淡入） */
  womanOnTop?: boolean;
  /** 自动眨眼（默认开；照片、定格画面里关掉） */
  alive?: boolean;
};

/** 时段调色：整层 CSS 滤镜（回忆里的白天 = 褪色的暖调旧照片） */
export const TOD_GRADE: Record<Tod, string | undefined> = {
  night: undefined,
  dusk: "brightness(1.08) contrast(0.96)",
  dawn: "brightness(1.2) contrast(0.86) saturate(0.85)",
  day: "sepia(0.85) saturate(1.25) hue-rotate(-8deg) brightness(1.32) contrast(0.82)",
};

/** 背景板的统一调色：夜景压暗墙面，让人物从背景里跳出来 */
const PLATE_GRADE: Record<Tod, string | undefined> = {
  night: "brightness(0.8) saturate(0.82) contrast(1.04)",
  dusk: "brightness(0.92) saturate(0.9)",
  dawn: "brightness(1.02) saturate(0.88)",
  day: "saturate(0.92)",
};

export const BusStopWorld: React.FC<BusStopProps> = ({
  cam: camProp,
  t,
  man,
  woman: womanProp,
  womanOpacity = 1,
  womanScaleX = 1,
  extraFigures: extraProp,
  bouquetMissing = 0,
  lampGlow = 1,
  rain: rainProp = 1,
  canopy = false,
  sceneBlur = 0,
  front: frontProp,
  behind,
  tod = "night",
  manDesign = MAN,
  womanDesign = WOMAN,
  manX = STOP.manX,
  womanX = STOP.womanX,
  bouquet,
  glassDrops: dropsProp = 1,
  hideMan: hideManProp = false,
  glassLight,
  manScaleX = 1,
  manOpacity = 1,
  womanOnTop = false,
  alive = true,
}) => {
  // 给 Codex 出参考图时（--props）：空背景 / 固定镜头 / 去掉雨（见 config/refs.ts）
  const cam = REF_CAM ?? camProp;
  let woman = REF_NO_PEOPLE ? null : womanProp;
  const hideMan = REF_NO_PEOPLE || hideManProp;
  const extraFigures = REF_NO_PEOPLE ? null : extraProp;
  const front = REF_NO_PEOPLE ? null : frontProp;
  const rain = REF_CLEAN ? 0 : rainProp;
  const glassDrops = REF_CLEAN ? 0 : dropsProp;
  const drawBehind = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (rain > 0.01) drawRain(ctx, cam, t, RAIN_ALLEY, rain);
    },
    [cam, t, rain]
  );
  const drawBackGlass = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (glassDrops <= 0.01) return;
      applyCam(ctx, cam);
      drawGlass(ctx, t, {
        seed: 77,
        beads: Math.round(260 * glassDrops),
        sliders: Math.round(26 * glassDrops),
        amount: 0.75,
        lit: glassLight?.lit ?? "214,222,216",
        glowAt: glassLight?.at ?? [LAMP.x, LAMP.y + 80],
        glow: glassLight ? glassLight.glow : lampGlow * 0.4,
        region: { x0: 100, x1: 1818, y0: 112, y1: 850 },
        sizeK: 0.9,
      });
    },
    [cam, t, lampGlow, glassDrops, glassLight]
  );
  const blur = sceneBlur > 0.05 ? `blur(${sceneBlur.toFixed(2)}px)` : "";
  const grade = TOD_GRADE[tod] ?? "";
  const memoryDay = tod === "day";
  // 回忆里的白天：只给背景调色，人物和长椅用回忆配色本身，不再叠滤镜（否则会洗白）
  // 背景板本身已经画好了时段的光色，只做很轻的统一调色
  const bgFilter = `${blur} ${PLATE_GRADE[tod] ?? ""}`.trim() || undefined;
  const fgFilter = (memoryDay ? blur : `${blur} ${grade}`).trim() || undefined;
  // 眨眼：所有在公交站的镜头统一加上（时间用连续的原曲秒，跨镜头不重置）
  if (alive) {
    man = withLife(man, t, SEED_MAN);
    if (woman) woman = withLife(woman, t, SEED_WOMAN);
  }
  const womanFig = woman ? (
    <g transform={`translate(${womanX},0) scale(${womanScaleX},1) translate(${-womanX},0)`}>
      <FigureFront pose={woman} design={womanDesign} x={womanX} y={STOP.seatY - 8} scale={STOP.figScale} filter="url(#pencil)" opacity={womanOpacity} />
    </g>
  ) : null;
  const bq = bouquet === undefined ? { x: STOP.bouquet.x, y: STOP.bouquet.y, scale: STOP.bouquet.scale, rot: 0, memory: false } : bouquet;
  // 空背景参考图里，拿在人手上 / 放在人腿上的花束也不画
  const bqShown = REF_NO_PEOPLE && bq && bq.front ? null : bq;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <PencilDefs />
      </svg>
      <AbsoluteFill style={{ filter: bgFilter }}>
        <AlleyPlate cam={cam} tod={tod} lampGlow={lampGlow} />
        <LampBoost cam={cam} k={lampGlow - 1} />
        <FxCanvas draw={drawBehind} />
        <WorldSvg cam={cam}>
          <ShelterFrame show={{ canopy, floor: true }} floorLook={memoryDay ? "day" : tod === "dusk" ? "dusk" : "night"} />
        </WorldSvg>
        <FxCanvas draw={drawBackGlass} />
      </AbsoluteFill>
      <AbsoluteFill style={{ filter: fgFilter }}>
        <WorldSvg cam={cam} filter={`url(#rim-${tod})`}>
          {behind}
          <Bench w={STOP.benchW} x={STOP.benchX} y={STOP.seatY} scale={STOP.benchScale} memory={memoryDay} />
          {bqShown && !bqShown.front ? <Bouquet x={bqShown.x} y={bqShown.y} scale={bqShown.scale} rot={bqShown.rot} memory={bqShown.memory} missing={bouquetMissing} /> : null}
          {/* 长椅在地面上的影子 */}
          <ellipse cx={STOP.benchX} cy={STOP.seatY + 300} rx={560} ry={24} fill={memoryDay ? "#6d5a44" : "#10161b"} opacity={memoryDay ? 0.25 : 0.35} />
          {woman && !womanOnTop ? womanFig : null}
          {bqShown && bqShown.front === true ? <Bouquet x={bqShown.x} y={bqShown.y} scale={bqShown.scale} rot={bqShown.rot} memory={bqShown.memory} missing={bouquetMissing} /> : null}
          {extraFigures}
          {woman && womanOnTop ? womanFig : null}
          {hideMan || manOpacity <= 0.001 ? null : (
            <g transform={`translate(${manX},0) scale(${manScaleX},1) translate(${-manX},0)`}>
              <FigureFront pose={man} design={manDesign} x={manX} y={STOP.seatY - 8} scale={STOP.figScale} filter="url(#pencil)" opacity={manOpacity < 1 ? manOpacity : undefined} />
            </g>
          )}
          {bqShown && bqShown.front === "over" ? <Bouquet x={bqShown.x} y={bqShown.y} scale={bqShown.scale} rot={bqShown.rot} memory={bqShown.memory} missing={bouquetMissing} /> : null}
          {/* 握着花束的那只手再画一次，压在花茎上面（手指从上面握住） */}
          {bqShown && bqShown.front === "over" && bqShown.grip && !hideMan ? (
            <g transform={`translate(${manX},${STOP.seatY - 8}) scale(${STOP.figScale})`} opacity={manOpacity < 1 ? manOpacity : undefined}>
              <TShapes shapes={handOnlyShapes(man, manDesign, bqShown.grip)} line={manDesign.line} lw={manDesign.lw} filter="url(#pencil)" paint />
            </g>
          ) : null}
          {front}
        </WorldSvg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const secOf = (frame: number) => frame / FPS;
