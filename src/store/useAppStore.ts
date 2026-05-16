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
  backgroundBlur: number;
  appInfo: AppInfo | null;
  updateInfo: UpdateInfo | null;
  shortcutKey: string;
  autoStart: boolean;
  closeOnLaunch: boolean;
  launchingAppId: string | null;

  loadState: () => Promise<void>;
  saveState: () => Promise<void>;
  searchApps: (query: string) => Promise<void>;
  addPinnedApp: (app: AppItem) => void;
  removePinnedApp: (id: string) => void;
  movePinnedApp: (id: string, x: number, y: number) => void;
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
  setBackgroundBlur: (blur: number) => void;
  pickBackgroundImage: () => Promise<void>;
  fetchAppInfo: () => Promise<void>;
  checkUpdate: () => Promise<void>;
  launchApp: (path: string) => Promise<void>;
  setShortcutKey: (key: string) => void;
  saveShortcutKey: (key: string) => Promise<boolean>;
  setAutoStart: (autoStart: boolean) => Promise<void>;
  setCloseOnLaunch: (closeOnLaunch: boolean) => void;
  setLaunchingAppId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  allApps: [],
  pinnedApps: [],
  layoutMode: "free-tile",
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
  backgroundBlur: 0,
  appInfo: null,
  updateInfo: null,
  shortcutKey: "ctrl+space",
  autoStart: true,
  closeOnLaunch: true,
  launchingAppId: null,

  /** 从后端加载持久化状态 */
  loadState: async () => {
    try {
      const state = await invoke<AppState>("get_state");
      const [w, h] = await invoke<[number, number]>("get_window_size");
      // 为旧数据补充 tile_x/tile_y 字段
      const pinnedApps = state.pinned_apps.map((p) => ({
        ...p,
        tile_x: (p as any).tile_x ?? p.grid_x,
        tile_y: (p as any).tile_y ?? p.grid_y,
      }));
      set({
        pinnedApps,
        layoutMode: state.layout_mode,
        opacity: state.opacity,
        backgroundImage: state.background_image,
        backgroundMode: state.background_mode,
        backgroundBlur: (state as any).background_blur ?? 0,
        shortcutKey: state.shortcut_key || "ctrl+space",
        autoStart: (state as any).auto_start ?? true,
        closeOnLaunch: (state as any).close_on_launch ?? true,
        windowWidth: w,
        windowHeight: h,
      });
    } catch (e) {
      console.error("加载状态失败:", e);
    }
  },

  /** 保存当前状态到后端 */
  saveState: async () => {
    const {
      pinnedApps,
      layoutMode,
      opacity,
      backgroundImage,
      backgroundMode,
      backgroundBlur,
      shortcutKey,
      autoStart,
      closeOnLaunch,
    } = get();
    try {
      await invoke("save_state", {
        pinnedApps,
        layoutMode,
        opacity,
        backgroundImage,
        backgroundMode,
        backgroundBlur,
        shortcutKey,
        autoStart,
        closeOnLaunch,
      });
    } catch (e) {
      console.error("保存状态失败:", e);
    }
  },

  /** 按关键词搜索已安装应用 */
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
      console.error("搜索失败:", e);
    }
  },

  /** 将应用添加到面板，同时设置顺序模式和磁贴模式的位置 */
  addPinnedApp: (app: AppItem) => {
    const { pinnedApps, gridCols, gridRows } = get();
    const order = pinnedApps.length;

    // 顺序模式位置
    const gridX = order % gridCols;
    const gridY = Math.floor(order / gridCols);

    // 磁贴模式位置：找到第一个空闲格子
    let tileX = gridX;
    let tileY = gridY;
    const occupied = new Set(
      pinnedApps.map((p) => `${p.tile_x},${p.tile_y}`)
    );
    outer: for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        if (!occupied.has(`${x},${y}`)) {
          tileX = x;
          tileY = y;
          break outer;
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
      tile_x: tileX,
      tile_y: tileY,
      order,
    };

    set({ pinnedApps: [...pinnedApps, newApp] });
    get().saveState();

    // 如果图标缺失，异步获取后更新
    if (!app.icon_data) {
      invoke<string | null>("get_app_icon", { path: app.path })
        .then((icon) => {
          if (icon) {
            const { pinnedApps: current } = get();
            const updated = current.map((p) =>
              p.id === app.id ? { ...p, icon_data: icon } : p
            );
            set({ pinnedApps: updated });
            get().saveState();
          }
        })
        .catch((e) => console.error("获取图标失败:", e));
    }
  },

  /** 从面板移除应用，顺序模式下重新分配位置 */
  removePinnedApp: (id: string) => {
    const { pinnedApps, gridCols, layoutMode } = get();
    const filtered = pinnedApps.filter((p) => p.id !== id);

    if (layoutMode === "sequential") {
      const reordered = filtered.map((p, i) => ({
        ...p,
        grid_x: i % gridCols,
        grid_y: Math.floor(i / gridCols),
        order: i,
      }));
      set({ pinnedApps: reordered });
    } else {
      set({ pinnedApps: filtered });
    }
    get().saveState();
  },

  /** 移动应用到指定位置（根据当前布局模式更新对应字段） */
  movePinnedApp: (id: string, x: number, y: number) => {
    const { pinnedApps, layoutMode } = get();
    const updated = pinnedApps.map((p) => {
      if (p.id !== id) return p;
      if (layoutMode === "sequential") {
        return { ...p, grid_x: x, grid_y: y };
      } else {
        return { ...p, tile_x: x, tile_y: y };
      }
    });
    set({ pinnedApps: updated });
    get().saveState();
  },

  /** 批量更新固定应用列表（拖拽排序后） */
  reorderPinnedApps: (apps: PinnedApp[]) => {
    set({ pinnedApps: apps });
    get().saveState();
  },

  /** 切换布局模式，保留各自的位置记忆 */
  setLayoutMode: (mode: LayoutMode) => {
    const { pinnedApps, gridCols } = get();

    if (mode === "sequential") {
      // 切换到顺序模式：重新计算 grid_x/grid_y，保留 tile_x/tile_y
      const updated = pinnedApps.map((p, i) => ({
        ...p,
        grid_x: i % gridCols,
        grid_y: Math.floor(i / gridCols),
        order: i,
        // tile_x/tile_y 保持不变
      }));
      set({ layoutMode: mode, pinnedApps: updated });
    } else {
      // 切换到磁贴模式：使用保存的 tile_x/tile_y，保留 grid_x/grid_y
      set({ layoutMode: mode });
    }
    get().saveState();
  },

  /** 切换编辑模式 */
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  /** 打开/关闭搜索模态框 */
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
      console.error("设置窗口尺寸失败:", e);
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

  setBackgroundBlur: (blur: number) => {
    set({ backgroundBlur: blur });
    get().saveState();
  },

  /** 通过 HTML 文件选择器上传背景图片并转为 base64 data URI */
  pickBackgroundImage: async () => {
    return new Promise<void>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/gif,image/bmp,image/webp";
      input.style.display = "none";
      document.body.appendChild(input);

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          input.remove();
          resolve();
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          set({ backgroundImage: reader.result as string });
          get().saveState();
          input.remove();
          resolve();
        };
        reader.onerror = () => {
          console.error("读取背景图片失败");
          input.remove();
          resolve();
        };
        reader.readAsDataURL(file);
      };

      input.oncancel = () => {
        input.remove();
        resolve();
      };

      input.click();
    });
  },

  fetchAppInfo: async () => {
    try {
      const info = await invoke<AppInfo>("get_app_info");
      set({ appInfo: info });
    } catch (e) {
      console.error("获取应用信息失败:", e);
    }
  },

  checkUpdate: async () => {
    try {
      const info = await invoke<UpdateInfo>("check_update");
      set({ updateInfo: info, updateOpen: true });
    } catch (e) {
      console.error("检查更新失败:", e);
    }
  },

  launchApp: async (path: string) => {
    try {
      await invoke("launch_app", { path });
    } catch (e) {
      console.error("启动应用失败:", e);
    }
  },

  setShortcutKey: (key: string) => {
    set({ shortcutKey: key });
  },

  /** 保存快捷键，返回是否成功注册 */
  saveShortcutKey: async (key: string): Promise<boolean> => {
    try {
      await invoke("update_shortcut", { shortcutKey: key });
      set({ shortcutKey: key });
      return true;
    } catch (e) {
      console.error("更新快捷键失败:", e);
      return false;
    }
  },

  /** 设置开机自启动，同步调用后端 autostart 插件 */
  setAutoStart: async (autoStart: boolean) => {
    try {
      if (autoStart) {
        await invoke("plugin:autostart|enable");
      } else {
        await invoke("plugin:autostart|disable");
      }
      set({ autoStart });
      get().saveState();
    } catch (e) {
      console.error("设置开机自启失败:", e);
    }
  },

  /** 设置启动应用后是否自动关闭面板 */
  setCloseOnLaunch: (closeOnLaunch: boolean) => {
    set({ closeOnLaunch });
    get().saveState();
  },

  /** 设置正在启动的应用 ID（用于 loading 效果） */
  setLaunchingAppId: (id: string | null) => {
    set({ launchingAppId: id });
  },
}));
