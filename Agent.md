# Agent.md：Codex 开发指令

你是一个资深全栈工程 Agent。你的任务是开发一个移动端优先的 Web/PWA 产品：哼唱动机捕捉与旋律标准化工具。请严格围绕 MVP，不要把项目膨胀成 DAW。

---

## 0. 项目目标

构建一个可运行的 MVP：

```md
手机/浏览器录音
→ 上传到 FastAPI 后端
→ Basic Pitch 转写为音符
→ 后处理为单声部 Motif
→ 前端 piano roll 显示
→ 用户可修正
→ Tone.js 播放
→ IndexedDB 保存
→ MIDI/JSON 导出
```

核心体验：用户哼唱 5–20 秒，得到一张可编辑旋律卡片。

---

## 1. 最高优先级原则

1. 不做完整 DAW。
2. 不做多轨编曲。
3. 不做复杂和声生成。
4. 不做社交和账号系统。
5. 不做专业五线谱编辑器。
6. 优先让闭环跑通，而不是局部做精。
7. 所有算法必须可测试、可替换。
8. 所有第三方库必须记录许可证。
9. 移动端可用性优先于桌面复杂功能。
10. 内部数据以 Motif JSON 为核心，不以 MIDI 为核心。

---

## 2. 技术栈

### 2.1 Frontend

使用：

- React
- TypeScript
- Vite
- Zustand
- Dexie / IndexedDB
- Tone.js
- @tonejs/midi 或 midi-writer-js
- Canvas 或 SVG 自研 piano roll
- Vitest

不要一开始引入复杂 UI 框架。可以使用 Tailwind，但不要让样式工程压过产品闭环。

### 2.2 Backend

使用：

- Python
- FastAPI
- basic-pitch
- numpy
- pretty_midi 或 mido
- pydantic
- pytest

### 2.3 Monorepo

推荐目录：

```md
motif-capture/
  apps/
    web/
  services/
    api/
  docs/
  Agent.md
  README.md
  THIRD_PARTY_NOTICES.md
```

---

## 3. 先实现的用户路径

必须优先实现这条路径：

```md
打开首页
→ 点击 Record
→ 录音
→ Stop
→ Analyze
→ 得到 notes
→ 进入 Editor
→ 播放
→ 拖动一个错音
→ 再播放
→ Save
→ Library 中出现该 Motif
→ Export MIDI
```

如果这条路径没有跑通，不要开发谱面、AI 变体、账号、云同步、主题皮肤等功能。

---

## 4. 数据模型

在前端定义核心类型。建议文件：

`apps/web/src/domain/motif/types.ts`

```ts
export type PitchNameMode = "letter" | "solfege";

export type MusicKey = {
  tonic: string;
  mode: "major" | "minor" | "unknown";
  confidence: number;
};

export type MotifNote = {
  id: string;
  pitch: number;
  startBeat: number;
  durationBeat: number;
  velocity: number;
  confidence?: number;
  startSec?: number;
  durationSec?: number;
  rawPitch?: number;
};

export type MotifVersion = {
  id: string;
  createdAt: string;
  label: string;
  notes: MotifNote[];
};

export type Motif = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  durationSec: number;
  bpm: number;
  timeSignature: "4/4" | "3/4" | "6/8";
  key?: MusicKey;
  notes: MotifNote[];
  tags: string[];
  source?: {
    type: "recording" | "upload" | "manual";
    audioBlobId?: string;
    engine?: string;
    engineVersion?: string;
  };
  versions: MotifVersion[];
};
```

后端 schema 应与前端保持结构一致。可以手动同步，先不要引入复杂代码生成。

---

## 5. 前端模块

### 5.1 Recorder

路径建议：

```md
apps/web/src/components/recorder/
  RecorderPage.tsx
  RecordButton.tsx
  InputLevelMeter.tsx
  useWavRecorder.ts
  wavEncoder.ts
```

要求：

- 使用 getUserMedia 获取麦克风。
- 输出 mono WAV Blob。
- 录音中显示秒数。
- 显示输入音量。
- Stop 后可试听原始录音。
- 点击 Analyze 调用后端。

注意：

- iOS/移动浏览器音频操作通常要求用户手势触发。
- 不要依赖浏览器一定能直接录 `audio/wav`。
- 如果 MediaRecorder 输出 webm/opus，则第一版后端可能不稳；优先实现自定义 WAV 编码。

### 5.2 Transcription Service

路径建议：

```md
apps/web/src/services/transcription/
  TranscriptionClient.ts
  RemoteBasicPitchClient.ts
  MockTranscriptionClient.ts
```

接口：

```ts
export type TranscriptionOptions = {
  bpm?: number;
  quantizeGrid?: "off" | "1/8" | "1/16" | "1/32";
  forceMonophonic?: boolean;
  keyHint?: string;
};

export interface TranscriptionClient {
  transcribe(file: Blob, options: TranscriptionOptions): Promise<Motif>;
}
```

必须保留 Mock client，便于 UI 不依赖后端开发。

### 5.3 Piano Roll Editor

路径建议：

```md
apps/web/src/components/editor/
  EditorPage.tsx
  PianoRoll.tsx
  PianoRollCanvas.tsx
  NoteBlock.tsx
  NoteInspector.tsx
  EditorToolbar.tsx
```

必须支持：

- 显示 notes。
- 选择 note。
- 拖动 pitch。
- 拖动 startBeat。
- 改 durationBeat。
- 删除 note。
- 新增 note。
- 网格吸附。
- playhead 显示。
- mobile 微调按钮。

第一版可以用 SVG 实现，便于 DOM 事件处理；如果性能不足，再换 canvas。

### 5.4 Playback

路径建议：

```md
apps/web/src/services/playback/
  TonePlayback.ts
  pitch.ts
```

要求：

- 初始化 Tone.js。
- 用户点击播放时启动 AudioContext。
- 将 MIDI pitch 转为 note name。
- 根据 startBeat/durationBeat/bpm 调度播放。
- 支持 stop。
- 支持 loop。
- 播放时更新 playhead。

不要做复杂音色。一个清晰的 synth 即可。

### 5.5 Storage

路径建议：

```md
apps/web/src/services/storage/
  motifDb.ts
  motifRepository.ts
```

要求：

- Dexie 数据库。
- 保存 Motif。
- 更新 Motif。
- 删除 Motif。
- 查询列表。
- 导入/导出 JSON。

### 5.6 Export

路径建议：

```md
apps/web/src/services/export/
  exportMidi.ts
  exportJson.ts
  download.ts
```

要求：

- MIDI 导出可被常见 DAW 识别。
- JSON 导出可被本项目重新导入。
- 文件名包含 motif title 和日期。

### 5.7 Transform

路径建议：

```md
apps/web/src/domain/transforms/
  transpose.ts
  invert.ts
  retrograde.ts
  stretchRhythm.ts
  diatonicize.ts
```

必须测试：

- transpose(notes, semitones)
- invert(notes, axisPitch)
- retrograde(notes, totalBeats)
- stretchRhythm(notes, factor)
- diatonicize(notes, key)

这些函数必须纯函数，不要依赖 UI。

---

## 6. 后端模块

路径建议：

```md
services/api/
  app/
    main.py
    routes/
      health.py
      transcription.py
    schemas.py
    engines/
      basic_pitch_engine.py
    postprocess/
      clean_notes.py
      quantize.py
      key_detect.py
      monophonic.py
    utils/
      files.py
  tests/
```

### 6.1 FastAPI

`GET /api/health`

返回：

```json
{
  "ok": true,
  "engine": "basic-pitch"
}
```

`POST /api/transcribe`

输入：

- multipart file
- bpm optional
- quantizeGrid optional
- forceMonophonic optional
- keyHint optional

输出：

- Motif JSON。

### 6.2 Basic Pitch Engine

实现一个隔离类：

```py
class BasicPitchEngine:
    def transcribe(self, wav_path: str) -> list[RawNote]:
        ...
```

不要让 route 直接写 Basic Pitch 细节。

### 6.3 后处理

必须实现：

- `remove_short_notes`
- `merge_nearby_notes`
- `monophonicize`
- `seconds_to_beats`
- `quantize_notes`
- `detect_key`

后处理参数默认值：

```py
MIN_NOTE_DURATION_SEC = 0.08
MERGE_GAP_SEC = 0.08
CONFIDENCE_THRESHOLD = 0.35
DEFAULT_BPM = 96
DEFAULT_GRID = "1/16"
```

### 6.4 错误处理

错误码：

- `INVALID_AUDIO`
- `TRANSCRIPTION_FAILED`
- `ENGINE_NOT_AVAILABLE`
- `POSTPROCESS_FAILED`

API 不要返回 Python traceback 给前端。

---

## 7. 算法要求

### 7.1 单声部化

输入可能有重叠 note。对于哼唱动机，默认输出单声部：

- 按 start/end 构造时间段。
- 重叠时保留 confidence 高者。
- 若没有 confidence，保留 duration 长者。
- 清理后尽量避免同一 beat 同时出现多个音。

### 7.2 删除碎音

删除：

- duration 小于阈值。
- confidence 过低。
- 被长音包围的极短噪音。

### 7.3 合并

相邻音符合并条件：

- pitch 相同，gap 小于阈值。
- 或 pitch 相差 1 半音，且其中一个极短，视作颤音/滑音噪声。
- 合并后 velocity 取加权平均或最大值。

### 7.4 量化

实现：

```ts
gridToBeat("1/16") = 0.25
gridToBeat("1/8") = 0.5
gridToBeat("1/32") = 0.125
```

量化：

```ts
startBeat = round(startBeat / grid) * grid
durationBeat = max(grid, round(durationBeat / grid) * grid)
```

### 7.5 调性推断

第一版简单即可：

- 统计 pitch class。
- duration 越长权重越高。
- 对 major/minor scale 评分。
- 返回分数最高者。
- 若最高分和第二名差距太小，mode unknown 或 confidence 低。

---

## 8. UI 验收标准

### 8.1 Capture

- 页面有一个明显 Record 按钮。
- 录音时按钮状态变化。
- 录音时显示计时。
- Stop 后可以 Analyze。
- Analyze 时显示 loading。
- 出错时显示可理解错误。
- 成功后进入 Editor。

### 8.2 Editor

- piano roll 能显示至少 20 个 note。
- note 的 pitch 高低视觉正确。
- note 的横向位置和长度视觉正确。
- 拖动 note 后状态更新。
- 播放声音与可视 note 基本一致。
- 保存按钮可用。
- 导出按钮可用。

### 8.3 Library

- 能看到保存过的 motif。
- 能打开 motif。
- 能删除 motif。
- 能搜索 motif。

---

## 9. 测试要求

### 9.1 前端单元测试

必须覆盖：

- pitch number ↔ pitch name。
- sec ↔ beat。
- quantize。
- transpose。
- invert。
- retrograde。
- stretchRhythm。
- JSON import/export。

### 9.2 后端测试

必须覆盖：

- API health。
- postprocess remove_short_notes。
- postprocess merge_nearby_notes。
- monophonicize。
- quantize。
- key_detect 基本案例。

### 9.3 手动测试样例

至少准备：

```md
fixtures/
  humming_c_major_scale.wav
  humming_short_motif.wav
  mock_transcription.json
```

如果没有真实 wav，先用 mock transcription 推 UI。

---

## 10. README 要求

README 必须包含：

- 项目介绍。
- 本地启动前端。
- 本地启动后端。
- 环境变量。
- 如何运行测试。
- 如何录音分析。
- 已知限制。
- 第三方许可证说明。

示例命令可采用：

```bash
pnpm install
pnpm --filter web dev
```

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

## 11. 环境变量

前端：

```env
VITE_API_BASE_URL=http://localhost:8000
```

后端：

```env
MOTIF_TMP_DIR=./tmp
MOTIF_MAX_AUDIO_SECONDS=30
```

---

## 12. 第三方许可证记录

创建 `THIRD_PARTY_NOTICES.md`，至少列出：

- Basic Pitch：Apache-2.0
- Tone.js：MIT
- VexFlow：MIT，如后续使用
- OpenSheetMusicDisplay：BSD-3-Clause，如后续使用
- ONNX Runtime：MIT，如后续使用
- FFmpeg：仅在后续引入时记录，并注明 LGPL/GPL 配置

第一版尽量不要引入 FFmpeg。

---

## 13. 不要做的事

开发过程中禁止主动添加：

- 登录系统。
- 云同步。
- 付费系统。
- 多轨时间线。
- 插件系统。
- 复杂混音器。
- 乐谱出版排版。
- AI 自动完整作曲。
- 社区分享。
- 训练自有模型。

除非用户明确要求，否则不要偏离 MVP。

---

## 14. 推荐实现顺序

严格按以下顺序推进：

1. 建立 monorepo。
2. 前端 mock motif editor。
3. Tone.js 播放 mock notes。
4. Piano roll 拖拽编辑。
5. IndexedDB 保存/打开。
6. JSON 导出/导入。
7. FastAPI health。
8. FastAPI transcribe mock。
9. Basic Pitch 接入。
10. 后处理清理。
11. 前端录音 WAV。
12. 前后端联调。
13. MIDI 导出。
14. PWA polish。
15. README 和许可证整理。

如果中途 Basic Pitch 接入卡住，继续用 mock transcription 完成前端闭环，不要阻塞 UI 和数据模型。

---

## 15. 最小可提交版本

第一个可提交版本必须包含：

- 前端能显示 mock motif。
- 用户能播放。
- 用户能拖动改音高。
- 用户能保存到 IndexedDB。
- 用户能导出 JSON。
- README 能启动。

第二个提交再接后端。不要等全部完成才提交。

---

## 16. 代码质量约束

- TypeScript 禁止 `any`，除非有明确注释。
- Python route 不写业务逻辑，业务逻辑放 service/postprocess。
- 所有纯算法函数要有测试。
- UI 组件不要直接调用 Basic Pitch。
- storage、playback、transcription 都要通过 service 层。
- 不要把 Blob、AudioBuffer、MotifNote 混在一个对象里。
- 不要在全局状态中保存大型音频数据，音频 Blob 单独存储或临时处理。
- 错误信息必须能被用户理解。

---

## 17. Done Checklist

完成任务前检查：

- `pnpm test` 通过。
- 后端 pytest 通过。
- 前端能启动。
- 后端能启动。
- mock path 可用。
- real transcription path 可用或有清晰 fallback。
- 录音失败时有提示。
- 分析失败时有提示。
- 保存后刷新仍存在。
- MIDI/JSON 导出正常。
- README 更新。
- THIRD_PARTY_NOTICES 更新。

---

## 18. 产品口径

界面文案不要承诺“自动作曲”或“完美扒谱”。推荐文案：

- “把哼唱变成可编辑旋律”
- “快速捕捉动机”
- “自动转写可能有误，请拖动修正”
- “保存为可复用的旋律卡片”

不要使用：

- “一键生成神曲”
- “专业级自动扒谱”
- “完美识别所有旋律”
- “替代 DAW”

---

## 19. 后续扩展点

当 MVP 闭环稳定后再考虑：

- Browser-side Basic Pitch。
- ONNX Runtime Web/Mobile。
- OSMD/VexFlow 五线谱预览。
- MusicXML 导出。
- WAV bounce。
- MIDI import。
- 旋律相似搜索。
- 动机版本树。
- 风格化变体。
- 云同步。
