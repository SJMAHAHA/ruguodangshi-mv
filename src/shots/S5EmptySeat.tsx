import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { E, track } from "../lib/anim";
import { FPS, SHOTS } from "../config/timeline";
import { Cam, WorldSvg, applyCam } from "../lib/camera";
import { Defs, Sky, Moon, Skyline, Water, BenchBack } from "../env/Waterside";
import { PencilDefs } from "../draw/Defs";
import { TShapes } from "../characters/front";
import { backShapes } from "../characters/back";
import { MAN, WOMAN_MEM } from "../characters/designs";
import { Bouquet } from "../props/Bouquet";
import { FxCanvas } from "../fx/FxCanvas";
import { drawFlight, drawPetal, Flight } from "../fx/petals";
import { drawShapesCanvas } from "../fx/shapesCanvas";
import { mulberry32 } from "../lib/random";
import { C } from "../config/palette";

/**
 * S5「留下的位置」 帧 810–900（27.0–30.0 s）
 * 栈桥长椅的背面：他坐左边；右边是她的暖色回忆轮廓。
 * 橡皮从右上往左下把她擦去，只剩一道擦不干净的铅笔印；一片花瓣落在她坐过的位置。
 */
export const S5_T = {
  erase: [27.45, 29.05] as const,
  headTurn: [27.85, 28.85] as const,
  petalLand: 29.1,
};

const BENCH = { x: 960, y: 800, w: 1080, scale: 1 };
const HIM = { x: 690, y: 792, scale: 1.02 };
const HER = { x: 1196, y: 792, scale: 1.02 };
const MOON5 = { x: 1010, y: 170, r: 92 };

export const s5Cam = (t: number): Cam => ({ x: 980, y: 560 + track(t, [[27, 0], [30, -6, E.drift]]), scale: track(t, [[27, 1], [30, 1.035, E.drift]]) });

const FEW: Flight = {
  seed: 505,
  count: 14,
  spawn: [25.8, 29.2],
  from: { x0: 100, x1: 1600, y0: -300, y1: -40 },
  vel: [70, 140],
  velJitter: [40, 30],
  sway: 30,
  size: [10, 18],
  fadeY: 1100,
};

/** 最后落在空位上的那片花瓣：解析轨迹，落定后静止 */
const lastPetal = (t: number) => {
  const land: [number, number] = [HER.x + 24, BENCH.y - 250 * BENCH.scale - 3];
  const t0 = 27.3;
  const k = Math.min(1, Math.max(0, (t - t0) / (S5_T.petalLand - t0)));
  const e = 1 - Math.pow(1 - k, 2.2);
  const x = land[0] - 260 * (1 - e) + Math.sin(k * 7) * 24 * (1 - k);
  const y = land[1] - 520 * (1 - e);
  const rot = 0.6 + (1 - e) * 5.5;
  const flip = k < 1 ? Math.cos(k * 9) * (1 - k) + 0.85 * k : 0.85;
  return { x, y, rot, flip, size: 21, color: "191,109,111", alpha: Math.min(1, (t - t0) * 3) };
};

export const S5EmptySeat: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (SHOTS.s5.from + frame) / FPS;
  const cam = s5Cam(t);
  const turn = track(t, [[S5_T.headTurn[0], 0], [S5_T.headTurn[1], 0.42, E.inOut]]);
  const erase = track(t, [[S5_T.erase[0], 0], [S5_T.erase[1], 1, E.inOut]]);
  const her = useMemo(() => backShapes({ headTurn: 0, headTilt: -10, slump: 0.1, lean: -4, headOffset: [-14, 10] }, WOMAN_MEM), []);

  const drawGhost = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      applyCam(ctx, cam);
      const at = { x: HER.x, y: HER.y, scale: HER.scale };
      // 1) 回忆轮廓：暖色淡彩 + 棕褐铅笔线
      drawShapesCanvas(ctx, her, at, { fillAlpha: 0.5, lineAlpha: 0.9, line: C.memSepia, lw: 2.4 });
      // 2) 橡皮：从右上往左下的往返粗笔触（相互重叠，最后一笔扫完时全部擦净）
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const strokes = 10;
      const done = erase * strokes;
      const r = mulberry32(55);
      const top = HER.y - 540;
      for (let i = 0; i < strokes; i++) {
        const p = Math.min(1, Math.max(0, done - i));
        const y = top + i * 62 + (r() - 0.5) * 14;
        const right = i % 2 === 0;
        const xa = HER.x + (right ? 200 : -200);
        const xb = HER.x + (right ? -200 : 200);
        const jitter = r() * 1000;
        if (p <= 0) continue;
        const xe = xa + (xb - xa) * p;
        // 主笔触 + 两侧毛边
        for (let k = 0; k < 5; k++) {
          ctx.lineWidth = 128 - k * 18;
          ctx.globalAlpha = k === 0 ? 0.45 : 0.75 + k * 0.05;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(xa, y + Math.sin(jitter + k) * 4);
          ctx.quadraticCurveTo((xa + xe) / 2, y + 18 + Math.cos(jitter + k) * 5, xe, y + 30 + Math.sin(jitter * 2 + k) * 4);
          ctx.stroke();
        }
      }
      if (erase >= 1) {
        ctx.globalAlpha = 1;
        ctx.fillRect(HER.x - 300, top - 100, 600, 800);
      }
      ctx.restore();
      // 3) 擦不干净的铅笔印：极淡的线留在原位
      drawShapesCanvas(ctx, her, at, { fillAlpha: 0, lineAlpha: 0.2 * erase, line: C.memSepia, lw: 2.2, linesOnly: true });
      // 4) 橡皮屑与擦痕（很淡）
      ctx.save();
      const rr = mulberry32(77);
      for (let i = 0; i < 46; i++) {
        const px = HER.x - 180 + rr() * 360;
        const py = HER.y - 520 + rr() * 640;
        const show = (py - (HER.y - 520)) / 640 < erase;
        if (!show) continue;
        ctx.fillStyle = `rgba(122,90,67,${0.1 + rr() * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(px, py, 2 + rr() * 3, 1 + rr() * 1.5, rr() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    [cam, her, erase]
  );
  const drawPetals = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawFlight(ctx, cam, t, FEW);
      const s = cam.scale;
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 960 - cam.x * s, 540 - cam.y * s);
      const p = lastPetal(t);
      if (p.alpha > 0) drawPetal(ctx, p);
      ctx.restore();
    },
    [cam, t]
  );
  return (
    <AbsoluteFill style={{ background: "#111a25" }}>
      <WorldSvg cam={cam}>
        <PencilDefs />
        <Defs />
        <Sky y0={-200} y1={436} />
        <Moon x={MOON5.x} y={MOON5.y} r={MOON5.r} />
        <g filter="url(#pencil-soft)">
          <Skyline base={436} x0={-200} x1={2200} seed={9} scale={0.8} />
        </g>
        <Water y0={434} y1={800} moonX={MOON5.x} t={t} reflW={110} seed={6} />
        <ellipse cx={MOON5.x} cy={620} rx={260} ry={170} fill="#c9c6b0" opacity={0.07} filter="url(#soft-blur-60)" />
        <rect x={-300} y={420} width={2600} height={40} fill="#8c999b" opacity={0.08} filter="url(#soft-blur-20)" />
        {/* 栈桥木板（近景，透视收向远处） */}
        <g>
          <path d="M-300,770 L2300,770 L2300,1300 L-300,1300 Z" fill="#35362f" />
          {Array.from({ length: 14 }, (_, i) => {
            const y = 770 + Math.pow(i / 13, 1.7) * 520;
            return <line key={i} x1={-300} y1={y} x2={2300} y2={y} stroke="#20231f" strokeWidth={2 + i * 0.4} opacity={0.75} />;
          })}
          {Array.from({ length: 11 }, (_, i) => {
            const x = -200 + i * 240;
            return <line key={`v${i}`} x1={1000 + (x - 1000) * 0.3} y1={770} x2={x} y2={1300} stroke="#2a2c27" strokeWidth={1.5} opacity={0.6} />;
          })}
          <rect x={-300} y={766} width={2600} height={6} fill="#6f6f63" opacity={0.4} />
          <ellipse cx={MOON5.x} cy={900} rx={520} ry={160} fill="#b9b6a2" opacity={0.08} filter="url(#soft-blur-60)" />
        </g>
        {/* 长椅：座面与腿 → 人物 → 靠背 */}
        <BenchBack x={BENCH.x} y={BENCH.y} w={BENCH.w} scale={BENCH.scale} part="legs" />
        <ellipse cx={BENCH.x} cy={BENCH.y + 246} rx={600} ry={22} fill="#141814" opacity={0.45} />
        <g transform={`translate(${HIM.x},${HIM.y}) scale(${HIM.scale})`}>
          <TShapes shapes={backShapes({ headTurn: turn, headTilt: 2 + turn * 4, slump: 0.55, lean: 1 }, MAN)} line={MAN.line} lw={MAN.lw} filter="url(#pencil)" />
        </g>
      </WorldSvg>
      {/* 她的回忆轮廓（Canvas：画出 → 擦除 → 留下淡印） */}
      <FxCanvas draw={drawGhost} />
      <WorldSvg cam={cam}>
        <BenchBack x={BENCH.x} y={BENCH.y} w={BENCH.w} scale={BENCH.scale} part="back" />
        {/* 落在地上的花束（参考片结尾的花束落地） */}
        <Bouquet x={1470} y={1010} scale={0.8} rot={6} />
      </WorldSvg>
      <FxCanvas draw={drawPetals} />
    </AbsoluteFill>
  );
};
