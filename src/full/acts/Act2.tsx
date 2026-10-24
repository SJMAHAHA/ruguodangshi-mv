import React from "react";
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { Glyph, tipOnLine, glyphEnds, revealOf, wristTurn } from "../../lib/writing";
import { SvgImage } from "../../env/Plate";
import { WRITE_RECT, WRITE_REF_ANGLE } from "../../props/Hands";
import { ASSETS } from "../../config/assets";
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
  const cam: Cam = { x: 930, y: 500, scale: track(t, [[38.25, 1.32], [44.1, 1.38, E.drift]]) };
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
  const cam: Cam = { x: 905 + track(t, [[44.1, 0], [51, 14, E.drift]]), y: 278, scale: track(t, [[44.1, 2.0], [51, 2.1, E.drift]]) };
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
    // 从她唇边飘出，绕过他的耳边，再从两人头顶之间往上散开（不往左飘：左边是他的脸）
    const drift = Math.max(0, age - 1.6);
    const x = lerp(mouth[0], earW[0] + 4, e) + drift * 9 + Math.sin(age * 2 + i) * 5;
    const y = lerp(mouth[1], earW[1] - 6 + (r() - 0.5) * 30, e) - drift * 36;
    const op = clamp(age / 0.35) * clamp((3.6 - age) / 1.0) * 0.85;
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
const isNarrow = (ch: string) => "，。？！".includes(ch);
/** 每一行拆成字框（笔顺和显字都按字框走） */
const LINE_GLYPHS: Glyph[][] = LINES.map((L, li) => {
  let x = L.x;
  return L.text.split("").map((ch, i) => {
    const narrow = isNarrow(ch);
    const g: Glyph = { x, top: L.y - FS * 0.88, w: narrow ? FS * 0.5 : FS, h: FS, t0: L.t0 + i * L.per, dur: L.per * 0.9, seed: 7100 + li * 97 + i, narrow };
    x += narrow ? FS * 0.6 : FS * 1.02;
    return g;
  });
});
const lineEnd = (li: number) => {
  const g = LINE_GLYPHS[li][LINE_GLYPHS[li].length - 1];
  return g.t0 + g.dur;
};

/** 她在「汝敢！」后面画的鼓腮小脸：先画圆，再点两只眼睛、画嘴 */
const DOODLE = { x: 1260, y: 628, r: 30, t0: 57.0, circle: 0.4, face: 0.2 };
const doodleTip = (t: number): { p: P; lift: number } | null => {
  const u = t - DOODLE.t0;
  if (u < 0 || u > DOODLE.circle + DOODLE.face) return null;
  if (u <= DOODLE.circle) {
    const a = -Math.PI / 2 + (u / DOODLE.circle) * Math.PI * 2;
    return { p: [DOODLE.x + Math.cos(a) * DOODLE.r, DOODLE.y + Math.sin(a) * DOODLE.r], lift: 0 };
  }
  const f = (u - DOODLE.circle) / DOODLE.face; // 0..1：左眼 → 右眼 → 嘴
  const pts: P[] = [
    [DOODLE.x - 12, DOODLE.y - 6],
    [DOODLE.x + 11, DOODLE.y - 6],
    [DOODLE.x, DOODLE.y + 12],
  ];
  const seg = Math.min(2, Math.floor(f * 3));
  const k = f * 3 - seg;
  const from: P = seg === 0 ? [DOODLE.x, DOODLE.y - DOODLE.r] : pts[seg - 1];
  return { p: [from[0] + (pts[seg][0] - from[0]) * k, from[1] + (pts[seg][1] - from[1]) * k], lift: Math.sin(Math.PI * k) * 0.8 };
};
/** 写完「汝敢！」到开始画小脸之间：抬笔移过去 */
const toDoodle = (t: number): { p: P; lift: number } => {
  const end = glyphEnds(LINE_GLYPHS[2][LINE_GLYPHS[2].length - 1]).end;
  const k = clamp((t - lineEnd(2)) / (DOODLE.t0 - lineEnd(2)));
  const to: P = [DOODLE.x, DOODLE.y - DOODLE.r];
  return { p: [end[0] + (to[0] - end[0]) * k, end[1] + (to[1] - end[1]) * k], lift: Math.sin(Math.PI * k) };
};

/**
 * 两只写字的手：从写字人的视角，右手从画面下方伸进来（她从右下，他从左下）。
 * 写之前从画面外伸进来，写完收回去；两人换手时一只收、一只伸，中间有一点交叠。
 */
type Tip = { p: P; lift: number };
type Writer = { segs: { t0: number; t1: number; tip: (t: number) => Tip | null }[]; elbow: P; off: P; natural: number };
const WRITERS: Record<"her" | "him", Writer> = {
  her: {
    segs: [
      { t0: LINES[0].t0, t1: lineEnd(0), tip: (t) => tipOnLine(LINE_GLYPHS[0], t) },
      { t0: LINES[2].t0, t1: DOODLE.t0 + DOODLE.circle + DOODLE.face, tip: (t) => tipOnLine(LINE_GLYPHS[2], t) ?? doodleTip(t) ?? toDoodle(t) },
    ],
    elbow: [1470, 1220],
    off: [1820, 1420],
    natural: 53,
  },
  him: {
    segs: [{ t0: LINES[1].t0, t1: lineEnd(1), tip: (t) => tipOnLine(LINE_GLYPHS[1], t) }],
    elbow: [335, 1240],
    off: [80, 1420],
    natural: 127,
  },
};
const ENTER = 0.5;
const HOLD = 0.15;
const EXIT = 0.5;
/** B3 结束的时刻：最后一段写完之后镜头就结束了，手留在纸上 */
const B3_END = 57.7;
const easeIO = (x: number) => x * x * (3 - 2 * x);
/** 写字人在 t 时刻的笔尖位置、抬笔程度；手不在画面里时返回 null */
const writerAt = (w: Writer, t: number): Tip | null => {
  for (const sg of w.segs) {
    if (t >= sg.t0 - ENTER && t < sg.t0) {
      const start = sg.tip(sg.t0)!.p;
      const k = easeIO((t - (sg.t0 - ENTER)) / ENTER);
      return { p: [w.off[0] + (start[0] - w.off[0]) * k, w.off[1] + (start[1] - w.off[1]) * k], lift: 1 - k };
    }
    if (t >= sg.t0 && t <= sg.t1) return sg.tip(t);
    const end = sg.tip(sg.t1)!.p;
    if (t > sg.t1 && sg.t1 + HOLD + EXIT > B3_END) return { p: end, lift: 0.3 * clamp((t - sg.t1) / HOLD) };
    if (t > sg.t1 && t <= sg.t1 + HOLD + EXIT) {
      if (t <= sg.t1 + HOLD) return { p: end, lift: 0.3 * ((t - sg.t1) / HOLD) };
      const k = easeIO((t - sg.t1 - HOLD) / EXIT);
      return { p: [end[0] + (w.off[0] - end[0]) * k, end[1] + (w.off[1] - end[1]) * k], lift: 0.3 + 0.7 * k };
    }
  }
  return null;
};

/** 写字的手：贴图（Codex 画的，见 asset-requests/）到了以后用贴图，否则先用 SVG 示意 */
const WriteHand: React.FC<{ who: "her" | "him"; tip: P; lift: number; elbow?: P }> = ({ who, tip, lift, elbow }) => {
  const w = WRITERS[who];
  const turn = wristTurn(tip, elbow ?? w.elbow, w.natural);
  const sc = 1.15 * (1 + 0.045 * lift);
  const id = `wh-${who}`;
  return (
    <g>
      <defs>
        {/* 手在纸上的影子：光从左上来；抬笔时影子离手更远、更淡、更虚 */}
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx={10 + 16 * lift} dy={14 + 20 * lift} stdDeviation={6 + 5 * lift} floodColor="#3a2a1c" floodOpacity={0.3 - 0.1 * lift} />
        </filter>
      </defs>
      <g transform={`translate(${tip[0] - 5 * lift},${tip[1] - 9 * lift}) rotate(${turn}) scale(${sc})`} filter={`url(#${id})`}>
        {ASSETS.writeHands ? (
          <SvgImage src={`plates/hand_write-${who}.png`} rect={WRITE_RECT[who]} />
        ) : (
          <PencilHand x={0} y={0} angle={WRITE_REF_ANGLE[who]} skin={who === "her" ? "#e6c9ad" : "#e1c3a6"} sleeve={who === "her" ? "#e6c98f" : "#efe7d4"} line={C.memSepia} flip={who === "him"} />
        )}
      </g>
    </g>
  );
};

export const B3: React.FC = () => {
  const t = useSongT("B3");
  const drift = track(t, [[51, 0], [57.7, 1, E.drift]]);
  const her = writerAt(WRITERS.her, t);
  const him = writerAt(WRITERS.him, t);
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
          {/* 字跟着笔顺从上往下显出来 */}
          {LINES.map((L, li) =>
            LINE_GLYPHS[li].map((g, i) => {
              const rv = revealOf(g, t);
              if (rv <= 0) return null;
              return (
                <g key={`${li}-${i}`}>
                  <clipPath id={`gc-${li}-${i}`}>
                    <rect x={g.x - 6} y={g.top - 8} width={g.w + 24} height={(g.h + 20) * rv} />
                  </clipPath>
                  <text x={g.x} y={L.y} fontFamily={HAND_FONT} fontSize={FS} fill={L.ink} clipPath={`url(#gc-${li}-${i})`} opacity={0.92}>
                    {L.text[i]}
                  </text>
                </g>
              );
            })
          )}
          {/* 她在「汝敢！」后面画了个鼓腮的小脸 */}
          {t > DOODLE.t0 ? (
            <g transform={`translate(${DOODLE.x},${DOODLE.y})`} stroke="#6b4a3a" strokeWidth={4} fill="none" strokeLinecap="round">
              <circle r={DOODLE.r} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((t - DOODLE.t0) / DOODLE.circle)} transform="rotate(-90)" />
              {t > DOODLE.t0 + DOODLE.circle + DOODLE.face * 0.2 ? <path d="M-12,-6 l1,0" /> : null}
              {t > DOODLE.t0 + DOODLE.circle + DOODLE.face * 0.55 ? <path d="M11,-6 l1,0" /> : null}
              {t > DOODLE.t0 + DOODLE.circle + DOODLE.face * 0.9 ? <path d="M-8,12 q8,-6 16,0" /> : null}
            </g>
          ) : null}
          {/* 他的手先画，她的手在上面（换手时两只手会短暂同时出现） */}
          {him ? <WriteHand who="him" tip={him.p} lift={him.lift} /> : null}
          {her ? <WriteHand who="her" tip={her.p} lift={her.lift} /> : null}
        </g>
      </svg>
      <MemoryPaper />
    </AbsoluteFill>
  );
};

// ---------------- B4 诗集插图被画上胡子 / 笑作一团 ----------------
/** 诗集插图上的涂鸦：笔尖严格沿着画出来的线走。先画胡子（左撇、右撇），抬笔，再画两个眼镜圈 */
type Cubic = [P, P, P, P];
const bez = (c: Cubic, u: number): P => {
  const v = 1 - u;
  return [
    v * v * v * c[0][0] + 3 * v * v * u * c[1][0] + 3 * v * u * u * c[2][0] + u * u * u * c[3][0],
    v * v * v * c[0][1] + 3 * v * v * u * c[1][1] + 3 * v * u * u * c[2][1] + u * u * u * c[3][1],
  ];
};
const STACHE: Cubic[] = [
  [[700, 488], [680, 470], [650, 476], [652, 496]],
  [[652, 496], [654, 510], [672, 506], [668, 494]],
  [[700, 488], [720, 470], [750, 476], [748, 496]],
  [[748, 496], [746, 510], [728, 506], [732, 494]],
];
const BOOK_T = { stache: [58.25, 59.0], g1: [59.15, 59.5], g2: [59.55, 59.9] } as const;
const GLASS = [{ x: 676, y: 444 }, { x: 726, y: 444 }];
const circleAt = (c: { x: number; y: number }, k: number): P => [c.x + 20 * Math.cos(k * Math.PI * 2), c.y + 20 * Math.sin(k * Math.PI * 2)];
const bookTip = (t: number): { p: P; lift: number } => {
  const [s0, s1] = BOOK_T.stache;
  if (t <= s1) {
    // 两撇胡子之间（画完左撇回到中间）抬一下笔
    const k = clamp((t - s0) / (s1 - s0));
    const half = k < 0.5 ? 0 : 1;
    const u = (k - half * 0.5) * 2; // 0..1：这一撇的进度
    const seg = STACHE[half * 2 + (u < 0.5 ? 0 : 1)];
    const p = bez(seg, u < 0.5 ? u * 2 : u * 2 - 1);
    const lift = half === 1 && u < 0.12 ? Math.sin((u / 0.12) * Math.PI) * 0.7 : 0;
    return { p, lift };
  }
  if (t < BOOK_T.g1[0]) {
    const k = (t - s1) / (BOOK_T.g1[0] - s1);
    const a = STACHE[3][3];
    const b = circleAt(GLASS[0], 0);
    return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], lift: Math.sin(Math.PI * k) };
  }
  if (t <= BOOK_T.g1[1]) return { p: circleAt(GLASS[0], clamp((t - BOOK_T.g1[0]) / (BOOK_T.g1[1] - BOOK_T.g1[0]))), lift: 0 };
  if (t < BOOK_T.g2[0]) {
    const k = (t - BOOK_T.g1[1]) / (BOOK_T.g2[0] - BOOK_T.g1[1]);
    const a = circleAt(GLASS[0], 1);
    const b = circleAt(GLASS[1], 0);
    return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], lift: Math.sin(Math.PI * k) * 0.6 };
  }
  return { p: circleAt(GLASS[1], clamp((t - BOOK_T.g2[0]) / (BOOK_T.g2[1] - BOOK_T.g2[0]))), lift: t > BOOK_T.g2[1] ? 0.3 : 0 };
};
const BOOK_ELBOW: P = [1300, 1250];
const BOOK_OFF: P = [1500, 1400];

const BookPage: React.FC<{ t: number }> = ({ t }) => {
  const doodle = clamp((t - BOOK_T.stache[0]) / (BOOK_T.stache[1] - BOOK_T.stache[0]));
  const g1 = clamp((t - BOOK_T.g1[0]) / (BOOK_T.g1[1] - BOOK_T.g1[0]));
  const g2 = clamp((t - BOOK_T.g2[0]) / (BOOK_T.g2[1] - BOOK_T.g2[0]));
  const drift = track(t, [[57.7, 0], [60.0, 1, E.drift]]);
  // 手从右下伸进来，落到胡子的起笔处
  const enter = easeIO(clamp((t - (BOOK_T.stache[0] - 0.5)) / 0.5));
  const tip = bookTip(t);
  const pen: P = t < BOOK_T.stache[0] ? [BOOK_OFF[0] + (STACHE[0][0][0] - BOOK_OFF[0]) * enter, BOOK_OFF[1] + (STACHE[0][0][1] - BOOK_OFF[1]) * enter] : tip.p;
  const lift = t < BOOK_T.stache[0] ? 1 - enter : tip.lift;
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
            <circle cx={676} cy={444} r={20} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g1} />
            <circle cx={726} cy={444} r={20} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g2} />
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
          <WriteHand who="her" tip={pen} lift={lift} elbow={BOOK_ELBOW} />
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
  const cam: Cam = { x: 935, y: 485, scale: track(t, [[60, 1.42], [64.2, 1.48, E.drift]]) };
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

/** 每一帧的遮罩图（内联 SVG）：解码完成之前不出帧，避免遮罩晚一帧生效 */
const useDecodedImage = (url: string) => {
  React.useLayoutEffect(() => {
    const handle = delayRender("B5 湿痕遮罩");
    const img = new Image();
    img.src = url;
    img
      .decode()
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [url]);
};

export const B5: React.FC = () => {
  const t = useSongT("B5");
  const cam: Cam = { x: 935, y: 485, scale: track(t, [[64.2, 1.48], [67.29, 1.5, E.drift]]) };
  const calm = clamp((65.2 - t) / 1.0);
  const { man, her } = laughPoses(64.2 + (t - 64.2) * 0.3, calm);
  const drain = clamp((t - 64.5) / 2.3);
  const radius = (d: (typeof DROPS)[number]) => {
    const age = t - d.t0;
    if (age <= 0) return 0;
    return d.rmax * (1 - Math.exp(-age * d.grow * 1.6));
  };
  const wet = DROPS.map((d) => ({ ...d, r: radius(d) })).filter((d) => d.r > 1);
  // 湿痕遮罩：白色 = 回忆纸还在，洞 = 被雨水浸透、透出下面雨夜的地方（洞里留一点纸，像湿透的半透明纸）
  const holes = wet.map((d) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(1)}"/>`).join("");
  const maskSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">` +
    `<defs><filter id="e" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="77"/>` +
    `<feDisplacementMap in="SourceGraphic" scale="60" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="5"/></filter>` +
    `<mask id="m"><rect width="1920" height="1080" fill="#fff"/><g filter="url(#e)" fill="#1f1f1f">${holes}</g></mask></defs>` +
    `<rect width="1920" height="1080" fill="#fff" mask="url(#m)"/></svg>`;
  const maskUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(maskSvg)}`;
  useDecodedImage(maskUrl);
  // 最后 0.6 s 整层淡出，露出下面垫着的试片 S1 第一帧
  const out = clamp((t - 66.65) / 0.62);
  const maskStyle: React.CSSProperties = { WebkitMaskImage: `url("${maskUrl}")`, maskImage: `url("${maskUrl}")`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <AbsoluteFill style={{ ...maskStyle, filter: `saturate(${1 - drain * 0.75}) brightness(${1 - drain * 0.25})` }}>
        {summerWorld(cam, t, man, her, <LapBook />)}
        <MemoryPaper />
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <filter id="soakEdge" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={77} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={60} xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation={2.5} />
          </filter>
        </defs>
        {/* 水渍边缘：颜料被水推到边上，积成一圈深一点的棕褐色（水彩的晕边） */}
        <g filter="url(#soakEdge)" opacity={1 - drain * 0.5}>
          {wet.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r + 3} fill="none" stroke="#5e4c39" strokeWidth={9} opacity={0.32} />
          ))}
        </g>
        {/* 雨点打在纸上的一瞬：小小的亮点溅开 */}
        {DROPS.map((d, i) => {
          const age = t - d.t0;
          if (age < 0 || age > 0.3) return null;
          const k = age / 0.3;
          return <circle key={`s${i}`} cx={d.x} cy={d.y} r={6 + k * 22} fill="none" stroke="#efe6d2" strokeWidth={3 * (1 - k)} opacity={0.7 * (1 - k)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
