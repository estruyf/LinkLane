use std::process::Command;
use tauri::State;

use crate::apps::known_apps;
use crate::state::AppState;

#[tauri::command]
pub fn launch_browser(
    app_name: String,
    url: String,
    is_private: bool,
    is_background: bool,
) {
    let known = known_apps();

    let mut args: Vec<String> = vec!["-a".to_string(), app_name.clone()];

    if is_background {
        args.push("--background".to_string());
    }

    if is_private {
        if let Some(app) = known.get(app_name.as_str()) {
            if let Some(private_arg) = app.private_arg {
                args.push("--new".to_string());
                args.push("--args".to_string());
                args.push(private_arg.to_string());
            }
        }
    }

    // URL must come last (after private-mode flags)
    let final_url = if let Some(app) = known.get(app_name.as_str()) {
        if let Some(convert) = app.convert_url {
            convert(&url)
        } else {
            url
        }
    } else {
        url
    };
    args.push(final_url);

    Command::new("open")
        .args(&args)
        .spawn()
        .ok();
}

#[tauri::command]
pub fn copy_url_to_clipboard(url: String) -> bool {
    let result = Command::new("pbcopy")
        .stdin(std::process::Stdio::piped())
        .spawn();

    match result {
        Ok(mut child) => {
            use std::io::Write;
            if let Some(ref mut stdin) = child.stdin {
                stdin.write_all(url.as_bytes()).ok();
            }
            child.wait().is_ok()
        }
        Err(_) => false,
    }
}

#[tauri::command]
pub fn is_default_browser() -> bool {
    log::debug!("is_default_browser: checking default HTTP handler via swift");

    let output = Command::new("swift")
        .args([
            "-e",
            r#"import AppKit; if let u = NSWorkspace.shared.urlForApplication(toOpen: URL(string: "http://eliostruyf.com")!), let b = Bundle(url: u)?.bundleIdentifier { print(b) } else { print("") }"#,
        ])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let handler = stdout.trim();
            log::debug!("is_default_browser: current handler = {:?}", handler);
            let result = handler == "com.eliostruyf.linklane";
            log::debug!("is_default_browser: result = {}", result);
            result
        }
        Err(e) => {
            log::debug!("is_default_browser: swift command failed: {}", e);
            false
        }
    }
}

#[tauri::command]
pub fn set_as_default_browser() {
    // Try the CoreServices API (works on older macOS, shows confirmation dialog on Ventura+)
    Command::new("swift")
        .args([
            "-e",
            r#"import CoreServices
LSSetDefaultHandlerForURLScheme("http" as CFString, "com.eliostruyf.linklane" as CFString)
LSSetDefaultHandlerForURLScheme("https" as CFString, "com.eliostruyf.linklane" as CFString)"#,
        ])
        .output()
        .ok();

    // Also open System Settings to the Desktop & Dock pane where "Default web browser" lives
    // This ensures the user can confirm the selection on modern macOS
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.Desktop-Settings.extension")
        .spawn()
        .ok();
}

#[tauri::command]
pub fn factory_reset(app: tauri::AppHandle, state: State<'_, AppState>) {
    let mut settings = state.settings.lock().unwrap();
    *settings = crate::settings::Settings::default();
    crate::settings::save_settings(&settings);

    use tauri::Emitter;
    app.emit("apps-updated", ()).ok();
}
