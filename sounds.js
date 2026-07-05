// Synthesized sound effects via the Web Audio API — no audio files needed.
// Exposed as window.Sfx. All sounds are short and gentle.
(() => {
  let ctx = null;
  const ac = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  // A single enveloped oscillator note.
  function note(freq, start, dur, { type = 'sine', gain = 0.14, glideTo = null } = {}) {
    const c = ac();
    const t0 = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  // Short filtered noise burst — the little "tick" of impact.
  function noiseBurst(start, dur, gain, freq) {
    const c = ac();
    const t0 = c.currentTime + start;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); // decaying noise
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 0.9;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(bp).connect(g).connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // A realistic water droplet: impact tick + a quick rising-pitch bubble
  // resonance (the signature "plink").
  function drip(start = 0, gain = 0.16, base = 600, top = 1500) {
    noiseBurst(start, 0.012, gain * 0.5, 2600);
    note(base, start + 0.004, 0.16, { type: 'sine', gain, glideTo: top });
  }

  window.Sfx = {
    // Gentle two-note chime when she shows up / asks.
    appear() {
      note(659, 0, 0.18, { gain: 0.10 });
      note(988, 0.12, 0.28, { gain: 0.10 });
    },

    // Soft alternating footsteps across the walk-in (~2.2s).
    steps(count = 5, spacing = 0.45) {
      for (let i = 0; i < count; i++) {
        note(i % 2 ? 150 : 130, i * spacing, 0.07, { type: 'triangle', gain: 0.05 });
      }
    },

    // A single water droplet (exposed for reuse).
    drop() { drip(0, 0.17); },

    // Two realistic droplets for the sip moment.
    sip() {
      drip(0, 0.17, 620, 1550);
      drip(0.24, 0.12, 520, 1300);
    },

    // Happy ascending arpeggio for Yes.
    yes() {
      [523, 659, 784, 1047].forEach((f, i) =>
        note(f, i * 0.09, 0.16, { type: 'triangle', gain: 0.11 }));
    },

    // Soft descending "aww" for Snooze.
    snooze() {
      note(440, 0, 0.2, { gain: 0.09, glideTo: 392 });
      note(330, 0.16, 0.3, { gain: 0.09 });
    },

    // Little fanfare when the daily goal is complete.
    celebrate() {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        note(f, i * 0.1, 0.22, { type: 'triangle', gain: 0.11 }));
    },
  };
})();
