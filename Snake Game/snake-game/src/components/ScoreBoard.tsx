import React, { useId } from 'react';
import { Award, Zap, Shield, HelpCircle, Flame, Star, Compass } from 'lucide-react';
import { GameMode } from '../types';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  level: number;
  mode: GameMode;
  activePowerUp: string | null;
  powerUpTimeRemaining: number; // in seconds or ratio
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  highScore,
  level,
  mode,
  activePowerUp,
  powerUpTimeRemaining,
}) => {
  // Get active powerup icon & badge details
  const getPowerUpDetails = () => {
    switch (activePowerUp) {
      case 'SPEED_BOOST':
        return {
          icon: <Flame className="w-4 h-4 text-orange-500 animate-pulse" />,
          label: 'Speed Surge (2x Points)',
          bg: 'bg-orange-950/75 border-orange-500/50 text-orange-400',
          progressBg: 'bg-orange-500',
        };
      case 'SLOW_MO':
        return {
          icon: <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />,
          label: 'Slow Motion',
          bg: 'bg-cyan-950/75 border-cyan-500/50 text-cyan-400',
          progressBg: 'bg-cyan-400',
        };
      case 'SHIELD':
        return {
          icon: <Shield className="w-4 h-4 text-pink-500 animate-pulse" />,
          label: 'Shield (Crash Protection)',
          bg: 'bg-pink-950/75 border-pink-500/50 text-pink-400',
          progressBg: 'bg-pink-500',
        };
      default:
        return null;
    }
  };

  const powerUp = getPowerUpDetails();
  const scoreBoardId = useId();

  return (
    <div id={scoreBoardId} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col gap-4">
      {/* Top row: Current score vs high score */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            Current Score
          </span>
          <span className="text-3xl font-bold font-mono text-white tracking-tight leading-none mt-1">
            {score}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            High Score
          </span>
          <span className="text-2xl font-bold font-mono text-yellow-400 tracking-tight leading-none mt-1">
            {highScore}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-800/80 my-0.5"></div>

      {/* Middle info bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/30">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Level</span>
          <span className="text-lg font-bold font-mono text-slate-200 mt-0.5">
            {level}
          </span>
        </div>

        <div className="flex flex-col bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/30">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Game Mode</span>
          <span className="text-xs font-bold font-mono text-amber-400 mt-1 truncate">
            {mode.replace('_', ' ')}
          </span>
        </div>

        <div className="flex flex-col bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/30">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Multiplier</span>
          <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {activePowerUp === 'SPEED_BOOST' ? 'x2.0' : 'x1.0'}
          </span>
        </div>
      </div>

      {/* Power up info with progress countdown */}
      {powerUp && (
        <div className={`p-3 rounded-xl border flex flex-col gap-2 ${powerUp.bg} transition-all duration-300 animate-slide-in`}>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold flex items-center gap-2">
              {powerUp.icon}
              {powerUp.label}
            </span>
            <span className="text-slate-400">
              {(powerUpTimeRemaining * 10).toFixed(1)}s
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-950/60 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${powerUp.progressBg} transition-all duration-100 ease-linear rounded-full`}
              style={{ width: `${powerUpTimeRemaining * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default ScoreBoard;
