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
    keyMoment: 'Jump to next Brilliant move, Mistake, or Blunder',
    retryMistake: 'Rewind to position before this mistake and find best move',
    showWhy: "Step through engine's tactical continuation on the board",
    threat: "Invert turn to show opponent's immediate tactical threat",
    flip: 'Flip board orientation between White and Black',
  };

  return (
    <div className="w-full flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#262421] border border-[#36332e] shadow-lg relative select-none shrink-0">
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
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-xs hover:bg-amber-500/25 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Key Moment</span>
            </button>
            {activeTooltip === 'keyMoment' && (
              <div className="absolute left-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-[#1c1b18] border border-[#423e38] text-[11px] text-[#edebe9] shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                {TOOLTIPS.keyMoment}
              </div>
            )}
          </div>

          {/* Retry Mistake Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundService.playMove();
                onRetryMistake();
              }}
              onMouseEnter={() => setActiveTooltip('retryMistake')}
              onMouseLeave={() => setActiveTooltip(null)}
              disabled={!canRetry}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-semibold active:scale-95 transition-all whitespace-nowrap ${
                canRetry
                  ? 'bg-red-500/20 border-red-500/40 text-red-200 hover:bg-red-500/30 shadow-sm shadow-red-500/10 animate-pulse'
                  : 'bg-[#1e1c19] border-[#36332e] text-[#8e8a83] opacity-40 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Mistake</span>
            </button>
            {activeTooltip === 'retryMistake' && (
              <div className="absolute left-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-[#1c1b18] border border-[#423e38] text-[11px] text-[#edebe9] shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                {TOOLTIPS.retryMistake}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Show Why PV Continuation - Only shown if at least 2 steps exist */}
          {canShowWhy && (
            <div className="relative">
              <button
                type="button"
                onClick={onShowWhy}
                onMouseEnter={() => setActiveTooltip('showWhy')}
                onMouseLeave={() => setActiveTooltip(null)}
                disabled={isPlayingPv}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-medium active:scale-95 transition-all whitespace-nowrap ${
                  isPlayingPv
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-[#1e1c19] border-[#36332e] text-[#c7c4c0] hover:bg-[#2e2b26] hover:text-white'
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${isPlayingPv ? 'fill-white' : ''}`} />
                <span>Show Why</span>
              </button>
              {activeTooltip === 'showWhy' && (
                <div className="absolute right-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-[#1c1b18] border border-[#423e38] text-[11px] text-[#edebe9] shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
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
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border text-xs font-medium active:scale-95 transition-all whitespace-nowrap ${
                isThreatActive
                  ? 'bg-rose-500/25 border-rose-500 text-rose-300'
                  : 'bg-[#1e1c19] border-[#36332e] text-[#c7c4c0] hover:bg-[#2e2b26] hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Threat</span>
            </button>
            {activeTooltip === 'threat' && (
              <div className="absolute right-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-[#1c1b18] border border-[#423e38] text-[11px] text-[#edebe9] shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
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
              className="p-1.5 sm:p-2 rounded-xl bg-[#1e1c19] border border-[#36332e] text-[#c7c4c0] hover:bg-[#2e2b26] hover:text-white active:scale-95 transition-all"
              aria-label="Flip Board"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            {activeTooltip === 'flip' && (
              <div className="absolute right-0 bottom-full mb-2 z-40 px-2.5 py-1.5 rounded-xl bg-[#1c1b18] border border-[#423e38] text-[11px] text-[#edebe9] shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                {TOOLTIPS.flip}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom navigation row: Step controls */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#36332e]/60">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onGoToPly(0)}
            disabled={currentPly === 0}
            className="p-1.5 sm:p-2 rounded-xl text-[#a8a49e] hover:text-white hover:bg-[#322f2a] active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Start of game (↑)"
            aria-label="Start of game"
          >
            <ChevronFirst className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onGoToPly(Math.max(0, currentPly - 1))}
            disabled={currentPly === 0}
            className="p-1.5 sm:p-2 rounded-xl text-[#a8a49e] hover:text-white hover:bg-[#322f2a] active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Previous move (←)"
            aria-label="Previous move"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Move Counter */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#c0bcb5]">
          <span className="tabular-nums font-bold text-white">
            {currentPly === 0 ? 'Start' : `Ply ${currentPly}`}
          </span>
          <span className="text-[#6d6962]">/</span>
          <span className="tabular-nums text-[#8e8a83]">{totalPlies}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onGoToPly(Math.min(totalPlies, currentPly + 1))}
            disabled={currentPly >= totalPlies}
            className="p-1.5 sm:p-2 rounded-xl text-[#a8a49e] hover:text-white hover:bg-[#322f2a] active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Next move (→)"
            aria-label="Next move"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onGoToPly(totalPlies)}
            disabled={currentPly >= totalPlies}
            className="p-1.5 sm:p-2 rounded-xl text-[#a8a49e] hover:text-white hover:bg-[#322f2a] active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
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
