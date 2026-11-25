type Point = { x: number; y: number };
type Axis = keyof Point;
type EdgePair = [number, number];

const mapSize = 256;
const edgeBleed = .30;
const pointerFields = new WeakMap<Element, { offsets: Float32Array; unit: number }>();

// SVG filters move the painted pixels but native pointer coordinates still
// address the flat DOM. Read the same inverse grid to keep a held titlebar
// point under the pointer as it travels across the tube.
export function pointerThroughGlass(element: Element, x: number, y: number, cachedRect?: DOMRect | null) {
  const surface = element.closest('.screen-plane')?.querySelector('.crt-optics');
  const field = surface && pointerFields.get(surface);
  if (!surface || !field || document.documentElement.dataset.reading === 'on') return { x, y };
  const rect = cachedRect ?? surface.getBoundingClientRect();
  const station = (fraction: number) => Math.max(0, Math.min(mapSize - 1, fraction * mapSize - .5));
  const px = station((x - rect.left) / rect.width);
  const py = station((y - rect.top) / rect.height);
  const col = Math.min(mapSize - 2, Math.floor(px));
  const row = Math.min(mapSize - 2, Math.floor(py));
  for (let dy = 0; dy <= 1; dy++) {
    for (let dx = 0; dx <= 1; dx++) {
      const weight = (1 - Math.abs(px - col - dx)) * (1 - Math.abs(py - row - dy));
      const i = 2 * ((row + dy) * mapSize + col + dx);
      x += field.offsets[i] * weight * field.unit;
      y += field.offsets[i + 1] * weight * field.unit;
    }
  }
  return { x, y };
}

export function setPointerField(surface: Element, offsets: Float32Array | undefined, unit: number) {
  if (offsets && unit > 0) pointerFields.set(surface, { offsets, unit });
  else pointerFields.delete(surface);
}

// A corrected raster takes the measured bend at the edge of the tube. Farther
// in, its linear and cubic terms leave type and small glyphs nearly upright.
function deflectionWeight(radius: number) {
  return radius * (.25 + .75 * radius * radius);
}

function section(points: Point[], position: number, axis: Axis): EdgePair {
  const across = axis === 'x' ? 'y' : 'x';
  let near = Infinity;
  let far = -Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if ((a[axis] < position) === (b[axis] < position)) continue;
    const weight = (position - a[axis]) / (b[axis] - a[axis]);
    const edge = a[across] + (b[across] - a[across]) * weight;
    near = Math.min(near, edge);
    far = Math.max(far, edge);
  }
  return [near, far];
}

function sampleEdges(points: Point[], start: number, size: number, extent: number, across: number, inset: number, axis: Axis) {
  // Extend the tangent of each long edge. The physical opening clips the
  // tighter corner fillets without pinching the desktop around them.
  const first = extent * .09;
  const last = extent - first;
  const [startNear, startFar] = section(points, first, axis);
  const [nextNear, nextFar] = section(points, first + 1, axis);
  const [endNear, endFar] = section(points, last, axis);
  const [prevNear, prevFar] = section(points, last - 1, axis);
  return Array.from({ length: mapSize }, (_, i) => {
    const coordinate = start + size * (i + .5) / mapSize;
    let edges: EdgePair;
    if (coordinate < first) {
      edges = [
        startNear + (nextNear - startNear) * (coordinate - first),
        startFar + (nextFar - startFar) * (coordinate - first),
      ];
    } else if (coordinate > last) {
      edges = [
        endNear + (endNear - prevNear) * (coordinate - last),
        endFar + (endFar - prevFar) * (coordinate - last),
      ];
    } else {
      edges = section(points, coordinate, axis);
    }
    const near = edges[0] - edgeBleed;
    const far = edges[1] + edgeBleed;
    const half = across / 2 - inset;
    const nearStrength = (inset - near) / deflectionWeight((near - across / 2) / half);
    const farStrength = (across - inset - far) / deflectionWeight((far - across / 2) / half);
    return {
      coordinate,
      weight: deflectionWeight((coordinate - extent / 2) / (extent / 2 - inset)),
      near,
      nearStrength,
      gradient: (farStrength - nearStrength) / (far - near),
    };
  });
}

export function createPhotographedLens(
  profile: SVGPathElement,
  signal: { x: number; y: number; width: number; height: number },
  aperture: { width: number; height: number },
  inset: number,
) {
  const length = profile.getTotalLength();
  if (!length) return;
  const points = Array.from({ length: 1025 }, (_, i) => profile.getPointAtLength(i * length / 1024));
  const columns = sampleEdges(points, signal.x, signal.width, aperture.width, aperture.height, inset, 'x');
  const rows = sampleEdges(points, signal.y, signal.height, aperture.height, aperture.width, inset, 'y');
  const offsets = new Float32Array(mapSize * mapSize * 2);
  let maxOffset = 0;
  for (let row = 0; row < mapSize; row++) {
    for (let column = 0; column < mapSize; column++) {
      const x = columns[column];
      const y = rows[row];
      // An inverse map sends the two sides of each measured meridian back
      // to the source rectangle. Interpolating its strengths over the whole
      // diameter keeps interior grid lines curved and the optical axis fixed.
      const dx = x.weight * (y.nearStrength + (x.coordinate - y.near) * y.gradient);
      const dy = y.weight * (x.nearStrength + (y.coordinate - x.near) * x.gradient);
      const offset = 2 * (row * mapSize + column);
      offsets[offset] = dx;
      offsets[offset + 1] = dy;
      maxOffset = Math.max(maxOffset, Math.abs(dx), Math.abs(dy));
    }
  }

  if (!Number.isFinite(maxOffset)) return;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = mapSize;
  const context = canvas.getContext('2d');
  if (!context) return;
  const image = context.createImageData(mapSize, mapSize);
  const scale = Math.ceil(2 * maxOffset + 1);
  for (let i = 0; i < offsets.length; i += 2) {
    image.data[i * 2] = 128 + offsets[i] * 255 / scale;
    image.data[i * 2 + 1] = 128 + offsets[i + 1] * 255 / scale;
    image.data[i * 2 + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return { image: canvas.toDataURL(), scale, offsets };
}
