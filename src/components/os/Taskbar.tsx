import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useStore } from '@nanostores/react';
import { applications, type Section } from '../../navigation';
import pageCopy from '../../data/page-copy.json';
import { getOsDefinition, osList } from '../../os/registry';
import { $preferences, initializeOs, setOs } from '../../stores/osStore';
import ButtonBase from '../ui/ButtonBase';
import PixelIcon from './PixelIcon';
import StartMenu from './StartMenu';
import { bringWindowForward } from './Window';

type Props = { section: Section; activeLabel?: string };

export default function Taskbar({ section, activeLabel }: Props) {
  const { os } = useStore($preferences, { ssr: 'initial' });
  const [osMenuOpen, setOsMenuOpen] = useState(false);
  const osSwitcherRef = useRef<HTMLDivElement>(null);
  const activeOs = getOsDefinition(os);
  const hasBottomBar = activeOs.hasBottomBar !== false;

  useEffect(initializeOs, []);

  useEffect(() => {
    if (!hasBottomBar) setOsMenuOpen(false);
  }, [hasBottomBar]);

  useEffect(() => {
    const handleSwap = () => setOsMenuOpen(false);
    document.addEventListener('astro:before-swap', handleSwap);
    return () => document.removeEventListener('astro:before-swap', handleSwap);
  }, []);

  useEffect(() => {
    if (!osMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !osSwitcherRef.current?.contains(event.target)) {
        setOsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return;
      event.preventDefault();
      setOsMenuOpen(false);
      osSwitcherRef.current?.querySelector<HTMLButtonElement>('.taskbar-os-trigger')?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [osMenuOpen]);

  const current = applications.find(application => application.section === section);
  const label =
    current?.label ??
    (section === 'mota'
      ? pageCopy.mota.title
      : section === 'minesweeper'
        ? pageCopy.minesweeper.title
        : section === 'tetris'
          ? pageCopy.tetris.title
          : section === 'snake'
            ? pageCopy.snake.title
            : section === 'game2048'
              ? pageCopy.game2048.title
              : '');

  function focusWindow(child: boolean) {
    const panel = document.querySelector<HTMLElement>(child ? '.os-window--child' : '.os-window--standard');
    if (!panel) return;
    bringWindowForward(panel);
    requestAnimationFrame(() => panel.querySelector<HTMLElement>('.window-scroll')?.focus({ preventScroll: true }));
  }

  if (!hasBottomBar) {
    return null;
  }

  return (
    <div className="taskbar-start">
      <StartMenu section={section} placement="bottom" />
      <nav className="taskbar-launch" aria-label="Quick launch">
        {applications.map(application => (
          <ButtonBase
            key={application.href}
            href={application.href}
            variant="icon"
            className="taskbar-key"
            aria-label={application.label}
            aria-current={section === application.section && !activeLabel ? 'page' : undefined}
          >
            <PixelIcon name={application.icon} size={22} />
            <span className="taskbar-tooltip" aria-hidden="true">{application.label}</span>
          </ButtonBase>
        ))}
      </nav>
      {label && (
        <div className="taskbar-tabs" aria-label="Open windows">
          {activeLabel && (
            <button className="taskbar-tab taskbar-tab--parent" type="button" onClick={() => focusWindow(false)}>{label}</button>
          )}
          <button className="taskbar-tab taskbar-tab--front" type="button" onClick={() => focusWindow(!!activeLabel)} title={activeLabel || label}>
            <span>{activeLabel || label}</span>
          </button>
        </div>
      )}
      {section === 'desktop' ? (
        <p className="taskbar-ticker">{pageCopy.home.ticker}</p>
      ) : null}
      <div className="taskbar-os-switcher" ref={osSwitcherRef}>
        <ButtonBase
          variant="icon"
          className="taskbar-key taskbar-os-trigger"
          aria-label={`OS Style: ${activeOs.name}. Switch OS style`}
          aria-expanded={osMenuOpen}
          aria-haspopup="menu"
          aria-controls="taskbar-os-menu"
          title={`OS Style: ${activeOs.name}`}
          onClick={() => setOsMenuOpen(prev => !prev)}
        >
          <PixelIcon name="desktop" size={20} />
          <span className="taskbar-tooltip" aria-hidden="true">OS: {activeOs.name}</span>
        </ButtonBase>
        <div
          id="taskbar-os-menu"
          className="taskbar-os-menu"
          role="menu"
          aria-label="OS Styles"
          hidden={!osMenuOpen}
        >
          <p className="start-menu-section-heading">OS Style</p>
          <ul className="start-menu-list">
            {osList.map(candidate => {
              const isCurrent = candidate.id === os;
              return (
                <li key={candidate.id} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isCurrent}
                    className="start-menu-item start-menu-os-item"
                    data-os-option={candidate.id}
                    onClick={() => {
                      setOs(candidate.id);
                      setOsMenuOpen(false);
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
    </div>
  );
}
