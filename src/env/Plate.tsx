import React from "react";
import { AbsoluteFill, Img, staticFile, delayRender, continueRender, cancelRender } from "remotion";
import { Cam, WorldSvg } from "../lib/camera";
import { HEIGHT, WIDTH } from "../config/timeline";
import { LAMP, type Tod } from "./Alley";

/**
 * Seedream 生成的背景板（public/plates/，生成任务见 scripts/plates.jobs.mjs）。
 * 每张图都按世界坐标的一块矩形生成：图片像素与世界坐标一一对应，所以能直接跟着镜头走，
 * 和原来的 SVG 道具、人物严格对齐。
 */
export type Rect = { x: number; y: number; w: number; h: number };

export const PLATE_RECT = {
  /** 公交站对面的旧街（与 AlleyBackdrop 同一范围） */
  alley: { x: -520, y: -320, w: 2960, h: 1720 },
  /** 月下河面：天空 + 对岸城市 + 水面（地平线 y=562，与 S4、C2、G1、G5、H1 的世界坐标一致） */
  river: { x: -900, y: -900, w: 4100, h: 2400 },
  /** 栈桥正面（G2、G4、G6、G7）：看向对岸老屋 */
  jetty: { x: -400, y: -200, w: 2800, h: 1700 },
} as const satisfies Record<string, Rect>;
export const RIVER_HORIZON = 562;

/** 世界坐标里的一张图，变换与 WorldSvg 完全相同（CSS 变换从左到右复合） */
export const WorldImg: React.FC<{ cam: Cam; src: string; rect: Rect; opacity?: number; filter?: string }> = ({ cam, src, rect, opacity = 1, filter }) =>
  opacity <= 0.001 ? null : (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: rect.w,
        height: rect.h,
        maxWidth: "none",
        transformOrigin: "0 0",
        transform: `translate(${WIDTH / 2}px,${HEIGHT / 2}px) rotate(${cam.rot ?? 0}deg) scale(${cam.scale}) translate(${-cam.x + rect.x}px,${-cam.y + rect.y}px)`,
        opacity,
        filter,
      }}
    />
  );

/** 每个时段的旧街背景板：[灯灭, 灯亮]。夜里只有亮灯版。 */
const ALLEY_PLATES: Record<Tod, { off: string; on: string }> = {
  night: { off: "plates/alley_night.jpg", on: "plates/alley_night.jpg" },
  dusk: { off: "plates/alley_dusk_off.jpg", on: "plates/alley_dusk_on.jpg" },
  dawn: { off: "plates/alley_dawn_off.jpg", on: "plates/alley_dawn_on.jpg" },
  day: { off: "plates/alley_day.jpg", on: "plates/alley_day.jpg" },
};

/**
 * 旧街背景板。lampGlow 在 0..1 之间时，在灯灭 / 灯亮两张图之间交叉淡化；
 * 大于 1（镜头推向路灯）时由 AlleyLampBoost 在上面再加光。
 */
export const AlleyPlate: React.FC<{ cam: Cam; tod: Tod; lampGlow: number }> = ({ cam, tod, lampGlow }) => {
  const p = ALLEY_PLATES[tod];
  const k = Math.max(0, Math.min(1, lampGlow));
  return (
    <AbsoluteFill>
      <WorldImg cam={cam} src={p.off} rect={PLATE_RECT.alley} />
      {p.on !== p.off ? <WorldImg cam={cam} src={p.on} rect={PLATE_RECT.alley} opacity={k} /> : null}
    </AbsoluteFill>
  );
};

/** 路灯额外的光晕（lampGlow > 1：S3、F4 镜头推向路灯时） */
export const LampBoost: React.FC<{ cam: Cam; k: number }> = ({ cam, k }) =>
  k <= 0.001 ? null : (
    <WorldSvg cam={cam} style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id="lampBoost">
          <stop offset="0" stopColor="#f2ecd8" stopOpacity={0.9} />
          <stop offset="0.15" stopColor="#ddd8c4" stopOpacity={0.45} />
          <stop offset="0.5" stopColor="#97a39b" stopOpacity={0.12} />
          <stop offset="1" stopColor="#6c7a76" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={LAMP.x} cy={LAMP.y + 8} r={LAMP.r * 9} fill="url(#lampBoost)" opacity={Math.min(1, k)} />
    </WorldSvg>
  );

/** 同一张图只解码一次：所有用到它的地方共用同一个 Promise */
const decoded = new Map<string, Promise<void>>();
const decodeOnce = (src: string) => {
  let p = decoded.get(src);
  if (!p) {
    const img = new Image();
    img.src = src;
    p = img.decode();
    decoded.set(src, p);
  }
  return p;
};

/**
 * SVG 里的背景板（需要和其他 SVG 图形交错叠放时用）。
 * SVG 的 <image> 不会让 Remotion 等它加载，这里先在页面里解码，解码完成之前不出帧。
 */
export const SvgImage: React.FC<{ src: string; rect: Rect; opacity?: number; transform?: string }> = ({ src, rect, opacity, transform }) => {
  const url = staticFile(src);
  // 偶发的加载超时（机器很忙时）：60 s 后自动重载页面重试，最多两次
  const [handle] = React.useState(() => delayRender(`背景板 ${src}`, { timeoutInMilliseconds: 60000, retries: 2 }));
  React.useEffect(() => {
    decodeOnce(url)
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [url, handle]);
  return <image href={url} x={rect.x} y={rect.y} width={rect.w} height={rect.h} preserveAspectRatio="none" opacity={opacity} transform={transform} />;
};
