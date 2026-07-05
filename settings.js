const listEl = document.getElementById('list');
const soundInput = document.getElementById('sound');
const tpl = document.getElementById('card-tpl');

// Friendly labels for the built-in mascots.
const MASCOT_LABELS = { 'water-girl': '💧 Water girl', doctor: '🩺 Doctor', trainer: '🏋️ Gym trainer', default: '🙂 Buddy' };
const DEFAULT_MASCOT = 'default';
let MASCOTS = ['water-girl', 'doctor', 'trainer', 'default'];

const mascotLabel = (m) => MASCOT_LABELS[m] || m;

function updateSummary(card) {
  const goal = card.querySelector('.f-goal').value || '?';
  const every = card.querySelector('.f-every').value || '?';
  const m = card.querySelector('.f-mascot').value;
  card.querySelector('.sumtext').textContent = `${goal}×/day · every ${every}m · ${mascotLabel(m)}`;
}

function addCard(r = {}, expand = false) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('.f-emoji').value = r.emoji || '⏰';
  node.querySelector('.f-name').value = r.name || '';
  node.querySelector('.f-goal').value = r.goal ?? 1;
  node.querySelector('.f-every').value = r.everyMin ?? 90;
  node.querySelector('.f-prompt').value = r.prompt || '';

  const sel = node.querySelector('.f-mascot');
  for (const m of MASCOTS) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = mascotLabel(m);
    sel.appendChild(opt);
  }
  sel.value = MASCOTS.includes(r.mascot) ? r.mascot : DEFAULT_MASCOT;

  updateSummary(node);
  node.dataset.id = r.id || '';
  if (expand) node.classList.add('expanded');

  // Tap the summary line to expand/collapse.
  node.querySelector('.summary').addEventListener('click', () => node.classList.toggle('expanded'));
  // Keep the collapsed summary in sync while editing.
  node.querySelectorAll('.f-goal, .f-every, .f-mascot').forEach((el) =>
    el.addEventListener('input', () => updateSummary(node)));
  node.querySelector('.del').addEventListener('click', (e) => { e.stopPropagation(); node.remove(); });

  listEl.appendChild(node);
}

// Load current settings into the form.
window.settings.get().then((s) => {
  if (Array.isArray(s.mascots) && s.mascots.length) MASCOTS = s.mascots;
  soundInput.checked = s.sound !== false;
  (s.reminders || []).forEach((r) => addCard(r));
  if (!listEl.children.length) addCard({}, true); // never fully empty
});

document.getElementById('add').addEventListener('click', () => addCard({}, true));

document.getElementById('save').addEventListener('click', () => {
  const reminders = [...listEl.querySelectorAll('.card')].map((card) => ({
    id: card.dataset.id || undefined,
    emoji: card.querySelector('.f-emoji').value.trim(),
    name: card.querySelector('.f-name').value.trim(),
    goal: parseInt(card.querySelector('.f-goal').value, 10),
    everyMin: parseInt(card.querySelector('.f-every').value, 10),
    mascot: card.querySelector('.f-mascot').value,
    prompt: card.querySelector('.f-prompt').value.trim(),
  }));
  window.settings.save({ sound: soundInput.checked, reminders });
  // The main process closes this window after saving.
});

document.getElementById('cancel').addEventListener('click', () => window.close());
