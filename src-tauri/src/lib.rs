mod apps;
mod commands;
mod settings;
mod state;
mod tray;

use commands::apps::{get_installed_apps, get_installed_app_count, rescan_apps};
use commands::browser::{
    copy_url_to_clipboard, factory_reset, is_default_browser, launch_browser,
    set_as_default_browser,
};
use commands::settings::{
    load_settings, reorder_apps, save_app_settings, set_app_hidden, set_app_hotkey,
    set_app_hotkeys,
};
use state::AppState;
use tauri::{Emitter, Listener, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let settings = settings::load_settings();
    let app_state = AppState::new(settings);

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().level(log::LevelFilter::Debug).build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_installed_apps,
            get_installed_app_count,
            rescan_apps,
            launch_browser,
            copy_url_to_clipboard,
            is_default_browser,
            set_as_default_browser,
            factory_reset,
            load_settings,
            save_app_settings,
            reorder_apps,
            set_app_hidden,
            set_app_hotkey,
            set_app_hotkeys,
        ])
        .setup(|app| {
            // Hide from dock (agent app)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Pre-create a hidden preferences window so first open is instant.
            tray::create_preferences_window(&app.handle().clone());

            // Set up system tray
            tray::setup_tray(app)?;

            // Listen for deep-link URLs
            let handle = app.handle().clone();
            app.listen("deep-link://new-url", move |event| {
                if let Some(urls) = event.payload().strip_prefix('"').and_then(|s| s.strip_suffix('"')) {
                    handle_incoming_url(&handle, urls);
                } else {
                    // Try parsing as JSON array of strings
                    if let Ok(urls) = serde_json::from_str::<Vec<String>>(event.payload()) {
                        if let Some(url) = urls.first() {
                            handle_incoming_url(&handle, url);
                        }
                    }
                }
            });

            // Initial scan: populate installed apps + icons in background
            let handle2 = app.handle().clone();
            std::thread::spawn(move || {
                let state = handle2.state::<AppState>();
                let changed = rescan_apps_initial(&state);
                if changed {
                    handle2.emit("apps-updated", ()).ok();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub(crate) fn handle_incoming_url(app: &tauri::AppHandle, url: &str) {
    // Store URL in state
    let state = app.state::<AppState>();
    {
        let mut current = state.current_url.lock().unwrap();
        *current = url.to_string();
    }

    // Emit event to picker window
    app.emit("url-opened", url.to_string()).ok();

    show_picker(app);
}

pub(crate) fn show_picker(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("picker") {
        window.unminimize().ok();
        window.show().ok();
        window.set_focus().ok();
        window.center().ok();
    }
}

fn rescan_apps_initial(state: &AppState) -> bool {
    let browser_names = commands::apps::get_installed_browsers();
    {
        let mut settings = state.settings.lock().unwrap();

        for entry in &mut settings.apps {
            entry.is_installed = browser_names.contains(&entry.name);
        }

        for name in &browser_names {
            if !settings.apps.iter().any(|a| &a.name == name) {
                settings.apps.push(settings::AppEntry {
                    name: name.clone(),
                    hotkey: None,
                    is_installed: true,
                    is_hidden: false,
                });
            }
        }

        settings::save_settings(&settings);
    }

    // Populate icon cache at startup so picker/preferences can render real app icons.
    commands::apps::cache_missing_icons(state, &browser_names)
}
