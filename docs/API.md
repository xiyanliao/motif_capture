# API 契约

阶段：MVP Phase 5

## 通用原则

- API 路径统一使用 `/api` 前缀。
- 响应不暴露 Python traceback。
- 转写成功响应统一包裹在 `{ ok, data: { motif }, warnings }` 中。
- 转写失败响应统一包裹在 `{ ok, error }` 中。
- 字段命名采用前端 Motif JSON 的 camelCase 口径。

## `GET /api/health`

用途：确认后端服务可访问，并暴露当前转写引擎状态。

响应：

```json
{
  "ok": true,
  "engine": "mock",
  "version": "0.0.0"
}
```

Phase 5 中 `engine` 仍返回当前后端默认引擎状态。转写 route 可按请求参数选择 `mock` 或 `basic-pitch`。

## `POST /api/transcribe`

Phase 5 已实现 mock route、Basic Pitch engine 隔离类和后处理 pipeline。默认仍使用 mock engine，避免模型依赖阻塞 UI 闭环。

请求：

```http
POST /api/transcribe
Content-Type: multipart/form-data
```

表单字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | file | 是 | WAV 音频文件。 |
| `bpm` | number | 否 | 默认 `96`。 |
| `quantizeGrid` | string | 否 | `off`、`1/8`、`1/16`、`1/32`。 |
| `forceMonophonic` | boolean | 否 | 默认 `true`。 |
| `keyHint` | string | 否 | 用户提供的调性提示。 |
| `minNoteDurationMs` | number | 否 | 默认 `80`。 |
| `mergeGapMs` | number | 否 | 默认 `80`。 |
| `engine` | string | 否 | `mock` 或 `basic-pitch`，默认 `mock`。 |

成功响应：

```json
{
  "ok": true,
  "data": {
    "motif": {
      "id": "m1",
      "title": "Untitled Motif",
      "createdAt": "2026-05-13T00:00:00.000Z",
      "updatedAt": "2026-05-13T00:00:00.000Z",
      "durationSec": 8.5,
      "bpm": 96,
      "timeSignature": "4/4",
      "notes": [],
      "tags": [],
      "source": {
        "type": "upload",
        "engine": "mock-transcription",
        "engineVersion": "0.0.0"
      },
      "versions": []
    }
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

错误码：

- `INVALID_AUDIO`
- `TRANSCRIPTION_FAILED`
- `ENGINE_NOT_AVAILABLE`
- `POSTPROCESS_FAILED`

## 默认转写参数

| 参数 | 默认值 |
| --- | --- |
| `bpm` | `96` |
| `quantizeGrid` | `1/16` |
| `forceMonophonic` | `true` |
| `minNoteDurationMs` | `80` |
| `mergeGapMs` | `80` |
| `engine` | `mock` |
