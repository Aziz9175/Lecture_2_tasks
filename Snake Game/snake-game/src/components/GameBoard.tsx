import React, { useEffect, useRef, useState, useId } from 'react';
import { Position, Food, Particle, Portal, GameMode } from '../types';

interface GameBoardProps {
  snake: Position[];
  foods: Food[];
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  mode: GameMode;
  portals: Portal[];
  obstacles: Position[];
  particles: Particle[];
  isGameOver: boolean;
  score: number;
  activePowerUp: string | null;
  powerUpDuration: number; // 0 to 1 ratio
}

export const GameBoard: React.FC<GameBoardProps> = ({
  snake,
  foods,
  direction,
  mode,
  portals,
  obstacles,
  particles,
  isGameOver,
  score,
  activePowerUp,
  powerUpDuration,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 450, height: 450 });
  const animationFrameRef = useRef<number | null>(null);

  // Virtual grid size
  const GRID_SIZE = 24;

  // Track the absolute size of the wrapping container to scale the canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Keep it a perfect square or matching ratio, maximum fit
      const size = Math.max(280, Math.min(width, 480));
      setDimensions({ width: size, height: size });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Frame counter for animation calculations
  const frameCountRef = useRef(0);

  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      frameCountRef.current += 1;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const { width, height } = dimensions;
      const cellSize = width / GRID_SIZE;

      // Clear with dark atmospheric grid color background
      ctx.fillStyle = '#0f172a'; // Slate-900
      ctx.fillRect(0, 0, width, height);

      // Draw subtle neon grid background pattern
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)'; // Slate-800
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, height);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(width, i * cellSize);
        ctx.stroke();
      }

      // Draw grid borders with an amber cyber glow
      ctx.strokeStyle = activePowerUp ? 'rgba(245, 158, 11, 0.55)' : 'rgba(217, 119, 6, 0.38)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, width, height);

      // Draw Portals if in PORTALS mode
      if (mode === 'PORTALS') {
        portals.forEach((portal) => {
          const t = frameCountRef.current * 0.05;
          const pulse = Math.sin(t) * 2;

          // Portal entrance (Orange vortex)
          const entX = (portal.entrance.x + 0.5) * cellSize;
          const entY = (portal.entrance.y + 0.5) * cellSize;
          const pRadius = (cellSize / 2) * 0.8 + pulse * 0.5;

          const entGlow = ctx.createRadialGradient(entX, entY, pRadius * 0.2, entX, entY, pRadius * 1.5);
          entGlow.addColorStop(0, '#f97316');
          entGlow.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
          entGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');

          ctx.fillStyle = entGlow;
          ctx.beginPath();
          ctx.arc(entX, entY, pRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Portal inner ring
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(entX, entY, pRadius, t, t + Math.PI * 1.2);
          ctx.stroke();

          // Portal exit (Blue vortex)
          const extX = (portal.exit.x + 0.5) * cellSize;
          const extY = (portal.exit.y + 0.5) * cellSize;
          const extGlow = ctx.createRadialGradient(extX, extY, pRadius * 0.2, extX, extY, pRadius * 1.5);
          extGlow.addColorStop(0, '#06b6d4');
          extGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.6)');
          extGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');

          ctx.fillStyle = extGlow;
          ctx.beginPath();
          ctx.arc(extX, extY, pRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(extX, extY, pRadius, -t, -t + Math.PI * 1.2);
          ctx.stroke();
        });
      }

      // Draw Obstacles in OBSTACLES mode
      if (mode === 'OBSTACLES') {
        obstacles.forEach((obs) => {
          const x = obs.x * cellSize;
          const y = obs.y * cellSize;
          const padding = cellSize * 0.08;
          const size = cellSize - padding * 2;

          // Deep steel/warning pattern obstacle
          ctx.fillStyle = '#475569'; // Slate-600
          ctx.fillRect(x + padding, y + padding, size, size);

          // Danger boundary glow
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red-500 glow
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + padding, y + padding, size, size);

          // Warning stripe
          ctx.strokeStyle = '#f59e0b'; // Amber-500 stripes
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + padding + size * 0.2, y + padding + size * 0.8);
          ctx.lineTo(x + padding + size * 0.8, y + padding + size * 0.2);
          ctx.stroke();
        });
      }

      // Draw Foods
      foods.forEach((food) => {
        const foodX = (food.position.x + 0.5) * cellSize;
        const foodY = (food.position.y + 0.5) * cellSize;
        const pulse = 1 + Math.sin(frameCountRef.current * 0.15) * 0.12;
        const radius = (cellSize / 2) * 0.7 * pulse;

        // Draw radial glow under food
        const glowRad = radius * 2.2;
        const radialGlow = ctx.createRadialGradient(
          foodX,
          foodY,
          radius * 0.3,
          foodX,
          foodY,
          glowRad
        );
        radialGlow.addColorStop(0, food.glowColor);
        radialGlow.addColorStop(0.5, food.glowColor + '33'); // Transparent alpha
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(foodX, foodY, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Draw the distinct food geometry based on its type
        ctx.fillStyle = food.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = food.glowColor;

        if (food.type === 'REGULAR') {
          // Rounded berry/apple
          ctx.beginPath();
          ctx.arc(foodX, foodY, radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (food.type === 'GOLDEN') {
          // Pulsing luxury Star/diamond
          ctx.beginPath();
          ctx.moveTo(foodX, foodY - radius * 1.2);
          ctx.lineTo(foodX + radius, foodY);
          ctx.lineTo(foodX, foodY + radius * 1.2);
          ctx.lineTo(foodX - radius, foodY);
          ctx.closePath();
          ctx.fill();
        } else if (food.type === 'SPEED_BOOST') {
          // Fast lightning bolt shape or inverted triangle
          ctx.beginPath();
          ctx.moveTo(foodX, foodY - radius * 1.1);
          ctx.lineTo(foodX + radius * 0.8, foodY - radius * 0.1);
          ctx.lineTo(foodX + radius * 0.1, foodY + radius * 0.1);
          ctx.lineTo(foodX + radius * 0.5, foodY + radius * 1.1);
          ctx.lineTo(foodX - radius * 0.8, foodY + radius * 0.1);
          ctx.lineTo(foodX - radius * 0.1, foodY - radius * 0.1);
          ctx.closePath();
          ctx.fill();
        } else if (food.type === 'SLOW_MO') {
          // Ice bubble / Snowflake hexagonal shield shape
          ctx.strokeStyle = food.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + (frameCountRef.current * 0.03);
            const px = foodX + Math.cos(angle) * radius;
            const py = foodY + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
          // Soft solid core
          ctx.fillStyle = food.color + '66';
          ctx.fill();
        } else if (food.type === 'SHIELD') {
          // Shield badge/crystal
          ctx.beginPath();
          ctx.moveTo(foodX, foodY - radius * 1.1);
          ctx.lineTo(foodX + radius * 0.9, foodY - radius * 0.5);
          ctx.lineTo(foodX + radius * 0.8, foodY + radius * 0.5);
          ctx.lineTo(foodX, foodY + radius * 1.2);
          ctx.lineTo(foodX - radius * 0.8, foodY + radius * 0.5);
          ctx.lineTo(foodX - radius * 0.9, foodY - radius * 0.5);
          ctx.closePath();
          ctx.fill();
        }

        // Reset shadow
        ctx.shadowBlur = 0;
      });

      // Draw Snake body segments
      snake.forEach((segment, index) => {
        const isHead = index === 0;
        const x = segment.x * cellSize;
        const y = segment.y * cellSize;
        const padding = cellSize * (isHead ? 0.05 : 0.09);
        const size = cellSize - padding * 2;

        ctx.shadowBlur = isHead ? 15 : 0;
        // Different neon tail shading: fades along the length
        const pct = index / Math.max(1, snake.length - 1);
        
        let segmentColor = '#22c55e'; // default Green
        let glowColor = '#10b981';

        // Apply active power-up colors to snake skin!
        if (activePowerUp === 'SPEED_BOOST') {
          // Shimmering Golden/Orange neon
          segmentColor = `hsl(${(frameCountRef.current * 8 - index * 10) % 360}, 95%, 55%)`;
          glowColor = '#ff5722';
        } else if (activePowerUp === 'SLOW_MO') {
          // Snowy blue / frost cyan neon
          segmentColor = `hsl(${190 + Math.sin(frameCountRef.current * 0.1 - index * 0.2) * 20}, 95%, 60%)`;
          glowColor = '#06b6d4';
        } else if (activePowerUp === 'SHIELD') {
          // Royal magenta / amethyst purple glow
          segmentColor = `hsl(${300 + Math.sin(frameCountRef.current * 0.1 - index * 0.2) * 15}, 90%, 55%)`;
          glowColor = '#d946ef';
        } else {
          // Standard gorgeous gold-to-amber transition gradient representation
          const hue = 30 + (1 - pct) * 22; // 30 (deep orange) to 52 (golden yellow)
          segmentColor = `hsl(${hue}, 95%, 50%)`;
          glowColor = `hsl(${hue}, 100%, 45%)`;
        }

        ctx.shadowColor = glowColor;
        ctx.fillStyle = segmentColor;

        // Perfect circular nodes or beautiful capsules for sleek snake look
        ctx.beginPath();
        if (isHead) {
          // Smooth rounded rectangle for head oriented with moving direction
          const r = size * 0.45;
          ctx.roundRect(x + padding, y + padding, size, size, [r, r, r, r]);
          ctx.fill();

          // Render gorgeous tiny custom snake eyes!
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0; // eye should be crisp
          const eyeSize = cellSize * 0.15;
          const eyeOffset = cellSize * 0.22;

          let eye1 = { x: 0, y: 0 };
          let eye2 = { x: 0, y: 0 };

          if (direction === 'UP' || direction === 'DOWN') {
            const dy = direction === 'UP' ? -cellSize * 0.15 : cellSize * 0.15;
            eye1 = { x: x + cellSize / 2 - eyeOffset, y: y + cellSize / 2 + dy };
            eye2 = { x: x + cellSize / 2 + eyeOffset, y: y + cellSize / 2 + dy };
          } else {
            const dx = direction === 'LEFT' ? -cellSize * 0.15 : cellSize * 0.15;
            eye1 = { x: x + cellSize / 2 + dx, y: y + cellSize / 2 - eyeOffset };
            eye2 = { x: x + cellSize / 2 + dx, y: y + cellSize / 2 + eyeOffset };
          }

          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
          ctx.fill();

          // Pupils
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(eye1.x, eye1.y, eyeSize * 0.5, 0, Math.PI * 2);
          ctx.arc(eye2.x, eye2.y, eyeSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sleek trail beads
          const radius = (size / 2) * (1 - (pct * 0.3)); // taper slightly
          ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.shadowBlur = 0; // reset
      });

      // Draw Particles with simple frame-independent linear velocity and friction
      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        ctx.beginPath();
        // Particle fade
        ctx.globalAlpha = p.life;
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      // Draw Shield overlay aura if shield power-up is active
      if (activePowerUp === 'SHIELD' && snake.length > 0) {
        const head = snake[0];
        const hX = (head.x + 0.5) * cellSize;
        const hY = (head.y + 0.5) * cellSize;
        const radius = cellSize * 1.5;

        const pulse = 1 + Math.sin(frameCountRef.current * 0.2) * 0.08;
        const finalRadius = radius * pulse * powerUpDuration;

        ctx.strokeStyle = 'rgba(217, 70, 239, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(hX, hY, finalRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(217, 70, 239, 0.05)';
        ctx.beginPath();
        ctx.arc(hX, hY, finalRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Game Over overlay to signal end neatly on canvas
      if (isGameOver) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; // Soft overlay slate-900
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444'; // Red-500
        ctx.font = `bold ${Math.max(20, width * 0.07)}px system-ui, -apple-system, sans-serif`;
        ctx.fillText('GAME OVER', width / 2, height / 2 - 10);

        ctx.fillStyle = '#94a3b8'; // Slate-400
        ctx.font = `${Math.max(12, width * 0.035)}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(`Your Score: ${score}`, width / 2, height / 2 + 20);
        ctx.fillText('Press SPACE or RESTART to try again', width / 2, height / 2 + 45);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions, snake, foods, direction, mode, portals, obstacles, particles, isGameOver, score, activePowerUp, powerUpDuration]);

  const wrapperId = useId();

  return (
    <div
      id={wrapperId}
      ref={containerRef}
      className="w-full flex items-center justify-center p-2 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden"
    >
      <canvas
        id={`${wrapperId}-canvas`}
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block rounded-lg touch-none"
      />
    </div>
  );
};
export default GameBoard;
