/** 系统中发现的已安装应用信息 */
export interface AppItem {
  /** 应用唯一标识（基于路径哈希） */
  id: string;
  /** 应用显示名称 */
  name: string;
  /** 应用可执行文件路径 */
  path: string;
  /** 应用图标 base64 data URI，无图标时为 null */
  icon_data: string | null;
}

/** 用户固定到面板的应用信息 */
export interface PinnedApp {
  /** 应用唯一标识 */
  id: string;
  /** 应用显示名称 */
  name: string;
  /** 应用可执行文件路径 */
  path: string;
  /** 应用图标 base64 data URI */
  icon_data: string | null;
  /** 顺序模式下的网格列坐标 */
  grid_x: number;
  /** 顺序模式下的网格行坐标 */
  grid_y: number;
  /** 自由磁贴模式下的列坐标 */
  tile_x: number;
  /** 自由磁贴模式下的行坐标 */
  tile_y: number;
  /** 顺序模式下的排列顺序 */
  order: number;
}

/** 布局模式：sequential（顺序填充）或 free-tile（自由拼贴） */
export type LayoutMode = "sequential" | "free-tile";

/** 背景图填充模式 */
export type BackgroundMode = "stretch" | "tile" | "center";

/** 应用持久化状态 */
export interface AppState {
  /** 已固定的应用列表 */
  pinned_apps: PinnedApp[];
  /** 当前布局模式 */
  layout_mode: LayoutMode;
  /** 面板透明度（0-1） */
  opacity: number;
  /** 背景图 base64 data URI */
  background_image: string | null;
  /** 背景图填充模式 */
  background_mode: BackgroundMode;
  /** 背景图高斯模糊半径（0-30） */
  background_blur: number;
  /** 全局快捷键（如 "ctrl+space"） */
  shortcut_key: string;
  /** 是否开机自启动 */
  auto_start: boolean;
  /** 启动应用后是否自动关闭面板 */
  close_on_launch: boolean;
}

/** 应用信息（关于对话框） */
export interface AppInfo {
  name: string;
  version: string;
  description: string;
  author: string;
  website: string;
  github: string;
  email: string;
  license: string;
}

/** 更新检查结果 */
export interface UpdateInfo {
  /** 是否有可用更新 */
  has_update: boolean;
  /** 当前版本号 */
  current_version: string;
  /** 最新版本号 */
  latest_version: string;
  /** 更新提示信息 */
  message: string;
}
