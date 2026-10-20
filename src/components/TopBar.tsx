import React, { useState } from 'react';
import { BoardTheme } from '../types/chess';
import { Upload, Gauge, Bot, BookOpen, X, ChevronRight } from 'lucide-react';

interface TopBarProps {
  appMode: 'review' | 'bot';
  onChangeMode: (mode: 'review' | 'bot') => void;
  onOpenImport: () => void;
  isDeepReview: boolean;
  onToggleDeepReview: () => void;
  boardTheme: BoardTheme;
  onChangeTheme: (theme: BoardTheme) => void;
  hasActiveGame: boolean;
  onExitReview: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  appMode,
  onChangeMode,
  onOpenImport,
  isDeepReview,
  onToggleDeepReview,
  boardTheme,
  onChangeTheme,
  hasActiveGame,
  onExitReview,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <header className="static lg:sticky lg:top-0 z-40 w-full flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-2 sm:py-3 bg-[#181715]/95 backdrop-blur-md border-b border-[#2e2b26]">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onChangeMode('review');
          }}
          className="text-lg font-black tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-sm">
            ♟
          </span>
          <span>CHESS IQ</span>
        </a>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[#211f1c] border border-[#36332e]">
          <button
            onClick={() => onChangeMode('review')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              appMode === 'review'
                ? 'bg-[#2e2b26] text-white shadow-sm'
                : 'text-[#9c978f] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Review</span>
          </button>
          <button
            onClick={() => onChangeMode('bot')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              appMode === 'bot'
                ? 'bg-amber-500 text-black shadow-sm font-bold'
                : 'text-[#9c978f] hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Play Bots</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Navigation / Status */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-[#8e8a83] font-medium">
        <span>Instant Game Review</span>
        <span>·</span>
        <span>Concurrent Stockfish Engine</span>
        <span>·</span>
        <span>Performance Elo</span>
      </div>

      {/* Zone 3: Actions, Speed, Themes & Exit */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Exit Review Button (when reviewing) */}
        {appMode === 'review' && hasActiveGame && (
          <div className="relative">
            <button
              onClick={onExitReview}
              onMouseEnter={() => setActiveTooltip('exit')}
              onMouseLeave={() => setActiveTooltip(null)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#262421] border border-[#36332e] text-xs font-medium text-[#c7c4c0] hover:text-white hover:bg-[#322f2a] transition-all whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Review</span>
            </button>
            {activeTooltip === 'exit' && (
              <div className="absolute right-0 top-full mt-2 z-50 px-2.5 py-1.5 rounded-xl bg-[#1c1b18] border border-[#423e38] text-[11px] text-[#edebe9] shadow-2xl whitespace-nowrap pointer-events-none">
                Close current analysis and return to game hub
              </div>
            )}
          </div>
        )}

        {/* Speed Mode Toggle */}
        {appMode === 'review' && (
          <div className="relative">
            <button
              onClick={onToggleDeepReview}
              onMouseEnter={() => setActiveTooltip('speed')}
              onMouseLeave={() => setActiveTooltip(null)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#262421] border border-[#36332e] text-xs font-semibold text-[#c7c4c0] hover:text-white transition-all whitespace-nowrap"
            >
              <Gauge className={`w-3.5 h-3.5 ${isDeepReview ? 'text-purple-400' : 'text-emerald-400'}`} />
              <span>{isDeepReview ? 'Deep' : 'Fast'}</span>
            </button>
            {activeTooltip === 'speed' && (
              <div className="absolute right-0 top-full mt-2 z-50 px-2.5 py-1.5 rounded-xl bg-[#1c1b18] border border-[#423e38] text-[11px] text-[#edebe9] shadow-2xl whitespace-nowrap pointer-events-none">
                {isDeepReview ? 'Master Review (Stockfish Depth 18+ with Deep Calculation)' : 'Tournament Review (Stockfish Depth 16 with Tactical Quiescence)'}
              </div>
            )}
          </div>
        )}

        {/* Board Theme Selector */}
        <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded-xl bg-[#262421] border border-[#36332e]">
          {(['green', 'wood', 'icy'] as BoardTheme[]).map((t) => (
            <button
              key={t}
              onClick={() => onChangeTheme(t)}
              className={`w-4 h-4 rounded-full transition-transform ${
                boardTheme === t ? 'ring-2 ring-amber-400 scale-110' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: t === 'green' ? '#739552' : t === 'wood' ? '#b58863' : '#587a9f',
              }}
              title={`${t.charAt(0).toUpperCase() + t.slice(1)} board theme`}
            />
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-amber-500 rounded-xl hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/10 whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Game</span>
        </button>
      </div>
    </header>
  );
};
