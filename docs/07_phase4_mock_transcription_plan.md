# Phase 4 后端 Mock Transcription 规划

日期：2026-05-12

## 阶段目标

先打通前后端转写接口，不让 Basic Pitch、录音和音频格式阻塞主闭环：

```text
Capture upload
-> RemoteBasicPitchClient
-> FastAPI POST /api/transcribe
-> mock Motif JSON
-> Editor
```

## 实施口径

- 后端新增 `app/routes/transcription.py`。
- 后端 `POST /api/transcribe` 接收 multipart `file` 与转写参数。
- 后端不调用 Basic Pitch，使用 deterministic mock notes 返回标准 `{ ok, data: { motif }, warnings }`。
- 前端新增 `TranscriptionClient` 实现：
  - `RemoteBasicPitchClient`
  - `MockTranscriptionClient`
- App 默认进入 Capture 页面。
- Capture 支持上传音频并调用远端 mock route；保留本地 mock fallback。

## 验收点

- 后端 `POST /api/transcribe` 能接收文件并返回 Motif。
- 空文件返回 `INVALID_AUDIO`。
- 前端能上传文件并调用后端。
- 前端收到 Motif 后进入 Editor。
- 失败响应能显示可理解错误。
- Mock client 仍可用于前端离线演示。

## 后续衔接

- Phase 5 将把 route 内部 mock service 替换为 Basic Pitch engine + postprocess pipeline。
- Capture 页面后续可接真实 WAV recorder，不需要改变 `TranscriptionClient` 接口。
