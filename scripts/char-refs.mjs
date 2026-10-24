// 给 Codex 出人物参考图：按任务表渲染全片里的若干帧，可带 --props 开关（见 src/config/refs.ts）。
// 用法：node scripts/char-refs.mjs <任务表.json>
// 任务表：[{ "frame": 480, "out": "asset-requests/refs/chars/A3/f480.png", "props": { "refCam": {...}, "noPeople": true } }, ...]
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
let browser;
try {
  browser = await openBrowser("chrome", { browserExecutable: process.env.REMOTION_BROWSER ?? null });
  for (const j of jobs) {
    const inputProps = j.props ?? {};
    const composition = await selectComposition({ serveUrl, id: j.comp ?? "RuguoFull", inputProps, puppeteerInstance: browser });
    fs.mkdirSync(path.dirname(j.out), { recursive: true });
    const png = j.out.endsWith(".png");
    await renderStill({ composition, serveUrl, frame: j.frame, output: j.out, imageFormat: png ? "png" : "jpeg", ...(png ? {} : { jpegQuality: 92 }), inputProps, puppeteerInstance: browser });
    console.log(j.out);
  }
} finally {
  await browser?.close({ silent: true });
  fs.rmSync(serveUrl, { recursive: true, force: true });
}
