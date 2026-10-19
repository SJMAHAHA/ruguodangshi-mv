import React from "react";
import { C } from "../config/palette";
import { mulberry32 } from "../lib/random";
import { smoothOpen } from "../lib/geom";

/**
 * 一条可以横移跟拍的旧街墙面（夜里雨停后）。坐标：地面 y=0，墙在上方（负值），x 向右延伸。
 * 只画到人的腰部以上一点，墙上有门、窗、卷帘门、水管、旧海报。
 */
export const STRIP_LEN = 8200;
export const SHUTTER_X = 6900; // 卷帘门中心（D1 结束时他停在这里）
export const LAMPS = [400, 1900, 3400, 4900, 6400, 7900];

type Seg = { x: number; w: number; tone: string; kind: "door" | "window" | "plain" | "pipe" | "shutter" };

const SEGS: Seg[] = (() => {
  const r = mulberry32(808);
  const out: Seg[] = [];
  let x = -600;
  const kinds: Seg["kind"][] = ["door", "window", "pipe", "window", "plain", "door", "window", "pipe"];
  let i = 0;
  while (x < STRIP_LEN + 800) {
    const w = 420 + r() * 380;
    const tone = ["#4b5652", "#535e59", "#4f5a56", "#4a5451", "#565f5a"][Math.floor(r() * 5)];
    let kind = kinds[i % kinds.length];
    if (x <= SHUTTER_X && x + w > SHUTTER_X - 200) kind = "shutter";
    out.push({ x, w: kind === "shutter" ? 760 : w, tone, kind });
    x += kind === "shutter" ? 760 : w;
    i++;
  }
  return out;
})();

export const AlleyStripWall: React.FC<{ lamp: number }> = ({ lamp }) => (
  <g>
    {SEGS.map((s, i) => (
      <g key={i}>
        <rect x={s.x} y={-1400} width={s.w + 1} height={1400} fill={s.tone} />
        {/* 雨渍 */}
        <path d={`M${s.x + s.w * 0.2},-1400 q${s.w * 0.1},300 0,620 l${s.w * 0.12},0 q-${s.w * 0.05},-320 ${s.w * 0.1},-620 Z`} fill="#2e3735" opacity={0.18} />
        {/* 墙根潮湿带 */}
        <rect x={s.x} y={-150} width={s.w + 1} height={150} fill="#29312f" opacity={0.5} />
        <line x1={s.x} y1={-150} x2={s.x + s.w} y2={-150} stroke="#232b2a" strokeWidth={3} opacity={0.6} />
        <line x1={s.x} y1={-1400} x2={s.x} y2={0} stroke="#2b3332" strokeWidth={4} opacity={0.5} />
        {/* 街边杂物：花盆、台阶、自行车、低处的旧告示 */}
        {i % 3 === 0 ? (
          <g>
            <path d={`M${s.x + s.w * 0.08},-2 l10,-70 l70,0 l10,70 Z`} fill="#4a3f38" stroke={C.graphite} strokeWidth={2.5} />
            <path d={smoothOpen([[s.x + s.w * 0.08 + 45, -70], [s.x + s.w * 0.08 + 20, -150], [s.x + s.w * 0.08 - 10, -180]])} stroke="#2f3a33" strokeWidth={8} fill="none" />
            <path d={smoothOpen([[s.x + s.w * 0.08 + 45, -70], [s.x + s.w * 0.08 + 60, -170], [s.x + s.w * 0.08 + 90, -200]])} stroke="#2f3a33" strokeWidth={8} fill="none" />
            <ellipse cx={s.x + s.w * 0.08 + 10} cy={-170} rx={34} ry={14} fill="#33413a" transform={`rotate(-30 ${s.x + s.w * 0.08 + 10} -170)`} />
            <ellipse cx={s.x + s.w * 0.08 + 84} cy={-190} rx={36} ry={14} fill="#33413a" transform={`rotate(25 ${s.x + s.w * 0.08 + 84} -190)`} />
          </g>
        ) : null}
        {i % 4 === 2 ? (
          <g stroke="#1b2126" strokeWidth={7} fill="none">
            <circle cx={s.x + s.w * 0.62} cy={-70} r={66} />
            <circle cx={s.x + s.w * 0.62 + 210} cy={-70} r={66} />
            <path d={`M${s.x + s.w * 0.62},-70 l70,-110 l110,0 l30,110 M${s.x + s.w * 0.62 + 70},-180 l40,110 l100,-110 M${s.x + s.w * 0.62 + 60},-200 l30,0 M${s.x + s.w * 0.62 + 170},-180 l10,-34 l30,0`} />
          </g>
        ) : null}
        {i % 3 === 1 ? <rect x={s.x + s.w * 0.15} y={-330} width={120} height={160} fill="#8a8676" opacity={0.3} transform={`rotate(2 ${s.x + s.w * 0.15} -330)`} /> : null}
        {s.kind === "door" ? (
          <g>
            <rect x={s.x + s.w * 0.3} y={-640} width={190} height={640} fill="#2c2f30" stroke={C.graphite} strokeWidth={3} />
            <line x1={s.x + s.w * 0.3 + 95} y1={-640} x2={s.x + s.w * 0.3 + 95} y2={0} stroke={C.graphite} strokeWidth={2.5} />
            <rect x={s.x + s.w * 0.3 - 16} y={-662} width={222} height={22} fill="#3a4240" />
            <rect x={s.x + s.w * 0.3 - 20} y={-30} width={230} height={30} fill="#3d4543" stroke={C.graphite} strokeWidth={2} />
          </g>
        ) : null}
        {s.kind === "window" ? (
          <g>
            <rect x={s.x + s.w * 0.25} y={-980} width={200} height={260} fill="#222a2f" stroke={C.graphite} strokeWidth={3} />
            <path d={`M${s.x + s.w * 0.25 + 100},-980 v260 M${s.x + s.w * 0.25},-850 h200`} stroke={C.graphite} strokeWidth={3} />
            <rect x={s.x + s.w * 0.25 - 14} y={-722} width={228} height={14} fill="#2f3836" />
            {/* 窗下的旧海报残片 */}
            <rect x={s.x + s.w * 0.55} y={-520} width={110} height={150} fill="#8d8a7c" opacity={0.35} transform={`rotate(-3 ${s.x + s.w * 0.55} -520)`} />
          </g>
        ) : null}
        {s.kind === "pipe" ? (
          <g>
            <rect x={s.x + s.w * 0.6} y={-1400} width={18} height={1380} fill="#3b4441" stroke={C.graphite} strokeWidth={2} />
            <path d={`M${s.x + s.w * 0.6},-30 q-10,24 -40,30`} stroke="#3b4441" strokeWidth={18} fill="none" />
            <rect x={s.x + s.w * 0.2} y={-560} width={92} height={60} fill="#5b6461" stroke={C.graphite} strokeWidth={2} />
          </g>
        ) : null}
        {s.kind === "shutter" ? (
          <g>
            <rect x={s.x + 60} y={-820} width={s.w - 120} height={820} fill="#5d6764" stroke={C.graphite} strokeWidth={3} />
            {Array.from({ length: 30 }, (_, k) => (
              <line key={k} x1={s.x + 62} y1={-800 + k * 27} x2={s.x + s.w - 62} y2={-800 + k * 27} stroke="#47514e" strokeWidth={3} />
            ))}
            <rect x={s.x + 40} y={-880} width={s.w - 80} height={64} fill="#36403e" stroke={C.graphite} strokeWidth={3} />
          </g>
        ) : null}
      </g>
    ))}
    {/* 路灯打在墙上的光斑 */}
    {LAMPS.map((lx, i) => (
      <ellipse key={i} cx={lx} cy={-520} rx={520} ry={560} fill="#c9c6b2" opacity={0.11 * lamp} filter="url(#soft-blur-60)" />
    ))}
  </g>
);

/** 湿地面：深色路面 + 墙面倒影 + 灯光的竖向倒影 */
export const AlleyStripGround: React.FC<{ lamp: number }> = ({ lamp }) => (
  <g>
    <rect x={-1000} y={0} width={STRIP_LEN + 2000} height={600} fill="#1e262c" />
    <g transform="scale(1,-0.55)" opacity={0.22} filter="url(#soft-blur-6)">
      <AlleyStripWall lamp={0} />
    </g>
    <rect x={-1000} y={0} width={STRIP_LEN + 2000} height={600} fill="#1b2329" opacity={0.55} />
    {LAMPS.map((lx, i) => (
      <ellipse key={i} cx={lx + 30} cy={150} rx={70} ry={190} fill="#d8d3bd" opacity={0.12 * lamp} filter="url(#soft-blur-20)" />
    ))}
    {/* 积水 */}
    {Array.from({ length: 22 }, (_, i) => {
      const r = mulberry32(3300 + i);
      const x = r() * STRIP_LEN;
      return <ellipse key={i} cx={x} cy={40 + r() * 140} rx={90 + r() * 160} ry={10 + r() * 14} fill="#3b4950" opacity={0.45} />;
    })}
    <line x1={-1000} y1={2} x2={STRIP_LEN + 1000} y2={2} stroke="#3a4448" strokeWidth={3} opacity={0.6} />
  </g>
);

/** 前景视差层：路灯杆（比墙移动得快，略虚） */
export const AlleyStripNear: React.FC<{ lamp: number }> = ({ lamp }) => (
  <g>
    {LAMPS.map((lx, i) => (
      <g key={i}>
        <rect x={lx - 16} y={-1600} width={32} height={1800} fill="#14191e" />
        <rect x={lx - 26} y={150} width={52} height={60} fill="#14191e" />
        <path d={smoothOpen([[lx + 12, -1400], [lx + 14, 200]])} stroke="#4c5658" strokeWidth={4} opacity={0.5 * lamp} />
      </g>
    ))}
  </g>
);
