import React, { useId } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Direction } from '../types';

interface GameControlsProps {
  onDirectionChange: (newDir: Direction) => void;
  currentDirection: Direction;
  isPaused: boolean;
  isGameOver: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  gameStarted: boolean;
  onStartGame: () => void;
  onStopGame?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onDirectionChange,
  currentDirection,
  isPaused,
  isGameOver,
  isMuted,
  onTogglePause,
  onRestart,
  onToggleMute,
  gameStarted,
  onStartGame,
  onStopGame,
}) => {
  const handleDpadPress = (dir: Direction) => {
    // Avoid running straight back into oneself
    if (
      (dir === 'UP' && currentDirection === 'DOWN') ||
      (dir === 'DOWN' && currentDirection === 'UP') ||
      (dir === 'LEFT' && currentDirection === 'RIGHT') ||
      (dir === 'RIGHT' && currentDirection === 'LEFT')
    ) {
      return;
    }
    onDirectionChange(dir);
  };

  const controlsId = useId();

  return (
    <div id={controlsId} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-5 items-center">
      {/* Primary Action Buttons */}
      <div className="w-full flex items-center justify-between gap-2.5">
        {/* Toggle Muted Sound */}
        <button
          id={`${controlsId}-mute-btn`}
          onClick={onToggleMute}
          className="p-3 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors duration-150 cursor-pointer active:scale-95"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
        </button>

        {/* Start / Pause / Stop game */}
        {!gameStarted ? (
          <button
            id={`${controlsId}-start-btn`}
            onClick={onStartGame}
            className="flex-1 max-w-[160px] h-12 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-medium text-white transition-all duration-150 shadow-lg shadow-amber-600/20 active:scale-95 cursor-pointer text-sm font-mono tracking-wider"
          >
            <Play className="w-4 h-4 fill-current" />
            START PLAY
          </button>
        ) : isGameOver ? (
          <div className="flex-1 flex gap-2">
            <button
              id={`${controlsId}-restart-btn`}
              onClick={onRestart}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-medium text-white transition-all duration-150 shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer text-xs font-mono tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESTART
            </button>
            {onStopGame && (
              <button
                id={`${controlsId}-stop-btn`}
                onClick={onStopGame}
                className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 text-rose-400 hover:bg-slate-800 transition-all duration-150 text-xs font-mono tracking-wider active:scale-95 cursor-pointer"
              >
                STOP
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex gap-2">
            <button
              id={`${controlsId}-pause-btn`}
              onClick={onTogglePause}
              className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-medium text-white transition-all duration-150 active:scale-95 cursor-pointer text-xs font-mono tracking-wider ${
                isPaused 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20' 
                  : 'bg-slate-950 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  RESUME
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  PAUSE
                </>
              )}
            </button>
            {onStopGame && (
              <button
                id={`${controlsId}-stop-btn`}
                onClick={onStopGame}
                className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 hover:bg-red-900/30 transition-all duration-150 text-xs font-mono tracking-wider active:scale-95 cursor-pointer"
              >
                STOP
              </button>
            )}
          </div>
        )}

        {/* Manual Restart */}
        <button
          id={`${controlsId}-manual-restart-btn`}
          onClick={onRestart}
          disabled={!gameStarted}
          className="p-3 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-slate-300 transition-colors duration-150 cursor-pointer active:scale-95"
          title="Restart Game"
        >
          <RotateCcw className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* Touch Screen Mobile D-Pad (Large, responsive, high accessibility touch targets >= 44px) */}
      <div className="w-full flex flex-col items-center select-none py-2 border-t border-slate-800/40">
        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-3 text-center">
          On-Screen D-Pad / Controls
        </span>
        
        {/* D-Pad Diamond Ring Shape */}
        <div className="relative w-40 h-40 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800/60 p-2 shadow-inner shadow-slate-950">
          {/* Centered static circle spacer */}
          <div className="absolute w-12 h-12 rounded-full bg-slate-900 border border-slate-800/55 z-10"></div>

          {/* D-Pad UP button */}
          <button
            id={`${controlsId}-dpad-up`}
            onClick={() => handleDpadPress('UP')}
            className={`absolute top-1 p-3 w-12 h-12 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer active:scale-90 ${
              currentDirection === 'UP'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            style={{ touchAction: 'manipulation' }}
            aria-label="Move Up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* D-Pad LEFT button */}
          <button
            id={`${controlsId}-dpad-left`}
            onClick={() => handleDpadPress('LEFT')}
            className={`absolute left-1 p-3 w-12 h-12 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer active:scale-90 ${
              currentDirection === 'LEFT'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            style={{ touchAction: 'manipulation' }}
            aria-label="Move Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* D-Pad RIGHT button */}
          <button
            id={`${controlsId}-dpad-right`}
            onClick={() => handleDpadPress('RIGHT')}
            className={`absolute right-1 p-3 w-12 h-12 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer active:scale-90 ${
              currentDirection === 'RIGHT'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            style={{ touchAction: 'manipulation' }}
            aria-label="Move Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* D-Pad DOWN button */}
          <button
            id={`${controlsId}-dpad-down`}
            onClick={() => handleDpadPress('DOWN')}
            className={`absolute bottom-1 p-3 w-12 h-12 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer active:scale-90 ${
              currentDirection === 'DOWN'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            style={{ touchAction: 'manipulation' }}
            aria-label="Move Down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Keyboard reminder layout details */}
      <div className="w-full text-center py-1 mt-1 border-t border-slate-800/40">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
          Keyboard Support
        </span>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-zinc-400">WASD</span>
            <span className="text-[10px] text-slate-500">or</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-zinc-400">ARROWS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-zinc-400">SPACE</span>
            <span className="text-[10px] text-slate-500">PAUSE / START</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GameControls;
