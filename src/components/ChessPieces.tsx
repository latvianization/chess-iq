import React from 'react';
import { INLINE_PIECE_DATA_URLS } from './pieceSvgs';

// Import SVG assets directly so Vite bundles and resolves them relative to deploy path
import bB from '../assets/pieces/bB.svg';
import bK from '../assets/pieces/bK.svg';
import bN from '../assets/pieces/bN.svg';
import bP from '../assets/pieces/bP.svg';
import bQ from '../assets/pieces/bQ.svg';
import bR from '../assets/pieces/bR.svg';
import wB from '../assets/pieces/wB.svg';
import wK from '../assets/pieces/wK.svg';
import wN from '../assets/pieces/wN.svg';
import wP from '../assets/pieces/wP.svg';
import wQ from '../assets/pieces/wQ.svg';
import wR from '../assets/pieces/wR.svg';

const PIECE_ASSETS: Record<string, string> = {
  bB,
  bK,
  bN,
  bP,
  bQ,
  bR,
  wB,
  wK,
  wN,
  wP,
  wQ,
  wR,
};

/**
 * Normalizes any piece representation into standard format like 'bR', 'wQ', etc.
 * Handles inputs like 'bR', 'br', 'pieces/bR.svg', '/pieces/bR.svg', 'public/pieces/bR.svg'
 */
export function normalizePieceCode(input: string): string {
  if (!input) return 'wP';
  // Match piece code from any path or filename
  const match = input.match(/([bw][kqrnbp])(?:\.svg)?$/i);
  if (match) {
    const raw = match[1];
    return `${raw[0].toLowerCase()}${raw[1].toUpperCase()}`;
  }
  return input;
}

/**
 * Resolves piece image URL with 100% resilience:
 * 1. Embedded inline data URI (zero network latency, never 404s on GitHub Pages or custom subpaths)
 * 2. Vite-bundled hashed asset
 * 3. Relative path using Vite's BASE_URL (e.g., ./pieces/bR.svg)
 */
export function getPieceImageUrl(code: string): string {
  const norm = normalizePieceCode(code);

  // 1. Direct inline data URI - bulletproof for GitHub Pages and offline
  if (INLINE_PIECE_DATA_URLS[norm]) {
    return INLINE_PIECE_DATA_URLS[norm];
  }

  // 2. Vite hashed asset
  if (PIECE_ASSETS[norm]) {
    return PIECE_ASSETS[norm];
  }

  // 3. Fallback: Base-relative public folder
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}pieces/${norm}.svg`;
}

interface PieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  className?: string;
  isAnimated?: boolean;
}

/**
 * Standard Colin Burnett (Lichess / Wikimedia / Chessground) vector piece set.
 * Clean, high-contrast, world-standard tournament aesthetic.
 */
export const ChessPiece: React.FC<PieceProps> = ({
  type,
  color,
  className = '',
  isAnimated = false,
}) => {
  const pieceCode = `${color}${type.toUpperCase()}`;
  const pieceNameMap: Record<string, string> = {
    p: 'Pawn',
    n: 'Knight',
    b: 'Bishop',
    r: 'Rook',
    q: 'Queen',
    k: 'King',
  };
  const colorName = color === 'w' ? 'White' : 'Black';
  const pieceSrc = getPieceImageUrl(pieceCode);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none pointer-events-none ${className}`}
    >
      <img
        src={pieceSrc}
        alt={`${colorName} ${pieceNameMap[type.toLowerCase()] || 'Piece'}`}
        draggable={false}
        onError={(e) => {
          // In case any external link failed (e.g. 404 on GitHub Pages), fallback to inline SVG data URL
          const fallback = INLINE_PIECE_DATA_URLS[pieceCode];
          if (fallback && e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
        className={`w-[88%] h-[88%] max-w-full max-h-full object-contain select-none pointer-events-none filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out ${
          isAnimated ? 'scale-105 animate-in zoom-in-90 duration-200' : 'scale-100'
        }`}
      />
    </div>
  );
};
