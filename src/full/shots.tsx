import React from "react";
import { AbsoluteFill } from "remotion";
import { ShotId } from "./timeline";
import * as Act1 from "./acts/Act1";
import * as Act2 from "./acts/Act2";
import * as Act4 from "./acts/Act4";
import * as Act5 from "./acts/Act5";
import * as Act6 from "./acts/Act6";
import * as Act7 from "./acts/Act7";
import * as Act8 from "./acts/Act8";
import * as Act9 from "./acts/Act9";
import * as Act10 from "./acts/Act10";
import * as Act11 from "./acts/Act11";

const Todo: React.FC<{ id: string }> = ({ id }) => (
  <AbsoluteFill style={{ background: "#243241", color: "#ddd3bd", fontSize: 80, justifyContent: "center", alignItems: "center" }}>{id}</AbsoluteFill>
);
const T = (id: string) => () => <Todo id={id} />;

const IMPL: Partial<Record<ShotId, React.FC>> = { ...Act1, ...Act2, ...Act4, ...Act5, ...Act6, ...Act7, ...Act8, ...Act9, ...Act10, ...Act11 };

/** 完整版镜头表（试片段 P 单独嵌入） */
export const SHOTS_FULL: { id: ShotId; C: React.FC; pre?: number }[] = (
  ["A1", "A2", "A3", "A4", "A5", "A6", "B1", "B2", "B3", "B4", "B5", "C1", "C2", "C3", "D1", "D2", "E1", "E2", "E3", "E4", "F1", "F2", "F3", "F4", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "H1", "H2", "J1", "J2", "J3", "J4", "K1", "K2"] as ShotId[]
).map((id) => ({ id, C: IMPL[id] ?? T(id) }));
