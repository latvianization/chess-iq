import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { BoardTheme } from '../types/chess';
import { Chessboard } from './Chessboard';
import { BOTS_33, ComicBot, TIER_CONFIG, BotTier } from '../data/bots';
import { findBestMoveLocal } from '../services/engine';
import { soundService } from '../services/sound';
import confetti from 'canvas-confetti';
import {
  Bot,
  RotateCcw,
  Flag,
  Sparkles,
  Zap,
  Award,
  ChevronRight,
  User,
  Shield,
  Trophy,
  MessageSquare,
  Flame,
  ChevronLeft,
} from 'lucide-react';

interface PlayVsBotProps {
  theme: BoardTheme;
  isDarkMode?: boolean;
  onAnalyzeGame: (pgn: string, userColor: 'w' | 'b') => void;
  onExit: () => void;
}

export const PlayVsBot: React.FC<PlayVsBotProps> = ({
  theme,
  isDarkMode = false,
  onAnalyzeGame,
  onExit,
}) => {
  // Default to Elena (1200 Elo)
  const defaultBot = BOTS_33.find((b) => b.elo === 1200) || BOTS_33[16];
  const [selectedBot, setSelectedBot] = useState<ComicBot>(defaultBot);
  const [activeTier, setActiveTier] = useState<BotTier>(defaultBot.tier);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [chess] = useState(() => new Chess());
  const [currentFen, setCurrentFen] = useState(chess.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [historySans, setHistorySans] = useState<string[]>([]);

  // Personality Speech Bubble State
  const [botSpeech, setBotSpeech] = useState<string>(
    selectedBot.speech.onStart[0] || 'Ready when you are!'
  );
  const [speechKey, setSpeechKey] = useState<number>(0);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSpeech = (line: string) => {
    setBotSpeech(line);
    setSpeechKey((prev) => prev + 1);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => {
      // Keep speech visible
    }, 7000);
  };

  const getRandomLine = (lines: string[]): string => {
    if (!lines || lines.length === 0) return 'Hmm...';
    return lines[Math.floor(Math.random() * lines.length)];
  };

  // Start fresh game with chosen bot
  const handleStartGame = (bot: ComicBot, color: 'w' | 'b' = playerColor) => {
    setSelectedBot(bot);
    setActiveTier(bot.tier);
    setPlayerColor(color);
    chess.reset();
    setCurrentFen(chess.fen());
    setLastMove(null);
    setGameResult(null);
    setHistorySans([]);
    triggerSpeech(getRandomLine(bot.speech.onStart));

    if (color === 'b') {
      triggerBotMove(bot);
    }
  };

  // Bot move logic based on Elo difficulty
  const triggerBotMove = (bot = selectedBot) => {
    setIsBotThinking(true);

    const thinkingTime = Math.min(850, Math.max(350, Math.random() * 550));

    setTimeout(() => {
      if (chess.isGameOver()) {
        setIsBotThinking(false);
        return;
      }

      const legalMoves = chess.moves({ verbose: true });
      if (legalMoves.length === 0) {
        setIsBotThinking(false);
        checkGameOver(bot);
        return;
      }

      let chosenMove = legalMoves[0];

      // Decide if bot blunders based on bot.randomness
      const shouldBlunder = Math.random() < bot.randomness;

      if (shouldBlunder) {
        // Pick random legal move
        const randomIdx = Math.floor(Math.random() * legalMoves.length);
        chosenMove = legalMoves[randomIdx];
      } else {
        // Calculate best move using engine with bot depth
        const search = findBestMoveLocal(chess.fen(), bot.depth);
        if (search.bestMoveUci) {
          const match = legalMoves.find(
            (m) => `${m.from}${m.to}${m.promotion || ''}` === search.bestMoveUci
          );
          if (match) chosenMove = match;
        }
      }

      try {
        const moveRes = chess.move(chosenMove);
        if (moveRes) {
          if (moveRes.captured) {
            soundService.playCapture();
            // Bot captured user's piece - gloat with banter!
            triggerSpeech(getRandomLine(bot.speech.onUserBlunder));
          } else {
            soundService.playMove();
          }

          if (chess.inCheck()) {
            soundService.playCheck();
            triggerSpeech(getRandomLine(bot.speech.onBotCheck));
          }

          setCurrentFen(chess.fen());
          setLastMove({ from: moveRes.from, to: moveRes.to });
          setHistorySans(chess.history());
          checkGameOver(bot);
        }
      } catch (err) {
        console.error('Bot move error', err);
      } finally {
        setIsBotThinking(false);
      }
    }, thinkingTime);
  };

  const handlePlayerMove = (from: string, to: string) => {
    if (isBotThinking || gameResult) return;
    if (chess.turn() !== playerColor) return;

    try {
      const move = chess.move({
        from: from as Square,
        to: to as Square,
        promotion: 'q',
      });

      if (move) {
        let isPlayerCapture = Boolean(move.captured);
        if (isPlayerCapture) {
          soundService.playCapture();
          // User captured piece or delivered check: bot reacts!
          if (['q', 'r'].includes(move.captured || '')) {
            triggerSpeech(getRandomLine(selectedBot.speech.onUserGreat));
          }
        } else {
          soundService.playMove();
        }

        if (chess.inCheck()) {
          soundService.playCheck();
          triggerSpeech(getRandomLine(selectedBot.speech.onUserGreat));
        }

        setCurrentFen(chess.fen());
        setLastMove({ from, to });
        setHistorySans(chess.history());

        if (!checkGameOver(selectedBot)) {
          triggerBotMove();
        }
      }
    } catch {
      // Illegal move
    }
  };

  const checkGameOver = (bot = selectedBot): boolean => {
    if (chess.isGameOver()) {
      let res = 'Game Over';
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'Black' : 'White';
        res = `Checkmate · ${winner} Wins!`;
        if (
          (winner === 'White' && playerColor === 'w') ||
          (winner === 'Black' && playerColor === 'b')
        ) {
          soundService.playSuccess();
          triggerSpeech(getRandomLine(bot.speech.onBotLoss));
          try {
            confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
          } catch {}
        } else {
          soundService.playBlunder();
          triggerSpeech(getRandomLine(bot.speech.onBotWin));
        }
      } else if (chess.isDraw()) {
        res = 'Draw (Stalemate / Repetition)';
        triggerSpeech('A hard-fought draw! Respect to both of us!');
      }
      setGameResult(res);
      return true;
    }
    return false;
  };

  const handleResign = () => {
    const winner = playerColor === 'w' ? 'Black' : 'White';
    setGameResult(`Resigned · ${winner} (${selectedBot.name}) Wins`);
    triggerSpeech(getRandomLine(selectedBot.speech.onBotWin));
    soundService.playBlunder();
  };

  const handleTakeback = () => {
    if (isBotThinking) return;
    chess.undo();
    chess.undo();
    setCurrentFen(chess.fen());
    setGameResult(null);
    const hist = chess.history({ verbose: true });
    setHistorySans(chess.history());
    if (hist.length > 0) {
      const last = hist[hist.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
    triggerSpeech('Takeback granted! Make it count this time!');
    soundService.playMove();
  };

  const handleLaunchAnalysis = () => {
    const pgn = chess.pgn();
    if (!pgn || pgn.trim().length === 0) return;
    onAnalyzeGame(pgn, playerColor);
  };

  // Quick slider jump
  const handleEloSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetElo = parseInt(e.target.value, 10);
    const matchedBot = BOTS_33.find((b) => b.elo === targetElo);
    if (matchedBot) {
      handleStartGame(matchedBot, playerColor);
    }
  };

  const filteredBots = BOTS_33.filter((b) => b.tier === activeTier);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 select-none animate-in fade-in duration-200">
      {/* 33-BOT SELECTION ARENA HEADER */}
      <section className="flex flex-col gap-3.5 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black text-lg border-2 border-black shadow-[2px_2px_0px_#000000]">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                <span>33-BOT COMIC ARENA</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  50 Elo Steps
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#8e8a83]">
                Full Spectrum 400 to 2000 Elo with animated reactive personalities
              </p>
            </div>
          </div>

          {/* Quick Elo Slider */}
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-[#181715] px-3.5 py-2 rounded-2xl border border-zinc-200 dark:border-[#36332e]">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#8e8a83]">Elo:</span>
            <input
              type="range"
              min={400}
              max={2000}
              step={50}
              value={selectedBot.elo}
              onChange={handleEloSliderChange}
              className="w-32 sm:w-40 h-2 bg-zinc-200 dark:bg-[#36332e] rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-400 text-black shadow-sm">
              {selectedBot.elo}
            </span>
          </div>
        </div>

        {/* 4 TIER TABS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {(['rookie', 'challenger', 'hero', 'titan'] as BotTier[]).map((tierKey) => {
            const config = TIER_CONFIG[tierKey];
            const isActive = activeTier === tierKey;
            return (
              <button
                key={tierKey}
                onClick={() => {
                  setActiveTier(tierKey);
                  const firstOfTier = BOTS_33.find((b) => b.tier === tierKey);
                  if (firstOfTier) handleStartGame(firstOfTier, playerColor);
                }}
                type="button"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-black bg-amber-50 dark:bg-[#2c2824] shadow-[2px_2px_0px_#000000] dark:shadow-none'
                    : 'border-zinc-200 dark:border-[#36332e] bg-zinc-50 dark:bg-[#1a1816] hover:border-zinc-300'
                }`}
              >
                <span className="text-xl">{config.icon}</span>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {config.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-[#8e8a83] truncate font-mono">
                    {config.range}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* HORIZONTAL CAROUSEL OF BOTS IN ACTIVE TIER */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth">
          {filteredBots.map((bot) => {
            const isSelected = selectedBot.id === bot.id;
            return (
              <button
                key={bot.id}
                onClick={() => handleStartGame(bot, playerColor)}
                type="button"
                className={`shrink-0 flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all active:scale-95 text-center min-w-[100px] sm:min-w-[110px] ${
                  isSelected
                    ? 'bg-amber-400 text-black border-black shadow-[3px_3px_0px_#000000] scale-105'
                    : 'bg-zinc-50 dark:bg-[#181715] border-zinc-200 dark:border-[#36332e] text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'
                }`}
              >
                <span className="text-2xl mb-1">{bot.avatar}</span>
                <span className="text-xs font-black truncate w-full">{bot.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold mt-1 px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-black text-amber-300' : 'bg-zinc-200 dark:bg-[#262421] text-zinc-700 dark:text-[#a8a49e]'
                  }`}
                >
                  {bot.elo} Elo
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* MAIN PLAY ARENA: BOARD & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 7 Columns: Interactive Board & Comic Speech */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* BOT BANTER HEADER + INTERACTIVE SPEECH BUBBLE */}
          <div className="relative flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => triggerSpeech(getRandomLine(selectedBot.speech.onStart))}
                className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-[#2e2a25] border-2 border-black flex items-center justify-center text-3xl shadow-[2px_2px_0px_#000000] active:scale-95 transition-transform"
                title="Click bot for banter!"
              >
                {selectedBot.avatar}
              </button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-zinc-900 dark:text-white">
                    {selectedBot.name}
                  </span>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#2e2a25] text-zinc-700 dark:text-zinc-300">
                    {selectedBot.elo} Elo
                  </span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-[#8e8a83]">{selectedBot.title}</span>
              </div>
            </div>

            {/* COMIC SPEECH BUBBLE */}
            <div
              key={speechKey}
              onClick={() => triggerSpeech(getRandomLine(selectedBot.speech.onStart))}
              className="cursor-pointer max-w-[210px] sm:max-w-xs relative bg-amber-50 dark:bg-[#2e2a25] px-3 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] animate-in zoom-in-95 duration-200"
              title="Click to hear more!"
            >
              {/* Comic bubble pointer tail */}
              <div className="absolute top-1/2 -left-2 w-3 h-3 bg-amber-50 dark:bg-[#2e2a25] border-l-2 border-b-2 border-black -translate-y-1/2 rotate-45 pointer-events-none" />
              <p className="text-xs font-bold text-zinc-900 dark:text-amber-200 leading-snug">
                "{botSpeech}"
              </p>
            </div>
          </div>

          {/* Chessboard View */}
          <div className="w-full max-h-[min(45vh,520px)] max-w-[min(45vh,520px)] aspect-square mx-auto">
            <Chessboard
              fen={currentFen}
              orientation={playerColor}
              theme={theme}
              lastMove={lastMove}
              interactive={!isBotThinking && !gameResult}
              onMove={handlePlayerMove}
            />
          </div>

          {/* User Info Strip (Bottom of board) */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-black border-2 border-black flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#000000]">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">You</span>
                <span className="text-[10px] text-zinc-500 dark:text-[#8e8a83] capitalize">
                  Playing as {playerColor === 'w' ? 'White' : 'Black'}
                </span>
              </div>
            </div>

            {/* In-game action triggers */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTakeback}
                disabled={isBotThinking || historySans.length < 2 || !!gameResult}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#181715] border border-zinc-300 dark:border-[#36332e] text-xs font-bold text-zinc-700 dark:text-[#a8a49e] hover:text-black dark:hover:text-white transition-all disabled:opacity-40 active:scale-95"
                title="Undo last move"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Takeback</span>
              </button>

              <button
                type="button"
                onClick={handleResign}
                disabled={isBotThinking || historySans.length === 0 || !!gameResult}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-[#181715] border border-rose-200 dark:border-[#36332e] text-xs font-bold text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-40 active:scale-95"
                title="Resign game"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Resign</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Side Controls & Live Moves */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Game Over Banner */}
          {gameResult && (
            <div className="flex flex-col gap-3 p-4 rounded-3xl bg-amber-400 text-black border-2 border-black shadow-[4px_4px_0px_#000000] animate-in zoom-in-95">
              <div className="flex items-center gap-2 font-black text-black text-base">
                <Trophy className="w-5 h-5" />
                <span>{gameResult}</span>
              </div>
              <p className="text-xs text-zinc-900 leading-relaxed font-semibold">
                Match concluded! Review this game to see comic sound effect badges (BOOM!, SPLAT!,
                ZAP!) and deep Stockfish move refutations.
              </p>
              <button
                type="button"
                onClick={handleLaunchAnalysis}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-black text-white hover:bg-zinc-800 font-black text-xs shadow-md active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Review Game with Comic Badges ⚡</span>
              </button>
            </div>
          )}

          {/* New Game Setup Strip */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] shadow-sm">
            <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
              Play Settings
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-[#8e8a83]">Your Pieces:</span>
              <div className="flex rounded-xl bg-zinc-100 dark:bg-[#181715] p-1 border border-zinc-200 dark:border-[#36332e]">
                <button
                  type="button"
                  onClick={() => handleStartGame(selectedBot, 'w')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    playerColor === 'w'
                      ? 'bg-white text-black shadow-sm border border-zinc-300'
                      : 'text-zinc-500 hover:text-black dark:text-[#8e8a83]'
                  }`}
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => handleStartGame(selectedBot, 'b')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    playerColor === 'b'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-black dark:text-[#8e8a83]'
                  }`}
                >
                  Black
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleStartGame(selectedBot, playerColor)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5 transition-all"
            >
              Restart Game vs {selectedBot.name} ({selectedBot.elo})
            </button>
          </div>

          {/* Live Move List */}
          <div className="flex flex-col rounded-2xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-[#262421] border-b border-zinc-200 dark:border-[#36332e]">
              <span className="text-xs font-black text-zinc-900 dark:text-white">Live Moves</span>
              <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-[#8e8a83]">
                {historySans.length} moves
              </span>
            </div>

            <div className="flex flex-col max-h-56 overflow-y-auto p-2 gap-1 font-mono text-xs text-zinc-800 dark:text-[#dcd8d1]">
              {historySans.length === 0 ? (
                <span className="text-center py-6 text-xs text-zinc-400 dark:text-[#6e6a63]">
                  Make your first move on the board!
                </span>
              ) : (
                Array.from({ length: Math.ceil(historySans.length / 2) }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#181715]"
                  >
                    <span className="w-8 text-zinc-400 dark:text-[#78746c] text-right pr-2">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 font-bold text-zinc-900 dark:text-white">
                      {historySans[idx * 2]}
                    </span>
                    <span className="flex-1 text-zinc-600 dark:text-[#c7c4c0]">
                      {historySans[idx * 2 + 1] || ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
