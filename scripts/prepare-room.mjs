/**
 * Room Artwork Optimizer for astro-phosphor
 *
 * Usage:
 *   1. Direct 5-plate mode (recommended when generating 5 lighting variants):
 *      Place 5 plates named `morning.{png,jpg,webp}`, `noon.*`, `afternoon.*`,
 *      `dusk.*`, `night.*` in `src/assets/room-originals/` and run:
 *        npm run art:room
 *
 *   2. Single-plate mode (same photo across all 5 slots while prototyping):
 *      npm run art:room -- --single path/to/your-desk.png
 *
 * Outputs optimized responsive WebP pairs into `src/assets/`:
 *   - macintosh-lc-<scene>-desk-details.webp          (full resolution, up to 5016px wide)
 *   - macintosh-lc-<scene>-desk-details-standard.webp (1x desktop, 2508px wide)
 */
import { access, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { roomCoordinateSize } from '../src/geometry/room-crop.js';

const assetsDir = fileURLToPath(new URL('../src/assets/', import.meta.url));
const originalsDir = join(assetsDir, 'room-originals');
const scenes = ['morning', 'noon', 'afternoon', 'dusk', 'night'];
const exts = ['.png', '.webp', '.jpg', '.jpeg'];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveSceneInput(scene, singlePath) {
  if (singlePath) return resolve(singlePath);
  for (const name of [scene, `room-${scene}`, `macintosh-lc-${scene}-desk-details`]) {
    for (const ext of exts) {
      const candidate = join(originalsDir, `${name}${ext}`);
      if (await exists(candidate)) return candidate;
    }
  }
  return null;
}

const args = process.argv.slice(2);
const singleFlagIndex = args.indexOf('--single');
const singlePath = singleFlagIndex >= 0 ? args[singleFlagIndex + 1] : null;
if (singleFlagIndex >= 0 && !singlePath) {
  throw new Error('Expected a file path after --single.');
}

const expectedRatio = roomCoordinateSize.width / roomCoordinateSize.height;
const webpDetail = { quality: 88, smartSubsample: true, effort: 5 };
const webpStandard = { quality: 86, smartSubsample: true, effort: 5 };

let processed = 0;
for (const scene of scenes) {
  const inputPath = await resolveSceneInput(scene, singlePath);
  if (!inputPath) {
    console.warn(`Skipping "${scene}": no input plate found in src/assets/room-originals/`);
    continue;
  }

  const image = sharp(inputPath);
  const meta = await image.metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`Unable to read image dimensions for ${inputPath}`);
  }
  const actualRatio = meta.width / meta.height;
  if (Math.abs(actualRatio - expectedRatio) > 0.03) {
    console.warn(
      `Warning: ${inputPath} aspect ratio (${actualRatio.toFixed(3)}) differs from ` +
      `registered ${roomCoordinateSize.width}:${roomCoordinateSize.height} (${expectedRatio.toFixed(3)}). ` +
      `Update src/geometry/room-crop.js and src/geometry/tube.ts if your plate uses a different aspect ratio.`
    );
  }

  const detailWidth = Math.min(meta.width, 5016);
  const standardWidth = Math.min(meta.width, 2508);

  const outputs = [
    {
      path: join(assetsDir, `macintosh-lc-${scene}-desk-details.webp`),
      buffer: await image.clone().resize({ width: detailWidth, withoutEnlargement: true }).webp(webpDetail).toBuffer(),
    },
    {
      path: join(assetsDir, `macintosh-lc-${scene}-desk-details-standard.webp`),
      buffer: await image.clone().resize({ width: standardWidth, withoutEnlargement: true }).webp(webpStandard).toBuffer(),
    },
  ];

  for (const { path: outPath, buffer } of outputs) {
    const tmp = `${outPath}.${process.pid}.tmp`;
    await writeFile(tmp, buffer);
    await rename(tmp, outPath);
    console.log(`${outPath.slice(assetsDir.length)}  ${(buffer.length / 1024).toFixed(0)} KB`);
  }
  processed++;
}

if (processed === 0) {
  console.error(
    'No room plates processed. Place morning/noon/afternoon/dusk/night plates in src/assets/room-originals/ ' +
    'or run: npm run art:room -- --single path/to/desk.png'
  );
  process.exit(1);
}
