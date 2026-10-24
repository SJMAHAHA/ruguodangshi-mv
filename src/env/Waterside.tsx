import React from "react";
import { C } from "../config/palette";
import { seededList, mulberry32 } from "../lib/random";
import { smoothClosed, smoothOpen, P } from "../lib/geom";
import { PLATE_RECT, RIVER_HORIZON, SvgImage } from "./Plate";
import { ASSETS } from "../config/assets";

/**
 * 副歌里的月下渡口：现代城市在对岸，近处是木栈桥、柳枝和一条小渡船。
 * 现实里的公交站长椅在这里延续成栈桥上的长椅。
 */

export const Defs: React.FC = () => (
  <defs>
    <linearGradient id="wsSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#141e2a" />
      <stop offset="0.56" stopColor="#243342" />
      <stop offset="1" stopColor="#3b4b57" />
    </linearGradient>
    <radialGradient id="moonHalo">
      <stop offset="0" stopColor="#efe6cf" stopOpacity={0.6} />
      <stop offset="0.25" stopColor="#d8d0b8" stopOpacity={0.26} />
      <stop offset="0.6" stopColor="#8f9a96" stopOpacity={0.07} />
      <stop offset="1" stopColor="#5a6a70" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="moonFace" cx="0.42" cy="0.4" r="0.65">
      <stop offset="0" stopColor="#f1e9d4" />
      <stop offset="0.7" stopColor="#e2d7bc" />
      <stop offset="1" stopColor="#cbbf9f" />
    </radialGradient>
    <linearGradient id="wsWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#34444f" />
      <stop offset="0.3" stopColor="#23313c" />
      <stop offset="1" stopColor="#18222b" />
    </linearGradient>
    <linearGradient id="wsHaze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6d7c80" stopOpacity={0} />
      <stop offset="1" stopColor="#6d7c80" stopOpacity={0.35} />
    </linearGradient>
    <radialGradient id="lanternGlow">
      <stop offset="0" stopColor="#e7c992" stopOpacity={0.9} />
      <stop offset="0.3" stopColor="#c5a275" stopOpacity={0.35} />
      <stop offset="1" stopColor="#c5a275" stopOpacity={0} />
    </radialGradient>
  </defs>
);

export const Sky: React.FC<{ y0: number; y1: number }> = ({ y0, y1 }) => {
  const stars = seededList(40, 88, (r) => ({ x: -300 + r() * 2500, y: y0 + r() * (y1 - y0) * 0.75, a: 0.2 + r() * 0.5, s: 0.8 + r() * 1.4 }));
  return (
    <g>
      <rect x={-600} y={y0} width={3200} height={y1 - y0} fill="url(#wsSky)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#d9d6c8" opacity={s.a} />
      ))}
    </g>
  );
};

export const Moon: React.FC<{ x: number; y: number; r: number; glow?: number }> = ({ x, y, r, glow = 1 }) => (
  <g>
    <circle cx={x} cy={y} r={r * 6} fill="url(#moonHalo)" opacity={glow} />
    <circle cx={x} cy={y} r={r} fill="url(#moonFace)" />
    <g opacity={0.16} fill="#9d9278">
      <path d={smoothClosed([[x - r * 0.45, y - r * 0.2], [x - r * 0.1, y - r * 0.38], [x + r * 0.05, y - r * 0.1], [x - r * 0.3, y + r * 0.08]])} />
      <path d={smoothClosed([[x + r * 0.15, y + r * 0.2], [x + r * 0.45, y + r * 0.1], [x + r * 0.5, y + r * 0.42], [x + r * 0.2, y + r * 0.5]])} />
      <circle cx={x - r * 0.25} cy={y + r * 0.42} r={r * 0.12} />
    </g>
    <circle cx={x} cy={y} r={r} fill="none" stroke="#b8ad91" strokeWidth={1.5} opacity={0.5} />
  </g>
);

/** 天际线上的楼（同一个种子永远得到同一排楼；背景板就是照着它画的） */
const skylineBuildings = (x0: number, x1: number, seed: number, scale = 1) => {
  const r = mulberry32(seed);
  const blds: { x: number; w: number; h: number; tone: string }[] = [];
  let x = x0;
  while (x < x1) {
    const w = (40 + r() * 90) * scale;
    const tall = r() < 0.18;
    const h = (tall ? 140 + r() * 120 : 40 + r() * 90) * scale;
    blds.push({ x, w, h, tone: r() < 0.5 ? "#1c2631" : "#212c38" });
    x += w + r() * 6 * scale;
  }
  return blds;
};

/** 对岸的现代城市天际线（轮廓 + 零星的暖色窗灯） */
export const Skyline: React.FC<{ base: number; x0: number; x1: number; seed: number; scale?: number }> = ({ base, x0, x1, seed, scale = 1 }) => {
  const blds = skylineBuildings(x0, x1, seed, scale);
  const wins = blds.flatMap((b, bi) => {
    const rr = mulberry32(seed * 13 + bi);
    const cols = Math.max(1, Math.floor(b.w / (12 * scale)));
    const rows = Math.max(1, Math.floor(b.h / (16 * scale)));
    const out: { x: number; y: number; a: number }[] = [];
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) if (rr() < 0.13) out.push({ x: b.x + 5 * scale + i * 12 * scale, y: base - b.h + 8 * scale + j * 16 * scale, a: 0.35 + rr() * 0.5 });
    return out;
  });
  return (
    <g>
      {blds.map((b, i) => (
        <rect key={i} x={b.x} y={base - b.h} width={b.w} height={b.h + 2} fill={b.tone} />
      ))}
      {wins.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width={4 * scale} height={6 * scale} fill={C.softGold} opacity={w.a} />
      ))}
      <rect x={x0} y={base - 70 * scale} width={x1 - x0} height={72 * scale} fill="url(#wsHaze)" />
    </g>
  );
};

/**
 * 月下河面的背景板：天空、对岸城市、水面（Seedream 按原来的天际线重绘，楼的位置一致）。
 * dawn：0 夜 → 1 黎明（两张背景板交叉淡化）。
 * scale / base：整张背景板缩放后让地平线落在 base（G3、G8 的地平线高度不同）。
 */
const riverTransform = (scale: number, base: number, cx: number) =>
  scale === 1 && base === RIVER_HORIZON ? undefined : `translate(${cx},${base}) scale(${scale}) translate(${-cx},${-RIVER_HORIZON})`;

export const RiverBackdrop: React.FC<{ dawn?: number; scale?: number; base?: number; cx?: number }> = ({ dawn = 0, scale = 1, base = RIVER_HORIZON, cx = 960 }) => {
  const tf = riverTransform(scale, base, cx);
  return (
    <g>
      {dawn < 0.999 ? <SvgImage src="plates/river_night.jpg" rect={PLATE_RECT.river} transform={tf} /> : null}
      {dawn > 0.001 ? <SvgImage src="plates/river_dawn.jpg" rect={PLATE_RECT.river} transform={tf} opacity={dawn} /> : null}
    </g>
  );
};

/**
 * 天际线以上的天空区域（clipPath）。月亮画在背景板上面，用它裁掉被楼挡住的部分，
 * 这样月亮落进城市（H1）、大月亮压在楼后面（G3）时，楼仍在月亮前面。
 */
export const RiverSkyClip: React.FC<{ id: string; scale?: number; base?: number; cx?: number }> = ({ id, scale = 1, base = RIVER_HORIZON, cx = 960 }) => {
  const R = PLATE_RECT.river;
  const blds = skylineBuildings(R.x, R.x + R.w, 7);
  const pts: P[] = [[R.x, R.y]];
  for (const b of blds) pts.push([b.x, RIVER_HORIZON], [b.x, RIVER_HORIZON - b.h], [b.x + b.w, RIVER_HORIZON - b.h], [b.x + b.w, RIVER_HORIZON]);
  pts.push([R.x + R.w, RIVER_HORIZON], [R.x + R.w, R.y]);
  return (
    <defs>
      <clipPath id={id}>
        <path d={`M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}Z`} transform={riverTransform(scale, base, cx)} />
      </clipPath>
    </defs>
  );
};

/** 水面：底色 + 横向细波纹 + 月亮倒影（倒影碎光随时间闪动，纯时间函数）。bare：只画月亮倒影（底色和波纹由背景板提供） */
export const Water: React.FC<{ y0: number; y1: number; moonX: number; t: number; reflW?: number; seed?: number; bare?: boolean }> = ({ y0, y1, moonX, t, reflW = 70, seed = 4, bare = false }) => {
  const waves = seededList(70, seed, (r) => ({ x: -400 + r() * 2800, y: y0 + Math.pow(r(), 1.4) * (y1 - y0), w: 30 + r() * 140, a: 0.05 + r() * 0.1, sp: 4 + r() * 10 }));
  const glints = seededList(46, seed + 1, (r) => ({ k: r(), dx: (r() - 0.5) * 2, w: 0.3 + r() * 0.9, ph: r() * 6.28, sp: 1.5 + r() * 2.5 }));
  return (
    <g>
      {bare ? null : <rect x={-600} y={y0} width={3200} height={y1 - y0} fill="url(#wsWater)" />}
      {(bare ? [] : waves).map((w, i) => {
        const persp = 0.4 + (0.6 * (w.y - y0)) / (y1 - y0);
        return <line key={i} x1={w.x + t * w.sp} y1={w.y} x2={w.x + t * w.sp + w.w * persp} y2={w.y} stroke="#7d8d93" strokeWidth={1.2 + persp} opacity={w.a} strokeLinecap="round" />;
      })}
      {/* 月亮倒影：越近越宽、越碎 */}
      {glints.map((g, i) => {
        const y = y0 + 6 + Math.pow(g.k, 1.25) * (y1 - y0) * 0.8;
        const persp = 0.35 + (0.9 * (y - y0)) / (y1 - y0);
        const shimmer = 0.5 + 0.5 * Math.sin(t * g.sp + g.ph);
        const w = reflW * g.w * persp * (0.6 + 0.4 * shimmer);
        const x = moonX + g.dx * reflW * 0.5 * persp + Math.sin(t * 0.8 + g.ph) * 4;
        return <line key={`g${i}`} x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke="#e7dfc7" strokeWidth={2 + persp * 2} opacity={(0.25 + 0.45 * shimmer) * (1 - g.k * 0.5)} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** 柳枝（古典意象）：从画面上缘垂下，随风轻摆 */
export const Willow: React.FC<{ x: number; y: number; t: number; scale?: number; seed?: number }> = ({ x, y, t, scale = 1, seed = 3 }) => {
  const branches = seededList(16, seed, (r) => ({ ox: (r() - 0.2) * 420, len: 380 + r() * 520, ph: r() * 6.28, w: 2 + r() * 2.5 }));
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {branches.map((b, i) => {
        const sway = Math.sin(t * 0.9 + b.ph) * 16;
        const pts: P[] = [
          [b.ox, -20],
          [b.ox + 10 + sway * 0.2, b.len * 0.3],
          [b.ox + 18 + sway * 0.6, b.len * 0.65],
          [b.ox + 22 + sway, b.len],
        ];
        const leaves = seededList(Math.floor(b.len / 22), seed * 10 + i, (r) => ({ k: 0.15 + r() * 0.85, side: r() < 0.5 ? -1 : 1, a: 0.5 + r() * 0.5 }));
        return (
          <g key={i}>
            <path d={smoothOpen(pts)} fill="none" stroke="#1b2428" strokeWidth={b.w} strokeLinecap="round" />
            {leaves.map((l, j) => {
              const k = l.k;
              const px = b.ox + 22 * k + sway * Math.pow(k, 1.5);
              const py = b.len * k;
              return <path key={j} d={`M${px},${py} q${l.side * 13},5 ${l.side * 6},26 q${-l.side * 9},-8 ${-l.side * 6},-26Z`} fill="#33443d" opacity={l.a} />;
            })}
          </g>
        );
      })}
    </g>
  );
};

/** 栈桥（渡口）：近宽远窄的木板 + 桩，末端一根挂灯笼的木柱 */
export const Jetty: React.FC<{ near: [number, number, number]; far: [number, number, number]; t: number; lit?: number }> = ({ near, far, t, lit = 1 }) => {
  const [nx0, nx1, ny] = near;
  const [fx0, fx1, fy] = far;
  const lanternSwing = Math.sin(t * 1.3) * 2;
  // 标准位置的栈桥（S4、C2、G1、G5、H1）有水粉贴图；末端木柱和灯笼仍由代码画
  const painted = ASSETS.jettyFar && nx0 === 690 && nx1 === 1250 && ny === 1262 && fx0 === 886 && fx1 === 1050 && fy === 650;
  return (
    <g>
      {painted ? <SvgImage src="plates/jetty_far.png" rect={JETTY_FAR_RECT} /> : <JettyDeck near={near} far={far} />}
      {/* 末端木柱与灯笼 */}
      <g>
        <rect x={fx1 - 10} y={fy - 120} width={8} height={124} fill="#1b2025" stroke={C.graphite} strokeWidth={1.5} />
        <path d={`M${fx1 - 6},${fy - 116} l26,0`} stroke="#1b2025" strokeWidth={4} />
        <circle cx={fx1 + 18 + lanternSwing} cy={fy - 96} r={70} fill="url(#lanternGlow)" opacity={0.6 * lit} />
        <ellipse cx={fx1 + 18 + lanternSwing} cy={fy - 96} rx={8} ry={11} fill={lit > 0.5 ? "#d6b27a" : "#8a7a62"} stroke={C.graphite} strokeWidth={1.2} />
        <line x1={fx1 + 18} y1={fy - 116} x2={fx1 + 18 + lanternSwing} y2={fy - 107} stroke="#1b2025" strokeWidth={1.2} />
      </g>
    </g>
  );
};

/** 远景栈桥贴图的世界坐标范围 */
export const JETTY_FAR_RECT = { x: 640, y: 630, w: 660, h: 790 };

/** 原来的 SVG 桥面和木桩（贴图的参考底稿） */
const JettyDeck: React.FC<{ near: [number, number, number]; far: [number, number, number] }> = ({ near, far }) => {
  const [nx0, nx1, ny] = near;
  const [fx0, fx1, fy] = far;
  const planks = 26;
  const lines = Array.from({ length: planks }, (_, i) => {
    const k = Math.pow(i / planks, 1.8);
    const y = fy + (ny - fy) * k;
    const x0 = fx0 + (nx0 - fx0) * k;
    const x1 = fx1 + (nx1 - fx1) * k;
    return { y, x0, x1, k };
  });
  return (
    <g>
      {/* 桩 */}
      {[0.08, 0.3, 0.6, 1].map((k, i) => {
        const y = fy + (ny - fy) * k;
        const x0 = fx0 + (nx0 - fx0) * k;
        const x1 = fx1 + (nx1 - fx1) * k;
        const w = 6 + 20 * k;
        const h = 30 + 120 * k;
        return (
          <g key={i}>
            <rect x={x0 - w * 0.4} y={y - 4} width={w} height={h} fill="#151c22" />
            <rect x={x1 - w * 0.6} y={y - 4} width={w} height={h} fill="#151c22" />
          </g>
        );
      })}
      <path d={`M${fx0},${fy} L${fx1},${fy} L${nx1},${ny} L${nx0},${ny} Z`} fill="#3a3a35" stroke={C.graphite} strokeWidth={2} />
      {lines.map((l, i) => (
        <line key={i} x1={l.x0} y1={l.y} x2={l.x1} y2={l.y} stroke="#24282a" strokeWidth={1 + l.k * 3} opacity={0.8} />
      ))}
      {/* 受月光的一侧边沿 */}
      <path d={`M${fx1},${fy} L${nx1},${ny}`} stroke="#8e8f82" strokeWidth={3} opacity={0.5} />
    </g>
  );
};

/** 小渡船（系在栈桥边，随水轻轻起伏） */
export const Boat: React.FC<{ x: number; y: number; scale: number; t: number }> = ({ x, y, scale, t }) => {
  const bob = Math.sin(t * 1.1) * 2;
  const tilt = Math.sin(t * 0.9 + 1) * 1.2;
  return (
    <g transform={`translate(${x},${y + bob}) rotate(${tilt}) scale(${scale})`}>
      <path d="M-120,-10 Q-60,26 0,28 Q70,26 130,-14 L110,-4 Q50,10 0,10 Q-60,8 -104,-4 Z" fill="#2a2724" stroke={C.graphite} strokeWidth={2} />
      <path d="M-104,-4 Q-60,8 0,10 Q50,10 110,-4" fill="none" stroke="#6b665c" strokeWidth={2} opacity={0.7} />
      {/* 船篷 */}
      <path d="M-40,8 Q-34,-40 10,-44 Q52,-40 58,8 Z" fill="#232628" stroke={C.graphite} strokeWidth={2} />
      <path d="M-30,0 Q-26,-30 10,-34 Q46,-30 50,0" fill="none" stroke="#4d5150" strokeWidth={1.6} opacity={0.7} />
      {/* 倒影 */}
      <path d="M-110,30 Q0,48 120,26" fill="none" stroke="#5a676b" strokeWidth={3} opacity={0.25} />
    </g>
  );
};

/** 长椅背面（世界坐标，原点在座面中心，w 为宽） */
export const BenchBack: React.FC<{ x: number; y: number; w: number; scale: number; memory?: boolean; part?: "legs" | "back" }> = ({ x, y, w, scale, part }) => {
  const wood = "#5c5e57";
  const woodLit = "#7a7c72";
  const metal = "#22292f";
  const hw = w / 2;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {part !== "back" && (
        <g>
          {[-hw + 40, hw - 40].map((px) => (
            <g key={px}>
              <rect x={px - 7} y={-4} width={14} height={240} fill={metal} stroke={C.graphite} strokeWidth={2} />
              <rect x={px - 30} y={230} width={60} height={10} rx={4} fill={metal} stroke={C.graphite} strokeWidth={2} />
            </g>
          ))}
          <rect x={-hw - 6} y={-10} width={w + 12} height={20} rx={5} fill="#3d3f3a" stroke={C.graphite} strokeWidth={2} />
        </g>
      )}
      {part !== "legs" && (
        <g>
          {[-hw + 40, hw - 40].map((px) => (
            <rect key={px} x={px - 7} y={-262} width={14} height={262} fill={metal} stroke={C.graphite} strokeWidth={2} />
          ))}
          {[-250, -198].map((sy) => (
            <g key={sy}>
              <rect x={-hw} y={sy} width={w} height={34} rx={6} fill={wood} stroke={C.graphite} strokeWidth={2.2} />
              <rect x={-hw} y={sy} width={w} height={7} rx={4} fill={woodLit} opacity={0.75} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};
