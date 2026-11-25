import { applications, type Section } from '../../navigation';
import pageCopy from '../../data/page-copy.json';
import ButtonBase from '../ui/ButtonBase';
import PixelIcon from './PixelIcon';
import StartMenu from './StartMenu';
import { bringWindowForward } from './Window';

type Props = { section: Section; activeLabel?: string };

export default function Taskbar({ section, activeLabel }: Props) {
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

  return (
    <div className="taskbar-start">
      <StartMenu section={section} />
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
    </div>
  );
}
