import { useAppStore } from "../store/useAppStore";
import {
  Plus,
  Pencil,
  LayoutGrid,
  LayoutList,
  X,
  Check,
} from "lucide-react";

/**
 * 顶部工具栏组件
 * 提供添加应用、切换编辑模式、切换布局模式和关闭面板的功能
 */
export function Toolbar() {
  const { layoutMode, editMode, setLayoutMode, toggleEditMode, setSearchOpen } =
    useAppStore();

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
          onClick={toggleEditMode}
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
          className="btn btn-icon btn-close"
          onClick={async () => {
            const { invoke } = await import("@tauri-apps/api/core");
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
