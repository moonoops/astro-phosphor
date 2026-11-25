import { $preferences } from '../stores/osStore';

export type ArcadeCue =
  | 'click'
  | 'flag'
  | 'move'
  | 'rotate'
  | 'drop'
  | 'line'
  | 'tetris'
  | 'eat'
  | 'bonus'
  | 'merge'
  | 'win'
  | 'lose';

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  if (sharedCtx.state === 'suspended') void sharedCtx.resume();
  return sharedCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = 'square',
  endFreq?: number,
) {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq && endFreq !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
  }
  gain.gain.setValueAtTime(gainPeak, now);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

export function playArcadeCue(cue: ArcadeCue) {
  if ($preferences.get().soundMuted || typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    switch (cue) {
      case 'click':
        tone(ctx, 560, 0, 0.032, 0.05, 'square', 420);
        break;
      case 'flag':
        tone(ctx, 740, 0, 0.04, 0.05, 'triangle', 920);
        break;
      case 'move':
        tone(ctx, 290, 0, 0.02, 0.03, 'square');
        break;
      case 'rotate':
        tone(ctx, 520, 0, 0.035, 0.045, 'square', 680);
        break;
      case 'drop':
        tone(ctx, 220, 0, 0.055, 0.07, 'triangle', 95);
        break;
      case 'line':
        tone(ctx, 523.25, 0, 0.07, 0.06, 'square');
        tone(ctx, 659.25, 0.06, 0.09, 0.06, 'square');
        break;
      case 'tetris':
        tone(ctx, 523.25, 0, 0.07, 0.065, 'square');
        tone(ctx, 659.25, 0.065, 0.07, 0.065, 'square');
        tone(ctx, 783.99, 0.13, 0.07, 0.065, 'square');
        tone(ctx, 1046.5, 0.195, 0.14, 0.07, 'square');
        break;
      case 'eat':
        tone(ctx, 580, 0, 0.045, 0.055, 'square', 880);
        break;
      case 'bonus':
        tone(ctx, 660, 0, 0.06, 0.06, 'square');
        tone(ctx, 990, 0.055, 0.09, 0.065, 'square');
        break;
      case 'merge':
        tone(ctx, 440, 0, 0.045, 0.045, 'triangle', 660);
        break;
      case 'win':
        tone(ctx, 523.25, 0, 0.08, 0.06, 'square');
        tone(ctx, 659.25, 0.08, 0.08, 0.06, 'square');
        tone(ctx, 783.99, 0.16, 0.08, 0.06, 'square');
        tone(ctx, 1046.5, 0.24, 0.22, 0.07, 'square');
        break;
      case 'lose':
        tone(ctx, 260, 0, 0.11, 0.075, 'sawtooth', 140);
        tone(ctx, 140, 0.11, 0.22, 0.075, 'sawtooth', 58);
        break;
    }
  } catch {
    // Ignore Web Audio errors on restricted devices.
  }
}

export interface PhosphorPalette {
  lit: string;
  ground: string;
  hi: string;
  side: string;
  lit72: string;
  lit28: string;
  lit10: string;
}

export function readPhosphorPalette(element: HTMLElement | null): PhosphorPalette {
  const fallback: PhosphorPalette = {
    lit: '#ffb648',
    ground: '#020b14',
    hi: '#ffdba4',
    side: '#74582b',
    lit72: 'rgba(255, 182, 72, 0.72)',
    lit28: 'rgba(255, 182, 72, 0.28)',
    lit10: 'rgba(255, 182, 72, 0.1)',
  };
  if (typeof window === 'undefined') return fallback;
  const target = element ?? document.documentElement;
  const styles = getComputedStyle(target);
  const pick = (name: string, fb: string) => styles.getPropertyValue(name).trim() || fb;

  // Canvas 2D cannot always resolve nested color-mix() variables directly in older engines,
  // so resolve computed RGB via a tiny temporary style probe when needed.
  const resolveColor = (cssValue: string, fb: string): string => {
    if (!cssValue) return fb;
    if (!cssValue.includes('color-mix')) return cssValue;
    const probe = document.createElement('span');
    probe.style.color = cssValue;
    probe.style.display = 'none';
    target.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved || fb;
  };

  return {
    lit: resolveColor(pick('--lit', fallback.lit), fallback.lit),
    ground: resolveColor(pick('--ground', fallback.ground), fallback.ground),
    hi: resolveColor(pick('--hi', fallback.hi), fallback.hi),
    side: resolveColor(pick('--side', fallback.side), fallback.side),
    lit72: resolveColor(pick('--lit-72', fallback.lit72), fallback.lit72),
    lit28: resolveColor(pick('--lit-28', fallback.lit28), fallback.lit28),
    lit10: resolveColor(pick('--lit-10', fallback.lit10), fallback.lit10),
  };
}

export function readStoredNumber(key: string, fallback = 0): number {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredNumber(key: string, value: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors in private browsing.
  }
}
