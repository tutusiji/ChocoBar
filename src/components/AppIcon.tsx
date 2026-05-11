import { useDraggable } from "@dnd-kit/core";
import { GripVertical, X } from "lucide-react";
import type { PinnedApp } from "../types";
import { useAppStore } from "../store/useAppStore";

interface AppIconProps {
  app: PinnedApp;
}

/**
 * 应用图标组件
 * 支持拖拽操作（编辑模式下）和点击启动应用
 *
 * @param app - 已固定的应用信息
 */
export function AppIcon({ app }: AppIconProps) {
  const { editMode, launchApp, removePinnedApp } = useAppStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: app.id,
      disabled: !editMode,
      data: { app },
    });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 1000,
      }
    : {};

  // 非编辑模式下点击图标启动应用
  const handleClick = () => {
    if (!editMode && !isDragging) {
      launchApp(app.path);
    }
  };

  const firstLetter = app.name.charAt(0).toUpperCase();

  return (
    <div
      ref={setNodeRef}
      className={`app-icon ${isDragging ? "dragging" : ""}`}
      style={style}
      onClick={handleClick}
      title={app.name}
    >
      {editMode && (
        <div className="drag-handle" {...attributes} {...listeners}>
          <GripVertical size={12} />
        </div>
      )}
      <div className="icon-wrapper">
        <div className="icon-placeholder">{firstLetter}</div>
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
