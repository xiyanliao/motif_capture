# Motif Capture

移动端优先的 Web/PWA MVP：把 5-20 秒哼唱旋律转成可编辑、可播放、可保存、可导出的 Motif 卡片。

当前阶段：Phase 0 工程骨架与契约。

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

## 当前限制

- Phase 0 尚未实现录音。
- Phase 0 尚未实现 `POST /api/transcribe`。
- Phase 0 尚未接入 Basic Pitch。
- Phase 0 尚未实现 piano roll、播放、保存和导出。

## 开发纪律

- 以 `docs/DATA_MODEL.md` 的 Motif JSON 为内部核心数据。
- 每完成一个 feature，先运行相关测试。
- 测试通过后提交并推送到 GitHub。
- 不把项目扩展成 DAW，不提前做多轨、账号、云同步或专业谱面编辑。
