/** 系统中发现的已安装应用信息 */
export interface AppItem {
  /** 应用唯一标识（基于路径哈希） */
  id: string;
  /** 应用显示名称 */
  name: string;
  /** 应用可执行文件路径 */
  path: string;
  /** 应用图标路径，无图标时为 null */
  icon_path: string | null;
}

/** 用户固定到面板的应用信息 */
export interface PinnedApp {
  /** 应用唯一标识 */
  id: string;
  /** 应用显示名称 */
  name: string;
  /** 应用可执行文件路径 */
  path: string;
  /** 网格列坐标 */
  grid_x: number;
  /** 网格行坐标 */
  grid_y: number;
  /** 顺序模式下的排列顺序 */
  order: number;
}

/** 布局模式：sequential（顺序填充）或 free-tile（自由拼贴） */
export type LayoutMode = "sequential" | "free-tile";

/** 应用持久化状态，保存到本地 JSON 文件 */
export interface AppState {
  /** 已固定的应用列表 */
  pinned_apps: PinnedApp[];
  /** 当前布局模式 */
  layout_mode: LayoutMode;
  /** 网格列数 */
  grid_cols: number;
  /** 网格行数 */
  grid_rows: number;
}
