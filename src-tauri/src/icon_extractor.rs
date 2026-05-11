use base64::Engine;
use image::ImageEncoder;
use std::path::Path;

/// 从应用路径或图标路径提取图标，返回 base64 data URI
///
/// 提取优先级：
/// 1. 注册表 DisplayIcon 指向的 .ico/.png 文件
/// 2. .lnk 快捷方式的目标程序图标
/// 3. .exe 可执行文件的嵌入图标（通过 PowerShell）
pub fn extract_icon(icon_path: Option<&str>, exe_path: &str) -> Option<String> {
    // 1. 尝试从注册表的 DisplayIcon 路径获取
    if let Some(ip) = icon_path {
        let clean_path = ip.trim_matches('"').split(',').next().unwrap_or("");
        if !clean_path.is_empty() {
            if let Some(data) = load_icon_file(clean_path) {
                return Some(data);
            }
        }
    }

    // 2. 尝试从 .lnk 文件解析目标
    if exe_path.to_lowercase().ends_with(".lnk") {
        if let Some(data) = extract_from_lnk(exe_path) {
            return Some(data);
        }
    }

    // 3. 尝试直接从 .exe 文件提取图标
    if exe_path.to_lowercase().ends_with(".exe") && Path::new(exe_path).exists() {
        if let Some(data) = extract_exe_icon_via_powershell(exe_path) {
            return Some(data);
        }
    }

    None
}

/// 加载 .ico / .png / .bmp 文件并转为 base64 data URI
fn load_icon_file(path: &str) -> Option<String> {
    let p = Path::new(path);
    if !p.exists() {
        return None;
    }

    let ext = p.extension()?.to_str()?.to_lowercase();
    match ext.as_str() {
        "png" | "bmp" | "jpg" | "jpeg" | "gif" | "webp" => {
            let bytes = std::fs::read(p).ok()?;
            let mime = match ext.as_str() {
                "jpg" | "jpeg" => "image/jpeg",
                "gif" => "image/gif",
                "webp" => "image/webp",
                _ => "image/png",
            };
            Some(format!(
                "data:{};base64,{}",
                mime,
                base64::engine::general_purpose::STANDARD.encode(&bytes)
            ))
        }
        "ico" => {
            let bytes = std::fs::read(p).ok()?;
            if let Some(png) = ico_to_png(&bytes) {
                Some(format!(
                    "data:image/png;base64,{}",
                    base64::engine::general_purpose::STANDARD.encode(&png)
                ))
            } else {
                Some(format!(
                    "data:image/x-icon;base64,{}",
                    base64::engine::general_purpose::STANDARD.encode(&bytes)
                ))
            }
        }
        _ => None,
    }
}

/// 将 ICO 文件转换为 PNG 格式
fn ico_to_png(ico_data: &[u8]) -> Option<Vec<u8>> {
    let icon_dir = ico::IconDir::read(std::io::Cursor::new(ico_data)).ok()?;
    let entry = icon_dir.entries().iter().max_by_key(|e| e.width())?;
    let image = entry.decode().ok()?;

    let width = image.width();
    let height = image.height();
    let rgba = image.rgba_data();

    let mut png_data = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_data);
    encoder
        .write_image(rgba, width, height, image::ExtendedColorType::Rgba8)
        .ok()?;

    Some(png_data)
}

/// 从 .lnk 快捷方式文件解析目标并提取图标
fn extract_from_lnk(lnk_path: &str) -> Option<String> {
    let output = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!(
                "$sh = New-Object -ComObject WScript.Shell; $lnk = $sh.CreateShortcut('{}'); $lnk.TargetPath",
                lnk_path.replace('\'', "''")
            ),
        ])
        .output()
        .ok()?;

    let target = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if target.is_empty() {
        return None;
    }

    if target.to_lowercase().ends_with(".exe") && Path::new(&target).exists() {
        extract_exe_icon_via_powershell(&target)
    } else {
        load_icon_file(&target)
    }
}

/// 通过 PowerShell 从 exe 文件提取图标并转为 base64
///
/// 使用 System.Drawing.Icon.ExtractAssociatedIcon 获取 exe 的关联图标
fn extract_exe_icon_via_powershell(exe_path: &str) -> Option<String> {
    let ps_script = format!(
        r#"
        [System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
        try {{
            $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('{}')
            if ($icon) {{
                $ms = New-Object System.IO.MemoryStream
                $icon.ToBitmap().Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                [Convert]::ToBase64String($ms.ToArray())
                $ms.Dispose()
                $icon.Dispose()
            }}
        }} catch {{ }}
        "#,
        exe_path.replace('\'', "''")
    );

    let output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", &ps_script])
        .output()
        .ok()?;

    let b64 = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if b64.is_empty() {
        return None;
    }

    Some(format!("data:image/png;base64,{}", b64))
}
