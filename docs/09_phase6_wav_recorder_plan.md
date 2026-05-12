# Phase 6 前端录音 WAV 规划

日期：2026-05-13

## 阶段目标

把 Capture 从“上传音频”推进到“浏览器直接录音”：

```text
browser microphone
-> AudioContext mono samples
-> PCM16 WAV Blob
-> local preview
-> RemoteBasicPitchClient /api/transcribe
-> Editor
```

## 实施口径

- `useWavRecorder` 负责浏览器音频生命周期：权限、AudioContext、MediaStream、计时、清理。
- `services/recording/wav.ts` 负责纯函数：chunk 合并、音量统计、PCM16 WAV 编码、输入电平分类。
- Capture 页面保留上传入口，同时新增录音入口。
- Stop 后生成 `audio/wav` File，并显示原始录音试听控件。
- Analyze 按钮复用现有 `TranscriptionClient`，录音与上传都走同一转写契约。

## 状态模型

页面使用以下状态呈现：

- `idle`：无录音或上传。
- `recording`：麦克风录音中。
- `recorded`：已有录音或上传文件，可分析。
- `analyzing`：正在上传转写。
- `failed`：录音或转写失败。

## 错误与提示

- 麦克风权限拒绝：显示 `Microphone permission was denied.`。
- 未找到麦克风：显示 `No microphone was found.`。
- 无可用录音能力：显示 `This browser does not support microphone recording.`。
- 输入过小：Stop 后提示靠近或唱大声一点。
- 输入削波：Stop 后提示远离或唱轻一点。
- 上传或转写失败：显示 API 返回的错误信息。

## 验收点

- 浏览器可录制 5-20 秒音频。
- Stop 后可试听原始 WAV。
- Analyze 可把 WAV 上传至 mock 或 Basic Pitch engine。
- 权限失败、录音失败、音量过小/过大、转写失败均有可见提示。
- WAV 编码纯函数有 Vitest 覆盖。

## 后续衔接

- Phase 7 需要把录音、编辑、保存、Library、JSON/MIDI export 作为完整端到端路径验收。
- PWA manifest、移动端安装体验和最终 README 指南留到 Phase 7 收尾。
