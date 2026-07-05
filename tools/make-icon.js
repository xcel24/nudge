// Builds a 1024x1024 macOS-style app icon: a white water drop on a rounded
// blue tile. Output: assets/icon-1024.png
// (tools/package-mac.sh converts this to build/icon.icns).
const fs = require('fs');
const { PNG } = require('pngjs');

const SIZE = 1024;
const RADIUS = 185;          // rounded-corner radius of the tile
const SS = 3;                // supersampling factor for smooth edges

// --- Rounded tile test ---
function inTile(x, y) {
  const rx = Math.min(x, SIZE - x), ry = Math.min(y, SIZE - y);
  if (rx >= RADIUS || ry >= RADIUS) return true;
  const dx = RADIUS - rx, dy = RADIUS - ry;
  return dx * dx + dy * dy <= RADIUS * RADIUS;
}

// --- Water drop geometry (circle bulb + tangent cone to a top tip) ---
const cx = 512, cy = 632, R = 250;   // bulb
const H = 2.35 * R;                  // apex height above bulb center
const yTip = cy - H, yBot = cy + R;
const L2overH = (H * H - R * R) / H; // axial cap where the cone meets the bulb
const cosA = Math.sqrt(H * H - R * R) / H;

function inDrop(x, y) {
  const dxc = x - cx, dyc = y - cy;
  if (dxc * dxc + dyc * dyc <= R * R) return true;   // bulb
  const proj = y - yTip;                             // distance below apex (axis = down)
  if (proj <= 0 || proj > L2overH) return false;
  const vlen = Math.hypot(x - cx, y - yTip);
  return proj / vlen >= cosA;                        // inside the cone
}

const lerp = (a, b, t) => a + (b - a) * t;

// Color of the icon at a continuous point.
function sample(x, y) {
  if (!inTile(x, y)) return [0, 0, 0, 0];

  // Background: vertical blue gradient.
  let r = lerp(0x5b, 0x2b, y / SIZE);
  let g = lerp(0xb7, 0x7f, y / SIZE);
  let b = lerp(0xe6, 0xc0, y / SIZE);

  if (inDrop(x, y)) {
    // Droplet: soft top-to-bottom white->pale-blue.
    const t = (y - yTip) / (yBot - yTip);
    r = lerp(0xf6, 0xcf, t);
    g = lerp(0xfb, 0xe8, t);
    b = lerp(0xff, 0xfa, t);
    // Highlight ellipse (upper-left of the bulb) for a glossy look.
    const hx = (x - (cx - 78)) / 78, hy = (y - (cy - 70)) / 120;
    const h = hx * hx + hy * hy;
    if (h < 1) {
      const k = 0.75 * (1 - h);
      r = lerp(r, 255, k); g = lerp(g, 255, k); b = lerp(b, 255, k);
    }
  }
  return [r, g, b, 255];
}

// Render with supersampling.
const png = new PNG({ width: SIZE, height: SIZE });
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let r = 0, g = 0, bl = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const [pr, pg, pb, pa] = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
        const wa = pa / 255;
        r += pr * wa; g += pg * wa; bl += pb * wa; a += pa;
      }
    }
    const n = SS * SS, cov = a / (255 * n);
    const i = (y * SIZE + x) * 4;
    png.data[i]     = cov > 0 ? Math.round(r / (n * cov)) : 0;
    png.data[i + 1] = cov > 0 ? Math.round(g / (n * cov)) : 0;
    png.data[i + 2] = cov > 0 ? Math.round(bl / (n * cov)) : 0;
    png.data[i + 3] = Math.round(cov * 255);
  }
}

fs.writeFileSync('assets/icon-1024.png', PNG.sync.write(png));
console.log('wrote assets/icon-1024.png (1024x1024)');
