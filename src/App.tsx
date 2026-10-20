import React, { useEffect, useState } from 'react';
import { Chess, Square } from 'chess.js';
import { AnalyzedGame, BoardTheme, MoveClassification, PlyEvaluation } from './types/chess';
import { PRELOADED_GAMES, analyzeFullPgn } from './services/importApi';
import { soundService } from './services/sound';
import { TopBar } from './components/TopBar';
import { Chessboard, CLASSIFICATION_CONFIG } from './components/Chessboard';
import { EvalBar } from './components/EvalBar';
import { KeyMomentsBar } from './components/KeyMomentsBar';
import { GameStatsPanel } from './components/GameStatsPanel';
import { SmoothAdvantageChart } from './components/SmoothAdvantageChart';
import { MoveListPanel } from './components/MoveListPanel';
import { ShowWhyRunner } from './components/ShowWhyRunner';
import { RetryMistakeOverlay } from './components/RetryMistakeOverlay';
import { SummaryShareCard } from './components/SummaryShareCard';
import { PlayVsBot } from './components/PlayVsBot';
import { ImportModal } from './components/ImportModal';
import { Clock, Play, Sparkles, PlusCircle, Bot } from 'lucide-react';
import { getComicBadge } from './services/comicBadges';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appMode, setAppMode] = useState<'review' | 'bot'>('review');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('green');
  const [isDeepReview, setIsDeepReview] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [game, setGame] = useState<AnalyzedGame | null>(null);

  // Board Navigation State
  const [currentPly, setCurrentPly] = useState(0);
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [isThreatActive, setIsThreatActive] = useState(false); // Sticky threat toggle
  const [isPlayingPv, setIsPlayingPv] = useState(false);
  const [isRetryingMistake, setIsRetryingMistake] = useState(false);

  // Overridden board display (for PV preview or retry)
  const [overrideFen, setOverrideFen] = useState<string | null>(null);
  const [overrideLastMove, setOverrideLastMove] = useState<{ from: string; to: string } | null>(null);

  // Initial load: Pre-analyze famous Opera Game
  useEffect(() => {
    const initialGame = PRELOADED_GAMES[0];
    runAnalysis(initialGame.pgn, initialGame.userColor);
  }, []);

  const runAnalysis = async (pgn: string, userColorTarget: 'w' | 'b') => {
    setIsAnalyzing(true);
    setOverrideFen(null);
    setOverrideLastMove(null);
    setIsPlayingPv(false);
    setIsRetryingMistake(false);
    setAppMode('review');

    try {
      const analyzedGame = await analyzeFullPgn(
        pgn,
        userColorTarget,
        isDeepReview,
        (current, total) => setAnalysisProgress({ current, total })
      );

      setGame(analyzedGame);
      setOrientation(analyzedGame.userColor);
      setCurrentPly(analyzedGame.plies.length > 0 ? 1 : 0);
      setIsImportModalOpen(false);
      soundService.playSuccess();
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExitReview = () => {
    setGame(null);
    setCurrentPly(0);
    setOverrideFen(null);
    setOverrideLastMove(null);
    setIsThreatActive(false);
    setIsPlayingPv(false);
    setIsRetryingMistake(false);
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!game || isPlayingPv || isRetryingMistake || isImportModalOpen || appMode !== 'review') return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft') {
        goToPly(Math.max(0, currentPly - 1));
      } else if (e.key === 'ArrowRight') {
        goToPly(Math.min(game.plies.length, currentPly + 1));
      } else if (e.key === 'ArrowUp') {
        goToPly(0);
      } else if (e.key === 'ArrowDown') {
        goToPly(game.plies.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game, currentPly, isPlayingPv, isRetryingMistake, isImportModalOpen, appMode]);

  const goToPly = (ply: number) => {
    if (!game) return;
    setCurrentPly(ply);
    setOverrideFen(null);
    setOverrideLastMove(null);
    setIsPlayingPv(false);
    setIsRetryingMistake(false);

    if (ply > 0 && game.plies[ply - 1]) {
      const p = game.plies[ply - 1];
      if (p.captured) soundService.playCapture();
      else soundService.playMove();

      if (p.classification === 'blunder') soundService.playBlunder();
      else if (p.classification === 'brilliant') soundService.playBrilliant();
    }
  };

  // Current ply evaluation
  const currentEval: PlyEvaluation | null =
    game && currentPly > 0 && currentPly <= game.plies.length ? game.plies[currentPly - 1] : null;

  // Board FEN to display
  const displayFen =
    overrideFen ||
    (currentEval ? currentEval.fen : game?.initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // Last Move highlight
  const displayLastMove =
    overrideLastMove || (currentEval ? { from: currentEval.from, to: currentEval.to } : null);

  // Engine Best Move arrow
  const bestMoveArrow =
    !isRetryingMistake && currentEval?.bestMoveUci && currentEval.bestMoveUci.length >= 4
      ? { from: currentEval.bestMoveUci.slice(0, 2), to: currentEval.bestMoveUci.slice(2, 4) }
      : null;

  // Threat Arrow (Persistent)
  const threatArrow =
    isThreatActive && currentEval?.threat?.uci && currentEval.threat.uci.length >= 4
      ? { from: currentEval.threat.uci.slice(0, 2), to: currentEval.threat.uci.slice(2, 4) }
      : null;

  // Destination square badge (!!, ?, etc.)
  const badge =
    !overrideFen && !isRetryingMistake && currentEval
      ? { square: currentEval.to, classification: currentEval.classification }
      : null;

  // Next Key Moment jump (??, ?, !, !!)
  const handleNextKeyMoment = () => {
    if (!game) return;
    const criticalTypes: MoveClassification[] = ['blunder', 'mistake', 'brilliant', 'great', 'missed_win'];
    for (let i = currentPly; i < game.plies.length; i++) {
      if (criticalTypes.includes(game.plies[i].classification)) {
        goToPly(i + 1);
        return;
      }
    }
    for (let i = 0; i < currentPly; i++) {
      if (criticalTypes.includes(game.plies[i].classification)) {
        goToPly(i + 1);
        return;
      }
    }
  };

  // Start "Retry Mistake" mode
  const handleStartRetry = () => {
    if (!currentEval) return;
    setIsRetryingMistake(true);
    setOverrideFen(currentEval.fenBefore);
    setOverrideLastMove(null);
  };

  // Handle piece move on board during retry mode
  const handleBoardMove = (from: string, to: string) => {
    if (!isRetryingMistake || !currentEval) return;
    try {
      const chess = new Chess(displayFen);
      const move = chess.move({ from: from as Square, to: to as Square, promotion: 'q' });
      if (move) {
        setOverrideFen(chess.fen());
        setOverrideLastMove({ from, to });
        const playedUci = `${from}${to}${move.promotion || ''}`;
        if (playedUci === currentEval.bestMoveUci || move.san === currentEval.bestMoveSan) {
          soundService.playSuccess();
        } else {
          soundService.playBlunder();
        }
      }
    } catch {}
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDarkMode ? 'dark bg-[#161512] text-[#edebe9]' : 'bg-[#faf8f5] text-zinc-900'
      } transition-colors duration-200`}
    >
      {/* Top Bar with 3-zone contract */}
      <TopBar
        appMode={appMode}
        onChangeMode={setAppMode}
        onOpenImport={() => setIsImportModalOpen(true)}
        isDeepReview={isDeepReview}
        onToggleDeepReview={() => setIsDeepReview(!isDeepReview)}
        boardTheme={boardTheme}
        onChangeTheme={setBoardTheme}
        hasActiveGame={!!game}
        onExitReview={handleExitReview}
        isDarkMode={isDarkMode}
        onToggleThemeMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-6 flex flex-col gap-4 sm:gap-6">
        {/* MODE 1: Play vs Bot Mode */}
        {appMode === 'bot' && (
          <PlayVsBot
            theme={boardTheme}
            isDarkMode={isDarkMode}
            onAnalyzeGame={(pgn, userColor) => runAnalysis(pgn, userColor)}
            onExit={() => setAppMode('review')}
          />
        )}

        {/* MODE 2: Game Review Dashboard */}
        {appMode === 'review' && (
          <>
            {game ? (
              <>
                {/* Top Row Split: Board & Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                  {/* Left 7 Columns: STICKY on Mobile so board and step navigation NEVER move or scroll away */}
                  <div className="lg:col-span-7 sticky top-0 lg:static z-30 bg-[#faf8f5] dark:bg-[#161512] pb-2 pt-1 flex flex-col gap-2 sm:gap-3 border-b lg:border-b-0 border-zinc-200 dark:border-[#2b2823] shadow-md lg:shadow-none">
                    <div className="flex items-stretch justify-center gap-2 sm:gap-3 w-full">
                      {/* Vertical Animated EvalBar */}
                      <div className="shrink-0 flex items-stretch">
                        <EvalBar
                          scoreCp={currentEval ? currentEval.scoreCp : 0}
                          mate={currentEval ? currentEval.mate : null}
                          winProb={currentEval ? currentEval.winProb : 0.5}
                          orientation={orientation}
                        />
                      </div>

                      {/* Chessboard View - constrained to viewport height on mobile so step bar is always in view */}
                      <div className="flex-1 max-w-[560px] flex justify-center">
                        <div className="w-full max-h-[38vh] max-w-[38vh] sm:max-h-none sm:max-w-none aspect-square">
                          <Chessboard
                            fen={displayFen}
                            orientation={orientation}
                            theme={boardTheme}
                            lastMove={displayLastMove}
                            bestMove={bestMoveArrow}
                            threatMove={threatArrow}
                            badge={badge}
                            interactive={isRetryingMistake}
                            onMove={handleBoardMove}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Move Notation Strip under Board with Comic Sound Effect Badge */}
                    <div className="flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] text-xs shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-500 dark:text-[#8e8a83] font-bold">
                          {currentEval
                            ? `${Math.floor((currentEval.ply - 1) / 2) + 1}${
                                currentEval.color === 'w' ? '.' : '...'
                              }`
                            : '0.'}
                        </span>
                        <span className="font-black text-zinc-900 dark:text-white text-sm">
                          {currentEval ? currentEval.san : 'Initial Position'}
                        </span>
                        {currentEval && (() => {
                          const comic = getComicBadge(currentEval.classification, currentEval.ply);
                          return (
                            <span
                              className="px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider border-2 border-black shadow-[1.5px_1.5px_0px_#000000] flex items-center gap-1 select-none"
                              style={{
                                backgroundColor: comic.bg,
                                color: comic.text,
                              }}
                            >
                              <span>{comic.symbol}</span>
                              <span>{comic.term}</span>
                            </span>
                          );
                        })()}
                      </div>

                      {currentEval && currentEval.clock !== undefined && currentEval.clock !== null && (
                        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-[#a8a49e] font-mono text-[11px] font-bold">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-[#78746c]" />
                          <span>
                            {Math.floor(currentEval.clock / 60)}:
                            {(currentEval.clock % 60).toFixed(0).padStart(2, '0')}
                          </span>
                          {currentEval.timeSpent && (
                            <span className="text-zinc-400 dark:text-[#6d6962]">
                              ({currentEval.timeSpent.toFixed(1)}s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tactical Controls & Key Moments Navigation (Permanently visible on mobile!) */}
                    <KeyMomentsBar
                      currentPly={currentPly}
                      totalPlies={game.plies.length}
                      onGoToPly={goToPly}
                      onNextKeyMoment={handleNextKeyMoment}
                      onRetryMistake={handleStartRetry}
                      onToggleThreat={() => setIsThreatActive(!isThreatActive)}
                      onShowWhy={() => setIsPlayingPv(true)}
                      isThreatActive={isThreatActive}
                      isPlayingPv={isPlayingPv}
                      canRetry={
                        currentEval !== null &&
                        currentEval.color === game.userColor &&
                        (currentEval.classification === 'blunder' ||
                          currentEval.classification === 'mistake' ||
                          currentEval.classification === 'inaccuracy')
                      }
                      canShowWhy={Boolean(currentEval?.pv && currentEval.pv.length >= 2)}
                      hasKeyMoments={game.plies.some((p) =>
                        ['blunder', 'mistake', 'brilliant', 'great', 'missed_win'].includes(p.classification)
                      )}
                      onFlipBoard={() => setOrientation(orientation === 'w' ? 'b' : 'w')}
                    />
                  </div>

                  {/* Right 5 Columns: Diagnostics, Moves Panel & Performance Stats */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Show Why Tactical PV Runner (When active) */}
                    {isPlayingPv && currentEval && currentEval.pv.length > 0 && (
                      <ShowWhyRunner
                        initialFen={currentEval.fenBefore}
                        pvMoves={currentEval.pv}
                        onClose={() => {
                          setIsPlayingPv(false);
                          setOverrideFen(null);
                          setOverrideLastMove(null);
                        }}
                        onUpdateFen={(fen, move) => {
                          setOverrideFen(fen);
                          setOverrideLastMove(move);
                        }}
                      />
                    )}

                    {/* Retry Mistake Overlay (When active) */}
                    {isRetryingMistake && currentEval && (
                      <RetryMistakeOverlay
                        turnColor={currentEval.color}
                        bestMoveSan={currentEval.bestMoveSan}
                        bestMoveUci={currentEval.bestMoveUci}
                        mistakeMoveSan={currentEval.san}
                        onClose={() => {
                          setIsRetryingMistake(false);
                          setOverrideFen(null);
                          setOverrideLastMove(null);
                        }}
                        onResetPosition={() => {
                          setOverrideFen(currentEval.fenBefore);
                          setOverrideLastMove(null);
                        }}
                      />
                    )}

                    {/* Move Analysis Diagnostic Card */}
                    {currentEval && !isRetryingMistake && (
                      <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#262421] border border-[#36332e] text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Engine Tactical Analysis</span>
                          </span>
                          <span className="text-[11px] font-mono text-[#8e8a83]">
                            Accuracy: {currentEval.accuracy}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1c1b18] border border-[#322f2a] mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[#a8a49e]">Best move:</span>
                            <strong className="text-emerald-400 font-mono text-sm">
                              {currentEval.bestMoveSan}
                            </strong>
                          </div>

                          {currentEval.pv && currentEval.pv.length >= 2 && (
                            <button
                              onClick={() => setIsPlayingPv(true)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-semibold text-[11px] transition-colors"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Show Why</span>
                            </button>
                          )}
                        </div>

                        {isThreatActive && currentEval.threat && (
                          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
                            <strong>Opponent Threat:</strong> {currentEval.threat.description} ({currentEval.threat.san})
                          </div>
                        )}
                      </div>
                    )}

                    {/* Move History Panel with Internal-Only Scrolling */}
                    <MoveListPanel
                      plies={game.plies}
                      currentPly={currentPly}
                      onSelectPly={goToPly}
                    />

                    {/* Game Stats & Phase Performance Elos */}
                    <GameStatsPanel game={game} userColor={game.userColor} />
                  </div>
                </div>

                {/* Steady Smooth Advantage Line Chart */}
                <SmoothAdvantageChart
                  plies={game.plies}
                  currentPly={currentPly}
                  middlegameStartPly={game.middlegameStartPly}
                  endgameStartPly={game.endgameStartPly}
                  onSelectPly={goToPly}
                  userColor={game.userColor}
                />

                {/* Shareable Summary Card */}
                <div className="pt-2">
                  <SummaryShareCard game={game} userColor={game.userColor} />
                </div>
              </>
            ) : (
              /* Zero State: No active review (Exited review) */
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] shadow-lg">
                <span className="w-16 h-16 rounded-2xl bg-amber-400 text-black border-2 border-black flex items-center justify-center text-3xl mb-4 shadow-[2px_2px_0px_#000000]">
                  ♟
                </span>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                  No Game Currently in Review
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#9c978f] max-w-md mt-1.5 leading-relaxed font-medium">
                  Import a game from Chess.com, Lichess, or paste any PGN to run full 3-Tier engine
                  diagnostics with comic sound effect badges, or challenge our 33-bot arena!
                </p>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Import Game</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppMode('bot')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#2e2b26] dark:hover:bg-[#3d3933] text-zinc-800 dark:text-white font-bold text-xs border border-zinc-300 dark:border-transparent active:scale-95 transition-all"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Play 33 Bots</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSelectPgn={runAnalysis}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
      />
    </div>
  );
}
