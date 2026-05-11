# ChocoPanel 项目规范

## 项目概述

ChocoPanel 是一个基于 Tauri v2 的 Windows 快速启动面板应用。双击快捷键（默认 `Ctrl+Space`）即可显示/隐藏浮动面板，快速访问常用应用。

- **后端**: Rust (edition 2021)
- **前端**: React 18 + TypeScript + Vite 6
- **状态管理**: Zustand 5
- **拖拽**: 原生 HTML5 Drag API
- **图标**: Lucide React

## 语言规范（重要）

### 必须使用中文的场景

- 所有对话回复和输出
- 代码修改的说明和总结
- 文档（README、CLAUDE.md、技能文件等）
- 代码注释（函数注释、行内注释）
- Git 提交信息
- 错误信息和日志输出的描述

### 保持英文的场景

- 代码标识符（变量名、函数名、类型名等）
- 技术术语（如 API 名称、crate 名称等）
- 配置文件中的键名

## 代码注释规范（自动执行）

**编辑代码时，必须自动为新增或修改的函数添加中文注释。** 这是强制要求，每次编辑代码都应遵守。

### TypeScript / React 函数注释

使用 JSDoc 格式：

```typescript
/**
 * 从后端加载持久化状态（固定应用、布局模式、透明度等）
 * 加载完成后更新 Zustand store 中的对应字段
 */
loadState: async () => {
  // ...
}
```

### Rust 函数注释

使用 `///` 文档注释（公共函数）或 `//` 行内注释（内部函数）：

```rust
/// 解析快捷键字符串为 Modifiers + Code
///
/// 支持格式: "ctrl+space", "alt+space", "ctrl+shift+q" 等
fn parse_shortcut(key_str: &str) -> Option<(Modifiers, Code)> {
    // ...
}
```

### 注释内容要求

1. **函数用途**：说明函数做什么，为什么需要它
2. **参数说明**：每个参数的含义和预期值（公共函数必须，内部函数可选）
3. **返回值**：返回什么，什么情况下返回特殊值（公共函数必须）
4. **注意事项**：使用限制、边界条件、异常情况（如有）

### 不需要注释的情况

- 简单的 getter/setter（如 `setOpen: (open) => set({ open })`）
- 纯粹的类型定义
- CSS 变量定义

## 代码规范

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
│   │   ├── Panel.tsx           # 面板主组件
│   │   ├── Toolbar.tsx         # 顶部工具栏
│   │   ├── AppGrid.tsx         # 网格布局（含拖拽、自动计算行列）
│   │   ├── AppIcon.tsx         # 单个应用图标
│   │   ├── SearchModal.tsx     # 搜索模态框
│   │   ├── SettingsModal.tsx   # 设置面板
│   │   ├── AboutModal.tsx      # 关于对话框
│   │   └── UpdateModal.tsx     # 更新检查对话框
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
│       ├── app_scanner.rs      # Windows 应用扫描
│       ├── commands.rs         # IPC 命令处理器
│       ├── shortcut.rs         # 全局快捷键（双击检测）
│       ├── state.rs            # 状态持久化
│       ├── tray.rs             # 系统托盘
│       └── icon_extractor.rs   # 应用图标提取
└── docs/                       # 文档
```

## 注意事项

- 窗口配置为无边框、透明背景、始终置顶、不在任务栏显示
- 应用状态保存在 `%APPDATA%/ChocoPanel/state.json`
- 双击检测阈值为 500ms，最小间隔 50ms（防抖）
- 布局模式：顺序模式（自动填充）和自由拼贴模式（指定坐标）
- 网格列数和行数根据面板宽高自动计算（单元格 88px + 间距 6px）
- 编辑模式下窗口可拖拽调整大小，退出时自动保存尺寸
- 快捷键支持动态修改，格式如 "ctrl+space"、"alt+q" 等
