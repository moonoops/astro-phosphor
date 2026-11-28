import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { useStore } from '@nanostores/react';
import {
  playArcadeCue,
  readPhosphorPalette,
  readStoredNumber,
  writeStoredNumber,
  type PhosphorPalette,
} from '../../games/arcadeSound';
import { DEFAULT_OS } from '../../os/registry';
import { $preferences } from '../../stores/osStore';
import ButtonBase from '../ui/ButtonBase';

type SpeedKey = 'chill' | 'arcade' | 'turbo';
type Phase = 'ready' | 'playing' | 'paused' | 'over';
type Dir = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface BonusFood {
  pos: Point;
  ttl: number;
  maxTtl: number;
}

const GRID = 20;
const CELL = 19;
const BOARD_SIZE = GRID * CELL;

const SPEEDS: Record<SpeedKey, { label: string; ms: number }> = {
  chill: { label: 'Chill', ms: 155 },
  arcade: { label: 'Arcade', ms: 108 },
  turbo: { label: 'Turbo', ms: 72 },
};

const DIR_DELTA: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function bestKey(speed: SpeedKey) {
  return `astro-phosphor-snake-best-${speed}`;
}

function initialSnake(): Point[] {
  return [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
}

function randomFreeCell(occupied: Point[]): Point | null {
  const blocked = new Set(occupied.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!blocked.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)]!;
}

interface SnakeVisualTheme {
  isPhosphor: boolean;
  stageBg: string;
  stageGrid: string;
  palette: PhosphorPalette;
}

function readSnakeTheme(element: HTMLElement | null): SnakeVisualTheme {
  const palette = readPhosphorPalette(element);
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { isPhosphor: DEFAULT_OS === 'phosphor', stageBg: palette.ground, stageGrid: palette.lit10, palette };
  }
  const activeOs = document.documentElement.dataset.os || DEFAULT_OS;
  if (activeOs === 'phosphor') {
    return { isPhosphor: true, stageBg: palette.ground, stageGrid: palette.lit10, palette };
  }
  const target = element ?? document.documentElement;
  const resolveVar = (expr: string, fb: string) => {
    const probe = document.createElement('span');
    probe.style.color = expr;
    probe.style.display = 'none';
    target.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved || fb;
  };
  return {
    isPhosphor: false,
    stageBg: resolveVar('var(--game-stage-bg, #161a29)', '#161a29'),
    stageGrid: resolveVar('var(--game-stage-grid, rgba(255,255,255,0.1))', 'rgba(255,255,255,0.1)'),
    palette,
  };
}

export default function SnakeGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const { os, theme } = useStore($preferences, { ssr: 'initial' });

  const snakeRef = useRef<Point[]>(initialSnake());
  const dirRef = useRef<Dir>('right');
  const queueRef = useRef<Dir[]>([]);
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const bonusRef = useRef<BonusFood | null>(null);
  const applesRef = useRef(0);
  const scoreRef = useRef(0);
  const phaseRef = useRef<Phase>('ready');
  const wrapRef = useRef(false);
  const visualThemeRef = useRef<SnakeVisualTheme>(readSnakeTheme(null));

  const [speed, setSpeed] = useState<SpeedKey>('arcade');
  const [wrapWalls, setWrapWalls] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [length, setLength] = useState(4);
  const [bonusPct, setBonusPct] = useState(0);

  useEffect(() => {
    wrapRef.current = wrapWalls;
  }, [wrapWalls]);

  useEffect(() => {
    setBest(readStoredNumber(bestKey(speed), 0));
  }, [speed]);

  const syncBest = useCallback(
    (candidate: number) => {
      setBest((prev) => {
        if (candidate > prev) {
          writeStoredNumber(bestKey(speed), candidate);
          return candidate;
        }
        return prev;
      });
    },
    [speed],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const visual = visualThemeRef.current;
    const { palette, isPhosphor } = visual;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== BOARD_SIZE * dpr || canvas.height !== BOARD_SIZE * dpr) {
      canvas.width = BOARD_SIZE * dpr;
      canvas.height = BOARD_SIZE * dpr;
      canvas.style.width = `min(${BOARD_SIZE}px, 100%)`;
      canvas.style.height = 'auto';
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = visual.stageBg;
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    ctx.strokeStyle = visual.stageGrid;
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, BOARD_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(BOARD_SIZE, i * CELL + 0.5);
      ctx.stroke();
    }

    const food = foodRef.current;
    const fx = food.x * CELL;
    const fy = food.y * CELL;
    if (isPhosphor) {
      ctx.fillStyle = palette.hi;
      ctx.fillRect(fx + 4, fy + 4, CELL - 8, CELL - 8);
      ctx.strokeStyle = palette.lit;
      ctx.lineWidth = 2;
      ctx.strokeRect(fx + 3, fy + 3, CELL - 6, CELL - 6);
      ctx.fillStyle = palette.ground;
      ctx.fillRect(fx + 8, fy + 8, 3, 3);
    } else {
      ctx.fillStyle = '#ff475e';
      ctx.fillRect(fx + 3, fy + 5, CELL - 6, CELL - 8);
      ctx.fillRect(fx + 5, fy + 4, CELL - 10, CELL - 6);
      ctx.fillStyle = '#ffc2ca';
      ctx.fillRect(fx + 5, fy + 6, 3, 3);
      ctx.fillStyle = '#63f788';
      ctx.fillRect(fx + Math.floor(CELL / 2), fy + 2, 4, 2);
      ctx.fillStyle = '#c48d47';
      ctx.fillRect(fx + Math.floor(CELL / 2) - 1, fy + 2, 2, 3);
    }

    const bonus = bonusRef.current;
    if (bonus) {
      const bx = bonus.pos.x * CELL;
      const by = bonus.pos.y * CELL;
      ctx.fillStyle = isPhosphor
        ? (bonus.ttl % 2 === 0 ? palette.hi : palette.lit)
        : (bonus.ttl % 2 === 0 ? '#fff4b0' : '#ffd24a');
      ctx.fillRect(bx + 7, by + 2, 5, CELL - 4);
      ctx.fillRect(bx + 2, by + 7, CELL - 4, 5);
      ctx.fillStyle = visual.stageBg;
      ctx.fillRect(bx + 8, by + 8, 3, 3);
    }

    const snake = snakeRef.current;
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i]!;
      const sx = seg.x * CELL;
      const sy = seg.y * CELL;
      if (i === 0) {
        ctx.fillStyle = isPhosphor ? palette.hi : '#63f788';
        ctx.fillRect(sx + 1, sy + 1, CELL - 2, CELL - 2);
        if (!isPhosphor) {
          ctx.fillStyle = '#c8ffd6';
          ctx.fillRect(sx + 1, sy + 1, CELL - 2, 2);
        }
        ctx.fillStyle = isPhosphor ? palette.ground : '#09140d';
        const d = dirRef.current;
        if (d === 'right') {
          ctx.fillRect(sx + CELL - 6, sy + 4, 3, 3);
          ctx.fillRect(sx + CELL - 6, sy + CELL - 7, 3, 3);
        } else if (d === 'left') {
          ctx.fillRect(sx + 3, sy + 4, 3, 3);
          ctx.fillRect(sx + 3, sy + CELL - 7, 3, 3);
        } else if (d === 'up') {
          ctx.fillRect(sx + 4, sy + 3, 3, 3);
          ctx.fillRect(sx + CELL - 7, sy + 3, 3, 3);
        } else {
          ctx.fillRect(sx + 4, sy + CELL - 6, 3, 3);
          ctx.fillRect(sx + CELL - 7, sy + CELL - 6, 3, 3);
        }
      } else {
        const inset = i === snake.length - 1 ? 3 : 2;
        ctx.fillStyle = isPhosphor
          ? (i % 2 === 0 ? palette.lit : palette.lit72)
          : (i % 2 === 0 ? '#36cf64' : '#24ab4e');
        ctx.fillRect(sx + inset, sy + inset, CELL - inset * 2, CELL - inset * 2);
        ctx.fillStyle = isPhosphor ? palette.ground : '#85ffa8';
        ctx.fillRect(sx + Math.floor(CELL / 2) - 1, sy + Math.floor(CELL / 2) - 1, 2, 2);
      }
    }
  }, []);

  const updateWindowStatus = useCallback((text: string) => {
    const status = hostRef.current
      ?.closest('[data-window-id]')
      ?.querySelector<HTMLElement>('[data-window-status]');
    if (status && status.textContent !== text) status.textContent = text;
  }, []);

  useEffect(() => {
    const sc = String(score).padStart(3, '0');
    const hi = String(best).padStart(3, '0');
    if (phase === 'ready') updateWindowStatus(`Ready · Score ${sc} · Best ${hi}`);
    else if (phase === 'paused') updateWindowStatus(`Paused · Score ${sc}`);
    else if (phase === 'over') updateWindowStatus(`Game Over · Score ${score}`);
    else updateWindowStatus(`${SPEEDS[speed].label} · Score ${sc} · Length ${length}`);
  }, [best, length, phase, score, speed, updateWindowStatus]);

  useEffect(() => {
    const refreshPalette = () => {
      visualThemeRef.current = readSnakeTheme(hostRef.current);
      draw();
    };
    refreshPalette();
    const observer = new MutationObserver(refreshPalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-os', 'data-theme', 'data-zoom', 'data-reading'],
    });
    return () => observer.disconnect();
  }, [draw, os, theme]);

  const startGame = useCallback(() => {
    const fresh = initialSnake();
    snakeRef.current = fresh;
    dirRef.current = 'right';
    queueRef.current = [];
    foodRef.current = randomFreeCell(fresh) ?? { x: 15, y: 10 };
    bonusRef.current = null;
    applesRef.current = 0;
    scoreRef.current = 0;
    phaseRef.current = 'playing';
    setScore(0);
    setLength(fresh.length);
    setBonusPct(0);
    setPhase('playing');
    playArcadeCue('click');
    draw();
  }, [draw]);

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

  const queueDirection = useCallback((nextDir: Dir) => {
    if (phaseRef.current === 'ready') {
      startGame();
    }
    if (phaseRef.current !== 'playing') return;
    const lastPlanned = queueRef.current.at(-1) ?? dirRef.current;
    if (nextDir === lastPlanned || nextDir === OPPOSITE[lastPlanned]) return;
    if (queueRef.current.length < 2) {
      queueRef.current.push(nextDir);
    } else {
      queueRef.current[1] = nextDir;
    }
  }, [startGame]);

  const tick = useCallback(() => {
    if (phaseRef.current !== 'playing') return;

    const queued = queueRef.current.shift();
    if (queued && queued !== OPPOSITE[dirRef.current]) {
      dirRef.current = queued;
    }

    const snake = snakeRef.current;
    const delta = DIR_DELTA[dirRef.current];
    let nx = snake[0]!.x + delta.x;
    let ny = snake[0]!.y + delta.y;

    if (wrapRef.current) {
      nx = (nx + GRID) % GRID;
      ny = (ny + GRID) % GRID;
    } else if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) {
      phaseRef.current = 'over';
      setPhase('over');
      syncBest(scoreRef.current);
      playArcadeCue('lose');
      draw();
      return;
    }

    const eatingApple = nx === foodRef.current.x && ny === foodRef.current.y;
    const eatingBonus = bonusRef.current !== null && nx === bonusRef.current.pos.x && ny === bonusRef.current.pos.y;

    const bodyCheckLength = eatingApple ? snake.length : snake.length - 1;
    for (let i = 0; i < bodyCheckLength; i++) {
      if (snake[i]!.x === nx && snake[i]!.y === ny) {
        phaseRef.current = 'over';
        setPhase('over');
        syncBest(scoreRef.current);
        playArcadeCue('lose');
        draw();
        return;
      }
    }

    const nextSnake = [{ x: nx, y: ny }, ...snake];
    if (!eatingApple) nextSnake.pop();
    snakeRef.current = nextSnake;

    if (eatingApple) {
      applesRef.current += 1;
      scoreRef.current += 10;
      setScore(scoreRef.current);
      setLength(nextSnake.length);
      syncBest(scoreRef.current);
      playArcadeCue('eat');

      const occupied = bonusRef.current ? [...nextSnake, bonusRef.current.pos] : nextSnake;
      const nextFood = randomFreeCell(occupied);
      if (!nextFood) {
        phaseRef.current = 'over';
        setPhase('over');
        playArcadeCue('win');
        draw();
        return;
      }
      foodRef.current = nextFood;

      if (applesRef.current % 5 === 0 && !bonusRef.current) {
        const bonusPos = randomFreeCell([...nextSnake, nextFood]);
        if (bonusPos) {
          bonusRef.current = { pos: bonusPos, ttl: 36, maxTtl: 36 };
          setBonusPct(100);
        }
      }
    }

    if (eatingBonus && bonusRef.current) {
      scoreRef.current += 30;
      setScore(scoreRef.current);
      syncBest(scoreRef.current);
      bonusRef.current = null;
      setBonusPct(0);
      playArcadeCue('bonus');
    } else if (bonusRef.current) {
      bonusRef.current.ttl -= 1;
      if (bonusRef.current.ttl <= 0) {
        bonusRef.current = null;
        setBonusPct(0);
      } else {
        setBonusPct(Math.round((bonusRef.current.ttl / bonusRef.current.maxTtl) * 100));
      }
    }

    draw();
  }, [draw, syncBest]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(tick, SPEEDS[speed].ms);
    return () => clearInterval(id);
  }, [phase, speed, tick]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (document.querySelector('#start-menu-panel:not([hidden]), #topbar-start-menu-panel:not([hidden])')) return;

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault();
          queueDirection('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault();
          queueDirection('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault();
          queueDirection('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault();
          queueDirection('right');
          break;
        case ' ':
          event.preventDefault();
          if (phaseRef.current === 'ready' || phaseRef.current === 'over') startGame();
          else togglePause();
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
  }, [queueDirection, startGame, togglePause]);

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
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) queueDirection(dx > 0 ? 'right' : 'left');
    else queueDirection(dy > 0 ? 'down' : 'up');
  };

  return (
    <div className="arcade-host" ref={hostRef} data-game="snake" data-phase={phase}>
      <div className="arcade-toolbar">
        <div className="arcade-segmented" role="group" aria-label="Speed">
          {(Object.entries(SPEEDS) as Array<[SpeedKey, { label: string; ms: number }]>).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              className="arcade-chip"
              aria-pressed={speed === key}
              onClick={() => setSpeed(key)}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div className="mine-toolbar-right">
          <button
            type="button"
            className="arcade-chip"
            aria-pressed={wrapWalls}
            onClick={() => setWrapWalls((current) => !current)}
          >
            {wrapWalls ? 'Walls: Wrap' : 'Walls: Solid'}
          </button>
        </div>
      </div>

      <div className="arcade-split">
        <div className="arcade-stage-panel">
          <div
            className="arcade-canvas-wrap"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              className="arcade-canvas"
              width={BOARD_SIZE}
              height={BOARD_SIZE}
              aria-label="Snake board"
            />

            {phase !== 'playing' && (
              <div className="arcade-overlay" data-snake-overlay={phase}>
                <h2 className="arcade-overlay-title">
                  {phase === 'ready' ? 'SNAKE' : phase === 'paused' ? 'PAUSED' : 'GAME OVER'}
                </h2>
                <p className="arcade-overlay-sub">
                  {phase === 'ready'
                    ? 'Every 5th apple spawns a timed +30 bonus star fruit'
                    : phase === 'paused'
                      ? 'Press Space or P to resume'
                      : `Final Score ${score} · Length ${length}`}
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

          {bonusPct > 0 && (
            <div className="snake-bonus-bar" role="status">
              <span>★ Bonus +30</span>
              <div className="snake-bonus-track">
                <div className="snake-bonus-fill" style={{ width: `${bonusPct}%` }} />
              </div>
            </div>
          )}

          <div className="arcade-touch-pad" aria-label="Touch direction pad">
            <div className="arcade-dpad">
              <span />
              <ButtonBase className="arcade-dpad-btn" aria-label="Up" onClick={() => queueDirection('up')}>▲</ButtonBase>
              <span />
              <ButtonBase className="arcade-dpad-btn" aria-label="Left" onClick={() => queueDirection('left')}>◀</ButtonBase>
              <ButtonBase className="arcade-dpad-btn" aria-label="Down" onClick={() => queueDirection('down')}>▼</ButtonBase>
              <ButtonBase className="arcade-dpad-btn" aria-label="Right" onClick={() => queueDirection('right')}>▶</ButtonBase>
            </div>
          </div>
        </div>

        <aside className="arcade-side" aria-label="Game stats and controls">
          <div className="arcade-card">
            <p className="arcade-card-title">Scoreboard</p>
            <div className="arcade-stat-grid">
              <div className="arcade-stat">
                <span>Score</span>
                <strong data-snake-score>{score}</strong>
              </div>
              <div className="arcade-stat">
                <span>Best</span>
                <strong data-snake-best>{best}</strong>
              </div>
              <div className="arcade-stat">
                <span>Length</span>
                <strong data-snake-length>{length}</strong>
              </div>
              <div className="arcade-stat">
                <span>Mode</span>
                <strong>{wrapWalls ? 'Wrap' : 'Classic'}</strong>
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
              <li><span>Steer</span><kbd>↑↓←→ / WASD</kbd></li>
              <li><span>Start / Pause</span><kbd>Space / P</kbd></li>
              <li><span>Quick reset</span><kbd>R</kbd></li>
              <li><span>Touch</span><kbd>Swipe board</kbd></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
