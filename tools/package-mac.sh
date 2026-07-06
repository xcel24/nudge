#!/usr/bin/env bash
# Builds a distributable macOS .dmg for Nudge.
#
# The app is unsigned (no paid Apple Developer account), so we deep ad-hoc
# sign it — that lets it launch on Apple Silicon once the recipient removes
# the download quarantine (see README "Give it to a friend").
set -euo pipefail
cd "$(dirname "$0")/.."

APP="dist/mac-universal/Nudge.app"

echo "==> Building app icon (from assets/icon-1024.png)..."
ICONSET="build/icon.iconset"
rm -rf "$ICONSET"; mkdir -p "$ICONSET"
sips -z 16 16   assets/icon-1024.png --out "$ICONSET/icon_16x16.png"      >/dev/null
sips -z 32 32   assets/icon-1024.png --out "$ICONSET/icon_16x16@2x.png"   >/dev/null
sips -z 32 32   assets/icon-1024.png --out "$ICONSET/icon_32x32.png"      >/dev/null
sips -z 64 64   assets/icon-1024.png --out "$ICONSET/icon_32x32@2x.png"   >/dev/null
sips -z 128 128 assets/icon-1024.png --out "$ICONSET/icon_128x128.png"    >/dev/null
sips -z 256 256 assets/icon-1024.png --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256 assets/icon-1024.png --out "$ICONSET/icon_256x256.png"    >/dev/null
sips -z 512 512 assets/icon-1024.png --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512 assets/icon-1024.png --out "$ICONSET/icon_512x512.png"    >/dev/null
cp assets/icon-1024.png "$ICONSET/icon_512x512@2x.png"
iconutil -c icns "$ICONSET" -o build/icon.icns
echo "    build/icon.icns ready"

echo "==> Building app with electron-builder..."
npm run dist

echo "==> Deep ad-hoc signing the bundle..."
codesign --deep --force -s - "$APP"
codesign --verify --deep --strict "$APP" && echo "    signature OK"

echo "==> Packaging DMG..."
rm -rf dist/dmgroot "dist/Nudge.dmg"
mkdir -p dist/dmgroot
cp -R "$APP" dist/dmgroot/
ln -s /Applications dist/dmgroot/Applications
hdiutil create -volname "Nudge" -srcfolder dist/dmgroot -ov -format UDZO "dist/Nudge.dmg" >/dev/null
rm -rf dist/dmgroot

echo "==> Done: dist/Nudge.dmg"
