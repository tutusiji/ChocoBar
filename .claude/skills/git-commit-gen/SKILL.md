---
name: commit-gen
description: 生成符合项目规范的 Git 提交信息
user_invocable: true
---

生成符合项目规范的 Git 提交信息。

## 使用方式

当用户输入 `/commit-gen` 或要求生成提交信息时，执行以下步骤：

1. 运行 `git diff --cached` 查看暂存区的变更
2. 运行 `git diff` 查看工作区的变更
3. 运行 `git status` 查看文件状态
4. 分析变更内容，生成符合规范的提交信息

## 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## 规则

### type（必填）

根据变更内容选择：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式调整（不影响逻辑）
- `refactor`: 重构（非新功能、非修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具/依赖变更
- `ci`: CI/CD 相关

### scope（必填）

根据涉及的模块选择：
- `frontend`: React 前端代码
- `backend`: Rust 后端代码
- `tauri`: Tauri 框架配置
- `ui`: UI 组件和样式
- `state`: Zustand 状态管理
- `shortcut`: 快捷键功能
- `tray`: 系统托盘
- `scanner`: 应用扫描
- `config`: 配置文件变更

### subject（必填）

- 使用中文
- 简洁描述变更内容
- 不超过 50 个字符
- 不以句号结尾

### body（可选）

- 使用中文
- 详细说明变更的动机和内容
- 使用列表格式（`-` 开头）
- 说明"做了什么"和"为什么"

### footer（可选）

- 关联 Issue：`Closes #12`、`Fixes #34`
- 破坏性变更：`BREAKING CHANGE: 说明`

## 示例

```
feat(frontend): 添加搜索模态框组件

- 实现 SearchModal 组件，支持按名称搜索已安装应用
- 集成 Zustand store 的 searchApps 操作
- 添加搜索结果列表的键盘导航支持

Closes #12
```

```
fix(shortcut): 修复双击 Alt 误触问题

- 将双击检测阈值从 300ms 调整为 400ms
- 增加 50ms 最小间隔防抖机制
```

```
refactor(backend): 优化应用扫描性能

- 将注册表扫描和开始菜单扫描并行化
- 使用缓存避免重复扫描
- 减少不必要的字符串分配
```

## 执行流程

1. 检查是否有暂存的变更（`git diff --cached`）
2. 如果没有暂存变更，提示用户先 `git add`
3. 分析所有变更文件，识别涉及的模块
4. 根据变更类型选择合适的 type
5. 根据涉及模块选择合适的 scope
6. 生成简洁的 subject
7. 如果变更较多，生成详细的 body
8. 输出完整的提交信息供用户确认
9. 用户确认后执行 `git commit`
