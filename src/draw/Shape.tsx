import React from "react";

/** 一个绘制单元：先填色，再按需描铅笔线。 */
export type Shape = {
  d: string;
  fill?: string;
  /** 描线颜色；null 表示不描线 */
  line?: string | null;
  lw?: number;
  op?: number;
  lineOp?: number;
  cap?: "round" | "butt";
  key?: string;
  /** 只在这个轮廓内显示（同一坐标系的 path） */
  clip?: string;
};

export const S = (d: string, fill?: string, line: string | null = null, lw?: number, op?: number): Shape => ({
  d,
  fill,
  line,
  lw,
  op,
});

/** 纯线条 */
export const L = (d: string, line: string, lw: number, lineOp = 1): Shape => ({ d, line, lw, lineOp });

type Props = {
  shapes: (Shape | null | false | undefined)[];
  defaultLine: string;
  defaultLw: number;
  filter?: string;
  opacity?: number;
  transform?: string;
  /**
   * 水粉描法（人物用）：有填色的形状不再描统一的石墨线，而是描「这块颜色加深」的线，
   * 再沿边缘加一道宽而淡的同色晕（水彩干时颜料往色块边缘聚的效果）。只有线条的形状（五官、衣褶）不变。
   */
  paint?: boolean;
};

const INK = [16, 20, 26];
const hexRgb = (c: string): number[] | null => {
  const m = /^#([0-9a-f]{6})$/i.exec(c);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** 把颜色往墨色方向混 k（0..1） */
const deepen = (c: string, k: number) => {
  const rgb = hexRgb(c);
  if (!rgb) return null;
  const v = rgb.map((x, i) => Math.round(x + (INK[i] - x) * k));
  return `rgb(${v[0]},${v[1]},${v[2]})`;
};

/** 按顺序绘制 Shape 列表（填色与描线交替，保证前后遮挡正确） */
export const Shapes: React.FC<Props & { idBase?: string }> = ({ shapes, defaultLine, defaultLw, filter, opacity, transform, idBase = "c", paint = false }) => {
  return (
    <g filter={filter} opacity={opacity} transform={transform}>
      {shapes.map((s, i) => {
        if (!s) return null;
        let lineColor = s.line === undefined ? defaultLine : s.line;
        const cid = s.clip ? `${idBase}-${i}` : undefined;
        const lw = s.lw ?? defaultLw;
        // 水粉描法：轮廓线用本色加深，外加一道宽而淡的边缘晕
        const edge = paint && s.fill && lineColor === defaultLine ? deepen(s.fill, 0.42) : null;
        if (paint && s.fill && lineColor === defaultLine) lineColor = deepen(s.fill, 0.66) ?? lineColor;
        return (
          <g key={s.key ?? i} opacity={s.op} clipPath={cid ? `url(#${cid})` : undefined}>
            {cid ? (
              <clipPath id={cid}>
                <path d={s.clip} />
              </clipPath>
            ) : null}
            {s.fill ? <path d={s.d} fill={s.fill} /> : null}
            {edge ? (
              // 只留在形状内侧（溢到外面会在深色的邻居上显出一圈亮边）
              <g clipPath={`url(#${idBase}-e${i})`}>
                <clipPath id={`${idBase}-e${i}`}>
                  <path d={s.d} />
                </clipPath>
                <path d={s.d} fill="none" stroke={edge} strokeWidth={lw * 4.6} strokeLinejoin="round" opacity={0.2} />
              </g>
            ) : null}
            {lineColor ? (
              <path
                d={s.d}
                fill="none"
                stroke={lineColor}
                strokeWidth={edge ? lw * 0.86 : lw}
                strokeLinecap={s.cap ?? "round"}
                strokeLinejoin="round"
                opacity={s.lineOp ?? 0.92}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};
