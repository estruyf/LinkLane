use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use url::Url;

use crate::{handle_incoming_url, show_picker_on_active_monitor};
use crate::state::AppState;

pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let quit = MenuItem::with_id(app, "quit", "Quit LinkLane", true, None::<&str>)?;
    let preferences = MenuItem::with_id(app, "preferences", "Preferences...", true, None::<&str>)?;
    let restore = MenuItem::with_id(app, "restore", "Restore Picker", true, None::<&str>)?;
    let open_from_clipboard =
        MenuItem::with_id(app, "open-from-clipboard", "Open Copied URL", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&restore, &open_from_clipboard, &preferences, &quit])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .icon(Image::from_bytes(include_bytes!("../icons/tray-icon.png"))?)
        .icon_as_template(true)
        .tooltip("LinkLane")
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
            "open-from-clipboard" => {
                open_picker_from_clipboard_url(app);
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
        show_picker_on_active_monitor(app);
        return;
    }

    // Re-emit the URL so the picker refreshes with it
    app.emit("url-opened", url).ok();

    show_picker_on_active_monitor(app);
}

fn open_picker_from_clipboard_url(app: &tauri::AppHandle) {
    let Some(raw_text) = read_clipboard_text() else {
        app.emit("invalid-copied-url", ()).ok();
        show_picker_on_active_monitor(app);
        return;
    };

    let url_text = raw_text.trim();

    if is_valid_url(url_text) {
        handle_incoming_url(app, url_text);
    } else {
        app.emit("invalid-copied-url", ()).ok();
        show_picker_on_active_monitor(app);
    }
}

fn read_clipboard_text() -> Option<String> {
    let output = std::process::Command::new("pbpaste").output().ok()?;
    if !output.status.success() {
        return None;
    }

    let text = String::from_utf8(output.stdout).ok()?;
    if text.trim().is_empty() {
        return None;
    }

    Some(text)
}

fn is_valid_url(value: &str) -> bool {
    Url::parse(value)
        .map(|url| {
            matches!(url.scheme(), "http" | "https")
                && url.host_str().is_some()
        })
        .unwrap_or(false)
}

pub fn create_preferences_window(app: &tauri::AppHandle) {
    let _window = tauri::WebviewWindowBuilder::new(
        app,
        "preferences",
        tauri::WebviewUrl::App("/".into()),
    )
    .title("LinkLane Preferences")
    .inner_size(600.0, 500.0)
    .resizable(false)
    .visible(false)
    .center()
    .build()
    .ok();
}
