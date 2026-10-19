import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { FPS, LYRICS } from "../config/timeline";
import { C } from "../config/palette";

/** 思源宋体（Noto Serif SC）子集，只含本曲歌词用字，见 public/fonts。 */
export const SUB_FONT = "RuguoSerif";
loadFont({ family: SUB_FONT, url: staticFile("fonts/NotoSerifSC-Regular-subset.woff2"), weight: "400" });

/**
 * 单行、低调的字幕：画面下方居中，淡入淡出 0.25 s。
 * 位置固定在下方安全区，各镜头的人脸、手和花束都在它上方。
 */
export const Subtitles: React.FC<{ lyrics?: { text: string; in: number; out: number }[] }> = ({ lyrics = LYRICS }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cur = lyrics.find((l) => t >= l.in - 0.3 && t <= l.out + 0.3);
  if (!cur) return null;
  const op = interpolate(t, [cur.in - 0.12, cur.in + 0.18, cur.out - 0.12, cur.out + 0.18], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          marginBottom: 56,
          padding: "18px 90px",
          // 很淡的墨色晕底，保证在暖色回忆纸层上也能读清
          background: "radial-gradient(ellipse closest-side, rgba(12,16,22,0.5), rgba(12,16,22,0.28) 55%, rgba(12,16,22,0) 100%)",
          opacity: op,
        }}
      >
        <div
          style={{
            fontFamily: SUB_FONT,
            fontSize: 38,
            letterSpacing: "0.16em",
            color: C.warmPaper,
            opacity: 0.94,
            textShadow: "0 0 4px rgba(10,14,20,0.9), 0 0 12px rgba(10,14,20,0.6), 0 1px 2px rgba(10,14,20,0.95)",
            whiteSpace: "nowrap",
          }}
        >
          {cur.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
