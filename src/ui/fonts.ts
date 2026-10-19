import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** 手写体（霞鹜文楷子集）：本子、雾玻璃上的字、飘过耳边的诗句 */
export const HAND_FONT = "RuguoHand";
/** 书页印刷体（思源宋体子集） */
export const BOOK_FONT = "RuguoSerif";

loadFont({ family: HAND_FONT, url: staticFile("fonts/LXGWWenKai-Regular-subset.woff2"), weight: "400" });
