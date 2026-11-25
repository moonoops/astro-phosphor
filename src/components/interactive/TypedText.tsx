import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $entryBooting, initializeOs, introKey } from '../../stores/osStore';

export default function TypedText({ text }: { text: string }) {
  const [shown, setShown] = useState<number | null>(null);
  const entryBooting = useStore($entryBooting);

  useEffect(initializeOs, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro !== 'pending' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (entryBooting || root.dataset.entry === 'booting') return;

    const started = performance.now();
    let frame = 0;

    const reveal = (now: number) => {
      const count = Math.min(text.length, Math.floor((now - started) / 23));
      setShown(count);
      if (count < text.length) {
        frame = requestAnimationFrame(reveal);
      } else {
        delete root.dataset.intro;
        try {
          sessionStorage.setItem(introKey, 'played');
        } catch {
          // The intro remains complete for this navigation session.
        }
      }
    };

    frame = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(frame);
  }, [text, entryBooting]);

  const count = shown ?? text.length;
  return (
    <p className="typed-text lead" data-intro-ready={shown !== null}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        <span className="typed-visible">{text.slice(0, count)}</span>
        <span className="typed-marker" />
        <span className="typed-h">{text.slice(count)}</span>
      </span>
    </p>
  );
}
