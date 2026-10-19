import React from "react";
import { AbsoluteFill } from "remotion";
import { FigureFront, FRONT_NEUTRAL, FrontPose } from "../characters/front";
import { MAN, WOMAN, MAN_MEM, WOMAN_MEM } from "../characters/designs";
import { PencilDefs } from "../draw/Defs";
import { PaperOverlay } from "../draw/Paper";
import { Bench } from "../props/Bench";
import { C } from "../config/palette";

const pose = (o: Partial<FrontPose>): FrontPose => ({ ...FRONT_NEUTRAL, ...o, head: { ...FRONT_NEUTRAL.head, ...(o.head ?? {}) } });

/** 角色设定页：用来检查比例、五官、转头和配色 */
export const CharacterSheet: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.greyGreenDark }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <PencilDefs />
        <rect x={0} y={0} width={1100} height={1080} fill="#56615a" />
        <rect x={0} y={760} width={1100} height={320} fill="#38423e" />
        <Bench w={900} x={550} y={640} scale={1} />
        <FigureFront
          pose={pose({ head: { turn: 0.45, pitch: 0.25, eyeOpen: 0.75, gaze: 0.5, brow: 0.4, mouth: -0.2 }, handR: { at: [150, -8], fore: 0.8, angle: -6 } })}
          design={MAN}
          x={380}
          y={632}
          scale={1}
          filter="url(#pencil)"
        />
        <FigureFront
          pose={pose({ head: { turn: 0.55, pitch: -0.05, eyeOpen: 1, gaze: 0.7, brow: 0.1, mouth: -0.1 }, handL: { at: [-140, -8], fore: 0.8, angle: 6 }, handR: { at: [40, -40], fore: 0.6 }, legSlant: 1 })}
          design={WOMAN}
          x={720}
          y={632}
          scale={1}
          filter="url(#pencil)"
        />
        {/* 回忆配色 */}
        <rect x={1100} y={0} width={820} height={540} fill={C.warmPaper} />
        <Bench w={560} x={1510} y={470} scale={0.58} memory />
        <FigureFront pose={pose({ head: { turn: 0.5, pitch: 0, eyeOpen: 0.9, gaze: 0.5, brow: 0, mouth: 0.6 } })} design={MAN_MEM} x={1420} y={462} scale={0.58} filter="url(#pencil)" />
        <FigureFront
          pose={pose({ head: { turn: -0.3, pitch: 0.2, eyeOpen: 0.35, gaze: -0.2, brow: 0, mouth: 0.8 }, headTilt: -14, headOffset: [-30, 18], lean: -6, legSlant: -0.6 })}
          design={WOMAN_MEM}
          x={1585}
          y={462}
          scale={0.58}
          filter="url(#pencil)"
        />
        {/* 站起过程 */}
        {[0, 0.3, 0.6, 1].map((s, i) => (
          <FigureFront key={i} pose={pose({ stand: s, handL: { at: [-60, -20 - s * 250], fore: 0.6 }, handR: { at: [60, -20 - s * 250], fore: 0.6 } })} design={WOMAN} x={1220 + i * 190} y={880} scale={0.38} filter="url(#pencil)" />
        ))}
      </svg>
      <PaperOverlay />
    </AbsoluteFill>
  );
};
