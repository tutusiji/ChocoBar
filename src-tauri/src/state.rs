use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// 布局模式枚举
///
/// - `Sequential`：顺序填充模式
/// - `FreeTile`：自由拼贴模式
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LayoutMode {
    Sequential,
    FreeTile,
}

impl Default for LayoutMode {
    /// 默认使用自由拼贴模式
    fn default() -> Self {
        Self::FreeTile
    }
}

/// 背景图填充模式
///
/// - `Stretch`：拉伸填充
/// - `Tile`：平铺
/// - `Center`：居中
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum BackgroundMode {
    Stretch,
    Tile,
    Center,
}

impl Default for BackgroundMode {
    /// 默认使用拉伸填充
    fn default() -> Self {
        Self::Stretch
    }
}

/// 已固定应用的信息，用于持久化存储
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PinnedApp {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon_data: Option<String>,
    /// 顺序模式下的网格列坐标
    pub grid_x: u32,
    /// 顺序模式下的网格行坐标
    pub grid_y: u32,
    /// 自由磁贴模式下的列坐标
    #[serde(default)]
    pub tile_x: u32,
    /// 自由磁贴模式下的行坐标
    #[serde(default)]
    pub tile_y: u32,
    /// 顺序模式下的排列顺序
    pub order: u32,
}

/// 应用全局状态，保存在 `%APPDATA%/ChocoPanel/state.json`
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppState {
    pub pinned_apps: Vec<PinnedApp>,
    pub layout_mode: LayoutMode,
    pub opacity: f64,
    pub background_image: Option<String>,
    pub background_mode: BackgroundMode,
    pub shortcut_key: String,
}

impl Default for AppState {
    /// 默认状态：无固定应用、自由拼贴模式、85% 透明度
    fn default() -> Self {
        Self {
            pinned_apps: Vec::new(),
            layout_mode: LayoutMode::Sequential,
            opacity: 0.85,
            background_image: None,
            background_mode: BackgroundMode::Stretch,
            shortcut_key: "ctrl+space".to_string(),
        }
    }
}

impl AppState {
    /// 获取状态文件的存储路径（`%APPDATA%/ChocoPanel/state.json`）
    fn state_path() -> PathBuf {
        let dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("ChocoPanel");
        fs::create_dir_all(&dir).ok();
        dir.join("state.json")
    }

    /// 从本地 JSON 文件加载状态，文件不存在或解析失败时返回默认值
    pub fn load() -> Self {
        let path = Self::state_path();
        if path.exists() {
            let data = fs::read_to_string(&path).unwrap_or_default();
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            Self::default()
        }
    }

    /// 将当前状态序列化为 JSON 并写入本地文件
    pub fn save(&self) {
        let path = Self::state_path();
        if let Ok(data) = serde_json::to_string_pretty(self) {
            fs::write(path, data).ok();
        }
    }
}
