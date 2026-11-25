import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { playArcadeCue, readStoredNumber, writeStoredNumber } from '../../games/arcadeSound';
import ButtonBase from '../ui/ButtonBase';

type Direction = 'up' | 'down' | 'left' | 'right';
type Status = 'playing' | 'won' | 'over';

interface HistoryEntry {
  board: number[];
  score: number;
}

const BEST_KEY = 'astro-phosphor-2048-best';
const MAX_UNDO = 20;

function spawnRandomTile(board: number[]): { next: number[]; index: number | null } {
  const empty: number[] = [];
  for (let i = 0; i < 16; i++) {
    if (board[i] === 0) empty.push(i);
  }
  if (empty.length === 0) return { next: board, index: null };
  const chosen = empty[Math.floor(Math.random() * empty.length)]!;
  const next = [...board];
  next[chosen] = Math.random() < 0.9 ? 2 : 4;
  return { next, index: chosen };
}

function createInitialBoard(): number[] {
  const empty = Array<number>(16).fill(0);
  const first = spawnRandomTile(empty).next;
  return spawnRandomTile(first).next;
}

function slideLine(line: number[]): { out: number[]; gained: number; mergedSlots: number[] } {
  const compact = line.filter((v) => v !== 0);
  const out: number[] = [];
  const mergedSlots: number[] = [];
  let gained = 0;

  let i = 0;
  while (i < compact.length) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const merged = compact[i]! * 2;
      mergedSlots.push(out.length);
      out.push(merged);
      gained += merged;
      i += 2;
    } else {
      out.push(compact[i]!);
      i += 1;
    }
  }
  while (out.length < 4) out.push(0);
  return { out, gained, mergedSlots };
}

function applyMove(board: number[], dir: Direction): {
  next: number[];
  gained: number;
  moved: boolean;
  mergedIndices: number[];
} {
  const next = Array<number>(16).fill(0);
  let gained = 0;
  let moved = false;
  const mergedIndices: number[] = [];

  for (let lineIndex = 0; lineIndex < 4; lineIndex++) {
    const indices: number[] = [];
    for (let step = 0; step < 4; step++) {
      if (dir === 'left') indices.push(lineIndex * 4 + step);
      else if (dir === 'right') indices.push(lineIndex * 4 + (3 - step));
      else if (dir === 'up') indices.push(step * 4 + lineIndex);
      else indices.push((3 - step) * 4 + lineIndex);
    }

    const line = indices.map((idx) => board[idx]!);
    const { out, gained: lineGain, mergedSlots } = slideLine(line);
    gained += lineGain;

    for (let step = 0; step < 4; step++) {
      const boardIdx = indices[step]!;
      next[boardIdx] = out[step]!;
      if (out[step] !== board[boardIdx]) moved = true;
    }
    for (const slot of mergedSlots) {
      mergedIndices.push(indices[slot]!);
    }
  }

  return { next, gained, moved, mergedIndices };
}

function canMove(board: number[]): boolean {
  for (let i = 0; i < 16; i++) {
    if (board[i] === 0) return true;
    const r = Math.floor(i / 4);
    const c = i % 4;
    if (c < 3 && board[i] === board[i + 1]) return true;
    if (r < 3 && board[i] === board[i + 4]) return true;
  }
  return false;
}

const EMPTY_BOARD = Array<number>(16).fill(0);

export default function Game2048() {
  const hostRef = useRef<HTMLDivElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const [board, setBoard] = useState<number[]>(EMPTY_BOARD);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<Status>('playing');
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [popIndices, setPopIndices] = useState<Set<number>>(() => new Set());
  const [moveSeq, setMoveSeq] = useState(0);

  const maxTile = Math.max(...board);

  useEffect(() => {
    setBest(readStoredNumber(BEST_KEY, 0));
    setBoard(createInitialBoard());
  }, []);

  const updateWindowStatus = useCallback((text: string) => {
    const el = hostRef.current
      ?.closest('[data-window-id]')
      ?.querySelector<HTMLElement>('[data-window-status]');
    if (el && el.textContent !== text) el.textContent = text;
  }, []);

  useEffect(() => {
    if (status === 'won') updateWindowStatus(`2048 Reached · Score ${score} · Best ${best}`);
    else if (status === 'over') updateWindowStatus(`No Moves · Score ${score} · Max ${maxTile}`);
    else updateWindowStatus(`Score ${score} · Best ${best} · Max ${maxTile}`);
  }, [best, maxTile, score, status, updateWindowStatus]);

  const restart = useCallback(() => {
    setBoard(createInitialBoard());
    setScore(0);
    setStatus('playing');
    setKeepPlaying(false);
    setHistory([]);
    setPopIndices(new Set());
    setMoveSeq((n) => n + 1);
    playArcadeCue('click');
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1]!;
    setHistory((stack) => stack.slice(0, -1));
    setBoard(prev.board);
    setScore(prev.score);
    setStatus('playing');
    setPopIndices(new Set());
    playArcadeCue('click');
  }, [history]);

  const move = useCallback(
    (dir: Direction) => {
      if (status !== 'playing') return;
      const { next: slid, gained, moved, mergedIndices } = applyMove(board, dir);
      if (!moved) return;

      const { next: spawned, index: spawnedIdx } = spawnRandomTile(slid);
      const nextScore = score + gained;
      const pops = new Set<number>(mergedIndices);
      if (spawnedIdx !== null) pops.add(spawnedIdx);

      setHistory((stack) => [...stack.slice(-(MAX_UNDO - 1)), { board, score }]);
      setBoard(spawned);
      setScore(nextScore);
      setPopIndices(pops);
      setMoveSeq((n) => n + 1);

      if (nextScore > best) {
        setBest(nextScore);
        writeStoredNumber(BEST_KEY, nextScore);
      }

      const reached2048 = !keepPlaying && spawned.some((v) => v >= 2048);
      if (reached2048) {
        setStatus('won');
        playArcadeCue('win');
      } else if (!canMove(spawned)) {
        setStatus('over');
        playArcadeCue('lose');
      } else {
        playArcadeCue(gained > 0 ? 'merge' : 'move');
      }
    },
    [best, board, keepPlaying, score, status],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (document.querySelector('#start-menu-panel:not([hidden])')) return;

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          move('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          move('right');
          break;
        case 'z':
        case 'Z':
          event.preventDefault();
          undo();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          restart();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move, restart, undo]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    const touch = event.changedTouches[0];
    swipeStartRef.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  };

  return (
    <div className="arcade-host" ref={hostRef} data-game="2048" data-phase={status}>
      <div className="arcade-split">
        <div className="arcade-stage-panel">
          <div
            className="g2048-board-wrap"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="g2048-grid" role="grid" aria-label="2048 board">
              {board.map((value, index) => (
                <div
                  key={`${index}-${popIndices.has(index) ? moveSeq : 0}`}
                  className="g2048-cell"
                  role="gridcell"
                  data-v={value > 0 ? value : undefined}
                  data-pop={popIndices.has(index) ? 'true' : undefined}
                >
                  {value > 0 ? value : ''}
                </div>
              ))}
            </div>

            {status !== 'playing' && (
              <div className="arcade-overlay" data-2048-overlay={status}>
                <h2 className="arcade-overlay-title">{status === 'won' ? '2048!' : 'GAME OVER'}</h2>
                <p className="arcade-overlay-sub">
                  {status === 'won'
                    ? `You built 2048! Score ${score} — keep going or start fresh.`
                    : `Score ${score} · Largest tile ${maxTile}`}
                </p>
                <div className="arcade-overlay-actions">
                  {status === 'won' && (
                    <ButtonBase
                      variant="primary"
                      onClick={() => {
                        setKeepPlaying(true);
                        setStatus('playing');
                      }}
                    >
                      Keep Playing
                    </ButtonBase>
                  )}
                  <ButtonBase variant={status === 'won' ? 'secondary' : 'primary'} onClick={restart}>
                    Play Again
                  </ButtonBase>
                </div>
              </div>
            )}
          </div>

          <div className="arcade-touch-pad" aria-label="Touch direction pad">
            <div className="arcade-dpad">
              <span />
              <ButtonBase className="arcade-dpad-btn" aria-label="Slide up" onClick={() => move('up')}>▲</ButtonBase>
              <span />
              <ButtonBase className="arcade-dpad-btn" aria-label="Slide left" onClick={() => move('left')}>◀</ButtonBase>
              <ButtonBase className="arcade-dpad-btn" aria-label="Slide down" onClick={() => move('down')}>▼</ButtonBase>
              <ButtonBase className="arcade-dpad-btn" aria-label="Slide right" onClick={() => move('right')}>▶</ButtonBase>
            </div>
          </div>
        </div>

        <aside className="arcade-side" aria-label="Game stats and controls">
          <div className="arcade-card">
            <p className="arcade-card-title">Scoreboard</p>
            <div className="arcade-stat-grid">
              <div className="arcade-stat">
                <span>Score</span>
                <strong data-2048-score>{score}</strong>
              </div>
              <div className="arcade-stat">
                <span>Best</span>
                <strong data-2048-best>{best}</strong>
              </div>
              <div className="arcade-stat">
                <span>Max Tile</span>
                <strong data-2048-max>{maxTile}</strong>
              </div>
              <div className="arcade-stat">
                <span>Undo Left</span>
                <strong>{history.length}</strong>
              </div>
            </div>
          </div>

          <div className="arcade-actions">
            <ButtonBase variant="secondary" disabled={history.length === 0} onClick={undo}>
              Undo
            </ButtonBase>
            <ButtonBase variant="primary" onClick={restart}>
              New Game
            </ButtonBase>
          </div>

          <div className="arcade-card">
            <p className="arcade-card-title">Controls</p>
            <ul className="arcade-help">
              <li><span>Slide tiles</span><kbd>↑↓←→ / WASD</kbd></li>
              <li><span>Undo move</span><kbd>Z</kbd></li>
              <li><span>New game</span><kbd>R</kbd></li>
              <li><span>Touch</span><kbd>Swipe board</kbd></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
