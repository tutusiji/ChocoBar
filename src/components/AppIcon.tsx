import { GripVertical, X } from "lucide-react";
import type { PinnedApp } from "../types";
import { useAppStore } from "../store/useAppStore";

interface AppIconProps {
  app: PinnedApp;
  onDragStart: (e: React.DragEvent, app: PinnedApp) => void;
}

/**
 * 应用图标组件
 * 支持拖拽操作（编辑模式下）和点击启动应用，显示真实图标或首字母占位
 *
 * @param app - 已固定的应用信息
 * @param onDragStart - 拖拽开始回调
 */
export function AppIcon({ app, onDragStart }: AppIconProps) {
  const { editMode, launchApp, removePinnedApp } = useAppStore();

  // 非编辑模式下点击图标启动应用
  const handleClick = () => {
    if (!editMode) {
      launchApp(app.path);
    }
  };

  const firstLetter = app.name.charAt(0).toUpperCase();

  return (
    <div
      className="app-icon"
      draggable={editMode}
      onDragStart={(e) => editMode && onDragStart(e, app)}
      onClick={handleClick}
      title={app.name}
    >
      {editMode && (
        <div className="drag-handle">
          <GripVertical size={12} />
        </div>
      )}
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
          onClick={(e) => {
            e.stopPropagation();
            removePinnedApp(app.id);
          }}
          title="Remove"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
