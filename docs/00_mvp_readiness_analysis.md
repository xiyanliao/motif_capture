# MVP 可构建性初步分析

日期：2026-05-12

## 结论

根目录现有的两份总领文档 `Agent.md` 与 `Motif_Capture_PRD.md` 足以支撑 MVP 构建，不需要在根目录额外补充总领性文档。

判断依据：

- 产品边界清楚：核心闭环限定为“哼唱录音 -> 转写 -> 可编辑旋律 -> 播放 -> 保存 -> 导出”，并明确排除 DAW、多轨、账号、云同步、专业谱面等高复杂度能力。
- 技术路线清楚：前端 React/Vite/TypeScript，后端 FastAPI/Python/Basic Pitch，本地 IndexedDB，播放 Tone.js，导出 MIDI/JSON。
- 工程拆分清楚：录音、转写、后处理、编辑器、播放、存储、导出、变体均有模块边界。
- 数据核心清楚：内部以 Motif JSON 为核心，不以 MIDI 为核心。
- 验收标准清楚：Capture、Transcription、Editor、Library、Export 均有可测试结果。
- 风险处理清楚：Basic Pitch 准确率、无伴奏 BPM、移动端音频、谱面复杂度、许可证风险都有处理方向。

## 当前文档的可执行程度

| 维度 | 结论 | 说明 |
| --- | --- | --- |
| MVP 范围 | 可执行 | 两份文档都强调闭环优先，避免 DAW 化。 |
| 用户路径 | 可执行 | `打开 -> Record -> Analyze -> Editor -> 播放 -> 修正 -> Save -> Library -> Export` 已明确。 |
| 前端架构 | 可执行 | 组件、service、domain、storage、export 的路径建议足够落地。 |
| 后端架构 | 可执行 | FastAPI route、engine、postprocess、schema、tests 的边界明确。 |
| 数据模型 | 基本可执行 | Motif/MotifNote/MotifVersion 已定义，后端需对齐同构 schema。 |
| API 契约 | 需统一小差异 | PRD 和 Agent 对响应包裹层命名略有差异，本文件给出实施口径。 |
| 算法 | 可执行 | 单声部化、碎音删除、合并、量化、调性推断均可先用启发式实现。 |
| 测试 | 可执行 | 前后端测试范围明确，适合 mock-first 推进。 |
| 部署 | MVP 可后置 | 已说明前端和后端部署方向；本地开发先完成闭环。 |

## 需要统一的实施口径

这些不是阻塞项，但必须在编码前固定，避免前后端反复改接口。

### 1. MVP 优先级

采用 `Agent.md` 的实现顺序作为开发主线：先用 mock motif 打通前端编辑、播放、保存、导出，再接 FastAPI 和 Basic Pitch。

理由：

- Basic Pitch 安装、模型推理、音频格式会带来不确定性。
- 前端核心价值是“可编辑旋律卡片”，可以先用 mock transcription 验证。
- 后端卡住时不影响 UI、数据模型和本地库开发。

### 2. 转写接口响应

统一 `POST /api/transcribe` 成以下形态：

```json
{
  "ok": true,
  "data": {
    "motif": {}
  },
  "warnings": []
}
```

失败响应：

```json
{
  "ok": false,
  "error": {
    "code": "TRANSCRIPTION_FAILED",
    "message": "Could not transcribe audio",
    "details": {}
  }
}
```

说明：

- `motif` 使用标准 Motif JSON，避免同时出现 `motifDraft`、`motifId`、裸 Motif 多种返回口径。
- Basic Pitch 原始信息放入 `motif.source.engine`、`motif.source.engineVersion`，必要时后续再扩展 `raw`。
- `warnings` 用于承载 `tempo_auto_detect_low_confidence`、`engine_unavailable_using_mock` 等非致命信息。

### 3. 转写参数命名

前后端统一使用：

```ts
type TranscriptionOptions = {
  bpm?: number;
  quantizeGrid?: "off" | "1/8" | "1/16" | "1/32";
  forceMonophonic?: boolean;
  keyHint?: string;
  minNoteDurationMs?: number;
  mergeGapMs?: number;
};
```

默认值：

- `bpm`: `96`
- `quantizeGrid`: `"1/16"`
- `forceMonophonic`: `true`
- `minNoteDurationMs`: `80`
- `mergeGapMs`: `80`

### 4. MVP 中的变体能力

变体函数保留在 domain 层并写单元测试，但 UI 可以先只暴露最小集合：

- 转调。
- 倒影。
- 逆行。
- 节奏缩放。

`diatonicize` 可先实现纯函数和测试，UI 入口后置，避免调性推断不稳定时影响主闭环。

### 5. 音频录制策略

MVP 录音必须优先输出 mono WAV PCM。若移动浏览器录音存在兼容问题：

- 保留上传本地 WAV 的替代入口。
- 保留 MockTranscriptionClient。
- 前端提示用户音频格式或权限问题。

### 6. Basic Pitch 风险策略

后端必须隔离 `BasicPitchEngine`：

- route 不直接依赖 Basic Pitch 细节。
- engine 不可用时返回 `ENGINE_NOT_AVAILABLE`，前端允许切换 mock client。
- postprocess 使用独立纯函数，便于在没有真实模型时测试。

## MVP 成功定义

MVP 完成时，至少满足：

1. 用户能录制或上传 5-20 秒单声部旋律音频。
2. 系统能返回 Motif JSON；真实 Basic Pitch 不稳定时仍有 mock path 可演示完整闭环。
3. Piano roll 能显示、选择、拖动、改长短、删除和新增音符。
4. Tone.js 播放结果与当前 notes 同步。
5. Motif 能保存到 IndexedDB，刷新后仍可打开。
6. Motif 能导出 JSON，并能重新导入。
7. Motif 能导出可被常见 MIDI 工具识别的 `.mid` 文件。
8. README 能说明本地启动前端、后端、测试和已知限制。
9. THIRD_PARTY_NOTICES 记录 Basic Pitch、Tone.js、Dexie、MIDI 库等许可证。

## 不进入 MVP 的内容

以下内容即使 PRD 中提到，也不进入首轮 MVP 主线：

- 账号、云同步、分享。
- 多轨时间线、混音器、插件。
- 专业五线谱编辑。
- MusicXML 导出。
- WAV bounce。
- browser-side Basic Pitch。
- 自动生成完整歌曲。
- 社交与素材市场。

## 建议的工程策略

采用“mock-first + contract-first + real-engine-later”的策略：

1. 先固定 Motif 类型、API 响应和测试 fixtures。
2. 用 mock motif 完成前端编辑、播放、保存、导出。
3. 建 FastAPI health 和 mock transcribe，确认前后端联通。
4. 接入 Basic Pitch，并把所有不稳定性限制在 engine 层。
5. 通过后处理模块把 raw notes 转成标准 Motif。
6. 最后接录音 WAV 和移动端细节。

这样能最早验证产品核心价值，并降低模型、音频格式、移动端权限导致的阻塞。
