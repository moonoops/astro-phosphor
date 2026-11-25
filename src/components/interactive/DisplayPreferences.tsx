import { useStore } from '@nanostores/react';
import { $preferences, setPreference, themes } from '../../stores/osStore';
import ButtonBase from '../ui/ButtonBase';

export default function DisplayPreferences() {
  const { theme, reading } = useStore($preferences, { ssr: 'initial' });

  return (
    <div className="display-preferences">
      <div className="theme-presets" aria-label="Phosphor presets">
        {themes.map((preset) => (
          <ButtonBase
            key={preset}
            variant={theme === preset ? 'primary' : 'secondary'}
            aria-pressed={theme === preset}
            onClick={() => setPreference('theme', preset)}
          >
            {preset}
          </ButtonBase>
        ))}
      </div>
      <ButtonBase
        variant={reading ? 'primary' : 'secondary'}
        aria-pressed={reading}
        onClick={() => setPreference('reading', !reading)}
      >
        Reading mode
      </ButtonBase>
    </div>
  );
}
