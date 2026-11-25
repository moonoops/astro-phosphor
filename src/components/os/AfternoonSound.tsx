import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $preferences, setPreference } from '../../stores/osStore';
import ButtonBase from '../ui/ButtonBase';
import PixelIcon from './PixelIcon';

export default function AfternoonSound() {
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [message, setMessage] = useState('');
  const { soundMuted } = useStore($preferences, { ssr: 'initial' });

  const toast = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setMessage(text);
    toastTimer.current = setTimeout(() => setMessage(''), 2500);
  }, []);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
  }, []);

  function toggle() {
    const nextMuted = !soundMuted;
    setPreference('soundMuted', nextMuted);
    toast(nextMuted ? 'Sound muted.' : 'Sound on.');
  }

  return (
    <div className="speaker-control">
      <ButtonBase
        variant="icon"
        className="taskbar-key"
        aria-label={soundMuted ? 'Enable sound' : 'Mute sound'}
        title={soundMuted ? 'Enable sound' : 'Mute sound'}
        aria-pressed={!soundMuted}
        onClick={toggle}
      >
        <PixelIcon name={soundMuted ? 'mute' : 'sound'} size={20} />
      </ButtonBase>
      <p className="sound-toast" role="status" hidden={!message}>{message}</p>
    </div>
  );
}
