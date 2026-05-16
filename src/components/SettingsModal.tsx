import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store/useAppStore";
import type { BackgroundMode } from "../types";

/** 快捷键预设选项 */
const SHORTCUT_PRESETS = [
  { label: "Ctrl + Space", value: "ctrl+space" },
  { label: "Alt + Space", value: "alt+space" },
] as const;

/**
 * 设置面板组件（两列布局）
 * 支持调整窗口尺寸、透明度、背景图片、快捷键、开机启动和自动关闭面板
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
    autoStart,
    closeOnLaunch,
    setWindowSize,
    setOpacity,
    setBackgroundMode,
    setBackgroundBlur,
    setBackgroundImage,
    pickBackgroundImage,
    saveShortcutKey,
    setAutoStart,
    setCloseOnLaunch,
  } = useAppStore();

  const [width, setWidth] = useState(windowWidth);
  const [height, setHeight] = useState(windowHeight);
  const [localOpacity, setLocalOpacity] = useState(opacity);
  const [localBlur, setLocalBlur] = useState(backgroundBlur);
  const [localShortcut, setLocalShortcut] = useState(shortcutKey);
  const [shortcutMode, setShortcutMode] = useState<"preset" | "custom">("preset");
  const [recording, setRecording] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [localAutoStart, setLocalAutoStart] = useState(autoStart);
  const [localCloseOnLaunch, setLocalCloseOnLaunch] = useState(closeOnLaunch);
  const [shortcutError, setShortcutError] = useState<string | null>(null);
  const shortcutRef = useRef<HTMLDivElement>(null);
  const recordingRef = useRef(false);
  const stopRecordingRef = useRef<() => void>(() => {});

  /** 打开设置面板时同步当前状态到本地变量 */
  useEffect(() => {
    if (settingsOpen) {
      setWidth(windowWidth);
      setHeight(windowHeight);
      setLocalOpacity(opacity);
      setLocalBlur(backgroundBlur);
      setLocalShortcut(shortcutKey);
      setLocalAutoStart(autoStart);
      setLocalCloseOnLaunch(closeOnLaunch);
      setRecording(false);
      setPreparing(false);
      setShortcutError(null);
      recordingRef.current = false;
      // 判断当前快捷键是否为预设值
      const isPreset = SHORTCUT_PRESETS.some((p) => p.value === shortcutKey);
      setShortcutMode(isPreset ? "preset" : "custom");
    }
  }, [settingsOpen, windowWidth, windowHeight, opacity, backgroundBlur, shortcutKey, autoStart, closeOnLaunch]);

  /** 停止录制并重新启用全局快捷键 */
  const stopRecording = () => {
    recordingRef.current = false;
    setRecording(false);
    setPreparing(false);
    invoke("enable_shortcut").catch((e) =>
      console.error("启用快捷键失败:", e)
    );
  };

  // 更新 stopRecording ref
  stopRecordingRef.current = stopRecording;

  /** 开始录制快捷键（先禁用全局快捷键，等待系统级注销完成后再进入录制状态） */
  const startRecording = async () => {
    try {
      setPreparing(true);
      await invoke("disable_shortcut");
      // Windows UnregisterHotKey 需要额外时间在系统消息循环中生效
      await new Promise((r) => setTimeout(r, 200));
      recordingRef.current = true;
      setRecording(true);
    } catch (e) {
      console.error("禁用快捷键失败:", e);
      recordingRef.current = false;
      setRecording(false);
      setPreparing(false);
    }
  };

  /** 快捷键录制：监听键盘组合（使用稳定的事件处理器） */
  useEffect(() => {
    const handleShortcutKeyDown = (e: KeyboardEvent) => {
      if (!recordingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("ctrl");
      if (e.altKey) parts.push("alt");
      if (e.shiftKey) parts.push("shift");
      if (e.metaKey) parts.push("super");

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

  /** 失焦时停止录制并重新启用全局快捷键 */
  useEffect(() => {
    if (!recording && !preparing) return;
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
  }, [recording, preparing]);

  if (!settingsOpen) return null;

  /** 保存所有设置并关闭面板，快捷键注册失败时显示错误提示 */
  const handleSave = async () => {
    setWindowSize(width, height);
    setOpacity(localOpacity);
    setBackgroundBlur(localBlur);
    setPreparing(false);
    if (localShortcut !== shortcutKey) {
      const ok = await saveShortcutKey(localShortcut);
      if (!ok) {
        setShortcutError("快捷键被占用或注册失败，请更换其他快捷键");
        invoke("enable_shortcut").catch(() => {});
        return;
      }
      setShortcutError(null);
    } else {
      invoke("enable_shortcut").catch((e) =>
        console.error("启用快捷键失败:", e)
      );
    }
    if (localAutoStart !== autoStart) {
      setAutoStart(localAutoStart);
    }
    if (localCloseOnLaunch !== closeOnLaunch) {
      setCloseOnLaunch(localCloseOnLaunch);
    }
    setSettingsOpen(false);
  };

  /** 实时更新透明度（滑块拖动时即时生效） */
  const handleOpacityChange = (value: number) => {
    setLocalOpacity(value);
    setOpacity(value);
  };

  /** 实时更新背景模糊（滑块拖动时即时生效） */
  const handleBlurChange = (value: number) => {
    setLocalBlur(value);
    setBackgroundBlur(value);
  };

  /** 格式化快捷键显示 */
  const formatShortcut = (key: string) => {
    return key
      .split("+")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" + ");
  };

  /** 背景图填充模式中文名 */
  const modeLabels: Record<BackgroundMode, string> = {
    stretch: "拉伸",
    tile: "平铺",
    center: "居中",
  };

  /** 切换快捷键模式（预设/自定义） */
  const handleShortcutModeChange = (mode: "preset" | "custom") => {
    setShortcutMode(mode);
    if (mode === "preset") {
      // 切换到预设时恢复第一个预设值
      const isPreset = SHORTCUT_PRESETS.some((p) => p.value === localShortcut);
      if (!isPreset) {
        setLocalShortcut(SHORTCUT_PRESETS[0].value);
      }
    } else {
      // 切换到自定义时开始录制
      startRecording();
    }
  };

  /** 选择预设快捷键 */
  const handlePresetChange = (value: string) => {
    setLocalShortcut(value);
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
        className="settings-modal settings-modal--two-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="settings-title">设置</div>

        <div className="settings-grid">
          {/* 左列 */}
          <div className="settings-col">
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
              <div className="settings-radio-group">
                {SHORTCUT_PRESETS.map((preset) => (
                  <label key={preset.value} className="settings-radio">
                    <input
                      type="radio"
                      name="shortcut"
                      checked={shortcutMode === "preset" && localShortcut === preset.value}
                      onChange={() => {
                        setShortcutMode("preset");
                        handlePresetChange(preset.value);
                      }}
                    />
                    <span>{preset.label}</span>
                  </label>
                ))}
                <label className="settings-radio">
                  <input
                    type="radio"
                    name="shortcut"
                    checked={shortcutMode === "custom"}
                    onChange={() => handleShortcutModeChange("custom")}
                  />
                  <span>自定义</span>
                </label>
              </div>
              {shortcutMode === "custom" && (
                <div className="settings-row">
                  <div
                    ref={shortcutRef}
                    className={`shortcut-input ${recording || preparing ? "recording" : ""}`}
                    onClick={startRecording}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") startRecording();
                    }}
                  >
                    {preparing && !recording
                      ? "准备中..."
                      : recording
                        ? "请按下快捷键..."
                        : formatShortcut(localShortcut)}
                  </div>
                </div>
              )}
              <div className="settings-hint">
                按下快捷键显示/隐藏面板
              </div>
              {shortcutError && (
                <div className="settings-error">{shortcutError}</div>
              )}
            </div>
          </div>

          {/* 右列 */}
          <div className="settings-col">
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

            <div className="settings-section">
              <div className="settings-section-title">行为</div>
              <div className="settings-row">
                <label>开机启动</label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={localAutoStart}
                    onChange={(e) => setLocalAutoStart(e.target.checked)}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
              <div className="settings-row">
                <label>应用启动后关闭面板</label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={localCloseOnLaunch}
                    onChange={(e) => setLocalCloseOnLaunch(e.target.checked)}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            </div>
          </div>
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
