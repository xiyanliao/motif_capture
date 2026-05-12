# Git 与 GitHub 同步流程

## 基本纪律

每完成一个独立 feature 后，必须先运行相关测试。测试通过后再提交，并同步到 GitHub 远端仓库。

推荐顺序：

1. 实现 feature。
2. 运行与改动相关的测试。
3. 若测试通过，检查 `git status --short`。
4. 提交本 feature 的改动。
5. 推送到已配置的 GitHub remote。

## 提交原则

- 一个 commit 对应一个清晰 feature 或修复。
- 不把依赖目录、缓存、构建产物、环境变量文件提交进仓库。
- 不把未完成、未测试的 feature 推送到 GitHub。
- 如果测试无法运行，必须在提交或最终说明中写清楚原因。

## 远端要求

仓库需要配置 GitHub remote：

```bash
git remote add origin <github-repo-url>
git push -u origin main
```

如果 remote 尚未配置，则先完成本地提交，并等待提供 GitHub 仓库地址后再推送。
