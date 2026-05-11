mod app_scanner;
mod commands;
mod shortcut;
mod state;
mod tray;

use state::AppState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// 构建并运行 Tauri 应用
///
/// 初始化应用状态、系统托盘、全局快捷键，并注册所有 IPC 命令处理器
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            app.manage(Mutex::new(AppState::load()));

            // 创建系统托盘图标
            if let Err(e) = tray::create_tray(app) {
                eprintln!("Failed to create tray icon: {}", e);
            }

            // 注册全局快捷键（双击切换面板）
            if let Err(e) = shortcut::register_shortcut(app) {
                eprintln!("Failed to register global shortcut: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_installed_apps,
            commands::search_apps,
            commands::launch_app,
            commands::get_state,
            commands::save_state,
            commands::toggle_panel,
            commands::show_panel,
            commands::hide_panel,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
