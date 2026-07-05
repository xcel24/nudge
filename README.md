# ⏰ Nudge — a desktop companion for your daily habits

Nudge is a macOS menu-bar app where a little character walks across your screen,
does a gesture, and asks whether you've done a daily habit — **Yes** or **Snooze**.
Add as many reminders as you like (water, vitamins, stretching…), each with its
own goal, interval, prompt, and **mascot**.

> Built with Electron. Characters are drawn in CSS (no image assets needed).

## Run it

```bash
npm install
npm start
```

The first reminder greets you ~1.5s after launch. Nudge lives in the **menu bar**
(top-right, the 💧 icon) — there's no Dock icon.

## Reminders & settings

Menu-bar icon → **Settings…** opens the reminder manager. For each reminder set:

- **Emoji + Name** (e.g. 💊 Multivitamin)
- **Goal** — times per day (a vitamin is just `1`)
- **Every** — minutes between nudges
- **Mascot** — 💧 Water girl, 🩺 Doctor, 🏋️ Gym trainer, or 🙂 Buddy (default)
- **Prompt** — what she/he asks

Add / delete reminders, toggle **Sound effects**, and hit **Save** — changes apply
live, no restart. Each reminder tracks its own daily count + streak and goes quiet
once its goal is met, until the next day. Snooze is 15 min (constant `SNOOZE_MIN`).

Three reminders ship by default: **Water** (water girl), **Multivitamin** (doctor),
and **Exercise** (gym trainer).

## Give it to a friend (build a .dmg)

```bash
npm run package
```

Produces **`dist/Nudge.dmg`** — a universal build (Apple Silicon + Intel). It's
**unsigned** (no paid Apple Developer account), so the recipient must clear the
download quarantine once:

1. Open the `.dmg`, drag **Nudge** into **Applications**.
2. In Terminal: `xattr -cr "/Applications/Nudge.app"` (or  → System Settings →
   Privacy & Security → **Open Anyway**).
3. Open it — look for the 💧 in the top-right menu bar.

## Project layout

| File | Role |
|------|------|
| `main.js` | Electron main — overlay window, tray, per-reminder timers, persistence |
| `preload.js` / `settings-preload.js` | Secure IPC bridges |
| `index.html` / `style.css` | Character (mascots) + speech bubble |
| `renderer.js` | Walk-in / gesture / ask flow + reminder queue |
| `sounds.js` | Synthesized sound effects (Web Audio, no files) |
| `settings.html` / `settings.js` | Reminder manager UI |
| `tools/` | Icon generators + `package-mac.sh` build script |

## Adding a new mascot

Mascots can be **CSS-drawn** (like `water-girl`/`trainer`, whose limbs animate) or
a **transparent image** (like `doctor`, animated as a whole body).

1. Add a `.mascot` block in `index.html`:
   - CSS mascot: reuse part classes `head`/`arm`/`leg` so the shared pose
     animations apply, and scope its styles in `style.css` (see `.trainer`).
   - Image mascot: `<img class="sprite" src="assets/NAME.png">`, after cutting out
     the background (`node tools/remove-bg.js in.png assets/NAME.png` then
     `node tools/trim.js assets/NAME.png`).
2. Add its id to `MASCOTS` in `main.js`; add a label in `settings.js`.
