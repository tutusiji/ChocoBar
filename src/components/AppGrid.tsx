import { useState, useCallback, useRef, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import { AppIcon } from "./AppIcon";
import type { AppItem, PinnedApp } from "../types";

const CELL_SIZE = 88;
const GAP = 6;
const PADDING = 10;

/**
 * 应用网格组件
 * 支持顺序模式和自由拼贴模式，编辑模式下可拖拽排序
 * 支持从桌面拖入文件添加应用
 * 网格列数和行数根据容器尺寸自动计算
 */
export function AppGrid() {
  const {
    pinnedApps,
    layoutMode,
    editMode,
    gridCols,
    gridRows,
    movePinnedApp,
    reorderPinnedApps,
    addPinnedApp,
    setGridSize,
  } = useAppStore();

  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [fileDropHover, setFileDropHover] = useState(false);
  const dragSourceRef = useRef<PinnedApp | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动计算网格列数和行数（基于容器尺寸）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateGrid = () => {
      const w = el.clientWidth - PADDING * 2;
      const h = el.clientHeight - PADDING * 2;
      const cols = Math.max(1, Math.floor((w + GAP) / (CELL_SIZE + GAP)));
      const rows = Math.max(1, Math.floor((h + GAP) / (CELL_SIZE + GAP)));
      if (cols !== gridCols || rows !== gridRows) {
        setGridSize(cols, rows);
      }
    };

    updateGrid();
    const observer = new ResizeObserver(updateGrid);
    observer.observe(el);
    return () => observer.disconnect();
  }, [gridCols, gridRows, setGridSize]);

  // 监听文件拖放事件（从桌面拖入）
  useEffect(() => {
    if (!editMode) return;

    const unlistenDrop = listen<string[]>("file-drop", async (event) => {
      const paths = event.payload;
      for (const filePath of paths) {
        const lower = filePath.toLowerCase();
        if (
          lower.endsWith(".exe") ||
          lower.endsWith(".lnk") ||
          lower.endsWith(".bat") ||
          lower.endsWith(".cmd")
        ) {
          try {
            const app = await invoke<AppItem | null>("resolve_app_from_path", {
              path: filePath,
            });
            if (app) {
              // 检查是否已存在
              const exists = pinnedApps.some((p) => p.id === app.id);
              if (!exists) {
                addPinnedApp(app);
              }
            }
          } catch (e) {
            console.error("Failed to resolve app:", e);
          }
        }
      }
      setFileDropHover(false);
    });

    const unlistenEnter = listen<string[]>("file-drop-enter", () => {
      setFileDropHover(true);
    });

    const unlistenLeave = listen("file-drop-leave", () => {
      setFileDropHover(false);
    });

    return () => {
      unlistenDrop.then((fn) => fn());
      unlistenEnter.then((fn) => fn());
      unlistenLeave.then((fn) => fn());
    };
  }, [editMode, pinnedApps, addPinnedApp]);

  // 内部拖拽：记录拖拽源应用并设置拖拽效果
  const handleDragStart = useCallback(
    (e: React.DragEvent, app: PinnedApp) => {
      dragSourceRef.current = app;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", app.id);
      const target = e.target as HTMLElement;
      requestAnimationFrame(() => {
        target.classList.add("dragging");
      });
    },
    []
  );

  // 拖拽结束时清理状态
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove("dragging");
    dragSourceRef.current = null;
    setDragOverCell(null);
  }, []);

  // 拖拽经过单元格时高亮显示
  const handleDragOver = useCallback(
    (e: React.DragEvent, cellKey: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverCell(cellKey);
    },
    []
  );

  // 拖拽离开单元格时取消高亮
  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  // 放置时根据布局模式执行排序或交换位置
  const handleDrop = useCallback(
    (e: React.DragEvent, targetX: number, targetY: number) => {
      e.preventDefault();
      setDragOverCell(null);

      const source = dragSourceRef.current;
      if (!source) return;

      if (layoutMode === "sequential") {
        const targetApp = pinnedApps.find(
          (p) => p.grid_x === targetX && p.grid_y === targetY
        );
        if (targetApp && targetApp.id !== source.id) {
          const oldIndex = pinnedApps.findIndex((p) => p.id === source.id);
          const newIndex = pinnedApps.findIndex((p) => p.id === targetApp.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            const result = [...pinnedApps];
            const [moved] = result.splice(oldIndex, 1);
            result.splice(newIndex, 0, moved);
            const reordered = result.map((p, i) => ({
              ...p,
              grid_x: i % gridCols,
              grid_y: Math.floor(i / gridCols),
              order: i,
            }));
            reorderPinnedApps(reordered);
          }
        }
      } else {
        const occupied = pinnedApps.find(
          (p) =>
            p.grid_x === targetX && p.grid_y === targetY && p.id !== source.id
        );
        if (occupied) {
          movePinnedApp(source.id, targetX, targetY);
          movePinnedApp(occupied.id, source.grid_x, source.grid_y);
        } else {
          movePinnedApp(source.id, targetX, targetY);
        }
      }

      dragSourceRef.current = null;
    },
    [pinnedApps, layoutMode, gridCols, movePinnedApp, reorderPinnedApps]
  );

  const maxRow =
    layoutMode === "sequential"
      ? Math.max(gridRows, Math.ceil(pinnedApps.length / gridCols))
      : gridRows;

  const cells: React.ReactNode[] = [];

  if (layoutMode === "sequential") {
    const sorted = [...pinnedApps].sort((a, b) => a.order - b.order);
    sorted.forEach((app, i) => {
      const x = i % gridCols;
      const y = Math.floor(i / gridCols);
      const cellKey = `${x},${y}`;
      cells.push(
        <div
          key={cellKey}
          className={`grid-cell ${editMode ? "edit-mode" : ""} ${
            dragOverCell === cellKey ? "drop-hover" : ""
          }`}
          onDragOver={editMode ? (e) => handleDragOver(e, cellKey) : undefined}
          onDragLeave={editMode ? handleDragLeave : undefined}
          onDrop={editMode ? (e) => handleDrop(e, x, y) : undefined}
        >
          <AppIcon app={app} onDragStart={handleDragStart} />
        </div>
      );
    });

    if (editMode) {
      const totalCells = maxRow * gridCols;
      for (let i = sorted.length; i < totalCells; i++) {
        const x = i % gridCols;
        const y = Math.floor(i / gridCols);
        const cellKey = `${x},${y}`;
        cells.push(
          <div
            key={cellKey}
            className={`grid-cell edit-mode ${
              dragOverCell === cellKey ? "drop-hover" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, cellKey)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, x, y)}
          />
        );
      }
    }
  } else {
    const occupiedMap = new Map<string, PinnedApp>();
    for (const app of pinnedApps) {
      occupiedMap.set(`${app.grid_x},${app.grid_y}`, app);
    }

    for (let y = 0; y < maxRow; y++) {
      for (let x = 0; x < gridCols; x++) {
        const cellKey = `${x},${y}`;
        const app = occupiedMap.get(cellKey);

        cells.push(
          <div
            key={cellKey}
            className={`grid-cell ${editMode ? "edit-mode" : ""} ${
              dragOverCell === cellKey ? "drop-hover" : ""
            }`}
            onDragOver={editMode ? (e) => handleDragOver(e, cellKey) : undefined}
            onDragLeave={editMode ? handleDragLeave : undefined}
            onDrop={editMode ? (e) => handleDrop(e, x, y) : undefined}
          >
            {app && <AppIcon app={app} onDragStart={handleDragStart} />}
          </div>
        );
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`grid-container ${fileDropHover ? "file-drop-active" : ""}`}
      onDragEnd={handleDragEnd}
    >
      <div
        className="grid"
        style={{ "--grid-cols": gridCols } as React.CSSProperties}
      >
        {cells}
      </div>
      {fileDropHover && editMode && (
        <div className="file-drop-overlay">
          <span>Drop to add application</span>
        </div>
      )}
    </div>
  );
}
