# PRD：哼唱动机捕捉与旋律标准化工具

版本：v0.1  
产品代号：Motif Capture  
目标形态：移动端优先的 Web/PWA，后续可封装为 iOS/Android  
核心原则：不是 DAW，不是录音笔，不是完整作曲软件，而是“10 秒动机从哼唱到可编辑旋律，快速完成闭环”。

---

## 1. 产品判断

### 1.1 是否可快速实现

结论：可以快速实现一个有用的 MVP，但不能一开始承诺“高度准确的自动作曲/自动扒谱/完整编曲”。

这个产品的第一版不是算法研究项目，而是一个工程整合项目。核心能力可以由现成组件承担：

- 录音：浏览器 Web Audio / MediaRecorder / 自定义 WAV 录制。
- 哼唱转 MIDI：Spotify Basic Pitch，优先以后端 Python 路线接入，后续探索 TypeScript/browser 本地推理。
- 播放：Tone.js。
- 编辑：自研 piano roll。
- 存储：IndexedDB，本地优先。
- 导出：MIDI、JSON 优先，MusicXML 次之，WAV 后置。
- 谱面：第一版可以先不上完整五线谱；第二版再接 OSMD/VexFlow。

真正难的不是“把声音变成一串音符”，而是把机器转写出的混乱结果变成“人能快速修正、听懂、保存、发展”的动机对象。第一版要把精力集中在这个中间层：清理、量化、手动修正、播放、保存、生成简单变体。

### 1.2 快速实现的边界

可以快速实现：

- 手机录大约 5–20 秒哼唱。
- 上传或本地处理为音符事件。
- piano roll 显示音高、起点、时值。
- 一键清理碎音。
- 一键量化节奏。
- 手动拖动音高与长度。
- 播放试听。
- 保存为动机卡片。
- 导出 MIDI / JSON。
- 简单变体按钮：转调、倒影、节奏压缩、扩张。

不应该放进第一版：

- 多轨编曲。
- 音色市场。
- 完整 DAW 时间线。
- 高质量自动和声。
- 专业级五线谱排版。
- 自动生成完整歌曲。
- 复杂账号系统。
- 社交分享。
- AI 版权/风格模仿系统。
- 实时边唱边出谱。

---

## 2. 用户与核心场景

### 2.1 目标用户

第一优先用户：

- 有音乐灵感但不一定有绝对音感的人。
- 会哼旋律、会弹一点乐器、但不熟练扒谱的人。
- 想把“脑中的音乐动机”快速变成可见、可改、可复用材料的人。

第二优先用户：

- 独立游戏/galgame/短视频/播客创作者。
- 会一点吉他/钢琴/编曲，但不想打开完整 DAW 的人。
- 创作型写作者、游戏设计者，用音乐动机构建角色/场景气质。

非目标用户：

- 专业录音棚工程师。
- 需要完整混音母带的人。
- 需要严肃出版社级乐谱排版的人。
- 以多轨编曲为第一需求的人。

### 2.2 核心用户故事

作为一个用户，当我突然想到一个 10 秒旋律时，我希望打开手机网页，按住录音，哼唱，松开后看到旋律的音符形状。我可以快速修正明显错音，按播放试听，保存为一张动机卡片。之后我可以把它导出成 MIDI，或者生成几个变体继续发展。

### 2.3 核心闭环

```md
打开应用
→ 点击录音
→ 哼唱 5–20 秒
→ 自动转为 note events
→ piano roll 展示
→ 一键清理/量化
→ 手动拖动修正
→ 播放试听
→ 保存动机
→ 导出 MIDI 或生成变体
```

### 2.4 成功标准

MVP 的成功不是“100% 准确转写”，而是：

- 用户不再只得到一段孤立录音。
- 用户能在一个界面看到旋律的“形状”。
- 用户能在很短路径内修掉错音。
- 用户能立即听到修正结果。
- 用户能保存为结构化素材，而不是散乱文件。
- 用户愿意把它当作灵感入口，而不是完整 DAW 替代品。

---

## 3. 产品定位

### 3.1 一句话定位

把哼唱灵感转成可编辑、可播放、可复用的旋律卡片。

### 3.2 差异化

传统录音笔的问题：只能保存声音，不能直接编辑旋律对象。  
传统 DAW 的问题：功能强但启动重、界面复杂，不适合捕捉突发灵感。  
传统扒谱工具的问题：输出结果通常需要跳到别的软件里修。  
本产品的价值：从“声音”到“动机对象”的短闭环。

### 3.3 产品不做什么

- 不做完整编曲。
- 不做混音。
- 不做录音工程。
- 不做社交平台。
- 不做大型曲库。
- 不做风格克隆。
- 不追求第一版自动生成完整可商用成曲。

---

## 4. 信息架构

### 4.1 页面结构

MVP 页面：

1. 首页 / Capture
2. 分析结果 / Editor
3. 动机库 / Library/ Motif Detail
4. 设置 / Settings

### 4.2 首页 / Capture

功能：

- 录音按钮。
- 录音时长显示。
- 输入音量指示。
- 录音完成后自动进入分析。
- 支持选择本地音频文件。
- 支持重录。
- 显示建议：请哼单声部旋律，避免背景音乐。

状态：

- Idle：等待录音。
- Recording：录音中。
- Recorded：录音完成。
- Uploading/Analyzing：处理中。
- Failed：失败，可重试。

### 4.3 Editor

核心区域：

- 顶部：动机名称、保存、导出。
- 中部：piano roll。
- 底部：播放控制、量化、清理、变体。
- 侧边/抽屉：调性、BPM、拍号、显示模式。

必须能力：

- 每个音符可选择。
- 拖动上下改变音高。
- 拖动左右改变起点。
- 拖动边缘改变长度。
- 删除音符。
- 新增音符。
- 播放全部。
- 从选中位置播放。
- 撤销/重做。

辅助显示：

- 音名：C4、D#4。
- 简谱：1、2、3、4、5、6、7。
- 小节线。
- 网格。
- 当前播放头。

### 4.4 Library

动机库以卡片展示：

- 名称。
- 创建时间。
- 时长。
- 调性。
- BPM。
- 标签。
- 小型旋律轮廓预览。
- 最近播放按钮。
- 打开编辑按钮。

支持：

- 搜索名称。
- 标签筛选。
- 按时间排序。
- 删除。
- 复制。
- 导出。

### 4.5 Settings

MVP 设置：

- 默认 BPM。
- 默认量化网格：1/8、1/16、1/32。
- 默认调性：自动/手动。
- 音名显示：固定唱名/首调简谱/英文字母。
- 后端地址。
- 数据导入/导出。
- 清空本地数据。

---

## 5. 功能需求

### 5.1 录音

#### 5.1.1 录音入口

用户点击或按住录音按钮开始录音。

#### 5.1.2 录音格式

MVP 推荐在前端生成 WAV PCM：

- sample rate：使用浏览器 AudioContext 原始采样率，上传前可重采样到 22050 或 44100。
- channel：mono。
- bit depth：16-bit PCM。

理由：

- 后端 Basic Pitch 更容易处理 WAV。
- 避免第一版引入 FFmpeg 合规与部署复杂度。
- 避免移动浏览器 MediaRecorder 输出格式不统一。

#### 5.1.3 输入质量提示

录音时显示音量条：

- 太小：提示“声音太小”。
- 爆音：提示“声音过大”。
- 正常：显示绿色状态。

第一版不需要复杂降噪，只做基本音量检测。

### 5.2 Audio-to-MIDI

#### 5.2.1 处理路线

MVP 推荐：

```md
Frontend WAV
→ FastAPI /transcribe
→ Basic Pitch
→ raw note events
→ melody cleaning
→ normalized motif JSON
→ frontend editor
```

后续路线：

```md
Frontend WAV/AudioBuffer
→ @spotify/basic-pitch
→ browser-side inference
→ local motif JSON
```

#### 5.2.2 后端接口

`POST /api/transcribe`

输入：

- multipart/form-data
- file: wav
- optional:
  - userBpm
  - quantizeGrid
  - forceMonophonic
  - keyHint
  - minNoteDurationMs
  - mergeGapMs

输出：

```json
{
  "motifId": "temp_...",
  "durationSec": 10.5,
  "bpm": 96,
  "timeSignature": "4/4",
  "key": {
    "tonic": "C",
    "mode": "major",
    "confidence": 0.62
  },
  "notes": [
    {
      "id": "n1",
      "pitch": 60,
      "pitchName": "C4",
      "startSec": 0.25,
      "durationSec": 0.5,
      "velocity": 0.72,
      "confidence": 0.81,
      "source": "basic-pitch"
    }
  ],
  "warnings": [
    "tempo_auto_detect_low_confidence"
  ],
  "raw": {
    "engine": "basic-pitch",
    "engineVersion": "..."
  }
}
```

#### 5.2.3 单声部化

因为目标是哼唱动机，第一版默认强制单声部。处理策略：

- 如果同一时间段有多个音符，保留 confidence 更高或持续时间更长的音符。confidence 不是音乐学概念，而是系统内部用于提示“这段转写有多可信”的工程指标，取值 0~1；第一版可以先用启发式算法估算，后续再根据用户手动修正数据校准。
- 若两个音符明显重叠，短且低置信度者删除。
- 可保留 raw result 以便后续高级模式使用。

### 5.3 清理算法

清理层是核心自研价值。

#### 5.3.1 删除碎音

删除满足以下条件之一的音符：

- duration < minNoteDurationMs，默认 80ms。
- confidence < threshold，默认 0.35。
- 位于相邻强音之间且时值极短，判断为过渡噪声。

#### 5.3.2 合并相邻音

如果两个音符：

- pitch 相同，或相差 1 个半音但疑似 vibrato/滑音；
- gap < mergeGapMs，默认 80ms；
- 前后方向连续；

则合并为一个音符，起点取前者，终点取后者。

#### 5.3.3 音高吸附

对每个音符 pitch 取最近半音。保留 rawPitch 或 pitchBend 信息用于后续高级模式，但 MVP 编辑对象使用整数 MIDI pitch。

#### 5.3.4 滑音处理

哼唱中常有滑音。MVP 不做复杂滑音曲线编辑。策略：

- 如果连续多个短音形成单向滑动，保留主落点音。
- 若滑音明显具有表达性，保留为 pitchBendHint，但 piano roll 仍以主音显示。
- UI 可在音符上显示“滑音来源”小标记。

#### 5.3.5 节奏量化

MVP 支持：

- 不量化。
- 1/8。
- 1/16。
- 1/32。

量化内容：

- startSec → beat grid。
- durationSec → beat grid。
- 保证最小时值不低于一个 grid。
- 保留 humanized 原始数据，用于撤销。

#### 5.3.6 调性推断

 简化策略：

- 统计 pitch class 权重。
- 结合时值与强拍权重。
- 对 24 个候选调式（12 major + 12 minor）评分。
- 输出最高分与 confidence。
- 低置信度时不强行给调性，显示“未确定”。

### 5.4 编辑

#### 5.4.1 Piano Roll

Piano roll 是 MVP 的主编辑器。

坐标：

- X 轴：时间 / beat。
- Y 轴：MIDI pitch。
- 音符块：startBeat、durationBeat、pitch。

交互：

- 单击选择。
- 拖动移动。
- 上下拖动改音高。
- 左右拖动改时间。
- 拖动右边缘改时值。
- 双击空白处新增音符。
- 双击已存在音符删除。
- 顶部小撤销键和小重做键。

移动端：

- 点按选择。
- 拖动音符移动。
- 长按打开菜单。
- 边缘拖拽区域要足够大。
- 提供“微调按钮”：上移/下移半音、左移/右移一格、加长/缩短一格。

#### 5.4.2 音名与简谱

音符块上显示：

- 英文音名：C4、D4。
- 或首调简谱：1、2、3。
- 若调性不明确，简谱显示关闭或用 C 大调临时映射。

#### 5.4.3 播放

播放功能：

- 播放/暂停。
- 停止。
- 从头播放。
- Loop。
- 速度调整：0.5x、0.75x、1x、1.25x。
- 音色：MVP 只需一个简单 synth 或 piano-like synth。

实现：

- Tone.js Transport 或直接 schedule notes。
- 每个 note 按 pitch + start + duration 播放。
- 播放时显示 playhead。

### 5.5 变体生成

MVP 只做确定性变体，不做生成式 AI。

#### 5.5.1 转调

用户选择上移/下移半音或指定目标调。所有音符 pitch 加减 semitone。

#### 5.5.2 倒影

围绕 axisPitch 倒影：

```md
newPitch = axisPitch - (oldPitch - axisPitch)
```

axis 默认使用调性主音附近的中轴音，或用户选中一个音符作为轴。

#### 5.5.3 逆行

按总时长反转时间：

```md
newStart = totalDuration - oldStart - oldDuration
```

#### 5.5.4 节奏压缩/扩张

所有 startBeat 与 durationBeat 乘以 factor：

- 压缩：0.5。
- 扩张：2。
- 微调：0.75、1.25。

#### 5.5.5 调内化

将音符吸附到当前调式音阶。跑出调外的音移动到最近调内音。保留原始版本，可撤销。

### 5.6 保存

保存位置：

- MVP：IndexedDB。
- 可导出整个库 JSON。
- 后续：登录账号 + 云同步。

Motif 对象：

```ts
type Motif = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  durationSec: number;
  bpm: number;
  timeSignature: "4/4" | "3/4" | "6/8";
  key?: {
    tonic: string;
    mode: "major" | "minor" | "unknown";
    confidence: number;
  };
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

type MotifNote = {
  id: string;
  pitch: number;
  startBeat: number;
  durationBeat: number;
  startSec?: number;
  durationSec?: number;
  velocity: number;
  confidence?: number;
  lyric?: string;
  rawPitch?: number;
};
```

### 5.7 导出

MVP：

- MIDI。
- Motif JSON。
- WAV 播放渲染可后置。

v1.1：

- MusicXML。
- PNG 旋律卡片。
- WAV bounce。
- Ableton/DAW 友好 MIDI 文件命名。

### 5.8 谱面显示

MVP 不把五线谱作为主编辑器。原因：

- 五线谱编辑复杂度高。
- 手机上五线谱拖拽体验不如 piano roll。
- MusicXML 导出需要节拍、连音、休止符处理，第一版容易拖慢。

推荐阶段：

- v0：piano roll + 音名/简谱。
- v0.2：简单五线谱预览，只读。
- v1：MusicXML 导出 + OSMD 渲染预览。
- v2：谱面级编辑。

---

## 6. 非功能需求

### 6.1 性能

目标：

- 录音后分析过程有明确进度反馈。
- 10–20 秒音频可接受。
- 编辑器拖拽不卡顿。
- 动机库 1000 条以内可正常使用。


### 6.2 离线

MVP：

- 已保存动机可离线查看和播放。
- 转写依赖后端，不保证离线。

后续：

- browser-side Basic Pitch / ONNX Runtime Web。
- 完整离线 PWA。

### 6.3 兼容性

目标浏览器：

- Chrome Android。
- Safari iOS。
- Chrome Desktop。
- Edge Desktop。

移动端优先，但开发阶段允许桌面浏览器调试。

### 6.4 可维护性

要求：

- TypeScript。
- 清晰数据模型。
- 转写引擎接口抽象。
- 清理算法独立模块。
- UI 与算法解耦。
- 单元测试覆盖 transform、quantize、cleaning。

---

## 7. 技术方案

### 7.1 推荐栈

Frontend：

- React + TypeScript + Vite
- Zustand 或 Redux Toolkit
- IndexedDB + Dexie
- Tone.js
- @tonejs/midi 或 midi-writer-js
- Canvas/SVG 自研 piano roll
- Tailwind 可选

Backend：

- Python FastAPI
- basic-pitch
- pretty_midi 或 mido
- numpy
- uvicorn
- pydantic

Dev：

- pnpm
- pytest
- vitest
- Playwright 可后置

### 7.2 目录结构

```md
motif-capture/
  apps/
    web/
      src/
        app/
        components/
          recorder/
          editor/
          library/
          transport/
        domain/
          motif/
          music/
          transforms/
          quantize/
          cleaning/
        services/
          transcription/
          storage/
          playback/
          export/
        styles/
        tests/
  services/
    api/
      app/
        main.py
        routes/
        transcription.py
        schemas.py
        engines/
          basic_pitch_engine.py
        postprocess/
          cleaning.py
          quantize.py
          key_detect.py
      tests/
  docs/
    PRD.md
    API.md
    DATA_MODEL.md
  Agent.md
  README.md
```

### 7.3 前后端职责

Frontend：

- 录音。
- WAV 编码。
- 调用转写接口。
- 展示和编辑 motif。
- 播放。
- 保存。
- 导出。

Backend：

- 接收音频。
- 调用 Basic Pitch。
- 抽取音符。
- 清理和量化初版。
- 返回标准 motif JSON。

后续可把 cleaning/quantize 迁移到前端，以便用户在本地反复调整参数。

### 7.4 转写引擎抽象

```ts
interface TranscriptionEngine {
  transcribe(input: AudioBlob, options: TranscriptionOptions): Promise<MotifDraft>;
}
```

实现：

- `RemoteBasicPitchEngine`
- `BrowserBasicPitchEngine`，后续。
- `MockTranscriptionEngine`，用于测试和 UI 开发。

### 7.5 清理与量化模块

这些模块必须可单独测试：

- `removeShortNotes(notes, minDuration)`
- `mergeNearbyNotes(notes, mergeGap, pitchTolerance)`
- `monophonicize(notes)`
- `quantizeNotes(notes, bpm, grid)`
- `detectKey(notes)`
- `convertSecToBeat(notes, bpm)`
- `convertBeatToSec(notes, bpm)`

### 7.6 导出模块

MVP MIDI 导出：

- 将 MotifNote 转成 MIDI note events。
- tempo 写入 MIDI header。
- pitch 使用 MIDI number。
- velocity 0–127。
- start/duration 使用 ticks。

JSON 导出：

- 直接导出 Motif 对象。
- 包含版本号，便于未来迁移。

---

## 8. API 设计

### 8.1 `POST /api/transcribe`

请求：

```http
POST /api/transcribe
Content-Type: multipart/form-data
```

Form fields：

- `file`: WAV file
- `bpm`: optional number
- `quantizeGrid`: optional string
- `forceMonophonic`: optional boolean
- `keyHint`: optional string

响应：

```json
{
  "ok": true,
  "data": {
    "motifDraft": {}
  }
}
```

失败：

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

### 8.2 `GET /api/health`

响应：

```json
{
  "ok": true,
  "engine": "basic-pitch",
  "version": "..."
}
```

---

## 9. UI 需求

### 9.1 视觉原则

- 手机单手可用。
- 录音按钮大。
- 编辑器不做复杂菜单。
- 主色强调“捕捉灵感”而非“专业软件”。
- 信息层级：听、看、改、存。

### 9.2 Capture 页面布局

```md
[标题：捕捉动机]

[大圆形录音按钮]

00:08.2
输入音量条

提示：哼一个单声部旋律，尽量避开背景音乐。

[上传音频]
[最近动机]
```

### 9.3 Editor 页面布局

```md
[名称] [保存] [导出]

[调性 C major] [BPM 96] [Grid 1/16]

[piano roll editor]

[播放] [Loop] [清理] [量化] [变体]

[底部抽屉：音符详情 / 简谱 / 版本]
```

### 9.4 Library 页面布局

```md
[搜索动机]

[卡片]
标题
C major · 96 BPM · 8.5s
小型轮廓图
[播放] [编辑] [导出]
```

---

## 10. 版本规划

### 10.1 v0：可用闭环

目标：从录音到可编辑动机闭环跑通。

范围：

- Web/PWA 基础框架。
- 录音并生成 WAV。
- 上传后端 Basic Pitch。
- 返回 notes。
- Piano roll 显示。
- 播放。
- 手动修正。
- 保存 IndexedDB。
- 导出 JSON/MIDI。
- 基础清理：碎音删除、合并、单声部化、量化。
- 简单变体：转调、倒影、逆行、节奏缩放。

### 10.2 v0.1：体验增强

- 更好的移动端拖拽。
- 撤销/重做。
- 小型旋律轮廓预览。
- 标签。
- 调性推断更稳。
- 录音质量检测。

### 10.3 v0.2：谱面预览

- VexFlow/OSMD 只读五线谱预览。
- 简谱显示改进。
- MusicXML 导出初版。

### 10.4 v1：产品化

- 本地推理探索。
- 账号和云同步。
- 音频不上传模式。
- 更可靠的 vocal/humming 清理。
- 变体模板。
- MIDI 导入。
- 批量导出。

---

## 11. 验收标准

### 11.1 Capture 验收

- 用户能在手机浏览器中授权麦克风。
- 用户能录制 5–20 秒音频。
- 录音完成后能进入分析。
- 分析失败有明确错误提示。
- 可以重录。

### 11.2 Transcription 验收

- 后端能接收 WAV。
- 后端能返回 note events。
- 每个 note 至少包含 pitch、start、duration、velocity。
- 对短碎音有基础过滤。
- 同一时间不出现大量重叠音符。

### 11.3 Editor 验收

- 音符能在 piano roll 中显示。
- 音符能拖动改 pitch。
- 音符能拖动改 start。
- 音符能改 duration。
- 音符能删除、新增。
- 播放音高与画面基本一致。
- 修改后播放结果同步变化。

### 11.4 Library 验收

- Motif 能保存到 IndexedDB。
- 刷新页面后仍能看到。
- 能打开继续编辑。
- 能删除。
- 能导出 JSON。

### 11.5 Export 验收

- MIDI 文件能下载。
- MIDI 文件能被常见 DAW 或播放器识别。
- JSON 文件能重新导入恢复 motif。

部署：
前端：Cloudflare Pages + GitHub。
后端：不要 Cloudflare，单独 Python 服务。
---

## 12. 风险与处理

### 12.1 转写准确率风险

风险：哼唱存在滑音、颤音、口水音、跑调，Basic Pitch 输出可能碎。  
处理：默认单声部化、删除碎音、合并相近音、保留手动修正为第一等公民。

### 12.2 自动节拍风险

风险：无伴奏哼唱很难稳定推断 BPM。  
处理：第一版允许用户手动选择 BPM；自动 BPM 只作为建议，不强行相信。

### 12.3 谱面复杂度风险

风险：MusicXML 和五线谱排版会吞噬大量时间。  
处理：第一版只做 piano roll，五线谱只读预览后置。

### 12.4 移动端音频风险

风险：iOS Safari 音频权限、AudioContext 启动、采样率都有坑。  
处理：先支持 Chrome/Edge 桌面和 Android，保留 Safari 兼容修复任务；播放必须由用户手势触发。

### 12.5 开源合规风险

风险：FFmpeg、模型、音频库许可证组合复杂。  
处理：MVP 避免 FFmpeg；所有第三方库维护 THIRD_PARTY_NOTICES.md；后续如引入 FFmpeg，只使用合规构建并保留许可证说明。

---

## 13. 关键设计决策

### 13.1 为什么主编辑器是 piano roll

因为用户的第一需求是快速看懂和修正旋律，而不是出版乐谱。Piano roll 更适合触屏拖拽，也更直观表达音高和时间。

### 13.2 为什么第一版不做完整 DAW

完整 DAW 会把产品拖入音轨、混音、自动化、插件、工程文件、音频剪辑等复杂系统。这个产品的独特价值在“捕捉动机”，不是“完成制作”。

### 13.3 为什么后端优先

Python Basic Pitch 路线稳定、可控、便于调试。浏览器本地推理是未来方向，但第一版如果直接被模型加载、WASM、移动性能困住，会拖慢验证。

### 13.4 为什么保存为 Motif 对象

MIDI 是交换格式，不是产品内部格式。内部应该保存更丰富的对象，包括调性、BPM、标签、版本、来源、清理参数和用户修正历史。

---

## 14. 开发任务拆分

### Phase A：工程骨架

- 创建 monorepo。
- 创建 Vite React app。
- 创建 FastAPI service。
- 建立共享数据模型文档。
- 加入 lint/test。
- 实现 mock motif editor。

### Phase B：录音与上传

- 实现麦克风授权。
- 实现 WAV 录制。
- 实现录音质量显示。
- 实现上传接口调用。
- 实现错误状态。

### Phase C：Basic Pitch 接入

- FastAPI 接收文件。
- 调 Basic Pitch。
- 抽取 note events。
- 返回 motif draft。
- 添加 sample wav 测试。

### Phase D：清理与量化

- 删除短音。
- 合并相邻音。
- 单声部化。
- sec to beat。
- 量化。
- 调性初判。
- 单元测试。

### Phase E：Editor

- piano roll 渲染。
- note selection。
- drag pitch/start/duration。
- mobile controls。
- undo/redo。
- note detail panel。

### Phase F：Playback

- Tone.js 初始化。
- schedule notes。
- playhead。
- loop。
- speed control。

### Phase G：Library

- IndexedDB schema。
- save/open/delete/duplicate。
- motif cards。
- search/tags。

### Phase H：Export

- JSON export/import。
- MIDI export。
- download helpers。
- verify with imported file.

### Phase I：Polish

- PWA manifest。
- responsive layout。
- loading progress。
- empty states。
- license notice。
- README。

---

## 15. Definition of Done

一个版本只有满足以下条件才算完成：

- 录音、转写、编辑、播放、保存、导出可以跑通。
- 没有把用户卡在外部 DAW。
- 用户能修正错误音符。
- 所有核心算法模块有单元测试。
- README 能让开发者本地启动前端和后端。
- 第三方许可证有记录。
- 产品没有膨胀成 DAW。

---

## 16. 第三方组件初选

- Spotify Basic Pitch：audio-to-MIDI，Python/TypeScript 路线，Apache-2.0。
- ONNX Runtime：后续本地/移动推理候选，MIT。
- Tone.js：浏览器交互音频与播放，MIT。
- VexFlow：后续乐谱渲染，MIT。
- OpenSheetMusicDisplay：后续 MusicXML 渲染，BSD-3-Clause。
- FFmpeg：MVP 避免引入；后续若使用，必须处理 LGPL/GPL 合规。

---

## 17. 一句话开发纪律

任何功能如果不能帮助用户更快完成“哼唱 → 可编辑旋律 → 试听 → 保存”，就不进入 MVP。
