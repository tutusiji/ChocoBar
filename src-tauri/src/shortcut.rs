use std::sync::Mutex;
use std::time::Instant;
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};

/// 记录上次按键时间，用于双击检测
struct LastPress {
    time: Instant,
}

static LAST_PRESS: Mutex<Option<LastPress>> = Mutex::new(None);
const DOUBLE_TAP_MS: u128 = 500;

/// 注册全局快捷键（Ctrl+Space 双击）切换面板显示/隐藏
///
/// 双击检测阈值为 500ms，最小间隔 50ms（防抖）
pub fn register_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle().clone();

    // 使用 Ctrl+Space 作为触发键（Windows 上无法单独注册 Alt 为全局快捷键）
    // 双击检测基于 Ctrl+Space 组合键实现
    let shortcut = tauri_plugin_global_shortcut::Shortcut::new(
        Some(Modifiers::CONTROL),
        Code::Space,
    );

    app.global_shortcut().on_shortcut(
        shortcut,
        move |_app, _shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }

            let now = Instant::now();
            let mut last_press = LAST_PRESS.lock().unwrap();

            if let Some(ref last) = *last_press {
                let elapsed = now.duration_since(last.time).as_millis();
                if elapsed < DOUBLE_TAP_MS && elapsed > 50 {
                    // 检测到双击，切换面板显示/隐藏
                    *last_press = None;
                    drop(last_press);

                    if let Some(window) = app_handle.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            window.hide().ok();
                        } else {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                    return;
                }
            }

            *last_press = Some(LastPress { time: now });
        },
    )?;

    Ok(())
}
