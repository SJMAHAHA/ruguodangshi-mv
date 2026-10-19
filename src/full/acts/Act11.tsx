import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { BusStopWorld, STOP } from "../../env/BusStop";
import { FRONT_NEUTRAL } from "../../characters/front";
import { E, track, clamp } from "../../lib/anim";
import { Cam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { FxCanvas } from "../../fx/FxCanvas";
import { drawPetal } from "../../fx/petals";
import { C } from "../../config/palette";
import { BOUQUET_SEAT } from "./Act10";

/**
 * 尾声 K1–K2（4:54.95–5:14.23）
 * K1 空长椅与花束：第一班车的车灯从右边扫过，一片花瓣落在座位上；
 * K2 画面慢慢褪成纸上的铅笔稿，最后只剩纸。
 */

const GLASS = { at: [260, 220] as [number, number], glow: 1.2, lit: "236,226,204" };
const LAND: [number, number] = [1206, STOP.seatY - 6];

const lastPetal = (t: number) => {
  const t0 = 301.2;
  const t1 = 303.9;
  const k = clamp((t - t0) / (t1 - t0));
  const e = 1 - Math.pow(1 - k, 2.2);
  return {
    x: LAND[0] - 300 * (1 - e) + Math.sin(k * 7) * 26 * (1 - k),
    y: LAND[1] - 560 * (1 - e),
    rot: 0.5 + (1 - e) * 5.5,
    flip: k < 1 ? Math.cos(k * 9) * (1 - k) + 0.85 * k : 0.85,
    size: 19,
    color: "191,109,111",
    alpha: clamp((t - t0) * 3),
  };
};

/** 车灯：从画面右侧进来的冷白光，柔边扫过站台（世界坐标） */
const BusLight: React.FC<{ k: number; sweep: number }> = ({ k, sweep }) => {
  if (k <= 0.001) return null;
  const x = 2350 - sweep * 900;
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={k} filter="url(#soft-blur-60)">
      <ellipse cx={x} cy={640} rx={620} ry={520} fill="#dfe6e2" opacity={0.2} />
      <ellipse cx={x + 240} cy={780} rx={300} ry={240} fill="#eef2ec" opacity={0.22} />
    </g>
  );
};

const sceneAt = (t: number) => {
  const cam: Cam = { x: track(t, [[294.95, 1010], [306, 1060, E.drift], [314.23, 1070, E.drift]]), y: track(t, [[294.95, 550], [306, 575, E.drift]]), scale: track(t, [[294.95, 1.02], [306, 1.12, E.drift], [314.23, 1.14, E.drift]]) };
  return cam;
};

const EmptyBench: React.FC<{ t: number; cam: Cam; bus: number; sweep: number; drops?: number }> = ({ t, cam, bus, sweep, drops = 1 }) => {
  const drawPetalFx = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const s = cam.scale;
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 960 - cam.x * s, 540 - cam.y * s);
      const p = lastPetal(t);
      if (p.alpha > 0) drawPetal(ctx, p);
      ctx.restore();
    },
    [cam, t]
  );
  return (
    <AbsoluteFill>
      <BusStopWorld
        cam={cam}
        t={t}
        tod="dawn"
        man={FRONT_NEUTRAL}
        hideMan
        woman={null}
        bouquet={BOUQUET_SEAT}
        rain={0}
        lampGlow={0}
        glassDrops={drops}
        glassLight={GLASS}
        front={<BusLight k={bus} sweep={sweep} />}
      />
      <FxCanvas draw={drawPetalFx} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 1500px 900px at 120px 80px, rgba(236,214,176,0.36), rgba(236,214,176,0) 100%)", mixBlendMode: "screen" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 520px 380px at ${1920 + 120}px ${1080 * 0.74}px, rgba(236,240,234,${0.5 * bus}), rgba(210,220,216,${0.16 * bus}) 45%, rgba(0,0,0,0) 75%)`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

export const K1: React.FC = () => {
  const t = useSongT("K1");
  const cam = sceneAt(t);
  const bus = track(t, [[297.6, 0], [299.2, 1, E.in], [300.6, 1], [301.8, 0, E.out]]);
  const sweep = track(t, [[297.6, 0], [301.8, 1, E.drift]]);
  return <EmptyBench t={t} cam={cam} bus={bus} sweep={sweep} />;
};

/** 把渲染好的画面变成纸上的铅笔稿：灰度 → Sobel 边缘 → 反相成深色线 + 很淡的明暗 → 乘在纸色上 */
const SketchFilter: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="k2sketch" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="g" />
        <feConvolveMatrix in="g" order="3" kernelMatrix="-1 0 1 -2 0 2 -1 0 1" preserveAlpha="true" result="gx1" />
        <feConvolveMatrix in="g" order="3" kernelMatrix="1 0 -1 2 0 -2 1 0 -1" preserveAlpha="true" result="gx2" />
        <feConvolveMatrix in="g" order="3" kernelMatrix="-1 -2 -1 0 0 0 1 2 1" preserveAlpha="true" result="gy1" />
        <feConvolveMatrix in="g" order="3" kernelMatrix="1 2 1 0 0 0 -1 -2 -1" preserveAlpha="true" result="gy2" />
        <feComposite in="gx1" in2="gx2" operator="arithmetic" k2={1} k3={1} result="gx" />
        <feComposite in="gy1" in2="gy2" operator="arithmetic" k2={1} k3={1} result="gy" />
        <feComposite in="gx" in2="gy" operator="arithmetic" k2={1} k3={1} result="e" />
        <feColorMatrix in="e" type="matrix" values="-2.3 0 0 0 1  -2.3 0 0 0 1  -2.3 0 0 0 1  0 0 0 0 1" result="lines0" />
        {/* 线条最深只到石墨灰，不是纯黑 */}
        <feComponentTransfer in="lines0" result="lines">
          <feFuncR type="linear" slope={0.74} intercept={0.26} />
          <feFuncG type="linear" slope={0.73} intercept={0.27} />
          <feFuncB type="linear" slope={0.72} intercept={0.29} />
        </feComponentTransfer>
        <feColorMatrix in="g" type="matrix" values="0.42 0 0 0 0.66  0.42 0 0 0 0.66  0.42 0 0 0 0.66  0 0 0 0 1" result="tone" />
        <feBlend in="lines" in2="tone" mode="multiply" result="sk" />
        <feFlood floodColor="#e2d9c4" result="paper" />
        <feBlend in="sk" in2="paper" mode="multiply" />
      </filter>
    </defs>
  </svg>
);

export const K2: React.FC = () => {
  const t = useSongT("K2");
  const cam = sceneAt(t);
  const toSketch = track(t, [[306.2, 0], [309.4, 1, E.inOut]]);
  const toPaper = track(t, [[310.4, 0], [313.4, 1, E.inOut]]);
  return (
    <AbsoluteFill style={{ background: C.warmPaper }}>
      <SketchFilter />
      {/* 彩色画面 */}
      <AbsoluteFill style={{ opacity: 1 - toSketch }}>
        <EmptyBench t={t} cam={cam} bus={0} sweep={1} />
      </AbsoluteFill>
      {/* 铅笔稿：同一画面过一遍滤镜 */}
      <AbsoluteFill style={{ opacity: toSketch * (1 - toPaper), filter: "url(#k2sketch)" }}>
        <EmptyBench t={t} cam={cam} bus={0} sweep={1} drops={0.25} />
      </AbsoluteFill>
      {/* 纸（最后只剩纸） */}
      <AbsoluteFill style={{ opacity: toPaper, background: "#e2d9c4" }} />
    </AbsoluteFill>
  );
};
