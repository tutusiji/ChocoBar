use crate::app_scanner::{self, AppItem};
use crate::state::{AppState, LayoutMode, PinnedApp};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

/// IPC 命令：获取系统中所有已安装的应用列表
#[tauri::command]
pub fn get_installed_apps() -> Vec<AppItem> {
    app_scanner::scan_all_apps()
}

/// IPC 命令：按关键词搜索已安装应用
#[tauri::command]
pub fn search_apps(query: String) -> Vec<AppItem> {
    app_scanner::search_apps(&query)
}

/// IPC 命令：启动指定路径的应用程序
///
/// 对 `.lnk` 快捷方式文件使用 `cmd /C start` 打开，其他直接执行
#[tauri::command]
pub fn launch_app(path: String) -> Result<(), String> {
    // .lnk 快捷方式文件通过 shell 打开
    if path.to_lowercase().ends_with(".lnk") {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Failed to launch: {}", e))?;
    } else {
        std::process::Command::new(&path)
            .spawn()
            .map_err(|e| format!("Failed to launch: {}", e))?;
    }
    Ok(())
}

/// IPC 命令：获取当前应用状态（固定应用列表、布局模式、网格尺寸）
#[tauri::command]
pub fn get_state(state: State<'_, Mutex<AppState>>) -> AppState {
    let state = state.lock().unwrap();
    state.clone()
}

/// IPC 命令：保存应用状态到内存和本地文件
#[tauri::command]
pub fn save_state(
    pinned_apps: Vec<PinnedApp>,
    layout_mode: LayoutMode,
    grid_cols: u32,
    grid_rows: u32,
    state: State<'_, Mutex<AppState>>,
) {
    let mut s = state.lock().unwrap();
    s.pinned_apps = pinned_apps;
    s.layout_mode = layout_mode;
    s.grid_cols = grid_cols;
    s.grid_rows = grid_rows;
    s.save();
}

/// IPC 命令：切换面板显示/隐藏状态
#[tauri::command]
pub fn toggle_panel(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            window.hide().ok();
        } else {
            window.show().ok();
            window.set_focus().ok();
        }
    }
}

/// IPC 命令：显示面板窗口并获取焦点
#[tauri::command]
pub fn show_panel(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        window.show().ok();
        window.set_focus().ok();
    }
}

/// IPC 命令：隐藏面板窗口
#[tauri::command]
pub fn hide_panel(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().ok();
    }
}
