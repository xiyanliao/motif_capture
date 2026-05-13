# Cloudflare Pages PWA + FastAPI 后端部署操作手册

日期：2026-05-13

## 目标

让用户通过 `https://motif-capture.pages.dev/` 访问前端 PWA，并在手机上安装到主屏幕；真实录音转写请求由单独部署的 Python HTTPS API 处理。

Cloudflare Pages 只托管前端静态资源，不能运行当前的 FastAPI + Basic Pitch 后端。

## 总体顺序

1. 部署单独的 FastAPI + Basic Pitch 后端，拿到公网 HTTPS API 域名。
2. 在后端配置 `MOTIF_CORS_ORIGINS=https://motif-capture.pages.dev`。
3. 在 Cloudflare Pages 配置 `VITE_API_BASE_URL=https://你的公网API域名`。
4. 重新部署 Cloudflare Pages。
5. 在手机上录音，验证 `Basic Pitch` 请求发往公网 API，而不是 Pages 自身 `/api/transcribe`。

## 一、部署 FastAPI 后端

推荐先用 Render。操作路径短，适合验证 MVP。

### 1. 创建服务

1. 登录 Render：<https://render.com/>
2. 进入 Dashboard。
3. 点 `New +`。
4. 选择 `Web Service`。
5. 连接 GitHub 仓库：

```text
xiyanliao/motif_capture
```

### 2. 填写服务配置

| 配置项 | 值 |
| --- | --- |
| Name | `motif-capture-api` |
| Runtime | `Python 3` |
| Branch | `main` |
| Root Directory | `services/api` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |

### 3. 设置后端环境变量

Render 服务的 Environment Variables 中添加：

```text
PYTHON_VERSION=3.10.12
MOTIF_CORS_ORIGINS=https://motif-capture.pages.dev
MOTIF_TMP_DIR=/tmp
MOTIF_MAX_AUDIO_SECONDS=30
```

如果后续增加自定义前端域名，用逗号追加：

```text
MOTIF_CORS_ORIGINS=https://motif-capture.pages.dev,https://your-custom-domain.com
```

### 4. 部署

点 `Create Web Service` 或 `Deploy`，等待 build 完成。

部署成功后会得到类似：

```text
https://motif-capture-api.onrender.com
```

下面用这个值代表公网后端：

```text
API_BASE=https://motif-capture-api.onrender.com
```

### 5. 后端规格注意

Basic Pitch 是模型推理。免费或低配实例可能出现冷启动慢、内存不足、请求超时。

如果 Render logs 出现模型加载失败、进程被杀、请求超时，优先升级内存/CPU，而不是先改前端。

## 二、验证后端 API

在本地仓库根目录执行。

### 1. 健康检查

```bash
curl https://motif-capture-api.onrender.com/api/health
```

期望返回：

```json
{"ok":true,"engine":"mock","version":"0.0.0"}
```

### 2. CORS 预检

```bash
curl -i -X OPTIONS https://motif-capture-api.onrender.com/api/transcribe \
  -H "Origin: https://motif-capture.pages.dev" \
  -H "Access-Control-Request-Method: POST"
```

期望响应头包含：

```text
access-control-allow-origin: https://motif-capture.pages.dev
```

### 3. 真实 Basic Pitch 转写

```bash
curl -X POST https://motif-capture-api.onrender.com/api/transcribe \
  -F file=@services/api/tests/fixtures/humming_short_motif.wav \
  -F engine=basic-pitch \
  -F bpm=96 \
  -F quantizeGrid=1/16 \
  -F forceMonophonic=true
```

期望：

- HTTP 200。
- `ok: true`。
- `data.motif.notes` 不是空数组。
- `data.motif.source.engine` 是 `basic-pitch`。

如果这里失败，先排查后端部署日志。

## 三、配置 Cloudflare Pages

### 1. 打开 Pages 项目

1. 登录 Cloudflare Dashboard。
2. 打开 `Workers & Pages`。
3. 选择 Pages 项目：

```text
motif-capture
```

### 2. 确认构建配置

进入 `Settings` -> `Builds & deployments`，确认：

| 配置项 | 值 |
| --- | --- |
| Framework preset | `React (Vite)` |
| Root directory | `/` |
| Build command | `pnpm --filter web build` |
| Build output directory | `apps/web/dist` |

推荐设置环境变量：

```text
NODE_VERSION=22
```

### 3. 设置前端 API 环境变量

进入 `Settings` -> `Environment variables`，在 `Production` 环境添加：

```text
VITE_API_BASE_URL=https://motif-capture-api.onrender.com
```

不要填这些值：

```text
https://motif-capture.pages.dev
/api
http://localhost:8000
```

这些值会导致生产真实转写不可用。

### 4. 重新部署 Pages

`VITE_API_BASE_URL` 是 Vite 构建时注入的。修改环境变量后必须重新部署 Pages。

可选方式：

- 在 Cloudflare Pages 的 `Deployments` 页面点最新部署的 `Retry deployment`。
- 或推一个空 commit：

```bash
git commit --allow-empty -m "chore: redeploy pages with api env"
git push
```

## 四、验证 Cloudflare 前端

打开：

```text
https://motif-capture.pages.dev/
```

### 1. 静态 PWA 检查

```bash
curl https://motif-capture.pages.dev/manifest.webmanifest
curl -I https://motif-capture.pages.dev/sw.js
```

应能返回 manifest 和 service worker。

### 2. Network 检查

在浏览器 DevTools：

1. 打开 `Network`。
2. 勾选 `Preserve log`。
3. 录音 5-20 秒。
4. 点 `Basic Pitch`。
5. 查看请求 URL。

正确请求：

```text
POST https://motif-capture-api.onrender.com/api/transcribe
```

错误请求：

```text
POST https://motif-capture.pages.dev/api/transcribe
```

如果仍然请求 Pages 自身 `/api/transcribe`，说明 Cloudflare Pages 没有用新的 `VITE_API_BASE_URL` 重新构建。

## 五、手机 PWA 验证

在手机浏览器打开：

```text
https://motif-capture.pages.dev/
```

操作：

1. 安装到主屏幕。
2. 打开 PWA。
3. 点 `Record`。
4. 授权麦克风。
5. 录音 5-20 秒。
6. 点 `Stop`，试听原始 WAV。
7. 点 `Basic Pitch`。
8. 成功后进入 Editor。
9. Editor 顶部应显示：

```text
Source basic-pitch
```

如果显示：

```text
Source mock-transcription
```

说明你打开的是 `Demo Motif`，或者请求没有走真实 API。

## 六、清理旧 PWA 缓存

如果手机上看到旧界面，通常是 service worker 或站点数据缓存。

处理方式：

- 关闭 PWA 后重新打开。
- 浏览器访问页面并刷新。
- 在浏览器站点设置里清除 `motif-capture.pages.dev` 的站点数据。
- 桌面 Chrome 可在 DevTools -> Application -> Service Workers 点 `Unregister`，再 Clear storage。

## 七、最终状态

完成后应满足：

- Cloudflare Pages 只负责前端 PWA。
- Render 或其他 Python 平台负责 FastAPI + Basic Pitch。
- 前端生产环境 `Basic Pitch` 请求只发往 `VITE_API_BASE_URL`。
- `motif-capture.pages.dev/api/transcribe` 返回 405 不影响功能，因为前端不应请求它。
- 没配置 API 时，生产界面会禁用 Basic Pitch 并提示配置。
- `Demo Motif` 仍可用于离线展示，但不会伪装成真实转写。

## 参考文档

- Cloudflare Pages 构建配置与环境变量：<https://developers.cloudflare.com/pages/configuration/build-configuration/>
- Cloudflare Pages 构建镜像和 Node 版本：<https://developers.cloudflare.com/pages/configuration/build-image/>
- Render Web Services：<https://render.com/docs/web-services>
- Render Python 版本设置：<https://render.com/docs/python-version>
