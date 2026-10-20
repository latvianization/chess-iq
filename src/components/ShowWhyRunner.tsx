import React, { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { soundService } from '../services/sound';

interface ShowWhyRunnerProps {
  initialFen: string;
  pvMoves: string[]; // UCI moves
  onClose: () => void;
  onUpdateFen: (fen: string, lastMove: { from: string; to: string } | null) => void;
}

export const ShowWhyRunner: React.FC<ShowWhyRunnerProps> = ({
  initialFen,
  pvMoves,
  onClose,
  onUpdateFen,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Pre-calculate FENs and moves along the PV line
  const [fens, setFens] = useState<{ fen: string; from: string; to: string; san: string }[]>([]);

  useEffect(() => {
    const calculated: { fen: string; from: string; to: string; san: string }[] = [];
    const chess = new Chess(initialFen);

    for (const uci of pvMoves.slice(0, 8)) {
      if (!uci || uci.length < 4) continue;
      const from = uci.slice(0, 2) as any;
      const to = uci.slice(2, 4) as any;
      const promotion = uci.length > 4 ? uci[4] : undefined;
      try {
        const move = chess.move({ from, to, promotion });
        if (move) {
          calculated.push({
            fen: chess.fen(),
            from: move.from,
            to: move.to,
            san: move.san,
          });
        }
      } catch {
        break;
      }
    }

    setFens(calculated);
    setStepIndex(0);
    if (calculated.length > 0) {
      onUpdateFen(calculated[0].fen, { from: calculated[0].from, to: calculated[0].to });
      soundService.playMove();
    }
  }, [initialFen, pvMoves]);

  // Stepping timer
  useEffect(() => {
    if (!isPlaying || fens.length === 0) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev + 1 < fens.length) {
          const next = prev + 1;
          onUpdateFen(fens[next].fen, { from: fens[next].from, to: fens[next].to });
          soundService.playMove();
          return next;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 850);

    return () => clearInterval(interval);
  }, [isPlaying, fens]);

  const handleStepTo = (idx: number) => {
    if (idx >= 0 && idx < fens.length) {
      setStepIndex(idx);
      onUpdateFen(fens[idx].fen, { from: fens[idx].from, to: fens[idx].to });
      soundService.playMove();
    }
  };

  return (
    <div className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-blue-200 shadow-md">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        <span className="text-xs font-semibold text-white">
          Tactical Continuation ({stepIndex + 1}/{fens.length || 1})
        </span>
        {fens[stepIndex] && (
          <span className="text-xs font-mono font-bold text-blue-300">
            {fens[stepIndex].san}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-white transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => handleStepTo(0)}
          className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-white transition-colors"
          title="Restart continuation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Line</span>
        </button>
      </div>
    </div>
  );
};
