import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $powered, $preferences, exitFullscreen, initializeOs, setPower, setPreference } from '../../stores/osStore';
import PixelIcon from './PixelIcon';
import TubeOptics from './TubeOptics';

export default function CRTScreen() {
  const powered = useStore($powered);
  const wake = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const optics = useRef<HTMLDivElement>(null);

  useEffect(initializeOs, []);
  useEffect(() => {
    function updateDesktop() {
      const stage = document.querySelector<HTMLElement>('.screen-stage');
      if (stage) stage.inert = !powered;
    }
    if (!powered && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
    updateDesktop();
    document.addEventListener('astro:after-swap', updateDesktop);
    if (powered) {
      const target = returnFocus.current;
      if (target?.isConnected && target.getClientRects().length) target.focus({ preventScroll: true });
      else if (target) document.querySelector<HTMLButtonElement>('.taskbar-menu-button')?.focus({ preventScroll: true });
      returnFocus.current = null;
    } else {
      wake.current?.focus({ preventScroll: true });
    }

    function wakeOnKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) return;
      event.preventDefault();
      setPower(true);
    }

    if (!powered) window.addEventListener('keydown', wakeOnKey, { capture: true });
    return () => {
      document.removeEventListener('astro:after-swap', updateDesktop);
      window.removeEventListener('keydown', wakeOnKey, { capture: true });
    };
  }, [powered]);

  return (
    <>
      <div className="crt-optics" ref={optics} aria-hidden="true">
        <TubeOptics glass={optics} />
        <span className="crt-contour" />
        <span className="crt-bloom" />
        <span className="crt-vignette" />
        <span className="crt-fl1" />
        <span className="crt-fl2" />
      </div>
      <div className="crt-blank" aria-hidden="true" />
      <div className="crt-signal" aria-hidden="true" />
      <div className="crt-start-glow" aria-hidden="true" />
      <div className="crt-beam" aria-hidden="true" />
      <div className="crt-afterglow" aria-hidden="true" />
      <span className="crt-glass" aria-hidden="true" />
      <div className="crt-off-screen" aria-hidden={powered} inert={powered}>
        <button ref={wake} onClick={() => setPower(true)} aria-label="Turn screen on">
          <span>Press any key or the power button</span>
        </button>
      </div>
    </>
  );
}

export function CRTScreenControls() {
  const { zoom } = useStore($preferences, { ssr: 'initial' });
  const powered = useStore($powered);
  const switchLocation = useRef<HTMLSpanElement>(null);
  const [onPhotograph, setOnPhotograph] = useState(true);

  useEffect(initializeOs, []);
  useEffect(() => {
    const location = switchLocation.current;
    if (!location) return;
    // The switch can leave the frame at close camera distance on a wide,
    // shallow viewport. Observe its real position throughout the zoom.
    const observer = new IntersectionObserver(([entry]) => {
      setOnPhotograph(entry.isIntersecting && entry.intersectionRatio >= .98);
    }, { threshold: [0, .98, 1] });
    observer.observe(location);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function cameraShortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], dialog')) return;
      const inFullscreen = $preferences.get().zoom === 'fullscreen';
      const inRoomView = window.matchMedia('(min-width: 1000px) and (min-aspect-ratio: 6/5)').matches;
      if (!inRoomView && !inFullscreen) return;
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        if (inFullscreen) exitFullscreen();
        else setPreference('zoom', 'fullscreen');
        return;
      }
      if (!inRoomView) return;
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setPreference('zoom', 'close');
      } else if (event.key === '-') {
        event.preventDefault();
        if (inFullscreen) exitFullscreen();
        else setPreference('zoom', 'room');
      }
    }
    window.addEventListener('keydown', cameraShortcut);
    return () => window.removeEventListener('keydown', cameraShortcut);
  }, []);

  const isFullscreen = zoom === 'fullscreen';
  const isClose = zoom === 'close';

  return (
    <>
      <span className="power-location" ref={switchLocation} aria-hidden="true" />
      <button
        className="bezel-power"
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        data-photo-switch={onPhotograph || undefined}
        title={powered ? 'Turn screen off' : 'Turn screen on'}
        onClick={() => setPower(!powered)}
      >
        <span className="hardware-led" aria-hidden="true" />
      </button>
      <div className="camera" role="group" aria-label="Monitor controls" data-view={zoom}>
        {!isFullscreen && (
          <button
            className="camera-zoom"
            type="button"
            title={isClose ? 'Zoom out (−)' : 'Zoom in (+)'}
            aria-label={isClose ? 'Zoom out' : 'Zoom in'}
            onClick={() => setPreference('zoom', isClose ? 'room' : 'close')}
          >
            <PixelIcon name={isClose ? 'zoomOut' : 'zoomIn'} size={20} />
          </button>
        )}
        <button
          className="camera-fullscreen"
          type="button"
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-pressed={isFullscreen}
          onClick={() => (isFullscreen ? exitFullscreen() : setPreference('zoom', 'fullscreen'))}
        >
          <PixelIcon name={isFullscreen ? 'exitFullscreen' : 'fullscreen'} size={20} />
        </button>
        {!isFullscreen && (
          <button
            className="hardware-power"
            type="button"
            title={powered ? 'Turn screen off' : 'Turn screen on'}
            aria-label={powered ? 'Turn screen off' : 'Turn screen on'}
            onClick={() => setPower(!powered)}
          >
            <PixelIcon name="power" size={20} />
          </button>
        )}
      </div>
    </>
  );
}
