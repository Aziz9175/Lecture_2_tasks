import React, { useId } from 'react';
import { GameMode } from '../types';
import { Info, Sparkles, HelpCircle, Flame, Shield, Snowflake } from 'lucide-react';

interface SettingsPanelProps {
  currentMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  speedLevel: 'SLOW' | 'NORMAL' | 'FAST';
  onSpeedChange: (speed: 'SLOW' | 'NORMAL' | 'FAST') => void;
  disabled: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  currentMode,
  onModeChange,
  speedLevel,
  onSpeedChange,
  disabled,
}) => {
  const modesList: { value: GameMode; label: string; desc: string; color: string }[] = [
    {
      value: 'CLASSIC',
      label: 'Classic Mode',
      desc: 'The timeless grid. Boundaries cleanly wrap around to the opposite side.',
      color: 'border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500/50',
    },
    {
      value: 'OBSTACLES',
      label: 'Metal Barriers',
      desc: 'Dangerous brick structures appear. Watch your coordinates!',
      color: 'border-amber-500/30 text-amber-400 group-hover:border-amber-500/50',
    },
    {
      value: 'PORTALS',
      label: 'Warp Portals',
      desc: 'Step into Orange portal, materialize instantly at Cyan portal.',
      color: 'border-cyan-500/30 text-cyan-400 group-hover:border-cyan-500/50',
    },
    {
      value: 'SPEED_RUN',
      label: 'Terminal Speed',
      desc: 'Insane action. Base speed ramps up with every berry consumed!',
      color: 'border-rose-500/30 text-rose-400 group-hover:border-rose-500/50',
    },
  ];

  const panelId = useId();

  return (
    <div id={panelId} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col gap-5">
      {/* Game Mode Selection */}
      <div className="flex flex-col">
        <label id={`${panelId}-mode-label`} className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Choose Game Mode
        </label>
        
        {disabled && (
          <span className="text-[11px] font-mono text-zinc-500 italic mb-2">
            * Complete or reset active game to modify configuration settings.
          </span>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modesList.map((m) => {
            const isSelected = currentMode === m.value;
            return (
              <button
                id={`${panelId}-mode-${m.value.toLowerCase()}`}
                key={m.value}
                disabled={disabled}
                onClick={() => onModeChange(m.value)}
                className={`group text-left p-3 rounded-xl border transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 text-amber-200 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950 hover:border-slate-700 disabled:opacity-50 disabled:hover:bg-slate-950/40'
                } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div>
                  <h4 className="font-semibold text-xs text-slate-100">{m.label}</h4>
                  <p className="text-[10px] text-slate-400 leading-snug mt-1">{m.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-800/80 my-0.5"></div>

      {/* Difficulty / Initial Speed Selector */}
      <div className="flex flex-col">
        <label id={`${panelId}-speed-label`} className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-400" />
          General Difficulty Settings
        </label>
        
        <div className="flex gap-2.5 mt-1.5">
          {(['SLOW', 'NORMAL', 'FAST'] as const).map((level) => {
            const isSelected = speedLevel === level;
            return (
              <button
                id={`${panelId}-difficulty-${level.toLowerCase()}`}
                key={level}
                disabled={disabled}
                onClick={() => onSpeedChange(level)}
                className={`flex-1 py-2 rounded-lg border font-mono text-xs transition-all duration-150 ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:bg-slate-950 hover:border-slate-700 disabled:opacity-50'
                } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {level === 'SLOW' ? 'RELAXED' : level === 'NORMAL' ? 'RETRO' : 'INSANE'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-800/80 my-0.5"></div>

      {/* Powerups Legend */}
      <div className="flex flex-col">
        <label id={`${panelId}-powerups-label`} className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase mb-2.5 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Power-Ups Guide
        </label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/70 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-500"></span>
            <span className="text-slate-300">Berry (1 pt)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rotate-45 bg-yellow-400 shadow shadow-yellow-400"></span>
            <span className="text-slate-300">Golden (10 pts + cuts tail!)</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-300">Speed (2x Mult)</span>
          </div>
          <div className="flex items-center gap-2">
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">Frost (Slow-Mo)</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Shield className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-slate-300">Shield Aura (Survives 1 crash)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPanel;
