import { C } from "../config/palette";
import { Design } from "./front";

/** 男主：短黑发、乱刘海、墨蓝大衣、灰毛衣、浅灰衬衫领 */
export const MAN: Design = {
  sex: "m",
  look: { sex: "m", skin: C.skin, skinShade: C.skinShade, hair: C.hair, hairLit: C.hairLit, line: C.graphite, lips: "#9c8079", light: 1 },
  coat: "#2d3d4f",
  coatShade: "#1f2a37",
  coatLit: "#3f5266",
  inner: "#7f8a84",
  collar: "#c3c8c0",
  legs: "#252e39",
  legsShade: "#1a222b",
  shoes: "#181c22",
  line: C.graphite,
  lw: 2.4,
};

/** 女主：及肩黑发、侧分刘海、冷灰风衣、灰绿毛衣 */
export const WOMAN: Design = {
  sex: "f",
  look: { sex: "f", skin: "#d3c4b8", skinShade: "#ab9c92", hair: C.hair, hairLit: C.hairLit, line: C.graphite, lips: "#9a6d6c", light: 1 },
  coat: "#a3a89f",
  coatShade: "#80867e",
  coatLit: "#babeb5",
  inner: "#5e6b63",
  collar: "#5e6b63",
  legs: "#3a414a",
  legsShade: "#2b3138",
  shoes: "#2a2f36",
  line: C.graphite,
  lw: 2.2,
};

/** 回忆层：同样的人，暖纸色、棕褐铅笔线 */
export const MAN_MEM: Design = {
  ...MAN,
  look: { ...MAN.look, skin: C.memSkin, skinShade: "#c9a587", hair: "#3b2c22", hairLit: "#6b5442", line: C.memSepia, lips: "#a8766b", blush: "#d99a83", light: -1 },
  coat: "#e9e0cc",
  coatShade: "#cdbf9f",
  coatLit: "#f3ecdc",
  inner: "#d9c7a0",
  collar: "#f4eedf",
  legs: "#8a7660",
  legsShade: "#6f5d4a",
  shoes: "#5b4a3b",
  line: C.memSepia,
};

export const WOMAN_MEM: Design = {
  ...WOMAN,
  look: { ...WOMAN.look, skin: C.memSkin, skinShade: "#c9a587", hair: "#3b2c22", hairLit: "#6b5442", line: C.memSepia, lips: "#b5675f", blush: "#e09a86", light: -1 },
  coat: "#e6c98f",
  coatShade: "#c9a86e",
  coatLit: "#f1dcae",
  inner: "#f0e4c8",
  collar: "#f0e4c8",
  legs: "#c7a98a",
  legsShade: "#a88c70",
  shoes: "#7b5f48",
  line: C.memSepia,
};
