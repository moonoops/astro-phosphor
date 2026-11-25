import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { playArcadeCue, readStoredNumber, writeStoredNumber } from '../../games/arcadeSound';
import PixelIcon from '../os/PixelIcon';
import ButtonBase from '../ui/ButtonBase';

type DifficultyKey = 'beginner' | 'intermediate' | 'expert';
type Phase = 'ready' | 'playing' | 'won' | 'lost';

interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  cols: number;
  rows: number;
  mines: number;
  cellPx: number;
  fontPx: number;
}

interface MineCell {
  hasMine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
  exploded: boolean;
}

const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  beginner: { key: 'beginner', label: 'Beginner 9×9', cols: 9, rows: 9, mines: 10, cellPx: 34, fontPx: 17 },
  intermediate: { key: 'intermediate', label: 'Medium 16×16', cols: 16, rows: 16, mines: 40, cellPx: 21, fontPx: 13 },
  expert: { key: 'expert', label: 'Expert 30×16', cols: 30, rows: 16, mines: 99, cellPx: 20, fontPx: 12 },
};

function bestStorageKey(diff: DifficultyKey) {
  return `astro-phosphor-minesweeper-best-${diff}`;
}

function createEmptyBoard(cols: number, rows: number): MineCell[] {
  return Array.from({ length: cols * rows }, () => ({
    hasMine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
    exploded: false,
  }));
}

function neighborIndices(index: number, cols: number, rows: number): number[] {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        result.push(nr * cols + nc);
      }
    }
  }
  return result;
}

function plantMines(cols: number, rows: number, mines: number, safeIndex: number): MineCell[] {
  const board = createEmptyBoard(cols, rows);
  const excluded = new Set<number>([safeIndex, ...neighborIndices(safeIndex, cols, rows)]);
  const candidates: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (!excluded.has(i)) candidates.push(i);
  }
  if (candidates.length < mines) {
    candidates.length = 0;
    for (let i = 0; i < board.length; i++) {
      if (i !== safeIndex) candidates.push(i);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
  }
  for (let k = 0; k < Math.min(mines, candidates.length); k++) {
    board[candidates[k]!]!.hasMine = true;
  }
  for (let i = 0; i < board.length; i++) {
    if (board[i]!.hasMine) continue;
    let count = 0;
    for (const n of neighborIndices(i, cols, rows)) {
      if (board[n]!.hasMine) count++;
    }
    board[i]!.adjacent = count;
  }
  return board;
}

function floodReveal(board: MineCell[], startIndices: number[], cols: number, rows: number): {
  next: MineCell[];
  hitMine: boolean;
  revealedCount: number;
} {
  const next = board.map((cell) => ({ ...cell }));
  const queue = [...startIndices];
  let hitMine = false;
  let revealedCount = 0;

  while (queue.length > 0) {
    const idx = queue.shift()!;
    const cell = next[idx];
    if (!cell || cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    revealedCount++;

    if (cell.hasMine) {
      cell.exploded = true;
      hitMine = true;
      continue;
    }

    if (cell.adjacent === 0) {
      for (const n of neighborIndices(idx, cols, rows)) {
        if (!next[n]!.revealed && !next[n]!.flagged) {
          queue.push(n);
        }
      }
    }
  }

  return { next, hitMine, revealedCount };
}

function pad3(n: number): string {
  const clamped = Math.max(-99, Math.min(999, n));
  if (clamped < 0) return `-${String(Math.abs(clamped)).padStart(2, '0')}`;
  return String(clamped).padStart(3, '0');
}

export default function MinesweeperGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [difficulty, setDifficulty] = useState<DifficultyKey>('beginner');
  const config = DIFFICULTIES[difficulty];

  const [board, setBoard] = useState<MineCell[]>(() => createEmptyBoard(config.cols, config.rows));
  const [phase, setPhase] = useState<Phase>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const [bestTime, setBestTime] = useState(0);

  const flagsUsed = board.reduce((sum, cell) => sum + (cell.flagged ? 1 : 0), 0);
  const remainingMines = config.mines - flagsUsed;

  useEffect(() => {
    setBestTime(readStoredNumber(bestStorageKey(difficulty), 0));
  }, [difficulty]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = setInterval(() => {
      setElapsed((prev) => Math.min(999, prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const updateWindowStatus = useCallback((text: string) => {
    const status = hostRef.current
      ?.closest('[data-window-id]')
      ?.querySelector<HTMLElement>('[data-window-status]');
    if (status && status.textContent !== text) status.textContent = text;
  }, []);

  useEffect(() => {
    if (phase === 'won') {
      const bestLabel = bestTime > 0 ? ` · Best ${pad3(bestTime)}s` : '';
      updateWindowStatus(`Cleared · ${pad3(elapsed)}s${bestLabel}`);
    } else if (phase === 'lost') {
      updateWindowStatus(`Boom · ${config.label}`);
    } else {
      updateWindowStatus(`${config.label} · ${remainingMines} mines left`);
    }
  }, [bestTime, config.label, elapsed, phase, remainingMines, updateWindowStatus]);

  const resetGame = useCallback((targetDiff: DifficultyKey = difficulty) => {
    const nextConfig = DIFFICULTIES[targetDiff];
    setDifficulty(targetDiff);
    setBoard(createEmptyBoard(nextConfig.cols, nextConfig.rows));
    setPhase('ready');
    setElapsed(0);
    playArcadeCue('click');
  }, [difficulty]);

  const finalizeOutcome = useCallback(
    (next: MineCell[], hitMine: boolean) => {
      if (hitMine) {
        const revealedMines = next.map((cell) =>
          cell.hasMine && !cell.flagged ? { ...cell, revealed: true } : cell,
        );
        setBoard(revealedMines);
        setPhase('lost');
        playArcadeCue('lose');
        return;
      }

      const safeTotal = config.cols * config.rows - config.mines;
      const revealedSafe = next.reduce((sum, cell) => sum + (cell.revealed && !cell.hasMine ? 1 : 0), 0);
      if (revealedSafe >= safeTotal) {
        const cleared = next.map((cell) => (cell.hasMine ? { ...cell, flagged: true } : cell));
        setBoard(cleared);
        setPhase('won');
        playArcadeCue('win');
        const finalSeconds = Math.max(1, elapsed);
        setBestTime((prev) => {
          if (prev === 0 || finalSeconds < prev) {
            writeStoredNumber(bestStorageKey(difficulty), finalSeconds);
            return finalSeconds;
          }
          return prev;
        });
      } else {
        setBoard(next);
        playArcadeCue('click');
      }
    },
    [config.cols, config.mines, config.rows, difficulty, elapsed],
  );

  const toggleFlag = useCallback(
    (index: number) => {
      if (phase === 'won' || phase === 'lost') return;
      const cell = board[index];
      if (!cell || cell.revealed) return;
      const next = board.map((item, i) => (i === index ? { ...item, flagged: !item.flagged } : item));
      setBoard(next);
      playArcadeCue('flag');
    },
    [board, phase],
  );

  const handleCellClick = (index: number) => {
    if (phase === 'won' || phase === 'lost') return;
    const cell = board[index];
    if (!cell) return;

    if (cell.revealed && cell.adjacent > 0) {
      const neighbors = neighborIndices(index, config.cols, config.rows);
      const flaggedNeighbors = neighbors.reduce((sum, n) => sum + (board[n]!.flagged ? 1 : 0), 0);
      if (flaggedNeighbors === cell.adjacent) {
        const targets = neighbors.filter((n) => !board[n]!.revealed && !board[n]!.flagged);
        if (targets.length === 0) return;
        const { next, hitMine } = floodReveal(board, targets, config.cols, config.rows);
        finalizeOutcome(next, hitMine);
      }
      return;
    }

    if (flagMode && phase === 'playing') {
      toggleFlag(index);
      return;
    }

    if (cell.flagged || cell.revealed) return;

    let working = board;
    if (phase === 'ready') {
      working = plantMines(config.cols, config.rows, config.mines, index);
      setPhase('playing');
      setElapsed(0);
    }

    const { next, hitMine } = floodReveal(working, [index], config.cols, config.rows);
    finalizeOutcome(next, hitMine);
  };

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    toggleFlag(index);
  };

  const faceLabel =
    phase === 'won' ? 'B-) Cleared' : phase === 'lost' ? 'X-( Retry' : phase === 'playing' ? ':-) Reset' : ':-) New';

  const boardStyle = {
    '--mine-cols': config.cols,
    '--mine-cell': `${config.cellPx}px`,
    '--mine-font': `${config.fontPx}px`,
  } as CSSProperties;

  return (
    <div className="arcade-host" ref={hostRef} data-game="minesweeper" data-phase={phase}>
      <div className="arcade-toolbar">
        <div className="arcade-segmented" role="group" aria-label="Difficulty">
          {(Object.values(DIFFICULTIES) as DifficultyConfig[]).map((item) => (
            <button
              key={item.key}
              type="button"
              className="arcade-chip"
              aria-pressed={difficulty === item.key}
              onClick={() => resetGame(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mine-toolbar-right">
          <button
            type="button"
            className="arcade-chip"
            data-flag-mode
            aria-pressed={flagMode}
            onClick={() => setFlagMode((current) => !current)}
          >
            <PixelIcon name="flag" size={14} />
            <span>{flagMode ? 'Flag: On' : 'Flag: Off'}</span>
          </button>
        </div>
      </div>

      <div className="mine-hud">
        <div className="arcade-led" aria-label={`${remainingMines} mines remaining`}>
          <span className="arcade-led-label">MINES</span>
          <span className="arcade-led-value" data-mine-remaining>{pad3(remainingMines)}</span>
        </div>

        <ButtonBase
          variant={phase === 'won' || phase === 'lost' ? 'primary' : 'secondary'}
          className="mine-face-key"
          onClick={() => resetGame(difficulty)}
        >
          {faceLabel}
        </ButtonBase>

        <div className="arcade-led" aria-label={`Elapsed time ${elapsed} seconds`}>
          <span className="arcade-led-label">TIME</span>
          <span className="arcade-led-value" data-mine-timer>{pad3(elapsed)}</span>
        </div>
      </div>

      <div className="mine-board-scroll">
        <div
          className="mine-board"
          style={boardStyle}
          role="grid"
          aria-label={`Minesweeper board ${config.cols}×${config.rows}`}
        >
          {board.map((cell, index) => {
            const wrongFlag = phase === 'lost' && cell.flagged && !cell.hasMine;
            let stateAttr: string | undefined;
            if (cell.exploded) stateAttr = 'exploded';
            else if (wrongFlag) stateAttr = 'wrong';
            else if (cell.revealed && cell.hasMine) stateAttr = 'mine';
            else if (cell.revealed) stateAttr = 'open';
            else if (cell.flagged) stateAttr = 'flagged';

            const row = Math.floor(index / config.cols) + 1;
            const col = (index % config.cols) + 1;
            const label = cell.revealed
              ? cell.hasMine
                ? `Row ${row}, Column ${col}: mine`
                : `Row ${row}, Column ${col}: ${cell.adjacent} adjacent mines`
              : cell.flagged
                ? `Row ${row}, Column ${col}: flagged`
                : `Row ${row}, Column ${col}: hidden`;

            return (
              <button
                key={index}
                type="button"
                className="mine-cell"
                data-cell-index={index}
                data-state={stateAttr}
                data-num={cell.revealed && !cell.hasMine && cell.adjacent > 0 ? cell.adjacent : undefined}
                aria-label={label}
                disabled={phase === 'won' || phase === 'lost'}
                onClick={() => handleCellClick(index)}
                onContextMenu={(event) => handleContextMenu(event, index)}
              >
                {cell.exploded || (cell.revealed && cell.hasMine) ? (
                  <PixelIcon name="mine" size={Math.max(12, config.cellPx - 10)} />
                ) : wrongFlag ? (
                  '×'
                ) : cell.flagged ? (
                  <PixelIcon name="flag" size={Math.max(12, config.cellPx - 10)} />
                ) : cell.revealed && cell.adjacent > 0 ? (
                  cell.adjacent
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mine-footer">
        <span>Left-click reveal · Right-click flag · Click number to chord · Safe first click</span>
        <span>{bestTime > 0 ? `Local best: ${bestTime}s` : 'No local record yet'}</span>
      </div>
    </div>
  );
}
