import React from "react";
import { AbsoluteFill } from "remotion";
import { Design } from "../../characters/front";

/** 路灯光晕 / 月亮的白色泛光（F4 结尾与 G1 开头共用，保证切点处画面一致） */
export const Bloom: React.FC<{ k: number; x?: number; y?: number }> = ({ k, x = 960, y = 540 }) =>
  k <= 0.001 ? null : (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${x}px ${y}px, rgba(236,230,210,${0.95 * k}) 0px, rgba(214,214,198,${0.6 * k}) ${120 + k * 160}px, rgba(120,136,140,${0.35 * k}) ${420 + k * 300}px, rgba(20,28,36,0) 1100px)`,
        mixBlendMode: "screen",
      }}
    />
  );

/** 把人物所有颜色换成同一种（影子 / 剪影） */
export const silhouetteOf = (d: Design, c: string): Design => ({
  ...d,
  look: { ...d.look, skin: c, skinShade: c, hair: c, hairLit: c, line: c, lips: c, blush: undefined },
  coat: c,
  coatShade: c,
  coatLit: c,
  inner: c,
  collar: c,
  legs: c,
  legsShade: c,
  shoes: c,
  line: c,
});
