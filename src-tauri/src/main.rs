#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// 应用入口点，调用 lib 中的 run 函数启动 Tauri 应用
fn main() {
    choco_panel_lib::run()
}
