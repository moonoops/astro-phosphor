// Coordinates are measured in the 1672 × 941 composition, independent of the image density.
export const aperture = { x: 632, y: 290, width: 380, height: 285 };
export const indicator = { x: 635, y: 604.6 };
export const virtualScreen = { width: 1120, height: 1120 * 1087 / 1545 };
export const overscan = 5;
export const rasterInset = 4.2;

// Local coordinates trace the glass side of the moulding. The four long arcs
// share their tangents with the short rounded returns at each corner.
export const glassPath = [
  'M 9 6.95',
  'Q 190 -5.85 371 6.95',
  'C 374.4 7.19 377.33 9.72 377.45 13',
  'Q 382.35 144.5 377.45 276',
  'C 377.33 279.38 374.54 282.82 371 282.9',
  'Q 190 286.8 9 282.9',
  'C 5.78 282.83 3.4 279.65 3.25 276',
  'Q -2.65 144.5 3.25 13',
  'C 3.4 9.65 5.84 7.17 9 6.95 Z',
].join(' ');

// The phosphor coating ends inside the contact shadow. Its slightly longer
// corner returns leave a dark shoulder visible where the glass meets the case.
export const rasterPath = [
  'M 15 10.7',
  'Q 190 -1.3 365 10.7',
  'C 370 11.04 373.05 14.3 373.25 19.4',
  'Q 377.8 144.5 373.25 269.6',
  'C 373.07 274.6 370 278.39 365 278.5',
  'Q 190 282.7 15 278.5',
  'C 10.6 278.39 7.64 274.6 7.45 269.6',
  'Q 1.95 144.5 7.45 19.4',
  'C 7.66 14.35 10.6 11 15 10.7 Z',
].join(' ');

export function rasterMaskTransform(full: number) {
  const bleed = overscan * (1 - full);
  const expand = 1 + .12 * full;
  const sx = expand / (aperture.width + 2 * bleed);
  const sy = expand / (aperture.height + 2 * bleed);
  return `matrix(${sx} 0 0 ${sy} ${.5 - aperture.width * sx / 2} ${.5 - aperture.height * sy / 2})`;
}
