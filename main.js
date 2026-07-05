const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Let the (gesture-less) overlay play synthesized sound effects.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// ---- Config -------------------------------------------------------------
const SNOOZE_MIN = 15;                 // global snooze length (minutes)
const MASCOTS = ['water-girl', 'doctor']; // built-in characters

// A "reminder" is any daily habit: name, emoji, per-day goal, how often to
// nudge, which mascot walks in, and what she/he asks.
const DEFAULT_REMINDERS = [
  { id: 'water',   name: 'Water',        emoji: '💧', goal: 8, everyMin: 90,  mascot: 'water-girl', prompt: 'Did you drink water?' },
  { id: 'vitamin', name: 'Multivitamin', emoji: '💊', goal: 1, everyMin: 240, mascot: 'doctor',     prompt: 'Did you take your vitamin?' },
];

let SOUND = true;
let reminders = clone(DEFAULT_REMINDERS);

// ---- Persistence --------------------------------------------------------
const dataFile = () => path.join(app.getPath('userData'), 'progress.json');
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function clone(x) { return JSON.parse(JSON.stringify(x)); }
function genId() { return 'r' + Math.random().toString(36).slice(2, 9); }

function clampInt(v, min, max, fallback) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeReminder(r) {
  if (!r || typeof r !== 'object') return null;
  const name = String(r.name || '').trim() || 'Reminder';
  return {
    id: r.id || genId(),
    name,
    emoji: String(r.emoji || '⏰').trim() || '⏰',
    goal: clampInt(r.goal, 1, 20, 1),
    everyMin: clampInt(r.everyMin ?? r.intervalMin, 5, 1440, 90),
    mascot: MASCOTS.includes(r.mascot) ? r.mascot : 'water-girl',
    prompt: String(r.prompt || '').trim() || `Time for ${name}?`,
  };
}

function loadSettings() {
  try {
    const raw = JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
    if (Array.isArray(raw.reminders)) {
      const list = raw.reminders.map(normalizeReminder).filter(Boolean);
      return { sound: raw.sound !== false, reminders: list.length ? list : clone(DEFAULT_REMINDERS) };
    }
    // Migrate the old single-goal format.
    if (raw.goal || raw.intervalMin) {
      return {
        sound: raw.sound !== false,
        reminders: [normalizeReminder({
          id: 'water', name: 'Water', emoji: '💧', goal: raw.goal,
          everyMin: raw.intervalMin, mascot: 'water-girl', prompt: 'Did you drink water?',
        })],
      };
    }
    return { sound: true, reminders: clone(DEFAULT_REMINDERS) };
  } catch {
    return { sound: true, reminders: clone(DEFAULT_REMINDERS) };
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify({ sound: SOUND, reminders }));
  } catch (e) { console.error('Could not save settings:', e); }
}

// Progress: { date, byId: { [reminderId]: { count, streak } } }
let state = { date: todayKey(), byId: {} };

function loadState() {
  let raw = null;
  try { raw = JSON.parse(fs.readFileSync(dataFile(), 'utf8')); } catch {}
  const today = todayKey();
  const out = { date: today, byId: {} };
  for (const r of reminders) {
    const prev = raw && raw.byId && raw.byId[r.id];
    if (raw && raw.date === today && prev) {
      out.byId[r.id] = { count: prev.count, streak: prev.streak };
    } else {
      const completed = prev && prev.count >= r.goal;   // carry streak if yesterday was completed
      out.byId[r.id] = { count: 0, streak: completed ? prev.streak : 0 };
    }
  }
  return out;
}

function saveState() {
  try { fs.writeFileSync(dataFile(), JSON.stringify(state)); }
  catch (e) { console.error('Could not save progress:', e); }
}

function rolloverIfNeeded() {
  if (state.date !== todayKey()) { state = loadState(); saveState(); }
}

// Keep in-memory progress in sync with the current reminder list (after edits).
function reconcileState() {
  if (state.date !== todayKey()) { state = loadState(); return; }
  const byId = {};
  for (const r of reminders) byId[r.id] = state.byId[r.id] || { count: 0, streak: 0 };
  state.byId = byId;
  saveState();
}

const reminderById = (id) => reminders.find((r) => r.id === id);

// ---- Windows / tray -----------------------------------------------------
let win = null;
let settingsWin = null;
let tray = null;
const timers = new Map();

function createWindow() {
  const { bounds } = screen.getPrimaryDisplay();
  win = new BrowserWindow({
    x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
    transparent: true, frame: false, resizable: false, movable: false,
    focusable: true, hasShadow: false, skipTaskbar: true, alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile('index.html');
}

function openSettings() {
  if (settingsWin) { settingsWin.show(); settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 480, height: 600, resizable: false, title: 'Nudge — Settings',
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  settingsWin.loadFile('settings.html');
  if (app.dock) app.dock.show();
  settingsWin.on('closed', () => { settingsWin = null; if (app.dock) app.dock.hide(); });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'trayTemplate.png'));
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  refreshTray();
}

function refreshTray() {
  if (!tray) return;
  const items = [];
  for (const r of reminders) {
    const p = state.byId[r.id] || { count: 0, streak: 0 };
    const done = p.count >= r.goal ? ' ✓' : '';
    items.push({ label: `${r.emoji} ${r.name}: ${p.count}/${r.goal}${done}`, enabled: false });
  }
  items.push({ type: 'separator' });
  items.push({
    label: 'Nudge me now',
    submenu: reminders.map((r) => ({ label: `${r.emoji} ${r.name}`, click: () => triggerReminder(r.id, true) })),
  });
  items.push({ label: 'Reset today', click: () => { for (const id in state.byId) state.byId[id].count = 0; saveState(); refreshTray(); } });
  items.push({ type: 'separator' });
  items.push({ label: 'Settings…', click: () => openSettings() });
  items.push({ label: 'Quit', click: () => app.quit() });
  tray.setToolTip('Nudge');
  tray.setContextMenu(Menu.buildFromTemplate(items));
}

// ---- Reminder flow ------------------------------------------------------
function payload(r) {
  const p = state.byId[r.id] || { count: 0, streak: 0 };
  return {
    id: r.id, name: r.name, emoji: r.emoji, prompt: r.prompt, mascot: r.mascot,
    goal: r.goal, count: p.count, streak: p.streak, sound: SOUND,
  };
}

function triggerReminder(id, manual = false) {
  const r = reminderById(id);
  if (!r || !win) return;
  rolloverIfNeeded();
  const p = state.byId[id] || { count: 0, streak: 0 };
  if (process.env.WR_DEBUG) console.log('[wr] trigger', id, 'count', p.count, 'manual', manual);
  if (p.count >= r.goal) {
    if (manual) win.webContents.send('celebrate', payload(r));   // quiet on scheduled ticks once done
  } else {
    win.webContents.send('show-reminder', payload(r));
  }
}

function recordDone(id) {
  const r = reminderById(id);
  if (!r) return { count: 0, streak: 0 };
  const p = state.byId[id] || (state.byId[id] = { count: 0, streak: 0 });
  p.count = Math.min(r.goal, p.count + 1);
  if (p.count === r.goal) p.streak += 1;
  saveState();
  refreshTray();
  return p;
}

function scheduleNext(id, minutes) {
  const r = reminderById(id);
  if (!r) return;
  clearTimeout(timers.get(id));
  const ms = (minutes ?? r.everyMin) * 60 * 1000;
  timers.set(id, setTimeout(() => { triggerReminder(id); scheduleNext(id); }, ms));
}

function scheduleAll() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  for (const r of reminders) scheduleNext(r.id);
}

// ---- IPC ----------------------------------------------------------------
ipcMain.on('set-interactive', (_e, interactive) => {
  if (win) win.setIgnoreMouseEvents(!interactive, { forward: true });
});

ipcMain.handle('response', (_e, { id, answer }) => {
  const r = reminderById(id);
  if (!r) return {};
  if (answer === 'yes') {
    const p = recordDone(id);
    scheduleNext(id);                 // next nudge a full interval from now
    return { count: p.count, streak: p.streak, goal: r.goal };
  }
  if (answer === 'snooze') scheduleNext(id, SNOOZE_MIN);
  const p = state.byId[id] || { count: 0, streak: 0 };
  return { count: p.count, streak: p.streak, goal: r.goal };
});

ipcMain.handle('get-settings', () => ({ sound: SOUND, reminders, mascots: MASCOTS }));

ipcMain.handle('save-settings', (_e, incoming) => {
  SOUND = incoming && incoming.sound !== false;
  const list = (incoming && Array.isArray(incoming.reminders) ? incoming.reminders : [])
    .map(normalizeReminder).filter(Boolean);
  reminders = list.length ? list : clone(DEFAULT_REMINDERS);
  saveSettings();
  reconcileState();
  refreshTray();
  scheduleAll();
  if (settingsWin) settingsWin.close();
  return { sound: SOUND, reminders };
});

// ---- App lifecycle ------------------------------------------------------
app.whenReady().then(() => {
  if (app.dock) app.dock.hide();
  const s = loadSettings();
  SOUND = s.sound;
  reminders = s.reminders;
  saveSettings();
  state = loadState();
  saveState();
  createWindow();
  createTray();
  scheduleAll();

  // Greet with the first reminder shortly after launch.
  if (reminders[0]) setTimeout(() => triggerReminder(reminders[0].id), 1500);
});

app.on('window-all-closed', (e) => { e.preventDefault?.(); });
