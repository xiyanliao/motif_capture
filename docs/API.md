# API 契约

阶段：MVP Phase 0

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

阶段 0 中 `engine` 固定为 `mock`。接入 Basic Pitch 后可返回 `basic-pitch`。

## `POST /api/transcribe`

阶段 0 只固定契约，真实 route 在后续阶段实现。

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

成功响应：

```json
{
  "ok": true,
  "data": {
    "motif": {
      "id": "m1",
      "title": "Untitled Motif",
      "createdAt": "2026-05-12T00:00:00.000Z",
      "updatedAt": "2026-05-12T00:00:00.000Z",
      "durationSec": 8.5,
      "bpm": 96,
      "timeSignature": "4/4",
      "notes": [],
      "tags": [],
      "source": {
        "type": "recording",
        "engine": "basic-pitch",
        "engineVersion": "..."
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
