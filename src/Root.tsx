import React from "react";
import { Composition, Folder, Still } from "remotion";
import { Pilot } from "./Pilot";
import { CharacterSheet } from "./dev/CharacterSheet";
import { AlleyPlateRef, RiverPlateRef, JettyPlateRef, BenchPlateRef, PhotoPlateRef, FacePlateRef, D1PlateRef, D2PlateRef, E1PlateRef, HandPlateRef, PhoneHandPlateRef, BouquetPlateRef, BOUQUET_REF_RECT, D1TilePlateRef, JettyFarPlateRef, JETTY_FAR_RECT, FloorPlateRef, FLOOR_RECT, HAND_REF_RECT, HandKind, PLATE_RECT } from "./dev/PlateRef";
import { D1_RECT, SHUTTER_RECT } from "./full/acts/Act5";
import { E1_RECT } from "./full/acts/Act6";
import { PHONE_SPRITE_RECT } from "./props/Hands";
import { BENCH_SPRITE } from "./props/Bench";
import { WalkTest } from "./dev/WalkTest";
import { FaceSheet } from "./dev/FaceSheet";
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
        <Still id="FaceSheet" component={FaceSheet} width={WIDTH} height={HEIGHT} />
        <Still id="WalkTest" component={WalkTest} width={WIDTH} height={HEIGHT} />
        <Still id="PlateRefRiver" component={RiverPlateRef} width={PLATE_RECT.river.w} height={PLATE_RECT.river.h} />
        <Still id="PlateRefJetty" component={JettyPlateRef} width={PLATE_RECT.jetty.w} height={PLATE_RECT.jetty.h} />
        <Still id="PlateRefBench" component={BenchPlateRef} width={BENCH_SPRITE.w * 2} height={BENCH_SPRITE.h * 2} defaultProps={{ memory: false }} />
        <Still id="PlateRefPhoto" component={PhotoPlateRef} width={880} height={1680} />
        <Still id="PlateRefFace" component={FacePlateRef} width={1600} height={1600} />
        <Still id="PlateRefD1" component={D1PlateRef} width={D1_RECT.w} height={D1_RECT.h} />
        <Still id="PlateRefD2" component={D2PlateRef} width={SHUTTER_RECT.w} height={SHUTTER_RECT.h} />
        <Still id="PlateRefE1" component={E1PlateRef} width={E1_RECT.w} height={E1_RECT.h} />
        {(Object.keys(HAND_REF_RECT) as HandKind[]).map((k) => (
          <Still key={k} id={`PlateRefHand-${k}`} component={() => <HandPlateRef kind={k} />} width={HAND_REF_RECT[k].w * 2} height={HAND_REF_RECT[k].h * 2} />
        ))}
        <Still id="PlateRefPhoneHand" component={PhoneHandPlateRef} width={PHONE_SPRITE_RECT.w * 2} height={PHONE_SPRITE_RECT.h * 2} defaultProps={{ thumb: 0 }} />
        <Still id="PlateRefBouquet" component={BouquetPlateRef} width={BOUQUET_REF_RECT.w * 4} height={BOUQUET_REF_RECT.h * 4} defaultProps={{ memory: false, missing: 0 }} />
        <Still id="PlateRefJettyFar" component={JettyFarPlateRef} width={JETTY_FAR_RECT.w * 2} height={JETTY_FAR_RECT.h * 2} />
        <Still id="PlateRefFloor" component={FloorPlateRef} width={FLOOR_RECT.w} height={FLOOR_RECT.h} />
        <Still id="PlateRefD1Tile" component={D1TilePlateRef} width={4800} height={1160} defaultProps={{ tile: 0 as 0 | 1 }} />
        <Still id="PlateRefAlley" component={AlleyPlateRef} width={PLATE_RECT.alley.w} height={PLATE_RECT.alley.h} defaultProps={{ tod: "night" as const, lamp: 1 }} />
      </Folder>
    </>
  );
};
