/** 全片色板。现实层偏冷，回忆层偏暖，暗红只给花、花瓣和关键节点。 */
export const C = {
  // 现实
  ink: "#243241", // 墨蓝
  inkDeep: "#18212c",
  inkSoft: "#33475a",
  greyGreen: "#697469", // 灰绿
  greyGreenDark: "#4b564f",
  greyGreenLight: "#8c968b",
  coolPaper: "#b4b8b2", // 冷纸灰
  coolPaperLight: "#cfd2cb",
  // 回忆
  warmPaper: "#ddd3bd", // 暖纸
  warmPaperDeep: "#cbbd9f",
  softGold: "#c5a275", // 柔金
  memSkin: "#e6c9ad",
  memSepia: "#7a5a43", // 回忆层铅笔线（棕褐）
  // 重点
  red: "#a75458", // 暗红
  redDeep: "#86393f",
  redLight: "#bf6d6f",
  // 线
  graphite: "#2b2f35",
  graphiteSoft: "#4a5058",
  // 皮肤（现实夜光下）
  skin: "#cdbdb0",
  skinShade: "#a8988d",
  skinLit: "#ddd1c6",
  hair: "#1a1e24",
  hairLit: "#3a4452",
} as const;

export type Palette = typeof C;
