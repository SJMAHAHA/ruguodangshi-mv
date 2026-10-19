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
};

/** 按顺序绘制 Shape 列表（填色与描线交替，保证前后遮挡正确） */
export const Shapes: React.FC<Props & { idBase?: string }> = ({ shapes, defaultLine, defaultLw, filter, opacity, transform, idBase = "c" }) => {
  return (
    <g filter={filter} opacity={opacity} transform={transform}>
      {shapes.map((s, i) => {
        if (!s) return null;
        const lineColor = s.line === undefined ? defaultLine : s.line;
        const cid = s.clip ? `${idBase}-${i}` : undefined;
        return (
          <g key={s.key ?? i} opacity={s.op} clipPath={cid ? `url(#${cid})` : undefined}>
            {cid ? (
              <clipPath id={cid}>
                <path d={s.clip} />
              </clipPath>
            ) : null}
            {s.fill ? <path d={s.d} fill={s.fill} /> : null}
            {lineColor ? (
              <path
                d={s.d}
                fill="none"
                stroke={lineColor}
                strokeWidth={s.lw ?? defaultLw}
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
