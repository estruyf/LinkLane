use serde::Deserialize;
use tauri::State;
use crate::state::AppState;

#[tauri::command]
pub fn load_settings(state: State<'_, AppState>) -> crate::settings::Settings {
    let settings = state.settings.lock().unwrap();
    settings.clone()
}

#[tauri::command]
pub fn save_app_settings(state: State<'_, AppState>, settings: crate::settings::Settings) {
    let mut current = state.settings.lock().unwrap();
    *current = settings;
    crate::settings::save_settings(&current);
}

#[tauri::command]
pub fn reorder_apps(app: tauri::AppHandle, state: State<'_, AppState>, ordered_names: Vec<String>) {
    let mut settings = state.settings.lock().unwrap();

    let mut reordered = Vec::with_capacity(ordered_names.len());
    for name in &ordered_names {
        if let Some(entry) = settings.apps.iter().find(|a| &a.name == name) {
            reordered.push(entry.clone());
        }
    }

    // Append any apps not in the new order (shouldn't happen, but be safe)
    for entry in &settings.apps {
        if !ordered_names.contains(&entry.name) {
            reordered.push(entry.clone());
        }
    }

    settings.apps = reordered;
    crate::settings::save_settings(&settings);

    // Notify the picker window to refresh its app list
    use tauri::Emitter;
    app.emit("apps-updated", ()).ok();
}

fn normalize_hotkey(value: &str) -> Option<String> {
    let trimmed = value.trim();
    let mut chars = trimmed.chars();
    let ch = chars.next()?;

    if chars.next().is_some() {
        return None;
    }

    if ch.is_ascii_alphanumeric() {
        Some(ch.to_ascii_lowercase().to_string())
    } else {
        None
    }
}

fn apply_hotkey_to_settings(
    settings: &mut crate::settings::Settings,
    app_name: &str,
    hotkey: Option<String>,
) -> Result<(), String> {
    if !settings.apps.iter().any(|entry| entry.name == app_name) {
        return Err("App not found in settings".to_string());
    }

    if let Some(ref key) = hotkey {
        for entry in &mut settings.apps {
            if entry.name != app_name {
                let has_same = entry
                    .hotkey
                    .as_ref()
                    .map(|existing| existing.eq_ignore_ascii_case(key))
                    .unwrap_or(false);
                if has_same {
                    entry.hotkey = None;
                }
            }
        }
    }

    if let Some(target) = settings.apps.iter_mut().find(|entry| entry.name == app_name) {
        target.hotkey = hotkey;
    }

    Ok(())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyUpdate {
    pub app_name: String,
    pub hotkey: Option<String>,
}

#[tauri::command]
pub fn set_app_hotkey(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    app_name: String,
    hotkey: Option<String>,
) -> Result<(), String> {
    let normalized_hotkey = match hotkey {
        Some(value) => normalize_hotkey(&value),
        None => None,
    };

    let mut settings = state.settings.lock().unwrap();
    apply_hotkey_to_settings(&mut settings, &app_name, normalized_hotkey)?;

    crate::settings::save_settings(&settings);

    use tauri::Emitter;
    app.emit("apps-updated", ()).ok();

    Ok(())
}

#[tauri::command]
pub fn set_app_hotkeys(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    updates: Vec<HotkeyUpdate>,
) -> Result<(), String> {
    let mut settings = state.settings.lock().unwrap();

    for update in &updates {
        let normalized_hotkey = match &update.hotkey {
            Some(value) => normalize_hotkey(value),
            None => None,
        };

        apply_hotkey_to_settings(&mut settings, &update.app_name, normalized_hotkey)?;
    }

    crate::settings::save_settings(&settings);

    use tauri::Emitter;
    app.emit("apps-updated", ()).ok();

    Ok(())
}

#[tauri::command]
pub fn set_app_hidden(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    app_name: String,
    is_hidden: bool,
) -> Result<(), String> {
    let mut settings = state.settings.lock().unwrap();

    if let Some(target) = settings.apps.iter_mut().find(|entry| entry.name == app_name) {
        target.is_hidden = is_hidden;
    } else {
        settings.apps.push(crate::settings::AppEntry {
            name: app_name,
            hotkey: None,
            is_installed: true,
            is_hidden,
        });
    }

    crate::settings::save_settings(&settings);

    use tauri::Emitter;
    app.emit("apps-updated", ()).ok();

    Ok(())
}
