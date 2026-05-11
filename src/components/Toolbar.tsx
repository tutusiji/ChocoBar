import { useAppStore } from "../store/useAppStore";
import {
  Plus,
  Pencil,
  LayoutGrid,
  LayoutList,
  X,
  Check,
  Settings,
} from "lucide-react";

/**
 * 顶部工具栏组件
 * 提供添加应用、切换编辑模式、切换布局模式、打开设置和关闭面板的功能
 * 编辑模式下窗口可拖拽调整大小，退出时保存窗口尺寸
 */
export function Toolbar() {
  const {
    layoutMode,
    editMode,
    setLayoutMode,
    toggleEditMode,
    setSearchOpen,
    setSettingsOpen,
    setWindowSize,
  } = useAppStore();

  const handleToggleEdit = async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    if (editMode) {
      // 退出编辑模式：保存窗口大小，禁用调整大小
      try {
        const [w, h] = await invoke<[number, number]>("get_window_size");
        setWindowSize(w, h);
      } catch (e) {
        console.error("Failed to save window size:", e);
      }
      await invoke("set_window_resizable", { resizable: false });
    } else {
      // 进入编辑模式：启用调整大小
      await invoke("set_window_resizable", { resizable: true });
    }
    toggleEditMode();
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">ChocoPanel</span>
        <button
          className="btn"
          onClick={() => setSearchOpen(true)}
          title="Add application"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>
      <div className="toolbar-right">
        <button
          className={`btn ${editMode ? "active" : ""}`}
          onClick={handleToggleEdit}
          title={editMode ? "Exit edit mode" : "Edit mode"}
        >
          {editMode ? <Check size={14} /> : <Pencil size={14} />}
          <span>{editMode ? "Done" : "Edit"}</span>
        </button>
        <button
          className={`btn ${layoutMode === "sequential" ? "active" : ""}`}
          onClick={() => setLayoutMode("sequential")}
          title="Sequential layout"
        >
          <LayoutList size={14} />
        </button>
        <button
          className={`btn ${layoutMode === "free-tile" ? "active" : ""}`}
          onClick={() => setLayoutMode("free-tile")}
          title="Free tile layout"
        >
          <LayoutGrid size={14} />
        </button>
        <button
          className="btn btn-icon"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          <Settings size={14} />
        </button>
        <button
          className="btn btn-icon btn-close"
          onClick={async () => {
            const { invoke } = await import("@tauri-apps/api/core");
            // 编辑模式下先退出编辑模式再隐藏面板
            if (editMode) {
              try {
                const [w, h] = await invoke<[number, number]>("get_window_size");
                setWindowSize(w, h);
              } catch {}
              await invoke("set_window_resizable", { resizable: false });
              toggleEditMode();
            }
            invoke("hide_panel");
          }}
          title="Close panel (Esc)"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
