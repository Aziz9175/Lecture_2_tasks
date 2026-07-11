import { useEffect, useState, useRef, useId } from 'react';
import { Position, Food, Particle, Portal, GameMode, LeaderboardEntry, FoodType } from './types';
import { GameBoard } from './components/GameBoard';
import { ScoreBoard } from './components/ScoreBoard';
import { GameControls } from './components/GameControls';
import { SettingsPanel } from './components/SettingsPanel';
import { Leaderboard } from './components/Leaderboard';
import { audio } from './utils/audio';

// Constants
const GRID_SIZE = 24;

const FOOD_CONFIGS: Record<FoodType, { points: number; color: string; glowColor: string }> = {
  REGULAR: { points: 1, color: '#22c55e', glowColor: '#10b981' }, // Neon Green
  GOLDEN: { points: 10, color: '#f59e0b', glowColor: '#fbbf24' }, // Pure Gold
  SPEED_BOOST: { points: 2, color: '#f97316', glowColor: '#ea580c' }, // Speed Orange
  SLOW_MO: { points: 2, color: '#06b6d4', glowColor: '#0891b2' }, // Frost Cyan
  SHIELD: { points: 2, color: '#ec4899', glowColor: '#db2777' }, // Magic Pink
};

export default function App() {
  const [snake, setSnake] = useState<Position[]>([
    { x: 12, y: 12 },
    { x: 12, y: 13 },
    { x: 12, y: 14 },
  ]);
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [nextDirection, setNextDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [foods, setFoods] = useState<Food[]>([]);
  const [obstacles, setObstacles] = useState<Position[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Game statuses
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');
  const [speedLevel, setSpeedLevel] = useState<'SLOW' | 'NORMAL' | 'FAST'>('NORMAL');

  // Audio mute state
  const [isMuted, setIsMuted] = useState(true);

  // Monitor iframe focus state
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  // Power-up management
  const [activePowerUp, setActivePowerUp] = useState<FoodType | null>(null);
  const [powerUpDuration, setPowerUpDuration] = useState(0); // 0 to 1 value (progress)
  const powerUpTimeoutRef = useRef<number | null>(null);
  const powerUpTimerStepRef = useRef<number | null>(null);

  // Leaderboard lists
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showScoreInput, setShowScoreInput] = useState(false);

  // Buffer references to manage game loop speeds
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const activePowerUpRef = useRef<FoodType | null>(null);
  const tickCounterRef = useRef(0);

  // Synchronizing Refs to solve stale closure bugs inside the game tick interval
  const foodsRef = useRef<Food[]>([]);
  const obstaclesRef = useRef<Position[]>([]);
  const portalsRef = useRef<Portal[]>([]);
  const gameModeRef = useRef<GameMode>('CLASSIC');
  const leaderboardRef = useRef<LeaderboardEntry[]>([]);
  const highScoreRef = useRef<number>(0);

  useEffect(() => {
    foodsRef.current = foods;
  }, [foods]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    portalsRef.current = portals;
  }, [portals]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    leaderboardRef.current = leaderboard;
  }, [leaderboard]);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  // Initialize Audio & Leaderboard
  useEffect(() => {
    levelRef.current = level;
    scoreRef.current = score;
    activePowerUpRef.current = activePowerUp;
  }, [level, score, activePowerUp]);

  useEffect(() => {
    // Read sound settings
    const mutedVal = audio.getMuteState();
    setIsMuted(mutedVal);

    // Read high scores & leaderboard
    try {
      const storedLeaderboard = localStorage.getItem('snake_game_leaderboard');
      if (storedLeaderboard) {
        setLeaderboard(JSON.parse(storedLeaderboard));
      }
      const storedHighScore = localStorage.getItem('snake_game_highscore');
      if (storedHighScore) {
        setHighScore(Number(storedHighScore));
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
  }, []);

  // Update Game Mode map items when mode changes
  useEffect(() => {
    if (!gameStarted) {
      resetGameSetup();
    }
  }, [gameMode, speedLevel]);

  // Manage refs for robust event listener sync without unbinding flicker
  const directionRef = useRef<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const nextDirectionRef = useRef<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const gameStartedRef = useRef(false);
  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);

  useEffect(() => {
    directionRef.current = direction;
    nextDirectionRef.current = nextDirection;
    gameStartedRef.current = gameStarted;
    isPausedRef.current = isPaused;
    isGameOverRef.current = isGameOver;
  }, [direction, nextDirection, gameStarted, isPaused, isGameOver]);

  // Handle keystroke keyboard controls and focus states
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    // Initial check
    setIsWindowFocused(document.hasFocus());

    const handleKeyDown = (e: KeyboardEvent) => {
      const { code, key } = e;
      const lowerKey = key.toLowerCase();
      const lowerCode = code.toLowerCase();

      // Always ensure we mark as focused on key activity
      setIsWindowFocused(true);

      // Check if it's a movement or action key to block default page scrolling
      const isActionKey = 
        ['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(lowerKey) ||
        ['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(lowerCode) ||
        ['w', 'a', 's', 'd'].includes(lowerKey);

      if (isActionKey) {
        e.preventDefault();
      }

      if (lowerKey === ' ' || lowerCode === 'space') {
        if (!gameStartedRef.current) {
          handleStart();
        } else if (isGameOverRef.current) {
          handleRestart();
        } else {
          handleTogglePause();
        }
        return;
      }

      if (!gameStartedRef.current || isPausedRef.current || isGameOverRef.current) return;

      const currentDir = directionRef.current;

      if (lowerKey === 'arrowup' || lowerCode === 'arrowup' || lowerKey === 'w') {
        if (currentDir !== 'DOWN') {
          setNextDirection('UP');
          nextDirectionRef.current = 'UP';
        }
      } else if (lowerKey === 'arrowdown' || lowerCode === 'arrowdown' || lowerKey === 's') {
        if (currentDir !== 'UP') {
          setNextDirection('DOWN');
          nextDirectionRef.current = 'DOWN';
        }
      } else if (lowerKey === 'arrowleft' || lowerCode === 'arrowleft' || lowerKey === 'a') {
        if (currentDir !== 'RIGHT') {
          setNextDirection('LEFT');
          nextDirectionRef.current = 'LEFT';
        }
      } else if (lowerKey === 'arrowright' || lowerCode === 'arrowright' || lowerKey === 'd') {
        if (currentDir !== 'LEFT') {
          setNextDirection('RIGHT');
          nextDirectionRef.current = 'RIGHT';
        }
      }
    };

    // Listen on both standard widow/document targets to maximize capture success Rate on laptop/previews
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  // Particle simulation loop - Updates the canvas effects at high FPS
  useEffect(() => {
    let active = true;
    let lastTime = performance.now();

    const updateParticles = (time: number) => {
      if (!active) return;

      setParticles((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((p) => {
            const nextLife = p.life - p.decay;
            return {
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vx: p.vx * 0.96, // physics drag
              vy: p.vy * 0.96,
              life: nextLife,
            };
          })
          .filter((p) => p.life > 0);
      });

      requestAnimationFrame(updateParticles);
    };

    requestAnimationFrame(updateParticles);
    return () => {
      active = false;
    };
  }, []);

  // Set up the core mechanical game step loop
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver) return;

    // Calculate current tick interval
    let baseSpeed = 100; // Retro standard (NORMAL)
    if (speedLevel === 'SLOW') baseSpeed = 160;
    if (speedLevel === 'FAST') baseSpeed = 65;

    // Scale up speed based on level achieved
    const levelSpeedModifier = Math.min(45, (level - 1) * 4);
    let speed = Math.max(40, baseSpeed - levelSpeedModifier);

    // Apply incremental scaling for SPEED_RUN mode
    if (gameMode === 'SPEED_RUN') {
      const itemsEatenFactor = Math.min(30, scoreRef.current * 1.5);
      speed = Math.max(38, speed - itemsEatenFactor);
    }

    // Apply active power up speed scaling
    if (activePowerUp === 'SPEED_BOOST') {
      speed = Math.round(speed / 1.35); // faster
    } else if (activePowerUp === 'SLOW_MO') {
      speed = Math.round(speed * 1.5); // slower
    }

    const intervalId = setInterval(() => {
      gameTick();
    }, speed);

    return () => clearInterval(intervalId);
  }, [gameStarted, isPaused, isGameOver, level, speedLevel, gameMode, activePowerUp]);

  // Reset/Initialize map entities cleanly
  const resetGameSetup = () => {
    // Snake center position
    setSnake([
      { x: 12, y: 10 },
      { x: 12, y: 11 },
      { x: 12, y: 12 },
    ]);
    setDirection('UP');
    setNextDirection('UP');
    directionRef.current = 'UP';
    nextDirectionRef.current = 'UP';
    setIsGameOver(false);
    setIsPaused(false);
    setShowScoreInput(false);
    setParticles([]);

    // Clear active power ups
    cancelActivePowerup();

    // Spawn Game Mode specific things
    const spawnedObstacles: Position[] = [];
    const activeMode = gameModeRef.current;
    if (activeMode === 'OBSTACLES') {
      // Generate block nodes on the board (e.g. four symmetric corner pillars)
      const pillars = [
        { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 5 },
        { x: 18, y: 5 }, { x: 18, y: 6 }, { x: 17, y: 5 },
        { x: 5, y: 18 }, { x: 5, y: 17 }, { x: 6, y: 18 },
        { x: 18, y: 18 }, { x: 18, y: 17 }, { x: 17, y: 18 },
        { x: 12, y: 5 }, { x: 12, y: 19 },
      ];
      spawnedObstacles.push(...pillars);
    }
    obstaclesRef.current = spawnedObstacles;
    setObstacles(spawnedObstacles);

    // Generate Portals
    const spawnedPortals: Portal[] = [];
    if (activeMode === 'PORTALS') {
      spawnedPortals.push({
        entrance: { x: 4, y: 12 },
        exit: { x: 19, y: 12 },
        color: '#f97316',
      });
      spawnedPortals.push({
        entrance: { x: 12, y: 4 },
        exit: { x: 12, y: 19 },
        color: '#06b6d4',
      });
    }
    portalsRef.current = spawnedPortals;
    setPortals(spawnedPortals);

    // Generate first batch of foods
    generateStartingFood(spawnedObstacles, spawnedPortals);
  };

  const generateStartingFood = (obs: Position[], ports: Portal[]) => {
    const list: Food[] = [];
    // Regular initial food
    const f1 = makeRandomFood('REGULAR', [{ x: 12, y: 10 }, { x: 12, y: 11 }, { x: 12, y: 12 }], obs, ports, list);
    if (f1) list.push(f1);
    
    // Add an extra berry for fuller boards in portals
    const activeMode = gameModeRef.current;
    if (activeMode === 'PORTALS' || activeMode === 'SPEED_RUN') {
      const f2 = makeRandomFood('REGULAR', [{ x: 12, y: 10 }, { x: 12, y: 11 }, { x: 12, y: 12 }], obs, ports, list);
      if (f2) list.push(f2);
    }

    foodsRef.current = list;
    setFoods(list);
  };

  const makeRandomFood = (
    type: FoodType,
    currentSnake: Position[],
    currentObs: Position[],
    currentPorts: Portal[],
    existingFoods: Food[]
  ): Food | null => {
    let attempts = 0;
    while (attempts < 200) {
      attempts++;
      const pos: Position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };

      // Check collision with snake
      const onSnake = currentSnake.some((s) => s.x === pos.x && s.y === pos.y);
      if (onSnake) continue;

      // Check obstacles
      const onObstacle = currentObs.some((o) => o.x === pos.x && o.y === pos.y);
      if (onObstacle) continue;

      // Check portals
      const onPortal = currentPorts.some(
        (p) =>
          (p.entrance.x === pos.x && p.entrance.y === pos.y) ||
          (p.exit.x === pos.x && p.exit.y === pos.y)
      );
      if (onPortal) continue;

      // Check existing food
      const onFood = existingFoods.some((f) => f.position.x === pos.x && f.position.y === pos.y);
      if (onFood) continue;

      // Safe coordinate found, create config
      const conf = FOOD_CONFIGS[type];
      return {
        position: pos,
        type,
        points: conf.points,
        color: conf.color,
        glowColor: conf.glowColor,
      };
    }
    return null;
  };

  // Sound handlers
  const handleToggleMute = () => {
    const isMutedNow = audio.toggleMute();
    setIsMuted(isMutedNow);
  };

  const handleStart = () => {
    audio.playEatRegular(); // Test/Trigger Audio Context creation safely via gesture
    setGameStarted(true);
    resetGameSetup();
    setScore(0);
    setLevel(1);
  };

  const handleTogglePause = () => {
    setIsPaused((p) => !p);
  };

  const handleRestart = () => {
    resetGameSetup();
    setScore(0);
    setLevel(1);
    setGameStarted(true);
  };

  const handleDirectionChange = (newDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    setNextDirection(newDir);
    nextDirectionRef.current = newDir;
  };

  const handleStopGame = () => {
    setGameStarted(false);
    setIsPaused(false);
    setIsGameOver(false);
    setScore(0);
    resetGameSetup();
  };

  // Standard step tick of the game state
  const gameTick = () => {
    setSnake((prevSnake) => {
      if (prevSnake.length === 0) return prevSnake;

      // Get head, update move direction
      const currentHead = prevSnake[0];
      const activeDir = nextDirectionRef.current;
      setDirection(activeDir);
      directionRef.current = activeDir;

      let deltaX = 0;
      let deltaY = 0;

      switch (activeDir) {
        case 'UP':
          deltaY = -1;
          break;
        case 'DOWN':
          deltaY = 1;
          break;
        case 'LEFT':
          deltaX = -1;
          break;
        case 'RIGHT':
          deltaX = 1;
          break;
      }

      let nextX = currentHead.x + deltaX;
      let nextY = currentHead.y + deltaY;

      // Seamlessly wrap boundaries around to the opposite side of the board panel
      if (nextX < 0) nextX = GRID_SIZE - 1;
      if (nextX >= GRID_SIZE) nextX = 0;
      if (nextY < 0) nextY = GRID_SIZE - 1;
      if (nextY >= GRID_SIZE) nextY = 0;

      // Check special warp portals
      if (gameModeRef.current === 'PORTALS') {
        portalsRef.current.forEach((p) => {
          if (nextX === p.entrance.x && nextY === p.entrance.y) {
            nextX = p.exit.x;
            nextY = p.exit.y;
            audio.playEatSpecial();
            createBurst(nextX, nextY, '#f97316', 7);
          } else if (nextX === p.exit.x && nextY === p.exit.y) {
            nextX = p.entrance.x;
            nextY = p.entrance.y;
            audio.playEatSpecial();
            createBurst(nextX, nextY, '#06b6d4', 7);
          }
        });
      }

      // Verify Obstacle Crash
      if (gameModeRef.current === 'OBSTACLES') {
        const hitObs = obstaclesRef.current.some((o) => o.x === nextX && o.y === nextY);
        if (hitObs) {
          triggerCrash({ x: nextX, y: nextY });
          return prevSnake;
        }
      }

      // Verify Self Crash (body segment collision block except tail end which is moving out)
      const selfBite = prevSnake.slice(0, -1).some((s) => s.x === nextX && s.y === nextY);
      if (selfBite) {
        triggerCrash({ x: nextX, y: nextY });
        return prevSnake;
      }

      // Construct new head
      const newHead: Position = { x: nextX, y: nextY };
      const nextSnake = [newHead, ...prevSnake];

      // Check if food eaten
      let foodEatenIndex = -1;
      foodsRef.current.forEach((food, idx) => {
        if (food.position.x === nextX && food.position.y === nextY) {
          foodEatenIndex = idx;
        }
      });

      if (foodEatenIndex !== -1) {
        const eaten = foodsRef.current[foodEatenIndex];
        
        // Remove eaten food
        const nextFoods = foodsRef.current.filter((_, idx) => idx !== foodEatenIndex);

        // Sound & Particle Burst Effects
        createBurst(nextX, nextY, eaten.color, eaten.type === 'REGULAR' ? 14 : 24);
        
        let earnedPoints = eaten.points;
        if (activePowerUpRef.current === 'SPEED_BOOST') {
          earnedPoints *= 2; // double points!
        }

        // Add Points
        const newScore = scoreRef.current + earnedPoints;
        setScore(newScore);

        // Handle high score record persistence immediately
        if (newScore > highScoreRef.current) {
          setHighScore(newScore);
          try {
            localStorage.setItem('snake_game_highscore', String(newScore));
          } catch (e) {
            // Ignore storage write issues
          }
        }

        // Keep Level speed sync
        const nextLevel = Math.min(10, Math.floor(newScore / 25) + 1);
        if (nextLevel > levelRef.current) {
          setLevel(nextLevel);
          audio.playLevelUp();
          // Level up flash burst
          createBurst(GRID_SIZE / 2, GRID_SIZE / 2, '#a855f7', 40);
        }

        // Handle Custom Food effects
        if (eaten.type === 'REGULAR') {
          audio.playEatRegular();
        } else {
          // Special food (Golden, Speeds, Ice, Shield)
          audio.playEatSpecial();
          
          if (eaten.type === 'GOLDEN') {
            // Trim Tail by 2 items as special golden perk instead of normal growth
            if (nextSnake.length > 3) {
              nextSnake.pop();
              nextSnake.pop();
            }
          } else {
            // Trigger Active temporary Power-Up!
            triggerPowerUp(eaten.type);
          }
        }

        // Roll and respawn replacement food
        // Increase food count as game scores go higher to increase excitement!
        const targetFoodCount = newScore > 60 ? 3 : newScore > 30 ? 2 : 1;
        
        // Select matching replacement type
        const types: FoodType[] = ['REGULAR', 'REGULAR', 'REGULAR'];
        // Special rates
        const roll = Math.random();
        if (roll < 0.15) types.push('GOLDEN');
        else if (roll < 0.23) types.push('SPEED_BOOST');
        else if (roll < 0.31) types.push('SLOW_MO');
        else if (roll < 0.36) types.push('SHIELD');

        const chosenType = types[Math.floor(Math.random() * types.length)];
        
        while (nextFoods.length < targetFoodCount) {
          const fresh = makeRandomFood(chosenType, nextSnake, obstaclesRef.current, portalsRef.current, nextFoods);
          if (fresh) nextFoods.push(fresh);
          else break;
        }

        // Always ensure at least one food on core board
        if (nextFoods.length === 0) {
          const fallback = makeRandomFood('REGULAR', nextSnake, obstaclesRef.current, portalsRef.current, []);
          if (fallback) nextFoods.push(fallback);
        }

        foodsRef.current = nextFoods;
        setFoods(nextFoods);
      } else {
        // Standard non-food step, remove the tail end segment
        nextSnake.pop();
      }

      return nextSnake;
    });
  };

  // Special powerups activation routine
  const triggerPowerUp = (type: FoodType) => {
    cancelActivePowerup();
    audio.playPowerUp();
    setActivePowerUp(type);
    setPowerUpDuration(1.0);

    // Dynamic timer ticker
    let timeLeft = 1.0;
    const updateRate = 0.02; // Update progress bar every 160ms

    powerUpTimerStepRef.current = window.setInterval(() => {
      timeLeft -= updateRate;
      if (timeLeft <= 0) {
        cancelActivePowerup();
      } else {
        setPowerUpDuration(timeLeft);
      }
    }, 160); // 8 seconds total length duration (50 iterations)
  };

  const cancelActivePowerup = () => {
    if (powerUpTimerStepRef.current) {
      clearInterval(powerUpTimerStepRef.current);
      powerUpTimerStepRef.current = null;
    }
    setActivePowerUp(null);
    setPowerUpDuration(0);
  };

  // Handling standard collision crashes
  const triggerCrash = (crashPos?: Position) => {
    // If shield power-up is active, consume shield instead of dying!
    if (activePowerUpRef.current === 'SHIELD') {
      cancelActivePowerup();
      audio.playEatSpecial();
      // Brief particle shield burst
      const head = crashPos || snake[0];
      if (head) {
        createBurst(head.x, head.y, '#db2777', 15);
      }
      return;
    }

    // Normal physical crash (game over)
    audio.playCrash();
    audio.playGameOver();
    setIsGameOver(true);

    // Explosive color splash on head coordinate
    const headPos = crashPos || snake[0];
    if (headPos) {
      createBurst(headPos.x, headPos.y, '#f43f5e', 35);
    }

    // Check if score places on leaderboard
    const minEntryScore = leaderboardRef.current.length >= 5 ? leaderboardRef.current[leaderboardRef.current.length - 1].score : 0;
    if (scoreRef.current > minEntryScore || leaderboardRef.current.length < 5) {
      if (scoreRef.current > 0) {
        setShowScoreInput(true);
      }
    }
  };

  // Generate fancy particle physics explosion in place coordinates
  const createBurst = (gridX: number, gridY: number, color: string, qty: number) => {
    // Estimate absolute coords on visual canvas grid
    const wrapper = document.querySelector('canvas');
    if (!wrapper) return;
    const clientWidth = wrapper.width;
    const cellSize = clientWidth / GRID_SIZE;

    const absX = (gridX + 0.5) * cellSize;
    const absY = (gridY + 0.5) * cellSize;

    const newParticles: Particle[] = [];
    for (let i = 0; i < qty; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      newParticles.push({
        id: Math.random().toString(),
        x: absX,
        y: absY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * 3,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.035,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Saving name record scores to local list ledger
  const handleRecordScore = (name: string) => {
    const newEntry: LeaderboardEntry = {
      id: Math.random().toString(),
      name: name.toUpperCase().slice(0, 8),
      score: score,
      mode: gameMode,
      level: level,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    const nextLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // store top 10

    setLeaderboard(nextLeaderboard);
    setShowScoreInput(false);

    try {
      localStorage.setItem('snake_game_leaderboard', JSON.stringify(nextLeaderboard));
    } catch (e) {
      console.warn('Storage write error:', e);
    }
  };

  const clearLeaderboard = () => {
    setLeaderboard([]);
    try {
      localStorage.removeItem('snake_game_leaderboard');
    } catch (e) {
      // Ignored
    }
  };

  const appLayoutId = useId();

  return (
    <div id={appLayoutId} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 antialiased selection:bg-amber-600 selection:text-white">
      {/* Absolute maximum container size constraint */}
      <div className="w-full max-w-5xl flex flex-col gap-6 md:gap-8">
        
        {/* Header decoration */}
        <header id={`${appLayoutId}-header`} className="flex flex-col items-center justify-center text-center gap-1.5 py-2">
          <div className="inline-flex items-center gap-2 bg-amber-950/60 text-amber-400 font-mono text-[10px] tracking-widest font-bold px-3 py-1 rounded-full border border-amber-900/40 uppercase">
            🚀 Arcade Series
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-1">
            HUNGRY<span className="text-amber-500">SNAKE</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono max-w-md">
            Sleek high-refresh velocity grid. Engage portals, metal barriers, and epic scalar multipliers.
          </p>
        </header>

        {/* Master multi-column dashboard grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left panel column (Configs & High Scores lists) */}
          <section id={`${appLayoutId}-left-pane`} className="lg:col-span-4 flex flex-col gap-6">
            <SettingsPanel
              currentMode={gameMode}
              onModeChange={setGameMode}
              speedLevel={speedLevel}
              onSpeedChange={setSpeedLevel}
              disabled={gameStarted && !isGameOver}
            />

            <Leaderboard
              entries={leaderboard}
              onAddScore={handleRecordScore}
              showInput={showScoreInput}
              scoreToAdd={score}
              onClearLeaderboard={clearLeaderboard}
            />
          </section>

          {/* Central main action column (Visual GameBoard canvas and control panel) */}
          <section 
            id={`${appLayoutId}-center-pane`} 
            className="lg:col-span-5 flex flex-col items-center justify-start gap-4 cursor-pointer"
            onClick={() => {
              window.focus();
              setIsWindowFocused(true);
            }}
          >
            {/* Ambient keyboard focus warning banner */}
            {!isWindowFocused && (
              <div className="w-full bg-amber-950/90 text-amber-300 border border-amber-500/45 px-3 py-2.5 rounded-xl text-center text-xs font-mono animate-pulse shadow-lg">
                ⚠️ Keyboard Offline: <strong>Click screen</strong> to activate laptop arrow keys!
              </div>
            )}

            <div className="w-full relative">
              <GameBoard
                snake={snake}
                foods={foods}
                direction={direction}
                mode={gameMode}
                portals={portals}
                obstacles={obstacles}
                particles={particles}
                isGameOver={isGameOver}
                score={score}
                activePowerUp={activePowerUp}
                powerUpDuration={powerUpDuration}
              />
            </div>

            <GameControls
              onDirectionChange={handleDirectionChange}
              currentDirection={direction}
              isPaused={isPaused}
              isGameOver={isGameOver}
              isMuted={isMuted}
              onTogglePause={handleTogglePause}
              onRestart={handleRestart}
              onToggleMute={handleToggleMute}
              gameStarted={gameStarted}
              onStartGame={handleStart}
              onStopGame={handleStopGame}
            />
          </section>

          {/* Right panel column (Interactive score stats) */}
          <section id={`${appLayoutId}-right-pane`} className="lg:col-span-3 flex flex-col gap-6">
            <ScoreBoard
              score={score}
              highScore={highScore}
              level={level}
              mode={gameMode}
              activePowerUp={activePowerUp}
              powerUpTimeRemaining={powerUpDuration}
            />
          </section>

        </main>

        {/* Humblest micro credit footer */}
        <footer id={`${appLayoutId}-footer`} className="mt-8 text-center border-t border-slate-900/80 pt-6">
          <p className="text-[10px] font-mono text-slate-500">
            HUNGRY SNAKE ARCADE • WRITTEN IN TIED VITE REACT TYPESCRIPT • NO MOCK INFRASTRUCTURE
          </p>
        </footer>
      </div>
    </div>
  );
}
