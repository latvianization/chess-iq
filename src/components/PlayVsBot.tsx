import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { BoardTheme } from '../types/chess';
import { Chessboard } from './Chessboard';
import { evaluatePositionLocally, findBestMoveLocal } from '../services/engine';
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
} from 'lucide-react';

export interface BotProfile {
  id: string;
  name: string;
  elo: number;
  avatar: string;
  title: string;
  description: string;
  depth: number;
  randomness: number; // 0.0 (perfect) to 1.0 (random)
}

const BOTS: BotProfile[] = [
  {
    id: 'sparky',
    name: 'Sparky',
    elo: 400,
    avatar: '🐶',
    title: 'Beginner',
    description: 'Makes fun moves and frequently leaves pieces undefended.',
    depth: 1,
    randomness: 0.75,
  },
  {
    id: 'jimmy',
    name: 'Jimmy',
    elo: 800,
    avatar: '🧒',
    title: 'Casual Player',
    description: 'Knows how pieces move but prone to impulsive tactical traps.',
    depth: 1,
    randomness: 0.45,
  },
  {
    id: 'elena',
    name: 'Elena',
    elo: 1200,
    avatar: '👩‍🏫',
    title: 'Club Player',
    description: 'Plays classical opening principles and captures free material.',
    depth: 2,
    randomness: 0.2,
  },
  {
    id: 'magnus_bot',
    name: 'Magnus-Bot',
    elo: 1600,
    avatar: '👑',
    title: 'Advanced',
    description: 'Aggressive piece coordinator with sharp 2-move tactical depth.',
    depth: 2,
    randomness: 0.08,
  },
  {
    id: 'mikhail',
    name: 'Mikhail',
    elo: 2000,
    avatar: '🧙‍♂️',
    title: 'Chess Master',
    description: 'Calculates forcing sacrifices and controls key center outposts.',
    depth: 3,
    randomness: 0.02,
  },
  {
    id: 'stockfish_gm',
    name: 'Stockfish GM',
    elo: 2400,
    avatar: '🤖',
    title: 'Grandmaster',
    description: 'Unyielding tactical precision and deep endgame calculation.',
    depth: 3,
    randomness: 0.0,
  },
];

interface PlayVsBotProps {
  theme: BoardTheme;
  onAnalyzeGame: (pgn: string, userColor: 'w' | 'b') => void;
  onExit: () => void;
}

export const PlayVsBot: React.FC<PlayVsBotProps> = ({
  theme,
  onAnalyzeGame,
  onExit,
}) => {
  const [selectedBot, setSelectedBot] = useState<BotProfile>(BOTS[2]); // Elena 1200 default
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [chess] = useState(() => new Chess());
  const [currentFen, setCurrentFen] = useState(chess.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [historySans, setHistorySans] = useState<string[]>([]);

  // Start fresh game
  const handleStartGame = (bot: BotProfile, color: 'w' | 'b') => {
    setSelectedBot(bot);
    setPlayerColor(color);
    chess.reset();
    setCurrentFen(chess.fen());
    setLastMove(null);
    setGameResult(null);
    setHistorySans([]);

    if (color === 'b') {
      triggerBotMove(bot);
    }
  };

  // Bot move logic based on Elo difficulty
  const triggerBotMove = (bot = selectedBot) => {
    setIsBotThinking(true);

    const thinkingTime = Math.min(800, Math.max(350, Math.random() * 600));

    setTimeout(() => {
      if (chess.isGameOver()) {
        setIsBotThinking(false);
        return;
      }

      const legalMoves = chess.moves({ verbose: true });
      if (legalMoves.length === 0) {
        setIsBotThinking(false);
        checkGameOver();
        return;
      }

      let chosenMove = legalMoves[0];

      // Decide if bot makes a random move or calculates
      const shouldBlunder = Math.random() < bot.randomness;

      if (shouldBlunder) {
        // Pick random legal move
        const randomIdx = Math.floor(Math.random() * legalMoves.length);
        chosenMove = legalMoves[randomIdx];
      } else {
        // Calculate best move using engine
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
          if (moveRes.captured) soundService.playCapture();
          else soundService.playMove();

          if (chess.inCheck()) soundService.playCheck();

          setCurrentFen(chess.fen());
          setLastMove({ from: moveRes.from, to: moveRes.to });
          setHistorySans(chess.history());
          checkGameOver();
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
        if (move.captured) soundService.playCapture();
        else soundService.playMove();

        if (chess.inCheck()) soundService.playCheck();

        setCurrentFen(chess.fen());
        setLastMove({ from, to });
        setHistorySans(chess.history());

        if (!checkGameOver()) {
          triggerBotMove();
        }
      }
    } catch {
      // Illegal move
    }
  };

  const checkGameOver = (): boolean => {
    if (chess.isGameOver()) {
      let res = 'Game Over';
      if (chess.isCheckmate()) {
        const winner = chess.turn() === 'w' ? 'Black' : 'White';
        res = `Checkmate · ${winner} Wins!`;
        if ((winner === 'White' && playerColor === 'w') || (winner === 'Black' && playerColor === 'b')) {
          soundService.playSuccess();
          try {
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          } catch {}
        } else {
          soundService.playBlunder();
        }
      } else if (chess.isDraw()) {
        res = 'Draw (Stalemate / Insufficient Material)';
      }
      setGameResult(res);
      return true;
    }
    return false;
  };

  const handleResign = () => {
    const winner = playerColor === 'w' ? 'Black' : 'White';
    setGameResult(`Resigned · ${winner} (${selectedBot.name}) Wins`);
    soundService.playBlunder();
  };

  const handleTakeback = () => {
    if (isBotThinking) return;
    // Undo bot move and player move
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
    soundService.playMove();
  };

  const handleLaunchAnalysis = () => {
    const pgn = chess.pgn();
    if (!pgn || pgn.trim().length === 0) return;
    onAnalyzeGame(pgn, playerColor);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none animate-in fade-in duration-200">
      {/* Bot Selection Carousel */}
      <div className="flex flex-col gap-2.5 p-4 rounded-3xl bg-[#211f1c] border border-[#36332e] shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Select Bot Opponent</h3>
          </div>
          <span className="text-xs text-[#8e8a83]">6 Tiered Elo Levels</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {BOTS.map((bot) => {
            const isSelected = selectedBot.id === bot.id;
            return (
              <button
                key={bot.id}
                onClick={() => handleStartGame(bot, playerColor)}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#2a2723] border-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-[#181715] border-[#36332e] hover:border-[#4d4942]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-2xl">{bot.avatar}</span>
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-amber-400 text-black' : 'bg-[#262421] text-[#a8a49e]'
                    }`}
                  >
                    {bot.elo}
                  </span>
                </div>
                <span className="text-xs font-bold text-white truncate w-full">{bot.name}</span>
                <span className="text-[10px] text-[#8e8a83] truncate w-full">{bot.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Play Area: Board & Bot Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Interactive Board */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Opponent Info Strip (Top of board) */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#211f1c] border border-[#36332e]">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{selectedBot.avatar}</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">{selectedBot.name}</span>
                  <span className="text-xs font-mono text-[#8e8a83]">({selectedBot.elo})</span>
                </div>
                <span className="text-[10px] text-[#6d6962]">{selectedBot.description}</span>
              </div>
            </div>

            {isBotThinking && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Thinking...</span>
              </div>
            )}
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
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#211f1c] border border-[#36332e]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">You</span>
                <span className="text-[10px] text-[#8e8a83] capitalize">Playing as {playerColor === 'w' ? 'White' : 'Black'}</span>
              </div>
            </div>

            {/* In-game action triggers */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTakeback}
                disabled={isBotThinking || historySans.length < 2 || !!gameResult}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#181715] border border-[#36332e] text-xs text-[#a8a49e] hover:text-white transition-all disabled:opacity-40"
                title="Undo last move"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Takeback</span>
              </button>

              <button
                onClick={handleResign}
                disabled={isBotThinking || historySans.length === 0 || !!gameResult}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#181715] border border-[#36332e] text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-40"
                title="Resign game"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Resign</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Side Controls & Move List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Game Over Banner */}
          {gameResult && (
            <div className="flex flex-col gap-3 p-4 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-100 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-2 font-black text-amber-300 text-base">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>{gameResult}</span>
              </div>
              <p className="text-xs text-[#dcd8d1] leading-relaxed">
                The game has concluded! Launch the 3-Tier engine analysis to uncover your accuracy percentage, mistakes, and tactical performance.
              </p>
              <button
                onClick={handleLaunchAnalysis}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Analyze Game in Reviewer ⚡</span>
              </button>
            </div>
          )}

          {/* New Game Setup Strip */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#211f1c] border border-[#36332e]">
            <span className="text-xs font-bold text-white tracking-wide">Play Settings</span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8e8a83]">Your Pieces:</span>
              <div className="flex rounded-xl bg-[#181715] p-1 border border-[#36332e]">
                <button
                  onClick={() => handleStartGame(selectedBot, 'w')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    playerColor === 'w' ? 'bg-white text-black shadow-sm' : 'text-[#8e8a83] hover:text-white'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => handleStartGame(selectedBot, 'b')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    playerColor === 'b' ? 'bg-[#36332e] text-white shadow-sm' : 'text-[#8e8a83] hover:text-white'
                  }`}
                >
                  Black
                </button>
              </div>
            </div>

            <button
              onClick={() => handleStartGame(selectedBot, playerColor)}
              className="w-full py-2.5 rounded-xl bg-[#2e2b26] hover:bg-[#3d3933] text-white font-semibold text-xs transition-all active:scale-98"
            >
              Restart Game vs {selectedBot.name}
            </button>
          </div>

          {/* Live Move List */}
          <div className="flex flex-col rounded-2xl bg-[#211f1c] border border-[#36332e] overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#262421] border-b border-[#36332e]">
              <span className="text-xs font-bold text-white">Live Moves</span>
              <span className="text-[11px] font-mono text-[#8e8a83]">{historySans.length} moves</span>
            </div>

            <div className="flex flex-col max-h-56 overflow-y-auto p-2 gap-1 font-mono text-xs text-[#dcd8d1]">
              {historySans.length === 0 ? (
                <span className="text-center py-6 text-xs text-[#6e6a63]">
                  Make your first move on the board!
                </span>
              ) : (
                Array.from({ length: Math.ceil(historySans.length / 2) }).map((_, idx) => (
                  <div key={idx} className="flex items-center px-2 py-1 rounded-lg hover:bg-[#181715]">
                    <span className="w-8 text-[#78746c] text-right pr-2">{idx + 1}.</span>
                    <span className="flex-1 font-semibold text-white">{historySans[idx * 2]}</span>
                    <span className="flex-1 text-[#c7c4c0]">{historySans[idx * 2 + 1] || ''}</span>
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
