import type { CSSProperties } from 'react';
import { useStore } from '@nanostores/react';
import { getOsDefinition, osList } from '../../os/registry';
import { $preferences, setOs, setPreference } from '../../stores/osStore';
import ButtonBase from '../ui/ButtonBase';

export default function DisplayPreferences() {
  const { os, theme, reading } = useStore($preferences, { ssr: 'initial' });
  const activeOs = getOsDefinition(os);

  return (
    <div className="display-preferences">
      <div className="display-pref-group">
        <p className="display-pref-label">OS Style</p>
        <div className="os-presets" role="group" aria-label="OS styles">
          {osList.map((candidate) => (
            <ButtonBase
              key={candidate.id}
              variant={os === candidate.id ? 'primary' : 'secondary'}
              aria-pressed={os === candidate.id}
              onClick={() => setOs(candidate.id)}
            >
              <span
                className="os-preset-swatch"
                style={{ '--os-swatch': candidate.themes[0]?.swatch } as CSSProperties}
                aria-hidden="true"
              />
              <span>{candidate.name}</span>
            </ButtonBase>
          ))}
        </div>
      </div>

      <div className="display-pref-row">
        {activeOs.themes.length > 1 && (
          <div className="theme-presets" role="group" aria-label={`${activeOs.name} presets`}>
            {activeOs.themes.map((preset) => (
              <ButtonBase
                key={preset.id}
                variant={theme === preset.id ? 'primary' : 'secondary'}
                aria-pressed={theme === preset.id}
                onClick={() => setPreference('theme', preset.id)}
              >
                {preset.label}
              </ButtonBase>
            ))}
          </div>
        )}
        <ButtonBase
          variant={reading ? 'primary' : 'secondary'}
          aria-pressed={reading}
          onClick={() => setPreference('reading', !reading)}
        >
          Reading mode
        </ButtonBase>
      </div>
    </div>
  );
}
