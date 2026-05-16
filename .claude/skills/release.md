---
name: release
description: 将 tauriV2 合并到 main 并推送，触发 GitHub Actions 自动发布
---

# 发布流程

## 触发方式

用户说"发布"、"release"、"合并到 main"或执行 `/release` 时触发。

## 前置检查

1. 确保当前在 `tauriV2` 分支
2. 确保没有未提交的变更（如有，先提示用户执行 `/commit`）
3. 确保本地 `tauriV2` 已推送到远程

## 执行步骤

### 1. 推送 tauriV2（如有未推送的提交）

```bash
git push origin tauriV2
```

如果推送被拒绝，先拉取再推送：
```bash
git pull --rebase origin tauriV2
git push origin tauriV2
```

### 2. 生成 Release 内容预览

获取 main 上不存在的 tauriV2 提交，生成 changelog 预览供用户确认：

```bash
git log main..tauriV2 --pretty=format:"%s" --no-merges
```

将 commit 信息按 type 转换为带 emoji 的格式，映射规则：

| type | emoji | 中文标签 |
|------|-------|---------|
| `feat` | 🚀 | 功能 |
| `fix` | 🐛 | 修复 |
| `refactor` | ♻️ | 重构 |
| `perf` | ⚡ | 性能 |
| `docs` | 📝 | 文档 |
| `style` | 💄 | 样式 |
| `chore` | 🔧 | 构建 |
| `ci` | 👷 | CI |
| `test` | ✅ | 测试 |

排除 `chore(release): bump version` 自动提交。

输出格式：
```
📋 本次发布内容：

🚀 功能: 设置面板增强 — 快捷键单选、开机启动
🐛 快捷键: 注册失败时显示红字错误提示
🔧 构建: 添加 /commit 和 /release 技能
👷 CI: 发布流程改用 main 分支
```

向用户展示预览，确认无误后继续。

### 3. 切换到 main 并合并

```bash
git checkout main
git pull origin main
git merge tauriV2 --no-edit
```

如果合并有冲突，提示用户手动解决后重新执行。

### 4. 推送 main 触发 Actions

```bash
git push origin main
```

推送成功后，GitHub Actions 会自动：
1. 递增 patch 版本号
2. 从 commit 历史生成 changelog
3. 创建 Release draft
4. 构建安装包（.exe、.msi）

### 5. 切回 tauriV2

```bash
git checkout tauriV2
```

### 6. 输出结果

提示用户：
- 展示本次发布的 changelog 内容
- 已推送到 `main`，GitHub Actions 正在自动发布
- 前往 GitHub → Actions 查看构建进度
- 构建完成后前往 Releases 页面发布 draft

## 注意事项

- 不要在此流程中执行本地打包，打包由 GitHub Actions 完成
- 如果 main 有 tauriV2 没有的提交（Actions 回提交的版本 bump），会自动 rebase 处理
- 合并到 main 前确保本次变更已经过测试
