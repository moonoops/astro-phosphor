import sharp from 'sharp';

// The registered photographs of the previous desk supply incident light only.
// A broad exposure field discards the old case, aperture, grille and textures.
const meter = { width: 128, height: 72 };
const grid = { width: 33, height: 19 };

export async function meterLight(path) {
  return sharp(path).resize(meter.width, meter.height, { fit: 'fill' })
    .removeAlpha().toColourspace('srgb').raw().toBuffer();
}

export function exposureField(noon, scene) {
  const samples = [];
  for (let y = 0; y < meter.height; y++) {
    for (let x = 0; x < meter.width; x++) {
      const i = 3 * (y * meter.width + x);
      const brightness = .2126 * noon[i] + .7152 * noon[i + 1] + .0722 * noon[i + 2];
      // Unlit glass and deep contact shadows have no usable light measurement.
      if (brightness < 35) continue;
      samples.push({
        x: (x + .5) / meter.width, y: (y + .5) / meter.height,
        gain: [0, 1, 2].map(c => Math.log((scene[i + c] + 3) / (noon[i + c] + 3))),
      });
    }
  }

  const field = new Float32Array(grid.width * grid.height * 3);
  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      const x = col / (grid.width - 1), y = row / (grid.height - 1);
      const sum = [0, 0, 0];
      let weights = 0;
      for (const sample of samples) {
        const dx = (x - sample.x) / .046, dy = (y - sample.y) / .08;
        const weight = Math.exp(-.5 * (dx * dx + dy * dy));
        weights += weight;
        for (let c = 0; c < 3; c++) sum[c] += weight * sample.gain[c];
      }
      for (let c = 0; c < 3; c++) field[3 * (row * grid.width + col) + c] = Math.exp(sum[c] / weights);
    }
  }
  return field;
}

function axisSample(position, nodes) {
  const at = Math.max(0, Math.min(1, position)) * (nodes - 1);
  const index = Math.min(Math.floor(at), nodes - 2);
  return { index, fraction: at - index };
}

const referenceWidth = 1672, referenceHeight = 941;
const clamp = value => Math.max(0, Math.min(1, value));
const reflector = { left: 227, top: 329, width: 166, height: 59 };

export async function meterReflector(path) {
  return sharp(path).extract(reflector).blur(.7).removeAlpha().toColourspace('srgb').raw().toBuffer();
}

function practicalLamp(result, width, height, litReflector) {
  // Register the photographed light inside the new lamp. Its original metal
  // trim is excluded and the photographed rim of the new shade stays sharp.
  for (let y = Math.floor(342 * height / referenceHeight); y < 414 * height / referenceHeight; y++) {
    const py = (y + .5) * referenceHeight / height;
    for (let x = Math.floor(267 * width / referenceWidth); x < 462 * width / referenceWidth; x++) {
      const px = (x + .5) * referenceWidth / width;
      const dx = (px - 364.5) / 95.0;
      const dy = (py - (377.6 - .308 * (px - 364.5))) / 17.75;
      const opening = clamp((1 - dx * dx - dy * dy) * 13);
      if (!opening) continue;
      const sx = 309.5 + dx * 72.0;
      const sy = 358.4 - .27 * (sx - 309.5) + dy * 9.75;
      const i = 3 * ((Math.floor(sy) - reflector.top) * reflector.width + Math.floor(sx) - reflector.left);
      const fx = sx - Math.floor(sx), fy = sy - Math.floor(sy);
      const pixel = 3 * (y * width + x);
      for (let c = 0; c < 3; c++) {
        const top = i + c, bottom = top + 3 * reflector.width;
        const a = litReflector[top] + fx * (litReflector[top + 3] - litReflector[top]);
        const b = litReflector[bottom] + fx * (litReflector[bottom + 3] - litReflector[bottom]);
        const light = film[Math.round(a + fy * (b - a))];
        result[pixel + c] = Math.round(result[pixel + c] + opening * .96 * (light - result[pixel + c]));
      }
    }
  }
}

function duskBlinds(result, width, height) {
  for (let y = Math.floor(200 * height / referenceHeight); y < 491 * height / referenceHeight; y++) {
    const py = (y + .5) * referenceHeight / height;
    for (let x = Math.floor(1068 * width / referenceWidth); x < 1520 * width / referenceWidth; x++) {
      const px = (x + .5) * referenceWidth / width;
      const falloff = clamp((px - 1068) / 120) * clamp((1520 - px) / 42)
        * clamp((py - 200) / 48) * clamp((491 - py) / 50);
      const projected = py + .285 * (px - 1295);
      let light = 0;
      for (const centre of [306, 364, 422]) light += Math.exp(-.5 * ((projected - centre) / 10) ** 2);
      const pixel = 3 * (y * width + x);
      for (let c = 0; c < 3; c++) {
        result[pixel + c] = Math.min(255, Math.round(result[pixel + c] + [22, 12, 5][c] * light * falloff));
      }
    }
  }
}

// Preserve midtone contrast in the lens while gently rounding off the ends
// of the daylight negative. The table also rolls off overexposed practicals.
const film = Uint8Array.from({ length: 1024 }, (_, value) => Math.round(
  value <= 241 ? value + 4 * Math.exp(-value / 13) : 241 + 10 * (1 - Math.exp((241 - value) / 10)),
));

export function expose(photo, width, height, field, scene, litReflector) {
  const result = Buffer.allocUnsafe(photo.length);
  const columns = Array.from({ length: width }, (_, x) => axisSample((x + .5) / width, grid.width));
  const rowGains = new Float32Array(grid.width * 3);
  for (let y = 0; y < height; y++) {
    const row = axisSample((y + .5) / height, grid.height);
    for (let i = 0; i < rowGains.length; i++) {
      const top = row.index * rowGains.length + i;
      rowGains[i] = field[top] + row.fraction * (field[top + rowGains.length] - field[top]);
    }
    for (let x = 0; x < width; x++) {
      const { index, fraction } = columns[x];
      const pixel = 3 * (y * width + x);
      for (let c = 0; c < 3; c++) {
        const i = 3 * index + c;
        const gain = rowGains[i] + fraction * (rowGains[i + 3] - rowGains[i]);
        result[pixel + c] = film[Math.min(film.length - 1, Math.round(photo[pixel + c] * gain))];
      }
    }
  }
  if (litReflector) practicalLamp(result, width, height, litReflector);
  if (scene === 'dusk') duskBlinds(result, width, height);
  return result;
}
