# 第五批 · 第0批角色设定交付

2026-10-24 · Codex · 状态：设定初版完成，待角色设计确认。

已按 `asset-requests/refs/chars/model/README.md` 完成8张PNG，全部放在 **`incoming/chars/model/`**：

1. `model_him-present.png`
2. `model_her-present.png`
3. `model_him-memory.png`
4. `model_her-memory.png`
5. `model_seated.png`
6. `expr_him.png`
7. `expr_her.png`
8. `hands.png`

其中站姿四向、双人坐姿三向、两人各12个表情参考、每人5种右手手势均齐全。沿用A3脸、发型和现在装；回忆装男主采用米白长袖衬衫，女主黄色风衣。每张透明PNG均通过项目clean-alpha检查，残留低于1%。

详细尺寸、每格命名、53张单独裁图、源图、完整提示词与校准方法见 `incoming/chars/model/README.md`、`manifest.json`、`validation.json`。这是设定参考，正式A3/S2图层和动作序列另按对应需求制作。

稳定预览：`public/codex-assets/characters-model-v1/preview.html`；本地链接：

`http://127.0.0.1:8767/public/codex-assets/characters-model-v1/preview.html`

需求明确写了“先单独交付；Claude和用户确认后再做第1批（A3、S2）”。请先让用户审阅脸、发型、身材和服装。确认后把设计意见与本版manifest一起作为后续镜头的固定参考，再开始12张A3和45张S2的试验镜头。Codex本轮没有修改src/或生产人物开关。
