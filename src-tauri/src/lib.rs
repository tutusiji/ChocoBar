mod app_scanner;
mod commands;
mod icon_extractor;
mod shortcut;
mod state;
mod tray;

use state::AppState;
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

/// 构建并运行 Tauri 应用
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            app.manage(Mutex::new(AppState::load()));

            // 根据保存的设置启用/禁用开机自启动
            {
                let state = app.try_state::<Mutex<AppState>>();
                if let Some(s) = state {
                    let auto_start = s.lock().unwrap().auto_start;
                    let autostart = app.autolaunch();
                    if auto_start {
                        let _ = autostart.enable();
                    } else {
                        let _ = autostart.disable();
                    }
                }
            }

            // 创建系统托盘图标
            if let Err(e) = tray::create_tray(app) {
                eprintln!("Failed to create tray icon: {}", e);
            }

            // 注册全局快捷键
            if let Err(e) = shortcut::register_shortcut(app) {
                eprintln!("Failed to register global shortcut: {}", e);
            }

            // 设置文件拖放监听
            let handle = app.handle().clone();
            if let Some(window) = handle.get_webview_window("main") {
                let w = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::DragDrop(drop_event) = event {
                        match drop_event {
                            tauri::DragDropEvent::Drop { paths, .. } => {
                                let strs: Vec<String> =
                                    paths.iter().map(|p| p.to_string_lossy().to_string()).collect();
                                let _ = w.emit("file-drop", &strs);
                            }
                            tauri::DragDropEvent::Enter { paths, .. } => {
                                let strs: Vec<String> =
                                    paths.iter().map(|p| p.to_string_lossy().to_string()).collect();
                                let _ = w.emit("file-drop-enter", &strs);
                            }
                            tauri::DragDropEvent::Leave => {
                                let _ = w.emit("file-drop-leave", ());
                            }
                            _ => {}
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::search_apps,
            commands::get_app_icon,
            commands::clear_app_cache,
            commands::resolve_app_from_path,
            commands::launch_app,
            commands::get_state,
            commands::save_state,
            commands::get_window_size,
            commands::set_window_size,
            commands::set_window_opacity,
            commands::pick_background_image,
            commands::get_app_info,
            commands::check_update,
            commands::toggle_panel,
            commands::show_panel,
            commands::hide_panel,
            commands::set_window_resizable,
            commands::update_shortcut,
            commands::disable_shortcut,
            commands::enable_shortcut,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
