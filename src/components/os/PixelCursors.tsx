import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { getOsDefinition, type OsCursorStyle } from '../../os/registry';
import { $preferences } from '../../stores/osStore';

function cursor(
  width: number,
  height: number,
  viewBox: string,
  x: number,
  y: number,
  paths: string,
  crisp = true,
) {
  const rendering = crisp ? ' shape-rendering="crispEdges"' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"${rendering}>${paths}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}`;
}

function buildCursorSet(
  style: OsCursorStyle,
  colors: { fill: string; stroke: string; hi: string; side: string },
) {
  const { fill, stroke, hi, side } = colors;

  if (style === 'soft-pointer') {
    // Rainbow OS — macOS / Figma studio smooth vector cursors (white fill, crisp black stroke, CMY accent cuff)
    const arrow = cursor(
      24,
      28,
      '0 0 24 28',
      3,
      2,
      [
        `<path fill="${side}" opacity="0.55" d="M4.6 3.6L18.4 16.6L12.1 16.9L15.3 24.0L12.7 25.2L9.4 18.0L4.6 22.1Z"/>`,
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" d="M3 2L16.8 15.0L10.5 15.3L13.7 22.4L11.1 23.6L7.8 16.4L3 20.5Z"/>`,
      ].join(''),
      false,
    );
    const pointer = cursor(
      28,
      28,
      '0 0 28 28',
      10,
      2,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M8.8 15.2V4.2C8.8 2.8 9.5 2.0 10.5 2.0C11.5 2.0 12.2 2.8 12.2 4.2V10.6C12.2 9.4 13.0 8.8 13.9 8.8C14.8 8.8 15.5 9.4 15.5 10.6V11.4C15.5 10.1 16.3 9.5 17.1 9.5C18.0 9.5 18.7 10.2 18.7 11.4V12.3C18.7 11.2 19.4 10.7 20.2 10.7C21.0 10.7 21.6 11.4 21.6 12.6V16.4C21.6 19.8 19.8 21.8 18.4 22.8H10.0C8.4 21.6 6.2 19.2 4.1 15.8C3.4 14.7 3.7 13.3 4.8 12.8C5.8 12.4 7.0 12.9 7.8 14.0Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.45" stroke-linecap="round" d="M12.2 10.6V13.9M15.5 11.4V14.3M18.7 12.3V14.8"/>`,
        `<rect x="9.8" y="22.4" width="8.8" height="3.8" rx="1.4" fill="${side}" stroke="${stroke}" stroke-width="1.6"/>`,
      ].join(''),
      false,
    );
    const text = cursor(
      18,
      28,
      '0 0 18 28',
      9,
      14,
      [
        `<path fill="none" stroke="${fill}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" d="M5 3.5C7 3.5 8.4 4.2 9 5.6C9.6 4.2 11 3.5 13 3.5M5 24.5C7 24.5 8.4 23.8 9 22.4C9.6 23.8 11 24.5 13 24.5M9 5.2V22.8"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M5 3.5C7 3.5 8.4 4.2 9 5.6C9.6 4.2 11 3.5 13 3.5M5 24.5C7 24.5 8.4 23.8 9 22.4C9.6 23.8 11 24.5 13 24.5M9 5.2V22.8"/>`,
      ].join(''),
      false,
    );
    const grab = cursor(
      28,
      28,
      '0 0 28 28',
      14,
      13,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M8.6 15.2V5.6C8.6 4.4 9.3 3.7 10.2 3.7C11.1 3.7 11.8 4.4 11.8 5.6V12.0V4.2C11.8 3.0 12.5 2.3 13.5 2.3C14.5 2.3 15.2 3.0 15.2 4.2V12.0V5.2C15.2 4.0 15.9 3.3 16.8 3.3C17.7 3.3 18.4 4.0 18.4 5.2V12.4V7.9C18.4 6.8 19.1 6.1 19.9 6.1C20.8 6.1 21.4 6.8 21.4 7.9V16.4C21.4 19.8 19.8 21.8 18.2 22.8H10.0C8.4 21.6 6.2 19.2 4.0 15.8C3.3 14.7 3.6 13.3 4.7 12.8C5.7 12.3 6.9 12.9 7.7 14.0Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round" d="M11.8 11.5V13.4M15.2 11.5V13.4M18.4 12.0V13.7"/>`,
        `<rect x="9.8" y="22.4" width="8.6" height="3.8" rx="1.4" fill="${side}" stroke="${stroke}" stroke-width="1.6"/>`,
      ].join(''),
      false,
    );
    const grabbing = cursor(
      28,
      28,
      '0 0 28 28',
      14,
      14,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M8.4 14.4V10.8C8.4 9.5 9.3 8.8 10.3 8.8C11.3 8.8 12.0 9.5 12.0 10.8C12.0 9.3 12.8 8.6 13.8 8.6C14.8 8.6 15.6 9.3 15.6 10.6C15.6 9.6 16.4 9.0 17.3 9.0C18.2 9.0 19.0 9.7 19.0 11.0C19.0 10.3 19.7 9.8 20.5 9.8C21.3 9.8 22.0 10.5 22.0 11.8V16.8C22.0 19.9 20.3 21.8 18.6 22.8H10.0C8.2 21.8 6.4 19.8 5.2 16.8C4.7 15.4 5.3 13.8 6.6 13.6C7.4 13.5 8.0 13.9 8.4 14.4Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.45" stroke-linecap="round" d="M12.0 10.8V15.0M15.6 10.6V15.0M19.0 11.0V15.2M8.4 14.0V16.4"/>`,
        `<rect x="9.8" y="22.4" width="8.8" height="3.8" rx="1.4" fill="${side}" stroke="${stroke}" stroke-width="1.6"/>`,
      ].join(''),
      false,
    );
    return { arrow, pointer, text, grab, grabbing };
  }

  if (style === 'classic-ink') {
    // Coffee OS — 1933 editorial ink-on-paper cursors (ivory paper fill, crisp espresso ink, tailored caramel wrist cuff)
    const arrow = cursor(
      24,
      28,
      '0 0 24 28',
      2,
      2,
      [
        `<path fill="${stroke}" opacity="0.32" d="M3.8 3.8L17.4 15.8L11.2 16.3L14.4 23.6L11.6 24.8L8.4 17.5L3.8 21.6Z"/>`,
        `<path fill="${fill}" d="M2.2 2.2L15.8 14.2L9.6 14.7L12.8 22.0L10.0 23.2L6.8 15.9L2.2 20.0Z"/>`,
        `<path fill="${side}" d="M7.6 17.6L10.4 16.4L12.0 20.2L9.2 21.4Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.55" stroke-linejoin="miter" stroke-miterlimit="3" d="M2.2 2.2L15.8 14.2L9.6 14.7L12.8 22.0L10.0 23.2L6.8 15.9L2.2 20.0Z"/>`,
      ].join(''),
      false,
    );
    const pointer = cursor(
      28,
      28,
      '0 0 28 28',
      10,
      2,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" d="M8.8 15.0V4.0C8.8 2.8 9.4 2.0 10.3 2.0C11.2 2.0 11.9 2.8 11.9 4.0V10.6C11.9 9.5 12.7 8.9 13.6 8.9C14.5 8.9 15.2 9.5 15.2 10.6V11.3C15.2 10.2 16.0 9.6 16.9 9.6C17.8 9.6 18.5 10.3 18.5 11.4V12.2C18.5 11.2 19.2 10.7 20.0 10.7C20.8 10.7 21.4 11.4 21.4 12.5V16.6C21.4 19.6 19.9 21.4 18.5 22.2H9.8C8.2 21.1 6.1 18.8 4.2 15.6C3.6 14.5 3.9 13.2 4.9 12.8C5.9 12.4 7.0 13.0 7.8 14.0Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.35" stroke-linecap="round" d="M11.9 10.6V14.2M15.2 11.3V14.5M18.5 12.2V14.9"/>`,
        `<rect x="9.4" y="22.0" width="9.4" height="4.4" rx="0.8" fill="${side}" stroke="${stroke}" stroke-width="1.55"/>`,
        `<circle cx="16.4" cy="24.2" r="1.0" fill="${hi}"/>`,
      ].join(''),
      false,
    );
    const text = cursor(
      18,
      28,
      '0 0 18 28',
      9,
      14,
      [
        `<path fill="none" stroke="${fill}" stroke-width="4.2" stroke-linecap="square" d="M4.5 3.5H13.5M4.5 24.5H13.5M9 3.5V24.5M6.8 14H11.2"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.65" stroke-linecap="square" d="M4.5 3.5H13.5M4.5 24.5H13.5M9 3.5V24.5M7 14H11"/>`,
      ].join(''),
      false,
    );
    const grab = cursor(
      28,
      28,
      '0 0 28 28',
      14,
      13,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" d="M8.6 15.0V5.6C8.6 4.4 9.3 3.7 10.2 3.7C11.1 3.7 11.8 4.4 11.8 5.6V11.8V4.2C11.8 3.0 12.5 2.3 13.4 2.3C14.3 2.3 15.0 3.0 15.0 4.2V11.8V5.1C15.0 3.9 15.7 3.2 16.6 3.2C17.5 3.2 18.2 3.9 18.2 5.1V12.2V7.8C18.2 6.7 18.9 6.0 19.8 6.0C20.6 6.0 21.3 6.7 21.3 7.8V16.6C21.3 19.6 19.8 21.4 18.4 22.2H9.8C8.2 21.1 6.1 18.8 4.1 15.6C3.5 14.5 3.8 13.2 4.8 12.8C5.8 12.4 6.9 13.0 7.7 14.0Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.35" stroke-linecap="round" d="M11.8 11.2V13.6M15.0 11.2V13.6M18.2 11.8V13.9"/>`,
        `<rect x="9.4" y="22.0" width="9.4" height="4.4" rx="0.8" fill="${side}" stroke="${stroke}" stroke-width="1.55"/>`,
        `<circle cx="16.4" cy="24.2" r="1.0" fill="${hi}"/>`,
      ].join(''),
      false,
    );
    const grabbing = cursor(
      28,
      28,
      '0 0 28 28',
      14,
      14,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" d="M8.4 14.2V10.7C8.4 9.5 9.2 8.8 10.2 8.8C11.2 8.8 11.9 9.5 11.9 10.7C11.9 9.3 12.7 8.6 13.7 8.6C14.7 8.6 15.5 9.3 15.5 10.5C15.5 9.5 16.3 8.9 17.2 8.9C18.1 8.9 18.8 9.6 18.8 10.8C18.8 10.1 19.5 9.6 20.3 9.6C21.1 9.6 21.8 10.3 21.8 11.6V16.8C21.8 19.7 20.2 21.4 18.6 22.2H9.8C8.1 21.2 6.3 19.3 5.2 16.4C4.7 15.1 5.3 13.6 6.6 13.4C7.4 13.3 8.0 13.7 8.4 14.2Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.35" stroke-linecap="round" d="M11.9 10.7V15.1M15.5 10.5V15.1M18.8 10.8V15.3M8.4 13.8V16.4"/>`,
        `<rect x="9.4" y="22.0" width="9.4" height="4.4" rx="0.8" fill="${side}" stroke="${stroke}" stroke-width="1.55"/>`,
        `<circle cx="16.4" cy="24.2" r="1.0" fill="${hi}"/>`,
      ].join(''),
      false,
    );
    return { arrow, pointer, text, grab, grabbing };
  }

  if (style === 'pixel-retro') {
    // Pixel OS — 1-bit Classic Macintosh System 7 bitmap cursors (flat crisp outline, zero 3D bevel)
    const arrow = cursor(
      24,
      32,
      '0 0 12 16',
      0,
      0,
      [
        `<path fill="${stroke}" d="M0 0H1V1H2V2H3V3H4V4H5V5H6V6H7V7H8V8H9V9H10V10H11V11H7V12H3V13H2V14H1V15H0ZM4 11H7V12H8V14H9V16H5V14H4Z"/>`,
        `<path fill="${fill}" d="M1 2H2V3H3V4H4V5H5V6H6V7H7V8H8V9H9V10H6V11H3V12H2V13H1ZM4 11H6V12H7V14H8V15H6V14H5V12H4Z"/>`,
      ].join(''),
    );
    const pointer = cursor(
      32,
      32,
      '0 0 16 16',
      12,
      1,
      [
        `<path fill="${stroke}" d="M5 0H7V1H8V5H10V6H13V7H15V8H16V12H15V13H14V16H3V13H2V12H1V10H0V8H1V7H3V8H4V1H5Z"/>`,
        `<path fill="${fill}" d="M5 1H7V10H5ZM8 6H10V10H8ZM11 7H13V10H11ZM14 8H15V10H14ZM1 8H3V9H4V10H1ZM2 10H15V12H14V13H13V15H4V13H3V12H2Z"/>`,
      ].join(''),
    );
    const text = cursor(
      18,
      32,
      '0 0 9 16',
      9,
      16,
      [
        `<path fill="${fill}" d="M0 0H4V1H5V0H9V3H6V13H9V16H5V15H4V16H0V13H3V3H0Z"/>`,
        `<path fill="${stroke}" d="M1 1H3V2H6V1H8V2H6V3H5V13H6V14H8V15H6V14H3V15H1V14H3V13H4V3H3V2H1Z"/>`,
      ].join(''),
    );
    const grab = cursor(
      32,
      32,
      '0 0 16 16',
      16,
      14,
      [
        `<path fill="${stroke}" d="M7 0H9V1H10V8H6V1H7ZM4 1H6V2H7V8H3V2H4ZM10 1H12V2H13V8H9V2H10ZM13 4H15V5H16V11H12V5H13ZM1 7H3V8H16V11H15V12H14V16H3V12H2V11H1V10H0V8H1Z"/>`,
        `<path fill="${fill}" d="M4 2H6V8H4ZM7 1H9V8H7ZM10 2H12V8H10ZM13 5H15V8H13ZM1 8H3V9H4V10H1ZM4 8H15V11H14V12H13V15H4V12H3V11H2V10H5V9H4Z"/>`,
      ].join(''),
    );
    const grabbing = cursor(
      32,
      32,
      '0 0 16 16',
      16,
      16,
      [
        `<path fill="${stroke}" d="M7 4H9V5H10V10H6V5H7ZM4 5H6V6H7V10H3V6H4ZM10 5H12V6H13V10H9V6H10ZM13 6H15V7H16V11H12V7H13ZM1 7H3V8H16V11H15V12H14V16H3V12H2V11H1V10H0V8H1Z"/>`,
        `<path fill="${fill}" d="M4 6H6V10H4ZM7 5H9V10H7ZM10 6H12V10H10ZM13 7H15V10H13ZM1 8H3V10H1ZM2 10H15V11H14V12H13V15H4V12H3V11H2Z"/>`,
      ].join(''),
    );
    return { arrow, pointer, text, grab, grabbing };
  }

  if (style === 'terminal-mono') {
    // CLI OS — refined minimal dark/light technical terminal cursors with clean anatomical hand silhouettes & accent cuff
    const arrow = cursor(
      22,
      26,
      '0 0 22 26',
      2,
      2,
      [
        `<path fill="${fill}" d="M2 2L16.2 13.6L9.8 14.1L13.0 21.6L10.2 22.8L7.0 15.3L2 19.6Z"/>`,
        `<path fill="${hi}" d="M7.8 17.2L10.6 16.0L12.2 19.8L9.4 21.0Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="miter" stroke-miterlimit="3" d="M2 2L16.2 13.6L9.8 14.1L13.0 21.6L10.2 22.8L7.0 15.3L2 19.6Z"/>`,
      ].join(''),
      false,
    );
    const pointer = cursor(
      26,
      28,
      '0 0 26 28',
      10,
      2,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M8.0 14.8V4.0C8.0 2.9 8.7 2.1 9.6 2.1C10.5 2.1 11.2 2.9 11.2 4.0V10.6C11.2 9.6 12.0 9.0 12.8 9.0C13.7 9.0 14.4 9.6 14.4 10.6V11.3C14.4 10.3 15.2 9.7 16.0 9.7C16.9 9.7 17.6 10.4 17.6 11.4V12.2C17.6 11.3 18.3 10.8 19.1 10.8C19.9 10.8 20.5 11.4 20.5 12.5V16.6C20.5 19.4 19.0 21.2 17.7 22.0H9.3C7.7 20.9 5.6 18.6 3.7 15.5C3.1 14.5 3.4 13.2 4.4 12.8C5.4 12.4 6.4 13.0 7.1 13.9Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.35" stroke-linecap="round" d="M11.2 10.6V14.2M14.4 11.3V14.5M17.6 12.2V14.9"/>`,
        `<rect x="9.0" y="21.9" width="9.0" height="4.0" rx="1.2" fill="${hi}" stroke="${stroke}" stroke-width="1.5"/>`,
      ].join(''),
      false,
    );
    const text = cursor(
      16,
      28,
      '0 0 16 28',
      8,
      14,
      [
        `<path fill="none" stroke="${stroke}" stroke-width="4.2" stroke-linecap="square" d="M3.5 3H12.5M3.5 25H12.5M8 3V25"/>`,
        `<path fill="none" stroke="${hi}" stroke-width="1.7" stroke-linecap="square" d="M3.5 3H12.5M3.5 25H12.5M8 3V25"/>`,
      ].join(''),
      false,
    );
    const grab = cursor(
      26,
      28,
      '0 0 26 28',
      13,
      13,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M7.9 14.8V5.6C7.9 4.5 8.6 3.8 9.4 3.8C10.3 3.8 11.0 4.5 11.0 5.6V11.8V4.2C11.0 3.1 11.7 2.4 12.6 2.4C13.5 2.4 14.2 3.1 14.2 4.2V11.8V5.1C14.2 4.0 14.9 3.3 15.8 3.3C16.7 3.3 17.4 4.0 17.4 5.1V12.1V7.8C17.4 6.7 18.1 6.1 18.9 6.1C19.8 6.1 20.4 6.7 20.4 7.8V16.6C20.4 19.4 18.9 21.2 17.6 22.0H9.3C7.7 20.9 5.6 18.6 3.6 15.5C3.0 14.5 3.3 13.2 4.3 12.8C5.3 12.4 6.3 13.0 7.0 13.9Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.35" stroke-linecap="round" d="M11.0 11.2V13.6M14.2 11.2V13.6M17.4 11.8V13.9"/>`,
        `<rect x="9.0" y="21.9" width="8.8" height="4.0" rx="1.2" fill="${hi}" stroke="${stroke}" stroke-width="1.5"/>`,
      ].join(''),
      false,
    );
    const grabbing = cursor(
      26,
      28,
      '0 0 26 28',
      13,
      14,
      [
        `<path fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M7.7 14.2V10.8C7.7 9.6 8.5 8.9 9.5 8.9C10.5 8.9 11.2 9.6 11.2 10.8C11.2 9.4 12.0 8.7 13.0 8.7C14.0 8.7 14.7 9.4 14.7 10.6C14.7 9.6 15.5 9.0 16.4 9.0C17.3 9.0 18.0 9.7 18.0 10.9C18.0 10.2 18.7 9.7 19.5 9.7C20.3 9.7 20.9 10.4 20.9 11.6V16.7C20.9 19.5 19.3 21.2 17.8 22.0H9.3C7.6 21.0 5.8 19.1 4.7 16.3C4.2 15.0 4.8 13.6 6.0 13.4C6.8 13.3 7.4 13.7 7.7 14.2Z"/>`,
        `<path fill="none" stroke="${stroke}" stroke-width="1.35" stroke-linecap="round" d="M11.2 10.8V15.1M14.7 10.6V15.1M18.0 10.9V15.2M7.7 13.8V16.4"/>`,
        `<rect x="9.0" y="21.9" width="9.0" height="4.0" rx="1.2" fill="${hi}" stroke="${stroke}" stroke-width="1.5"/>`,
      ].join(''),
      false,
    );
    return { arrow, pointer, text, grab, grabbing };
  }

  // Default ('phosphor-bevel') — 100% identical to original Phosphor CRT cursors
  const arrow = cursor(
    22,
    30,
    '0 0 11 15',
    0,
    0,
    `<path fill="${side}" d="M1 1H2L11 10H7L9 14L6 15L4 11L1 14Z"/><path fill="${stroke}" d="M0 0H1L10 9H6L8 13L5 14L3 10L0 13Z"/><path fill="${fill}" d="M1 2L8 8H4L6 13L5 13L3 9L1 11Z"/><path fill="${hi}" d="M1 2L4 5H3L1 3Z"/>`,
  );
  const pointer = cursor(
    30,
    32,
    '0 0 15 16',
    10,
    2,
    `<path fill="${side}" d="M5 1H9V6H13V7H15V12H14V16H6V14H4V11H2V7H5Z"/><path fill="${stroke}" d="M4 0H8V6H12V7H14V12H13V15H5V13H3V11H1V7H4Z"/><path fill="${fill}" d="M5 1H7V8H8V7H11V8H13V11H12V14H6V12H4V10H2V8H4V10H5Z"/><path fill="${hi}" d="M5 1H6V6H5Z"/>`,
  );
  const text = cursor(
    18,
    32,
    '0 0 9 16',
    7,
    14,
    `<path fill="${stroke}" d="M0 0H9V3H6V13H9V16H0V13H3V3H0Z"/><path fill="${fill}" d="M1 1H8V2H5V14H8V15H1V14H4V2H1Z"/>`,
  );
  const grab = cursor(
    32,
    32,
    '0 0 16 16',
    14,
    12,
    [
      `<path fill="${stroke}" d="M6 0H9V1H12V3H15V4H16V9H15V12H14V14H13V16H6V14H5V13H4V12H3V11H2V9H1V8H0V6H3V7H4V6H3V2H6Z"/>`,
      `<path fill="${fill}" d="M7 1H8V7H9V2H11V7H12V4H14V5H15V9H14V11H13V13H12V15H7V13H6V12H5V11H4V10H3V8H2V7H3V8H5V7H4V3H5V6H6V8H7Z"/>`,
      `<path fill="${side}" d="M14 8H15V9H14V11H13V13H12V15H7V14H11V12H12V10H13V9H14Z"/>`,
      `<path fill="${hi}" d="M4 3H5V5H4ZM7 1H8V4H7ZM9 2H10V5H9ZM12 4H13V6H12Z"/>`,
    ].join(''),
  );
  const grabbing = cursor(
    30,
    32,
    '0 0 15 16',
    14,
    12,
    `<path fill="${stroke}" d="M3 3H12V4H14V11H13V14H4V12H2V10H1V6H3Z"/><path fill="${fill}" d="M4 4H6V8H7V4H9V8H10V4H11V5H13V10H12V13H5V11H3V9H2V7H4Z"/><path fill="${hi}" d="M4 4H5V7H4Z"/>`,
  );
  return { arrow, pointer, text, grab, grabbing };
}

export default function PixelCursors() {
  const { os, theme } = useStore($preferences, { ssr: 'initial' });
  const [rules, setRules] = useState('');

  useEffect(() => {
    const sample = document.createElement('span');
    sample.hidden = true;
    document.body.append(sample);

    const resolveColor = (primaryToken: string, fallbackToken: string) => {
      sample.style.color = `var(${primaryToken}, var(${fallbackToken}))`;
      return getComputedStyle(sample).color;
    };

    const fill = resolveColor('--os-cursor-fill', '--lit');
    const stroke = resolveColor('--os-cursor-stroke', '--ground');
    const hi = resolveColor('--os-cursor-hi', '--hi');
    const side = resolveColor('--os-cursor-side', '--side');
    sample.remove();

    const style = getOsDefinition(os).cursorStyle ?? 'phosphor-bevel';
    const { arrow, pointer, text, grab, grabbing } = buildCursorSet(style, { fill, stroke, hi, side });

    setRules(`:root {
      --cursor-arrow: ${arrow}, auto;
      --cursor-hand: ${pointer}, pointer;
      --cursor-text: ${text}, text;
      --cursor-grab: ${grab}, grab;
      --cursor-grabbing: ${grabbing}, grabbing;
    }`);
  }, [os, theme]);

  return <style>{rules}</style>;
}
