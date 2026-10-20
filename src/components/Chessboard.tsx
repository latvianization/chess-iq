import React, { useState } from 'react';
import { BoardTheme, MoveClassification } from '../types/chess';
import { ChessPiece } from './ChessPieces';
import { soundService } from '../services/sound';

interface ChessboardProps {
  fen: string;
  orientation?: 'w' | 'b';
  theme?: BoardTheme;
  lastMove?: { from: string; to: string } | null;
  bestMove?: { from: string; to: string } | null;
  threatMove?: { from: string; to: string } | null;
  badge?: { square: string; classification: MoveClassification } | null;
  onMove?: (from: string, to: string) => void;
  interactive?: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

import { getComicBadge, COMIC_DICTIONARY } from '../services/comicBadges';

// Board colors by theme
const THEME_COLORS: Record<BoardTheme, { light: string; dark: string; border: string }> = {
  green: {
    light: '#ebecd0',
    dark: '#739552',
    border: '#2b2926',
  },
  wood: {
    light: '#f0d9b5',
    dark: '#b58863',
    border: '#2b2926',
  },
  icy: {
    light: '#dee3e6',
    dark: '#587a9f',
    border: '#2b2926',
  },
};

export const CLASSIFICATION_CONFIG: Record<
  MoveClassification,
  { label: string; bg: string; text: string; name: string; comicTerm: string; symbol: string }
> = {
  brilliant: { label: '!!', bg: '#06b6d4', text: '#ffffff', name: 'Brilliant', comicTerm: 'KABOOM!', symbol: '💥' },
  great: { label: '!', bg: '#3b82f6', text: '#ffffff', name: 'Great Move', comicTerm: 'POW!', symbol: '⚡' },
  best: { label: '★', bg: '#10b981', text: '#ffffff', name: 'Best Move', comicTerm: 'ZAP!', symbol: '🎯' },
  excellent: { label: '✓', bg: '#22c55e', text: '#ffffff', name: 'Excellent', comicTerm: 'NICE!', symbol: '✨' },
  good: { label: '·', bg: '#84cc16', text: '#ffffff', name: 'Good', comicTerm: 'SOLID!', symbol: '👍' },
  book: { label: '📖', bg: '#8b5cf6', text: '#ffffff', name: 'Book', comicTerm: 'THEORY!', symbol: '📖' },
  inaccuracy: { label: '?!', bg: '#eab308', text: '#000000', name: 'Inaccuracy', comicTerm: 'HMM?', symbol: '🤔' },
  mistake: { label: '?', bg: '#f97316', text: '#ffffff', name: 'Mistake', comicTerm: 'OUCH!', symbol: '🩹' },
  blunder: { label: '??', bg: '#ef4444', text: '#ffffff', name: 'Blunder', comicTerm: 'SPLAT!', symbol: '💥' },
  missed_win: { label: '✖', bg: '#be123c', text: '#ffffff', name: 'Missed Win', comicTerm: 'NOOO!', symbol: '💨' },
};

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  orientation = 'w',
  theme = 'green',
  lastMove,
  bestMove,
  threatMove,
  badge,
  onMove,
  interactive = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  // Parse FEN into 8x8 grid
  const fenParts = fen.split(' ');
  const piecePlacement = fenParts[0];
  const rows = piecePlacement.split('/');
  const board: (string | null)[][] = [];

  for (const row of rows) {
    const rowPieces: (string | null)[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) rowPieces.push(null);
      } else {
        rowPieces.push(char);
      }
    }
    board.push(rowPieces);
  }

  const files = orientation === 'w' ? FILES : [...FILES].reverse();
  const ranks = orientation === 'w' ? RANKS : [...RANKS].reverse();
  const colors = THEME_COLORS[theme];

  const squareToCoords = (square: string): { x: number; y: number } | null => {
    if (!square || square.length < 2) return null;
    const file = square[0];
    const rank = square[1];
    const colIdx = files.indexOf(file);
    const rowIdx = ranks.indexOf(rank);
    if (colIdx === -1 || rowIdx === -1) return null;
    return { x: colIdx, y: rowIdx };
  };

  const handleSquareClick = (square: string) => {
    if (!interactive || !onMove) return;

    if (!selectedSquare) {
      const coords = squareToCoords(square);
      if (coords) {
        const piece = board[ranks.indexOf(square[1])][files.indexOf(square[0])];
        if (piece) {
          setSelectedSquare(square);
          soundService.playMove();
        }
      }
    } else {
      if (selectedSquare === square) {
        setSelectedSquare(null);
      } else {
        onMove(selectedSquare, square);
        setSelectedSquare(null);
      }
    }
  };

  const renderArrow = (
    from: string,
    to: string,
    color: string,
    dashed = false,
    key: string
  ) => {
    const start = squareToCoords(from);
    const end = squareToCoords(to);
    if (!start || !end) return null;

    const x1 = (start.x + 0.5) * 12.5;
    const y1 = (start.y + 0.5) * 12.5;
    const x2 = (end.x + 0.5) * 12.5;
    const y2 = (end.y + 0.5) * 12.5;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const len = Math.hypot(dx, dy);
    if (len < 1) return null;

    const shortX2 = x1 + Math.cos(angle) * (len - 3.5);
    const shortY2 = y1 + Math.sin(angle) * (len - 3.5);

    return (
      <g key={key} pointerEvents="none">
        <defs>
          <marker
            id={`arrowhead-${key}`}
            markerWidth="6"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill={color} opacity="0.9" />
          </marker>
        </defs>
        <line
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${shortX2}%`}
          y2={`${shortY2}%`}
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={dashed ? '6,6' : undefined}
          opacity="0.9"
          markerEnd={`url(#arrowhead-${key})`}
        />
      </g>
    );
  };

  return (
    <div className="relative aspect-square w-full select-none rounded-2xl overflow-hidden shadow-2xl border border-[#36332e] bg-[#1a1917]">
      {/* 8x8 Grid Squares */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((rank, rIdx) =>
          files.map((file, fIdx) => {
            const square = `${file}${rank}`;
            const isDark = (rIdx + fIdx) % 2 === 1;
            const bgSquareColor = isDark ? colors.dark : colors.light;

            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isSelected = selectedSquare === square;

            const rReal = RANKS.indexOf(rank);
            const fReal = FILES.indexOf(file);
            const pieceChar = board[rReal] ? board[rReal][fReal] : null;

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                style={{
                  backgroundColor: isSelected
                    ? '#facc15'
                    : isLastMove
                    ? isDark
                      ? '#aaa23a'
                      : '#ced856'
                    : bgSquareColor,
                }}
                className={`relative flex items-center justify-center transition-colors duration-150 ${
                  interactive ? 'cursor-pointer hover:brightness-105 active:scale-95' : ''
                }`}
              >
                {/* Edge Notation Labels */}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[9px] font-bold select-none leading-none pointer-events-none ${
                      isDark ? 'text-white/60' : 'text-black/40'
                    }`}
                  >
                    {file}
                  </span>
                )}
                {fIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[9px] font-bold select-none leading-none pointer-events-none ${
                      isDark ? 'text-white/60' : 'text-black/40'
                    }`}
                  >
                    {rank}
                  </span>
                )}

                {/* Crisp Vector SVG Piece with Arrival Animation */}
                {pieceChar && (
                  <ChessPiece
                    type={pieceChar.toLowerCase() as any}
                    color={pieceChar === pieceChar.toUpperCase() ? 'w' : 'b'}
                    isAnimated={Boolean(lastMove && lastMove.to === square)}
                  />
                )}

                {/* Move Comic Sound Effect Badge */}
                {badge && badge.square === square && (() => {
                  const comic = getComicBadge(badge.classification, badge.square);
                  return (
                    <div
                      className="absolute -top-2.5 -right-2.5 sm:-top-3 sm:-right-3 z-30 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border-2 border-black font-black text-[9px] sm:text-[11px] tracking-tight uppercase shadow-[2px_2px_0px_#000000] animate-in zoom-in-75 duration-200 select-none pointer-events-none rotate-[-6deg]"
                      style={{
                        backgroundColor: comic.bg,
                        color: comic.text,
                      }}
                      title={`${comic.term} (${CLASSIFICATION_CONFIG[badge.classification].name})`}
                    >
                      <span className="text-[10px] sm:text-xs leading-none">{comic.symbol}</span>
                      <span className="font-extrabold tracking-tight">{comic.term}</span>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Vector Arrows Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {badge &&
          (badge.classification === 'blunder' ||
            badge.classification === 'mistake' ||
            badge.classification === 'inaccuracy') &&
          lastMove &&
          renderArrow(
            lastMove.from,
            lastMove.to,
            badge.classification === 'blunder' ? '#ef4444' : '#f97316',
            false,
            'played-bad-move'
          )}

        {bestMove &&
          (!lastMove || bestMove.to !== lastMove.to) &&
          renderArrow(bestMove.from, bestMove.to, '#22c55e', false, 'best-move')}

        {threatMove &&
          renderArrow(threatMove.from, threatMove.to, '#e11d48', true, 'threat-arrow')}
      </svg>
    </div>
  );
};
