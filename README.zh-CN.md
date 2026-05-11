# ChocoPanel

一个轻量级的 Windows 快速启动面板，基于 Tauri (Rust + React) 构建。双击 `Alt` 键即可快速访问你喜爱的应用程序。

## 功能特性

- **快速切换**: 双击 `Alt` 键显示/隐藏面板
- **系统托盘**: 后台运行，托盘区显示图标
- **应用发现**: 自动扫描 Windows 已安装的应用程序
- **搜索功能**: 快速查找并固定应用程序
- **网格布局**: 两种布局模式 - 顺序布局和自由磁贴布局
- **编辑模式**: 拖放排列应用图标
- **桌面拖拽**: 将桌面快捷方式拖入面板（仅编辑模式下可用）
- **数据持久化**: 固定的应用和布局在重启后保留

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Tauri v2 |
| 后端 | Rust |
| 前端 | React 18 + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Zustand |
| 拖放 | @dnd-kit |
| 图标 | Lucide React |

## 快速开始

### 环境要求

- Windows 10/11
- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri 环境依赖](https://v2.tauri.app/start/prerequisites/)

### 安装

```bash
# 安装前端依赖
npm install

# 开发模式运行
npm run tauri dev

# 生产环境构建
npm run tauri build
```

### 使用方法

1. 启动 ChocoPanel - 系统托盘区出现图标
2. 双击 `Alt` 或点击托盘图标显示面板
3. 点击 `+` 搜索并添加应用程序
4. 切换编辑模式可通过拖放排列应用
5. 按 `Esc` 或点击关闭按钮隐藏面板
6. 右键点击托盘图标可完全退出

## 项目结构

```
ChocoPanel/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── store/              # Zustand 状态管理
│   ├── styles/             # CSS 样式
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数
├── src-tauri/              # Rust 后端
│   └── src/
│       ├── app_scanner.rs  # Windows 应用发现
│       ├── commands.rs     # IPC 命令
│       ├── tray.rs         # 系统托盘
│       ├── shortcut.rs     # 全局快捷键（双击 Alt）
│       └── state.rs        # 状态持久化
└── docs/                   # 文档
```

## 许可证

MIT
