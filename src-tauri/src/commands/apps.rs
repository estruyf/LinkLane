use std::process::Command;

use serde::Serialize;
use tauri::State;

use crate::apps::known_apps;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize)]
pub struct InstalledApp {
    pub name: String,
    pub hotkey: Option<String>,
    pub icon: Option<String>,
}

fn scan_installed_app_names() -> Vec<String> {
    let output = Command::new("sh")
        .arg("-c")
        .arg(r#"find ~/Applications /Applications -maxdepth 1 -iname "*.app" -prune -not -path "*/.*" 2>/dev/null || true"#)
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            stdout
                .lines()
                .filter_map(|line| {
                    let path = std::path::Path::new(line.trim());
                    path.file_stem()
                        .and_then(|s| s.to_str())
                        .map(|s| s.to_string())
                })
                .collect()
        }
        Err(_) => Vec::new(),
    }
}

pub fn get_installed_browsers() -> Vec<String> {
    let known = known_apps();
    let installed = scan_installed_app_names();
    installed
        .into_iter()
        .filter(|name| known.contains_key(name.as_str()))
        .collect()
}

fn get_icon_base64(app_name: &str) -> Option<String> {
    let app_path = format!("/Applications/{}.app", app_name);
    let home_app_path = format!(
        "{}/Applications/{}.app",
        std::env::var("HOME").unwrap_or_default(),
        app_name
    );

    let path = if std::path::Path::new(&app_path).exists() {
        app_path
    } else if std::path::Path::new(&home_app_path).exists() {
        home_app_path
    } else {
        return None;
    };

    // Use sips to extract icon as PNG via the app's icon file
    let icon_path = format!("{}/Contents/Resources", path);
    let plist_output = Command::new("defaults")
        .arg("read")
        .arg(format!("{}/Contents/Info", path))
        .arg("CFBundleIconFile")
        .output()
        .ok()?;

    let icon_name = String::from_utf8_lossy(&plist_output.stdout)
        .trim()
        .to_string();

    if icon_name.is_empty() {
        return None;
    }

    let icon_file = if icon_name.ends_with(".icns") {
        format!("{}/{}", icon_path, icon_name)
    } else {
        format!("{}/{}.icns", icon_path, icon_name)
    };

    if !std::path::Path::new(&icon_file).exists() {
        return None;
    }

    let tmp_png = format!("/tmp/linklane_icon_{}.png", app_name.replace(' ', "_"));

    let sips_result = Command::new("sips")
        .args(["-s", "format", "png", "-z", "64", "64", &icon_file, "--out", &tmp_png])
        .output()
        .ok()?;

    if !sips_result.status.success() {
        return None;
    }

    let png_data = std::fs::read(&tmp_png).ok()?;
    std::fs::remove_file(&tmp_png).ok();

    use base64::Engine;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&png_data);
    Some(format!("data:image/png;base64,{}", b64))
}

#[tauri::command]
pub fn get_installed_apps(state: State<'_, AppState>) -> Vec<InstalledApp> {
    let app_state = state.inner();
    let settings = app_state.settings.lock().unwrap();

    let browser_names = get_installed_browsers();
    let icons = app_state.icons.lock().unwrap();

    // Merge with settings (preserve order from settings)
    let mut result: Vec<InstalledApp> = Vec::new();

    // First add apps from settings that are installed
    for entry in &settings.apps {
        if browser_names.contains(&entry.name) {
            result.push(InstalledApp {
                name: entry.name.clone(),
                hotkey: entry.hotkey.clone(),
                icon: icons.get(&entry.name).cloned(),
            });
        }
    }

    // Then add newly discovered apps not in settings
    for name in &browser_names {
        if !settings.apps.iter().any(|a| &a.name == name) {
            result.push(InstalledApp {
                name: name.clone(),
                hotkey: None,
                icon: icons.get(name).cloned(),
            });
        }
    }

    result
}

#[tauri::command]
pub fn get_installed_app_count(state: State<'_, AppState>) -> usize {
    let settings = state.settings.lock().unwrap();
    settings.apps.iter().filter(|a| a.is_installed).count()
}

#[tauri::command]
pub fn rescan_apps(state: State<'_, AppState>) {
    let browser_names = get_installed_browsers();
    let mut settings = state.settings.lock().unwrap();

    // Update installed status
    for entry in &mut settings.apps {
        entry.is_installed = browser_names.contains(&entry.name);
    }

    // Add new ones
    for name in &browser_names {
        if !settings.apps.iter().any(|a| &a.name == name) {
            settings.apps.push(crate::settings::AppEntry {
                name: name.clone(),
                hotkey: None,
                is_installed: true,
            });
        }
    }

    crate::settings::save_settings(&settings);

    // Refresh icons in background
    let mut icons = state.icons.lock().unwrap();
    for name in &browser_names {
        if !icons.contains_key(name) {
            if let Some(icon) = get_icon_base64(name) {
                icons.insert(name.clone(), icon);
            }
        }
    }
}
