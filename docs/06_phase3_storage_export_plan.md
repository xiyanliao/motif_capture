# Phase 3 本地保存与导出规划

日期：2026-05-12

## 阶段目标

让 Motif 从临时编辑状态变成可持久化、可交换的本地素材：

```text
current Motif
-> IndexedDB save
-> Library list/open/delete/duplicate
-> JSON export/import
-> MIDI export
```

## 实施口径

- 使用 Dexie 管理 IndexedDB。
- `motifRepository` 提供 `save`、`update`、`list`、`get`、`delete`、`duplicate`。
- Editor 负责当前 Motif 的保存、导入、导出入口。
- Library 负责已保存 Motif 的浏览、搜索、打开、复制、删除和 JSON 导出。
- JSON 导出使用带版本号的 envelope。
- MIDI 导出使用 `@tonejs/midi`，按 Motif `bpm` 把 beat 转成 seconds。

## 验收点

- Save 后刷新页面仍可在 Library 看到 Motif。
- Library 能打开已保存 Motif 继续编辑。
- Library 能删除和复制 Motif。
- JSON 文件可导出，并可重新导入恢复 Motif。
- MIDI 文件可下载，且文件头为标准 `MThd`。
- Repository、JSON、MIDI 导出有 Vitest 覆盖。

## 后续衔接

- Phase 4 接后端 mock transcribe 后，可把 API 返回 Motif 直接保存到同一 repository。
- 后续音频 Blob 可接入 `audioBlobs` store，不需要改变 Motif store schema。
