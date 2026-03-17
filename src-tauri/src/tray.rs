use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

use crate::state::AppState;

pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let quit = MenuItem::with_id(app, "quit", "Quit BrowserPicker", true, None::<&str>)?;
    let preferences = MenuItem::with_id(app, "preferences", "Preferences...", true, None::<&str>)?;
    let restore = MenuItem::with_id(app, "restore", "Restore Picker", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&restore, &preferences, &quit])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("BrowserPicker")
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "preferences" => {
                if let Some(window) = app.get_webview_window("preferences") {
                    window.show().ok();
                    window.set_focus().ok();
                } else {
                    create_preferences_window(app);
                }
            }
            "restore" => {
                restore_picker(app);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                restore_picker(app);
            }
        })
        .build(app)?;

    Ok(())
}

fn restore_picker(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    let url = state.current_url.lock().unwrap().clone();

    if url.is_empty() {
        app.emit("no-url-to-restore", ()).ok();
        // Still show picker briefly so user sees the message
        if let Some(window) = app.get_webview_window("picker") {
            window.show().ok();
            window.set_focus().ok();
        }
        return;
    }

    // Re-emit the URL so the picker refreshes with it
    app.emit("url-opened", url).ok();

    if let Some(window) = app.get_webview_window("picker") {
        window.show().ok();
        window.set_focus().ok();
    }
}

pub fn create_preferences_window(app: &tauri::AppHandle) {
    let _window = tauri::WebviewWindowBuilder::new(
        app,
        "preferences",
        tauri::WebviewUrl::App("/".into()),
    )
    .title("BrowserPicker Preferences")
    .inner_size(600.0, 500.0)
    .resizable(false)
    .center()
    .build()
    .ok();
}
