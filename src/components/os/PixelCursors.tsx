import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $preferences } from '../../stores/osStore';

function cursor(width: number, height: number, viewBox: string, x: number, y: number, paths: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" shape-rendering="crispEdges">${paths}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}`;
}

export default function PixelCursors() {
  const { theme } = useStore($preferences, { ssr: 'initial' });
  const [rules, setRules] = useState('');

  useEffect(() => {
    const sample = document.createElement('span');
    sample.hidden = true;
    document.body.append(sample);

    const color = (token: string) => {
      sample.style.color = `var(${token})`;
      return getComputedStyle(sample).color;
    };
    const ground = color('--ground');
    const side = color('--side');
    const lit = color('--lit');
    const hi = color('--hi');
    sample.remove();

    const arrow = cursor(22, 30, '0 0 11 15', 0, 0,
      `<path fill="${side}" d="M1 1H2L11 10H7L9 14L6 15L4 11L1 14Z"/><path fill="${ground}" d="M0 0H1L10 9H6L8 13L5 14L3 10L0 13Z"/><path fill="${lit}" d="M1 2L8 8H4L6 13L5 13L3 9L1 11Z"/><path fill="${hi}" d="M1 2L4 5H3L1 3Z"/>`);
    const pointer = cursor(30, 32, '0 0 15 16', 10, 2,
      `<path fill="${side}" d="M5 1H9V6H13V7H15V12H14V16H6V14H4V11H2V7H5Z"/><path fill="${ground}" d="M4 0H8V6H12V7H14V12H13V15H5V13H3V11H1V7H4Z"/><path fill="${lit}" d="M5 1H7V8H8V7H11V8H13V11H12V14H6V12H4V10H2V8H4V10H5Z"/><path fill="${hi}" d="M5 1H6V6H5Z"/>`);
    const text = cursor(18, 32, '0 0 9 16', 7, 14,
      `<path fill="${ground}" d="M0 0H9V3H6V13H9V16H0V13H3V3H0Z"/><path fill="${lit}" d="M1 1H8V2H5V14H8V15H1V14H4V2H1Z"/>`);
    const grab = cursor(32, 32, '0 0 16 16', 14, 12, [
      `<path fill="${ground}" d="M6 0H9V1H12V3H15V4H16V9H15V12H14V14H13V16H6V14H5V13H4V12H3V11H2V9H1V8H0V6H3V7H4V6H3V2H6Z"/>`,
      `<path fill="${lit}" d="M7 1H8V7H9V2H11V7H12V4H14V5H15V9H14V11H13V13H12V15H7V13H6V12H5V11H4V10H3V8H2V7H3V8H5V7H4V3H5V6H6V8H7Z"/>`,
      `<path fill="${side}" d="M14 8H15V9H14V11H13V13H12V15H7V14H11V12H12V10H13V9H14Z"/>`,
      `<path fill="${hi}" d="M4 3H5V5H4ZM7 1H8V4H7ZM9 2H10V5H9ZM12 4H13V6H12Z"/>`,
    ].join(''));
    const grabbing = cursor(30, 32, '0 0 15 16', 14, 12,
      `<path fill="${ground}" d="M3 3H12V4H14V11H13V14H4V12H2V10H1V6H3Z"/><path fill="${lit}" d="M4 4H6V8H7V4H9V8H10V4H11V5H13V10H12V13H5V11H3V9H2V7H4Z"/><path fill="${hi}" d="M4 4H5V7H4Z"/>`);

    setRules(`:root {
      --cursor-arrow: ${arrow}, auto;
      --cursor-hand: ${pointer}, pointer;
      --cursor-text: ${text}, text;
      --cursor-grab: ${grab}, grab;
      --cursor-grabbing: ${grabbing}, grabbing;
    }`);
  }, [theme]);

  return <style>{rules}</style>;
}
