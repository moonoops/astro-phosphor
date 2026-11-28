import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { useStore } from '@nanostores/react';
import { pointerThroughGlass } from '../../geometry/signal-lens';
import { withBase } from '../../site';
import { $maximizedWindows, $windowGeometry } from '../../stores/osStore';
import ButtonBase from '../ui/ButtonBase';
import PixelIcon, { type PixelIconName } from './PixelIcon';

type Props = {
  windowId: string;
  title: string;
  icon: PixelIconName;
  path: ReadonlyArray<{ label: string; href?: string }>;
  pathEnd?: ReactNode;
  closeHref: string;
  statusLeft?: string;
  statusRight?: string;
  variant?: 'standard' | 'child' | 'error';
  inactive?: boolean;
  children?: ReactNode;
};

function clampWindowPosition(
  panelW: number,
  stageW: number,
  stageH: number,
  x: number,
  y: number,
) {
  // Keep a draggable strip visible even when the window extends behind the bezel or taskbar.
  const gripWidth = Math.min(120, panelW, stageW);
  return {
    x: Math.min(Math.max(x, gripWidth - panelW), stageW - gripWidth),
    y: Math.min(Math.max(y, 0), Math.max(0, stageH - 80)),
  };
}

function reachablePosition(panel: HTMLElement, stage: HTMLElement, x: number, y: number) {
  const space = panel.closest<HTMLElement>('.desktop-space');
  const topBarOffset = space ? space.offsetTop : 0;
  return clampWindowPosition(panel.offsetWidth, stage.clientWidth, Math.max(0, stage.clientHeight - topBarOffset), x, y);
}

function projectDragPointer(element: Element, x: number, y: number, surfaceRect: DOMRect | null) {
  if (document.documentElement.dataset.osFlatOptics === 'on') {
    return { x, y };
  }
  return pointerThroughGlass(element, x, y, surfaceRect);
}

export function bringWindowForward(panel: HTMLElement | null) {
  if (panel) panel.dispatchEvent(new CustomEvent('desk:focus-window', { bubbles: true }));
}

export default function WindowFrame({
  windowId,
  title,
  path,
  pathEnd,
  closeHref,
  statusLeft = title,
  statusRight,
  variant = 'standard',
  inactive = false,
  children,
}: Props) {
  const frame = useRef<HTMLElement>(null);
  const closeLink = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    grabX: number;
    grabY: number;
    baseX: number;
    baseY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
    rafId: number;
    panelW: number;
    stage: HTMLElement;
    stageLeft: number;
    stageTop: number;
    topBarOffset: number;
    stageW: number;
    stageH: number;
    scaleX: number;
    scaleY: number;
    surfaceRect: DOMRect | null;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(!inactive);
  const positions = useStore($windowGeometry, { keys: [windowId] });
  const maximizedWindows = useStore($maximizedWindows, { keys: [windowId] });
  const position = ready ? positions[windowId] : undefined;
  const maximized = ready && maximizedWindows[windowId] === true;
  const dialog = variant === 'error';

  useEffect(() => {
    setReady(true);
    const space = frame.current?.closest<HTMLElement>('.desktop-space');
    const phone = window.matchMedia('(max-width: 809px)');
    const focus = (event: Event) => setFocused(event.target === frame.current);
    const reset = () => setFocused(!inactive);
    space?.addEventListener('desk:focus-window', focus);
    phone.addEventListener('change', reset);
    return () => {
      space?.removeEventListener('desk:focus-window', focus);
      phone.removeEventListener('change', reset);
    };
  }, [inactive]);

  useEffect(() => {
    const panel = frame.current;
    const stage = panel?.closest<HTMLElement>('.screen-stage');
    if (!panel || !stage || dialog || maximized) return;

    const observer = new ResizeObserver(() => {
      const current = $windowGeometry.get()[windowId];
      if (!current || !panel.offsetWidth || window.innerWidth < 810) return;
      const next = reachablePosition(panel, stage, current.x, current.y);
      if (next.x !== current.x || next.y !== current.y) $windowGeometry.setKey(windowId, next);
    });
    observer.observe(stage);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [dialog, maximized, windowId]);

  useEffect(() => {
    if (!focused) return;
    if (dialog) frame.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      if (document.documentElement.dataset.power === 'off' || document.querySelector('dialog[open]') || document.fullscreenElement) return;
      closeLink.current?.querySelector('a')?.click();
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (drag.current) {
        cancelAnimationFrame(drag.current.rafId);
        const panel = frame.current;
        if (panel) {
          panel.style.transform = '';
          delete panel.dataset.dragging;
        }
        document.documentElement.classList.remove('pc-drag');
      }
    };
  }, [dialog, focused]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary || dialog || window.innerWidth < 810) return;
    const panel = frame.current;
    const stage = panel?.closest<HTMLElement>('.screen-stage');
    if (!panel || !stage) return;
    if (!focused) bringWindowForward(panel);
    if (maximized || (event.target as Element).closest('a, button')) return;
    event.preventDefault();
    const bounds = panel.getBoundingClientRect();
    const stageBounds = stage.getBoundingClientRect();
    const space = panel.closest<HTMLElement>('.desktop-space');
    const topBarOffset = space ? space.offsetTop : 0;
    const surface = stage.closest('.screen-plane')?.querySelector('.crt-optics');
    const surfaceRect = surface ? surface.getBoundingClientRect() : null;
    const pointer = projectDragPointer(panel, event.clientX, event.clientY, surfaceRect);
    const baseX = panel.offsetLeft;
    const baseY = panel.offsetTop;
    // Pointer events use physical screen pixels while window geometry belongs to the virtual desktop.
    drag.current = {
      pointerId: event.pointerId,
      grabX: (pointer.x - bounds.left) * panel.offsetWidth / bounds.width,
      grabY: (pointer.y - bounds.top) * panel.offsetHeight / bounds.height,
      baseX,
      baseY,
      lastX: baseX,
      lastY: baseY,
      moved: false,
      rafId: 0,
      panelW: panel.offsetWidth,
      stage,
      stageLeft: stageBounds.left,
      stageTop: stageBounds.top,
      topBarOffset,
      stageW: stage.clientWidth,
      stageH: Math.max(0, stage.clientHeight - topBarOffset),
      scaleX: stage.clientWidth / stageBounds.width,
      scaleY: stage.clientHeight / stageBounds.height,
      surfaceRect,
    };
    panel.dataset.dragging = 'on';
    event.currentTarget.setPointerCapture(event.pointerId);
    document.documentElement.classList.add('pc-drag');
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    const panel = frame.current;
    if (active?.pointerId !== event.pointerId || !panel) return;

    const pointer = projectDragPointer(active.stage, event.clientX, event.clientY, active.surfaceRect);
    const x = (pointer.x - active.stageLeft) * active.scaleX - active.grabX;
    const y = (pointer.y - active.stageTop) * active.scaleY - active.topBarOffset - active.grabY;
    const next = clampWindowPosition(active.panelW, active.stageW, active.stageH, x, y);
    if (next.x === active.lastX && next.y === active.lastY) return;
    active.lastX = next.x;
    active.lastY = next.y;
    active.moved = true;
    if (!active.rafId) {
      active.rafId = requestAnimationFrame(() => {
        active.rafId = 0;
        const current = frame.current;
        if (!current || drag.current !== active) return;
        current.style.transform = `translate3d(${active.lastX - active.baseX}px, ${active.lastY - active.baseY}px, 0)`;
      });
    }
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (active?.pointerId !== event.pointerId) return;
    cancelAnimationFrame(active.rafId);
    drag.current = null;
    const panel = frame.current;
    if (panel) {
      if (active.moved) {
        panel.style.left = `${active.lastX}px`;
        panel.style.top = `${active.lastY}px`;
      }
      panel.style.transform = '';
      delete panel.dataset.dragging;
    }
    document.documentElement.classList.remove('pc-drag');
    if (active.moved) {
      $windowGeometry.setKey(windowId, { x: active.lastX, y: active.lastY });
    }
  }

  function toggleMaximize() {
    $maximizedWindows.setKey(windowId, !maximized);
  }

  return (
    <section
      ref={frame}
      className={`os-window os-window--${variant}`}
      data-window-id={windowId}
      data-stack-parent={inactive || undefined}
      data-wfocus={focused ? 'on' : 'off'}
      data-wmax={maximized ? 'on' : 'off'}
      style={position && !maximized ? { left: position.x, top: position.y } : undefined}
      aria-labelledby={`window-title-${windowId}`}
      role={dialog ? 'alertdialog' : undefined}
      aria-modal={dialog || undefined}
      tabIndex={dialog ? -1 : undefined}
      onKeyDown={dialog ? (event) => {
        if (event.key !== 'Tab') return;
        const actions = Array.from(frame.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? []);
        const first = actions[0];
        const last = actions.at(-1);
        const currentFocus = document.activeElement;
        if (event.shiftKey && (currentFocus === first || currentFocus === frame.current)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && currentFocus === last) {
          event.preventDefault();
          first?.focus();
        }
      } : undefined}
    >
      <header
        className="window-titlebar"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={stopDrag}
        onDoubleClick={(event) => {
          if (!dialog && window.innerWidth >= 810 && !(event.target as Element).closest('a, button')) toggleMaximize();
        }}
      >
        <span className="window-titlebar-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="window-title" id={`window-title-${windowId}`}>{title}</span>
        <span className="window-titlebar-grip" aria-hidden="true" />
        <div className="window-actions" ref={closeLink} inert={!focused}>
          {!dialog && (
            <ButtonBase
              className="window-maximize"
              variant="icon"
              title={maximized ? 'Restore window' : 'Maximize window'}
              aria-label={maximized ? 'Restore window' : 'Maximize window'}
              onClick={toggleMaximize}
            >
              <PixelIcon name={maximized ? 'restore' : 'maximize'} size={16} />
            </ButtonBase>
          )}
          <ButtonBase href={closeHref} variant="icon" className="window-close" aria-label="Close window" title="Close window">
            <PixelIcon name="close" size={16} />
          </ButtonBase>
        </div>
      </header>
      {path.length > 0 && (
        <nav className="window-path" aria-label="Window navigation" inert={!focused}>
          <ol>
            {path.map(({ label, href }, index) => (
              <li key={`${label}-${index}`}>
                {index > 0 && <span aria-hidden="true" className="window-path-slash">/</span>}
                {href ? <a href={withBase(href)}>{label}</a> : <span aria-current="page">{label}</span>}
              </li>
            ))}
          </ol>
          {pathEnd && <div className="window-path-end">{pathEnd}</div>}
        </nav>
      )}
      <div className="window-scroll" inert={!focused} tabIndex={dialog || !focused ? undefined : 0} aria-label={dialog ? undefined : `${title} content`}>
        {children}
      </div>
      {!dialog && (
        <footer className="window-status" inert={!focused}>
          <span>{statusLeft}</span>
          <span data-window-status role="status">{statusRight}</span>
        </footer>
      )}
      {!focused && (
        <button className="window-activate" type="button" aria-label={`Bring ${title} to front`} onClick={() => bringWindowForward(frame.current)} />
      )}
    </section>
  );
}
