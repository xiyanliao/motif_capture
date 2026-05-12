# Motif Capture

移动端优先的 Web/PWA MVP：把 5-20 秒哼唱旋律转成可编辑、可播放、可保存、可导出的 Motif 卡片。

当前阶段：Phase 7 MVP 端到端闭环与 PWA 收尾。

## MVP 闭环

```text
浏览器录音或上传音频
-> FastAPI 转写
-> Basic Pitch 输出 note events
-> 后处理为单声部 Motif
-> 前端 piano roll 编辑
-> Tone.js 播放
-> IndexedDB 保存
-> JSON/MIDI 导出
```

## 仓库结构

```text
apps/
  web/            React + TypeScript + Vite 前端
services/
  api/            FastAPI 后端
docs/             MVP 规划、API 契约、数据模型
```

## 前端启动

```bash
pnpm install
pnpm --filter web dev
```

默认 Vite 地址：

```text
http://localhost:5173
```

## 录音与分析

1. 启动后端 `uvicorn app.main:app --reload --port 8000`。
2. 启动前端 `pnpm --filter web dev`。
3. 打开 Capture：
   - 点 `Record` 录制 5-20 秒哼唱。
   - 点 `Stop` 后可试听原始 WAV。
   - 点 `Basic Pitch` 走真实后端推理；生产环境必须先配置 `VITE_API_BASE_URL`。
   - `Demo Motif` 只打开内置示例旋律，不代表真实转写结果。
   - `Analyze Mock` 仅在开发构建中显示，用于前后端联调。
4. 分析成功后自动进入 Editor，可播放、编辑、保存。
5. 保存后进入 Library，刷新页面后保存内容仍保留在 IndexedDB。
6. Editor 可导出 JSON/MIDI，Library 可导出 JSON。

## 后端启动

```bash
cd services/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

如果当前系统缺少 `ensurepip` 导致 `python3 -m venv` 失败，可用 PyPA virtualenv zipapp 创建环境：

```bash
curl -L https://bootstrap.pypa.io/virtualenv.pyz -o /tmp/virtualenv.pyz
python3 /tmp/virtualenv.pyz .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

健康检查：

```bash
curl http://localhost:8000/api/health
```

## 测试

前端：

```bash
pnpm --filter web test
pnpm --filter web build
```

后端：

```bash
cd services/api
source .venv/bin/activate
pytest
```

根目录聚合测试：

```bash
pnpm test
```

`pnpm test` 会调用前端 Vitest 和后端 pytest。首次运行前需要先完成前端 `pnpm install` 与后端虚拟环境安装。

## 环境变量

前端示例：

```bash
cp apps/web/.env.example apps/web/.env
```

后端示例：

```bash
cp services/api/.env.example services/api/.env
```

## PWA

生产构建包含基础 PWA metadata、manifest、icons 和 service worker：

```bash
pnpm --filter web build
pnpm --filter web preview
```

PWA 仅缓存 app shell 和同源 GET 资源；`POST /api/transcribe` 不缓存。

Cloudflare Pages 部署见 [docs/11_cloudflare_pages_pwa_deploy.md](docs/11_cloudflare_pages_pwa_deploy.md)。生产环境需要设置 `VITE_API_BASE_URL` 指向公网 HTTPS API；否则 Basic Pitch 转写会显示 API 未配置，但本地 mock、编辑、保存和导出仍可使用。

如果生产页面能打开但录音转写后出现无关旋律，通常是前端仍在使用 mock 或没有接通公网 FastAPI。修复方案见 [docs/12_production_transcription_fix_plan.md](docs/12_production_transcription_fix_plan.md)。

## 当前限制

- Phase 7 已串联 Capture、Analyze、Editor、Playback、Save、Library、JSON/MIDI Export。
- Phase 7 已增加 PWA manifest、service worker 和移动端基础 meta。
- 后端已实现 mock route、Basic Pitch engine 隔离类和后处理 pipeline。
- 前端已实现 IndexedDB 保存、Library、JSON 导入导出、MIDI 导出。
- 录音 Stop 后可试听原始 WAV，并可上传至 mock 或 Basic Pitch engine。
- 浏览器麦克风权限和真实输入电平仍需要人工在设备上确认。
- Basic Pitch 真实推理依赖本地 Python 环境与模型运行能力；不可用时 API 返回 `ENGINE_NOT_AVAILABLE`，mock path 仍可用。

## 开发纪律

- 以 `docs/DATA_MODEL.md` 的 Motif JSON 为内部核心数据。
- 每完成一个 feature，先运行相关测试。
- 测试通过后提交并推送到 GitHub。
- 不把项目扩展成 DAW，不提前做多轨、账号、云同步或专业谱面编辑。
