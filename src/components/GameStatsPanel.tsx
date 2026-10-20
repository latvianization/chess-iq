import React from 'react';
import { AnalyzedGame, MoveClassification } from '../types/chess';
import { CLASSIFICATION_CONFIG } from './Chessboard';
import { Award, Zap, AlertCircle, Clock } from 'lucide-react';

interface GameStatsPanelProps {
  game: AnalyzedGame;
  userColor: 'w' | 'b';
}

export const GameStatsPanel: React.FC<GameStatsPanelProps> = ({ game, userColor }) => {
  const isUserWhite = userColor === 'w';
  const userPlayer = isUserWhite ? game.white : game.black;
  const oppPlayer = isUserWhite ? game.black : game.white;
  const userElo = isUserWhite ? game.whiteElo : game.blackElo;
  const oppElo = isUserWhite ? game.blackElo : game.whiteElo;

  const keyClassifications: MoveClassification[] = [
    'brilliant',
    'great',
    'best',
    'excellent',
    'inaccuracy',
    'mistake',
    'blunder',
  ];

  return (
    <div className="w-full flex flex-col gap-3 rounded-2xl bg-[#262421] border border-[#36332e] p-4 shadow-lg select-none">
      {/* Header Row: Players, Result & Elo */}
      <div className="flex items-center justify-between gap-2 border-b border-[#36332e] pb-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full border border-white/20 ${
                userColor === 'w' ? 'bg-white' : 'bg-[#18181b]'
              }`}
            />
            <span className="font-bold text-sm sm:text-base text-white truncate max-w-[160px] sm:max-w-[220px]">
              {userPlayer}
            </span>
            <span className="text-xs font-mono font-medium text-[#9c978f] tabular-nums">
              ({userElo})
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-3 h-3 rounded-full border border-white/20 ${
                userColor === 'w' ? 'bg-[#18181b]' : 'bg-white'
              }`}
            />
            <span className="font-medium text-xs sm:text-sm text-[#c7c4c0] truncate max-w-[160px] sm:max-w-[220px]">
              {oppPlayer}
            </span>
            <span className="text-[11px] font-mono text-[#78746c] tabular-nums">
              ({oppElo})
            </span>
          </div>
        </div>

        {/* Game Result & ECO Tag */}
        <div className="flex flex-col items-end">
          <span className="text-sm sm:text-base font-black font-mono tracking-wider text-amber-400">
            {game.result}
          </span>
          <span className="text-[11px] text-[#8e8a83] truncate max-w-[140px] text-right">
            {game.ecoCode} · {game.ecoName}
          </span>
        </div>
      </div>

      {/* Accuracy & Estimated Elo Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* User Accuracy */}
        <div className="flex flex-col p-2.5 rounded-xl bg-[#1c1b18] border border-[#322f2a]">
          <span className="text-[11px] text-[#8e8a83] font-medium">Your Accuracy</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-400">
              {game.userAccuracy}%
            </span>
          </div>
        </div>

        {/* Estimated Game Performance Elo */}
        <div className="flex flex-col p-2.5 rounded-xl bg-[#1c1b18] border border-[#322f2a]">
          <span className="text-[11px] text-[#8e8a83] font-medium flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            <span>Estimated Elo</span>
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-amber-300">
              {game.overallGameElo}
            </span>
          </div>
        </div>

        {/* Opponent Accuracy */}
        <div className="flex flex-col p-2.5 rounded-xl bg-[#1c1b18] border border-[#322f2a]">
          <span className="text-[11px] text-[#8e8a83] font-medium">Opponent Acc.</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#a8a49e]">
              {game.opponentAccuracy}%
            </span>
          </div>
        </div>

        {/* Average Centipawn Loss */}
        <div className="flex flex-col p-2.5 rounded-xl bg-[#1c1b18] border border-[#322f2a]">
          <span className="text-[11px] text-[#8e8a83] font-medium">Avg ACPL</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-sky-400">
              {Math.round(game.phaseAcpl.overall)}
            </span>
            <span className="text-[10px] text-[#78746c]">cp</span>
          </div>
        </div>
      </div>

      {/* Phase Performance Elos: Opening, Middlegame, Endgame */}
      <div className="flex flex-col p-3 rounded-xl bg-[#1e1c19] border border-[#36332e]/80">
        <span className="text-[11px] uppercase tracking-wider font-bold text-[#8a867f] mb-2">
          Phase Performance Elo Breakdown
        </span>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#9c978f]">Opening</span>
            <span className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
              {game.openingElo ? game.openingElo : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col border-x border-[#36332e]">
            <span className="text-[10px] text-[#9c978f]">Middlegame</span>
            <span className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
              {game.middlegameElo ? game.middlegameElo : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#9c978f]">Endgame</span>
            <span className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
              {game.endgameElo ? game.endgameElo : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Move Classification Badges Counts */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {keyClassifications.map((type) => {
          const cfg = CLASSIFICATION_CONFIG[type];
          const count = game.counts[type] || 0;
          return (
            <div
              key={type}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a1916] border border-[#322f2a] text-xs font-mono"
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: cfg.bg, color: cfg.text }}
              >
                {cfg.label}
              </span>
              <span className="text-[#a8a49e] text-[11px]">{cfg.name}:</span>
              <span className="font-bold text-white tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Time Management Warnings: Impulsive vs Time Trouble */}
      {(game.impulsiveBlunders > 0 || game.timeTroubleBlunders > 0) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Time Diagnostics:</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            {game.impulsiveBlunders > 0 && (
              <span className="text-rose-300">
                ⚡ <strong>{game.impulsiveBlunders}</strong> Impulsive (&lt;2s)
              </span>
            )}
            {game.timeTroubleBlunders > 0 && (
              <span className="text-amber-300">
                ⏳ <strong>{game.timeTroubleBlunders}</strong> Time Trouble (&lt;20s)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
