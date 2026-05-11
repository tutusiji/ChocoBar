import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  AppItem,
  PinnedApp,
  LayoutMode,
  BackgroundMode,
  AppState,
  AppInfo,
  UpdateInfo,
} from "../types";

interface AppStore {
  allApps: AppItem[];
  pinnedApps: PinnedApp[];
  layoutMode: LayoutMode;
  editMode: boolean;
  searchOpen: boolean;
  settingsOpen: boolean;
  aboutOpen: boolean;
  updateOpen: boolean;
  searchQuery: string;
  searchResults: AppItem[];
  gridCols: number;
  gridRows: number;
  windowWidth: number;
  windowHeight: number;
  opacity: number;
  backgroundImage: string | null;
  backgroundMode: BackgroundMode;
  appInfo: AppInfo | null;
  updateInfo: UpdateInfo | null;
  shortcutKey: string;

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
  setSettingsOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setUpdateOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setGridSize: (cols: number, rows: number) => void;
  setWindowSize: (width: number, height: number) => Promise<void>;
  setOpacity: (opacity: number) => void;
  setBackgroundImage: (img: string | null) => void;
  setBackgroundMode: (mode: BackgroundMode) => void;
  pickBackgroundImage: () => Promise<void>;
  fetchAppInfo: () => Promise<void>;
  checkUpdate: () => Promise<void>;
  launchApp: (path: string) => Promise<void>;
  setShortcutKey: (key: string) => void;
  saveShortcutKey: (key: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  allApps: [],
  pinnedApps: [],
  layoutMode: "sequential",
  editMode: false,
  searchOpen: false,
  settingsOpen: false,
  aboutOpen: false,
  updateOpen: false,
  searchQuery: "",
  searchResults: [],
  gridCols: 8,
  gridRows: 4,
  windowWidth: 1200,
  windowHeight: 800,
  opacity: 0.85,
  backgroundImage: null,
  backgroundMode: "stretch",
  appInfo: null,
  updateInfo: null,
  shortcutKey: "ctrl+space",

  loadState: async () => {
    try {
      const state = await invoke<AppState>("get_state");
      const [w, h] = await invoke<[number, number]>("get_window_size");
      set({
        pinnedApps: state.pinned_apps,
        layoutMode: state.layout_mode,
        opacity: state.opacity,
        backgroundImage: state.background_image,
        backgroundMode: state.background_mode,
        shortcutKey: state.shortcut_key || "ctrl+space",
        windowWidth: w,
        windowHeight: h,
      });
    } catch (e) {
      console.error("Failed to load state:", e);
    }
  },

  saveState: async () => {
    const {
      pinnedApps,
      layoutMode,
      opacity,
      backgroundImage,
      backgroundMode,
      shortcutKey,
    } = get();
    try {
      await invoke("save_state", {
        pinnedApps,
        layoutMode,
        opacity,
        backgroundImage,
        backgroundMode,
        shortcutKey,
      });
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  },

  searchApps: async (query: string) => {
    try {
      const results = await invoke<AppItem[]>("search_apps", { query });
      const { pinnedApps } = get();
      const pinnedIds = new Set(pinnedApps.map((p) => p.id));
      set({
        searchResults: results.filter((app) => !pinnedIds.has(app.id)),
        searchQuery: query,
      });
    } catch (e) {
      console.error("Failed to search apps:", e);
    }
  },

  addPinnedApp: (app: AppItem) => {
    const { pinnedApps, gridCols, layoutMode } = get();
    const order = pinnedApps.length;
    let gridX = 0;
    let gridY = 0;

    if (layoutMode === "sequential") {
      gridX = order % gridCols;
      gridY = Math.floor(order / gridCols);
    } else {
      const occupied = new Set(pinnedApps.map((p) => `${p.grid_x},${p.grid_y}`));
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
      icon_data: app.icon_data,
      grid_x: gridX,
      grid_y: gridY,
      order,
    };

    set({ pinnedApps: [...pinnedApps, newApp] });
    get().saveState();
  },

  removePinnedApp: (id: string) => {
    const { pinnedApps, gridCols, layoutMode } = get();
    const filtered = pinnedApps.filter((p) => p.id !== id);
    let reordered: PinnedApp[];
    if (layoutMode === "sequential") {
      reordered = filtered.map((p, i) => ({
        ...p,
        grid_x: i % gridCols,
        grid_y: Math.floor(i / gridCols),
        order: i,
      }));
    } else {
      reordered = filtered;
    }
    set({ pinnedApps: reordered });
    get().saveState();
  },

  movePinnedApp: (id: string, gridX: number, gridY: number) => {
    const { pinnedApps } = get();
    const updated = pinnedApps.map((p) =>
      p.id === id ? { ...p, grid_x: gridX, grid_y: gridY } : p
    );
    set({ pinnedApps: updated });
    get().saveState();
  },

  reorderPinnedApps: (apps: PinnedApp[]) => {
    set({ pinnedApps: apps });
    get().saveState();
  },

  setLayoutMode: (mode: LayoutMode) => {
    const { pinnedApps, gridCols } = get();
    if (mode === "sequential") {
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

  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  setSearchOpen: (open: boolean) => {
    set({ searchOpen: open, searchQuery: "", searchResults: [] });
  },

  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),
  setAboutOpen: (open: boolean) => set({ aboutOpen: open }),
  setUpdateOpen: (open: boolean) => set({ updateOpen: open }),

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().searchApps(query);
  },

  setGridSize: (cols: number, rows: number) => {
    set({ gridCols: cols, gridRows: rows });
  },

  setWindowSize: async (width: number, height: number) => {
    try {
      await invoke("set_window_size", { width, height });
      set({ windowWidth: width, windowHeight: height });
    } catch (e) {
      console.error("Failed to set window size:", e);
    }
  },

  setOpacity: (opacity: number) => {
    set({ opacity });
    get().saveState();
  },

  setBackgroundImage: (img: string | null) => {
    set({ backgroundImage: img });
    get().saveState();
  },

  setBackgroundMode: (mode: BackgroundMode) => {
    set({ backgroundMode: mode });
    get().saveState();
  },

  pickBackgroundImage: async () => {
    try {
      const result = await invoke<string | null>("pick_background_image");
      if (result) {
        set({ backgroundImage: result });
        get().saveState();
      }
    } catch (e) {
      console.error("Failed to pick background image:", e);
    }
  },

  fetchAppInfo: async () => {
    try {
      const info = await invoke<AppInfo>("get_app_info");
      set({ appInfo: info });
    } catch (e) {
      console.error("Failed to get app info:", e);
    }
  },

  checkUpdate: async () => {
    try {
      const info = await invoke<UpdateInfo>("check_update");
      set({ updateInfo: info, updateOpen: true });
    } catch (e) {
      console.error("Failed to check update:", e);
    }
  },

  launchApp: async (path: string) => {
    try {
      await invoke("launch_app", { path });
    } catch (e) {
      console.error("Failed to launch app:", e);
    }
  },

  /** 设置快捷键（本地状态，不立即保存） */
  setShortcutKey: (key: string) => {
    set({ shortcutKey: key });
  },

  /** 保存快捷键配置到后端并重新注册全局快捷键 */
  saveShortcutKey: async (key: string) => {
    try {
      await invoke("update_shortcut", { shortcutKey: key });
      set({ shortcutKey: key });
    } catch (e) {
      console.error("Failed to update shortcut:", e);
    }
  },
}));
