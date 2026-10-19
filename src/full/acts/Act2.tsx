import React from "react";
import { AbsoluteFill } from "remotion";
import { BusStopWorld, STOP } from "../../env/BusStop";
import { FRONT_NEUTRAL, FrontPose, headAnchor } from "../../characters/front";
import { MAN_MEM, WOMAN_MEM } from "../../characters/designs";
import { E, track, lerp, clamp } from "../../lib/anim";
import { noise1, mulberry32 } from "../../lib/random";
import { Cam } from "../../lib/camera";
import { useSongT } from "../useSongT";
import { C } from "../../config/palette";
import { smoothClosed, P } from "../../lib/geom";
import { PencilDefs } from "../../draw/Defs";
import { PencilHand } from "../../props/PencilHand";
import { HAND_FONT, BOOK_FONT } from "../../ui/fonts";
import { PaperOverlay } from "../../draw/Paper";

/**
 * 第二幕「夏天的长椅」B1–B5（0:38.25–1:07.29），全部是回忆层：
 * 同一张长椅，褪色的暖调白天。分一副耳机、耳边念诗、本子上的文言对话、诗集插图被画上胡子笑作一团；
 * 最后雨点落在回忆纸上，纸被浸透，露出雨夜。
 */

const K = STOP.figScale;
const SEAT_Y = STOP.seatY - 8;
const MAN_X = 820;
const HER_X = 1012;
/** 节拍：四分音符 0.7906 s（实测八分 0.3953 s），以 55.10 s 的拍点为锚 */
const beatPhase = (t: number) => (((t - 55.1) / 0.7906) % 1 + 1) % 1;

const manSummer = (t: number, o: Partial<FrontPose> = {}, head: Partial<FrontPose["head"]> = {}): FrontPose => ({
  ...FRONT_NEUTRAL,
  head: { turn: 0.32 + noise1(t * 0.5, 31) * 0.02, pitch: 0.1, eyeOpen: 0.75, gaze: 0.4, brow: 0, mouth: 0.5, ...head },
  bodyTurn: 0.15,
  slump: 0.15,
  handL: { at: [-34, -40], fore: 0.5, angle: 18 },
  handR: { at: [58, -52], fore: 0.5, angle: -24, curl: 0.4 },
  breathe: 0.5 + 0.5 * Math.sin(t * 1.8),
  ...o,
});

const herSummer = (t: number, o: Partial<FrontPose> = {}, head: Partial<FrontPose["head"]> = {}): FrontPose => {
  const nod = Math.max(0, Math.sin(beatPhase(t) * Math.PI * 2)) * 0.09;
  return {
    ...FRONT_NEUTRAL,
    head: { turn: -0.15, pitch: 0.12 + nod, eyeOpen: 0.22, gaze: -0.2, brow: 0, mouth: 0.65, ...head },
    headTilt: -4,
    bodyTurn: -0.18,
    legSlant: -0.4,
    handL: { at: [-30, -42], fore: 0.5, angle: 20 },
    handR: { at: [34, -42], fore: 0.5, angle: -20 },
    breathe: 0.5 + 0.5 * Math.sin(t * 2.0 + 1),
    ...o,
  };
};

/** 一副有线耳机：从他手里的手机分出两根线，分别到他的左耳和她的右耳 */
const Earphones: React.FC<{ man: FrontPose; her: FrontPose; t: number }> = ({ man, her }) => {
  const a = headAnchor(man, MAN_MEM);
  const b = headAnchor(her, WOMAN_MEM);
  const W = (x: number, p: P): P => [x + p[0] * K, SEAT_Y + p[1] * K];
  const earM = W(MAN_X, a.earR);
  const earH = W(HER_X, b.earL);
  const phone: P = W(MAN_X, [man.handR.at[0] + 6, man.handR.at[1] - 8]);
  const split: P = [(earM[0] + earH[0]) / 2 + 6, Math.max(earM[1], earH[1]) + 150];
  const wire = (p0: P, p1: P, sag: number) => `M${p0[0]},${p0[1]} Q${(p0[0] + p1[0]) / 2},${(p0[1] + p1[1]) / 2 + sag} ${p1[0]},${p1[1]}`;
  return (
    <g fill="none" strokeLinecap="round">
      {[wire(phone, split, 40), wire(split, [earM[0] + 4, earM[1] + 14], 16), wire(split, [earH[0] - 4, earH[1] + 14], 16)].map((d, i) => (
        <g key={i}>
          <path d={d} stroke={C.memSepia} strokeWidth={4.6} opacity={0.7} />
          <path d={d} stroke="#fbf7ee" strokeWidth={2.4} />
        </g>
      ))}
      <ellipse cx={earM[0] + 2} cy={earM[1] + 4} rx={6} ry={9} fill="#f6f2e8" stroke={C.memSepia} strokeWidth={1.4} />
      <ellipse cx={earH[0] - 2} cy={earH[1] + 4} rx={6} ry={9} fill="#f6f2e8" stroke={C.memSepia} strokeWidth={1.4} />
      <rect x={split[0] - 4} y={split[1] - 7} width={8} height={14} rx={3} fill="#f6f2e8" stroke={C.memSepia} strokeWidth={1.2} />
      {/* 手机 */}
      <g transform={`translate(${phone[0]},${phone[1] + 26}) rotate(-12)`}>
        <rect x={-16} y={-30} width={32} height={58} rx={5} fill="#6f6a62" stroke={C.memSepia} strokeWidth={1.6} />
        <rect x={-13} y={-26} width={26} height={48} rx={3} fill="#e7e1d1" />
      </g>
    </g>
  );
};

const summerWorld = (cam: Cam, t: number, man: FrontPose, her: FrontPose, front?: React.ReactNode) => (
  <BusStopWorld
    cam={cam}
    t={t}
    tod="day"
    rain={0}
    glassDrops={0}
    lampGlow={0}
    man={man}
    woman={her}
    manDesign={MAN_MEM}
    womanDesign={WOMAN_MEM}
    manX={MAN_X}
    womanX={HER_X}
    bouquet={null}
    front={front}
  />
);

/** 回忆层统一的纸面：暖纸纹 + 纸边 */
const MemoryPaper: React.FC = () => (
  <>
    <PaperOverlay memory opacity={0.55} />
    <AbsoluteFill style={{ boxShadow: "inset 0 0 160px rgba(120,90,60,0.35)", pointerEvents: "none" }} />
  </>
);

// ---------------- B1 一副耳机 ----------------
export const B1: React.FC = () => {
  const t = useSongT("B1");
  const cam: Cam = { x: 930, y: 540, scale: track(t, [[38.25, 1.32], [44.1, 1.38, E.drift]]) };
  const glance = track(t, [[40.6, 0], [41.3, 1, E.inOut], [42.6, 1], [43.3, 0.2, E.inOut]]);
  const man = manSummer(t, {}, { turn: lerp(0.3, 0.45, glance), mouth: 0.4 + glance * 0.3, eyeOpen: 0.75 + glance * 0.1 });
  const her = herSummer(t, {}, { eyeOpen: lerp(0.22, 0.75, glance * 0.8), turn: lerp(-0.15, -0.35, glance) });
  return (
    <AbsoluteFill>
      {summerWorld(cam, t, man, her, <Earphones man={man} her={her} t={t} />)}
      <MemoryPaper />
    </AbsoluteFill>
  );
};

// ---------------- B2 耳边的诗 ----------------
const POEM = "人生若只如初见";
export const B2: React.FC = () => {
  const t = useSongT("B2");
  const cam: Cam = { x: 905 + track(t, [[44.1, 0], [51, 14, E.drift]]), y: 300, scale: track(t, [[44.1, 2.0], [51, 2.1, E.drift]]) };
  const lean = track(t, [[44.3, 0], [45.2, 1, E.inOut], [50.2, 1], [50.9, 0.6, E.inOut]]);
  const close = track(t, [[45.8, 0], [47.2, 1, E.inOut]]);
  const man = manSummer(t, {}, { turn: 0.18, pitch: 0.12, eyeOpen: lerp(0.75, 0.2, close), mouth: 0.45 + close * 0.3, gaze: 0.2 });
  const talk = Math.max(0, Math.sin(t * 9)) * 0.25 * clamp((t - 44.6) / 0.3) * clamp((50.0 - t) / 0.3);
  const her = herSummer(
    t,
    { headOffset: [lerp(0, -46, lean), lerp(0, 16, lean)], headTilt: lerp(-4, -10, lean), lean: lerp(0, -4, lean), bodyTurn: lerp(-0.18, -0.32, lean) },
    { turn: lerp(-0.15, -0.55, lean), pitch: 0.1, eyeOpen: 0.45, gaze: -0.5, mouth: 0.35 - talk }
  );
  const a = headAnchor(her, WOMAN_MEM);
  const mouth: P = [HER_X + (a.head[0] - 22) * K, SEAT_Y + (a.head[1] + 34) * K];
  const ear = headAnchor(man, MAN_MEM).earR;
  const earW: P = [MAN_X + ear[0] * K, SEAT_Y + ear[1] * K];
  const chars = POEM.split("").map((ch, i) => {
    const t0 = 44.75 + i * 0.5;
    const age = t - t0;
    if (age < 0) return null;
    const r = mulberry32(900 + i);
    const k = clamp(age / 2.2);
    const e = 1 - Math.pow(1 - k, 2);
    // 从她唇边飘出，绕过他的耳边，向左上方散开
    const x = lerp(mouth[0], earW[0] - 10, e) - Math.max(0, age - 1.6) * 38 + Math.sin(age * 2 + i) * 5;
    const y = lerp(mouth[1], earW[1] - 6 + (r() - 0.5) * 30, e) - Math.max(0, age - 1.6) * 22;
    const op = clamp(age / 0.35) * clamp((4.2 - age) / 1.2) * 0.9;
    return (
      <text key={i} x={x} y={y} fontFamily={HAND_FONT} fontSize={34} fill={C.memSepia} opacity={op} transform={`rotate(${(r() - 0.5) * 18} ${x} ${y})`}>
        {ch}
      </text>
    );
  });
  return (
    <AbsoluteFill>
      {summerWorld(cam, t, man, her, <>
        <Earphones man={man} her={her} t={t} />
        {chars}
      </>)}
      <MemoryPaper />
    </AbsoluteFill>
  );
};

// ---------------- B3 本子上的文言对话 ----------------
type Line = { text: string; x: number; y: number; t0: number; per: number; ink: string; who: "her" | "him" };
const LINES: Line[] = [
  { text: "今日风好，君可愿同游？", x: 560, y: 380, t0: 51.35, per: 0.2, ink: "#6b4a3a", who: "her" },
  { text: "善。唯恐卿又迟到。", x: 600, y: 520, t0: 53.95, per: 0.2, ink: "#2f3640", who: "him" },
  { text: "汝敢！", x: 1020, y: 650, t0: 56.15, per: 0.22, ink: "#6b4a3a", who: "her" },
];
const FS = 62;
const writeState = (t: number) => {
  let pen: { x: number; y: number; who: "her" | "him" } | null = null;
  const glyphs: { ch: string; x: number; y: number; reveal: number; ink: string }[] = [];
  for (const L of LINES) {
    L.text.split("").forEach((ch, i) => {
      const narrow = "，。？！".includes(ch);
      const x = L.x + L.text.slice(0, i).split("").reduce((s, c) => s + ("，。？！".includes(c) ? FS * 0.6 : FS * 1.02), 0);
      const ti = L.t0 + i * L.per;
      const rv = clamp((t - ti) / (L.per * 0.9));
      glyphs.push({ ch, x, y: L.y, reveal: rv, ink: L.ink });
      if (rv > 0 && rv < 1) pen = { x: x + rv * (narrow ? FS * 0.5 : FS), y: L.y - FS * 0.25, who: L.who };
    });
    const end = L.t0 + L.text.length * L.per;
    if (t >= end && t < end + 0.35) {
      const lastX = L.x + L.text.split("").reduce((s, c) => s + ("，。？！".includes(c) ? FS * 0.6 : FS * 1.02), 0);
      pen = { x: lastX + 6, y: L.y - FS * 0.3 - (t - end) * 60, who: L.who };
    }
  }
  return { glyphs, pen: pen as { x: number; y: number; who: "her" | "him" } | null };
};

export const B3: React.FC = () => {
  const t = useSongT("B3");
  const { glyphs, pen } = writeState(t);
  const drift = track(t, [[51, 0], [57.7, 1, E.drift]]);
  // 没在写的时候，笔停在最后写的位置附近
  const rest: { x: number; y: number; who: "her" | "him" } = t < 53.9 ? { x: 1300, y: 420, who: "her" } : t < 56.1 ? { x: 1240, y: 560, who: "him" } : { x: 1250, y: 690, who: "her" };
  const p = pen ?? rest;
  return (
    <AbsoluteFill style={{ background: "#c9a86e" }}>
      <svg width={1920} height={1080}>
        <PencilDefs />
        <defs>
          <pattern id="dress" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="#d8b77c" />
            <circle cx="15" cy="15" r="4" fill="#efdcb2" opacity={0.6} />
            <circle cx="45" cy="45" r="4" fill="#efdcb2" opacity={0.6} />
          </pattern>
        </defs>
        {/* 她裙子上的布纹（本子放在她腿上） */}
        <rect width={1920} height={1080} fill="url(#dress)" />
        <g transform={`translate(${960 - drift * 20},${560 - drift * 10}) rotate(${-4 + drift * 0.6}) scale(${1 + drift * 0.04}) translate(-960,-560)`}>
          <rect x={360} y={150} width={1200} height={780} rx={10} fill="#5e4a3a" opacity={0.3} transform="translate(18,20)" />
          <rect x={360} y={150} width={1200} height={780} rx={8} fill="#f3ead6" stroke={C.memSepia} strokeWidth={2.5} />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={380} y1={260 + i * 64} x2={1540} y2={260 + i * 64} stroke="#9fb4c0" strokeWidth={1.6} opacity={0.55} />
          ))}
          <line x1={480} y1={160} x2={480} y2={920} stroke="#c98b84" strokeWidth={1.6} opacity={0.6} />
          {/* 装订圈 */}
          {Array.from({ length: 12 }, (_, i) => (
            <ellipse key={i} cx={360} cy={190 + i * 62} rx={14} ry={9} fill="none" stroke="#8a8a85" strokeWidth={4} />
          ))}
          {glyphs.map((g, i) =>
            g.reveal > 0 ? (
              <g key={i}>
                <clipPath id={`gc-${i}`}>
                  <rect x={g.x - 4} y={g.y - FS} width={(FS + 8) * g.reveal} height={FS * 1.3} />
                </clipPath>
                <text x={g.x} y={g.y} fontFamily={HAND_FONT} fontSize={FS} fill={g.ink} clipPath={`url(#gc-${i})`} opacity={0.92}>
                  {g.ch}
                </text>
              </g>
            ) : null
          )}
          {/* 她在「汝敢！」后面画了个鼓腮的小脸 */}
          {t > 57.0 ? (
            <g transform="translate(1260,628)" stroke="#6b4a3a" strokeWidth={4} fill="none" strokeLinecap="round">
              <circle r={30} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((t - 57.0) / 0.4)} />
              {t > 57.4 ? <path d="M-12,-6 l6,0 M8,-6 l6,0 M-8,12 q8,-6 16,0" /> : null}
            </g>
          ) : null}
          <PencilHand
            x={p.x}
            y={p.y + 4}
            angle={p.who === "her" ? 6 : -8}
            scale={1.15}
            skin={p.who === "her" ? "#e6c9ad" : "#e1c3a6"}
            sleeve={p.who === "her" ? "#e6c98f" : "#efe7d4"}
            line={C.memSepia}
            flip={p.who === "him"}
          />
        </g>
      </svg>
      <MemoryPaper />
    </AbsoluteFill>
  );
};

// ---------------- B4 诗集插图被画上胡子 / 笑作一团 ----------------
const BookPage: React.FC<{ t: number }> = ({ t }) => {
  const doodle = clamp((t - 58.25) / 1.3);
  const glasses = clamp((t - 58.9) / 0.9);
  const drift = track(t, [[57.7, 0], [60.0, 1, E.drift]]);
  const pen: P = doodle < 1 ? [760 + doodle * 120, 520 + Math.sin(doodle * 9) * 18] : [720 + glasses * 160, 440];
  return (
    <AbsoluteFill style={{ background: "#c9a86e" }}>
      <svg width={1920} height={1080}>
        <PencilDefs />
        <g transform={`translate(${960 + drift * 16},${540}) scale(${1.02 + drift * 0.05}) translate(-960,-540)`}>
          <path d="M200,140 Q960,110 1720,140 L1730,980 Q960,950 190,980 Z" fill="#7d6448" />
          <path d="M215,150 Q590,120 955,170 L955,960 Q590,925 205,965 Z" fill="#f2e7cf" stroke={C.memSepia} strokeWidth={2.5} />
          <path d="M965,170 Q1330,120 1705,150 L1715,965 Q1330,925 965,960 Z" fill="#f4ead4" stroke={C.memSepia} strokeWidth={2.5} />
          <path d="M955,170 L960,960" stroke="#b49d7a" strokeWidth={6} opacity={0.6} />
          {/* 左页：水墨插图，戴冠长须的古人 */}
          <g filter="url(#pencil-soft)" opacity={0.9}>
            <path d={smoothClosed([[560, 640], [520, 900], [880, 900], [840, 640], [700, 600]], 0.8)} fill="#56544f" opacity={0.75} />
            <path d={smoothClosed([[640, 360], [700, 330], [760, 360], [770, 460], [740, 540], [660, 540], [630, 460]], 0.9)} fill="#e8dcc2" stroke="#3a3833" strokeWidth={4} />
            <path d="M630,365 L640,300 L760,300 L770,365 Z" fill="#33312d" />
            <path d="M672,300 L700,250 L728,300 Z" fill="#33312d" />
            <path d={smoothClosed([[650, 500], [700, 520], [750, 500], [760, 600], [700, 700], [640, 600]], 0.9)} fill="#3d3b37" opacity={0.9} />
            <path d="M665,445 q14,-6 26,0 M712,445 q14,-6 26,0" stroke="#2c2a26" strokeWidth={5} fill="none" />
          </g>
          {/* 她用铅笔加上去的小胡子和圆眼镜 */}
          <g stroke="#6b4a3a" strokeWidth={5} fill="none" strokeLinecap="round">
            <path d="M700,488 C680,470 650,476 652,496 C654,510 672,506 668,494 M700,488 C720,470 750,476 748,496 C746,510 728,506 732,494" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - doodle} />
            <circle cx={676} cy={444} r={20} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(glasses * 2)} />
            <circle cx={726} cy={444} r={20} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(glasses * 2 - 1)} />
          </g>
          {/* 右页：杜牧《赤壁》 */}
          <g fontFamily={BOOK_FONT} fill="#3a342c">
            <text x={1100} y={300} fontSize={64}>赤壁</text>
            <text x={1320} y={300} fontSize={34} fill="#6a5f50">唐·杜牧</text>
            {["折戟沉沙铁未销，", "自将磨洗认前朝。", "东风不与周郎便，", "铜雀春深锁二乔。"].map((l, i) => (
              <text key={i} x={1100} y={430 + i * 110} fontSize={52} letterSpacing="0.08em">
                {l}
              </text>
            ))}
          </g>
          <PencilHand x={pen[0]} y={pen[1]} angle={8} scale={1.05} skin="#e6c9ad" sleeve="#e6c98f" line={C.memSepia} />
        </g>
      </svg>
      <MemoryPaper />
    </AbsoluteFill>
  );
};

const laughPoses = (t: number, fade = 1) => {
  const shake = Math.sin(t * 13) * 0.5 + Math.sin(t * 7.3) * 0.3;
  const k = clamp((t - 60.05) / 0.4) * fade;
  const man = manSummer(
    t,
    { shoulderLift: 0.3 * k + shake * 0.25 * k, lean: -2 * k, headTilt: -6 * k },
    { turn: 0.3, pitch: lerp(0.1, -0.22, k) + shake * 0.03 * k, eyeOpen: lerp(0.75, 0.08, k), mouth: lerp(0.5, 1, k), brow: -0.2 * k }
  );
  const her = herSummer(
    t,
    {
      lean: -6 * k,
      headTilt: lerp(-4, -10, k),
      headOffset: [-18 * k, 12 * k],
      shoulderLift: 0.35 * k + shake * 0.3 * k,
      handL: { at: [lerp(-30, -6, k), lerp(-42, -300, k)], fore: lerp(0.5, 0.9, k), angle: 160 * k, curl: 0.5 * k },
      handR: { at: [34, -46], fore: 0.5, angle: -20 },
    },
    { turn: -0.3, pitch: 0.28, eyeOpen: lerp(0.4, 0.05, k), mouth: 1, gaze: -0.3 }
  );
  return { man, her };
};

/** 她腿上摊开的诗集（世界坐标，中景） */
const LapBook: React.FC = () => (
  <g transform={`translate(${HER_X - 6},${SEAT_Y - 34})`}>
    <path d="M-120,0 Q0,-20 120,0 L118,36 Q0,18 -122,36 Z" fill="#f2e7cf" stroke={C.memSepia} strokeWidth={2} />
    <path d="M0,-12 L0,26" stroke={C.memSepia} strokeWidth={1.5} />
    <path d="M-100,8 l70,-4 M-100,18 l60,-3 M20,4 l70,3 M20,14 l60,3" stroke="#8a7a62" strokeWidth={2} />
  </g>
);

export const B4: React.FC = () => {
  const t = useSongT("B4");
  if (t < 60.0) return <BookPage t={t} />;
  const cam: Cam = { x: 935, y: 520, scale: track(t, [[60, 1.42], [64.2, 1.48, E.drift]]) };
  const { man, her } = laughPoses(t);
  return (
    <AbsoluteFill>
      {summerWorld(cam, t, man, her, <LapBook />)}
      <MemoryPaper />
    </AbsoluteFill>
  );
};

// ---------------- B5 雨点落在回忆纸上，纸被浸透 ----------------
const DROPS = Array.from({ length: 46 }, (_, i) => {
  const r = mulberry32(5000 + i);
  return { x: r() * 1920, y: r() * 1080, t0: 64.35 + Math.pow(r(), 0.8) * 2.2, rmax: 120 + r() * 260, grow: 0.9 + r() * 0.8 };
});

export const B5: React.FC = () => {
  const t = useSongT("B5");
  const cam: Cam = { x: 935, y: 520, scale: track(t, [[64.2, 1.48], [67.29, 1.5, E.drift]]) };
  const calm = clamp((65.2 - t) / 1.0);
  const { man, her } = laughPoses(64.2 + (t - 64.2) * 0.3, calm);
  const drain = clamp((t - 64.5) / 2.3);
  const radius = (d: (typeof DROPS)[number]) => {
    const age = t - d.t0;
    if (age <= 0) return 0;
    return d.rmax * (1 - Math.exp(-age * d.grow * 1.6));
  };
  // 最后 0.6 s 整层淡出，露出下面垫着的试片 S1 第一帧
  const out = clamp((t - 66.65) / 0.62);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <AbsoluteFill style={{ filter: `saturate(${1 - drain * 0.75}) brightness(${1 - drain * 0.25})` }}>
        {summerWorld(cam, t, man, her, <LapBook />)}
        <MemoryPaper />
      </AbsoluteFill>
      {/* 雨点浸透纸面：被打湿的地方透出底下雨夜的颜色（S1 开场是对焦前的虚影，接近这片暗青灰） */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <filter id="soakEdge" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={77} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={60} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <radialGradient id="wetFill" gradientUnits="userSpaceOnUse" cx={1250} cy={300} r={1300}>
            <stop offset="0" stopColor="#5b6866" />
            <stop offset="0.35" stopColor="#3b4749" />
            <stop offset="1" stopColor="#1f282f" />
          </radialGradient>
        </defs>
        <g filter="url(#soakEdge)">
          {DROPS.map((d, i) => {
            const r = radius(d);
            return r > 1 ? <circle key={i} cx={d.x} cy={d.y} r={r} fill="url(#wetFill)" /> : null;
          })}
        </g>
        <g filter="url(#soakEdge)">
          {DROPS.map((d, i) => {
            const r = radius(d);
            return r > 1 ? <circle key={i} cx={d.x} cy={d.y} r={r + 8} fill="none" stroke="#4e4436" strokeWidth={12} opacity={0.3 * (1 - drain * 0.6)} /> : null;
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
