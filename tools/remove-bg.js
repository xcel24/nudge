// Removes the solid background from the character image by flood-filling
// inward from the edges. Only background-connected pixels are erased, so
// interior light areas (like her white sweater) are preserved.
//
// Usage: node tools/remove-bg.js [input.png] [output.png]
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const input = process.argv[2] || 'assets/character-original.png';
const output = process.argv[3] || 'assets/character.png';

// Distances (Euclidean in RGB) for deciding what counts as background.
const INNER = 60;   // <= INNER from bg color -> fully transparent
const OUTER = 115;  // INNER..OUTER -> feathered edge; > OUTER -> keep opaque

const png = PNG.sync.read(fs.readFileSync(path.resolve(input)));
const { width, height, data } = png;

const idx = (x, y) => (y * width + x) * 4;
const dist = (r, g, b, br, bg, bb) =>
  Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);

// Background color = average of the four corners.
let br = 0, bg = 0, bb = 0;
for (const [x, y] of [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]) {
  const i = idx(x, y);
  br += data[i]; bg += data[i + 1]; bb += data[i + 2];
}
br /= 4; bg /= 4; bb /= 4;
console.log(`bg color ~ rgb(${br.toFixed(0)}, ${bg.toFixed(0)}, ${bb.toFixed(0)})`);

// Flood fill from every border pixel.
const visited = new Uint8Array(width * height);
const stack = [];
const pushIf = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const p = y * width + x;
  if (visited[p]) return;
  visited[p] = 1;
  stack.push(x, y);
};
for (let x = 0; x < width; x++) { pushIf(x, 0); pushIf(x, height - 1); }
for (let y = 0; y < height; y++) { pushIf(0, y); pushIf(width - 1, y); }

let cleared = 0;
while (stack.length) {
  const y = stack.pop();
  const x = stack.pop();
  const i = idx(x, y);
  const d = dist(data[i], data[i + 1], data[i + 2], br, bg, bb);
  if (d > OUTER) continue;              // hit the character silhouette; stop here

  if (d <= INNER) {
    data[i + 3] = 0;                    // fully transparent
  } else {
    // Feather: ramp alpha from 0 (at INNER) to full (at OUTER).
    data[i + 3] = Math.round(255 * (d - INNER) / (OUTER - INNER));
  }
  cleared++;

  pushIf(x + 1, y); pushIf(x - 1, y);
  pushIf(x, y + 1); pushIf(x, y - 1);
}

fs.writeFileSync(path.resolve(output), PNG.sync.write(png));
console.log(`cleared ${cleared} px -> ${output} (${width}x${height})`);
