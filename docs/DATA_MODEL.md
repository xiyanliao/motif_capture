# Motif 数据模型

阶段：MVP Phase 0

## 原则

- 内部数据以 Motif JSON 为核心，不以 MIDI 为核心。
- 前端 TypeScript 类型与后端 Pydantic schema 手动保持一致。
- 字段命名采用 camelCase，方便前端直接消费。
- 音频 Blob、AudioBuffer 不直接混入 Motif 对象。

## TypeScript 类型

权威前端位置：

```text
apps/web/src/domain/motif/types.ts
```

```ts
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

## Python Schema

权威后端位置：

```text
services/api/app/schemas.py
```

后端 schema 与前端字段保持同名，API 返回时不做 snake_case 转换。

## 字段约束

| 字段 | 约束 |
| --- | --- |
| `pitch` | MIDI number，范围 `0-127`。 |
| `startBeat` | 大于等于 `0`。 |
| `durationBeat` | 大于 `0`。 |
| `velocity` | `0-1` 浮点数。 |
| `confidence` | 可选，`0-1` 浮点数。 |
| `bpm` | 大于 `0`。 |
| `timeSignature` | MVP 只允许 `4/4`、`3/4`、`6/8`。 |
| `source.type` | `recording`、`upload`、`manual`。 |

## 版本同步纪律

任意一端修改 Motif schema 时，必须同步：

1. 前端 `types.ts`。
2. 后端 `schemas.py`。
3. 本文档。
4. 前端契约测试。
5. 后端 schema 测试。
