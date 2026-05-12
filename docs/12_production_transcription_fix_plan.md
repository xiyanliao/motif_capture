# 生产环境真实转写链路修复方案

日期：2026-05-13

## 背景

Cloudflare Pages 前端 `https://motif-capture.pages.dev/` 已可正常打开，Capture、录音、PWA 静态资源、Editor、Library 等界面可用。但用户录音后进入 Editor 看到的是无关旋律，不是录音内容转写出的 piano roll。

当前已确认：

- `https://motif-capture.pages.dev/` 返回前端 HTML。
- `https://motif-capture.pages.dev/api/health` 返回的是前端 HTML app shell，不是 FastAPI JSON。
- `POST https://motif-capture.pages.dev/api/transcribe` 返回 `405`。
- 线上 JS 未编译进 `VITE_API_BASE_URL`，production 模式下 `RemoteBasicPitchClient` 会返回 `API_UNCONFIGURED`。
- 无关旋律来自内置 mock fixture：`fixtures/mock_transcription.json`，而不是用户录音分析结果。

## 根因

Cloudflare Pages 只托管前端静态构建产物，不能运行当前的 FastAPI + Basic Pitch Python 后端。真实转写需要一个单独的公网 HTTPS API。

当前线上环境缺少两件事：

1. 可访问的 FastAPI 后端部署。
2. Cloudflare Pages 的 `VITE_API_BASE_URL` 指向该后端，并在构建后重新部署。

此外，当前 UI 同时暴露 `Analyze Mock`、`Basic Pitch`、`Local Mock`，且 App 默认 active motif 是 mock motif。生产环境下这会让用户误以为录音被转写成了错误旋律。

## 目标

让生产 PWA 完成真实闭环：

```text
手机浏览器录音
-> POST 公网 FastAPI /api/transcribe engine=basic-pitch
-> Basic Pitch 推理
-> 后处理为 Motif JSON
-> Editor 显示本次录音对应的 piano roll
-> 播放、编辑、保存、导出
```

同时避免 mock 功能误导生产用户。

## 修复范围

### 1. 部署后端 API

将 `services/api` 部署到 Render、Railway、Fly.io、VPS 或其他可运行 Python 服务的平台。

后端启动命令：

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

生产依赖至少需要：

```bash
pip install -r requirements.txt
```

若部署平台需要显式安装 Basic Pitch 推理 runtime，应确保 `basic_pitch` 能实际跑通。当前本地验证方式：

```bash
cd services/api
source .venv/bin/activate
python - <<'PY'
from pathlib import Path
from app.schemas import TranscriptionOptions
from app.services.transcription_pipeline import transcribe_with_basic_pitch

wav = Path("tests/fixtures/humming_short_motif.wav")
result = transcribe_with_basic_pitch(
    wav.name,
    wav.read_bytes(),
    TranscriptionOptions(bpm=96, quantizeGrid="1/16", forceMonophonic=True),
)
motif = result.data.motif
print(len(motif.notes), motif.source.engine, motif.source.engineVersion)
PY
```

期望返回至少一个 note，且 `motif.source.engine` 为 `basic-pitch`。

### 2. 配置后端 CORS

后端环境变量：

```text
MOTIF_CORS_ORIGINS=https://motif-capture.pages.dev
```

如果后续增加自定义域名，用逗号追加：

```text
MOTIF_CORS_ORIGINS=https://motif-capture.pages.dev,https://your-custom-domain.com
```

### 3. 配置 Cloudflare Pages 环境变量

Cloudflare Pages 项目中设置：

```text
VITE_API_BASE_URL=https://your-public-api.example.com
```

注意：Vite 的 `VITE_*` 变量在构建时注入。修改环境变量后必须重新部署 Pages。

### 4. 验证 API

部署后先用命令行验证：

```bash
curl https://your-public-api.example.com/api/health
```

期望返回：

```json
{
  "ok": true,
  "engine": "mock",
  "version": "0.0.0"
}
```

再验证转写：

```bash
curl -X POST https://your-public-api.example.com/api/transcribe \
  -F file=@services/api/tests/fixtures/humming_short_motif.wav \
  -F engine=basic-pitch \
  -F bpm=96 \
  -F quantizeGrid=1/16 \
  -F forceMonophonic=true
```

期望：

- HTTP 200。
- JSON `ok: true`。
- `data.motif.notes.length > 0`。
- `data.motif.source.engine == "basic-pitch"`。

### 5. 验证前端

重新部署 Cloudflare Pages 后：

1. 打开 `https://motif-capture.pages.dev/`。
2. 录音 5-20 秒。
3. 点 `Basic Pitch`。
4. Editor 应显示本次录音分析出的 motif。
5. 播放结果应和录音旋律大致一致。
6. 保存后进入 Library，刷新页面后仍可打开。

### 6. 前端防误导改造

已在代码侧落实以下 UI 调整：

- 生产环境隐藏或弱化 `Analyze Mock` 和 `Local Mock`。
- 将 `Local Mock` 改名为 `Demo Motif`。
- 未配置 `VITE_API_BASE_URL` 时禁用 `Basic Pitch`，状态文案明确显示“需要配置后端 API”。
- Editor 默认不展示 mock motif，改为空状态：“请先录音、上传音频或打开 Library 中的 Motif”。
- Analyze 成功后在 Editor 顶部显示来源：`basic-pitch`、`mock-transcription` 或 `manual`。

这些改造不会替代后端部署，但能避免用户把 demo motif 当成真实转写结果。

## 推荐实施顺序

1. 先部署 FastAPI 后端并验证 `/api/health`。
2. 验证后端真实 `engine=basic-pitch` 转写 fixture。
3. 配置后端 `MOTIF_CORS_ORIGINS`。
4. 配置 Cloudflare Pages `VITE_API_BASE_URL` 并重新部署。
5. 用真机录音验证 `Basic Pitch`。
6. 再做前端防误导 UI 改造。
7. 更新 README 和部署文档中的生产 API 地址说明。

## 验收标准

必须满足：

- `https://motif-capture.pages.dev/` 可以打开 PWA。
- `Basic Pitch` 按钮不会返回 `API_UNCONFIGURED`。
- 浏览器 Network 面板中 `POST /api/transcribe` 的请求目标是公网 API 域名，而不是 `motif-capture.pages.dev`。
- 真实录音转写后的 motif 标记 `source.engine = "basic-pitch"`。
- Editor 中的 notes 来自后端响应，不是 `fixtures/mock_transcription.json`。
- `Local Mock` 或 demo 功能不会被用户误认为真实转写。
