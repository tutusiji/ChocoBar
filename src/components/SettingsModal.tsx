import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "../store/useAppStore";
import type { BackgroundMode } from "../types";

/**
 * 设置面板组件
 * 支持调整窗口尺寸、透明度、背景图片和快捷键
 */
export function SettingsModal() {
  const {
    settingsOpen,
    setSettingsOpen,
    windowWidth,
    windowHeight,
    opacity,
    backgroundMode,
    backgroundImage,
    shortcutKey,
    setWindowSize,
    setOpacity,
    setBackgroundMode,
    setBackgroundImage,
    pickBackgroundImage,
    saveShortcutKey,
  } = useAppStore();

  const [width, setWidth] = useState(windowWidth);
  const [height, setHeight] = useState(windowHeight);
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [localShortcut, setLocalShortcut] = useState(shortcutKey);
  const [recording, setRecording] = useState(false);
  const shortcutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settingsOpen) {
      setWidth(windowWidth);
      setHeight(windowHeight);
      setLocalOpacity(opacity);
      setLocalShortcut(shortcutKey);
      setRecording(false);
    }
  }, [settingsOpen, windowWidth, windowHeight, opacity, shortcutKey]);

  // 快捷键录制：监听键盘组合
  const handleShortcutKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();

      // 忽略单独的修饰键
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("ctrl");
      if (e.altKey) parts.push("alt");
      if (e.shiftKey) parts.push("shift");
      if (e.metaKey) parts.push("super");

      // 将按键名标准化
      let key = e.key.toLowerCase();
      if (key === " ") key = "space";
      else if (key === "escape") {
        setRecording(false);
        return;
      }

      parts.push(key);
      const combo = parts.join("+");
      setLocalShortcut(combo);
      setRecording(false);
    },
    [recording]
  );

  useEffect(() => {
    if (recording) {
      window.addEventListener("keydown", handleShortcutKeyDown, true);
      return () =>
        window.removeEventListener("keydown", handleShortcutKeyDown, true);
    }
  }, [recording, handleShortcutKeyDown]);

  // 失焦时停止录制
  useEffect(() => {
    if (!recording) return;
    const handleClick = (e: MouseEvent) => {
      if (
        shortcutRef.current &&
        !shortcutRef.current.contains(e.target as Node)
      ) {
        setRecording(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [recording]);

  if (!settingsOpen) return null;

  // 保存所有设置并关闭面板
  const handleSave = () => {
    setWindowSize(width, height);
    setOpacity(localOpacity);
    if (localShortcut !== shortcutKey) {
      saveShortcutKey(localShortcut);
    }
    setSettingsOpen(false);
  };

  // 实时更新透明度（滑块拖动时即时生效）
  const handleOpacityChange = (value: number) => {
    setLocalOpacity(value);
    setOpacity(value);
  };

  // 格式化快捷键显示
  const formatShortcut = (key: string) => {
    return key
      .split("+")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" + ");
  };

  return (
    <div
      className="search-overlay"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setSettingsOpen(false);
      }}
    >
      <div
        className="settings-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="settings-title">Settings</div>

        <div className="settings-section">
          <div className="settings-section-title">Window</div>
          <div className="settings-row">
            <label>Width</label>
            <input
              type="number"
              min={600}
              max={2560}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
            <label className="settings-unit">px</label>
          </div>
          <div className="settings-row">
            <label>Height</label>
            <input
              type="number"
              min={400}
              max={1440}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
            <label className="settings-unit">px</label>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Shortcut Key</div>
          <div className="settings-row">
            <label>Toggle</label>
            <div
              ref={shortcutRef}
              className={`shortcut-input ${recording ? "recording" : ""}`}
              onClick={() => setRecording(true)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setRecording(true);
              }}
            >
              {recording
                ? "Press keys..."
                : formatShortcut(localShortcut)}
            </div>
          </div>
          <div className="settings-hint">
            Double-tap this key combination to show/hide the panel
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Appearance</div>
          <div className="settings-row">
            <label>Opacity</label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(localOpacity * 100)}
              onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
              className="settings-slider"
            />
            <span className="settings-value">{Math.round(localOpacity * 100)}%</span>
          </div>

          <div className="settings-row">
            <label>Background</label>
            <button className="btn" onClick={pickBackgroundImage}>
              {backgroundImage ? "Change Image" : "Upload Image"}
            </button>
            {backgroundImage && (
              <button
                className="btn"
                onClick={() => setBackgroundImage(null)}
              >
                Remove
              </button>
            )}
          </div>

          {backgroundImage && (
            <div className="settings-row">
              <label>Fill Mode</label>
              <div className="settings-btn-group">
                {(["stretch", "tile", "center"] as BackgroundMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      className={`btn ${backgroundMode === mode ? "active" : ""}`}
                      onClick={() => setBackgroundMode(mode)}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn" onClick={() => setSettingsOpen(false)}>
            Cancel
          </button>
          <button className="btn active" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
