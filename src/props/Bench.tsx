import React from "react";
import { C } from "../config/palette";
import { SvgImage } from "../env/Plate";

/** 长椅贴图在局部坐标里的范围（w=900 时；座面前缘中心为原点） */
export const BENCH_SPRITE = { x: -480, y: -280, w: 960, h: 550 } as const;

type BenchProps = { w: number; x: number; y: number; scale: number; memory?: boolean; part?: "back" | "seat" | "all" };

/**
 * 公交站长椅。用 Seedream 照着下面的 SVG 长椅画的水粉贴图（public/plates/bench_*.png，已抠成透明底），
 * 尺寸、木条和立柱的位置与 SVG 版一致，人物的坐姿和手的位置不用改。
 * part：只画靠背（含立柱）或只画座面和腿，用于把人物夹在中间。
 */
export const Bench: React.FC<BenchProps> = ({ w, x, y, scale, memory, part = "all" }) => {
  const r = BENCH_SPRITE;
  const k = w / 900;
  const id = React.useId().replace(/:/g, "");
  const clip = part === "back" ? { y: r.y, h: -14 - r.y } : part === "seat" ? { y: -14, h: r.y + r.h + 14 } : null;
  return (
    <g transform={`translate(${x},${y}) scale(${scale * k},${scale})`}>
      {clip ? (
        <defs>
          <clipPath id={`bench-${id}`}>
            <rect x={r.x} y={clip.y} width={r.w} height={clip.h} />
          </clipPath>
        </defs>
      ) : null}
      <g clipPath={clip ? `url(#bench-${id})` : undefined}>
        <SvgImage src={memory ? "plates/bench_memory.png" : "plates/bench_night.png"} rect={r} />
      </g>
    </g>
  );
};

/** 原来的 SVG 长椅（贴图的参考底稿） */
export const BenchSvg: React.FC<BenchProps> = ({ w, x, y, scale, memory, part = "all" }) => {
  const wood = memory ? "#cdb38a" : "#5f625a";
  const woodLit = memory ? "#e3cfa6" : "#767a70";
  const woodShade = memory ? "#a88f69" : "#454841";
  const metal = memory ? "#8c7a63" : "#2c333a";
  const line = memory ? C.memSepia : C.graphite;
  const lw = 2.2;
  const hw = w / 2;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {part !== "seat" && (
        <g>
          {/* 靠背两根木条 */}
          <rect x={-hw} y={-250} width={w} height={34} rx={6} fill={wood} stroke={line} strokeWidth={lw} />
          <rect x={-hw} y={-250} width={w} height={8} rx={4} fill={woodLit} opacity={0.7} />
          <rect x={-hw} y={-198} width={w} height={34} rx={6} fill={wood} stroke={line} strokeWidth={lw} />
          <rect x={-hw} y={-198} width={w} height={8} rx={4} fill={woodLit} opacity={0.7} />
          {/* 立柱 */}
          {[-hw + 40, hw - 40].map((px) => (
            <rect key={px} x={px - 7} y={-262} width={14} height={262} fill={metal} stroke={line} strokeWidth={lw} />
          ))}
        </g>
      )}
      {part !== "back" && (
        <g>
          {/* 座面（正面看到的厚度） */}
          <rect x={-hw - 6} y={-14} width={w + 12} height={26} rx={6} fill={wood} stroke={line} strokeWidth={lw} />
          <rect x={-hw - 6} y={-14} width={w + 12} height={7} rx={4} fill={woodLit} opacity={0.8} />
          <rect x={-hw - 6} y={6} width={w + 12} height={6} rx={3} fill={woodShade} opacity={0.8} />
          {/* 腿 */}
          {[-hw + 40, hw - 40].map((px) => (
            <g key={px}>
              <rect x={px - 7} y={12} width={14} height={230} fill={metal} stroke={line} strokeWidth={lw} />
              <rect x={px - 30} y={236} width={60} height={10} rx={4} fill={metal} stroke={line} strokeWidth={lw} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};
