---
name: chinese-comments
description: 为代码函数添加中文注释（编辑代码时自动执行）
user_invocable: true
---

为代码函数添加中文注释。

## 使用方式

当用户输入 `/chinese-comments` 或要求为代码添加中文注释时，执行以下步骤：

1. 扫描项目中的代码文件（`.ts`、`.tsx`、`.rs`）
2. 识别缺少中文注释的函数
3. 为每个函数添加规范的中文注释

## 重要规则

**编辑代码时自动执行**：每次修改或新增函数时，必须自动添加中文注释。这是项目规范的强制要求。

## 注释规范

### TypeScript / React

使用 JSDoc 格式：

```typescript
/**
 * 计算网格中指定位置的像素坐标
 * @param col - 列索引（从 0 开始）
 * @param row - 行索引（从 0 开始）
 * @param cellSize - 单元格大小（像素）
 * @returns 像素坐标 { x, y }
 */
export function getGridPixelPosition(col: number, row: number, cellSize: number) {
  // ...
}
```

对于 React 组件：

```typescript
/**
 * 应用图标组件
 * 支持拖拽操作和点击启动应用
 */
export function AppIcon({ app, onDragStart }: AppIconProps) {
  // ...
}
```

对于 Zustand store 方法：

```typescript
/** 从后端加载持久化状态（固定应用、布局模式、透明度等） */
loadState: async () => {
  // ...
}
```

### Rust

使用 `///` 文档注释（公共函数）：

```rust
/// 解析快捷键字符串为 Modifiers + Code
///
/// 支持格式: "ctrl+space", "alt+space", "ctrl+shift+q" 等
fn parse_shortcut(key_str: &str) -> Option<(Modifiers, Code)> {
    // ...
}
```

使用 `//` 行内注释（内部函数）：

```rust
// 检查是否为系统组件或可再发行组件，过滤掉不需要的条目
fn should_filter_entry(name: &str) -> bool {
    // ...
}
```

## 注释内容要求

1. **函数用途**：说明函数做什么，为什么需要它
2. **参数说明**：每个参数的含义和预期值（公共函数必须，内部函数可选）
3. **返回值**：返回什么，什么情况下返回特殊值（公共函数必须）
4. **注意事项**：使用限制、边界条件、异常情况（如有）

## 不需要注释的情况

- 简单的 getter/setter
- 纯粹的类型定义
- CSS 变量定义

## 执行流程

1. 扫描项目代码文件
2. 识别所有函数（导出的和内部的）
3. 检查是否已有中文注释
4. 为缺少注释的函数添加规范注释
5. 保持现有代码不变，只添加注释
