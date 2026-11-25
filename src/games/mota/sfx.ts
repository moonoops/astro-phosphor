import type { SoundCue } from './engine';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'square',
  gainPeak = 0.045,
): void {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(gainPeak, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

export function playMotaSfx(cue: SoundCue, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (cue) {
    case 'step':
      tone(ctx, 180, 0, 0.03, 'triangle', 0.02);
      break;
    case 'item':
      tone(ctx, 523.25, 0, 0.06, 'square', 0.04);
      tone(ctx, 783.99, 0.055, 0.08, 'square', 0.04);
      break;
    case 'gem':
      tone(ctx, 587.33, 0, 0.055, 'square', 0.04);
      tone(ctx, 880, 0.05, 0.055, 'square', 0.04);
      tone(ctx, 1174.66, 0.1, 0.1, 'square', 0.045);
      break;
    case 'potion':
      tone(ctx, 392, 0, 0.06, 'triangle', 0.05);
      tone(ctx, 523.25, 0.05, 0.07, 'triangle', 0.05);
      tone(ctx, 659.25, 0.1, 0.1, 'triangle', 0.05);
      break;
    case 'door':
      tone(ctx, 220, 0, 0.05, 'square', 0.04);
      tone(ctx, 330, 0.05, 0.07, 'square', 0.04);
      break;
    case 'hit':
      tone(ctx, 150, 0, 0.045, 'sawtooth', 0.05);
      tone(ctx, 110, 0.04, 0.055, 'sawtooth', 0.045);
      break;
    case 'stairs':
      tone(ctx, 330, 0, 0.05, 'triangle', 0.04);
      tone(ctx, 440, 0.05, 0.05, 'triangle', 0.04);
      tone(ctx, 554.37, 0.1, 0.07, 'triangle', 0.04);
      break;
    case 'shop':
      tone(ctx, 659.25, 0, 0.05, 'square', 0.04);
      tone(ctx, 987.77, 0.055, 0.09, 'square', 0.045);
      break;
    case 'talk':
      tone(ctx, 440, 0, 0.035, 'square', 0.025);
      break;
    case 'error':
      tone(ctx, 140, 0, 0.07, 'sawtooth', 0.04);
      tone(ctx, 115, 0.065, 0.09, 'sawtooth', 0.04);
      break;
    case 'victory':
      tone(ctx, 523.25, 0, 0.09, 'square', 0.045);
      tone(ctx, 659.25, 0.09, 0.09, 'square', 0.045);
      tone(ctx, 783.99, 0.18, 0.09, 'square', 0.045);
      tone(ctx, 1046.5, 0.28, 0.24, 'square', 0.05);
      break;
  }
}
