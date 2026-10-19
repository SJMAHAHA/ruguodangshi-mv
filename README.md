# 《如果当时》动画 MV — 试片与完整版

Remotion + React + TypeScript。全部画面由代码绘制：SVG 画角色、道具和场景，Canvas 2D 画雨、水珠、花瓣、涟漪、擦除和「化作花瓣」，纸纹是固定种子生成的静态贴图。音轨是原曲的样本级切片，原速、原调、原编曲。

| | 试片 `RuguoPilot` | 完整版 `RuguoFull` |
|---|---|---|
| 原曲区间 | 01:07.290–01:37.290 | 00:00.000–05:14.233（全曲） |
| 帧数 | 900（30.000 s） | 9427（314.233 s） |
| 成片 | `deliverables/ruguodangshi_pilot_1080p.mp4` | [Releases 页面下载](../../releases)（262 MB，超过 GitHub 单文件上限，不在仓库里） |
| 关键帧联系表 | `deliverables/contact_sheet.jpg` | `deliverables/full_contact_sheet.jpg` |
| 分镜 | `docs/storyboard.md` | `docs/full-storyboard.md` |

两者都是 1920×1080、30 fps、H.264（yuv420p，BT.709）+ AAC 48 kHz。完整版把试片原样嵌在帧 2019–2919（第三幕）。

![完整版关键帧](deliverables/full_contact_sheet.jpg)

> 歌曲《如果当时》（词曲：许嵩）的版权归原作者所有。仓库里不包含原曲音频文件；成片中的音轨仅用于展示这部同人动画习作。
制作说明（截取理由、镜头与音乐的对应、设计选择、检查中修正的问题、仍需改进）：`docs/production-notes.md`。

## 环境

- Node.js `^20.19 || ^22.13 || >=24`，npm（依赖版本已写死，并保留 `package-lock.json`）
- ffmpeg / ffprobe ≥ 6（准备音轨、拼接与封装成片；4.x 的 concat 会让分段拼接产生音画漂移，见 `scripts/finalize-full.sh`）
- 渲染时 Remotion 会自动下载 Chrome Headless Shell。离线环境可以指定本机浏览器：
  `REMOTION_BROWSER=/path/to/chrome npm run render`

## 安装与准备音轨

```bash
cd ruguodangshi-pilot
npm ci
npm run prepare-audio   # 从 ../downloads/BV1JA41147Qo/*.m4a 生成试片与全曲 WAV（约 60 MB，不放进仓库）
# 原曲放在别处时：bash scripts/prepare-audio.sh /path/to/如果当时.m4a
```

## 预览

```bash
npm run dev            # Remotion Studio：RuguoPilot / RuguoFull / dev/CharacterSheet
```

## 渲染

```bash
# 试片
npm run render:preview        # 960×540 带音轨测试片
npm run render                # 1080p → deliverables/ruguodangshi_pilot_1080p.mp4

# 完整版
npm run render:full:preview   # 960×540 带音轨测试片 → out/full_preview_960x540.mp4
npm run render:full           # 1080p 分段渲染（out/segs/，可中断续跑）→ 拼接 → 用原曲 WAV 封装
                              # → deliverables/ruguodangshi_full_1080p.mp4
bash scripts/render-full-segments.sh 0 4999      # 也可以只渲一段，在另一台机器上渲其余部分，
bash scripts/render-full-segments.sh 5000 9426   # 把 out/segs/ 合到一起后运行 npm run finalize:full

# 检查
node scripts/stills.mjs out/check 4800,6290,9290 3 0.5 RuguoFull   # 多帧检查联系表
python3 scripts/contact-sheet-full.py deliverables/ruguodangshi_full_1080p.mp4 deliverables/full_contact_sheet.jpg
```

`finalize-full.sh` 会先检查各段首尾相接、总数正好 9427 帧，再拼接；所有段必须用脚本里写死的同一组编码参数。

## 改哪里

| 想改的东西 | 文件 |
|---|---|
| 完整版镜头切点（以原曲秒为单位）| `src/full/timeline.ts` |
| 完整版歌词字幕时间 | `src/full/lyrics.ts`（核对记录见 `analysis/full-lyrics-timing.md`） |
| 完整版各幕的镜头 | `src/full/acts/Act1.tsx`（黄昏）… `Act11.tsx`（尾声），镜头表 `src/full/shots.tsx` |
| 试片的截取、切点、字幕 | `src/config/timeline.ts`，镜头在 `src/shots/S1Glass.tsx` … `S5EmptySeat.tsx` |
| 色板 | `src/config/palette.ts` |
| 人物服装与回忆配色 | `src/characters/designs.ts` |
| 人物骨架（正面坐/起身、侧面行走、背面） | `src/characters/front.tsx`、`walk.tsx`、`back.tsx`、`head.ts` |
| 公交站与旧街（含黄昏/黎明/回忆白天） | `src/env/Alley.tsx`、`src/env/BusStop.tsx`、`src/env/AlleyStrip.tsx` |
| 月下渡口、河灯 | `src/env/Waterside.tsx`、`src/env/Lantern.tsx` |
| 雨、水珠、涟漪 / 花瓣 / Canvas 绘制 | `src/fx/rain.ts`、`src/fx/petals.ts`、`src/fx/shapesCanvas.ts` |
| 字幕样式与字体 | `src/ui/Subtitles.tsx`、`src/ui/fonts.ts` |

## 确定性

所有运动都只由 `useCurrentFrame()` 计算。Canvas 层在 `useLayoutEffect` 里按当前帧重画，不保存跨帧状态（「化作花瓣」用的离屏画布每帧清空重画）；随机数都来自 `src/lib/random.ts` 的固定种子；SVG 滤镜噪声使用固定 `seed`，纹理跟着物体移动，不会逐帧闪烁。项目里没有计时器、`requestAnimationFrame` 或 CSS 动画。字体在渲染前由 `@remotion/fonts` 加载完成。

## 字体

- 字幕、书页：思源宋体（Noto Serif CJK SC）子集，只含用到的字。SIL Open Font License，见 `public/fonts/LICENSE-NotoSerifCJK-OFL.txt`。
- 手写（本子、雾玻璃、河灯）：霞鹜文楷（LXGW WenKai）子集。SIL Open Font License，见 `public/fonts/LICENSE-LXGWWenKai-OFL.txt`。
