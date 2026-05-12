# MVP 分步骤构建计划

日期：2026-05-12

## 目标

构建一个移动端优先的 Web/PWA MVP，让用户完成：

```md
录音或上传音频
-> 转写为 Motif notes
-> piano roll 编辑
-> Tone.js 播放
-> IndexedDB 保存
-> JSON/MIDI 导出
```

## 阶段 0：工程骨架与契约

目标：让项目具备可持续开发的基本形态。

任务：

1. 创建 monorepo 目录：
   - `apps/web`
   - `services/api`
   - `docs`
2. 创建 Vite + React + TypeScript 前端。
3. 创建 FastAPI 后端。
4. 统一 Motif 数据模型文档和前后端 schema。
5. 建立基础 lint/test 命令。
6. 创建 `THIRD_PARTY_NOTICES.md` 初版。
7. 创建 README 初版，写明本地启动命令。

验收：

- 前端能启动空页面。
- 后端 `GET /api/health` 返回成功。
- 前后端测试命令可运行。
- Motif 类型和 API 响应契约已落地。

建议提交点：`chore: scaffold motif capture monorepo`

## 阶段 1：Mock Motif 编辑闭环

目标：不依赖后端，先验证“旋律卡片可看、可改、可听”。

任务：

1. 实现 `apps/web/src/domain/motif/types.ts`。
2. 准备 `fixtures/mock_transcription.json`。
3. 实现 Editor 页面基础布局。
4. 实现 SVG piano roll：
   - notes 显示。
   - pitch 纵向映射。
   - beat 横向映射。
   - 网格和小节线。
5. 实现 note 选择。
6. 实现拖动改 pitch。
7. 实现拖动改 startBeat。
8. 实现右边缘拖动改 durationBeat。
9. 实现新增和删除音符。
10. 实现移动端微调按钮。

验收：

- mock motif 至少 20 个 notes 能正确显示。
- 拖动后 Motif state 更新。
- 新增、删除、改长短可用。
- 移动端窄屏不遮挡核心操作。

建议提交点：`feat(web): add mock piano roll editor`

## 阶段 2：播放与变换纯函数

目标：让当前编辑结果可即时试听，并让核心音乐算法可测试。

任务：

1. 实现 `TonePlayback`：
   - init/start/stop。
   - 按 `bpm` 调度 note。
   - playhead 更新。
   - loop 支持。
2. 实现 pitch 工具：
   - MIDI number 转音名。
   - 音名显示模式预留。
3. 实现纯函数：
   - `quantizeNotes`
   - `transpose`
   - `invert`
   - `retrograde`
   - `stretchRhythm`
4. 为以上函数写 Vitest。

验收：

- 播放声音与画面 note 基本一致。
- 修改 notes 后再次播放能反映最新状态。
- 纯函数测试通过。

建议提交点：`feat(web): add playback and motif transforms`

## 阶段 3：本地保存与导出

目标：让 Motif 成为可持久化、可交换的素材。

任务：

1. 用 Dexie 创建 IndexedDB：
   - motifs store。
   - audio blobs store 可后置或先预留。
2. 实现 `motifRepository`：
   - save。
   - update。
   - list。
   - get。
   - delete。
   - duplicate。
3. 实现 Library 页面：
   - 卡片列表。
   - 搜索。
   - 打开编辑。
   - 删除。
4. 实现 JSON 导出和导入。
5. 实现 MIDI 导出。

验收：

- 保存后刷新页面仍能看到 Motif。
- Library 能打开已保存 Motif。
- JSON 导出后可重新导入恢复。
- MIDI 文件可被常见播放器或 DAW 识别。

建议提交点：`feat(web): persist and export motifs`

## 阶段 4：后端 Mock Transcription

目标：先打通前后端接口，不被 Basic Pitch 阻塞。

任务：

1. 实现 FastAPI app 结构：
   - `app/main.py`
   - `app/routes/health.py`
   - `app/routes/transcription.py`
   - `app/schemas.py`
2. 实现 `GET /api/health`。
3. 实现 `POST /api/transcribe` mock path：
   - 接收 multipart file。
   - 读取参数。
   - 返回标准 API 响应 `{ ok, data: { motif }, warnings }`。
4. 前端实现 `TranscriptionClient` 抽象：
   - `MockTranscriptionClient`
   - `RemoteBasicPitchClient`
5. Capture 页面先支持上传音频并调用 mock 后端。

验收：

- 前端能调用后端 `POST /api/transcribe`。
- 后端返回标准 Motif。
- 前端收到 Motif 后进入 Editor。
- 失败响应能显示可理解错误。

建议提交点：`feat(api): add transcription contract and mock route`

## 阶段 5：Basic Pitch 与后处理

目标：把真实音频转成可编辑 Motif。

任务：

1. 接入 `BasicPitchEngine`：
   - engine 类隔离模型调用。
   - route 不直接写模型逻辑。
2. 抽取 raw note events。
3. 实现 postprocess：
   - `remove_short_notes`
   - `merge_nearby_notes`
   - `monophonicize`
   - `seconds_to_beats`
   - `quantize_notes`
   - `detect_key`
4. 实现后端 pytest：
   - health。
   - remove short notes。
   - merge nearby notes。
   - monophonicize。
   - quantize。
   - key detect 基础案例。
5. 准备最小 fixtures：
   - `mock_transcription.json`
   - 至少一个短 wav，若暂缺则在 README 标明。

验收：

- 后端能接收 WAV 并返回 note events。
- 输出不出现大量重叠音。
- 每个 note 至少包含 pitch、startBeat、durationBeat、velocity。
- Basic Pitch 不可用时返回 `ENGINE_NOT_AVAILABLE`，前端不崩溃。

建议提交点：`feat(api): add basic pitch transcription pipeline`

## 阶段 6：前端录音 WAV

目标：完成从手机/浏览器录音进入转写的真实入口。

任务：

1. 实现 `useWavRecorder`：
   - getUserMedia。
   - AudioContext。
   - mono buffer。
   - WAV PCM 编码。
2. 实现录音状态：
   - idle。
   - recording。
   - recorded。
   - analyzing。
   - failed。
3. 实现输入音量条。
4. Stop 后支持试听原始录音。
5. Analyze 上传 WAV。
6. 处理权限失败、音量过小、音量过大、上传失败。

验收：

- 浏览器可录制 5-20 秒音频。
- Stop 后可试听。
- Analyze 后进入 Editor。
- 录音或分析失败有明确提示。

建议提交点：`feat(web): add wav recorder and analyze flow`

## 阶段 7：端到端闭环与 PWA 收尾

目标：把所有模块串成可验收 MVP。

任务：

1. 串联完整路径：
   - Capture。
   - Analyze。
   - Editor。
   - Playback。
   - Save。
   - Library。
   - Export。
2. 补齐 loading、empty、error 状态。
3. 补 PWA manifest 和基础移动端适配。
4. 更新 README：
   - 前端启动。
   - 后端启动。
   - 测试。
   - 录音分析。
   - 已知限制。
5. 更新 `THIRD_PARTY_NOTICES.md`。
6. 做手动验收。

验收：

- 用户路径完整跑通。
- `pnpm test` 通过。
- `pytest` 通过。
- 保存后刷新仍存在。
- JSON/MIDI 导出正常。
- README 能指导本地启动。

建议提交点：`feat: complete mvp capture to export loop`

## 推荐开发顺序

严格按以下顺序推进：

1. 工程骨架与契约。
2. Mock Motif 编辑闭环。
3. 播放与纯函数测试。
4. IndexedDB 保存、Library、JSON/MIDI 导出。
5. FastAPI mock transcribe。
6. Basic Pitch 与后处理。
7. 前端 WAV 录音。
8. 端到端联调与 PWA 收尾。

## 风险闸门

每个风险都要有 fallback，避免阻塞 MVP。

| 风险 | 触发条件 | fallback |
| --- | --- | --- |
| Basic Pitch 安装或推理失败 | 后端无法真实转写 | 保留 mock transcribe，先完成前端闭环。 |
| 移动端录音不稳定 | iOS/Android 录音失败 | 支持上传 WAV，保留桌面录音验证。 |
| 无伴奏 BPM 不可靠 | 自动节奏错位 | 默认 BPM 96，允许用户手动调整。 |
| 转写碎音过多 | piano roll 难以编辑 | 默认单声部化、删除碎音、合并邻近音。 |
| MIDI 兼容问题 | DAW 无法打开 | 增加导出测试 fixture，核查 ticks/tempo/note off。 |

## MVP 总验收清单

- Capture 页面可录音或上传。
- 后端 health 可用。
- 后端 transcribe 可返回 Motif。
- Mock transcription path 始终可用。
- Editor 可显示和编辑 notes。
- Playback 可听到当前 notes。
- Library 可保存、打开、删除。
- JSON 可导出和导入。
- MIDI 可导出并被外部工具识别。
- 前端核心纯函数有测试。
- 后端 postprocess 有测试。
- README 和许可证文件更新。

## 首轮不做

- 登录、账号、云同步。
- 多轨、混音、插件。
- 专业五线谱编辑。
- MusicXML、WAV bounce。
- Browser-side Basic Pitch。
- AI 生成完整歌曲。
- 社交分享。
