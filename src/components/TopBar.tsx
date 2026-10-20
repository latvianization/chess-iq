import React, { useState } from 'react';
import { BoardTheme } from '../types/chess';
import { Upload, Gauge, Bot, BookOpen, X, Sun, Moon } from 'lucide-react';

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
  isDarkMode?: boolean;
  onToggleThemeMode?: () => void;
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
  isDarkMode = false,
  onToggleThemeMode,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <header className="static lg:sticky lg:top-0 z-40 w-full flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-2.5 bg-white/95 dark:bg-[#181715]/95 backdrop-blur-md border-b-2 border-black/10 dark:border-[#2e2b26] transition-colors">
      {/* Zone 1: Wordmark & Mode Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onChangeMode('review');
          }}
          className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2 group"
        >
          <span className="w-7 h-7 rounded-xl bg-amber-400 flex items-center justify-center text-black font-black text-base border-2 border-black shadow-[2px_2px_0px_#000000] group-hover:scale-105 transition-transform">
            ⚡
          </span>
          <span className="flex items-center gap-1">
            <span>CHESS</span>
            <span className="text-amber-500 font-extrabold">TOON</span>
          </span>
        </a>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e]">
          <button
            type="button"
            onClick={() => onChangeMode('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              appMode === 'review'
                ? 'bg-amber-400 text-black border border-black shadow-[2px_2px_0px_#000000]'
                : 'text-zinc-600 dark:text-[#9c978f] hover:text-black dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Review</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('bot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              appMode === 'bot'
                ? 'bg-amber-400 text-black border border-black shadow-[2px_2px_0px_#000000]'
                : 'text-zinc-600 dark:text-[#9c978f] hover:text-black dark:hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>33 Bots</span>
          </button>
        </div>
      </div>

      {/* Zone 2: Navigation / Status Badge */}
      <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-[#8e8a83]">
        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-300/60">
          Comic Review
        </span>
        <span>•</span>
        <span>BOOM! & SPLAT! Badges</span>
        <span>•</span>
        <span>33 Tiered Bots</span>
      </div>

      {/* Zone 3: Actions, Speed, Themes, Dark/Light Toggle & Exit */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Exit Review Button */}
        {appMode === 'review' && hasActiveGame && (
          <div className="relative">
            <button
              type="button"
              onClick={onExitReview}
              onMouseEnter={() => setActiveTooltip('exit')}
              onMouseLeave={() => setActiveTooltip(null)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#262421] border border-zinc-300 dark:border-[#36332e] text-xs font-bold text-zinc-700 dark:text-[#c7c4c0] hover:text-black dark:hover:text-white hover:bg-zinc-200 transition-all whitespace-nowrap active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Review</span>
            </button>
            {activeTooltip === 'exit' && (
              <div className="absolute right-0 top-full mt-2 z-50 px-2.5 py-1.5 rounded-xl bg-black text-white text-[11px] font-bold shadow-2xl whitespace-nowrap pointer-events-none">
                Close current analysis
              </div>
            )}
          </div>
        )}

        {/* Speed Mode Toggle */}
        {appMode === 'review' && (
          <div className="relative">
            <button
              type="button"
              onClick={onToggleDeepReview}
              onMouseEnter={() => setActiveTooltip('speed')}
              onMouseLeave={() => setActiveTooltip(null)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#262421] border border-zinc-300 dark:border-[#36332e] text-xs font-bold text-zinc-700 dark:text-[#c7c4c0] hover:text-black dark:hover:text-white transition-all whitespace-nowrap active:scale-95"
            >
              <Gauge className={`w-3.5 h-3.5 ${isDeepReview ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>{isDeepReview ? 'Deep' : 'Fast'}</span>
            </button>
            {activeTooltip === 'speed' && (
              <div className="absolute right-0 top-full mt-2 z-50 px-2.5 py-1.5 rounded-xl bg-black text-white text-[11px] font-bold shadow-2xl whitespace-nowrap pointer-events-none">
                {isDeepReview ? 'Deep Engine (Depth 18+ with Full Lines)' : 'Tournament Speed (Depth 16 Engine)'}
              </div>
            )}
          </div>
        )}

        {/* Board Theme Palette */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#262421] border border-zinc-300 dark:border-[#36332e]">
          {(['green', 'wood', 'icy'] as BoardTheme[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChangeTheme(t)}
              className={`w-4 h-4 rounded-full transition-transform ${
                boardTheme === t ? 'ring-2 ring-amber-400 scale-110 shadow-sm' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: t === 'green' ? '#739552' : t === 'wood' ? '#b58863' : '#587a9f',
              }}
              title={`${t.charAt(0).toUpperCase() + t.slice(1)} board theme`}
            />
          ))}
        </div>

        {/* Light / Dark Mode Toggle */}
        {onToggleThemeMode && (
          <button
            type="button"
            onClick={onToggleThemeMode}
            className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#262421] border border-zinc-300 dark:border-[#36332e] flex items-center justify-center text-zinc-700 dark:text-amber-400 hover:text-black transition-all active:scale-95"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Color Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>
        )}

        {/* Primary CTA: Import Game */}
        <button
          type="button"
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-black bg-amber-400 rounded-xl hover:bg-amber-300 active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000000] transition-all whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
};
