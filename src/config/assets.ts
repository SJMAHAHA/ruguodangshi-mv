/**
 * Codex（image2.5）画的素材：放进 incoming/ 后运行 `python3 scripts/ingest-assets.py`，
 * 它会抠像 / 缩放到 public/plates/，然后把下面对应的开关改成 true。
 * 开关关着的时候，代码用原来的画法（SVG 或旧贴图）。需求和参考图见 asset-requests/README.md。
 */
export const ASSETS = {
  /** B3 / B4 写字的手（hand_write-her.png、hand_write-him.png） */
  writeHands: true,
  /** 长椅上的花束（bouquet_night.png、bouquet_memory.png） */
  bouquet: true,
  /** 远景伸进江面的木栈桥（jetty_far.png） */
  jettyFar: true,
  /** 公交站的地砖（floor_night.jpg、floor_day.jpg） */
  floor: true,
  /** 黄昏、雨还没下时的干地砖（floor_dusk.jpg）；没有时黄昏用原来的 SVG 地面 */
  floorDusk: true,
  /** D1 旧街长卷分两段重画（d1_strip-a.jpg、d1_strip-b.jpg），比一整张更清晰 */
  d1Tiles: true,
  /** 水粉人物（第五批，public/chars/<镜头>/）：按镜头逐个打开，关着的镜头仍用代码人物 */
  paintedA3: false,
  paintedS2: false,
} as const;
