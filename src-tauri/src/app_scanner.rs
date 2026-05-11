use crate::icon_extractor;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::path::Path;
use std::sync::Mutex;
use winreg::enums::*;
use winreg::RegKey;

/// 扫描发现的已安装应用信息
#[derive(Debug, Clone, Serialize)]
pub struct AppItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon_data: Option<String>,
}

/// 全局应用缓存，避免每次搜索都重新扫描系统
static APP_CACHE: Mutex<Option<Vec<AppItem>>> = Mutex::new(None);

/// 对文件路径进行 SHA-256 哈希，生成唯一标识
fn hash_path(path: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// 判断是否为系统组件或可再发行组件
fn is_system_app(name: &str, path: &str) -> bool {
    let name_lower = name.to_lowercase();
    let path_lower = path.to_lowercase();

    let system_keywords = [
        "microsoft visual c++",
        "microsoft .net",
        "microsoft windows",
        "windows sdk",
        "windows driver",
        "windows performance",
        "windows software development kit",
        "microsoft edge update",
        "microsoft edge webview",
        "msvc",
        "redistributable",
        "hotfix",
        "update for microsoft",
        "security update",
        "service pack",
        "kb2",
        "kb3",
        "kb4",
        "kb5",
        "windows defender",
        "windows security",
        "internet explorer",
        "windows media",
        "dotnet",
        "asp.net",
    ];

    for keyword in &system_keywords {
        if name_lower.contains(keyword) {
            return true;
        }
    }

    if path.is_empty() {
        return true;
    }

    if path_lower.contains("uninstall")
        || path_lower.contains("uninst")
        || name_lower.contains("uninstall")
    {
        return true;
    }

    if path_lower.contains("\\windows\\servicing\\")
        || path_lower.contains("\\windows\\installer\\")
    {
        return true;
    }

    false
}

/// 扫描指定注册表键下的已安装应用（不提取图标，用于快速搜索）
fn scan_registry_key_fast(hive: &RegKey, subkey_path: &str) -> Vec<AppItem> {
    let mut apps = Vec::new();

    if let Ok(key) = hive.open_subkey_with_flags(subkey_path, KEY_READ) {
        for subkey_name in key.enum_keys().filter_map(|k| k.ok()) {
            if let Ok(subkey) = key.open_subkey_with_flags(&subkey_name, KEY_READ) {
                let display_name: String = subkey.get_value("DisplayName").unwrap_or_default();
                if display_name.is_empty() {
                    continue;
                }

                let install_location: String =
                    subkey.get_value("InstallLocation").unwrap_or_default();
                let display_icon: String = subkey.get_value("DisplayIcon").unwrap_or_default();

                let exe_path = find_exe_from_location(&install_location, &display_icon, &subkey);

                if is_system_app(&display_name, &exe_path) {
                    continue;
                }

                let id = hash_path(&exe_path);

                apps.push(AppItem {
                    id,
                    name: display_name,
                    path: exe_path,
                    icon_data: None, // 搜索时不提取图标，提高速度
                });
            }
        }
    }

    apps
}

/// 从注册表信息中查找应用的可执行文件路径
fn find_exe_from_location(install_location: &str, display_icon: &str, key: &RegKey) -> String {
    if !display_icon.is_empty() {
        let icon_path = display_icon.split(',').next().unwrap_or("");
        if icon_path.to_lowercase().ends_with(".exe") && Path::new(icon_path).exists() {
            return icon_path.to_string();
        }
    }

    if !install_location.is_empty() && Path::new(install_location).exists() {
        if let Ok(entries) = std::fs::read_dir(install_location) {
            for entry in entries.filter_map(|e| e.ok()) {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext == "exe") {
                    return path.to_string_lossy().to_string();
                }
            }
        }
    }

    let uninstall_string: String = key.get_value("UninstallString").unwrap_or_default();
    if !uninstall_string.is_empty() {
        let exe = uninstall_string
            .trim_matches('"')
            .split_whitespace()
            .next()
            .unwrap_or("");
        if exe.to_lowercase().ends_with(".exe") && Path::new(exe).exists() {
            return exe.to_string();
        }
    }

    String::new()
}

/// 递归扫描开始菜单目录，收集 .lnk 快捷方式（不提取图标）
fn scan_start_menu_fast(start_menu_path: &Path) -> Vec<AppItem> {
    let mut apps = Vec::new();

    if !start_menu_path.exists() {
        return apps;
    }

    if let Ok(entries) = std::fs::read_dir(start_menu_path) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();

            if path.is_dir() {
                apps.extend(scan_start_menu_fast(&path));
                continue;
            }

            if path.extension().map_or(false, |ext| ext == "lnk") {
                let name = path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                let name_lower = name.to_lowercase();
                if name_lower.contains("uninstall")
                    || name_lower.contains("help")
                    || name_lower.contains("readme")
                    || name_lower.contains("license")
                    || name_lower.contains("update")
                {
                    continue;
                }

                let path_str = path.to_string_lossy().to_string();
                let id = hash_path(&path_str);

                apps.push(AppItem {
                    id,
                    name,
                    path: path_str,
                    icon_data: None, // 搜索时不提取图标
                });
            }
        }
    }

    apps
}

/// 扫描系统中所有已安装的应用（使用缓存）
fn scan_all_apps_cached() -> Vec<AppItem> {
    let mut cache = APP_CACHE.lock().unwrap();

    if let Some(ref apps) = *cache {
        return apps.clone();
    }

    let mut apps = Vec::new();
    let mut seen_names = std::collections::HashSet::new();

    // 扫描 HKLM 注册表
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let hklm_apps = scan_registry_key_fast(
        &hklm,
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    );
    for app in hklm_apps {
        if seen_names.insert(app.name.clone()) {
            apps.push(app);
        }
    }

    // 扫描 HKCU 注册表
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let hkcu_apps = scan_registry_key_fast(
        &hkcu,
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    );
    for app in hkcu_apps {
        if seen_names.insert(app.name.clone()) {
            apps.push(app);
        }
    }

    // 扫描系统开始菜单
    let program_data =
        std::env::var("ProgramData").unwrap_or_else(|_| "C:\\ProgramData".to_string());
    let system_start_menu = Path::new(&program_data).join("Microsoft\\Windows\\Start Menu\\Programs");
    let system_apps = scan_start_menu_fast(&system_start_menu);
    for app in system_apps {
        if seen_names.insert(app.name.clone()) {
            apps.push(app);
        }
    }

    // 扫描用户开始菜单
    if let Some(app_data) = dirs::data_dir() {
        let user_start_menu = app_data.join("Microsoft\\Windows\\Start Menu\\Programs");
        let user_apps = scan_start_menu_fast(&user_start_menu);
        for app in user_apps {
            if seen_names.insert(app.name.clone()) {
                apps.push(app);
            }
        }
    }

    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    *cache = Some(apps.clone());
    apps
}

/// 按关键词搜索已安装应用（使用缓存，速度极快）
///
/// 最多返回 50 个结果，避免内存溢出
pub fn search_apps(query: &str) -> Vec<AppItem> {
    let all_apps = scan_all_apps_cached();
    let query_lower = query.to_lowercase();

    if query.is_empty() {
        return Vec::new(); // 空查询不返回任何结果
    }

    all_apps
        .into_iter()
        .filter(|app| {
            app.name.to_lowercase().contains(&query_lower)
                || app.path.to_lowercase().contains(&query_lower)
        })
        .take(50) // 限制结果数量，避免内存溢出
        .collect()
}

/// 获取单个应用的图标数据（延迟加载，仅在需要时调用）
pub fn get_app_icon(app_path: &str) -> Option<String> {
    icon_extractor::extract_icon(None, app_path)
}

/// 清除应用缓存（用于强制刷新）
pub fn clear_cache() {
    let mut cache = APP_CACHE.lock().unwrap();
    *cache = None;
}
