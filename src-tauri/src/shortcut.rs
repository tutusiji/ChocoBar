use std::sync::Mutex;
use std::time::Instant;
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// 记录上次按键时间，用于双击检测
struct LastPress {
    time: Instant,
}

static LAST_PRESS: Mutex<Option<LastPress>> = Mutex::new(None);
const DOUBLE_TAP_MS: u128 = 500;

/// 解析快捷键字符串为 Modifiers + Code
///
/// 支持格式: "ctrl+space", "alt+space", "ctrl+shift+q" 等
fn parse_shortcut(key_str: &str) -> Option<(Modifiers, Code)> {
    let lower = key_str.to_lowercase();
    let parts: Vec<&str> = lower.split('+').map(|s| s.trim()).collect();

    let mut modifiers = Modifiers::empty();
    let mut code = None;

    for part in &parts {
        match *part {
            "ctrl" | "control" => modifiers |= Modifiers::CONTROL,
            "alt" => modifiers |= Modifiers::ALT,
            "shift" => modifiers |= Modifiers::SHIFT,
            "super" | "win" | "meta" => modifiers |= Modifiers::SUPER,
            "space" => code = Some(Code::Space),
            "a" => code = Some(Code::KeyA),
            "b" => code = Some(Code::KeyB),
            "c" => code = Some(Code::KeyC),
            "d" => code = Some(Code::KeyD),
            "e" => code = Some(Code::KeyE),
            "f" => code = Some(Code::KeyF),
            "g" => code = Some(Code::KeyG),
            "h" => code = Some(Code::KeyH),
            "i" => code = Some(Code::KeyI),
            "j" => code = Some(Code::KeyJ),
            "k" => code = Some(Code::KeyK),
            "l" => code = Some(Code::KeyL),
            "m" => code = Some(Code::KeyM),
            "n" => code = Some(Code::KeyN),
            "o" => code = Some(Code::KeyO),
            "p" => code = Some(Code::KeyP),
            "q" => code = Some(Code::KeyQ),
            "r" => code = Some(Code::KeyR),
            "s" => code = Some(Code::KeyS),
            "t" => code = Some(Code::KeyT),
            "u" => code = Some(Code::KeyU),
            "v" => code = Some(Code::KeyV),
            "w" => code = Some(Code::KeyW),
            "x" => code = Some(Code::KeyX),
            "y" => code = Some(Code::KeyY),
            "z" => code = Some(Code::KeyZ),
            "0" => code = Some(Code::Digit0),
            "1" => code = Some(Code::Digit1),
            "2" => code = Some(Code::Digit2),
            "3" => code = Some(Code::Digit3),
            "4" => code = Some(Code::Digit4),
            "5" => code = Some(Code::Digit5),
            "6" => code = Some(Code::Digit6),
            "7" => code = Some(Code::Digit7),
            "8" => code = Some(Code::Digit8),
            "9" => code = Some(Code::Digit9),
            "f1" => code = Some(Code::F1),
            "f2" => code = Some(Code::F2),
            "f3" => code = Some(Code::F3),
            "f4" => code = Some(Code::F4),
            "f5" => code = Some(Code::F5),
            "f6" => code = Some(Code::F6),
            "f7" => code = Some(Code::F7),
            "f8" => code = Some(Code::F8),
            "f9" => code = Some(Code::F9),
            "f10" => code = Some(Code::F10),
            "f11" => code = Some(Code::F11),
            "f12" => code = Some(Code::F12),
            _ => {}
        }
    }

    code.map(|c| (modifiers, c))
}

/// 注册全局快捷键（双击检测）
///
/// 双击检测阈值为 500ms，最小间隔 50ms（防抖）
pub fn register_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle().clone();

    // 从 state 读取快捷键配置
    let shortcut_key = {
        let state = app_handle.try_state::<std::sync::Mutex<crate::state::AppState>>();
        if let Some(s) = state {
            s.lock().unwrap().shortcut_key.clone()
        } else {
            "ctrl+space".to_string()
        }
    };

    let (modifiers, code) = parse_shortcut(&shortcut_key)
        .unwrap_or((Modifiers::CONTROL, Code::Space));

    let shortcut = Shortcut::new(Some(modifiers), code);

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

/// 重新注册全局快捷键（用于设置更改后动态更新）
pub fn re_register_shortcut(app: &AppHandle, shortcut_key: &str) -> Result<(), Box<dyn std::error::Error>> {
    // 先取消所有已注册的快捷键
    app.global_shortcut().unregister_all()?;

    let (modifiers, code) = parse_shortcut(shortcut_key)
        .ok_or("Invalid shortcut key format")?;

    let shortcut = Shortcut::new(Some(modifiers), code);
    let handle = app.clone();

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
                    *last_press = None;
                    drop(last_press);

                    if let Some(window) = handle.get_webview_window("main") {
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
