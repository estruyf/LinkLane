#!/usr/bin/env bash
#
# Stamps homebrew/linklane.rb with a released version and its checksum, and
# with --push commits it to the Homebrew tap.
#
#   ./homebrew/publish-cask.sh              stamp the cask and print it
#   ./homebrew/publish-cask.sh --push       also push it to the tap
#
#   VERSION=0.2.0   the version to publish, default: src-tauri/tauri.conf.json
#   DMG=path/to.dmg the bundle to hash, default: the one the build left in
#                   src-tauri/target, and failing that the asset attached to
#                   the release
#   TAP_REPO        default: estruyf/homebrew-tap
#   HOMEBREW_TAP_TOKEN  a token with write access to the tap; --push needs it
#
# The cask in this repo is the source of truth. Everything except `version` and
# `sha256` is edited here by hand, and carried into the tap on the next
# release, so the tap never has to be edited directly.

set -euo pipefail

cd "$(dirname "$0")/.."

CASK="homebrew/linklane.rb"
TAP_REPO="${TAP_REPO:-estruyf/homebrew-tap}"
PUSH=0

for arg in "$@"; do
  case "$arg" in
    --push) PUSH=1 ;;
    *) echo "unknown option: $arg" >&2; exit 1 ;;
  esac
done

# tauri.conf.json, not package.json: the bundler stamps the .dmg filename from
# it, so it is the version the cask URL has to agree with.
if [ -z "${VERSION:-}" ]; then
  VERSION="$(node -p "require('./src-tauri/tauri.conf.json').version")"
fi
NAME="LinkLane_${VERSION}_aarch64.dmg"

# Prefer the bundle the build just produced: it is the exact bytes that were
# attached to the release, so hashing it cannot race the CDN.
if [ -z "${DMG:-}" ]; then
  for candidate in \
    "src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/$NAME" \
    "src-tauri/target/release/bundle/dmg/$NAME"; do
    if [ -f "$candidate" ]; then
      DMG="$candidate"
      break
    fi
  done
fi

if [ -z "${DMG:-}" ]; then
  DMG="$(mktemp -d)/$NAME"
  echo "==> Downloading $NAME from the release"
  curl -fsSL -o "$DMG" \
    "https://github.com/estruyf/LinkLane/releases/download/v$VERSION/$NAME"
fi

if [ ! -f "$DMG" ]; then
  echo "no bundle to hash: $DMG" >&2
  exit 1
fi

SHA="$(shasum -a 256 "$DMG" | cut -d' ' -f1)"
echo "==> LinkLane $VERSION"
echo "    bundle  $DMG"
echo "    sha256  $SHA"

# Rewritten through a temp file because BSD and GNU sed disagree about -i.
TMP="$(mktemp)"
sed -e "s|^  version \".*\"$|  version \"$VERSION\"|" \
    -e "s|^  sha256 \".*\"$|  sha256 \"$SHA\"|" \
    "$CASK" > "$TMP"
mv "$TMP" "$CASK"

# A reshaped cask would make those substitutions quietly match nothing, which
# is how a tap ends up serving last release's checksum.
if ! grep -q "^  version \"$VERSION\"$" "$CASK" || ! grep -q "^  sha256 \"$SHA\"$" "$CASK"; then
  echo "::error::$CASK was not stamped — check its version and sha256 lines." >&2
  exit 1
fi

# Ruby is on every Mac and in the runner image, and a cask is just Ruby, so
# this catches a botched substitution without dragging Homebrew's rubocop
# bundle into the release. `brew style --cask` is the fuller check to run by
# hand before opening a PR against homebrew-cask.
if command -v ruby >/dev/null 2>&1; then
  ruby -c "$CASK" > /dev/null
fi

if [ "$PUSH" -eq 0 ]; then
  echo
  cat "$CASK"
  echo
  echo "Not pushed. Re-run with --push to send it to $TAP_REPO."
  exit 0
fi

if [ -z "${HOMEBREW_TAP_TOKEN:-}" ]; then
  echo "--push needs HOMEBREW_TAP_TOKEN, a token with write access to $TAP_REPO." >&2
  exit 1
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# The token rides in the URL, which is the usual CI shape; Actions masks the
# secret in the log, and the checkout is thrown away with the runner.
git clone --depth 1 \
  "https://x-access-token:${HOMEBREW_TAP_TOKEN}@github.com/${TAP_REPO}.git" \
  "$WORK/tap"

mkdir -p "$WORK/tap/Casks"
cp "$CASK" "$WORK/tap/Casks/linklane.rb"

git -C "$WORK/tap" config user.name "github-actions[bot]"
git -C "$WORK/tap" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "$WORK/tap" add Casks/linklane.rb

if git -C "$WORK/tap" diff --cached --quiet; then
  echo "==> $TAP_REPO already serves $VERSION; nothing to push."
  exit 0
fi

git -C "$WORK/tap" commit -m "linklane $VERSION"
git -C "$WORK/tap" push
echo "==> Pushed linklane $VERSION to $TAP_REPO"
