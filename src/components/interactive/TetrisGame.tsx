import { useCallback, useEffect, useRef, useState } from 'react';
import {
  playArcadeCue,
  readPhosphorPalette,
  readStoredNumber,
  writeStoredNumber,
  type PhosphorPalette,
} from '../../games/arcadeSound';
import ButtonBase from '../ui/ButtonBase';

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type Phase = 'ready' | 'playing' | 'paused' | 'over';

interface ActivePiece {
  type: PieceType;
  matrix: number[][];
  x: number;
  y: number;
}

const COLS = 10;
const ROWS = 20;
const CELL = 21;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const PREVIEW_CELL = 16;
const BEST_KEY = 'astro-phosphor-tetris-best';

const SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const ALL_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function createBag(): PieceType[] {
  const bag = [...ALL_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j]!, bag[i]!];
  }
  return bag;
}

function createEmptyGrid(): (PieceType | null)[][] {
  return Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));
}

function rotateMatrix(matrix: number[][], dir: 1 | -1): number[][] {
  const n = matrix.length;
  const out = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (dir === 1) out[c]![n - 1 - r] = matrix[r]![c]!;
      else out[n - 1 - c]![r] = matrix[r]![c]!;
    }
  }
  return out;
}

function collides(grid: (PieceType | null)[][], piece: ActivePiece, dx = 0, dy = 0, mat = piece.matrix): boolean {
  for (let r = 0; r < mat.length; r++) {
    for (let c = 0; c < mat[r]!.length; c++) {
      if (!mat[r]![c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && grid[ny]![nx] !== null) return true;
    }
  }
  return false;
}

function spawnPiece(type: PieceType): ActivePiece {
  const matrix = SHAPES[type].map((row) => [...row]);
  const x = Math.floor((COLS - matrix[0]!.length) / 2);
  const y = type === 'I' ? -1 : 0;
  return { type, matrix, x, y };
}

function drawMonochromeCell(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  type: PieceType,
  palette: PhosphorPalette,
  ghost = false,
) {
  const pad = 1;
  const x = px + pad;
  const y = py + pad;
  const s = size - pad * 2;

  if (ghost) {
    ctx.strokeStyle = palette.lit72;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
    return;
  }

  ctx.fillStyle = palette.ground;
  ctx.fillRect(x, y, s, s);

  switch (type) {
    case 'O':
      ctx.fillStyle = palette.lit;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = palette.hi;
      ctx.fillRect(x, y, s, 2);
      ctx.fillRect(x, y, 2, s);
      ctx.fillStyle = palette.side;
      ctx.fillRect(x, y + s - 2, s, 2);
      ctx.fillRect(x + s - 2, y, 2, s);
      break;
    case 'I':
      ctx.fillStyle = palette.lit;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = palette.ground;
      ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
      ctx.fillStyle = palette.hi;
      ctx.fillRect(x + 5, y + Math.floor(s / 2) - 1, s - 10, 2);
      break;
    case 'T':
      ctx.fillStyle = palette.lit;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = palette.ground;
      ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
      ctx.fillStyle = palette.hi;
      ctx.fillRect(x + 5, y + 5, s - 10, s - 10);
      break;
    case 'S':
      ctx.fillStyle = palette.lit28;
      ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = palette.lit;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
      ctx.fillStyle = palette.lit;
      for (let d = 3; d < s - 3; d += 4) {
        ctx.fillRect(x + d, y + d, 2, 2);
      }
      break;
    case 'Z':
      ctx.fillStyle = palette.lit28;
      ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = palette.hi;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
      ctx.fillStyle = palette.hi;
      for (let d = 3; d < s - 3; d += 4) {
        ctx.fillRect(x + s - 2 - d, y + d, 2, 2);
      }
      break;
    case 'J':
      ctx.fillStyle = palette.side;
      ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = palette.lit;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
      ctx.fillStyle = palette.lit;
      ctx.fillRect(x + 4, y + 4, 4, 4);
      ctx.fillRect(x + s - 8, y + s - 8, 4, 4);
      break;
    case 'L':
      ctx.fillStyle = palette.lit72;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = palette.ground;
      for (let ry = 2; ry < s - 2; ry += 4) {
        for (let rx = 2; rx < s - 2; rx += 4) {
          if (((rx + ry) / 4) % 2 === 0) ctx.fillRect(x + rx, y + ry, 2, 2);
        }
      }
      ctx.strokeStyle = palette.hi;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      break;
  }
}

function renderMiniCanvas(canvas: HTMLCanvasElement | null, type: PieceType | null, palette: PhosphorPalette) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = PREVIEW_CELL * 4;
  const h = PREVIEW_CELL * 4;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, 0, w, h);
  if (!type) return;

  const mat = SHAPES[type];
  let minR = mat.length;
  let maxR = -1;
  let minC = mat[0]!.length;
  let maxC = -1;
  for (let r = 0; r < mat.length; r++) {
    for (let c = 0; c < mat[r]!.length; c++) {
      if (mat[r]![c]) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  const pieceW = (maxC - minC + 1) * PREVIEW_CELL;
  const pieceH = (maxR - minR + 1) * PREVIEW_CELL;
  const offsetX = Math.floor((w - pieceW) / 2) - minC * PREVIEW_CELL;
  const offsetY = Math.floor((h - pieceH) / 2) - minR * PREVIEW_CELL;

  for (let r = 0; r < mat.length; r++) {
    for (let c = 0; c < mat[r]!.length; c++) {
      if (mat[r]![c]) {
        drawMonochromeCell(ctx, offsetX + c * PREVIEW_CELL, offsetY + r * PREVIEW_CELL, PREVIEW_CELL, type, palette);
      }
    }
  }
}

export default function TetrisGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement>(null);

  const gridRef = useRef<(PieceType | null)[][]>(createEmptyGrid());
  const bagRef = useRef<PieceType[]>(createBag());
  const activeRef = useRef<ActivePiece | null>(null);
  const nextTypeRef = useRef<PieceType>('T');
  const holdTypeRef = useRef<PieceType | null>(null);
  const holdUsedRef = useRef(false);
  const paletteRef = useRef<PhosphorPalette>(readPhosphorPalette(null));
  const phaseRef = useRef<Phase>('ready');
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);

  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);

  const syncBest = useCallback((candidate: number) => {
    setBest((prev) => {
      if (candidate > prev) {
        writeStoredNumber(BEST_KEY, candidate);
        return candidate;
      }
      return prev;
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = paletteRef.current;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== BOARD_W * dpr || canvas.height !== BOARD_H * dpr) {
      canvas.width = BOARD_W * dpr;
      canvas.height = BOARD_H * dpr;
      canvas.style.width = `${BOARD_W}px`;
      canvas.style.height = `${BOARD_H}px`;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    ctx.strokeStyle = palette.lit10;
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL + 0.5, 0);
      ctx.lineTo(c * CELL + 0.5, BOARD_H);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL + 0.5);
      ctx.lineTo(BOARD_W, r * CELL + 0.5);
      ctx.stroke();
    }

    const grid = gridRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r]![c];
        if (cell) drawMonochromeCell(ctx, c * CELL, r * CELL, CELL, cell, palette);
      }
    }

    const active = activeRef.current;
    if (active) {
      let ghostY = active.y;
      while (!collides(grid, active, 0, ghostY - active.y + 1)) {
        ghostY++;
      }
      for (let r = 0; r < active.matrix.length; r++) {
        for (let c = 0; c < active.matrix[r]!.length; c++) {
          if (!active.matrix[r]![c]) continue;
          const gy = ghostY + r;
          if (gy >= 0) {
            drawMonochromeCell(ctx, (active.x + c) * CELL, gy * CELL, CELL, active.type, palette, true);
          }
        }
      }
      for (let r = 0; r < active.matrix.length; r++) {
        for (let c = 0; c < active.matrix[r]!.length; c++) {
          if (!active.matrix[r]![c]) continue;
          const py = active.y + r;
          if (py >= 0) {
            drawMonochromeCell(ctx, (active.x + c) * CELL, py * CELL, CELL, active.type, palette, false);
          }
        }
      }
    }

    renderMiniCanvas(nextCanvasRef.current, nextTypeRef.current, palette);
    renderMiniCanvas(holdCanvasRef.current, holdTypeRef.current, palette);
  }, []);

  const pullFromBag = useCallback((): PieceType => {
    if (bagRef.current.length === 0) bagRef.current = createBag();
    return bagRef.current.pop()!;
  }, []);

  const updateWindowStatus = useCallback((text: string) => {
    const status = hostRef.current
      ?.closest('[data-window-id]')
      ?.querySelector<HTMLElement>('[data-window-status]');
    if (status && status.textContent !== text) status.textContent = text;
  }, []);

  useEffect(() => {
    const lv = String(level).padStart(2, '0');
    const sc = String(score).padStart(6, '0');
    if (phase === 'ready') updateWindowStatus(`Ready · Lv.${lv} · ${sc}`);
    else if (phase === 'paused') updateWindowStatus(`Paused · Lv.${lv} · ${sc}`);
    else if (phase === 'over') updateWindowStatus(`Game Over · Score ${score}`);
    else updateWindowStatus(`Playing · Lv.${lv} · ${sc}`);
  }, [level, phase, score, updateWindowStatus]);

  useEffect(() => {
    setBest(readStoredNumber(BEST_KEY, 0));
    const refreshPalette = () => {
      paletteRef.current = readPhosphorPalette(hostRef.current);
      draw();
    };
    refreshPalette();
    const observer = new MutationObserver(refreshPalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-zoom', 'data-reading'],
    });
    return () => observer.disconnect();
  }, [draw]);

  const startGame = useCallback(() => {
    gridRef.current = createEmptyGrid();
    bagRef.current = createBag();
    const first = pullFromBag();
    nextTypeRef.current = pullFromBag();
    activeRef.current = spawnPiece(first);
    holdTypeRef.current = null;
    holdUsedRef.current = false;
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    phaseRef.current = 'playing';
    setScore(0);
    setLines(0);
    setLevel(1);
    setPhase('playing');
    playArcadeCue('click');
    draw();
  }, [draw, pullFromBag]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'playing') {
      phaseRef.current = 'paused';
      setPhase('paused');
      playArcadeCue('click');
    } else if (phaseRef.current === 'paused') {
      phaseRef.current = 'playing';
      setPhase('playing');
      playArcadeCue('click');
    }
  }, []);

  const lockPiece = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    const grid = gridRef.current;

    let toppedOut = false;
    for (let r = 0; r < active.matrix.length; r++) {
      for (let c = 0; c < active.matrix[r]!.length; c++) {
        if (!active.matrix[r]![c]) continue;
        const gy = active.y + r;
        const gx = active.x + c;
        if (gy < 0) {
          toppedOut = true;
        } else if (gy < ROWS && gx >= 0 && gx < COLS) {
          grid[gy]![gx] = active.type;
        }
      }
    }

    if (toppedOut) {
      activeRef.current = null;
      phaseRef.current = 'over';
      setPhase('over');
      syncBest(scoreRef.current);
      playArcadeCue('lose');
      draw();
      return;
    }

    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r]!.every((cell) => cell !== null)) {
        grid.splice(r, 1);
        grid.unshift(Array<PieceType | null>(COLS).fill(null));
        cleared++;
        r++;
      }
    }

    if (cleared > 0) {
      const table = [0, 100, 300, 500, 800];
      const gained = (table[cleared] ?? 800) * levelRef.current;
      scoreRef.current += gained;
      linesRef.current += cleared;
      levelRef.current = Math.min(15, Math.floor(linesRef.current / 10) + 1);
      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(levelRef.current);
      syncBest(scoreRef.current);
      playArcadeCue(cleared >= 4 ? 'tetris' : 'line');
    } else {
      playArcadeCue('drop');
    }

    const nextType = nextTypeRef.current;
    nextTypeRef.current = pullFromBag();
    const spawned = spawnPiece(nextType);
    holdUsedRef.current = false;

    if (collides(grid, spawned)) {
      activeRef.current = null;
      phaseRef.current = 'over';
      setPhase('over');
      syncBest(scoreRef.current);
      playArcadeCue('lose');
    } else {
      activeRef.current = spawned;
    }
    draw();
  }, [draw, pullFromBag, syncBest]);

  const moveHorizontal = useCallback((dx: -1 | 1) => {
    if (phaseRef.current !== 'playing' || !activeRef.current) return;
    if (!collides(gridRef.current, activeRef.current, dx, 0)) {
      activeRef.current.x += dx;
      playArcadeCue('move');
      draw();
    }
  }, [draw]);

  const softDrop = useCallback((awardPoint = false) => {
    if (phaseRef.current !== 'playing' || !activeRef.current) return;
    if (!collides(gridRef.current, activeRef.current, 0, 1)) {
      activeRef.current.y += 1;
      if (awardPoint) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        syncBest(scoreRef.current);
      }
      draw();
    } else {
      lockPiece();
    }
  }, [draw, lockPiece, syncBest]);

  const hardDrop = useCallback(() => {
    if (phaseRef.current !== 'playing' || !activeRef.current) return;
    let dropped = 0;
    while (!collides(gridRef.current, activeRef.current, 0, 1)) {
      activeRef.current.y += 1;
      dropped++;
    }
    if (dropped > 0) {
      scoreRef.current += dropped * 2;
      setScore(scoreRef.current);
      syncBest(scoreRef.current);
    }
    lockPiece();
  }, [lockPiece, syncBest]);

  const rotatePiece = useCallback((dir: 1 | -1) => {
    if (phaseRef.current !== 'playing' || !activeRef.current) return;
    const rotated = rotateMatrix(activeRef.current.matrix, dir);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(gridRef.current, activeRef.current, kick, 0, rotated)) {
        activeRef.current.x += kick;
        activeRef.current.matrix = rotated;
        playArcadeCue('rotate');
        draw();
        return;
      }
    }
  }, [draw]);

  const holdPiece = useCallback(() => {
    if (phaseRef.current !== 'playing' || !activeRef.current || holdUsedRef.current) return;
    const currentType = activeRef.current.type;
    if (holdTypeRef.current) {
      const swap = holdTypeRef.current;
      holdTypeRef.current = currentType;
      activeRef.current = spawnPiece(swap);
    } else {
      holdTypeRef.current = currentType;
      const next = nextTypeRef.current;
      nextTypeRef.current = pullFromBag();
      activeRef.current = spawnPiece(next);
    }
    holdUsedRef.current = true;
    playArcadeCue('rotate');
    draw();
  }, [draw, pullFromBag]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = Math.max(85, 760 - (level - 1) * 58);
    const id = setInterval(() => softDrop(false), interval);
    return () => clearInterval(id);
  }, [level, phase, softDrop]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (document.querySelector('#start-menu-panel:not([hidden])')) return;

      if (phaseRef.current === 'ready' || phaseRef.current === 'over') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          startGame();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          moveHorizontal(1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          softDrop(true);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'x':
        case 'X':
          event.preventDefault();
          rotatePiece(1);
          break;
        case 'z':
        case 'Z':
          event.preventDefault();
          rotatePiece(-1);
          break;
        case ' ':
          event.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          event.preventDefault();
          holdPiece();
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          togglePause();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          startGame();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hardDrop, holdPiece, moveHorizontal, rotatePiece, softDrop, startGame, togglePause]);

  return (
    <div className="arcade-host" ref={hostRef} data-game="tetris" data-phase={phase}>
      <div className="arcade-split">
        <div className="arcade-stage-panel">
          <div className="arcade-canvas-wrap">
            <canvas
              ref={canvasRef}
              className="arcade-canvas"
              width={BOARD_W}
              height={BOARD_H}
              aria-label="Tetris board"
            />

            {phase !== 'playing' && (
              <div className="arcade-overlay" data-tetris-overlay={phase}>
                <h2 className="arcade-overlay-title">
                  {phase === 'ready' ? 'TETRIS' : phase === 'paused' ? 'PAUSED' : 'GAME OVER'}
                </h2>
                <p className="arcade-overlay-sub">
                  {phase === 'ready'
                    ? '10×20 monochrome blocks · Ghost drop & Hold slot'
                    : phase === 'paused'
                      ? 'Press P or click Resume to continue'
                      : `Final Score ${score} · ${lines} lines cleared`}
                </p>
                <div className="arcade-overlay-actions">
                  {phase === 'paused' ? (
                    <ButtonBase variant="primary" onClick={togglePause}>Resume</ButtonBase>
                  ) : (
                    <ButtonBase variant="primary" onClick={startGame}>
                      {phase === 'ready' ? 'Start Game' : 'Play Again'}
                    </ButtonBase>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="arcade-touch-pad" aria-label="Touch controls">
            <div className="tetris-touch-row">
              <ButtonBase className="arcade-dpad-btn" onClick={() => moveHorizontal(-1)}>◀ Left</ButtonBase>
              <ButtonBase className="arcade-dpad-btn" onClick={() => rotatePiece(1)}>↻ Rotate</ButtonBase>
              <ButtonBase className="arcade-dpad-btn" onClick={() => moveHorizontal(1)}>Right ▶</ButtonBase>
            </div>
            <div className="tetris-touch-row">
              <ButtonBase className="arcade-dpad-btn" onClick={holdPiece}>Hold</ButtonBase>
              <ButtonBase className="arcade-dpad-btn" onClick={() => softDrop(true)}>▼ Soft</ButtonBase>
              <ButtonBase variant="primary" className="arcade-dpad-btn" onClick={hardDrop}>⤓ Drop</ButtonBase>
            </div>
          </div>
        </div>

        <aside className="arcade-side" aria-label="Game stats and controls">
          <div className="arcade-card">
            <div className="tetris-preview-row">
              <div className="tetris-mini-box">
                <span>Next</span>
                <canvas ref={nextCanvasRef} className="arcade-canvas" width={64} height={64} aria-label="Next piece" />
              </div>
              <div className="tetris-mini-box">
                <span>Hold</span>
                <canvas ref={holdCanvasRef} className="arcade-canvas" width={64} height={64} aria-label="Held piece" />
              </div>
            </div>
          </div>

          <div className="arcade-card">
            <p className="arcade-card-title">Scoreboard</p>
            <div className="arcade-stat-grid">
              <div className="arcade-stat">
                <span>Score</span>
                <strong data-tetris-score>{score}</strong>
              </div>
              <div className="arcade-stat">
                <span>Best</span>
                <strong data-tetris-best>{best}</strong>
              </div>
              <div className="arcade-stat">
                <span>Lines</span>
                <strong data-tetris-lines>{lines}</strong>
              </div>
              <div className="arcade-stat">
                <span>Level</span>
                <strong data-tetris-level>{String(level).padStart(2, '0')}</strong>
              </div>
            </div>
          </div>

          <div className="arcade-actions">
            {phase === 'playing' || phase === 'paused' ? (
              <ButtonBase variant="primary" onClick={togglePause}>
                {phase === 'paused' ? 'Resume' : 'Pause'}
              </ButtonBase>
            ) : (
              <ButtonBase variant="primary" onClick={startGame}>Start</ButtonBase>
            )}
            <ButtonBase onClick={startGame}>Reset</ButtonBase>
          </div>

          <div className="arcade-card">
            <p className="arcade-card-title">Controls</p>
            <ul className="arcade-help">
              <li><span>Move</span><kbd>← / →</kbd></li>
              <li><span>Rotate</span><kbd>↑ / Z</kbd></li>
              <li><span>Soft / Hard drop</span><kbd>↓ / Space</kbd></li>
              <li><span>Hold piece</span><kbd>C / Shift</kbd></li>
              <li><span>Pause / Reset</span><kbd>P / R</kbd></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
