import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useStore } from '@nanostores/react';
import pageCopy from '../../data/page-copy.json';
import { applications, type Section } from '../../navigation';
import { getOsDefinition, osList } from '../../os/registry';
import { SITE_NAME, withBase } from '../../site';
import { $preferences, initializeOs, setOs, setPreference } from '../../stores/osStore';
import PixelIcon from './PixelIcon';
import StartMenu from './StartMenu';

type Props = {
  section: Section;
  activeLabel?: string;
};

function formatShortClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

function resolveSectionLabel(section: Section): string {
  if (section === 'desktop') return pageCopy.home.ticker;
  const app = applications.find((item) => item.section === section);
  if (app) return app.label;
  switch (section) {
    case 'system':
      return pageCopy.system.title;
    case 'contact':
      return pageCopy.contact.title;
    case 'games':
      return pageCopy.games.title;
    case 'mota':
      return pageCopy.mota.title;
    case 'minesweeper':
      return pageCopy.minesweeper.title;
    case 'tetris':
      return pageCopy.tetris.title;
    case 'snake':
      return pageCopy.snake.title;
    case 'game2048':
      return pageCopy.game2048.title;
    case 'error':
      return pageCopy.error.windowTitle;
    default:
      return SITE_NAME;
  }
}

export default function OsTopBar({ section, activeLabel }: Props) {
  const { os, soundMuted } = useStore($preferences, { ssr: 'initial' });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [soundMessage, setSoundMessage] = useState('');
  const [clock, setClock] = useState<{ label: string; iso: string }>({ label: '--:--', iso: '' });
  const switcherRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(initializeOs, []);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
  }, []);

  const showSoundToast = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setSoundMessage(text);
    toastTimer.current = setTimeout(() => setSoundMessage(''), 2500);
  }, []);

  useEffect(() => {
    const update = () => {
      const current = new Date();
      setClock({ label: formatShortClock(current), iso: current.toISOString() });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSwap = () => setSwitcherOpen(false);
    document.addEventListener('astro:before-swap', handleSwap);
    return () => document.removeEventListener('astro:before-swap', handleSwap);
  }, []);

  const activeOs = getOsDefinition(os);
  const isTopOnly = activeOs.hasBottomBar === false;

  useEffect(() => {
    if (!isTopOnly) setSwitcherOpen(false);
  }, [isTopOnly]);

  useEffect(() => {
    if (!switcherOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !switcherRef.current?.contains(event.target)) {
        setSwitcherOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return;
      event.preventDefault();
      setSwitcherOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [switcherOpen]);

  const sectionLabel = resolveSectionLabel(section);
  const pathText = activeLabel ? `${sectionLabel} / ${activeLabel}` : sectionLabel;

  function toggleSound() {
    const nextMuted = !soundMuted;
    setPreference('soundMuted', nextMuted);
    showSoundToast(nextMuted ? 'Sound muted.' : 'Sound on.');
  }

  return (
    <header
      className="os-topbar"
      aria-label="System menu bar"
      data-os-topbar={os}
      inert={section === 'error' ? true : undefined}
    >
      <div className="os-topbar-left">
        <a href={withBase('/')} className="os-topbar-brand">
          <span className="os-topbar-mark" aria-hidden="true" />
          <span className="os-topbar-site">{SITE_NAME}</span>
        </a>
        {isTopOnly && <StartMenu section={section} placement="top" />}
        <nav className="os-topbar-links" aria-label="Quick navigation">
          <a href={withBase('/work')} data-section-link="work" aria-current={section === 'work' ? 'page' : undefined}>Work</a>
          <a href={withBase('/journal')} data-section-link="journal" aria-current={section === 'journal' ? 'page' : undefined}>Journal</a>
          <a href={withBase('/about')} data-section-link="about" aria-current={section === 'about' ? 'page' : undefined}>About</a>
          <a href={withBase('/contact')} data-section-link="contact" aria-current={section === 'contact' ? 'page' : undefined}>Contact</a>
          <a href={withBase('/games')} data-section-link="games" aria-current={section === 'games' ? 'page' : undefined}>Games</a>
        </nav>
      </div>

      <div className="os-topbar-center">
        <span className="os-topbar-tab" data-section={section}>
          <span className="os-topbar-path" title={pathText}>
            {pathText}
          </span>
          <span className="os-topbar-tab-ext" aria-hidden="true">.fig</span>
        </span>
      </div>

      <div className="os-topbar-right">
        <span className="os-topbar-status">
          <span className="os-topbar-dot" aria-hidden="true" />
          <span className="os-topbar-status-text">{activeOs.name}</span>
        </span>

        {isTopOnly && (
          <div className="os-topbar-sound-wrap">
            <button
              type="button"
              className="os-topbar-sound"
              aria-label={soundMuted ? 'Enable sound' : 'Mute sound'}
              title={soundMuted ? 'Enable sound' : 'Mute sound'}
              aria-pressed={!soundMuted}
              onClick={toggleSound}
            >
              <PixelIcon name={soundMuted ? 'mute' : 'sound'} size={14} />
            </button>
            <p className="os-topbar-sound-toast" role="status" hidden={!soundMessage}>
              {soundMessage}
            </p>
          </div>
        )}

        {isTopOnly && (
          <div className="os-topbar-switcher" ref={switcherRef}>
            <button
              ref={buttonRef}
              type="button"
              className="os-topbar-os-btn"
              aria-expanded={switcherOpen}
              aria-haspopup="menu"
              aria-controls="os-topbar-menu"
              aria-label={`OS Style: ${activeOs.name}. Switch OS style`}
              onClick={() => setSwitcherOpen((prev) => !prev)}
            >
              <span>OS</span>
              <span aria-hidden="true">▾</span>
            </button>

            <div
              id="os-topbar-menu"
              className="os-topbar-os-menu"
              role="menu"
              aria-label="OS Styles"
              hidden={!switcherOpen}
            >
              <ul>
                {osList.map((candidate) => {
                  const isCurrent = candidate.id === os;
                  return (
                    <li key={candidate.id} role="none">
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={isCurrent}
                        className="os-topbar-os-option"
                        data-os-option={candidate.id}
                        onClick={() => {
                          setOs(candidate.id);
                          setSwitcherOpen(false);
                        }}
                      >
                        <span
                          className="start-menu-os-swatch"
                          style={{ '--os-swatch': candidate.themes[0]?.swatch } as CSSProperties}
                          aria-hidden="true"
                        />
                        <span className="start-menu-item-label">{candidate.name}</span>
                        {isCurrent && <span className="start-menu-active" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {isTopOnly && (
          <time
            className="os-topbar-clock"
            dateTime={clock.iso || undefined}
            aria-label={`Local time ${clock.label}`}
          >
            {clock.label}
          </time>
        )}
      </div>
    </header>
  );
}
