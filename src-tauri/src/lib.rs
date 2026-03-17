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
use commands::settings::{load_settings, reorder_apps, save_app_settings};
use state::AppState;
use tauri::{Emitter, Listener, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let settings = settings::load_settings();
    let app_state = AppState::new(settings);

    tauri::Builder::default()
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
        ])
        .setup(|app| {
            // Hide from dock (agent app)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

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
                rescan_apps_initial(&state);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn handle_incoming_url(app: &tauri::AppHandle, url: &str) {
    // Store URL in state
    let state = app.state::<AppState>();
    {
        let mut current = state.current_url.lock().unwrap();
        *current = url.to_string();
    }

    // Emit event to picker window
    app.emit("url-opened", url.to_string()).ok();

    // Show picker window near cursor
    if let Some(window) = app.get_webview_window("picker") {
        if let Ok(cursor_pos) = window.cursor_position() {
            let picker_width = 250.0;
            let picker_height = 400.0;

            // cursor_position() returns physical pixels
            let scale = window.scale_factor().unwrap_or(1.0);
            let win_w = picker_width * scale;
            let win_h = picker_height * scale;

            // Position: center horizontally on cursor, top at cursor
            let mut x = cursor_pos.x - win_w / 2.0;
            let mut y = cursor_pos.y;

            // Clamp to the monitor the cursor is on
            if let Ok(Some(monitor)) = window.current_monitor() {
                let mon_pos = monitor.position();
                let mon_size = monitor.size();

                let mon_x = mon_pos.x as f64;
                let mon_y = mon_pos.y as f64;
                let mon_w = mon_size.width as f64;
                let mon_h = mon_size.height as f64;

                // Keep within horizontal bounds
                if x < mon_x {
                    x = mon_x;
                }
                if x + win_w > mon_x + mon_w {
                    x = mon_x + mon_w - win_w;
                }

                // If picker would go below screen, show it above cursor instead
                if y + win_h > mon_y + mon_h {
                    y = cursor_pos.y - win_h;
                }

                // Keep within vertical bounds
                if y < mon_y {
                    y = mon_y;
                }
            }

            window
                .set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: x as i32,
                    y: y as i32,
                }))
                .ok();
        }

        window.show().ok();
        window.set_focus().ok();
    }
}

fn rescan_apps_initial(state: &AppState) {
    let browser_names = commands::apps::get_installed_browsers();
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
            });
        }
    }

    settings::save_settings(&settings);
}
