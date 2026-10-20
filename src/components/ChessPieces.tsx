import React from 'react';

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

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none pointer-events-none ${className}`}
    >
      <img
        src={`/pieces/${pieceCode}.svg`}
        alt={`${colorName} ${pieceNameMap[type.toLowerCase()] || 'Piece'}`}
        draggable={false}
        className={`w-[88%] h-[88%] max-w-full max-h-full object-contain select-none pointer-events-none filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out ${
          isAnimated ? 'scale-105 animate-in zoom-in-90 duration-200' : 'scale-100'
        }`}
      />
    </div>
  );
};
