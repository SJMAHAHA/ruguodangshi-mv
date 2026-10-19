import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { HEIGHT, WIDTH } from "../config/timeline";

/**
 * 由 Remotion 当前帧驱动的 Canvas 2D 层。
 * draw 必须是纯函数：只依赖 frame 和固定种子，不保存跨帧状态，
 * 因此任意顺序、任意并发渲染同一帧都会得到同一画面。
 */
export const FxCanvas: React.FC<{
  draw: (ctx: CanvasRenderingContext2D, frame: number) => void;
  style?: React.CSSProperties;
  /** 画布分辨率比例（雨丝等可以用 1，模糊层可以更低） */
  ratio?: number;
}> = ({ draw, style, ratio = 1 }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();
    ctx.scale(ratio, ratio);
    draw(ctx, frame);
    ctx.restore();
  }, [frame, draw, ratio]);
  return (
    <canvas
      ref={ref}
      width={Math.round(WIDTH * ratio)}
      height={Math.round(HEIGHT * ratio)}
      style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT, ...style }}
    />
  );
};
