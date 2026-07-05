const buddyEl = document.getElementById('buddy');
const char = document.getElementById('char');
const sprite = document.getElementById('sprite');

// Using the original CSS-drawn character (her legs step and her arm lifts the
// glass). To switch to a PNG image instead, set USE_IMAGE = true.
const USE_IMAGE = false;
if (USE_IMAGE) {
  const probe = new Image();
  probe.onload = () => { sprite.src = probe.src; char.classList.add('has-image'); };
  probe.src = 'assets/character.png';
}
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');
const yesBtn = document.getElementById('yes');
const snoozeBtn = document.getElementById('snooze');

let busy = false; // ignore triggers while an animation sequence is playing
let soundOn = true; // updated from each reminder/celebrate payload

const sfx = (name) => {
  if (!soundOn || !window.Sfx || !window.Sfx[name]) return;
  try { window.Sfx[name](); } catch { /* never let audio break the animation */ }
};

// Let clicks pass through the transparent window, except when the cursor is
// over the character or her speech bubble.
buddyEl.addEventListener('mouseenter', () => window.buddy.setInteractive(true));
buddyEl.addEventListener('mouseleave', () => window.buddy.setInteractive(false));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function setPose(pose) {
  char.classList.remove('walking', 'sipping', 'idle', 'happy', 'sad');
  if (pose) char.classList.add(pose);
}

// Walk in from off-screen, then take a sip.
async function walkIn() {
  buddyEl.classList.remove('hidden');
  buddyEl.classList.remove('entered');
  setPose('walking');
  sfx('steps');
  // next frame so the transition runs
  await wait(30);
  buddyEl.classList.add('entered');
  await wait(2400);          // matches the CSS transform transition
  setPose('sipping');
  sfx('sip');
  await wait(1600);
  setPose(null);
}

async function walkOut() {
  hideBubble();
  setPose('walking');
  buddyEl.classList.remove('entered'); // slides back off-screen left
  await wait(2000);
  buddyEl.classList.add('hidden');
  setPose(null);
  busy = false;
  window.buddy.setInteractive(false);
}

function showBubble(text, withButtons = false) {
  bubbleText.innerHTML = text;
  // Yes/Snooze only make sense for the actual question — hide them for
  // celebrations and acknowledgements.
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

// ---- Reminder ----
window.buddy.onShowReminder(async ({ count, goal, sound }) => {
  if (busy) return;
  busy = true;
  soundOn = sound !== false;
  await walkIn();
  setPose('idle'); // gentle breathing while she waits for your answer
  sfx('appear');
  showBubble(`Did you drink water? 💧<br><small>${count} / ${goal} today</small>`, true);
});

// ---- Already done for the day ----
window.buddy.onCelebrate(async ({ goal, streak, sound }) => {
  if (busy) return;
  busy = true;
  soundOn = sound !== false;
  await walkIn();
  sparkle();
  setPose('happy');
  sfx('celebrate');
  showBubble(`All ${goal} glasses done! 🎉<br><small>🔥 ${streak}-day streak</small>`);
  await wait(3200);
  await walkOut();
});

// ---- Buttons ----
yesBtn.addEventListener('click', async () => {
  const { count, goal, streak } = await window.buddy.respond('yes');
  hideBubble();
  sparkle();
  setPose('happy');
  sfx('yes');
  const done = count >= goal;
  showBubble(
    done
      ? `Yay! All ${goal} done! 🎉<br><small>🔥 ${streak}-day streak</small>`
      : `Yay! ${count} / ${goal} 💪<br><small>Keep it up!</small>`
  );
  await wait(2200);
  await walkOut();
});

snoozeBtn.addEventListener('click', async () => {
  await window.buddy.respond('snooze');
  hideBubble();
  setPose('sad');
  sfx('snooze');
  showBubble(`Okay... I'll be back soon 💤`);
  await wait(1800);
  await walkOut();
});
