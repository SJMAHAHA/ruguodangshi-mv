// 渲染若干指定帧并拼成联系表（检查用）。
// 用法：node scripts/stills.mjs <输出目录> <帧1,帧2,...> [列数] [缩放]
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const [outDir, framesArg, colsArg = "3", scaleArg = "0.5", compId = "RuguoPilot"] = process.argv.slice(2);
const frames = framesArg.split(",").map((x) => parseInt(x, 10));
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
const files = [];
let browser;
// 无论成功或出错都关掉浏览器、删掉临时 bundle（每次约 100MB，否则会堆在 $TMPDIR 里）
try {
  browser = await openBrowser("chrome", { browserExecutable: process.env.REMOTION_BROWSER ?? null });
  const composition = await selectComposition({ serveUrl, id: compId, puppeteerInstance: browser });
  for (const f of frames) {
    const output = path.join(outDir, `f${String(f).padStart(3, "0")}.jpg`);
    await renderStill({ composition, serveUrl, frame: f, output, imageFormat: "jpeg", jpegQuality: 90, scale: parseFloat(scaleArg), puppeteerInstance: browser });
    files.push(output);
  }
} finally {
  await browser?.close({ silent: true });
  fs.rmSync(serveUrl, { recursive: true, force: true });
}
execFileSync("python3", [path.resolve("scripts/contact.py"), path.join(outDir, "sheet.jpg"), colsArg, ...files], { stdio: "inherit" });
