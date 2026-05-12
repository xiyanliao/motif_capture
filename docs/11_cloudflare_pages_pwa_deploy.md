# Cloudflare Pages PWA 部署说明

日期：2026-05-13

## 结论

前端可以作为静态 Vite 应用部署到 Cloudflare Pages，并通过 HTTPS 满足 PWA 安装的基础条件。部署前需要明确一件事：Cloudflare Pages 只托管前端静态资源，本项目的 FastAPI + Basic Pitch 后端需要单独部署到一个公网 HTTPS 地址。

## Pages 构建配置

在 Cloudflare Pages 创建项目时选择本仓库：

| 配置项 | 值 |
| --- | --- |
| Framework preset | `React (Vite)` |
| Root directory | `/` |
| Build command | `pnpm --filter web build` |
| Build output directory | `apps/web/dist` |
| Node version | `22` |

推荐环境变量：

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 公开 FastAPI origin，例如 `https://api.example.com`。生产环境必须配置。 |

若暂时没有公开 API，部署后的 PWA 仍可打开、安装、使用本地 mock、编辑、保存和导出；但 `Basic Pitch` 按钮会显示 API 未配置。

如果页面可以打开但录音后进入 Editor 看到无关旋律，优先检查真实转写 API 是否接通。排查与修复步骤见 [docs/12_production_transcription_fix_plan.md](12_production_transcription_fix_plan.md)。

## 后端 CORS 配置

FastAPI 后端需要允许 Cloudflare Pages 的 origin：

```bash
MOTIF_CORS_ORIGINS=https://your-pages-domain.pages.dev,https://your-custom-domain.com
```

本地开发默认允许：

```text
http://localhost:5173
http://127.0.0.1:5173
```

## PWA 文件

已补齐：

- `public/manifest.webmanifest`
- PNG/SVG icons，包括 maskable icon
- `public/sw.js`
- `public/_headers`
- production-only service worker registration

`_headers` 会在 Pages 部署时设置 manifest、service worker、icon、assets 的缓存和基础安全 header。

## 验收方式

部署后在手机浏览器打开 Cloudflare Pages 地址：

1. 能看到 Capture 页面。
2. 浏览器菜单中可添加到主屏幕或安装。
3. 安装后以 standalone 方式打开。
4. `Local Mock` 可离线使用编辑和保存路径。
5. 配置 `VITE_API_BASE_URL` 且后端 CORS 放行后，`Basic Pitch` 可上传音频并进入 Editor。
