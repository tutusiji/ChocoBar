use crate::app_scanner::{self, AppItem};
use crate::icon_extractor;
use crate::shortcut;
use crate::state::{AppState, BackgroundMode, LayoutMode, PinnedApp};
use sha2::{Digest, Sha256};
use std::sync::Mutex;
use std::os::windows::process::CommandExt;
use tauri::{AppHandle, Emitter, Manager, State};

/// Windows CREATE_NO_WINDOW 标志，防止 PowerShell 窗口闪烁
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// IPC 命令：按关键词搜索已安装应用（使用缓存，速度极快）
#[tauri::command]
pub fn search_apps(query: String) -> Vec<AppItem> {
    app_scanner::search_apps(&query)
}

/// IPC 命令：获取单个应用的图标（延迟加载）
///
/// 搜索时不提取图标以保证速度，需要显示时通过此命令单独获取
#[tauri::command]
pub fn get_app_icon(path: String) -> Option<String> {
    app_scanner::get_app_icon(&path)
}

/// IPC 命令：清除应用缓存（强制下次搜索时重新扫描）
#[tauri::command]
pub fn clear_app_cache() {
    app_scanner::clear_cache();
}

/// IPC 命令：从文件路径解析应用信息
///
/// 支持 .exe、.lnk 等文件，提取名称和图标
#[tauri::command]
pub fn resolve_app_from_path(path: String) -> Option<AppItem> {
    use std::path::Path;

    let p = Path::new(&path);
    if !p.exists() {
        return None;
    }

    let name = p
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    let id = format!("{:x}", hasher.finalize());

    let icon_data = if path.to_lowercase().ends_with(".exe") {
        icon_extractor::extract_icon(None, &path)
    } else if path.to_lowercase().ends_with(".lnk") {
        icon_extractor::extract_icon(None, &path)
    } else {
        None
    };

    Some(AppItem {
        id,
        name,
        path,
        icon_data,
    })
}

/// IPC 命令：启动指定路径的应用程序
#[tauri::command]
pub fn launch_app(path: String) -> Result<(), String> {
    if path.to_lowercase().ends_with(".lnk") {
        std::process::Command::new("cmd")
            .creation_flags(CREATE_NO_WINDOW)
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

/// IPC 命令：获取当前应用状态
#[tauri::command]
pub fn get_state(state: State<'_, Mutex<AppState>>) -> AppState {
    let state = state.lock().unwrap();
    state.clone()
}

/// IPC 命令：保存应用状态
#[tauri::command]
pub fn save_state(
    pinned_apps: Vec<PinnedApp>,
    layout_mode: LayoutMode,
    opacity: f64,
    background_image: Option<String>,
    background_mode: BackgroundMode,
    background_blur: u32,
    shortcut_key: String,
    state: State<'_, Mutex<AppState>>,
) {
    let mut s = state.lock().unwrap();
    s.pinned_apps = pinned_apps;
    s.layout_mode = layout_mode;
    s.opacity = opacity;
    s.background_image = background_image;
    s.background_mode = background_mode;
    s.background_blur = background_blur;
    s.shortcut_key = shortcut_key;
    s.save();
}

/// IPC 命令：获取窗口尺寸
#[tauri::command]
pub fn get_window_size(app: AppHandle) -> (u32, u32) {
    if let Some(window) = app.get_webview_window("main") {
        if let Ok(size) = window.inner_size() {
            return (size.width, size.height);
        }
    }
    (1200, 800)
}

/// IPC 命令：设置窗口尺寸
#[tauri::command]
pub fn set_window_size(width: u32, height: u32, app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_size(tauri::PhysicalSize::new(width, height))
            .map_err(|e| format!("Failed to set size: {}", e))?;
        window.center().ok();
    }
    Ok(())
}

/// IPC 命令：设置面板透明度
#[tauri::command]
pub fn set_window_opacity(opacity: f64, state: State<'_, Mutex<AppState>>) {
    let mut s = state.lock().unwrap();
    s.opacity = opacity.clamp(0.0, 1.0);
    s.save();
}

/// IPC 命令：选择背景图片文件
#[tauri::command]
pub fn pick_background_image() -> Option<String> {
    use std::io::Read;

    let ps_script = r#"
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Filter = 'Image Files|*.png;*.jpg;*.jpeg;*.bmp;*.gif;*.webp'
    $dialog.Title = 'Select Background Image'
    if ($dialog.ShowDialog() -eq 'OK') { $dialog.FileName }
    "#;

    let output = std::process::Command::new("powershell")
        .creation_flags(CREATE_NO_WINDOW)
        .args(["-NoProfile", "-Command", ps_script])
        .output()
        .ok()?;

    let file_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if file_path.is_empty() {
        return None;
    }

    let mut file = std::fs::File::open(&file_path).ok()?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).ok()?;

    let ext = std::path::Path::new(&file_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "webp" => "image/webp",
        _ => "image/png",
    };

    Some(format!(
        "data:{};base64,{}",
        mime,
        base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &buf)
    ))
}

/// IPC 命令：获取应用信息（About 对话框）
#[tauri::command]
pub fn get_app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "ChocoBar",
        "version": "0.2.5",
        "description": "一个快乐的巧克力板样式的应用快速启动器",
        "author": "tutusiji",
        "website": "https://tuziki.com",
        "github": "https://github.com/tutusiji/ChocoBar",
        "email": "123507356@qq.com",
        "license": "MIT"
    })
}

/// IPC 命令：检查更新
#[tauri::command]
pub fn check_update() -> serde_json::Value {
    serde_json::json!({
        "has_update": false,
        "current_version": "0.2.5",
        "latest_version": "0.2.5",
        "message": "You are using the latest version."
    })
}

/// IPC 命令：切换面板显示/隐藏
#[tauri::command]
pub fn toggle_panel(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            window.hide().ok();
            app.emit("panel-hidden", ()).ok();
        } else {
            window.show().ok();
            window.set_focus().ok();
        }
    }
}

/// IPC 命令：显示面板窗口
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

/// IPC 命令：设置窗口是否可调整大小
#[tauri::command]
pub fn set_window_resizable(resizable: bool, app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_resizable(resizable)
            .map_err(|e| format!("Failed to set resizable: {}", e))?;
    }
    Ok(())
}

/// 格式化快捷键显示（将 ctrl+space 转换为 Ctrl+Space）
fn format_shortcut_display(key: &str) -> String {
    key.split('+')
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(first) => {
                    let upper: String = first.to_uppercase().collect();
                    let rest: String = chars.collect();
                    format!("{}{}", upper, rest)
                }
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join("+")
}

/// 更新托盘 tooltip 显示当前快捷键
fn update_tray_tooltip(app: &AppHandle, shortcut_key: &str) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = format!("ChocoBar - 按 {} 显示面板", format_shortcut_display(shortcut_key));
        tray.set_tooltip(Some(&tooltip)).ok();
    }
}

/// IPC 命令：更新全局快捷键
#[tauri::command]
pub fn update_shortcut(shortcut_key: String, app: AppHandle, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    {
        let mut s = state.lock().unwrap();
        s.shortcut_key = shortcut_key.clone();
        s.save();
    }
    shortcut::re_register_shortcut(&app, &shortcut_key)
        .map_err(|e| format!("Failed to register shortcut: {}", e))?;

    // 更新托盘 tooltip
    update_tray_tooltip(&app, &shortcut_key);

    Ok(())
}

/// IPC 命令：临时禁用全局快捷键（快捷键录制时使用）
#[tauri::command]
pub fn disable_shortcut(app: AppHandle) -> Result<(), String> {
    shortcut::disable_shortcut(&app)
        .map_err(|e| format!("Failed to disable shortcut: {}", e))
}

/// IPC 命令：重新启用全局快捷键
#[tauri::command]
pub fn enable_shortcut(app: AppHandle) -> Result<(), String> {
    shortcut::enable_shortcut(&app)
        .map_err(|e| format!("Failed to enable shortcut: {}", e))
}
