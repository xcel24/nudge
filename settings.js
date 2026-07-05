const goalInput = document.getElementById('goal');
const intervalInput = document.getElementById('interval');
const soundInput = document.getElementById('sound');

// Load current values into the form.
window.settings.get().then((s) => {
  goalInput.value = s.goal;
  intervalInput.value = s.intervalMin;
  soundInput.checked = s.sound !== false;
});

document.getElementById('save').addEventListener('click', () => {
  window.settings.save({
    goal: parseInt(goalInput.value, 10),
    intervalMin: parseInt(intervalInput.value, 10),
    sound: soundInput.checked,
  });
  // The main process closes this window after saving.
});

document.getElementById('cancel').addEventListener('click', () => window.close());
