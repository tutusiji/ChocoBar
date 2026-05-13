use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    App, Emitter, Manager,
};

/// 格式化快捷键显示（将 ctrl+space 转换为 Ctrl+Space）
fn format_shortcut(key: &str) -> String {
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

/// 创建系统托盘图标
///
/// 包含右键菜单（显示面板、设置、关于、检查更新、退出）和左键点击切换面板
pub fn create_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    // 从状态中读取快捷键
    let shortcut_key = {
        let state = app.try_state::<std::sync::Mutex<crate::state::AppState>>();
        if let Some(s) = state {
            s.lock().unwrap().shortcut_key.clone()
        } else {
            "ctrl+space".to_string()
        }
    };

    let tooltip = format!("ChocoBar - 按 {} 显示面板", format_shortcut(&shortcut_key));

    let show_item = MenuItemBuilder::with_id("show", "显示面板").build(app)?;
    let settings_item = MenuItemBuilder::with_id("settings", "设置").build(app)?;
    let about_item = MenuItemBuilder::with_id("about", "关于").build(app)?;
    let update_item = MenuItemBuilder::with_id("update", "检查更新").build(app)?;
    let exit_item = MenuItemBuilder::with_id("exit", "退出").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show_item)
        .separator()
        .item(&settings_item)
        .item(&about_item)
        .item(&update_item)
        .separator()
        .item(&exit_item)
        .build()?;

    let _tray = TrayIconBuilder::new()
        .icon(Image::from_path("icons/icon.png").unwrap_or_else(|_| {
            Image::from_bytes(include_bytes!("../icons/icon.png"))
                .expect("加载托盘图标失败")
        }))
        .menu(&menu)
        .tooltip(&tooltip)
        .on_menu_event(move |app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().ok();
                        window.set_focus().ok();
                    }
                }
                "settings" => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().ok();
                        window.set_focus().ok();
                    }
                    app.emit("show-settings", ()).ok();
                }
                "about" => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().ok();
                        window.set_focus().ok();
                    }
                    app.emit("show-about", ()).ok();
                }
                "update" => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.show().ok();
                        window.set_focus().ok();
                    }
                    app.emit("check-update", ()).ok();
                }
                "exit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                button_state: tauri::tray::MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
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
        })
        .build(app)?;

    Ok(())
}
