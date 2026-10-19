import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

/** 全画面静态纸纹（乘法叠加），不随镜头运动，像画在同一张纸上。 */
export const PaperOverlay: React.FC<{ opacity?: number; memory?: boolean }> = ({ opacity = 0.9, memory }) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity }}>
    <Img src={staticFile(memory ? "textures/paper_memory.png" : "textures/paper_multiply.png")} style={{ width: "100%", height: "100%" }} />
  </AbsoluteFill>
);

/** 水粉底纹（柔光叠加），用于让大色块不那么平 */
export const GouacheOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.35 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "soft-light", opacity }}>
    <Img src={staticFile("textures/gouache_soft.png")} style={{ width: "100%", height: "100%" }} />
  </AbsoluteFill>
);
