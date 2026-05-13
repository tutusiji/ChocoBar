---
name: version-bump
description: 版本号自动递增规则 - 每次打包时自动增加 patch 版本号
---

# 版本号自动递增规则

## 规则说明

每次执行打包命令时，版本号会自动递增 patch 版本（如 0.2.0 → 0.2.1 → 0.2.2）。

## 触发条件

当用户执行以下操作时，自动递增版本号：
- 本地打包：`npm run tauri:build`
- 本地开发：`npm run tauri:dev`
- 手动递增：`npm run bump`
- GitHub Actions 推送到 tauriV2 分支时

## 版本号格式

遵循语义化版本（SemVer）：`MAJOR.MINOR.PATCH`
- MAJOR：重大功能变更或不兼容更新
- MINOR：新功能添加，向后兼容
- PATCH：Bug 修复和小改动

## 涉及文件

版本号会同步更新到以下文件：
- `package.json` - npm 版本
- `src-tauri/Cargo.toml` - Rust 包版本
- `src-tauri/tauri.conf.json` - Tauri 应用版本
- `src-tauri/src/commands.rs` - 应用信息中的版本号

## 使用方式

### 本地打包（自动递增）
```bash
npm run tauri:build
```

### 本地开发（自动递增）
```bash
npm run tauri:dev
```

### 手动递增版本号
```bash
npm run bump
```

### GitHub Actions
推送到 tauriV2 分支时，CI 会自动递增版本号并创建 Release。

## 注意事项

- 版本号递增是自动的，无需手动修改
- 如果需要升级 MINOR 或 MAJOR 版本，请手动修改 `package.json` 中的版本号
- 打包前请确保代码已提交，避免版本号与代码不一致
