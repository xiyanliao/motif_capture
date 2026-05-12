# Phase 0 具体实施规划

日期：2026-05-12

## 阶段目标

Phase 0 不追求产品功能，只完成项目后续开发所需的“稳定地基”：

- monorepo 结构确定。
- 前端 Vite/React/TypeScript 可启动、可构建、可测试。
- 后端 FastAPI 可启动，`GET /api/health` 可测试。
- Motif 数据模型在前后端同时落地。
- API 契约以文档和 schema 固定。
- README 与许可证文件给出本地启动、测试和依赖边界。

## 目录落地

```text
apps/web
services/api
docs
```

前端只保留最小页面和 contract test，不提前实现 recorder/editor/playback。

后端只实现 health route 和 schema test，不提前实现 Basic Pitch 或 mock transcribe route。

## 阶段 0 验收方式

前端：

```bash
pnpm install
pnpm --filter web test
pnpm --filter web build
```

后端：

```bash
cd services/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest
```

若系统 Python 缺少 `ensurepip`，可用 `virtualenv.pyz` 创建 `.venv` 后再安装依赖。

整体：

```bash
pnpm test
```

## 进入 Phase 1 前的约束

- Phase 1 只基于 `apps/web/src/domain/motif/types.ts` 中的 Motif 类型开发。
- Mock motif fixture 必须符合 `docs/DATA_MODEL.md`。
- 后续 `POST /api/transcribe` 必须符合 `docs/API.md`。
- 每个 feature 测试通过后提交并推送到 GitHub。
