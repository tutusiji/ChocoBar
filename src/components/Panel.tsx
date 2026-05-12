import { useEffect, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../store/useAppStore";
import { Toolbar } from "./Toolbar";
import { AppGrid } from "./AppGrid";
import { SearchModal } from "./SearchModal";
import { SettingsModal } from "./SettingsModal";
import { AboutModal } from "./AboutModal";
import { UpdateModal } from "./UpdateModal";

/**
 * 面板主组件
 * 负责加载应用状态、监听托盘事件和键盘事件，组合所有子组件
 */
export function Panel() {
  const {
    loadState,
    opacity,
    backgroundImage,
    backgroundMode,
    backgroundBlur,
    editMode,
    setSettingsOpen,
    setAboutOpen,
    checkUpdate,
  } = useAppStore();

  useEffect(() => {
    loadState();
  }, [loadState]);

  // 监听托盘菜单事件和面板隐藏事件
  useEffect(() => {
    const unlisteners: Promise<() => void>[] = [];

    unlisteners.push(
      listen("show-settings", () => {
        setSettingsOpen(true);
      })
    );
    unlisteners.push(
      listen("show-about", () => {
        setAboutOpen(true);
      })
    );
    unlisteners.push(
      listen("check-update", () => {
        checkUpdate();
      })
    );

    // 面板隐藏时自动退出编辑模式
    unlisteners.push(
      listen("panel-hidden", () => {
        const store = useAppStore.getState();
        if (store.editMode) {
          import("@tauri-apps/api/core").then(async ({ invoke }) => {
            try {
              const [w, h] = await invoke<[number, number]>("get_window_size");
              store.setWindowSize(w, h);
            } catch {}
            await invoke("set_window_resizable", { resizable: false });
            store.toggleEditMode();
          });
        }
      })
    );

    return () => {
      unlisteners.forEach((p) => p.then((fn) => fn()));
    };
  }, [setSettingsOpen, setAboutOpen, checkUpdate]);

  // Esc 键：关闭模态框 → 退出编辑模式 → 隐藏面板
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const store = useAppStore.getState();
        if (store.searchOpen) {
          store.setSearchOpen(false);
        } else if (store.settingsOpen) {
          store.setSettingsOpen(false);
        } else if (store.aboutOpen) {
          store.setAboutOpen(false);
        } else if (store.updateOpen) {
          store.setUpdateOpen(false);
        } else if (store.editMode) {
          import("@tauri-apps/api/core").then(async ({ invoke }) => {
            try {
              const [w, h] = await invoke<[number, number]>("get_window_size");
              store.setWindowSize(w, h);
            } catch (err) {
              console.error("Failed to save window size:", err);
            }
            await invoke("set_window_resizable", { resizable: false });
            store.toggleEditMode();
          });
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

  // 背景图层样式（含模糊）
  const bgStyle = useMemo(() => {
    if (!backgroundImage) return undefined;
    const style: React.CSSProperties = {
      backgroundImage: `url(${backgroundImage})`,
      opacity,
      filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
    };
    switch (backgroundMode) {
      case "stretch":
        style.backgroundSize = "100% 100%";
        style.backgroundRepeat = "no-repeat";
        break;
      case "tile":
        style.backgroundSize = "auto";
        style.backgroundRepeat = "repeat";
        break;
      case "center":
        style.backgroundSize = "auto";
        style.backgroundRepeat = "no-repeat";
        style.backgroundPosition = "center";
        break;
    }
    return style;
  }, [backgroundImage, backgroundMode, backgroundBlur, opacity]);

  return (
    <>
      <div
        className={`panel ${editMode ? "edit-resize" : ""}`}
        style={{ backgroundColor: `rgba(30, 30, 30, ${opacity})` }}
      >
        {backgroundImage && <div className="panel-bg" style={bgStyle} />}
        <Toolbar />
        <AppGrid />
      </div>
      <SearchModal />
      <SettingsModal />
      <AboutModal />
      <UpdateModal />
    </>
  );
}
