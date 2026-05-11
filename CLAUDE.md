# ChocoPanel 项目规范

## 项目概述

ChocoPanel 是一个基于 Tauri v2 的 Windows 快速启动面板应用。双击 `Alt` 键即可显示/隐藏浮动面板，快速访问常用应用。

- **后端**: Rust (edition 2021)
- **前端**: React 18 + TypeScript + Vite 6
- **状态管理**: Zustand 5
- **拖拽**: @dnd-kit/core + @dnd-kit/sortable

## 代码规范

### 通用要求

- 所有函数必须有中文注释，说明函数的用途、参数含义和返回值
- 注释应简洁明了，描述"做什么"和"为什么"，而非"怎么做"
- 公共函数使用 JSDoc（前端）或 doc comments（Rust）格式
- 内部函数使用行内注释即可

### TypeScript / React

- 使用函数组件 + Hooks，禁止使用 class 组件
- 使用具名导出（`export function`），不使用默认导出
- 启用严格模式（strict: true）
- CSS 使用普通 `.css` 文件 + CSS 自定义属性，不使用 CSS-in-JS 或 Tailwind
- 类名使用 BEM 风格（如 `.toolbar-left`、`.app-icon`）

### Rust

- 遵循 Rust 2021 edition 标准规范
- 模块按职责划分（一个文件一个关注点）
- IPC 命令处理函数返回 `Result<T, String>`
- 使用 `serde` derive 宏进行序列化
- 使用 `Mutex<AppState>` 进行跨 IPC 的共享状态管理

## 提交规范

使用 `/commit-gen` 技能生成符合规范的提交信息。提交格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档变更 |
| `style` | 代码格式调整（不影响逻辑） |
| `refactor` | 重构（非新功能、非修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |
| `ci` | CI/CD 相关 |

### 范围（scope）

| 范围 | 说明 |
|------|------|
| `frontend` | React 前端 |
| `backend` | Rust 后端 |
| `tauri` | Tauri 框架配置 |
| `ui` | UI/样式 |
| `state` | 状态管理 |
| `shortcut` | 快捷键 |
| `tray` | 系统托盘 |
| `scanner` | 应用扫描 |
| `config` | 配置文件 |

### 示例

```
feat(frontend): 添加搜索模态框组件

- 实现 SearchModal 组件，支持按名称搜索已安装应用
- 集成 Zustand store 的 searchApps 操作
- 添加搜索结果列表的键盘导航支持

Closes #12
```

## 文档语言

- 所有文档（包括 CLAUDE.md、README、技能文件等）使用中文
- 代码注释使用中文
- Git 提交信息使用中文
- 代码中的标识符（变量名、函数名等）使用英文

## 开发命令

```bash
# 启动开发服务器（带热重载）
npm run tauri dev

# 前端类型检查
npx tsc --noEmit

# Rust 代码检查
cd src-tauri && cargo check

# 生产构建
npm run tauri build
```

## 项目结构

```
ChocoPanel/
├── src/                        # React 前端
│   ├── components/             # UI 组件
│   │   ├── AppGrid.tsx         # 网格布局（含拖拽上下文）
│   │   ├── AppIcon.tsx         # 单个应用图标（可拖拽）
│   │   └── Toolbar.tsx         # 顶部工具栏
│   ├── store/
│   │   └── useAppStore.ts      # Zustand 状态管理
│   ├── styles/                 # CSS 样式
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   └── utils/
│       └── grid.ts             # 网格计算工具函数
├── src-tauri/                  # Rust 后端
│   └── src/
│       ├── main.rs             # 入口点
│       ├── lib.rs              # Tauri 应用构建器
│       ├── app_scanner.rs      # Windows 应用发现
│       ├── commands.rs         # IPC 命令处理器
│       ├── shortcut.rs         # 全局快捷键（双击 Alt）
│       ├── state.rs            # 状态持久化
│       └── tray.rs             # 系统托盘
└── docs/                       # 文档
```

## 注意事项

- 窗口配置为无边框、透明背景、始终置顶、不在任务栏显示
- 应用状态保存在 `%APPDATA%/ChocoPanel/state.json`
- 双击检测阈值为 400ms，最小间隔 50ms（防抖）
- 布局模式：顺序模式（自动填充）和自由拼贴模式（指定坐标）
