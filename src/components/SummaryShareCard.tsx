import React, { useRef, useState } from 'react';
import { AnalyzedGame, MoveClassification } from '../types/chess';
import { CLASSIFICATION_CONFIG } from './Chessboard';
import { Share2, Download, Check, Award, Trophy } from 'lucide-react';
import { soundService } from '../services/sound';

interface SummaryShareCardProps {
  game: AnalyzedGame;
  userColor: 'w' | 'b';
}

export const SummaryShareCard: React.FC<SummaryShareCardProps> = ({ game, userColor }) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isUserWhite = userColor === 'w';
  const userPlayer = isUserWhite ? game.white : game.black;
  const oppPlayer = isUserWhite ? game.black : game.white;
  const userElo = isUserWhite ? game.whiteElo : game.blackElo;
  const oppElo = isUserWhite ? game.blackElo : game.whiteElo;

  const keyBadges: MoveClassification[] = [
    'brilliant',
    'great',
    'best',
    'inaccuracy',
    'mistake',
    'blunder',
  ];

  // Render card to canvas and download PNG
  const handleExportPng = () => {
    setDownloading(true);
    soundService.playSuccess();

    try {
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 960;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#161512';
      ctx.fillRect(0, 0, width, height);

      // Card Container
      ctx.fillStyle = '#262421';
      ctx.roundRect(40, 40, width - 80, height - 80, 24);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#36332e';
      ctx.lineWidth = 2;
      ctx.roundRect(40, 40, width - 80, height - 80, 24);
      ctx.stroke();

      // Title & Brand
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('CHESS GAME REVIEW', 70, 95);

      ctx.fillStyle = '#8e8a83';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`${game.ecoCode} · ${game.ecoName}`, 70, 125);

      // Result Badge
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(game.result, width - 70, 105);
      ctx.textAlign = 'left';

      // Divider
      ctx.strokeStyle = '#36332e';
      ctx.beginPath();
      ctx.moveTo(70, 150);
      ctx.lineTo(width - 70, 150);
      ctx.stroke();

      // Players Row
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText(`${userPlayer} (${userElo})`, 70, 195);

      ctx.fillStyle = '#a8a49e';
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText(`vs ${oppPlayer} (${oppElo})`, 70, 230);

      // Accuracy Box
      ctx.fillStyle = '#1c1b18';
      ctx.roundRect(70, 270, 310, 140, 16);
      ctx.fill();

      ctx.fillStyle = '#8e8a83';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('ACCURACY', 95, 305);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 48px monospace';
      ctx.fillText(`${game.userAccuracy}%`, 95, 370);

      // Estimated Elo Box
      ctx.fillStyle = '#1c1b18';
      ctx.roundRect(420, 270, 310, 140, 16);
      ctx.fill();

      ctx.fillStyle = '#8e8a83';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('PERFORMANCE ELO', 445, 305);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 48px monospace';
      ctx.fillText(`${game.overallGameElo}`, 445, 370);

      // Phase Breakdown Box
      ctx.fillStyle = '#1e1c19';
      ctx.roundRect(70, 440, width - 140, 120, 16);
      ctx.fill();

      ctx.fillStyle = '#8e8a83';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('PHASE PERFORMANCE ELO', 95, 470);

      // Opening Elo
      ctx.fillStyle = '#a8a49e';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Opening', 120, 505);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${game.openingElo || 'N/A'}`, 120, 535);

      // Middlegame Elo
      ctx.fillStyle = '#a8a49e';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Middlegame', 340, 505);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${game.middlegameElo || 'N/A'}`, 340, 535);

      // Endgame Elo
      ctx.fillStyle = '#a8a49e';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Endgame', 560, 505);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`${game.endgameElo || 'N/A'}`, 560, 535);

      // Move Badges Header
      ctx.fillStyle = '#8e8a83';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('MOVE CLASSIFICATIONS', 70, 600);

      let badgeX = 70;
      keyBadges.forEach((b) => {
        const cfg = CLASSIFICATION_CONFIG[b];
        const count = game.counts[b] || 0;

        ctx.fillStyle = cfg.bg;
        ctx.beginPath();
        ctx.arc(badgeX + 16, 635, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = cfg.text;
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cfg.label, badgeX + 16, 639);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`${count}`, badgeX + 38, 640);

        badgeX += 110;
      });

      // Footer
      ctx.fillStyle = '#52525b';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Analyzed by Chess Game Analyzer · 3-Tier Stockfish Engine', 70, 720);

      // Download link
      const link = document.createElement('a');
      link.download = `ChessReview_${userPlayer}_vs_${oppPlayer}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Chess Game Review: ${userPlayer} vs ${oppPlayer}`,
          text: `I scored ${game.userAccuracy}% Accuracy with an estimated Performance Elo of ${game.overallGameElo} in the ${game.ecoName}!`,
          url: window.location.href,
        });
      } catch {}
    } else {
      // Fallback copy
      navigator.clipboard.writeText(
        `Chess Game Review: ${userPlayer} vs ${oppPlayer} | Accuracy: ${game.userAccuracy}% | Est. Elo: ${game.overallGameElo}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      {/* Visual Preview Card */}
      <div
        ref={cardRef}
        className="flex flex-col gap-4 p-6 rounded-3xl bg-white dark:bg-[#262421] border-2 border-black/10 dark:border-[#36332e] shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#36332e] pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-black tracking-wider text-sm text-zinc-900 dark:text-white">
              CHESS GAME REVIEW
            </span>
          </div>
          <span className="text-base font-black font-mono text-amber-500 dark:text-amber-400">
            {game.result}
          </span>
        </div>

        {/* Players */}
        <div className="flex flex-col">
          <span className="text-lg font-black text-zinc-900 dark:text-white">
            {userPlayer} ({userElo})
          </span>
          <span className="text-xs font-bold text-zinc-500 dark:text-[#a8a49e]">
            vs {oppPlayer} ({oppElo}) · {game.ecoCode} {game.ecoName}
          </span>
        </div>

        {/* Big Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col p-3 rounded-2xl bg-zinc-50 dark:bg-[#1c1b18] border border-zinc-200 dark:border-[#322f2a]">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#8e8a83]">ACCURACY</span>
            <span className="text-3xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              {game.userAccuracy}%
            </span>
          </div>
          <div className="flex flex-col p-3 rounded-2xl bg-zinc-50 dark:bg-[#1c1b18] border border-zinc-200 dark:border-[#322f2a]">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#8e8a83]">PERFORMANCE ELO</span>
            <span className="text-3xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-300 mt-1">
              {game.overallGameElo}
            </span>
          </div>
        </div>

        {/* Phase Elos */}
        <div className="flex flex-col p-3 rounded-2xl bg-zinc-50 dark:bg-[#1e1c19] border border-zinc-200 dark:border-[#36332e]">
          <span className="text-[10px] uppercase font-black text-zinc-600 dark:text-[#8a867f] tracking-wider mb-1.5">
            Phase Performance
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-[#8e8a83]">Opening</span>
              <div className="font-mono font-black text-sm text-zinc-900 dark:text-white">
                {game.openingElo || 'N/A'}
              </div>
            </div>
            <div className="border-x border-zinc-200 dark:border-[#36332e]">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-[#8e8a83]">Middlegame</span>
              <div className="font-mono font-black text-sm text-zinc-900 dark:text-white">
                {game.middlegameElo || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-[#8e8a83]">Endgame</span>
              <div className="font-mono font-black text-sm text-zinc-900 dark:text-white">
                {game.endgameElo || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Move counts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {keyBadges.map((b) => (
            <div
              key={b}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-[#181715] text-xs font-mono"
            >
              <span
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black border border-black/20"
                style={{
                  backgroundColor: CLASSIFICATION_CONFIG[b].bg,
                  color: CLASSIFICATION_CONFIG[b].text,
                }}
              >
                {CLASSIFICATION_CONFIG[b].label}
              </span>
              <span className="font-black text-zinc-900 dark:text-white">{game.counts[b] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleExportPng}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Generating PNG...' : 'Download PNG Card'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#262421] dark:hover:bg-[#322f2a] border border-zinc-300 dark:border-[#36332e] text-zinc-800 dark:text-white font-bold text-xs active:scale-95 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
};
