import { X } from "lucide-react";
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
 */
export function AppIcon({ app, draggable, onMouseDown }: AppIconProps) {
  const { editMode, launchApp, removePinnedApp } = useAppStore();

  // 编辑模式下点击不启动应用
  const handleClick = () => {
    if (!editMode) {
      launchApp(app.path);
    }
  };

  const firstLetter = app.name.charAt(0).toUpperCase();

  return (
    <div
      className={`app-icon ${draggable ? "draggable" : ""}`}
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
          <X size={10} />
        </button>
      )}
    </div>
  );
}
