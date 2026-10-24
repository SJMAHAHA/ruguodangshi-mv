import React from "react";
import { C } from "../config/palette";
import { smoothOpen, P } from "../lib/geom";
import { seededList } from "../lib/random";
import { ASSETS } from "../config/assets";
import { SvgImage } from "./Plate";

/**
 * 公交站对面的灰色旧街（世界坐标：S2 取景即 1920×1080 画面；
 * 为了 S1 拉远，范围扩到 x -520..2440, y -320..1400）。
 * 这里只画玻璃后面的街景和站台结构，雨与人物在别的层。
 */

export const LAMP = { x: 1530, y: 236, r: 34 } as const; // 路灯灯头（世界坐标）
const STREET_Y = 700; // 对面房子墙根

/** 一排瓦当（屋檐下缘的小半圆） */
const TileEdge: React.FC<{ x0: number; x1: number; y: number; seed: number }> = ({ x0, x1, y, seed }) => {
  const n = Math.ceil((x1 - x0) / 22);
  const items = seededList(n, seed, (r, i) => ({ x: x0 + i * 22, dy: r() * 2 }));
  return (
    <g>
      {items.map((t, i) => (
        <path key={i} d={`M${t.x},${y + t.dy} a11,9 0 0,0 22,0`} fill="#20272d" stroke="#3b4549" strokeWidth={1.2} />
      ))}
    </g>
  );
};

/** 坡屋顶：黛瓦，屋脊略翘 */
const Roof: React.FC<{ x: number; w: number; y: number; h: number; seed: number }> = ({ x, w, y, h, seed }) => {
  const rows = seededList(Math.ceil(w / 30), seed, (r, i) => ({ x: x + i * 30 + r() * 4, k: 0.8 + r() * 0.3 }));
  return (
    <g>
      <path d={`M${x - 30},${y} L${x + w + 30},${y} L${x + w + 8},${y - h} Q${x + w / 2},${y - h - 6} ${x - 8},${y - h} Z`} fill="#232a31" stroke={C.graphite} strokeWidth={2} />
      {/* 瓦垄 */}
      {rows.map((rw, i) => (
        <line key={i} x1={rw.x} y1={y - 2} x2={rw.x + 4} y2={y - h * rw.k} stroke="#39434a" strokeWidth={2} opacity={0.55} />
      ))}
      {/* 屋脊 */}
      <path d={`M${x - 14},${y - h} Q${x + w / 2},${y - h - 8} ${x + w + 14},${y - h} l10,-8 M${x - 14},${y - h} l-10,-8`} fill="none" stroke="#1a2026" strokeWidth={6} strokeLinecap="round" />
      <TileEdge x0={x - 28} x1={x + w + 28} y={y} seed={seed + 7} />
    </g>
  );
};

/** 抹灰墙面：底色 + 雨渍 + 墙根潮湿带 */
const Wall: React.FC<{ x: number; w: number; top: number; tone: string; seed: number }> = ({ x, w, top, tone, seed }) => {
  const stains = seededList(7, seed, (r) => ({ x: x + r() * w, y: top + 20 + r() * 160, w: 30 + r() * 120, h: 120 + r() * 260 }));
  return (
    <g>
      <rect x={x} y={top} width={w} height={STREET_Y - top} fill={tone} />
      {stains.map((s, i) => (
        <path key={i} d={`M${s.x},${s.y} q${s.w * 0.3},${s.h * 0.4} ${s.w * 0.1},${s.h} l${s.w * 0.4},0 q${-s.w * 0.1},${-s.h * 0.5} ${s.w * 0.4},${-s.h}`} fill="#2e3735" opacity={0.18} />
      ))}
      <rect x={x} y={STREET_Y - 70} width={w} height={70} fill="#2a3332" opacity={0.45} />
      <line x1={x} y1={STREET_Y - 70} x2={x + w} y2={STREET_Y - 70} stroke="#262e2e" strokeWidth={2} opacity={0.5} />
    </g>
  );
};

const Window: React.FC<{ x: number; y: number; w: number; h: number; lit?: number; shutters?: boolean }> = ({ x, y, w, h, lit = 0, shutters }) => (
  <g>
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} fill="#3b4543" />
    <rect x={x} y={y} width={w} height={h} fill={lit > 0 ? "#6f7569" : "#222a2f"} stroke={C.graphite} strokeWidth={2} />
    {lit > 0 ? <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} fill="#b4ad8c" opacity={0.32 * lit} /> : null}
    <path d={`M${x + w / 2},${y} v${h} M${x},${y + h * 0.5} h${w}`} stroke={C.graphite} strokeWidth={2.4} />
    {shutters ? (
      <g>
        <rect x={x - 6 - w * 0.42} y={y - 4} width={w * 0.42} height={h + 8} fill="#3f4a47" stroke={C.graphite} strokeWidth={1.6} />
        {Array.from({ length: Math.floor(h / 12) }, (_, i) => (
          <line key={i} x1={x - 4 - w * 0.42} y1={y + 4 + i * 12} x2={x - 8} y2={y + 4 + i * 12} stroke="#2b3332" strokeWidth={1.4} />
        ))}
      </g>
    ) : null}
    <rect x={x - 10} y={y + h + 6} width={w + 20} height={7} fill="#2f3836" />
  </g>
);

/** 时段：夜（默认）/ 黄昏 / 黎明 / 回忆里的白天 */
export type Tod = "night" | "dusk" | "dawn" | "day";

const SKY: Record<Tod, [string, string, string]> = {
  night: ["#121a23", "#1b2632", "#24313d"],
  dusk: ["#2a3644", "#4a5762", "#7c8079"],
  dawn: ["#43525f", "#7d8a90", "#b9b7a8"],
  day: ["#8d9894", "#b9bdb2", "#d8d3c2"],
};

export const AlleyBackdrop: React.FC<{ lampGlow?: number; tod?: Tod }> = ({ lampGlow = 1, tod = "night" }) => {
  const sky = SKY[tod];
  const winLit = tod === "night" || tod === "dusk" ? 1 : 0;
  return (
    <g>
      <defs>
        <linearGradient id={`sky-${tod}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="0.6" stopColor={sky[1]} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <radialGradient id="lampHalo">
          <stop offset="0" stopColor="#ece6d2" stopOpacity={0.95} />
          <stop offset="0.12" stopColor="#ddd8c4" stopOpacity={0.6} />
          <stop offset="0.45" stopColor="#97a39b" stopOpacity={0.16} />
          <stop offset="1" stopColor="#6c7a76" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="lampCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8d6c6" stopOpacity={0.26} />
          <stop offset="1" stopColor="#d8d6c6" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="street" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#262f34" />
          <stop offset="1" stopColor="#1c242a" />
        </linearGradient>
        <linearGradient id="laneDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2127" />
          <stop offset="1" stopColor="#252d31" />
        </linearGradient>
        <radialGradient id="haze" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#a8b2ab" stopOpacity={0.22} />
          <stop offset="1" stopColor="#a8b2ab" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* 夜空 */}
      <rect x={-520} y={-320} width={2960} height={700} fill={`url(#sky-${tod})`} />
      <g filter="url(#pencil-soft)">
        {/* 远处更高的楼影（现代城市在旧街后面） */}
        <path d="M-520,240 L-300,240 L-300,140 L-180,140 L-180,200 L60,200 L60,90 L150,90 L150,190 L1900,190 L1900,110 L2050,110 L2050,170 L2440,170 L2440,320 L-520,320 Z" fill="#1c252e" />
        {/* 房子 A */}
        <Wall x={-480} w={720} top={300} tone="#4b5652" seed={1} />
        <Roof x={-480} w={720} y={300} h={70} seed={11} />
        <Window x={-300} y={400} w={110} h={130} shutters />
        <Window x={20} y={400} w={110} h={130} lit={0.5 * winLit} />
        {/* 空调外机（现代细节） */}
        <rect x={150} y={420} width={66} height={44} fill="#5b6461" stroke={C.graphite} strokeWidth={1.8} />
        <circle cx={172} cy={442} r={13} fill="none" stroke={C.graphite} strokeWidth={1.4} />
        {/* 房子 B：木门 */}
        <Wall x={240} w={600} top={270} tone="#535e59" seed={2} />
        <Roof x={240} w={600} y={270} h={78} seed={12} />
        <Window x={300} y={380} w={96} h={118} />
        <rect x={560} y={450} width={150} height={250} fill="#2c2f30" stroke={C.graphite} strokeWidth={2.4} />
        <path d="M635,450 v250" stroke={C.graphite} strokeWidth={2} />
        <rect x={548} y={438} width={174} height={14} fill="#3a4240" />
        {/* 小巷入口（向远处延伸） */}
        <path d="M840,300 L1110,300 L1110,700 L840,700 Z" fill="url(#laneDark)" />
        <path d="M840,300 L940,380 L940,640 L840,700 Z" fill="#3a4441" />
        <path d="M1110,300 L1010,380 L1010,640 L1110,700 Z" fill="#323b39" />
        <path d="M940,640 L1010,640 L1110,700 L840,700 Z" fill="#283034" />
        <circle cx={975} cy={470} r={5} fill="#cfc9b1" opacity={0.8} />
        <circle cx={975} cy={470} r={34} fill="url(#haze)" />
        <path d="M940,380 L1010,380" stroke="#141a1f" strokeWidth={6} />
        {/* 房子 C：卷帘门小铺 */}
        <Wall x={1110} w={640} top={290} tone="#4f5a56" seed={3} />
        <Roof x={1110} w={640} y={290} h={72} seed={13} />
        <rect x={1180} y={500} width={300} height={200} fill="#5d6764" stroke={C.graphite} strokeWidth={2.2} />
        {Array.from({ length: 14 }, (_, i) => (
          <line key={i} x1={1182} y1={512 + i * 13.5} x2={1478} y2={512 + i * 13.5} stroke="#454f4c" strokeWidth={2} />
        ))}
        <rect x={1170} y={466} width={320} height={34} fill="#36403e" stroke={C.graphite} strokeWidth={2} />
        <Window x={1560} y={390} w={100} h={120} lit={0.25 * winLit} />
        {/* 房子 D */}
        <Wall x={1750} w={700} top={260} tone="#4a5451" seed={4} />
        <Roof x={1750} w={700} y={260} h={74} seed={14} />
        <Window x={1900} y={380} w={110} h={130} shutters />
        <Window x={2180} y={380} w={110} h={130} />
      </g>
      {/* 电线 */}
      <g fill="none" stroke="#0f151a" strokeWidth={2} opacity={0.75}>
        <path d={smoothOpen([[-520, 150], [300, 196], [1100, 176], [1900, 200], [2440, 168]])} />
        <path d={smoothOpen([[-520, 176], [420, 226], [1200, 210], [2440, 214]])} />
      </g>
      {/* 枯枝（参考片街巷里的树），从房子 A 后面伸出 */}
      <g fill="none" stroke="#141a20" strokeLinecap="round">
        <path d={smoothOpen([[120, 300], [150, 220], [140, 150], [176, 60]] as P[])} strokeWidth={10} />
        <path d={smoothOpen([[148, 226], [220, 190], [282, 186]] as P[])} strokeWidth={5} />
        <path d={smoothOpen([[143, 160], [90, 112], [58, 92]] as P[])} strokeWidth={4} />
        <path d={smoothOpen([[220, 192], [250, 150], [262, 118]] as P[])} strokeWidth={3} />
        <path d={smoothOpen([[160, 100], [208, 62], [248, 54]] as P[])} strokeWidth={3} />
      </g>
      {/* 街面（湿） */}
      <rect x={-520} y={STREET_Y} width={2960} height={700} fill="url(#street)" />
      {/* 对面房子在湿街面上的倒影 */}
      <g opacity={0.25}>
        <rect x={20} y={STREET_Y + 6} width={110} height={70} fill="#7c8070" opacity={0.5} />
        <rect x={1180} y={STREET_Y + 4} width={300} height={40} fill="#5d6764" opacity={0.5} />
      </g>
      {/* 路灯：灯杆 + 灯头 + 光锥 + 光晕 */}
      <g>
        <path d={`M${LAMP.x + 64},${STREET_Y + 60} L${LAMP.x + 64},${LAMP.y + 12} Q${LAMP.x + 62},${LAMP.y - 20} ${LAMP.x + 32},${LAMP.y - 18} L${LAMP.x},${LAMP.y - 14}`} fill="none" stroke="#161c22" strokeWidth={10} />
        <path d={`M${LAMP.x - 28},${LAMP.y - 16} L${LAMP.x + 24},${LAMP.y - 16} L${LAMP.x + 15},${LAMP.y + 4} L${LAMP.x - 19},${LAMP.y + 4} Z`} fill="#1b2127" stroke={C.graphite} strokeWidth={2} />
        <polygon points={`${LAMP.x - 16},${LAMP.y + 4} ${LAMP.x + 12},${LAMP.y + 4} ${LAMP.x + 230},${STREET_Y + 60} ${LAMP.x - 260},${STREET_Y + 60}`} fill="url(#lampCone)" opacity={0.75 * lampGlow} />
        <circle cx={LAMP.x} cy={LAMP.y + 8} r={LAMP.r * 8} fill="url(#lampHalo)" opacity={lampGlow} />
        <ellipse cx={LAMP.x - 2} cy={LAMP.y + 6} rx={17} ry={6} fill={lampGlow > 0.05 ? "#f4f0e2" : "#8c918a"} opacity={0.35 + 0.6 * Math.min(1, lampGlow)} />
        {/* 街面上的灯光倒影（拉长、带雨的模糊） */}
        <ellipse cx={LAMP.x - 6} cy={STREET_Y + 70} rx={60} ry={60} fill="#c9c8b6" opacity={0.1 * lampGlow} filter="url(#soft-blur-20)" />
      </g>
    </g>
  );
};

/** 站台结构：后挡玻璃、框架、顶棚、站台地面（世界坐标） */
export const ShelterFrame: React.FC<{ show: { canopy?: boolean; floor?: boolean }; floorLook?: "night" | "day" | "dusk" }> = ({ show, floorLook = "night" }) => {
  // 水粉地砖：夜里 / 黎明是雨后的湿地砖，回忆里是干燥的暖色地砖，黄昏（雨还没下）是干的阴天地砖
  const paintedFloor = ASSETS.floor && (floorLook !== "dusk" || ASSETS.floorDusk);
  const glassTop = 108;
  const glassBottom = 852;
  return (
    <g>
      <defs>
        <linearGradient id="glassTint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6c7f86" stopOpacity={0.18} />
          <stop offset="0.45" stopColor="#9fb0b1" stopOpacity={0.1} />
          <stop offset="0.55" stopColor="#c7d0cb" stopOpacity={0.14} />
          <stop offset="1" stopColor="#56676e" stopOpacity={0.24} />
        </linearGradient>
        <linearGradient id="floorWet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f383b" />
          <stop offset="1" stopColor="#1d252b" />
        </linearGradient>
        <linearGradient id="canopyUnder" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f141a" />
          <stop offset="1" stopColor="#1c242b" />
        </linearGradient>
      </defs>
      {/* 后挡玻璃的色调与斜向反光 */}
      <rect x={96} y={glassTop} width={1728} height={glassBottom - glassTop} fill="url(#glassTint)" />
      <polygon points={`420,${glassTop} 640,${glassTop} 260,${glassBottom} 40,${glassBottom}`} fill="#dfe6e0" opacity={0.045} />
      <polygon points={`1220,${glassTop} 1290,${glassTop} 910,${glassBottom} 840,${glassBottom}`} fill="#dfe6e0" opacity={0.035} />
      {/* 站台地面 */}
      {show.floor !== false && paintedFloor ? (
        // 水粉地砖（Codex 画的，见 asset-requests/）
        <SvgImage src={`plates/floor_${floorLook}.jpg`} rect={{ x: -520, y: glassBottom, w: 2960, h: 1400 - glassBottom }} />
      ) : null}
      {show.floor !== false && !paintedFloor && (
        <g>
          <polygon points={`-520,${glassBottom + 6} 2440,${glassBottom + 6} 2440,1400 -520,1400`} fill="url(#floorWet)" />
          <g stroke="#151b20" strokeWidth={2} opacity={0.45}>
            {Array.from({ length: 13 }, (_, i) => {
              const x = -300 + i * 210;
              return <line key={i} x1={x} y1={glassBottom + 6} x2={960 + (x - 960) * 1.9} y2={1400} />;
            })}
            <line x1={-520} y1={958} x2={2440} y2={958} />
            <line x1={-520} y1={1112} x2={2440} y2={1112} />
          </g>
          {/* 积水反光 */}
          <g filter="url(#soft-blur-20)">
            <ellipse cx={1500} cy={1000} rx={70} ry={130} fill="#cfd2c3" opacity={0.05} />
            <ellipse cx={420} cy={1020} rx={180} ry={30} fill="#9aa59e" opacity={0.05} />
          </g>
        </g>
      )}
      {/* 框架：立柱与横梁 */}
      <g fill="#20272e" stroke={C.graphite} strokeWidth={2}>
        <rect x={80} y={glassTop - 18} width={22} height={1100} />
        <rect x={1818} y={glassTop - 18} width={22} height={1100} />
        <rect x={80} y={glassBottom - 4} width={1760} height={14} />
        <rect x={80} y={glassTop - 18} width={1760} height={16} />
      </g>
      <line x1={1838} y1={glassTop} x2={1838} y2={1300} stroke="#7f8c88" strokeWidth={2} opacity={0.45} />
      {/* 顶棚：S2/S3 在棚下，只看到底面；S1 在外面，看到前缘 */}
      {show.canopy ? (
        <g>
          <path d={`M-200,${glassTop - 130} L2120,${glassTop - 130} L2120,${glassTop - 28} L-200,${glassTop - 28} Z`} fill="#141a20" stroke={C.graphite} strokeWidth={2} />
          <path d={`M-200,${glassTop - 32} L2120,${glassTop - 32}`} stroke="#5a6763" strokeWidth={3} opacity={0.55} />
        </g>
      ) : (
        <path d={`M-520,-320 L2440,-320 L2440,${glassTop - 22} L-520,${glassTop - 22} Z`} fill="url(#canopyUnder)" />
      )}
    </g>
  );
};
