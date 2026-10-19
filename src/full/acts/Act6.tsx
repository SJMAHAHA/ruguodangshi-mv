import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { E, track, lerp, clamp } from "../../lib/anim";
import { Cam, WorldSvg } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { PencilDefs } from "../../draw/Defs";
import { WalkFigure } from "../../characters/walk";
import { MAN, MAN_MEM, WOMAN_MEM } from "../../characters/designs";
import { Design, FigureFront, FRONT_NEUTRAL, FrontPose } from "../../characters/front";
import { PointHand } from "../../props/PointHand";
import { FxCanvas } from "../../fx/FxCanvas";
import { drawGlass } from "../../fx/rain";
import { HAND_FONT } from "../../ui/fonts";
import { PaperOverlay } from "../../draw/Paper";
import { mulberry32 } from "../../lib/random";
import { P, smoothClosed, smoothOpen } from "../../lib/geom";
import { AlleyBackdrop, Tod } from "../../env/Alley";
import { TOD_GRADE } from "../../env/BusStop";

/**
 * 第六幕「回忆 2」E1–E4（2:22.4–2:48.45），以及 F1（雨水冲掉玻璃上的字）
 * E1 晴天的墙上，两人并肩走路的影子，影子之间连着一根耳机线；
 * E2/E3 下小雨的候车亭，她用手指在雾玻璃上写「执子之手」，他接着写「与子偕老」，玻璃里映出两人在笑；
 * E4 现在：他对着同一块玻璃呵气，雾里又显出当年的字；
 * F1 雨下起来，雨水顺着玻璃流下，雾和字一起被冲掉。
 */

// ---------------- E1 墙上的两道影子 ----------------
const shadowOf = (d: Design): Design => ({
  ...d,
  look: { ...d.look, skin: "#000", skinShade: "#000", hair: "#000", hairLit: "#000", line: "#000", lips: "#000", blush: undefined },
  coat: "#000",
  coatShade: "#000",
  coatLit: "#000",
  inner: "#000",
  collar: "#000",
  legs: "#000",
  legsShade: "#000",
  shoes: "#000",
  line: "#000",
});
const SH_M = shadowOf(MAN);
const SH_W = shadowOf(WOMAN_MEM);

/** 晴天的旧街墙面（暖灰泥墙、木窗、落水管、剥落处露出的砖）。坐标同 AlleyStrip：地面 y=0。 */
const SUN_SEGS = (() => {
  const r = mulberry32(919);
  const out: { x: number; w: number; tone: string; kind: number; seed: number }[] = [];
  let x = -1200;
  let i = 0;
  while (x < 6000) {
    const w = 520 + r() * 420;
    out.push({ x, w, tone: ["#dccaa5", "#d6c39d", "#e0d0ad", "#d2bf98"][Math.floor(r() * 4)], kind: [0, 1, 2, 1, 3][i % 5], seed: Math.floor(r() * 1e6) });
    x += w;
    i++;
  }
  return out;
})();

const SunWall: React.FC = () => (
  <g>
    {SUN_SEGS.map((s, i) => {
      const r = mulberry32(s.seed);
      return (
        <g key={i}>
          <rect x={s.x} y={-1500} width={s.w + 1} height={1500} fill={s.tone} />
          {/* 墙裙 */}
          <rect x={s.x} y={-170} width={s.w + 1} height={170} fill="#b9a47f" />
          <line x1={s.x} y1={-170} x2={s.x + s.w} y2={-170} stroke="#8d7a5c" strokeWidth={3} opacity={0.7} />
          <line x1={s.x} y1={-1500} x2={s.x} y2={0} stroke="#a8946f" strokeWidth={3} opacity={0.6} />
          {/* 剥落处露出的砖 */}
          {r() < 0.7 ? (
            <g transform={`translate(${s.x + s.w * (0.15 + r() * 0.5)},${-420 - r() * 500})`}>
              <path d={smoothClosed([[0, 0], [70, -14], [130, 6], [118, 60], [30, 72], [-14, 38]], 0.8)} fill="#c4a184" opacity={0.6} />
              {[0, 1, 2].map((k) => (
                <line key={k} x1={4} y1={14 + k * 20} x2={118} y2={14 + k * 20} stroke="#9a755a" strokeWidth={2} opacity={0.4} />
              ))}
            </g>
          ) : null}
          {s.kind === 1 ? (
            <g>
              {/* 木窗 + 半开的百叶 */}
              <rect x={s.x + s.w * 0.3} y={-1060} width={230} height={290} fill="#6f6250" stroke="#4b3f33" strokeWidth={4} />
              <path d={`M${s.x + s.w * 0.3 + 115},-1060 v290 M${s.x + s.w * 0.3},-915 h230`} stroke="#4b3f33" strokeWidth={4} />
              <rect x={s.x + s.w * 0.3 - 18} y={-770} width={266} height={16} fill="#a48d6b" />
              <rect x={s.x + s.w * 0.3 - 100} y={-1064} width={92} height={298} fill="#8b7354" stroke="#4b3f33" strokeWidth={3} />
              {Array.from({ length: 9 }, (_, k) => (
                <line key={k} x1={s.x + s.w * 0.3 - 96} y1={-1040 + k * 32} x2={s.x + s.w * 0.3 - 12} y2={-1040 + k * 32} stroke="#5d4a37" strokeWidth={3} />
              ))}
              {/* 窗台上的小盆栽 */}
              <path d={`M${s.x + s.w * 0.3 + 30},-770 l8,-40 l50,0 l8,40 Z`} fill="#a0644c" stroke="#5d4a37" strokeWidth={2} />
              <ellipse cx={s.x + s.w * 0.3 + 62} cy={-826} rx={44} ry={26} fill="#6f7b56" />
            </g>
          ) : null}
          {s.kind === 2 ? (
            <g>
              <rect x={s.x + s.w * 0.62} y={-1500} width={20} height={1480} fill="#b3a07e" stroke="#7e6c51" strokeWidth={2} />
              <path d={`M${s.x + s.w * 0.62},-30 q-10,24 -40,30`} stroke="#b3a07e" strokeWidth={20} fill="none" />
              {/* 旧门牌 */}
              <rect x={s.x + s.w * 0.2} y={-640} width={96} height={64} fill="#4e6b78" stroke="#2f4550" strokeWidth={2} />
              <rect x={s.x + s.w * 0.2 + 10} y={-630} width={76} height={44} fill="none" stroke="#dfe2d6" strokeWidth={2} opacity={0.7} />
            </g>
          ) : null}
          {s.kind === 3 ? (
            <g>
              <rect x={s.x + s.w * 0.25} y={-700} width={220} height={700} fill="#7a5f45" stroke="#4b3f33" strokeWidth={4} />
              <line x1={s.x + s.w * 0.25 + 110} y1={-700} x2={s.x + s.w * 0.25 + 110} y2={0} stroke="#4b3f33" strokeWidth={3} />
              <rect x={s.x + s.w * 0.25 - 20} y={-724} width={260} height={24} fill="#a48d6b" />
            </g>
          ) : null}
        </g>
      );
    })}
  </g>
);

/** 树叶的光斑影（缓慢晃动） */
const LeafDapple: React.FC<{ t: number; x0: number; x1: number }> = ({ t, x0, x1 }) => {
  const out: React.ReactNode[] = [];
  const r = mulberry32(5150);
  for (let i = 0; i < 90; i++) {
    const x = -800 + r() * 6400;
    const y = -1500 + r() * 520;
    if (x < x0 - 300 || x > x1 + 300) {
      r();
      r();
      continue;
    }
    const rx = 40 + r() * 90;
    const ph = r() * 6.28;
    out.push(<ellipse key={i} cx={x + Math.sin(t * 0.9 + ph) * 14} cy={y + Math.cos(t * 0.7 + ph) * 8} rx={rx} ry={rx * 0.55} fill="#5c4a35" />);
  }
  return <g opacity={0.2} filter="url(#soft-blur-6)">{out}</g>;
};

export const E1: React.FC = () => {
  const t = useSongT("E1");
  const SPEED_E = 280;
  const FIG_E = 0.62;
  const STEP_E = 108 * (FIG_E / 0.55);
  const d = (t - 142.4) * SPEED_E;
  const phase = (d / STEP_E) * Math.PI;
  const baseX = 1400 + d;
  const k = 1.0;
  const cam: Cam = { x: baseX + 40, y: -440, scale: k };
  // 她轻轻一跳（影子里看得出的小动作），耳机线跟着一甩
  const hop = Math.sin(clamp((t - 145.9) / 0.5) * Math.PI) * 46;
  const hopLag = Math.sin(clamp((t - 146.0) / 0.7) * Math.PI) * 30;
  const SHX = 170; // 影子投在墙上相对人的偏移（阳光从左后方来）
  const mx = baseX;
  const wx = baseX - 190;
  const bobM = -Math.abs(Math.cos(phase)) * 8;
  const bobW = -Math.abs(Math.cos(phase + 0.5)) * 8;
  const earM: P = [mx + 6 * FIG_E, (-986 + bobM) * FIG_E];
  const earW: P = [wx + 10 * FIG_E, (-914 + bobW) * FIG_E - hop];
  const sag = (-730 + hopLag) * FIG_E;
  return (
    <AbsoluteFill style={{ background: "#d8c7a1" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <g filter="url(#pencil-soft)">
          <SunWall />
        </g>
        <rect x={-2000} y={0} width={9000} height={800} fill="#c2ad88" />
        <rect x={-2000} y={0} width={9000} height={10} fill="#9a8664" opacity={0.6} />
        <LeafDapple t={t} x0={cam.x - 960} x1={cam.x + 960} />
        {/* 影子：同一种暖褐色，乘在墙上，边缘略虚 */}
        <g style={{ mixBlendMode: "multiply" }} opacity={0.4} filter="url(#soft-blur-6)">
          <g transform={`translate(${SHX},0) skewX(-16) scale(1,1.1)`}>
            <WalkFigure phase={phase + 0.5} design={SH_W} x={wx} y={-hop} scale={FIG_E * 0.97} />
            <WalkFigure phase={phase} design={SH_M} x={mx} y={0} scale={FIG_E} />
            <path d={`M${earM[0]},${earM[1]} C${earM[0] - 10},${sag} ${earW[0] + 30},${sag} ${earW[0]},${earW[1]}`} stroke="#000" strokeWidth={5} fill="none" />
          </g>
        </g>
      </WorldSvg>
      <AbsoluteFill style={{ mixBlendMode: "multiply", background: "radial-gradient(ellipse at 40% 40%, rgba(255,240,210,0) 40%, rgba(150,110,70,0.35) 100%)" }} />
      <PaperOverlay memory opacity={0.55} />
    </AbsoluteFill>
  );
};

// ---------------- 雾玻璃 ----------------
type GlassText = { text: string; x: number; y: number; size: number; t0: number; per: number };
const HER_TEXT: GlassText = { text: "执子之手", x: 420, y: 430, size: 150, t0: 149.25, per: 1.0 };
const HIS_TEXT: GlassText = { text: "与子偕老", x: 640, y: 690, size: 150, t0: 156.0, per: 0.9 };

const charReveal = (L: GlassText, i: number, t: number) => clamp((t - (L.t0 + i * L.per)) / (L.per * 0.85));
const penAt = (L: GlassText, t: number): [number, number] | null => {
  for (let i = 0; i < L.text.length; i++) {
    const r = charReveal(L, i, t);
    if (r > 0 && r < 1) {
      // 指尖在字里来回描画（从上到下、左右往返）
      const a = r * Math.PI * 5;
      return [L.x + i * L.size + L.size * (0.5 + 0.32 * Math.sin(a)), L.y - L.size * 0.85 + L.size * 0.9 * r];
    }
  }
  return null;
};

/** 写在雾上的字：作为遮罩，在雾里擦出清晰的笔画（逐字从上往下显出） */
const TextCut: React.FC<{ L: GlassText; t: number; all?: boolean; uid: string }> = ({ L, t, all, uid }) => (
  <g>
    {L.text.split("").map((ch, i) => {
      const r = all ? 1 : charReveal(L, i, t);
      if (r <= 0) return null;
      const x = L.x + i * L.size;
      return (
        <g key={i}>
          <clipPath id={`gt-${uid}-${i}`}>
            <rect x={x - 10} y={L.y - L.size * 1.05} width={L.size + 20} height={L.size * 1.3 * r} />
          </clipPath>
          <text x={x} y={L.y} fontFamily={HAND_FONT} fontSize={L.size} fill="#000" stroke="#000" strokeWidth={9} strokeLinejoin="round" clipPath={`url(#gt-${uid}-${i})`}>
            {ch}
          </text>
        </g>
      );
    })}
  </g>
);

type Streak = { pts: P[]; w: number };

const FogGlass: React.FC<{
  id: string;
  t: number;
  behind: React.ReactNode;
  fogColor: string;
  fog: number;
  breath?: { x: number; y: number; r: number; op: number } | null;
  texts: { L: GlassText; all?: boolean }[];
  textOpacity?: number;
  reflection?: React.ReactNode;
  front?: React.ReactNode;
  drops?: number;
  memory?: boolean;
  wash?: Streak[];
}> = ({ id, t, behind, fogColor, fog, breath, texts, textOpacity = 1, reflection, front, drops = 0, memory, wash = [] }) => {
  const drawDrops = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (drops <= 0.01) return;
      drawGlass(ctx, t, {
        seed: memory ? 13 : 17,
        beads: Math.round(160 * Math.min(drops, 1.5)),
        sliders: Math.round(46 * drops),
        amount: Math.min(1, drops * 1.2),
        lit: memory ? "250,240,220" : "220,228,224",
        glowAt: memory ? undefined : [1530 * 0.8, 240],
        glow: memory ? 0 : 0.6,
        sizeK: 1.8,
      });
    },
    [t, drops, memory]
  );
  return (
    <AbsoluteFill>
      {behind}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <filter id={`fogTex-${id}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves={3} seed={41} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.2 -0.25" result="spots" />
            <feComposite in="SourceGraphic" in2="spots" operator="in" />
          </filter>
          <filter id={`soft-${id}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={4} />
          </filter>
          <filter id={`wash-${id}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
          <radialGradient id={`breath-${id}`}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.6" stopColor="#fff" stopOpacity={0.92} />
            <stop offset="0.85" stopColor="#fff" stopOpacity={0.4} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id={`fogMask-${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
            {breath ? (
              <ellipse cx={breath.x} cy={breath.y} rx={breath.r} ry={breath.r * 0.72} fill={`url(#breath-${id})`} opacity={breath.op} />
            ) : (
              <rect width={1920} height={1080} fill="#fff" />
            )}
            <g filter={`url(#soft-${id})`} opacity={textOpacity}>
              {texts.map((x, i) => (
                <TextCut key={i} L={x.L} t={t} all={x.all} uid={`${id}-${i}`} />
              ))}
            </g>
            <g filter={`url(#wash-${id})`}>
              {wash.map((w, i) => (
                <path key={i} d={smoothOpen(w.pts)} stroke="#000" strokeWidth={w.w} strokeLinecap="round" fill="none" />
              ))}
            </g>
          </mask>
        </defs>
        {/* 雾：均匀的一层 + 斑驳的凝结水汽 */}
        <g mask={`url(#fogMask-${id})`} opacity={fog}>
          <rect width={1920} height={1080} fill={fogColor} opacity={0.6} />
          <rect width={1920} height={1080} fill={fogColor} opacity={0.35} filter={`url(#fogTex-${id})`} />
        </g>
        {reflection}
      </svg>
      <FxCanvas draw={drawDrops} />
      {front}
    </AbsoluteFill>
  );
};

/** 玻璃后面的街（就是候车亭对面那条旧街），完全失焦 */
const StreetBehind: React.FC<{ tod: Tod; blur: number }> = ({ tod, blur }) => (
  <AbsoluteFill style={{ filter: `blur(${blur}px) ${tod === "day" ? TOD_GRADE.day : ""}`, background: tod === "day" ? "#b9b29f" : "#151c22" }}>
    <WorldSvg cam={{ x: 1180, y: 520, scale: 1.3 }}>
      <PencilDefs />
      <AlleyBackdrop tod={tod} lampGlow={tod === "night" ? 1 : 0} />
    </WorldSvg>
  </AbsoluteFill>
);

/** 玻璃上映出的人（头和肩）：左右镜像、很淡，胸口以下渐隐。(x,y) = 头部中心 */
const ReflectedFace: React.FC<{ id: string; d: Design; x: number; y: number; s: number; turn: number; mouth: number; eye: number; op: number; tilt?: number; pitch?: number; bodyTurn?: number }> = ({
  id,
  d,
  x,
  y,
  s,
  turn,
  mouth,
  eye,
  op,
  tilt = 0,
  pitch = 0.05,
  bodyTurn = 0,
}) => {
  if (op <= 0.003) return null;
  const hy = d.sex === "f" ? -398 : -424;
  const pose: FrontPose = { ...FRONT_NEUTRAL, head: { turn, pitch, eyeOpen: eye, gaze: turn * 0.6, brow: 0.1, mouth }, headTilt: tilt, bodyTurn, handL: { at: [-60, 40], fore: 0.6 }, handR: { at: [60, 40], fore: 0.6 } };
  const box = { x: x - 240 * s, y: y - 120 * s, w: 480 * s, h: 420 * s };
  return (
    <g>
      <defs>
        <radialGradient id={`rf-${id}`} cx="0.5" cy="0.32" r="0.62" gradientTransform="translate(0.5 0.32) scale(0.85 1) translate(-0.5 -0.32)">
          <stop offset="0.35" stopColor="#fff" />
          <stop offset="0.8" stopColor="#000" />
        </radialGradient>
        <mask id={`rfm-${id}`} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={`url(#rf-${id})`} />
        </mask>
      </defs>
      <g mask={`url(#rfm-${id})`} opacity={op} style={{ filter: "blur(1.6px)" }}>
        <g transform={`translate(${x},${y}) scale(-1,1)`}>
          <FigureFront pose={pose} design={d} x={0} y={-hy * s} scale={s} />
        </g>
      </g>
    </g>
  );
};

export const E2: React.FC = () => {
  const t = useSongT("E2");
  const pen = penAt(HER_TEXT, t);
  const enter = track(t, [[148.4, 0], [149.2, 1, E.out], [153.6, 1], [154.6, 0, E.in]]);
  const p = pen ?? [HER_TEXT.x + 4 * HER_TEXT.size - 30, HER_TEXT.y + 10];
  const cam = track(t, [[148.35, 1.0], [155.1, 1.04, E.drift]]);
  return (
    <AbsoluteFill style={{ transform: `scale(${cam})` }}>
      <FogGlass
        id="e2"
        t={t}
        memory
        behind={<StreetBehind tod="day" blur={16} />}
        fogColor="#f3ecdc"
        fog={1}
        drops={0.4}
        texts={[{ L: HER_TEXT }]}
        front={
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <PencilDefs />
            <g filter="url(#pencil-soft)">
              <PointHand x={lerp(p[0] + 520, p[0], enter)} y={lerp(p[1] + 760, p[1], enter)} angle={-24} scale={1.0} skin={WOMAN_MEM.look.skin} skinShade={WOMAN_MEM.look.skinShade} sleeve={WOMAN_MEM.coat} line={WOMAN_MEM.line} />
            </g>
          </svg>
        }
      />
      <PaperOverlay memory opacity={0.5} />
    </AbsoluteFill>
  );
};

export const E3: React.FC = () => {
  const t = useSongT("E3");
  const pen = penAt(HIS_TEXT, t);
  const enter = track(t, [[155.2, 0], [155.9, 1, E.out], [159.3, 1], [160.1, 0, E.in]]);
  const p = pen ?? [HIS_TEXT.x + 4 * HIS_TEXT.size - 30, HIS_TEXT.y + 10];
  const refl = track(t, [[159.2, 0], [160.4, 1, E.inOut]]);
  const lean = track(t, [[160.0, 0], [161.2, 1, E.inOut]]);
  const laugh = track(t, [[160.3, 0], [160.8, 1, E.out]]);
  const cam = track(t, [[155.1, 1.04], [162.0, 1.08, E.drift]]);
  return (
    <AbsoluteFill style={{ transform: `scale(${cam})` }}>
      <FogGlass
        id="e3"
        t={t}
        memory
        behind={<StreetBehind tod="day" blur={16} />}
        fogColor="#f3ecdc"
        fog={1}
        drops={0.45}
        texts={[{ L: HER_TEXT, all: true }, { L: HIS_TEXT }]}
        reflection={
          <g>
            <ReflectedFace id="e3w" d={WOMAN_MEM} x={1440 + lean * 16} y={400 + lean * 6} s={1.15} turn={0.35} mouth={0.5 + laugh * 0.4} eye={0.55 - laugh * 0.35} op={0.3 * refl} tilt={-7 * lean} bodyTurn={0.2} />
            <ReflectedFace id="e3m" d={MAN_MEM} x={1690} y={360} s={1.2} turn={-0.32} mouth={0.45 + laugh * 0.4} eye={0.6 - laugh * 0.3} op={0.3 * refl} pitch={0.1} bodyTurn={-0.2} />
          </g>
        }
        front={
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <PencilDefs />
            <g filter="url(#pencil-soft)">
              <PointHand x={lerp(p[0] - 620, p[0], enter)} y={lerp(p[1] + 760, p[1], enter)} angle={20} scale={1.1} skin={MAN_MEM.look.skin} skinShade={MAN_MEM.look.skinShade} sleeve={MAN_MEM.coat} line={MAN_MEM.line} flip />
            </g>
          </svg>
        }
      />
      <PaperOverlay memory opacity={0.5} />
    </AbsoluteFill>
  );
};

/** E4：现在，夜里同一块玻璃。他呵一口气，雾里又显出当年的字 */
const BREATH = { x: 860, y: 560 };
export const E4: React.FC = () => {
  const t = useSongT("E4");
  const breathR = track(t, [[162.85, 40], [163.9, 540, E.out], [168.45, 600, E.drift]]);
  const breathOp = track(t, [[162.85, 0], [163.2, 1, E.out]]);
  const face = track(t, [[162.0, 0.2], [162.8, 0.26, E.inOut], [163.6, 0.16, E.inOut]]);
  const lean = track(t, [[162.0, 0], [162.8, 1, E.inOut]]);
  return (
    <AbsoluteFill>
      <FogGlass
        id="e4"
        t={t}
        behind={<StreetBehind tod="night" blur={14} />}
        fogColor="#c4ced2"
        fog={0.85}
        breath={{ ...BREATH, r: breathR, op: breathOp }}
        texts={[{ L: HER_TEXT, all: true }, { L: HIS_TEXT, all: true }]}
        reflection={<ReflectedFace id="e4m" d={MAN} x={1420 - lean * 50} y={430 + lean * 16} s={1.35 + lean * 0.1} turn={-0.4} mouth={-0.25} eye={0.5} op={face} pitch={0.15} bodyTurn={-0.2} />}
        drops={0.15}
      />
    </AbsoluteFill>
  );
};

/** F1：雨大起来，水顺着玻璃流下，把雾和字一道道冲掉 */
const STREAKS = Array.from({ length: 70 }, (_, i) => {
  const r = mulberry32(7300 + i);
  const x = 60 + r() * 1800;
  const t0 = 169.2 + r() * 3.4;
  const speed = 500 + r() * 700;
  const w = 10 + r() * 22;
  const wig = Array.from({ length: 8 }, () => (r() - 0.5) * 40);
  return { x, t0, speed, w, wig };
});
export const F1: React.FC = () => {
  const t = useSongT("F1");
  const rain = track(t, [[168.5, 0.2], [171.0, 1.0, E.in], [174.7, 1.5]]);
  const fade = track(t, [[171.5, 0], [174.0, 1, E.inOut]]);
  const face = track(t, [[168.45, 0.16], [170.5, 0, E.inOut]]);
  const wash: Streak[] = STREAKS.flatMap((s) => {
    const len = Math.max(0, (t - s.t0) * s.speed);
    if (len <= 0) return [];
    const n = 8;
    const pts: P[] = Array.from({ length: n }, (_, k) => [s.x + s.wig[k] + (k / (n - 1)) * 30, -40 + (k / (n - 1)) * Math.min(len, 1200)] as P);
    return [{ pts, w: s.w * clamp(len / 300, 0.5, 1) }];
  });
  return (
    <AbsoluteFill>
      <FogGlass
        id="f1"
        t={t}
        behind={<StreetBehind tod="night" blur={14 + fade * 6} />}
        fogColor="#c4ced2"
        fog={0.85 * (1 - fade)}
        breath={{ ...BREATH, r: 600, op: 1 }}
        texts={[{ L: HER_TEXT, all: true }, { L: HIS_TEXT, all: true }]}
        textOpacity={1 - fade * 0.6}
        wash={wash}
        reflection={<ReflectedFace id="f1m" d={MAN} x={1370} y={446} s={1.45} turn={-0.4} mouth={-0.25} eye={0.5} op={face} pitch={0.15} bodyTurn={-0.2} />}
        drops={rain}
      />
    </AbsoluteFill>
  );
};
