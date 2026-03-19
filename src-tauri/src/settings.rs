use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppEntry {
    pub name: String,
    pub hotkey: Option<String>,
    pub is_installed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub apps: Vec<AppEntry>,
    pub picker_height: u32,
    pub is_setup: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            apps: Vec::new(),
            picker_height: 300,
            is_setup: false,
        }
    }
}

fn settings_path() -> PathBuf {
    let config_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    let app_dir = config_dir.join("com.eliostruyf.linklane");
    fs::create_dir_all(&app_dir).ok();
    app_dir.join("settings.json")
}

pub fn load_settings() -> Settings {
    let path = settings_path();
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => Settings::default(),
    }
}

pub fn save_settings(settings: &Settings) {
    let path = settings_path();
    if let Ok(json) = serde_json::to_string_pretty(settings) {
        fs::write(path, json).ok();
    }
}
