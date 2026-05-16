# ChocoBar 开发指南

## 架构概述

ChocoBar 是一个 Tauri v2 应用，采用 Rust 后端 + React 前端架构。后端负责 Windows 系统集成（应用发现、全局快捷键、系统托盘），前端负责 UI 展示。

## 技术栈详情

### 后端 (Rust)

| Crate | 用途 |
|-------|------|
| `tauri` v2 | 应用框架、窗口管理、IPC 通信 |
| `tauri-plugin-global-shortcut` | 全局键盘快捷键注册 |
| `winreg` | Windows 注册表访问，用于应用发现 |
| `serde` / `serde_json` | JSON 序列化，用于状态持久化 |
| `dirs` | Windows 标准目录路径 |
| `sha2` | 哈希应用路径生成唯一 ID |

### 前端 (React)

| 包名 | 用途 |
|------|------|
| `react` 18 | UI 框架 |
| `typescript` | 类型安全 |
| `vite` | 构建工具 / 开发服务器 |
| `zustand` | 轻量级状态管理 |
| `@dnd-kit/core` + `@dnd-kit/sortable` | 应用拖放排序 |
| `lucide-react` | 图标库 |

## 关键设计决策

### 窗口配置

面板窗口配置为：
- **置顶显示** - 始终在其他窗口之上
- **不在任务栏显示** - 不出现在任务栏中
- **无边框** - 自定义标题栏和关闭按钮
- **透明背景** - 毛玻璃效果
- **尺寸**: 800x500px，位于屏幕顶部居中

### 双击 Alt 检测

由于 Tauri 的全局快捷键 API 注册的是单次快捷键，我们在 Rust 中实现双击检测：

1. 将 `Alt` 注册为全局快捷键
2. 每次按下时，检查距上次按键的时间间隔
3. 如果 < 300ms，视为双击 -> 切换面板
4. 防抖处理防止快速重复切换

### 应用发现

扫描两个来源：
1. **Windows 注册表**: `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall` 和 `HKCU` 对应路径
2. **开始菜单**: `ProgramData\Microsoft\Windows\Start Menu` 和用户开始菜单中的 `.lnk` 文件

过滤规则：
- 没有 `DisplayName` 或 `InstallLocation` 的条目
- Windows 系统组件（名称中包含 "Microsoft Windows"）
- 更新补丁和热修复
- 卸载程序

### 状态持久化

应用状态保存到 `%APPDATA%/ChocoBar/state.json`：
```json
{
  "pinned_apps": [
    { "id": "abc123", "grid_x": 0, "grid_y": 0, "order": 0 }
  ],
  "layout_mode": "sequential",
  "grid_cols": 8,
  "grid_rows": 4
}
```

### 布局模式

1. **顺序布局**: 应用从左到右、从上到下填充网格单元格。拖动可重新排序。网格位置根据顺序索引自动计算。

2. **自由磁贴**: 每个应用有独立的 (x, y) 网格坐标。拖动可将应用移动到指定单元格。允许空单元格。

### 编辑模式

- 通过工具栏按钮切换（铅笔图标）
- **开启时**: 应用可拖动，显示删除按钮，接受桌面文件拖入
- **关闭时**: 点击应用直接启动，布局固定

### 拖放功能

使用 `@dnd-kit`：
- `DndContext` 包裹网格
- `SortableContext` 用于顺序布局模式（重排序）
- 自定义碰撞检测用于自由磁贴模式
- `useDroppable` 用于自由磁贴模式下的每个网格单元格
- `useDraggable` 用于每个应用图标

## IPC 命令 (Rust -> React)

| 命令 | 说明 |
|------|------|
| `get_installed_apps` | 返回所有已发现的应用程序 |
| `search_apps(query)` | 按名称过滤应用 |
| `launch_app(path)` | 启动应用程序 |
| `get_state` | 返回持久化的状态 |
| `save_state(state)` | 保存状态到磁盘 |
| `toggle_panel` | 显示/隐藏面板窗口 |

## 开发流程

```bash
# 启动开发服务器（支持热重载）
npm run tauri dev

# 前端类型检查
npx tsc --noEmit

# Rust 代码检查
cd src-tauri && cargo check

# 生产环境构建
npm run tauri build
```

## 文件职责

### Rust

| 文件 | 职责 |
|------|------|
| `main.rs` | 入口点，Tauri 应用构建器 |
| `lib.rs` | 模块声明，插件注册 |
| `app_scanner.rs` | 注册表 + 开始菜单扫描，应用过滤 |
| `commands.rs` | IPC 命令处理器 |
| `tray.rs` | 系统托盘图标和菜单 |
| `shortcut.rs` | 全局快捷键注册，双击检测 |
| `state.rs` | 状态结构体，JSON 加载/保存 |

### React

| 文件 | 职责 |
|------|------|
| `App.tsx` | 根组件，面板可见性管理 |
| `Panel.tsx` | 面板容器，毛玻璃效果 |
| `Toolbar.tsx` | 顶部栏：添加、编辑、布局、关闭按钮 |
| `AppGrid.tsx` | 网格布局，包含 DnD 上下文 |
| `AppIcon.tsx` | 单个应用图标，含拖动手柄 |
| `SearchModal.tsx` | 搜索弹窗，查找应用 |
| `useAppStore.ts` | Zustand store，管理所有应用状态 |
| `grid.ts` | 网格计算工具函数 |
