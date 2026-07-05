// Generates the menu-bar (tray) icon: a checkmark glyph with transparency,
// used as a macOS "template image" (the OS recolors it for light/dark mode).
// Outputs assets/trayTemplate.png (16px) and assets/trayTemplate@2x.png (32px).
const fs = require('fs');
const { PNG } = require('pngjs');

// Distance from point p to segment ab.
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function drawCheck(N) {
  // Checkmark points (proportional) and stroke thickness.
  const A = [0.20 * N, 0.54 * N];
  const B = [0.42 * N, 0.74 * N];
  const C = [0.80 * N, 0.30 * N];
  const half = 0.085 * N;              // half stroke width
  const SS = 4;

  const png = new PNG({ width: N, height: N });
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS, fy = y + (sy + 0.5) / SS;
          const d = Math.min(
            distToSeg(fx, fy, A[0], A[1], B[0], B[1]),
            distToSeg(fx, fy, B[0], B[1], C[0], C[1]));
          if (d <= half) hits++;
        }
      }
      const i = (y * N + x) * 4;
      png.data[i] = 0; png.data[i + 1] = 0; png.data[i + 2] = 0;  // black
      png.data[i + 3] = Math.round((hits / (SS * SS)) * 255);     // alpha = coverage
    }
  }
  return png;
}

fs.writeFileSync('assets/trayTemplate.png', PNG.sync.write(drawCheck(16)));
fs.writeFileSync('assets/trayTemplate@2x.png', PNG.sync.write(drawCheck(32)));
console.log('wrote assets/trayTemplate.png (16) and assets/trayTemplate@2x.png (32)');
