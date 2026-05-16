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

### 2. 切换到 main 并合并

```bash
git checkout main
git pull origin main
git merge tauriV2 --no-edit
```

如果合并有冲突，提示用户手动解决后重新执行。

### 3. 推送 main 触发 Actions

```bash
git push origin main
```

推送成功后，GitHub Actions 会自动：
1. 递增 patch 版本号
2. 从 commit 历史生成 changelog
3. 创建 Release draft
4. 构建安装包（.exe、.msi）

### 4. 切回 tauriV2

```bash
git checkout tauriV2
```

### 5. 输出结果

提示用户：
- 已推送到 `main`，GitHub Actions 正在自动发布
- 前往 GitHub → Actions 查看构建进度
- 构建完成后前往 Releases 页面发布 draft

## 注意事项

- 不要在此流程中执行本地打包，打包由 GitHub Actions 完成
- 如果 main 有 tauriV2 没有的提交（Actions 回提交的版本 bump），会自动 rebase 处理
- 合并到 main 前确保本次变更已经过测试
