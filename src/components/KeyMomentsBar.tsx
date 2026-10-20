import React, { useState } from 'react';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Zap,
  RotateCcw,
  ShieldAlert,
  Play,
  RotateCw,
} from 'lucide-react';
import { soundService } from '../services/sound';

interface KeyMomentsBarProps {
  currentPly: number;
  totalPlies: number;
  onGoToPly: (ply: number) => void;
  onNextKeyMoment: () => void;
  onRetryMistake: () => void;
  onToggleThreat: () => void;
  onShowWhy: () => void;
  isThreatActive: boolean;
  isPlayingPv: boolean;
  canRetry: boolean;
  canShowWhy: boolean;
  hasKeyMoments: boolean;
  onFlipBoard: () => void;
}

export const KeyMomentsBar: React.FC<KeyMomentsBarProps> = ({
  currentPly,
  totalPlies,
  onGoToPly,
  onNextKeyMoment,
  onRetryMistake,
  onToggleThreat,
  onShowWhy,
  isThreatActive,
  isPlayingPv,
  canRetry,
  canShowWhy,
  hasKeyMoments,
  onFlipBoard,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const TOOLTIPS: Record<string, string> = {
    keyMoment: 'Jump to next Comic Key Moment (BOOM! or SPLAT!)',
    retryMistake: 'Rewind to position before this mistake and find best move',
    showWhy: "Step through engine's tactical continuation on the board",
    threat: "Invert turn to show opponent's immediate tactical threat",
    flip: 'Flip board orientation between White and Black',
  };

  return (
    <div className="w-full flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#262421] border-2 border-black/10 dark:border-[#36332e] shadow-sm relative select-none shrink-0 transition-colors">
      {/* Top action row: Tactical Tools */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Next Key Moment Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundService.playMove();
                onNextKeyMoment();
              }}
              onMouseEnter={() => setActiveTooltip('keyMoment')}
              onMouseLeave={() => setActiveTooltip(null)}
              disabled={!hasKeyMoments}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border border-black shadow-[1.5px_1.5px_0px_#000000] active:translate-y-0.5 transition-all disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-black text-black" />
              <span>Key Moment</span>
            </button>
            {activeTooltip === 'keyMoment' && (
              <div className="absolute left-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-black text-white text-[11px] font-bold shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                {TOOLTIPS.keyMoment}
              </div>
            )}
          </div>

          {/* Retry Mistake Button */}
          {canRetry && (
            <div className="relative">
              <button
                type="button"
                onClick={onRetryMistake}
                onMouseEnter={() => setActiveTooltip('retryMistake')}
                onMouseLeave={() => setActiveTooltip(null)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-orange-100 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-300 font-bold text-xs hover:bg-orange-200 active:scale-95 transition-all whitespace-nowrap animate-pulse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Move</span>
              </button>
              {activeTooltip === 'retryMistake' && (
                <div className="absolute left-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-black text-white text-[11px] font-bold shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                  {TOOLTIPS.retryMistake}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Show Why / Tactical Refutation */}
          {canShowWhy && (
            <div className="relative">
              <button
                type="button"
                onClick={onShowWhy}
                onMouseEnter={() => setActiveTooltip('showWhy')}
                onMouseLeave={() => setActiveTooltip(null)}
                disabled={isPlayingPv}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold active:scale-95 transition-all whitespace-nowrap ${
                  isPlayingPv
                    ? 'bg-blue-600 border-blue-700 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-[#1e1c19] border-zinc-200 dark:border-[#36332e] text-zinc-800 dark:text-[#c7c4c0] hover:bg-zinc-200 dark:hover:bg-[#2e2b26]'
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${isPlayingPv ? 'fill-white' : ''}`} />
                <span>Show Why</span>
              </button>
              {activeTooltip === 'showWhy' && (
                <div className="absolute right-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-black text-white text-[11px] font-bold shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                  {TOOLTIPS.showWhy}
                </div>
              )}
            </div>
          )}

          {/* Threat Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleThreat}
              onMouseEnter={() => setActiveTooltip('threat')}
              onMouseLeave={() => setActiveTooltip(null)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border text-xs font-bold active:scale-95 transition-all whitespace-nowrap ${
                isThreatActive
                  ? 'bg-rose-100 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300'
                  : 'bg-zinc-100 dark:bg-[#1e1c19] border-zinc-200 dark:border-[#36332e] text-zinc-800 dark:text-[#c7c4c0] hover:bg-zinc-200 dark:hover:bg-[#2e2b26]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Threat</span>
            </button>
            {activeTooltip === 'threat' && (
              <div className="absolute right-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-black text-white text-[11px] font-bold shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                {TOOLTIPS.threat}
              </div>
            )}
          </div>

          {/* Flip Board */}
          <div className="relative">
            <button
              type="button"
              onClick={onFlipBoard}
              onMouseEnter={() => setActiveTooltip('flip')}
              onMouseLeave={() => setActiveTooltip(null)}
              className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-[#1e1c19] border border-zinc-200 dark:border-[#36332e] text-zinc-700 dark:text-[#c7c4c0] hover:bg-zinc-200 dark:hover:bg-[#2e2b26] hover:text-black dark:hover:text-white active:scale-95 transition-all"
              aria-label="Flip Board"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            {activeTooltip === 'flip' && (
              <div className="absolute right-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-black text-white text-[11px] font-bold shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                {TOOLTIPS.flip}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom navigation row: Step controls */}
      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-zinc-200 dark:border-[#36332e]/60">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onGoToPly(0)}
            disabled={currentPly === 0}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-[#a8a49e] hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#322f2a] active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Start of game (↑)"
            aria-label="Start of game"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onGoToPly(Math.max(0, currentPly - 1))}
            disabled={currentPly === 0}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-[#a8a49e] hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#322f2a] active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Previous move (←)"
            aria-label="Previous move"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Move Counter */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-700 dark:text-[#c0bcb5]">
          <span className="tabular-nums font-black text-zinc-900 dark:text-white">
            {currentPly === 0 ? 'Start' : `Ply ${currentPly}`}
          </span>
          <span className="text-zinc-400 dark:text-[#6d6962]">/</span>
          <span className="tabular-nums text-zinc-500 dark:text-[#8e8a83]">{totalPlies}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onGoToPly(Math.min(totalPlies, currentPly + 1))}
            disabled={currentPly >= totalPlies}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-[#a8a49e] hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#322f2a] active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Next move (→)"
            aria-label="Next move"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onGoToPly(totalPlies)}
            disabled={currentPly >= totalPlies}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-[#a8a49e] hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#322f2a] active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="End of game (↓)"
            aria-label="End of game"
          >
            <ChevronLast className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
