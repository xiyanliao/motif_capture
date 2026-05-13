# 2026-05-13 Basic Pitch 冷启动与 `Failed to fetch` 修复记录

## 现象

手机端录音后可以播放原始音频，但点击 `Basic Pitch` 时经常先显示 `Failed to fetch`。等待几分钟后再次点击，又能成功转写并进入 Editor。

## 诊断

线上前端已经注入：

```text
VITE_API_BASE_URL=https://motif-capture-api.onrender.com
```

公网后端健康检查和 CORS 预检均可用：

```text
GET /api/health -> 200
OPTIONS /api/transcribe -> 200
Access-Control-Allow-Origin: https://motif-capture.pages.dev
```

真实 Basic Pitch 同步转写耗时过长。使用仓库内短测试音频连续请求线上后端时，单次 `POST /api/transcribe engine=basic-pitch` 约 `127-128s` 才返回。

这说明问题不是录音文件损坏，而是后端冷启动、模型加载和低配实例推理耗时过长。移动浏览器或平台网关在同步请求等待期间可能先断开，浏览器只能报 `Failed to fetch`；后端热起来后再次请求才成功。

## 代码修复

提交：

```text
40bdad4 fix(transcription): handle cold backend startup
```

前端修复：

- `RemoteBasicPitchClient` 在上传音频前先请求 `/api/health` 预热后端。
- 对冷启动、网络中断、`408/425/429/500/502/503/504` 等 transient 状态做有限重试。
- 将裸 `Failed to fetch` 改为明确的 `API_UNREACHABLE` 提示，说明后端可能正在唤醒或不可达。
- `CapturePage` 在用户点击 `Basic Pitch` 后提示首次分析可能需要接近 2 分钟。
- 增加前端测试覆盖：health 预热、转写重试、API 永不唤醒时的错误码。

后端修复：

- `BasicPitchEngine` 在进程内缓存已加载的 Basic Pitch `Model` 与 `predict`。
- 对共享模型推理加锁，避免并发请求同时操作同一个模型对象。
- `transcription_pipeline` 复用全局 `BasicPitchEngine` 实例。
- 增加测试确认模型只加载一次并被后续转写复用。

## 验证

本地验证通过：

```bash
pnpm --filter web test
pnpm --filter web build
pnpm test
```

`pnpm test` 覆盖：

- Web Vitest：`35 passed`
- FastAPI Pytest：`17 passed`

## 部署侧要求

代码层只能缓解首次失败和重复模型加载，不能根除低配实例同步推理过慢。

生产环境仍需要：

- 重新部署 Cloudflare Pages，让新前端 JS 生效。
- 重新部署 FastAPI 后端，让模型缓存逻辑生效。
- 后端优先使用 always-on 或 paid 实例，避免 scale to zero。
- 若继续使用会休眠的平台，配置 uptime monitor 每 5 分钟访问 `/api/health`。
- 如果热实例上的短音频仍接近 2 分钟，升级 CPU/内存；否则后续需要把同步 `POST /api/transcribe` 改成异步 job API。
