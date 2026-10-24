// 用 Seedream（火山方舟图片生成接口）生成背景板与插画。
// 用法：node scripts/seedream.mjs [任务id ...] [--force] [--list]
//   任务清单在 scripts/plates.jobs.mjs；不带 id 时生成所有还没有输出文件的任务。
//   API 配置读自 .env（ARK_API_KEY / ARK_IMAGE_URL / ARK_IMAGE_MODEL），.env 不进仓库。
// 每张图旁边写一个同名 .json，记录提示词、参考图、模型、尺寸和生成时间；
// 覆盖已有输出前，旧文件先移到 out/plates_archive/。
import fs from "node:fs";
import path from "node:path";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { JOBS } from "./plates.jobs.mjs";

const run = promisify(execFile);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
process.chdir(root);

const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const { ARK_API_KEY, ARK_IMAGE_URL, ARK_IMAGE_MODEL } = env;
if (!ARK_API_KEY || !ARK_IMAGE_URL) throw new Error(".env 里缺少 ARK_API_KEY / ARK_IMAGE_URL");

const args = process.argv.slice(2);
const force = args.includes("--force");
if (args.includes("--list")) {
  for (const j of JOBS) console.log(`${fs.existsSync(j.out) ? "✓" : " "} ${j.id.padEnd(22)} ${j.size}  ${j.out}`);
  process.exit(0);
}
const ids = args.filter((a) => !a.startsWith("--"));
const todo = JOBS.filter((j) => (ids.length ? ids.includes(j.id) : true)).filter((j) => force || ids.length || !fs.existsSync(j.out));
for (const id of ids) if (!JOBS.some((j) => j.id === id)) throw new Error(`没有这个任务：${id}`);

/** 参考图 → JPEG data URI（长边不超过 maxSide，控制请求体积） */
const refData = (file, maxSide = 3072) => {
  const tmp = path.join("out", "seedream_tmp", `${path.basename(file).replace(/\.\w+$/, "")}_${maxSide}.jpg`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  execFileSync("python3", [
    "-c",
    "import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im.thumbnail((int(sys.argv[3]),)*2,Image.LANCZOS);im.save(sys.argv[2],quality=92)",
    file,
    tmp,
    String(maxSide),
  ]);
  return `data:image/jpeg;base64,${fs.readFileSync(tmp).toString("base64")}`;
};

const generate = async (job) => {
  const t0 = Date.now();
  const refs = (job.refs ?? []).map((r) => refData(r));
  const body = {
    model: ARK_IMAGE_MODEL || "doubao-seedream-5.0-pro",
    prompt: job.prompt,
    size: job.size,
    response_format: "url",
    watermark: false,
    ...(refs.length === 1 ? { image: refs[0] } : refs.length > 1 ? { image: refs } : {}),
    ...(job.extra ?? {}),
  };
  const reqFile = path.join("out", "seedream_tmp", `${job.id}.req.json`);
  fs.writeFileSync(reqFile, JSON.stringify(body));
  // 用 curl 发请求：会自动遵守系统的代理环境变量
  const { stdout } = await run(
    "curl",
    ["-sS", "-m", "600", ARK_IMAGE_URL, "-H", "Content-Type: application/json", "-H", `Authorization: Bearer ${ARK_API_KEY}`, "--data-binary", `@${reqFile}`],
    { maxBuffer: 64 * 1024 * 1024 }
  );
  fs.rmSync(reqFile);
  let res;
  try {
    res = JSON.parse(stdout);
  } catch {
    throw new Error(`${job.id}: 返回的不是 JSON：${stdout.slice(0, 300)}`);
  }
  if (res.error || !res.data?.[0]?.url) throw new Error(`${job.id}: ${JSON.stringify(res.error ?? res).slice(0, 500)}`);
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  if (fs.existsSync(job.out)) {
    const arch = path.join("out", "plates_archive", `${job.id}_${new Date(fs.statSync(job.out).mtime).toISOString().replace(/[:.]/g, "-")}${path.extname(job.out)}`);
    fs.mkdirSync(path.dirname(arch), { recursive: true });
    fs.renameSync(job.out, arch);
  }
  const raw = job.out.replace(/\.\w+$/, ".src.jpeg");
  await run("curl", ["-sS", "-m", "300", "-o", raw, res.data[0].url]);
  // 统一转成指定格式（jpg），并按任务要求缩放到精确尺寸（与世界坐标一一对应）
  const [w, h] = job.fit ?? [0, 0];
  if (job.key === "green" || job.key === "white") {
    // 绿幕上画的道具 / 白纸上的小画：抠成透明底 PNG
    execFileSync("python3", [path.join("scripts", "chroma-key.py"), raw, job.out, String(w), String(h), ...(job.key === "white" ? ["--white"] : []), ...(job.grade ? [`--grade=${job.grade}`] : [])], { stdio: "inherit" });
  } else execFileSync("python3", [
    "-c",
    "import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');w,h=int(sys.argv[3]),int(sys.argv[4]);im=im.resize((w,h),Image.LANCZOS) if w else im;im.save(sys.argv[2],quality=93)",
    raw,
    job.out,
    String(w),
    String(h),
  ]);
  // 绿幕任务保留原图（out/plates_src/），以后调抠像参数不用重新生成
  if (job.key) {
    fs.mkdirSync(path.join("out", "plates_src"), { recursive: true });
    fs.renameSync(raw, path.join("out", "plates_src", path.basename(raw)));
  } else fs.rmSync(raw);
  const meta = {
    id: job.id,
    model: res.model,
    size_requested: job.size,
    size_returned: res.data[0].size,
    fit: job.fit ?? null,
    refs: job.refs ?? [],
    prompt: job.prompt,
    created: new Date().toISOString(),
    seconds: Math.round((Date.now() - t0) / 1000),
  };
  fs.writeFileSync(job.out.replace(/\.\w+$/, ".json"), JSON.stringify(meta, null, 2) + "\n");
  console.log(`✓ ${job.id}  ${res.data[0].size}  ${meta.seconds}s  → ${job.out}`);
};

// 依赖：refs 里引用了本次也要生成的另一个任务的输出时，等那个任务先完成
const outOf = new Map(JOBS.map((j) => [j.out, j.id]));
const todoIds = new Set(todo.map((j) => j.id));
const depIds = (job) => (job.refs ?? []).map((r) => outOf.get(r)).filter((d) => d && todoIds.has(d));
const pending = new Map(todo.map((j) => [j.id, j]));
const done = new Set();
const failed = new Set();
const LIMIT = 4;
let active = 0;
await new Promise((resolve) => {
  const pump = () => {
    for (const [id, job] of pending) {
      if (active >= LIMIT) break;
      const deps = depIds(job);
      if (deps.some((d) => failed.has(d))) {
        pending.delete(id);
        failed.add(id);
        console.log(`✗ ${id}: 依赖的任务失败，跳过`);
        continue;
      }
      if (!deps.every((d) => done.has(d))) continue;
      pending.delete(id);
      active++;
      console.log(`… ${id}`);
      generate(job)
        .then(() => done.add(id))
        .catch((e) => {
          failed.add(id);
          console.log(`✗ ${e.message}`);
        })
        .finally(() => {
          active--;
          pump();
        });
    }
    if (active === 0) resolve();
  };
  pump();
});
if (failed.size) process.exitCode = 1;
