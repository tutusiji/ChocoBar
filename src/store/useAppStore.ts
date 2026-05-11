import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AppItem, PinnedApp, LayoutMode, AppState } from "../types";

interface AppStore {
  // 系统中发现的所有应用
  allApps: AppItem[];
  // 用户已固定的应用
  pinnedApps: PinnedApp[];
  // UI 状态
  layoutMode: LayoutMode;
  editMode: boolean;
  searchOpen: boolean;
  searchQuery: string;
  searchResults: AppItem[];
  gridCols: number;
  gridRows: number;

  // 操作方法
  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
  searchApps: (query: string) => Promise<void>;
  addPinnedApp: (app: AppItem) => void;
  removePinnedApp: (id: string) => void;
  movePinnedApp: (id: string, gridX: number, gridY: number) => void;
  reorderPinnedApps: (apps: PinnedApp[]) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleEditMode: () => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  launchApp: (path: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  allApps: [],
  pinnedApps: [],
  layoutMode: "sequential",
  editMode: false,
  searchOpen: false,
  searchQuery: "",
  searchResults: [],
  gridCols: 8,
  gridRows: 4,

  /** 从后端加载持久化状态（固定应用、布局模式、网格尺寸） */
  loadState: async () => {
    try {
      const state = await invoke<AppState>("get_state");
      set({
        pinnedApps: state.pinned_apps,
        layoutMode: state.layout_mode,
        gridCols: state.grid_cols,
        gridRows: state.grid_rows,
      });
    } catch (e) {
      console.error("Failed to load state:", e);
    }
  },

  /** 将当前状态持久化保存到后端 */
  saveState: async () => {
    const { pinnedApps, layoutMode, gridCols, gridRows } = get();
    try {
      await invoke("save_state", {
        pinnedApps,
        layoutMode,
        gridCols,
        gridRows,
      });
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  },

  /** 按关键词搜索已安装应用，结果排除已固定的应用 */
  searchApps: async (query: string) => {
    try {
      const results = await invoke<AppItem[]>("search_apps", { query });
      const { pinnedApps } = get();
      const pinnedIds = new Set(pinnedApps.map((p) => p.id));
      // 过滤掉已固定的应用
      set({
        searchResults: results.filter((app) => !pinnedIds.has(app.id)),
        searchQuery: query,
      });
    } catch (e) {
      console.error("Failed to search apps:", e);
    }
  },

  /** 将应用添加到面板固定列表，自动计算网格位置 */
  addPinnedApp: (app: AppItem) => {
    const { pinnedApps, gridCols, layoutMode } = get();
    const order = pinnedApps.length;
    let gridX = 0;
    let gridY = 0;

    if (layoutMode === "sequential") {
      gridX = order % gridCols;
      gridY = Math.floor(order / gridCols);
    } else {
      // 查找第一个空闲单元格
      const occupied = new Set(
        pinnedApps.map((p) => `${p.grid_x},${p.grid_y}`)
      );
      outer: for (let y = 0; y < get().gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
          if (!occupied.has(`${x},${y}`)) {
            gridX = x;
            gridY = y;
            break outer;
          }
        }
      }
    }

    const newApp: PinnedApp = {
      id: app.id,
      name: app.name,
      path: app.path,
      grid_x: gridX,
      grid_y: gridY,
      order,
    };

    set({ pinnedApps: [...pinnedApps, newApp] });
    get().saveState();
  },

  /** 从面板移除已固定的应用，并重新排列剩余应用的顺序 */
  removePinnedApp: (id: string) => {
    const { pinnedApps } = get();
    const filtered = pinnedApps.filter((p) => p.id !== id);
    // 重新排序
    const reordered = filtered.map((p, i) => ({ ...p, order: i }));
    set({ pinnedApps: reordered });
    get().saveState();
  },

  /** 将应用移动到指定网格坐标（自由拼贴模式） */
  movePinnedApp: (id: string, gridX: number, gridY: number) => {
    const { pinnedApps } = get();
    const updated = pinnedApps.map((p) =>
      p.id === id ? { ...p, grid_x: gridX, grid_y: gridY } : p
    );
    set({ pinnedApps: updated });
    get().saveState();
  },

  /** 批量更新固定应用列表（拖拽排序后） */
  reorderPinnedApps: (apps: PinnedApp[]) => {
    set({ pinnedApps: apps });
    get().saveState();
  },

  /** 切换布局模式，切换到顺序模式时自动重新分配网格坐标 */
  setLayoutMode: (mode: LayoutMode) => {
    const { pinnedApps, gridCols } = get();
    if (mode === "sequential") {
      // 根据顺序重新分配网格坐标
      const updated = pinnedApps.map((p, i) => ({
        ...p,
        grid_x: i % gridCols,
        grid_y: Math.floor(i / gridCols),
        order: i,
      }));
      set({ layoutMode: mode, pinnedApps: updated });
    } else {
      set({ layoutMode: mode });
    }
    get().saveState();
  },

  /** 切换编辑模式（显示/隐藏拖拽手柄和删除按钮） */
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  /** 打开/关闭搜索模态框，打开时清空搜索状态并加载全部应用 */
  setSearchOpen: (open: boolean) => {
    set({ searchOpen: open, searchQuery: "", searchResults: [] });
    if (open) {
      // 打开搜索时加载全部应用
      get().searchApps("");
    }
  },

  /** 更新搜索关键词并触发搜索 */
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().searchApps(query);
  },

  /** 通过后端启动指定路径的应用 */
  launchApp: async (path: string) => {
    try {
      await invoke("launch_app", { path });
    } catch (e) {
      console.error("Failed to launch app:", e);
    }
  },
}));
