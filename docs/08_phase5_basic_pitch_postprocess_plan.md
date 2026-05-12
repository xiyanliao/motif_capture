# Phase 5 Basic Pitch 与后处理规划

日期：2026-05-13

## 阶段目标

把后端从纯 mock route 推进到可替换的真实转写管线：

```text
uploaded audio
-> BasicPitchEngine
-> raw note events
-> cleaning / monophonicize / sec-to-beat / quantize / key detect
-> standard Motif JSON
```

## 实施口径

- `routes/transcription.py` 只负责请求解析与错误映射。
- Basic Pitch 细节隔离在 `app/engines/basic_pitch_engine.py`。
- 后处理函数放在 `app/postprocess/`，并保持纯函数可测试。
- `POST /api/transcribe` 支持 `engine=mock|basic-pitch`。
- 默认 `engine=mock`，保证当前前端闭环稳定。
- `engine=basic-pitch` 走真实 engine；若依赖或运行环境不可用，返回 `ENGINE_NOT_AVAILABLE`。

## 后处理模块

已落地：

- `remove_short_notes`
- `merge_nearby_notes`
- `monophonicize`
- `seconds_to_beats`
- `quantize_notes`
- `detect_key`

默认参数：

- `MIN_NOTE_DURATION_SEC = 0.08`
- `MERGE_GAP_SEC = 0.08`
- `CONFIDENCE_THRESHOLD = 0.35`
- `DEFAULT_BPM = 96`
- `DEFAULT_GRID = "1/16"`

## 运行时依赖说明

- `basic-pitch>=0.4,<0.5` 作为真实转写 engine。
- `numpy<2` 用于兼容当前 `tflite-runtime` 依赖链。
- `setuptools<81` 用于兼容 Basic Pitch 依赖链中仍引用 `pkg_resources` 的包。

## API 行为

Mock path：

```text
POST /api/transcribe engine=mock
```

返回 deterministic mock Motif，用于 UI 闭环和前后端联调。

Basic Pitch path：

```text
POST /api/transcribe engine=basic-pitch
```

成功时返回 Basic Pitch + postprocess 生成的 Motif。失败时：

- `ENGINE_NOT_AVAILABLE`：Basic Pitch 无法 import 或运行环境缺失。
- `TRANSCRIPTION_FAILED`：模型推理失败。
- `POSTPROCESS_FAILED`：raw notes 转 Motif 失败。

## 验收点

- 后端能接收 WAV 或上传音频并进入 route。
- Mock path 仍返回标准 Motif。
- Basic Pitch engine 与 route 解耦。
- 后处理模块有 pytest 覆盖。
- Basic Pitch 不可用时返回 `ENGINE_NOT_AVAILABLE`，前端显示错误，不崩溃。
- 最小 WAV fixture 已加入 `services/api/tests/fixtures/humming_short_motif.wav`。

## 后续衔接

- Phase 6 前端 WAV recorder 输出的 Blob 可直接调用现有 `RemoteBasicPitchClient`。
- 若真实 Basic Pitch 准确率不稳，只需要调整 engine 或 postprocess，不需要改前端 Motif 编辑器。
