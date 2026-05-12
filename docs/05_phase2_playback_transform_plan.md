# Phase 2 播放与变换规划

日期：2026-05-12

## 阶段目标

让 Phase 1 的 mock Motif 编辑结果可以即时试听，并把核心音乐变换沉到可测试的纯函数中：

```text
current Motif notes
-> Tone.js schedule
-> playhead update
-> loop/stop
-> quantize/transpose/invert/retrograde/stretch
```

## 实施口径

- 播放服务隔离在 `services/playback/TonePlayback.ts`。
- MIDI pitch 到音名转换放在 `domain/music/pitch.ts`。
- 纯函数放在 `domain/quantize` 与 `domain/transforms`，不依赖 React 或 Tone.js。
- Editor 只负责调用服务和更新 Motif state。
- 本阶段不做保存、导出、撤销/重做，也不接后端。

## 验收点

- 点击播放会按当前 notes 与 BPM 调度声音。
- 点击停止会停止播放并重置播放头。
- Loop 开启时播放头循环。
- Piano roll 显示播放头。
- 修改 notes 后再次播放使用最新 notes。
- Vitest 覆盖 pitch、quantize、transpose、invert、retrograde、stretchRhythm。

## 后续衔接

- Phase 3 可直接保存当前 Motif state 到 IndexedDB。
- 后续撤销/重做可以围绕 transform 前后的 notes 快照实现。
