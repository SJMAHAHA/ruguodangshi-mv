import React from "react";
import { Composition, Folder, Still } from "remotion";
import { Pilot } from "./Pilot";
import { CharacterSheet } from "./dev/CharacterSheet";
import { FullMV } from "./full/FullMV";
import { FULL_FRAMES } from "./full/timeline";
import { DURATION, FPS, HEIGHT, WIDTH } from "./config/timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="RuguoPilot" component={Pilot} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="RuguoFull" component={FullMV} durationInFrames={FULL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Folder name="dev">
        <Still id="CharacterSheet" component={CharacterSheet} width={WIDTH} height={HEIGHT} />
      </Folder>
    </>
  );
};
