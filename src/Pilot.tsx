import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { SHOTS } from "./config/timeline";
import { S1Glass } from "./shots/S1Glass";
import { S2Leaving } from "./shots/S2Leaving";
import { S3Memory } from "./shots/S3Memory";
import { S4Waterside } from "./shots/S4Waterside";
import { S5EmptySeat } from "./shots/S5EmptySeat";
import { PaperOverlay } from "./draw/Paper";
import { Subtitles } from "./ui/Subtitles";

const len = (s: { from: number; to: number }) => s.to - s.from;

/** 试片的 5 个镜头（不含音轨、字幕、纸纹），完整版也直接复用 */
export const PilotShots: React.FC = () => (
  <AbsoluteFill style={{ background: "#18212c" }}>
    <Sequence from={SHOTS.s1.from} durationInFrames={len(SHOTS.s1)} name="S1 雨夜·玻璃后">
        <S1Glass />
      </Sequence>
      <Sequence from={SHOTS.s2.from} durationInFrames={len(SHOTS.s2)} name="S2 手先松开">
        <S2Leaving />
      </Sequence>
      <Sequence from={SHOTS.s3.from} durationInFrames={len(SHOTS.s3)} name="S3 两层纸">
        <S3Memory />
      </Sequence>
      <Sequence from={SHOTS.s4.from} durationInFrames={len(SHOTS.s4)} name="S4 红雨·渡口">
        <S4Waterside />
      </Sequence>
      <Sequence from={SHOTS.s5.from} durationInFrames={len(SHOTS.s5)} name="S5 留下的位置">
        <S5EmptySeat />
      </Sequence>
  </AbsoluteFill>
);

/** 全片：5 个镜头按实测乐句排列，原曲切片作为唯一音轨。 */
export const Pilot: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#18212c" }}>
      <PilotShots />
      {/* 暗角与纸纹：不随镜头运动，像画在同一张纸上 */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(8,12,18,0.42) 100%)", pointerEvents: "none" }} />
      <PaperOverlay opacity={0.85} />
      <Subtitles />
      <Audio src={staticFile("audio/ruguodangshi_067290-097290.wav")} />
    </AbsoluteFill>
  );
};
