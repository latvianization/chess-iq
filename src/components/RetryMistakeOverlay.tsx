import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, AlertCircle, HelpCircle, X, RotateCcw } from 'lucide-react';
import { soundService } from '../services/sound';

interface RetryMistakeOverlayProps {
  turnColor: 'w' | 'b';
  bestMoveSan: string;
  bestMoveUci: string;
  mistakeMoveSan: string;
  onClose: () => void;
  onResetPosition: () => void;
}

export const RetryMistakeOverlay: React.FC<RetryMistakeOverlayProps> = ({
  turnColor,
  bestMoveSan,
  bestMoveUci,
  mistakeMoveSan,
  onClose,
  onResetPosition,
}) => {
  const [solved, setSolved] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Trigger win state when parent calls validateMove
  const handleValidate = (playedUci: string, playedSan: string) => {
    const isCorrect = playedUci === bestMoveUci || playedSan === bestMoveSan;
    if (isCorrect) {
      setSolved(true);
      soundService.playSuccess();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
    } else {
      setSolved(false);
      soundService.playBlunder();
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-100 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-300">
            Retry Mistake · {turnColor === 'w' ? 'White' : 'Black'} to move
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#9c978f] hover:text-white hover:bg-[#36332e] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-[#dcd8d1] leading-relaxed">
        You played <span className="font-mono font-bold text-rose-400">{mistakeMoveSan}</span>. Drag or tap a piece on the board to find the winning tactical move!
      </p>

      {solved === true && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Correct! {bestMoveSan} was the strongest continuation.</span>
        </div>
      )}

      {solved === false && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Not quite the best move. Try again!</span>
          </div>
          <button
            onClick={() => {
              setSolved(null);
              onResetPosition();
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-white underline hover:no-underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {revealed && (
        <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-200 text-xs font-mono font-semibold">
          Engine Solution: <span className="text-white font-bold">{bestMoveSan}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-500/20">
        {!revealed && !solved && (
          <button
            onClick={() => setRevealed(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Reveal Solution</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-[#2e2b26] hover:bg-[#3d3933] text-white text-xs font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
