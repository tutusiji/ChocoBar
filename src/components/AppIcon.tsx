import { Loader } from "lucide-react";
import type { PinnedApp } from "../types";
import { useAppStore } from "../store/useAppStore";

interface AppIconProps {
  app: PinnedApp;
  /** 是否响应鼠标拖拽（编辑模式下为 true） */
  draggable: boolean;
  /** 鼠标按下时开始拖拽 */
  onMouseDown: (e: React.MouseEvent, app: PinnedApp) => void;
}

/**
 * 应用图标组件
 * 支持鼠标拖拽和点击启动应用，显示真实图标或首字母占位
 *
 * 磁贴模式下图标始终可拖动，直接按住图标即可拖拽；顺序模式下仅编辑模式可拖动
 * 编辑模式下显示删除按钮，不可点击启动应用
 * 点击启动时显示 loading 效果防止重复点击，根据设置决定是否自动关闭面板
 */
export function AppIcon({ app, draggable, onMouseDown }: AppIconProps) {
  const { editMode, launchApp, removePinnedApp, closeOnLaunch, launchingAppId, setLaunchingAppId } = useAppStore();

  const isLaunching = launchingAppId === app.id;

  /** 点击应用图标：启动应用、显示 loading、根据设置关闭面板 */
  const handleClick = async () => {
    if (editMode || isLaunching) return;

    setLaunchingAppId(app.id);
    try {
      await launchApp(app.path);
    } finally {
      setTimeout(() => setLaunchingAppId(null), 2500);
    }

    if (closeOnLaunch) {
      const { invoke } = await import("@tauri-apps/api/core");
      invoke("hide_panel").catch(() => {});
    }
  };

  const firstLetter = app.name.charAt(0).toUpperCase();

  return (
    <div
      className={`app-icon ${draggable ? "draggable" : ""} ${isLaunching ? "launching" : ""}`}
      onMouseDown={(e) => draggable && onMouseDown(e, app)}
      onClick={handleClick}
      title={app.name}
    >
      <div className="icon-wrapper">
        {app.icon_data ? (
          <img src={app.icon_data} alt={app.name} draggable={false} />
        ) : (
          <div className="icon-placeholder">{firstLetter}</div>
        )}
        {isLaunching && (
          <div className="launch-loading">
            <Loader size={20} className="spin" />
          </div>
        )}
      </div>
      <span className="app-name">{app.name}</span>
      {editMode && (
        <button
          className="delete-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            removePinnedApp(app.id);
          }}
          title="移除"
        >
          <span style={{ fontSize: 10, lineHeight: 1 }}>✕</span>
        </button>
      )}
    </div>
  );
}
