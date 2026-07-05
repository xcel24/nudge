# 💧 Water Reminder — Anime Desktop Buddy

A little anime companion who walks across your Mac's screen, sips her glass, and
asks whether you've had water yet. Goal: 8 glasses a day, with a **Yes** / **Snooze**.

> **Status:** v1 prototype. The character is a **CSS-drawn placeholder** — the code
> is built so real anime sprite art can be swapped in later without changing logic.

## Run it

```bash
npm install
npm start
```

She'll walk in ~1.5s after launch so you can see the full loop right away.
The app lives in the **menu bar** (look for the water-drop icon) — no dock icon.

## How it works

- **Menu bar menu:** shows today's progress + streak, and lets you
  *Remind me now*, *Log a glass (+1)*, *Reset today*, or *Quit*.
- Every **2 hours** she walks in from the screen edge, sips, and asks.
- **Yes** → glass count +1, happy reaction, walks off.
- **Snooze** → she pouts and comes back in **15 min**.
- Progress is saved and **resets each day**; a **streak** counts consecutive days
  you hit all 8.

## Settings

Open the menu-bar icon → **Settings…** to change:
- **Glasses per day** (1–20)
- **Reminder interval** (minutes)

These are saved to `settings.json` and applied immediately. Snooze length is
fixed at 15 min (constant `SNOOZE_MIN` in `main.js`).

## Give it to a friend (build a .dmg)

```bash
npm run package
```

This produces **`dist/Water Reminder.dmg`** — a universal build that runs on
both Apple Silicon and Intel Macs. Send them that file.

**Important — the app is unsigned** (no paid Apple Developer account), so macOS
will quarantine it on download. Your friend installs it like this:

1. Open the `.dmg`, drag **Water Reminder** to **Applications**.
2. Clear the download quarantine (one time), either:
   - **Right-click the app → Open → Open** in the dialog, or
   - Run in Terminal: `xattr -cr "/Applications/Water Reminder.app"` then open it.
3. It lives in the **menu bar**. To auto-start at login: System Settings →
   General → Login Items → add Water Reminder.

## Files

| File | Role |
|------|------|
| `main.js` | Electron main process — overlay window, menu-bar tray, scheduling, saving progress |
| `preload.js` | Secure bridge between the window and the main process |
| `index.html` / `style.css` | The character (CSS placeholder) + speech bubble |
| `renderer.js` | Walk-in / sip / ask / react animation flow |

## Swapping in real anime art later

The character is the `#char` element in `index.html`, styled in `style.css`.
To use real art, replace the CSS parts with sprite-sheet or GIF frames for the
poses the code already toggles: `walking`, `sipping`, `happy`, `sad`. The rest of
the app (scheduling, buttons, progress, streaks) stays the same.
