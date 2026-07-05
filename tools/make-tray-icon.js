// Generates the menu-bar (tray) icon: a black water drop with transparency,
// used as a macOS "template image" (the OS recolors it for light/dark mode).
// Outputs assets/trayTemplate.png (16px) and assets/trayTemplate@2x.png (32px).
const fs = require('fs');
const { PNG } = require('pngjs');

function drawDrop(N) {
  const pad = 1.5;
  const R = (N - 2 * pad) / 3.35;      // bulb radius (teardrop total height = 3.35R)
  const cx = N / 2;
  const yBot = N - pad, cy = yBot - R;
  const H = 2.35 * R, yTip = cy - H;
  const L2overH = (H * H - R * R) / H;
  const cosA = Math.sqrt(H * H - R * R) / H;

  const inDrop = (x, y) => {
    const dxc = x - cx, dyc = y - cy;
    if (dxc * dxc + dyc * dyc <= R * R) return true;
    const proj = y - yTip;
    if (proj <= 0 || proj > L2overH) return false;
    return proj / Math.hypot(x - cx, y - yTip) >= cosA;
  };

  const SS = 4;
  const png = new PNG({ width: N, height: N });
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++)
          if (inDrop(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS)) hits++;
      const i = (y * N + x) * 4;
      png.data[i] = 0; png.data[i + 1] = 0; png.data[i + 2] = 0;   // black
      png.data[i + 3] = Math.round((hits / (SS * SS)) * 255);       // alpha = coverage
    }
  }
  return png;
}

fs.writeFileSync('assets/trayTemplate.png', PNG.sync.write(drawDrop(16)));
fs.writeFileSync('assets/trayTemplate@2x.png', PNG.sync.write(drawDrop(32)));
console.log('wrote assets/trayTemplate.png (16) and assets/trayTemplate@2x.png (32)');
