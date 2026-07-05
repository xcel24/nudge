const listEl = document.getElementById('list');
const soundInput = document.getElementById('sound');
const tpl = document.getElementById('card-tpl');

// Friendly labels for the built-in mascots.
const MASCOT_LABELS = { 'water-girl': '💧 Water girl', doctor: '🩺 Doctor' };
let MASCOTS = ['water-girl', 'doctor'];

function addCard(r = {}) {
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
    opt.textContent = MASCOT_LABELS[m] || m;
    sel.appendChild(opt);
  }
  sel.value = MASCOTS.includes(r.mascot) ? r.mascot : MASCOTS[0];

  node.querySelector('.del').addEventListener('click', () => node.remove());
  node.dataset.id = r.id || '';
  listEl.appendChild(node);
}

// Load current settings into the form.
window.settings.get().then((s) => {
  if (Array.isArray(s.mascots) && s.mascots.length) MASCOTS = s.mascots;
  soundInput.checked = s.sound !== false;
  (s.reminders || []).forEach(addCard);
  if (!listEl.children.length) addCard(); // never fully empty
});

document.getElementById('add').addEventListener('click', () => addCard());

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
