import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useStore } from '@nanostores/react';
import {
  startMenuDirectLinks,
  startMenuExternalLinks,
  startMenuFolders,
  type Section,
  type StartMenuFolder,
} from '../../navigation';
import pageCopy from '../../data/page-copy.json';
import { $preferences, setPower, setPreference, themes } from '../../stores/osStore';
import PixelIcon from './PixelIcon';

type Props = { section: Section };
type FolderId = StartMenuFolder['id'];

const { site } = pageCopy;

export default function StartMenu({ section }: Props) {
  const [open, setOpen] = useState(false);
  const [openFolder, setOpenFolder] = useState<FolderId | null>(null);
  const hoveredFolderRef = useRef<FolderId | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const { theme, reading } = useStore($preferences, { ssr: 'initial' });
  const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1);

  function closeAll() {
    setOpen(false);
    setOpenFolder(null);
    hoveredFolderRef.current = null;
  }

  useEffect(() => {
    const handleSwap = () => closeAll();
    document.addEventListener('astro:before-swap', handleSwap);
    return () => document.removeEventListener('astro:before-swap', handleSwap);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        closeAll();
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return;
      event.preventDefault();
      const active = document.activeElement as HTMLElement | null;
      const inSubmenu = active?.closest<HTMLElement>('.start-submenu');
      if (inSubmenu) {
        const folderId = inSubmenu.dataset.folderId as FolderId | undefined;
        setOpenFolder(null);
        hoveredFolderRef.current = null;
        if (folderId) {
          panel.current
            ?.querySelector<HTMLButtonElement>(`button[data-folder-trigger="${folderId}"]`)
            ?.focus();
        }
        return;
      }
      closeAll();
      trigger.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [open]);

  function isFlyoutLayout() {
    const stage = container.current?.closest<HTMLElement>('.screen-stage');
    if (stage) return stage.clientWidth > 580;
    return window.innerWidth > 580;
  }

  function getTopLevelItems() {
    if (!panel.current) return [];
    return Array.from(
      panel.current.querySelectorAll<HTMLElement>(
        '.start-menu-body > .start-menu-list-scroll .start-menu-top-item:not(:disabled), .start-menu-footer .start-menu-top-item:not(:disabled)',
      ),
    );
  }

  function getSubmenuItems(folderId: FolderId) {
    return Array.from(
      panel.current?.querySelectorAll<HTMLElement>(
        `#start-submenu-${folderId} a[href], #start-submenu-${folderId} button:not(:disabled)`,
      ) ?? [],
    );
  }

  function focusList(items: HTMLElement[], index: number) {
    if (items.length === 0) return;
    const wrapped = (index + items.length) % items.length;
    items[wrapped]?.focus();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const index = event.key === 'ArrowUp' ? -1 : 0;
    if (!open) {
      setOpen(true);
      setOpenFolder(null);
      requestAnimationFrame(() => focusList(getTopLevelItems(), index));
    } else {
      focusList(getTopLevelItems(), index);
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const active = document.activeElement as HTMLElement | null;
    const activeSubmenu = active?.closest<HTMLElement>('.start-submenu');

    if (activeSubmenu) {
      const folderId = activeSubmenu.dataset.folderId as FolderId | undefined;
      if (!folderId) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setOpenFolder(null);
        hoveredFolderRef.current = null;
        panel.current
          ?.querySelector<HTMLButtonElement>(`button[data-folder-trigger="${folderId}"]`)
          ?.focus();
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const subItems = getSubmenuItems(folderId);
      if (subItems.length === 0) return;
      event.preventDefault();
      const idx = subItems.indexOf(active as HTMLElement);
      if (event.key === 'Home') subItems[0]?.focus();
      else if (event.key === 'End') subItems.at(-1)?.focus();
      else if (event.key === 'ArrowDown') focusList(subItems, idx < 0 ? 0 : idx + 1);
      else focusList(subItems, idx <= 0 ? subItems.length - 1 : idx - 1);
      return;
    }

    const folderTrigger = active?.closest<HTMLButtonElement>('button[data-folder-trigger]');
    if (folderTrigger && event.key === 'ArrowRight') {
      const folderId = folderTrigger.dataset.folderTrigger as FolderId;
      event.preventDefault();
      hoveredFolderRef.current = null;
      setOpenFolder(folderId);
      requestAnimationFrame(() => focusList(getSubmenuItems(folderId), 0));
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const topItems = getTopLevelItems();
    if (topItems.length === 0) return;
    event.preventDefault();
    const currentIndex = topItems.indexOf(active as HTMLElement);
    if (event.key === 'Home') topItems[0]?.focus();
    else if (event.key === 'End') topItems.at(-1)?.focus();
    else if (event.key === 'ArrowDown') focusList(topItems, currentIndex < 0 ? 0 : currentIndex + 1);
    else focusList(topItems, currentIndex <= 0 ? topItems.length - 1 : currentIndex - 1);
  }

  function handleFolderPointerEnter(folderId: FolderId, pointerType: string) {
    if (pointerType !== 'mouse' || !isFlyoutLayout()) return;
    hoveredFolderRef.current = folderId;
    setOpenFolder(folderId);
  }

  function handleFolderClick(folderId: FolderId) {
    if (hoveredFolderRef.current === folderId) {
      hoveredFolderRef.current = null;
      setOpenFolder(folderId);
      return;
    }
    hoveredFolderRef.current = null;
    setOpenFolder(previous => (previous === folderId ? null : folderId));
  }

  function handleNonFolderHover(pointerType: string) {
    if (pointerType !== 'mouse' || !isFlyoutLayout()) return;
    if (hoveredFolderRef.current !== null) {
      hoveredFolderRef.current = null;
      setOpenFolder(null);
    }
  }

  function isFolderActive(folderId: FolderId): boolean {
    if (folderId === 'system') return section === 'system';
    if (folderId === 'documents') return section === 'work' || section === 'journal';
    if (folderId === 'games') {
      return (
        section === 'games' ||
        section === 'mota' ||
        section === 'minesweeper' ||
        section === 'tetris' ||
        section === 'snake' ||
        section === 'game2048'
      );
    }
    return false;
  }

  function renderSubmenuContent(folder: StartMenuFolder) {
    if (folder.id === 'system') {
      return (
        <ul className="start-menu-list">
          <li>
            <button
              type="button"
              className="start-menu-item"
              aria-label={`Phosphor theme: ${themeLabel}. Cycle theme`}
              onClick={() =>
                setPreference('theme', themes[(themes.indexOf(theme) + 1) % themes.length])
              }
            >
              <PixelIcon name="theme" size={18} />
              <span className="start-menu-item-label">Phosphor · {themeLabel}</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="start-menu-item"
              aria-pressed={reading}
              onClick={() => setPreference('reading', !reading)}
            >
              <PixelIcon name="read" size={18} />
              <span className="start-menu-item-label">Reading Mode</span>
              <span className="start-menu-state" aria-hidden="true">
                {reading ? 'On' : 'Off'}
              </span>
            </button>
          </li>
          <li>
            <a
              href="/design-system"
              className="start-menu-item"
              aria-current={section === 'system' ? 'page' : undefined}
              onClick={closeAll}
            >
              <PixelIcon name="system" size={18} />
              <span className="start-menu-item-label">Design System</span>
              {section === 'system' && <span className="start-menu-active" aria-hidden="true" />}
            </a>
          </li>
        </ul>
      );
    }

    const items = folder.items ?? [];
    if (items.length === 0) {
      return (
        <ul className="start-menu-list">
          <li>
            <button
              type="button"
              className="start-menu-item start-menu-item--empty"
              disabled
            >
              <PixelIcon name={folder.icon} size={18} />
              <span className="start-menu-item-label">{folder.emptyLabel ?? 'Empty'}</span>
            </button>
          </li>
        </ul>
      );
    }

    return (
      <ul className="start-menu-list">
        {items.map(item => {
          const active = item.section !== undefined && section === item.section;
          return (
            <li key={item.id}>
              <a
                href={item.href}
                className="start-menu-item"
                aria-current={active ? 'page' : undefined}
                onClick={closeAll}
              >
                <PixelIcon name={item.icon} size={18} />
                <span className="start-menu-item-label">{item.label}</span>
                {active && <span className="start-menu-active" aria-hidden="true" />}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div
      className="taskbar-menu"
      ref={container}
      onBlur={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          closeAll();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="taskbar-menu-button"
        aria-expanded={open}
        aria-controls="start-menu-panel"
        aria-haspopup="true"
        onClick={() => {
          if (open) closeAll();
          else setOpen(true);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="taskbar-menu-face">
          <PixelIcon name="menu" size={18} />
          <span>Menu</span>
        </span>
      </button>

      <div
        ref={panel}
        className="start-menu"
        id="start-menu-panel"
        role="region"
        aria-label="Start menu"
        tabIndex={-1}
        hidden={!open}
        onKeyDown={handlePanelKeyDown}
      >
        <div className="start-menu-spine" aria-hidden="true">
          <span className="start-menu-spine-mark" />
          <span className="start-menu-spine-title">{site.name}</span>
        </div>

        <div className="start-menu-body">
          <nav className="start-menu-list-scroll" aria-label="Menu">
            <ul className="start-menu-list">
              {startMenuFolders.map(folder => {
                const isExpanded = openFolder === folder.id;
                const folderActive = isFolderActive(folder.id);
                return (
                  <li
                    key={folder.id}
                    className="start-menu-folder"
                    data-open={isExpanded ? 'true' : undefined}
                    onPointerEnter={event => handleFolderPointerEnter(folder.id, event.pointerType)}
                  >
                    <button
                      type="button"
                      className="start-menu-item start-menu-top-item start-menu-folder-trigger"
                      data-folder-trigger={folder.id}
                      data-folder-active={folderActive ? 'true' : undefined}
                      aria-expanded={isExpanded}
                      aria-haspopup="true"
                      aria-controls={`start-submenu-${folder.id}`}
                      onClick={() => handleFolderClick(folder.id)}
                    >
                      <PixelIcon name={folder.icon} size={18} />
                      <span className="start-menu-item-label">{folder.label}</span>
                      <span className="start-menu-arrow" aria-hidden="true">
                        <PixelIcon name="caretRight" size={16} />
                      </span>
                    </button>

                    <div
                      id={`start-submenu-${folder.id}`}
                      className="start-submenu"
                      data-folder-id={folder.id}
                      role="region"
                      aria-label={folder.label}
                      hidden={!isExpanded}
                    >
                      {renderSubmenuContent(folder)}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="start-menu-group" onPointerEnter={event => handleNonFolderHover(event.pointerType)}>
              <ul className="start-menu-list">
                {startMenuDirectLinks.map(item => {
                  const active = item.section !== undefined && section === item.section;
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        className="start-menu-item start-menu-top-item"
                        aria-current={active ? 'page' : undefined}
                        onClick={closeAll}
                      >
                        <PixelIcon name={item.icon} size={18} />
                        <span className="start-menu-item-label">{item.label}</span>
                        {active && <span className="start-menu-active" aria-hidden="true" />}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {startMenuExternalLinks.length > 0 && (
              <div className="start-menu-group" onPointerEnter={event => handleNonFolderHover(event.pointerType)}>
                <ul className="start-menu-list">
                  {startMenuExternalLinks.map(item => (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        className="start-menu-item start-menu-top-item"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeAll}
                      >
                        <PixelIcon name={item.icon} size={18} />
                        <span className="start-menu-item-label">{item.label}</span>
                        <span className="start-menu-arrow" aria-hidden="true">
                          <PixelIcon name="external" size={13} />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>

          <footer className="start-menu-footer" onPointerEnter={event => handleNonFolderHover(event.pointerType)}>
            <a
              href="/"
              className="start-menu-item start-menu-top-item start-menu-item--utility"
              aria-current={section === 'desktop' ? 'page' : undefined}
              onClick={closeAll}
            >
              <PixelIcon name="desktop" size={18} />
              <span className="start-menu-item-label">{site.desktopLabel}</span>
            </a>
            <button
              type="button"
              className="start-menu-item start-menu-top-item start-menu-item--utility"
              onClick={() => {
                closeAll();
                setPower(false);
              }}
            >
              <PixelIcon name="power" size={18} />
              <span className="start-menu-item-label">Turn Off</span>
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
