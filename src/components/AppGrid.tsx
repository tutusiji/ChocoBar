import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { AppIcon } from "./AppIcon";
import type { PinnedApp } from "../types";
import { moveAppInSequence } from "../utils/grid";

/**
 * 应用网格组件
 * 支持顺序模式和自由拼贴模式，编辑模式下可拖拽排序
 */
export function AppGrid() {
  const {
    pinnedApps,
    layoutMode,
    editMode,
    gridCols,
    movePinnedApp,
    reorderPinnedApps,
  } = useAppStore();

  const [activeApp, setActiveApp] = useState<PinnedApp | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // 拖拽开始时记录当前拖拽的应用
  const handleDragStart = (event: DragStartEvent) => {
    const app = pinnedApps.find((p) => p.id === event.active.id);
    setActiveApp(app || null);
  };

  // 拖拽结束时根据布局模式执行排序或交换位置
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveApp(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    if (layoutMode === "sequential") {
      const oldIndex = pinnedApps.findIndex((p) => p.id === active.id);
      const newIndex = pinnedApps.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = moveAppInSequence(pinnedApps, oldIndex, newIndex, gridCols);
        reorderPinnedApps(reordered);
      }
    } else {
      // 自由拼贴模式：交换两个应用的位置
      const draggedApp = pinnedApps.find((p) => p.id === active.id);
      const targetApp = pinnedApps.find((p) => p.id === over.id);
      if (draggedApp && targetApp) {
        movePinnedApp(draggedApp.id, targetApp.grid_x, targetApp.grid_y);
        movePinnedApp(targetApp.id, draggedApp.grid_x, draggedApp.grid_y);
      }
    }
  };

  // 顺序模式下按 order 排序
  const sortedApps =
    layoutMode === "sequential"
      ? [...pinnedApps].sort((a, b) => a.order - b.order)
      : pinnedApps;

  const appIds = sortedApps.map((p) => p.id);

  // 自由拼贴模式的网格样式
  const gridStyle: React.CSSProperties =
    layoutMode === "free-tile"
      ? {
          display: "grid",
          gridTemplateColumns: `repeat(${gridCols}, var(--cell-size))`,
          gap: "var(--gap)",
          justifyContent: "center",
        }
      : {};

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={appIds} strategy={rectSortingStrategy}>
        <div className="grid-container">
          <div
            className={`grid ${editMode ? "edit-mode" : ""}`}
            style={gridStyle}
          >
            {layoutMode === "sequential"
              ? sortedApps.map((app) => (
                  <div key={app.id} className="grid-cell">
                    <AppIcon app={app} />
                  </div>
                ))
              : // 自由拼贴模式：渲染所有网格单元格
                renderFreeTileGrid(sortedApps, gridCols, editMode)}
          </div>
        </div>
      </SortableContext>
      <DragOverlay>
        {activeApp ? (
          <div className="grid-cell" style={{ opacity: 0.8 }}>
            <AppIcon app={activeApp} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * 渲染自由拼贴模式的网格
 * 遍历所有网格单元格，有应用的位置渲染图标，空位渲染占位格
 *
 * @param apps - 已固定的应用列表
 * @param cols - 网格列数
 * @param editMode - 是否处于编辑模式
 * @returns 网格单元格 React 节点数组
 */
function renderFreeTileGrid(
  apps: PinnedApp[],
  cols: number,
  editMode: boolean
) {
  const occupiedMap = new Map<string, PinnedApp>();
  let maxRow = 3; // minimum 4 rows

  for (const app of apps) {
    occupiedMap.set(`${app.grid_x},${app.grid_y}`, app);
    maxRow = Math.max(maxRow, app.grid_y);
  }

  const rows = maxRow + 1;
  const cells: React.ReactNode[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = `${x},${y}`;
      const app = occupiedMap.get(key);

      if (app) {
        cells.push(
          <div key={key} className="grid-cell">
            <AppIcon app={app} />
          </div>
        );
      } else {
        cells.push(
          <div
            key={key}
            className={`grid-cell ${editMode ? "edit-mode" : ""}`}
          />
        );
      }
    }
  }

  return cells;
}
