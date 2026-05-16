---
name: commit
description: 生成符合项目规范的中文提交信息并提交代码
---

# Git 提交流程

## 触发方式

用户说"提交"、"commit"、"提交代码"或执行 `/commit` 时触发。

## 执行步骤

### 1. 检查变更状态

```bash
git status
git diff --stat
git log --oneline -5
```

如果没有变更，提示用户"没有需要提交的变更"并结束。

### 2. 分析变更内容

根据 `git diff` 的实际改动，自动判断：
- **type**：feat / fix / docs / style / refactor / perf / test / chore / ci
- **scope**：frontend / backend / tauri / ui / state / shortcut / tray / scanner / config / ci

判断规则：
| type | 说明 |
|------|------|
| `feat` | 新增功能或组件 |
| `fix` | 修复 bug |
| `docs` | README、CLAUDE.md 等文档变更 |
| `style` | CSS 样式调整（不影响逻辑） |
| `refactor` | 重构（非新功能、非修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |
| `ci` | GitHub Actions / CI/CD 相关 |

| scope | 说明 |
|-------|------|
| `frontend` | src/ 下的 React 组件、store、类型 |
| `backend` | src-tauri/src/ 下的 Rust 代码 |
| `tauri` | Tauri 框架配置（tauri.conf.json、capabilities） |
| `ui` | 纯样式/布局变更 |
| `state` | 状态管理相关 |
| `shortcut` | 快捷键相关 |
| `tray` | 系统托盘相关 |
| `ci` | .github/workflows/ 变更 |
| `config` | 配置文件变更 |

多个 scope 用逗号分隔，如 `feat(frontend,backend)`。

### 3. 生成提交信息

格式：
```
<type>(<scope>): <subject>

<body>
```

- **subject**：一句话概括变更内容，中文，不超过 50 字符
- **body**（可选）：列出 2-4 个关键改动点，以 `-` 开头

示例：
```
feat(frontend,backend): 设置面板增强 — 快捷键单选、开机启动、启动loading、自动关闭面板

- 快捷键设置改为单选按钮组（Ctrl+Space / Alt+Space / 自定义录入）
- 设置中添加开机自启动选项（集成 tauri-plugin-autostart，默认开启）
- 应用启动时显示旋转 loading 图标，防止用户重复点击
- 新增"启动后关闭"设置项，点击应用后自动隐藏面板
```

### 4. 暂存并提交

只暂存相关的源码文件，不要暂存构建产物（target/、dist/、*.msi、*.exe）：

```bash
git add <具体文件列表>
git commit -m "<提交信息>"
```

### 5. 推送到远程

```bash
git push origin <当前分支>
```

如果推送被拒绝（远程有新提交），自动执行：
```bash
git pull --rebase origin <当前分支>
git push origin <当前分支>
```

## 注意事项

- 提交信息必须使用中文
- 不要提交构建产物（target/、dist/、node_modules/）
- 不要提交包含敏感信息的文件（.env、credentials）
- 如果有未暂存的无关变更，不要一并提交
