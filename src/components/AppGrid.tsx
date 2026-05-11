import { useState, useCallback, useRef, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import { AppIcon } from "./AppIcon";
import type { AppItem, PinnedApp } from "../types";

const CELL_SIZE = 88;
const GAP = 6;
const PADDING = 10;

/** 拖拽状态 */
interface DragInfo {
  app: PinnedApp;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * 应用网格组件
 * 支持顺序模式和自由拼贴模式，编辑模式下通过鼠标事件拖拽排序
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

  const [hoverCell, setHoverCell] = useState<string | null>(null);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [fileDropHover, setFileDropHover] = useState(false);
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

  /** 根据鼠标坐标计算所在的网格 cell 坐标 */
  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const relX = clientX - rect.left;
      const relY = clientY - rect.top + scrollTop;
      const x = Math.floor((relX - PADDING) / (CELL_SIZE + GAP));
      const y = Math.floor((relY - PADDING) / (CELL_SIZE + GAP));
      if (x < 0 || x >= gridCols || y < 0) return null;
      return { x, y };
    },
    [gridCols]
  );

  // 全局 mousemove/mouseup 监听（拖拽进行中）
  useEffect(() => {
    if (!dragInfo) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      setDragInfo((prev) =>
        prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
      );
      const cell = getCellFromPoint(e.clientX, e.clientY);
      setHoverCell(cell ? `${cell.x},${cell.y}` : null);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell) {
        const source = dragInfo.app;
        if (layoutMode === "sequential") {
          // 顺序模式：找到目标位置的应用并交换顺序
          const targetApp = pinnedApps.find(
            (p) => p.grid_x === cell.x && p.grid_y === cell.y
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
          // 自由磁贴模式：移动到目标位置
          const occupied = pinnedApps.find(
            (p) =>
              p.tile_x === cell.x && p.tile_y === cell.y && p.id !== source.id
          );
          if (occupied) {
            movePinnedApp(source.id, cell.x, cell.y);
            movePinnedApp(occupied.id, source.tile_x, source.tile_y);
          } else {
            movePinnedApp(source.id, cell.x, cell.y);
          }
        }
      }
      setDragInfo(null);
      setHoverCell(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragInfo, pinnedApps, layoutMode, gridCols, getCellFromPoint, movePinnedApp, reorderPinnedApps]);

  /** 鼠标按下时开始拖拽 */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, app: PinnedApp) => {
      if (e.button !== 0) return;
      e.preventDefault();
      setDragInfo({
        app,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });
    },
    []
  );

  const maxRow =
    layoutMode === "sequential"
      ? Math.max(gridRows, Math.ceil(pinnedApps.length / gridCols))
      : gridRows;

  const cells: React.ReactNode[] = [];

  if (layoutMode === "sequential") {
    // 顺序模式：仅编辑模式下可拖动
    const sorted = [...pinnedApps].sort((a, b) => a.order - b.order);
    sorted.forEach((app, i) => {
      const x = i % gridCols;
      const y = Math.floor(i / gridCols);
      const cellKey = `${x},${y}`;
      cells.push(
        <div
          key={cellKey}
          className={`grid-cell ${editMode ? "edit-mode" : ""} ${
            hoverCell === cellKey ? "drop-hover" : ""
          }`}
        >
          <AppIcon app={app} draggable={editMode} onMouseDown={handleMouseDown} />
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
              hoverCell === cellKey ? "drop-hover" : ""
            }`}
          />
        );
      }
    }
  } else {
    // 自由磁贴模式：使用 tile_x/tile_y 渲染，图标始终可拖动
    const occupiedMap = new Map<string, PinnedApp>();
    for (const app of pinnedApps) {
      occupiedMap.set(`${app.tile_x},${app.tile_y}`, app);
    }

    for (let y = 0; y < maxRow; y++) {
      for (let x = 0; x < gridCols; x++) {
        const cellKey = `${x},${y}`;
        const app = occupiedMap.get(cellKey);

        cells.push(
          <div
            key={cellKey}
            className={`grid-cell ${editMode ? "edit-mode" : ""} ${
              hoverCell === cellKey ? "drop-hover" : ""
            }`}
          >
            {app && <AppIcon app={app} draggable={true} onMouseDown={handleMouseDown} />}
          </div>
        );
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`grid-container ${fileDropHover ? "file-drop-active" : ""} ${
        dragInfo ? "dragging" : ""
      }`}
    >
      <div
        className="grid"
        style={{ "--grid-cols": gridCols } as React.CSSProperties}
      >
        {cells}
      </div>
      {fileDropHover && editMode && (
        <div className="file-drop-overlay">
          <span>拖放到此处添加应用</span>
        </div>
      )}
      {/* 拖拽预览图标 */}
      {dragInfo && (
        <div
          className="drag-preview"
          style={{
            left: dragInfo.currentX - CELL_SIZE / 2,
            top: dragInfo.currentY - CELL_SIZE / 2,
          }}
        >
          <div className="drag-preview-inner">
            {dragInfo.app.icon_data ? (
              <img src={dragInfo.app.icon_data} alt={dragInfo.app.name} />
            ) : (
              <span>{dragInfo.app.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
