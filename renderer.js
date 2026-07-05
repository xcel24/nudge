const buddyEl = document.getElementById('buddy');
const char = document.getElementById('char');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');
const yesBtn = document.getElementById('yes');
const snoozeBtn = document.getElementById('snooze');

let soundOn = true;
let activeMascot = 'water-girl';
let currentId = null;          // reminder currently being answered
let answerResolver = null;     // resolves when the user picks Yes/Snooze

const sfx = (name) => {
  if (!soundOn || !window.Sfx || !window.Sfx[name]) return;
  try { window.Sfx[name](); } catch { /* never let audio break the animation */ }
};

// Clicks pass through the transparent window except over the character/bubble.
buddyEl.addEventListener('mouseenter', () => window.buddy.setInteractive(true));
buddyEl.addEventListener('mouseleave', () => window.buddy.setInteractive(false));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function setPose(pose) {
  char.classList.remove('walking', 'sipping', 'idle', 'happy', 'sad');
  if (pose) char.classList.add(pose);
}

function setMascot(m) {
  activeMascot = m;
  document.querySelectorAll('.mascot').forEach((el) =>
    el.classList.toggle('active', el.dataset.mascot === m));
}

async function walkIn() {
  buddyEl.classList.remove('hidden');
  buddyEl.classList.remove('entered');
  setPose('walking');
  sfx('steps');
  await wait(30);
  buddyEl.classList.add('entered');
  await wait(2400);              // matches the CSS transform transition
  setPose('sipping');
  sfx(activeMascot === 'water-girl' ? 'sip' : 'pill');
  await wait(1600);
  setPose(null);
}

async function walkOut() {
  hideBubble();
  setPose('walking');
  buddyEl.classList.remove('entered');
  await wait(2000);
  buddyEl.classList.add('hidden');
  setPose(null);
  window.buddy.setInteractive(false);
}

function showBubble(text, withButtons = false) {
  bubbleText.innerHTML = text;
  document.getElementById('buttons').style.display = withButtons ? 'flex' : 'none';
  bubble.classList.remove('hidden');
  requestAnimationFrame(() => bubble.classList.add('show'));
}
function hideBubble() {
  bubble.classList.remove('show');
  setTimeout(() => bubble.classList.add('hidden'), 250);
}

function sparkle() {
  const emojis = ['✨', '💧', '💖', '⭐'];
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.textContent = emojis[i % emojis.length];
    s.style.left = 40 + Math.random() * 90 + 'px';
    s.style.bottom = 150 + Math.random() * 90 + 'px';
    s.style.animationDelay = Math.random() * 0.3 + 's';
    buddyEl.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}

// ---- Queue: show reminders one at a time even if several fire together ----
const queue = [];
let busy = false;

function enqueue(kind, data) { queue.push({ kind, data }); pump(); }

async function pump() {
  if (busy || !queue.length) return;
  busy = true;
  const { kind, data } = queue.shift();
  try {
    if (kind === 'reminder') await showReminder(data);
    else await showCelebrate(data);
  } finally {
    busy = false;
    pump();
  }
}

async function showReminder(data) {
  soundOn = data.sound !== false;
  setMascot(data.mascot);
  await walkIn();
  setPose('idle');
  sfx('appear');
  currentId = data.id;
  showBubble(`${data.prompt} ${data.emoji}<br><small>${data.count} / ${data.goal} today</small>`, true);
  await new Promise((resolve) => { answerResolver = resolve; }); // wait for Yes/Snooze
}

async function showCelebrate(data) {
  soundOn = data.sound !== false;
  setMascot(data.mascot);
  await walkIn();
  sparkle();
  setPose('happy');
  sfx('celebrate');
  showBubble(`All ${data.name} done! 🎉<br><small>🔥 ${data.streak}-day streak</small>`);
  await wait(3200);
  await walkOut();
}

window.buddy.onShowReminder((d) => enqueue('reminder', d));
window.buddy.onCelebrate((d) => enqueue('celebrate', d));

// ---- Answering ----
async function onAnswer(answer) {
  if (!currentId) return;
  const id = currentId;
  currentId = null;

  if (answer === 'yes') {
    const { count, goal, streak } = await window.buddy.respond(id, 'yes');
    hideBubble();
    sparkle();
    setPose('happy');
    sfx('yes');
    const done = count >= goal;
    showBubble(done
      ? `Yay! All done! 🎉<br><small>🔥 ${streak}-day streak</small>`
      : `Yay! ${count} / ${goal} 💪<br><small>Keep it up!</small>`);
    await wait(2200);
  } else {
    await window.buddy.respond(id, 'snooze');
    hideBubble();
    setPose('sad');
    sfx('snooze');
    showBubble(`Okay... I'll be back soon 💤`);
    await wait(1800);
  }

  await walkOut();
  if (answerResolver) { const r = answerResolver; answerResolver = null; r(); }
}

yesBtn.addEventListener('click', () => onAnswer('yes'));
snoozeBtn.addEventListener('click', () => onAnswer('snooze'));
