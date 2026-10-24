import React from "react";
import { AbsoluteFill } from "remotion";
import { AlleyBackdrop, Tod } from "../env/Alley";
import { PencilDefs } from "../draw/Defs";
import { PLATE_RECT, RIVER_HORIZON } from "../env/Plate";
import { Defs as WsDefs, Sky, Skyline, Water } from "../env/Waterside";
import { JettyFrontStatic } from "../full/acts/Act8";
import { BenchSvg, BENCH_SPRITE } from "../props/Bench";
import { FigureFront, FRONT_NEUTRAL, TShapes } from "../characters/front";
import { MAN_MEM, WOMAN_MEM } from "../characters/designs";
import { headShapes } from "../characters/head";
import { C } from "../config/palette";
import { Bouquet } from "../props/Bouquet";
import { ShelterFrame } from "../env/Alley";
import { PencilHand } from "../props/PencilHand";
import { PointHandSvg } from "../props/PointHand";
import { ReachHandSvg, PhoneHandSvg, PENCIL_RECT, POINT_RECT, REACH_RECT, PHONE_SPRITE_RECT, WRITE_RECT, WRITE_REF_ANGLE } from "../props/Hands";
import { ShutterWallSvg, SHUTTER_RECT, D1_RECT, D1_TILES } from "../full/acts/Act5";
import { SunStreetSvg, E1_RECT } from "../full/acts/Act6";
import { AlleyStripWall, AlleyStripGround } from "../env/AlleyStrip";
import { Rect } from "../env/Plate";

/**
 * 背景板参考图：把原来的 SVG 场景按世界坐标完整画出来，交给 Seedream 按同一构图重绘。
 * 输出图的像素坐标 = 世界坐标 - 原点，所以生成的背景板可以原样贴回世界坐标。
 */
export { PLATE_RECT };
export type PlateRefProps = { tod: Tod; lamp: number };

export const AlleyPlateRef: React.FC<PlateRefProps> = ({ tod, lamp }) => {
  const r = PLATE_RECT.alley;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={r.w} height={r.h} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        <PencilDefs />
        <AlleyBackdrop tod={tod} lampGlow={lamp} />
      </svg>
    </AbsoluteFill>
  );
};

/** 月下河面的参考底稿：天空、对岸城市、水面（不画月亮、倒影、栈桥，这些仍由代码画） */
export const RiverPlateRef: React.FC = () => {
  const r = PLATE_RECT.river;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={r.w} height={r.h} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        <PencilDefs />
        <WsDefs />
        <rect x={r.x} y={r.y} width={r.w} height={RIVER_HORIZON - r.y} fill="url(#wsSky)" />
        <rect x={r.x} y={RIVER_HORIZON - 2} width={r.w} height={r.y + r.h - RIVER_HORIZON + 2} fill="url(#wsWater)" />
        <Sky y0={r.y} y1={RIVER_HORIZON} />
        <g filter="url(#pencil-soft)">
          <Skyline base={RIVER_HORIZON} x0={r.x} x1={r.x + r.w} seed={7} />
        </g>
        <Water y0={RIVER_HORIZON - 2} y1={r.y + r.h} moonX={-9000} t={0} reflW={0} />
        <rect x={r.x} y={RIVER_HORIZON - 42} width={r.w} height={80} fill="#8b989a" opacity={0.16} filter="url(#soft-blur-20)" />
      </svg>
    </AbsoluteFill>
  );
};

/** 栈桥正面的参考底稿（不画灯笼、长椅、人物） */
export const JettyPlateRef: React.FC = () => {
  const r = PLATE_RECT.jetty;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={r.w} height={r.h} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        <PencilDefs />
        <WsDefs />
        <JettyFrontStatic />
      </svg>
    </AbsoluteFill>
  );
};

/** 长椅的参考底稿：纯绿底，Seedream 重绘后抠掉绿色得到带透明通道的长椅 */
export const BenchPlateRef: React.FC<{ memory: boolean }> = ({ memory }) => {
  const r = BENCH_SPRITE;
  return (
    <AbsoluteFill style={{ background: "#00ff00" }}>
      <svg width={r.w * 2} height={r.h * 2} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        <BenchSvg w={900} x={0} y={0} scale={1} memory={memory} />
      </svg>
    </AbsoluteFill>
  );
};

/** 锁屏合影的参考底稿（与 A5 原来的合影同一构图，不画锁屏时间） */
export const PhotoPlateRef: React.FC = () => (
  <AbsoluteFill style={{ background: "#d9cdb2" }}>
    <svg width={880} height={1680} viewBox="-220 -420 440 840">
      <PencilDefs />
      <rect x={-220} y={-420} width={440} height={840} fill="#d9cdb2" />
      <rect x={-220} y={-420} width={440} height={430} fill="#c9c3ac" />
      <g transform="translate(0,40) scale(0.42)">
        <rect x={-600} y={180} width={1200} height={600} fill="#b7a88a" />
        <BenchSvg w={900} x={0} y={160} scale={1} memory />
        <FigureFront
          pose={{ ...FRONT_NEUTRAL, head: { turn: -0.3, pitch: 0.18, eyeOpen: 0.3, gaze: -0.2, brow: 0, mouth: 0.8 }, headTilt: -14, headOffset: [-30, 22], lean: -7, bodyTurn: -0.25, legSlant: -0.4, handL: { at: [-30, -60], fore: 0.5 }, handR: { at: [34, -58], fore: 0.5 } }}
          design={WOMAN_MEM}
          x={150}
          y={152}
          scale={1.1}
        />
        <FigureFront
          pose={{ ...FRONT_NEUTRAL, head: { turn: 0.38, pitch: 0.08, eyeOpen: 0.75, gaze: 0.4, brow: 0, mouth: 0.6 }, bodyTurn: 0.2, handL: { at: [-34, -40], fore: 0.5, angle: 18 }, handR: { at: [90, -40], fore: 0.6 } }}
          design={MAN_MEM}
          x={-130}
          y={152}
          scale={1.1}
        />
      </g>
    </svg>
  </AbsoluteFill>
);

/** C1 她的脸（回忆配色）的参考底稿：纯黑底 */
export const FacePlateRef: React.FC = () => {
  const hs = headShapes({ turn: -0.08, pitch: -0.12, eyeOpen: 0.95, gaze: 0.05, brow: 0.05, mouth: 0.5 }, { ...WOMAN_MEM.look, light: -1 });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={1600} height={1600} viewBox="-200 -200 400 400">
        <g transform="translate(0,-10) scale(1.9)">
          <TShapes shapes={[...hs.back, ...hs.front]} line={C.memSepia} lw={1.2} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** 一块世界坐标范围的参考底稿（D1、D2、E1 用） */
const RectRef: React.FC<{ r: Rect; bg: string; children: React.ReactNode }> = ({ r, bg, children }) => (
  <AbsoluteFill style={{ background: bg }}>
    <svg width={r.w} height={r.h} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
      <PencilDefs />
      {children}
    </svg>
  </AbsoluteFill>
);
export const D1PlateRef: React.FC = () => (
  <RectRef r={D1_RECT} bg="#151c22">
    <g filter="url(#pencil-soft)">
      <AlleyStripWall lamp={1} />
    </g>
    <AlleyStripGround lamp={1} />
  </RectRef>
);
export const D2PlateRef: React.FC = () => (
  <RectRef r={SHUTTER_RECT} bg="#151c22">
    <ShutterWallSvg />
  </RectRef>
);
export const E1PlateRef: React.FC = () => (
  <RectRef r={E1_RECT} bg="#d8c7a1">
    <SunStreetSvg />
  </RectRef>
);

/** 近景里的手：照原来的 SVG 手（同样的配色）画在纯绿底上，放大 2 倍 */
export type HandKind = "pencil-her" | "pencil-him" | "point-her" | "point-him" | "reach-him" | "write-her" | "write-him";
export const HAND_REF_RECT: Record<HandKind, Rect> = {
  "pencil-her": PENCIL_RECT,
  "pencil-him": PENCIL_RECT,
  "point-her": POINT_RECT,
  "point-him": POINT_RECT,
  "reach-him": REACH_RECT,
  "write-her": WRITE_RECT.her,
  "write-him": WRITE_RECT.him,
};
export const HandPlateRef: React.FC<{ kind: HandKind }> = ({ kind }) => {
  const r = HAND_REF_RECT[kind];
  return (
    <AbsoluteFill style={{ background: "#00ff00" }}>
      <svg width={r.w * 2} height={r.h * 2} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        {kind === "pencil-her" ? <PencilHand x={0} y={0} skin="#e6c9ad" sleeve="#e6c98f" line={C.memSepia} /> : null}
        {kind === "pencil-him" ? <PencilHand x={0} y={0} skin="#e1c3a6" sleeve="#efe7d4" line={C.memSepia} /> : null}
        {kind === "point-her" ? <PointHandSvg skin={WOMAN_MEM.look.skin} skinShade={WOMAN_MEM.look.skinShade} sleeve={WOMAN_MEM.coat} line={WOMAN_MEM.line} /> : null}
        {kind === "point-him" ? <PointHandSvg skin={MAN_MEM.look.skin} skinShade={MAN_MEM.look.skinShade} sleeve={MAN_MEM.coat} line={MAN_MEM.line} /> : null}
        {kind === "reach-him" ? <ReachHandSvg /> : null}
        {/* B3 写字的新构图：右手从画面下方伸进来（她从右下，他从左下） */}
        {kind === "write-her" ? <PencilHand x={0} y={0} angle={WRITE_REF_ANGLE.her} skin="#e6c9ad" sleeve="#e6c98f" line={C.memSepia} /> : null}
        {kind === "write-him" ? <PencilHand x={0} y={0} angle={WRITE_REF_ANGLE.him} skin="#e1c3a6" sleeve="#efe7d4" line={C.memSepia} flip /> : null}
      </svg>
    </AbsoluteFill>
  );
};

/** A5 握手机的手：手机画出黑色边框，屏幕和背景都是纯绿（抠掉后剩下手和手机边框） */
export const PhoneHandPlateRef: React.FC<{ thumb: number }> = ({ thumb }) => {
  const r = PHONE_SPRITE_RECT;
  return (
    <AbsoluteFill style={{ background: "#00ff00" }}>
      <svg width={r.w * 2} height={r.h * 2} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        <PhoneHandSvg part="back" thumb={thumb} skin={C.skin} skinShade={C.skinShade} line={C.graphite} />
        <rect x={-230} y={-450} width={460} height={900} rx={55} fill="#1a1e23" stroke={C.graphite} strokeWidth={2.5} />
        <rect x={-209.3} y={-429.3} width={418.6} height={858.6} rx={44} fill="#00ff00" />
        <rect x={229} y={-198} width={4} height={90} rx={2} fill="#2a3036" />
        <PhoneHandSvg part="front" thumb={thumb} skin={C.skin} skinShade={C.skinShade} line={C.graphite} />
      </svg>
    </AbsoluteFill>
  );
};

/** 花束（第二批素材）：局部坐标 x -140..160、y -120..30，原点 = 花束和座面的接触点；放大 4 倍 */
export const BOUQUET_REF_RECT: Rect = { x: -140, y: -120, w: 300, h: 150 };
export const BouquetPlateRef: React.FC<{ memory: boolean; missing: number }> = ({ memory, missing }) => {
  const r = BOUQUET_REF_RECT;
  return (
    <AbsoluteFill style={{ background: "#00ff00" }}>
      <svg width={r.w * 4} height={r.h * 4} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        <PencilDefs />
        <Bouquet x={0} y={0} scale={1} memory={memory} missing={missing} />
      </svg>
    </AbsoluteFill>
  );
};

/** 远景的木栈桥（第二批素材）：世界坐标 x 640..1300、y 630..1420；只要桥面和木桩（末端木柱和灯笼仍由代码画） */
export const JETTY_FAR_RECT: Rect = { x: 640, y: 630, w: 660, h: 790 };
export const JettyFarPlateRef: React.FC = () => {
  const r = JETTY_FAR_RECT;
  const [nx0, nx1, ny] = [690, 1250, 1262];
  const [fx0, fx1, fy] = [886, 1050, 650];
  return (
    <AbsoluteFill style={{ background: "#00ff00" }}>
      <svg width={r.w * 2} height={r.h * 2} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        {[0.08, 0.3, 0.6, 1].map((k, i) => {
          const y = fy + (ny - fy) * k;
          const x0 = fx0 + (nx0 - fx0) * k;
          const x1 = fx1 + (nx1 - fx1) * k;
          const w = 6 + 20 * k;
          const h = 30 + 120 * k;
          return (
            <g key={i}>
              <rect x={x0 - w * 0.4} y={y - 4} width={w} height={h} fill="#151c22" />
              <rect x={x1 - w * 0.6} y={y - 4} width={w} height={h} fill="#151c22" />
            </g>
          );
        })}
        <path d={`M${fx0},${fy} L${fx1},${fy} L${nx1},${ny} L${nx0},${ny} Z`} fill="#3a3a35" stroke={C.graphite} strokeWidth={2} />
        {Array.from({ length: 26 }, (_, i) => {
          const k = Math.pow(i / 26, 1.8);
          return <line key={i} x1={fx0 + (nx0 - fx0) * k} y1={fy + (ny - fy) * k} x2={fx1 + (nx1 - fx1) * k} y2={fy + (ny - fy) * k} stroke="#24282a" strokeWidth={1 + k * 3} opacity={0.8} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** 公交站的地砖（第二批素材）：世界坐标 x -520..2440、y 852..1400 */
export const FLOOR_RECT: Rect = { x: -520, y: 852, w: 2960, h: 548 };
export const FloorPlateRef: React.FC = () => {
  const r = FLOOR_RECT;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={r.w} height={r.h} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        <ShelterFrame show={{ canopy: false, floor: true }} />
      </svg>
    </AbsoluteFill>
  );
};

/** D1 长卷的一段（分段重画用），放大 2 倍 */
export const D1TilePlateRef: React.FC<{ tile: 0 | 1 }> = ({ tile }) => {
  const r = D1_TILES[tile];
  return (
    <AbsoluteFill style={{ background: "#151c22" }}>
      <svg width={r.w * 2} height={r.h * 2} viewBox={`${r.x} ${r.y} ${r.w} ${r.h}`}>
        <PencilDefs />
        <g filter="url(#pencil-soft)">
          <AlleyStripWall lamp={1} />
        </g>
        <AlleyStripGround lamp={1} />
      </svg>
    </AbsoluteFill>
  );
};
