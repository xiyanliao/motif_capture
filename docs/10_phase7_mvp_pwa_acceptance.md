# Phase 7 端到端闭环与 PWA 收尾

日期：2026-05-13

## 阶段目标

把已完成的录音、转写、编辑、播放、保存、导入导出串成可验收 MVP：

```text
Capture recording/upload
-> Analyze mock/basic-pitch
-> Editor
-> Playback / edit
-> Save
-> Library
-> JSON / MIDI export
```

## 已完成工作

- App 启动时从 IndexedDB 读取最新保存的 Motif，验证刷新后仍能回到本地数据。
- Capture 保留上传和录音两条入口，Analyze 后进入 Editor。
- Editor 补齐保存、播放、导入、导出的状态与错误提示。
- Library 补齐加载、空列表、搜索无结果、操作失败状态。
- 增加在线/离线 banner：离线时本地 Library 仍可访问，真实 Basic Pitch API 需要后端在线。
- 增加 PWA manifest、SVG icon、maskable icon、service worker 和移动端 meta。
- README 更新启动、录音分析、PWA、测试与当前限制。

## PWA 口径

- `manifest.webmanifest` 提供安装名称、主题色、standalone display 和图标。
- `sw.js` 预缓存 app shell，并对同源 GET 请求做 stale-while-revalidate。
- API 转写请求是 POST，不被 service worker 缓存。
- PWA 注册只在 production build 中启用，避免开发环境缓存干扰。

## 验收清单

- 前端开发服务可访问。
- `manifest.webmanifest`、icons、`sw.js` 能通过 HTTP 获取。
- 录音或上传后可 Analyze 并进入 Editor。
- Editor 可播放、编辑、保存。
- Library 可读取保存项，刷新后仍存在。
- JSON 和 MIDI 导出可触发下载。
- `pnpm test`、`pytest`、`pnpm --filter web build` 通过。

## 剩余限制

- 浏览器麦克风权限和真实音频输入需要人工在浏览器确认。
- Basic Pitch 真实推理仍依赖本地 Python 模型运行环境。
- 当前 MVP 不包含账号、云同步、多轨 DAW 或专业谱面编辑。
