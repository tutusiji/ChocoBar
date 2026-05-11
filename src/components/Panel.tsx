import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { Toolbar } from "./Toolbar";
import { AppGrid } from "./AppGrid";
import { SearchModal } from "./SearchModal";

/**
 * 面板主组件
 * 负责加载应用状态、监听键盘事件（Esc 关闭面板），并组合工具栏和网格
 */
export function Panel() {
  const { loadState, editMode } = useAppStore();

  useEffect(() => {
    loadState();
  }, [loadState]);

  // 监听 Esc 键关闭面板
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const store = useAppStore.getState();
        if (store.searchOpen) {
          store.setSearchOpen(false);
        } else {
          import("@tauri-apps/api/core").then(({ invoke }) => {
            invoke("hide_panel");
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div className={`panel ${editMode ? "edit-active" : ""}`}>
        <Toolbar />
        <AppGrid />
      </div>
      <SearchModal />
    </>
  );
}
