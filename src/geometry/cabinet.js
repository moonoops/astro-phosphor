// The outer edge of the plastic casing in the original 1672 × 941 photograph.
/** @type {[number, number][]} */
export const cabinetOutline = [
  [555, 199], [618, 199], [690, 199], [759, 199.25], [829, 199.5], [899, 199.2], [969, 199.3],
  [1038, 199], [1099.5, 199.2], [1102, 200], [1103.8, 203.2], [1104.2, 270], [1104.7, 385],
  [1105.4, 490], [1105.9, 590], [1106, 643.1], [1105, 646.6], [1103, 648.4], [1098.6, 648.8],
  [1017, 649.5], [922, 649.8], [829, 650], [735, 650.2], [642, 650], [555, 649.5], [552.5, 649],
  [550.4, 647.3], [549.6, 644], [550, 584], [550, 491], [550.5, 394], [551.5, 287],
  [551.5, 205], [551.8, 201.8], [553, 200],
];

const columns = [480, 550, 585, 597, 829, 1060, 1070, 1105, 1185];
// The top, aperture mouldings and lower seam have different bows and tapers.
// Each row is measured in the original photograph, before camera zoom.
const bands = [
  { y: 148, crown: 0, bow: 0, tilt: 0, taper: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { y: 198, crown: 4.55, bow: 5.85, tilt: .45, taper: [0, 6.5, 4.8, 4.2, 0, -4.5, -5, -7.3, 0] },
  { y: 237, crown: 1.25, bow: 5.9, tilt: -.45, taper: [0, 5.4, 2.7, 2.8, 0, -2.4, -2.5, -5.8, 0] },
  { y: 246, crown: 1.25, bow: 5.15, tilt: .05, taper: [0, 5.3, 2.5, 2.6, 0, -2.35, -2.4, -5.65, 0] },
  { y: 406, crown: -.2, bow: .2, tilt: .05, taper: [0, 3.25, 1, .25, 0, 1, 1.2, -1.5, 0] },
  { y: 578, crown: -3.05, bow: .95, tilt: -.65, taper: [0, 1.9, -.65, .9, 0, 4.05, 4.1, 1.85, 0] },
  { y: 585, crown: -.8, bow: -1.3, tilt: -1.1, taper: [0, 1.85, -.65, .9, 0, 4, 4.1, 2, 0] },
  { y: 611, crown: -1.6, bow: -.65, tilt: -.30, taper: [0, 1.7, -.5, .85, 0, 3.35, 3.75, 2.5, 0] },
  { y: 650, crown: -.35, bow: -3.05, tilt: -.55, taper: [0, 1.25, -.5, .5, 0, 2.55, 3.1, 2.9, 0] },
  { y: 710, crown: 0, bow: 0, tilt: 0, taper: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
];
const rows = bands.map(band => band.y);
const mix = (a, b, weight) => a + (b - a) * weight;
const ease = (t) => t * t * (3 - 2 * t);

function interval(value, positions) {
  const end = positions.findIndex(position => value < position);
  return [end, (value - positions[end - 1]) / (positions[end] - positions[end - 1])];
}

/** @param {number} x @param {number} y @returns {[number, number]} */
export function project(x, y) {
  if (x <= columns[0] || x >= columns.at(-1) || y <= rows[0] || y >= rows.at(-1)) return [x, y];
  const [column, wx] = interval(x, columns);
  const [row, height] = interval(y, rows);
  const a = bands[row - 1], b = bands[row], wy = ease(height);
  const dx = mix(mix(a.taper[column - 1], a.taper[column], wx), mix(b.taper[column - 1], b.taper[column], wx), wy);
  const u = (x - 829) / 245;
  let dy = mix(a.crown, b.crown, wy) + mix(a.bow, b.bow, wy) * u * u + mix(a.tilt, b.tilt, wy) * u;
  if (x < 550) dy *= ease((x - 480) / 70);
  if (x > 1105) dy *= ease((1185 - x) / 80);
  return [x + dx, y + dy];
}
