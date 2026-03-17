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
