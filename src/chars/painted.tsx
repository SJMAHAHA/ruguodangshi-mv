import React from "react";
import { Cam } from "../lib/camera";
import { Rect, SvgImage } from "../env/Plate";
import { blinkAt } from "../characters/life";

/**
 * 水粉人物（Codex 画，见 asset-requests/characters.md）的播放工具。
 *
 * 每个镜头的人物图都画在同一张画布上，画布就是出参考图时用的那个固定镜头（refCam）看到的范围，
 * 所以画布在世界坐标里的位置 = 那个镜头的取景框。镜头运动照旧由代码做。
 */
export const canvasRect = (c: Cam): Rect => ({ x: c.x - 960 / c.scale, y: c.y - 540 / c.scale, w: 1920 / c.scale, h: 1080 / c.scale });

/** 各试验镜头的画布（和 asset-requests/refs/chars/<镜头>/README.md 里的 refCam 一致） */
export const CHAR_CANVAS = {
  A3: canvasRect({ x: 910, y: 330, scale: 1.95 }),
  S2: canvasRect({ x: 985, y: 460, scale: 0.94 }),
} as const;

/** 关键张时间表：[开始时刻, 图名]。按时间取当前这一张，不插值（手绘动画的「一拍几」）。 */
export type Keys = readonly (readonly [number, string])[];
export const keyAt = (keys: Keys, t: number): string => {
  let cur = keys[0][1];
  for (const [at, name] of keys) {
    if (t >= at) cur = name;
    else break;
  }
  return cur;
};

/** 眨眼：闭合超过一半时换成闭眼图（只有睁眼 / 闭眼两张时，眨眼本来就是两三帧的事） */
export const blinkSrc = (open: string, closed: string | undefined, t: number, seed: number) => (closed && blinkAt(t, seed) > 0.5 ? closed : open);

/**
 * 一张人物层。dx/dy/rot 用来做呼吸、轻微晃动这类小动作（单位：世界坐标、度），
 * 旋转绕 pivot（世界坐标，比如脖子底端）进行。
 */
export const Cel: React.FC<{ src: string; rect: Rect; opacity?: number; dx?: number; dy?: number; rot?: number; pivot?: readonly [number, number] }> = ({
  src,
  rect,
  opacity,
  dx = 0,
  dy = 0,
  rot = 0,
  pivot,
}) => {
  const t = [dx || dy ? `translate(${dx},${dy})` : "", rot && pivot ? `rotate(${rot} ${pivot[0]} ${pivot[1]})` : ""].join(" ").trim();
  return <SvgImage src={src} rect={rect} opacity={opacity} transform={t || undefined} />;
};
