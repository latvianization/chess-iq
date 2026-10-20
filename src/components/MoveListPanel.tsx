import React, { useEffect, useRef } from 'react';
import { PlyEvaluation } from '../types/chess';
import { CLASSIFICATION_CONFIG } from './Chessboard';

interface MoveListPanelProps {
  plies: PlyEvaluation[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
}

export const MoveListPanel: React.FC<MoveListPanelProps> = ({
  plies,
  currentPly,
  onSelectPly,
}) => {
  const activeMoveRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ONLY inside this container, NEVER scrolling the browser window or outer page
  useEffect(() => {
    const container = scrollContainerRef.current;
    const item = activeMoveRef.current;

    if (item && container) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      // Relative offset within container
      const relativeItemTop = itemRect.top - containerRect.top + container.scrollTop;
      const itemHeight = itemRect.height;
      const containerHeight = container.clientHeight;

      const currentScroll = container.scrollTop;
      const targetMin = relativeItemTop - 12;
      const targetMax = relativeItemTop + itemHeight + 12 - containerHeight;

      if (currentScroll > targetMin) {
        container.scrollTo({ top: Math.max(0, targetMin), behavior: 'smooth' });
      } else if (currentScroll < targetMax) {
        container.scrollTo({ top: targetMax, behavior: 'smooth' });
      }
    }
  }, [currentPly]);

  if (plies.length === 0) return null;

  // Group plies into pairs (White & Black)
  const movePairs: { moveNumber: number; whitePly?: PlyEvaluation; blackPly?: PlyEvaluation }[] = [];
  for (let i = 0; i < plies.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      whitePly: plies[i],
      blackPly: plies[i + 1],
    });
  }

  const renderMoveBtn = (ply?: PlyEvaluation) => {
    if (!ply) return <div className="flex-1" />;

    const isCurrent = ply.ply === currentPly;
    const cfg = CLASSIFICATION_CONFIG[ply.classification];
    const isSpecial = ['brilliant', 'great', 'blunder', 'mistake', 'inaccuracy'].includes(
      ply.classification
    );

    return (
      <button
        type="button"
        ref={isCurrent ? activeMoveRef : null}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelectPly(ply.ply);
        }}
        className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
          isCurrent
            ? 'bg-amber-400 text-black font-bold shadow-sm border border-black'
            : 'text-zinc-800 dark:text-[#dcd8d1] hover:bg-zinc-100 dark:hover:bg-[#2e2b26] hover:text-black dark:hover:text-white'
        }`}
      >
        <span className="truncate">{ply.san}</span>

        {isSpecial && (
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ml-1 border border-black/20"
            style={{
              backgroundColor: isCurrent ? '#000000' : cfg.bg,
              color: isCurrent ? cfg.bg : cfg.text,
            }}
          >
            {cfg.label}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col rounded-2xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] overflow-hidden shadow-sm select-none">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50 dark:bg-[#262421] border-b border-zinc-200 dark:border-[#36332e]">
        <span className="text-xs font-black text-zinc-900 dark:text-white tracking-wide">Move History</span>
        <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-[#8e8a83]">
          {plies.length} Plies
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative flex flex-col max-h-52 sm:max-h-64 overflow-y-auto p-1.5 gap-0.5 overscroll-contain"
        style={{ scrollBehavior: 'smooth' }}
      >
        {movePairs.map((pair) => (
          <div
            key={pair.moveNumber}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1a1917]/50 transition-colors"
          >
            <span className="w-7 text-[11px] font-mono font-bold text-zinc-400 dark:text-[#78746c] shrink-0 text-right pr-1">
              {pair.moveNumber}.
            </span>
            {renderMoveBtn(pair.whitePly)}
            {renderMoveBtn(pair.blackPly)}
          </div>
        ))}
      </div>
    </div>
  );
};
