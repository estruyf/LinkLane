# LinkLane

> Every link finds its lane to the right browser.

LinkLane is a macOS browser picker that lets you choose which browser opens your links — every time. Set it as your default browser and whenever you click a URL (from email, chat, documents, etc.), a lightweight picker appears so you can route the link to the right browser instantly.

## Features

- **Browser Picker** — A compact floating window appears on the active monitor whenever a URL is opened. Select a browser with a click, keyboard arrow keys, or an assigned hotkey.
- **Hotkeys** — Assign a single-key shortcut (a–z, 0–9) to any browser for instant, one-press launching.
- **Private / Incognito Mode** — Press **Shift+Enter** to open the URL in a private window (supports Chrome, Firefox, Edge, Brave, Safari, and more).
- **Background Launch** — Press **Alt+Enter** to open the link without switching focus to the browser.
- **Copy URL** — Press **Cmd+C** from the picker to copy the current URL to the clipboard.
- **System Tray** — Restore the last URL, open a URL from the clipboard, access preferences, or quit — all from the menu bar.
- **Preferences** — Reorder browsers via drag-and-drop, hide browsers you don't use, assign hotkeys, rescan for newly installed apps, and set LinkLane as the default browser.
- **Multi-Monitor Support** — The picker always appears on the monitor where your cursor is.
- **40+ Browsers** — Detects Chrome, Firefox, Safari, Edge, Arc, Brave, Vivaldi, Zen, Opera, DuckDuckGo, and many more from `/Applications` and `~/Applications`.
- **Seshboard** — If [Seshboard](https://github.com/estruyf/seshboard) is installed, it shows up like a browser and opens the link in Seshboard's Browser panel. It needs a Seshboard version with `seshboard://open` links.
- **Auto Icon Extraction** — App icons are extracted from macOS bundles and cached at startup.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| ↑ / ↓ | Navigate browsers |
| Enter | Open in selected browser |
| Shift+Enter | Open in private / incognito mode |
| Alt+Enter | Open in background |
| Cmd+C | Copy URL to clipboard |
| Escape | Close the picker |
| a–z / 0–9 | Launch the browser assigned to that hotkey |

## Install

```bash
brew install --cask estruyf/tap/linklane
```

Or download the `.dmg` from the [latest release](https://github.com/estruyf/LinkLane/releases/latest). Builds are Apple Silicon only.

## Updates

LinkLane checks for updates only when you ask. Open **Preferences → About** and click **Check for updates**, or pick **Check for Updates...** in the menu bar. If a new version is available, click **Install and restart**.

## Getting Started

### Prerequisites

- macOS
- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri CLI](https://tauri.app/)

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

The built `.dmg` will be in `src-tauri/target/release/bundle/dmg/`.

The build also signs an update bundle for the in-app updater, so it needs the updater's private key:

```bash
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/linklane.key)"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="<the key's password>"
```

If you don't have the key, build without the update bundle:

```bash
npm run tauri build -- --config '{"bundle":{"createUpdaterArtifacts":false}}'
```

## Setting as Default Browser

Open **Preferences → General** and click the button to set LinkLane as your default browser. macOS will open System Settings for confirmation. Once set, all URL opens are routed through LinkLane.

## Configuration

Settings are stored at `~/Library/Application Support/com.eliostruyf.linklane/settings.json` and include browser order, visibility, hotkey assignments, and picker window height.

Use **Factory Reset** in preferences to restore all defaults.

## Built With

- [Tauri](https://tauri.app/) — Rust-based application framework
- [React](https://react.dev/) — UI library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Vite](https://vite.dev/) — Frontend build tool
