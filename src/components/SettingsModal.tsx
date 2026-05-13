import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
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
    backgroundBlur,
    shortcutKey,
    setWindowSize,
    setOpacity,
    setBackgroundMode,
    setBackgroundBlur,
    setBackgroundImage,
    pickBackgroundImage,
    saveShortcutKey,
  } = useAppStore();

  const [width, setWidth] = useState(windowWidth);
  const [height, setHeight] = useState(windowHeight);
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [localBlur, setLocalBlur] = useState(backgroundBlur);
  const [localShortcut, setLocalShortcut] = useState(shortcutKey);
  const [recording, setRecording] = useState(false);
  const shortcutRef = useRef<HTMLDivElement>(null);
  const recordingRef = useRef(false);
  const stopRecordingRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (settingsOpen) {
      setWidth(windowWidth);
      setHeight(windowHeight);
      setLocalOpacity(opacity);
      setLocalBlur(backgroundBlur);
      setLocalShortcut(shortcutKey);
      setRecording(false);
      recordingRef.current = false;
    }
  }, [settingsOpen, windowWidth, windowHeight, opacity, backgroundBlur, shortcutKey]);

  // 停止录制并重新启用全局快捷键
  const stopRecording = () => {
    recordingRef.current = false;
    setRecording(false);
    invoke("enable_shortcut").catch((e) =>
      console.error("启用快捷键失败:", e)
    );
  };

  // 更新 stopRecording ref
  stopRecordingRef.current = stopRecording;

  // 开始录制快捷键（确保全局快捷键禁用后才开始录制）
  const startRecording = async () => {
    try {
      // 先设置录制标志，确保按键事件能被处理
      recordingRef.current = true;
      setRecording(true);
      // 禁用全局快捷键
      await invoke("disable_shortcut");
    } catch (e) {
      console.error("禁用快捷键失败:", e);
      recordingRef.current = false;
      setRecording(false);
    }
  };

  // 快捷键录制：监听键盘组合（使用稳定的事件处理器）
  useEffect(() => {
    const handleShortcutKeyDown = (e: KeyboardEvent) => {
      if (!recordingRef.current) return;
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
        stopRecordingRef.current();
        return;
      }

      parts.push(key);
      const combo = parts.join("+");
      setLocalShortcut(combo);
      stopRecordingRef.current();
    };

    window.addEventListener("keydown", handleShortcutKeyDown, true);
    return () => window.removeEventListener("keydown", handleShortcutKeyDown, true);
  }, []);

  // 失焦时停止录制并重新启用全局快捷键
  useEffect(() => {
    if (!recording) return;
    const handleClick = (e: MouseEvent) => {
      if (
        shortcutRef.current &&
        !shortcutRef.current.contains(e.target as Node)
      ) {
        stopRecording();
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
    setBackgroundBlur(localBlur);
    if (localShortcut !== shortcutKey) {
      saveShortcutKey(localShortcut);
    } else {
      // 快捷键未变更，确保重新启用
      invoke("enable_shortcut").catch((e) =>
        console.error("启用快捷键失败:", e)
      );
    }
    setSettingsOpen(false);
  };

  // 实时更新透明度（滑块拖动时即时生效）
  const handleOpacityChange = (value: number) => {
    setLocalOpacity(value);
    setOpacity(value);
  };

  // 实时更新背景模糊（滑块拖动时即时生效）
  const handleBlurChange = (value: number) => {
    setLocalBlur(value);
    setBackgroundBlur(value);
  };

  // 格式化快捷键显示
  const formatShortcut = (key: string) => {
    return key
      .split("+")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" + ");
  };

  // 背景图填充模式中文名
  const modeLabels: Record<BackgroundMode, string> = {
    stretch: "拉伸",
    tile: "平铺",
    center: "居中",
  };

  return (
    <div
      className="settings-overlay"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setSettingsOpen(false);
      }}
    >
      <div
        className="settings-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="settings-title">设置</div>

        <div className="settings-section">
          <div className="settings-section-title">窗口</div>
          <div className="settings-row">
            <label>宽度</label>
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
            <label>高度</label>
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
          <div className="settings-section-title">快捷键</div>
          <div className="settings-row">
            <label>切换</label>
            <div
              ref={shortcutRef}
              className={`shortcut-input ${recording ? "recording" : ""}`}
              onClick={startRecording}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  startRecording();
                }
              }}
            >
              {recording
                ? "请按下快捷键..."
                : formatShortcut(localShortcut)}
            </div>
          </div>
          <div className="settings-hint">
            按下此快捷键显示/隐藏面板
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">外观</div>
          <div className="settings-row">
            <label>透明度</label>
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
            <label>背景图</label>
            <button className="btn" onClick={pickBackgroundImage}>
              {backgroundImage ? "更换图片" : "上传图片"}
            </button>
            {backgroundImage && (
              <button
                className="btn"
                onClick={() => setBackgroundImage(null)}
              >
                移除
              </button>
            )}
          </div>

          {backgroundImage && (
            <>
              <div className="settings-row">
                <label>模糊</label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={localBlur}
                  onChange={(e) => handleBlurChange(Number(e.target.value))}
                  className="settings-slider"
                />
                <span className="settings-value">{localBlur}px</span>
              </div>
              <div className="settings-row">
                <label>填充</label>
                <div className="settings-btn-group">
                  {(["stretch", "tile", "center"] as BackgroundMode[]).map(
                    (mode) => (
                      <button
                        key={mode}
                        className={`btn ${backgroundMode === mode ? "active" : ""}`}
                        onClick={() => setBackgroundMode(mode)}
                      >
                        {modeLabels[mode]}
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn" onClick={() => setSettingsOpen(false)}>
            取消
          </button>
          <button className="btn active" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
