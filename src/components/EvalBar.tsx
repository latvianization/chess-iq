import React from 'react';

interface EvalBarProps {
  scoreCp: number; // Centipawns from White's perspective
  mate?: number | null;
  winProb: number; // 0.0 to 1.0 (White perspective)
  orientation?: 'w' | 'b';
}

export const EvalBar: React.FC<EvalBarProps> = ({
  scoreCp,
  mate,
  winProb,
  orientation = 'w',
}) => {
  // Format score label (+1.4, -0.8, M3, 0.0)
  let scoreLabel = '0.0';
  if (mate !== undefined && mate !== null) {
    scoreLabel = `M${Math.abs(mate)}`;
  } else {
    const pawns = scoreCp / 100;
    if (pawns > 0) {
      scoreLabel = `+${pawns.toFixed(1)}`;
    } else if (pawns < 0) {
      scoreLabel = pawns.toFixed(1);
    } else {
      scoreLabel = '0.0';
    }
  }

  // Calculate percentage of white height
  // winProb is 0.0 to 1.0
  const whitePercent = Math.min(97, Math.max(3, winProb * 100));
  const blackPercent = 100 - whitePercent;

  // If orientation is Black at bottom, invert bar
  const bottomPercent = orientation === 'w' ? whitePercent : blackPercent;
  const isWhiteWinning = (mate && mate > 0) || scoreCp > 0;
  const isBlackWinning = (mate && mate < 0) || scoreCp < 0;

  return (
    <div className="relative w-7 sm:w-8 h-full min-h-[300px] flex flex-col rounded-lg overflow-hidden bg-[#262421] border border-[#36332e] shadow-lg select-none">
      {/* Top section (Black if White orientation, White if Black orientation) */}
      <div
        style={{ height: `${100 - bottomPercent}%` }}
        className="w-full bg-[#18181b] transition-all duration-300 ease-out relative flex items-start justify-center pt-1"
      >
        {orientation === 'w' && isBlackWinning && (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-white/90 tabular-nums">
            {scoreLabel}
          </span>
        )}
        {orientation === 'b' && isWhiteWinning && (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-black/90 tabular-nums">
            {scoreLabel}
          </span>
        )}
      </div>

      {/* Subtle Divider Line */}
      <div className="w-full h-0.5 bg-yellow-400/70 shrink-0 z-10" />

      {/* Bottom section (White if White orientation, Black if Black orientation) */}
      <div
        style={{ height: `${bottomPercent}%` }}
        className="w-full bg-[#f4f4f5] transition-all duration-300 ease-out relative flex items-end justify-center pb-1"
      >
        {orientation === 'w' && isWhiteWinning && (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-black/90 tabular-nums">
            {scoreLabel}
          </span>
        )}
        {orientation === 'b' && isBlackWinning && (
          <span className="text-[10px] sm:text-xs font-mono font-bold text-white/90 tabular-nums">
            {scoreLabel}
          </span>
        )}
      </div>
    </div>
  );
};
