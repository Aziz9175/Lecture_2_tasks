import React, { useState, useId } from 'react';
import { LeaderboardEntry, GameMode } from '../types';
import { Trophy, Calendar, Plus, User, Trash2 } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onAddScore: (name: string) => void;
  showInput: boolean;
  scoreToAdd: number;
  onClearLeaderboard?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  onAddScore,
  showInput,
  scoreToAdd,
  onClearLeaderboard,
}) => {
  const [nickName, setNickName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickName.trim().length > 0) {
      onAddScore(nickName.trim());
      setNickName('');
    }
  };

  const getRankBadgeAndStyles = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: 'bg-yellow-950/40 border-yellow-500/40 text-yellow-500',
          badge: '🥇',
        };
      case 1:
        return {
          bg: 'bg-slate-800/40 border-slate-400/40 text-slate-300',
          badge: '🥈',
        };
      case 2:
        return {
          bg: 'bg-amber-900/10 border-amber-700/30 text-amber-600',
          badge: '🥉',
        };
      default:
        return {
          bg: 'bg-slate-900/40 border-slate-800/50 text-slate-400',
          badge: `#${index + 1}`,
        };
    }
  };

  const leaderboardId = useId();

  return (
    <div id={leaderboardId} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col gap-4">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <h3 id={`${leaderboardId}-title`} className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Local Hall of Fame
        </h3>
        
        {onClearLeaderboard && entries.length > 0 && (
          <button
            id={`${leaderboardId}-clear-btn`}
            onClick={onClearLeaderboard}
            className="p-1 px-2.5 rounded-md hover:bg-slate-800 border border-slate-800/50 text-[10px] font-mono text-rose-500 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            title="Reset Leaderboard"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Input Form for new high score */}
      {showInput && (
        <form
          id={`${leaderboardId}-add-form`}
          onSubmit={handleSubmit}
          className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-xl flex flex-col gap-3 animate-pulse"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-amber-400 font-mono">
              ★ New High Score: {scoreToAdd} pts!
            </span>
            <span className="text-[10px] text-amber-300 font-mono">
              Claim your legacy in the arcade ledger.
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                id={`${leaderboardId}-name-input`}
                type="text"
                placeholder="YOUR INITIALS"
                maxLength={10}
                required
                value={nickName}
                onChange={(e) => setNickName(e.target.value.toUpperCase())}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs font-mono text-white placeholder-slate-600 outline-none transition-colors"
              />
            </div>
            <button
               id={`${leaderboardId}-submit-btn`}
              type="submit"
              className="px-4 h-9 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              RECORD
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800/60 rounded-xl font-mono text-xs text-slate-500">
            No records logged yet. Be the first!
          </div>
        ) : (
          entries.map((entry, idx) => {
            const styles = getRankBadgeAndStyles(idx);
            return (
              <div
                id={`${leaderboardId}-entry-${idx}`}
                key={entry.id}
                className={`flex items-center justify-between p-2.5 border rounded-xl gap-2 font-mono text-xs ${styles.bg} transition-colors`}
              >
                <div id={`${leaderboardId}-entry-left-${idx}`} className="flex items-center gap-2.5 min-w-0">
                  {/* Badge */}
                  <span className="w-6 text-center select-none">{styles.badge}</span>
                  {/* Nickname & Mode detail */}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-200 truncate">{entry.name}</span>
                    <span className="text-[9px] text-slate-500 font-semibold truncate uppercase">
                      {entry.mode} • Lvl {entry.level}
                    </span>
                  </div>
                </div>

                {/* Score & Timing */}
                <div id={`${leaderboardId}-entry-right-${idx}`} className="flex flex-col items-end shrink-0">
                  <span className="font-bold text-slate-150">{entry.score} pts</span>
                  <span className="text-[8px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-2 h-2" />
                    {entry.date}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default Leaderboard;
