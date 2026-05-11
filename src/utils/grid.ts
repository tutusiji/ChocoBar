import type { PinnedApp } from "../types";

/**
 * 根据顺序索引计算网格坐标
 * @param index - 应用在列表中的顺序索引
 * @param cols - 网格列数
 * @returns 网格坐标 { x, y }
 */
export function getSequentialGridPosition(
  index: number,
  cols: number
): { x: number; y: number } {
  return {
    x: index % cols,
    y: Math.floor(index / cols),
  };
}

/**
 * 重新排列应用列表，根据顺序索引重新分配网格坐标
 * @param apps - 已固定的应用列表
 * @param cols - 网格列数
 * @returns 重新排列后的应用列表
 */
export function reorderApps(apps: PinnedApp[], cols: number): PinnedApp[] {
  return apps.map((app, i) => ({
    ...app,
    grid_x: i % cols,
    grid_y: Math.floor(i / cols),
    order: i,
  }));
}

/**
 * 在顺序模式下移动应用位置
 * @param apps - 已固定的应用列表
 * @param fromIndex - 源位置索引
 * @param toIndex - 目标位置索引
 * @param cols - 网格列数
 * @returns 移动并重新排列后的应用列表
 */
export function moveAppInSequence(
  apps: PinnedApp[],
  fromIndex: number,
  toIndex: number,
  cols: number
): PinnedApp[] {
  const result = [...apps];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return reorderApps(result, cols);
}

/**
 * 计算网格所需的行数
 * @param apps - 已固定的应用列表
 * @param cols - 网格列数
 * @returns 网格行数（至少为 1）
 */
export function getGridRows(apps: PinnedApp[], cols: number): number {
  if (apps.length === 0) return 1;
  return Math.ceil(apps.length / cols);
}

/**
 * 检查指定网格单元格是否已被占用
 * @param apps - 已固定的应用列表
 * @param x - 列坐标
 * @param y - 行坐标
 * @param excludeId - 排除的应用 ID（用于拖拽时忽略自身）
 * @returns 单元格是否被占用
 */
export function isCellOccupied(
  apps: PinnedApp[],
  x: number,
  y: number,
  excludeId?: string
): boolean {
  return apps.some(
    (app) => app.grid_x === x && app.grid_y === y && app.id !== excludeId
  );
}
