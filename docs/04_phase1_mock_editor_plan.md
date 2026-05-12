# Phase 1 Mock Motif 编辑闭环规划

日期：2026-05-12

## 阶段目标

在不依赖后端、录音、Basic Pitch、Tone.js 的情况下，先验证核心产品对象是否能被用户看见和修正：

```text
mock transcription
-> Motif JSON
-> piano roll 显示
-> 选择、拖动、改长度、新增、删除
-> 移动端微调
```

## 实施口径

- 使用 `fixtures/mock_transcription.json` 作为唯一 mock transcription 输入。
- `App` 直接进入 Editor 工作台，不做 landing page。
- SVG piano roll 先服务 20-30 个 note 的编辑体验。
- Motif 编辑操作落在纯函数中，方便 Phase 2 播放和 Phase 3 保存复用。
- 本阶段不做播放、保存、撤销、后端联调。

## 验收点

- mock motif 至少包含 20 个 notes。
- piano roll 能按 pitch 高低和 beat 横向位置显示 notes。
- 点击 note 可选中。
- 拖动 note 主体可改变 pitch 与 startBeat。
- 拖动 note 右边缘可改变 durationBeat。
- 双击空白网格或点击新增按钮可新增 note。
- 双击 note 或点击删除按钮可删除 note。
- 窄屏下保留横向滚动和底部微调按钮。

## 后续衔接

- Phase 2 可直接读取当前 Motif state 做 Tone.js 调度。
- Phase 3 可把当前 Motif state 保存进 IndexedDB。
- 后续接后端时，只需把 `mockMotif` 替换为 `TranscriptionClient` 返回的 Motif。
