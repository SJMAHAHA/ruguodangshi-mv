import React from "react";
import { AbsoluteFill, Sequence, staticFile, Freeze } from "remotion";
import { Audio } from "@remotion/media";
import { PilotShots } from "../Pilot";
import { S1Glass } from "../shots/S1Glass";
import { PaperOverlay } from "../draw/Paper";
import { Subtitles } from "../ui/Subtitles";
import { FULL_LYRICS } from "./lyrics";
import { shot, ShotId, PILOT_AT } from "./timeline";
import { SHOTS_FULL } from "./shots";
import "../ui/fonts";

const Seq: React.FC<{ id: ShotId; children: React.ReactNode; pre?: number }> = ({ id, children, pre = 0 }) => {
  const s = shot(id);
  return (
    <Sequence from={s.from - pre} durationInFrames={s.dur + pre} name={id}>
      {children}
    </Sequence>
  );
};

/** 完整版：全曲 9427 帧。试片原样嵌在 2019–2919。 */
export const FullMV: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#18212c" }}>
      {/* B5 期间，回忆纸被雨浸透，下面先垫着试片 S1 的第一帧 */}
      <Sequence from={shot("B5").from} durationInFrames={shot("B5").dur} name="S1 underlay">
        <Freeze frame={0}>
          <S1Glass />
        </Freeze>
      </Sequence>
      {SHOTS_FULL.map(({ id, C, pre }) => (
        <Seq key={id} id={id} pre={pre}>
          <C />
        </Seq>
      ))}
      <Sequence from={PILOT_AT} durationInFrames={900} name="试片 S1–S5">
        <PilotShots />
      </Sequence>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(8,12,18,0.42) 100%)", pointerEvents: "none" }} />
      <PaperOverlay opacity={0.85} />
      <Subtitles lyrics={FULL_LYRICS} />
      <Audio src={staticFile("audio/ruguodangshi_full.wav")} />
    </AbsoluteFill>
  );
};
