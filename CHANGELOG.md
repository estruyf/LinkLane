# Changelog

All notable changes to LinkLane are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Seshboard in the picker.** If Seshboard is installed, it shows up next to
  your browsers. Picking it opens the link in the Browser panel of the
  Seshboard session in front. It needs a Seshboard version with
  `seshboard://open` links.
- **Check for updates from the app.** Open Preferences › About, or pick
  Check for Updates... in the menu bar. If a new version is available,
  LinkLane installs it and restarts.

## [0.2.0] - 2026-08-28

First public release. Everything below is what LinkLane does today; earlier
versions were never published.

### Added

- **A picker between the link and the browser.** Set LinkLane as your default
  browser and every URL — from mail, chat, a document, anywhere — raises a
  small floating window instead of going straight to whichever browser macOS
  happened to open last. Pick with a click, the arrow keys, or a hotkey.
- **Single-key hotkeys.** Assign any of `a`–`z` or `0`–`9` to a browser and
  one press sends the link there.
- **Private windows and background opens.** **Shift+Enter** opens the link in a
  private or incognito window (Chrome, Firefox, Edge, Brave, Safari and more),
  **Alt+Enter** opens it without pulling focus away from what you were doing,
  and **Cmd+C** copies the URL instead of opening it at all.
- **Menu bar access.** Restore the last URL, open whatever URL is on the
  clipboard, jump to preferences, or quit — LinkLane has no Dock icon and
  stays out of the way otherwise.
- **Preferences.** Drag browsers into the order you want them, hide the ones
  you never pick, assign hotkeys, rescan after installing something new, and
  set LinkLane as the default browser.
- **Over 40 browsers detected.** `/Applications` and `~/Applications` are
  scanned for Chrome, Firefox, Safari, Edge, Arc, Brave, Vivaldi, Zen, Opera,
  DuckDuckGo and the rest, with their real icons pulled from the app bundles
  and cached at startup.
- **The picker follows your cursor.** It opens on the monitor you are actually
  working on, and sizes itself to the number of browsers you kept visible.
- **Signed, notarized builds on the release page.** The macOS build is signed
  with a Developer ID certificate and notarized by Apple, so it opens without
  a Gatekeeper detour.
- **Homebrew install.** `brew install --cask estruyf/tap/linklane` fetches that
  same build and puts it in `/Applications`. Releases push the cask to the tap
  themselves, so the tap never lags behind the release page.

### Known limitations

- Apple Silicon only. The release job builds `aarch64-apple-darwin`, and the
  cask says so, so `brew install` on an Intel Mac stops with a clear reason
  rather than a failed download.
