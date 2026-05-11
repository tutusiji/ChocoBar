---
name: chinese-comments
description: 为代码函数添加中文注释
user_invocable: true
---

为代码函数添加中文注释。

## 使用方式

当用户输入 `/chinese-comments` 或要求为代码添加中文注释时，执行以下步骤：

1. 扫描项目中的代码文件（`.ts`、`.tsx`、`.rs`）
2. 识别缺少中文注释的函数
3. 为每个函数添加规范的中文注释

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
 *
 * @param app - 应用信息对象
 * @param isEditMode - 是否处于编辑模式
 */
export function AppIcon({ app, isEditMode }: AppIconProps) {
  // ...
}
```

### Rust

使用 `///` 文档注释：

```rust
/// 扫描 Windows 注册表和开始菜单，获取已安装应用列表
///
/// # 参数
/// - `app_handle`: Tauri 应用句柄，用于获取路径
///
/// # 返回值
/// 返回应用信息列表，每个包含名称、路径、图标等
pub fn scan_installed_apps(app_handle: &AppHandle) -> Vec<AppInfo> {
    // ...
}
```

对于内部函数使用 `//` 注释：

```rust
// 检查是否为系统组件或可再发行组件，过滤掉不需要的条目
fn should_filter_entry(name: &str) -> bool {
    // ...
}
```

## 注释内容要求

1. **函数用途**：说明函数做什么，为什么需要它
2. **参数说明**：每个参数的含义和预期值
3. **返回值**：返回什么，什么情况下返回特殊值
4. **副作用**：函数是否有副作用（修改状态、IO 操作等）
5. **注意事项**：使用限制、边界条件、异常情况

## 示例

### 差的注释
```typescript
// 获取应用列表
function getApps() { ... }
```

### 好的注释
```typescript
/**
 * 从 Zustand store 获取已固定的应用列表
 * 按照网格位置排序，用于渲染面板网格
 *
 * @returns 排序后的固定应用数组
 */
function getApps() { ... }
```

## 执行流程

1. 扫描项目代码文件
2. 识别所有函数（导出的和内部的）
3. 检查是否已有中文注释
4. 为缺少注释的函数添加规范注释
5. 保持现有代码不变，只添加注释
