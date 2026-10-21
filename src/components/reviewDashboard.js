/**
 * Vanilla JS Game Review Dashboard Component
 * Displays Stockfish tournament analysis, interactive move history,
 * eval bar, phase ratings, comic sound effect badges, and tactical refutations.
 */

import { Chess } from 'chess.js';
import { Chessboard } from './board.js';
import { soundService } from '../services/sound.js';
import { getComicBadge, COMIC_DICTIONARY } from '../services/comicBadges.js';
import { findBestMoveLocal, FEN_EVAL_CACHE } from '../services/engine.js';

export class ReviewDashboard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onOpenImport = options.onOpenImport || null;
    this.onSwitchToBots = options.onSwitchToBots || null;
    this.theme = options.theme || 'green';

    this.game = null; // AnalyzedGame object
    this.isAnalyzing = false;
    this.analysisProgress = { current: 0, total: 0 };
    this.currentPly = 0;
    this.orientation = 'w';
    this.isThreatActive = false;
    this.isPlayingPv = false;
    this.pvTimer = null;
    this.board = null;
    this.analysisStartTime = null;

    this.render();
  }

  showLoading(current = 0, total = 0) {
    if (!this.isAnalyzing || current === 0) {
      this.analysisStartTime = Date.now();
    }
    this.isAnalyzing = true;
    this.analysisProgress = { current, total };

    const card = this.container.querySelector('#review-analysis-card');
    if (card) {
      this.updateLoadingCard(current, total);
    } else {
      this.render();
    }
  }

  updateLoadingCard(current, total) {
    const subtitleEl = this.container.querySelector('#review-analysis-subtitle');
    const barEl = this.container.querySelector('#review-analysis-bar');
    const stepEl = this.container.querySelector('#review-analysis-step');
    const pctEl = this.container.querySelector('#review-analysis-pct');
    const etaEl = this.container.querySelector('#review-analysis-eta');

    const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 10;

    let etaText = 'Estimating time...';
    if (this.analysisStartTime && current > 2 && total > current) {
      const elapsedSec = (Date.now() - this.analysisStartTime) / 1000;
      const secPerPly = elapsedSec / current;
      const remainingSec = Math.max(1, Math.round(secPerPly * (total - current)));
      etaText = `~${remainingSec}s remaining`;
    } else if (current >= total && total > 0) {
      etaText = 'Finalizing report...';
    }

    if (subtitleEl) {
      subtitleEl.textContent = total > 0
        ? `Evaluating ply ${current} of ${total}...`
        : 'Starting rapid engine analysis...';
    }
    if (barEl) {
      barEl.style.width = `${pct}%`;
    }
    if (stepEl) {
      stepEl.textContent = total > 0 ? `${current} / ${total} plies` : 'Initializing...';
    }
    if (pctEl) {
      pctEl.textContent = `${pct}%`;
    }
    if (etaEl) {
      etaEl.textContent = etaText;
    }
  }

  hideLoading() {
    this.isAnalyzing = false;
    this.analysisStartTime = null;
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    if (this.board) {
      this.board.setProps({ theme: newTheme });
    }
  }

  setGame(analyzedGame) {
    this.isAnalyzing = false;
    this.game = analyzedGame;
    this.currentPly = analyzedGame && analyzedGame.plies.length > 0 ? 1 : 0;
    this.orientation = analyzedGame ? analyzedGame.userColor : 'w';
    this.isThreatActive = false;
    this.stopPvPlayback();
    this.render();
  }

  goToPly(ply) {
    if (!this.game) return;
    this.currentPly = Math.max(0, Math.min(this.game.plies.length, ply));
    this.stopPvPlayback();

    // Play move sound
    if (this.currentPly > 0 && this.game.plies[this.currentPly - 1]) {
      const p = this.game.plies[this.currentPly - 1];
      if (p.captured) soundService.playCapture();
      else soundService.playMove();

      if (p.classification === 'blunder') soundService.playBlunder();
      else if (p.classification === 'brilliant') soundService.playBrilliant();
    }

    this.updateBoardAndControls();
  }

  nextKeyMoment() {
    if (!this.game) return;
    const keyTypes = ['blunder', 'mistake', 'brilliant', 'great', 'missed_win'];
    for (let i = this.currentPly; i < this.game.plies.length; i++) {
      if (keyTypes.includes(this.game.plies[i].classification)) {
        this.goToPly(i + 1);
        return;
      }
    }
    // Loop to first key moment if none ahead
    for (let i = 0; i < this.currentPly; i++) {
      if (keyTypes.includes(this.game.plies[i].classification)) {
        this.goToPly(i + 1);
        return;
      }
    }
  }

  toggleThreat() {
    this.isThreatActive = !this.isThreatActive;
    this.updateBoardAndControls();
  }

  startShowWhy() {
    const cur = this.getCurrentEval();
    if (!cur || !cur.tacticalContinuation || cur.tacticalContinuation.length === 0) return;

    this.isPlayingPv = true;
    const fen = cur.fen;
    const moves = cur.tacticalContinuation;
    let step = 0;

    const chessTemp = new Chess(fen);
    const steps = [];

    for (const uci of moves.slice(0, 8)) {
      if (!uci || uci.length < 4) break;
      try {
        const m = chessTemp.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
        if (m) {
          steps.push({ fen: chessTemp.fen(), from: m.from, to: m.to, san: m.san });
        }
      } catch {
        break;
      }
    }

    if (steps.length === 0) {
      this.isPlayingPv = false;
      return;
    }

    this.updatePvBanner(steps, 0);

    clearInterval(this.pvTimer);
    this.pvTimer = setInterval(() => {
      step++;
      if (step >= steps.length) {
        clearInterval(this.pvTimer);
        this.isPlayingPv = false;
        this.updatePvBanner(null);
        this.updateBoardAndControls();
        return;
      }

      this.board?.setProps({
        fen: steps[step].fen,
        lastMove: { from: steps[step].from, to: steps[step].to },
      });
      soundService.playMove();
      this.updatePvBanner(steps, step);
    }, 850);
  }

  stopPvPlayback() {
    if (this.pvTimer) {
      clearInterval(this.pvTimer);
      this.pvTimer = null;
    }
    this.isPlayingPv = false;
    this.updatePvBanner(null);
  }

  getCurrentEval() {
    if (!this.game || this.currentPly === 0 || this.currentPly > this.game.plies.length) return null;
    return this.game.plies[this.currentPly - 1];
  }

  updatePvBanner(steps, currentStep = 0) {
    const banner = this.container.querySelector('#pv-banner-area');
    if (!banner) return;

    if (!steps) {
      banner.innerHTML = '';
      banner.classList.add('d-none');
      return;
    }

    banner.classList.remove('d-none');
    banner.innerHTML = `
      <div class="alert alert-primary comic-card-sm d-flex align-items-center justify-content-between p-2.5 mb-2">
        <div class="d-flex align-items-center gap-2">
          <span class="spinner-grow spinner-grow-sm text-primary"></span>
          <span class="small fw-bold">Tactical Continuation (${currentStep + 1}/${steps.length}):</span>
          <span class="badge bg-primary font-monospace">${steps[currentStep]?.san || ''}</span>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary fw-bold" id="btn-exit-pv">Exit Line</button>
      </div>
    `;

    banner.querySelector('#btn-exit-pv')?.addEventListener('click', () => {
      this.stopPvPlayback();
      this.updateBoardAndControls();
    });
  }

  getTopMovesForFen(fen) {
    if (!fen) return { best: null, second: null };
    try {
      const cached = typeof FEN_EVAL_CACHE !== 'undefined' ? FEN_EVAL_CACHE.get(fen) : null;
      let bestUci = cached?.bestMoveUci;
      let secondUci = cached?.secondBestMoveUci;

      if (!bestUci && typeof findBestMoveLocal === 'function') {
        const local = findBestMoveLocal(fen, 2);
        bestUci = local.bestMoveUci;
        secondUci = local.secondBestMoveUci;
      }

      const best = bestUci && bestUci.length >= 4
        ? { from: bestUci.slice(0, 2), to: bestUci.slice(2, 4) }
        : null;

      const second = secondUci && secondUci.length >= 4 && (secondUci.slice(0, 2) !== best?.from || secondUci.slice(2, 4) !== best?.to)
        ? { from: secondUci.slice(0, 2), to: secondUci.slice(2, 4) }
        : null;

      return { best, second };
    } catch {
      return { best: null, second: null };
    }
  }

  updateBoardAndControls() {
    const cur = this.getCurrentEval();
    const fen = cur ? cur.fen : (this.game ? this.game.initialFen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const lastMove = cur ? { from: cur.from, to: cur.to } : null;

    let bestMove = null;
    let secondBestMove = null;

    if (cur) {
      // Show available top moves for the player who made the move (from position before the move)
      let bestUci = cur.bestMoveUci;
      let secondUci = cur.secondBestMoveUci;

      if (!bestUci || !secondUci) {
        const top = this.getTopMovesForFen(cur.fenBefore);
        if (!bestUci && top.best) bestUci = `${top.best.from}${top.best.to}`;
        if (!secondUci && top.second) secondUci = `${top.second.from}${top.second.to}`;
      }

      bestMove = bestUci && bestUci.length >= 4
        ? { from: bestUci.slice(0, 2), to: bestUci.slice(2, 4) }
        : null;

      secondBestMove = secondUci && secondUci.length >= 4 && (secondUci.slice(0, 2) !== bestMove?.from || secondUci.slice(2, 4) !== bestMove?.to)
        ? { from: secondUci.slice(0, 2), to: secondUci.slice(2, 4) }
        : null;
    } else {
      // Starting position (ply 0): show White's options
      const top = this.getTopMovesForFen(fen);
      bestMove = top.best;
      secondBestMove = top.second;
    }

    const threatMove = this.isThreatActive && cur?.threat?.uci && cur.threat.uci.length >= 4
      ? { from: cur.threat.uci.slice(0, 2), to: cur.threat.uci.slice(2, 4) }
      : null;

    const badge = cur ? { square: cur.to, classification: cur.classification } : null;

    this.board?.setProps({
      fen,
      orientation: this.orientation,
      lastMove,
      bestMove,
      secondBestMove,
      threatMove,
      badge,
    });

    // Update Eval Bar
    this.updateEvalBar(cur);

    // Update Move Strip Badge & Notation
    const stripEl = this.container.querySelector('#review-move-strip');
    if (stripEl) {
      if (cur) {
        const comic = getComicBadge(cur.classification, cur.san);
        const evalStr = cur.mate !== null
          ? `M${Math.abs(cur.mate)}`
          : (cur.scoreCp > 0 ? `+${(cur.scoreCp / 100).toFixed(1)}` : (cur.scoreCp / 100).toFixed(1));

        const isSuboptimal = cur.classification !== 'best' && cur.classification !== 'book';
        const bestSan = cur.bestMoveSan || (bestMove ? `${bestMove.from}-${bestMove.to}` : '');
        const secondSan = cur.secondBestMoveSan;

        stripEl.innerHTML = `
          <div class="d-flex align-items-center flex-wrap gap-2">
            <span class="badge border border-dark rounded-pill px-2.5 py-1" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 900; font-size: 11px;">
              ${comic.symbol} ${comic.term}
            </span>
            <span class="font-monospace fw-black fs-5">${cur.san}</span>
            <span class="badge bg-body-tertiary text-secondary font-monospace fw-bold">${evalStr}</span>

            ${isSuboptimal && bestSan && bestSan !== cur.san ? `
              <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace fw-bold px-2 py-1" title="Top Engine Move (Thick Arrow)">
                ★ Best: ${bestSan}
              </span>
            ` : ''}

            ${isSuboptimal && secondSan && secondSan !== cur.san && secondSan !== bestSan ? `
              <span class="badge bg-body-secondary text-secondary font-monospace fw-semibold px-2 py-1" title="2nd Best Option (Thin Arrow)">
                2nd: ${secondSan}
              </span>
            ` : ''}
          </div>
          <div class="d-flex align-items-center gap-2">
            ${cur.tacticalContinuation && cur.tacticalContinuation.length > 0 ? `
              <button type="button" class="btn btn-sm btn-outline-primary fw-bold comic-btn" id="btn-show-why">
                <i class="bi bi-play-fill me-1"></i>Show Why
              </button>
            ` : ''}
          </div>
        `;
        stripEl.querySelector('#btn-show-why')?.addEventListener('click', () => this.startShowWhy());
      } else {
        stripEl.innerHTML = `
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-secondary rounded-pill px-2.5 py-1">🏁 Start</span>
            <span class="small fw-bold text-secondary">Starting Position</span>
          </div>
        `;
      }
    }

    // Update Step Counter
    const counterEl = this.container.querySelector('#ply-counter');
    if (counterEl) {
      counterEl.textContent = `${this.currentPly} / ${this.game?.plies.length || 0}`;
    }

    // Update Active Row in Move Table
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      const plyNum = parseInt(row.dataset.ply, 10);
      if (plyNum === this.currentPly) {
        row.classList.add('bg-warning-subtle', 'fw-black', 'border', 'border-warning');
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        row.classList.remove('bg-warning-subtle', 'fw-black', 'border', 'border-warning');
      }
    });

    // Threat active toggle visual
    const threatBtn = this.container.querySelector('#btn-toggle-threat');
    if (threatBtn) {
      if (this.isThreatActive) {
        threatBtn.classList.replace('btn-outline-danger', 'btn-danger');
      } else {
        threatBtn.classList.replace('btn-danger', 'btn-outline-danger');
      }
    }
  }

  updateEvalBar(cur) {
    const whiteBar = this.container.querySelector('.eval-white');
    const blackBar = this.container.querySelector('.eval-black');
    const scoreTextEl = this.container.querySelector('.eval-score-text');
    if (!whiteBar || !blackBar) return;

    let winProb = cur ? cur.winProb : 0.5;
    let whitePercent = Math.min(97, Math.max(3, winProb * 100));
    let blackPercent = 100 - whitePercent;

    if (this.orientation === 'b') {
      const temp = whitePercent;
      whitePercent = blackPercent;
      blackPercent = temp;
    }

    whiteBar.style.height = `${whitePercent}%`;
    blackBar.style.height = `${blackPercent}%`;

    if (scoreTextEl) {
      if (!cur) {
        scoreTextEl.textContent = '0.0';
      } else if (cur.mate !== null) {
        scoreTextEl.textContent = `M${Math.abs(cur.mate)}`;
      } else {
        const cpVal = cur.scoreCp / 100;
        scoreTextEl.textContent = cpVal > 0 ? `+${cpVal.toFixed(1)}` : cpVal.toFixed(1);
      }
    }
  }

  render() {
    if (this.isAnalyzing) {
      const pct = this.analysisProgress.total > 0
        ? Math.round((this.analysisProgress.current / this.analysisProgress.total) * 100)
        : 10;
      this.container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-4 p-sm-5 text-center comic-card max-w-xl mx-auto my-5 shadow-lg" id="review-analysis-card">
          <div class="spinner-border text-warning mb-3" style="width: 3.5rem; height: 3.5rem;" role="status"></div>
          <h4 class="fw-black mb-1">Analyzing Game with Stockfish...</h4>
          <p class="text-secondary small mb-3 fw-bold" id="review-analysis-subtitle">
            ${this.analysisProgress.total > 0 ? `Evaluating ply ${this.analysisProgress.current} of ${this.analysisProgress.total}...` : 'Starting rapid engine analysis...'}
          </p>
          <div class="progress w-100 max-w-md mx-auto mb-2" style="height: 14px; border: 2px solid #000000; border-radius: 999px; background: rgba(0,0,0,0.08);">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" id="review-analysis-bar" style="width: ${pct}%; transition: width 0.15s ease;"></div>
          </div>
          <div class="d-flex align-items-center justify-content-between w-100 max-w-md text-secondary small font-monospace fw-bold px-1">
            <span id="review-analysis-step">${this.analysisProgress.total > 0 ? `${this.analysisProgress.current} / ${this.analysisProgress.total} plies` : 'Initializing...'}</span>
            <span class="badge bg-warning-subtle text-warning border border-warning-subtle" id="review-analysis-eta">Estimating time...</span>
            <span id="review-analysis-pct">${pct}%</span>
          </div>
        </div>
      `;
      return;
    }

    if (!this.game) {
      // Zero State (No game active)
      this.container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-4 p-sm-5 text-center comic-card max-w-2xl mx-auto my-4">
          <span class="badge bg-warning text-dark border border-dark rounded-4 p-3 fs-1 mb-3 shadow-sm">
            ♟
          </span>
          <h3 class="fw-black mb-2">No Game Currently in Review</h3>
          <p class="text-secondary small max-w-md mx-auto mb-4 font-medium leading-relaxed">
            Import a game from Chess.com, Lichess, or paste any PGN to run deep Stockfish engine diagnostics
            with move quality classifications, phase ratings, and key moment analysis, or challenge our 33-bot arena!
          </p>
          <div class="d-flex align-items-center gap-3">
            <button type="button" class="btn btn-warning comic-btn px-4 py-2.5" id="zero-btn-import" data-bs-toggle="modal" data-bs-target="#import-modal">
              <i class="bi bi-cloud-arrow-up-fill me-1.5"></i> Import Game
            </button>
            <button type="button" class="btn btn-light comic-btn px-4 py-2.5" id="zero-btn-bots">
              <i class="bi bi-robot me-1.5"></i> Play 33 Bots
            </button>
          </div>
        </div>
      `;

      this.container.querySelector('#zero-btn-import')?.addEventListener('click', () => {
        if (this.onOpenImport) this.onOpenImport();
      });
      this.container.querySelector('#zero-btn-bots')?.addEventListener('click', () => {
        if (this.onSwitchToBots) this.onSwitchToBots();
      });
      return;
    }

    const userColor = this.game.userColor || 'w';
    const isWhiteUser = userColor === 'w';
    const userAcc = Number(this.game.userAccuracy ?? this.game.accuracy ?? this.game.overallAccuracy ?? 85).toFixed(1);
    const oppAcc = Number(this.game.opponentAccuracy ?? 85).toFixed(1);

    const userPhases = this.game.userPhaseElos || this.game.phaseElos || {};
    const oppPhases = this.game.opponentPhaseElos || {};

    const userOpeningElo = userPhases.opening ?? 1500;
    const userMiddlegameElo = userPhases.middlegame ?? 1500;
    const userEndgameElo = userPhases.endgame ?? 1500;

    const oppOpeningElo = oppPhases.opening ?? 1500;
    const oppMiddlegameElo = oppPhases.middlegame ?? 1500;
    const oppEndgameElo = oppPhases.endgame ?? 1500;

    // Active Review Dashboard
    this.container.innerHTML = `
      <div class="row g-3 g-lg-4">
        <!-- Left: Sticky Board Column -->
        <div class="col-12 col-lg-7 mobile-sticky-top">
          <!-- PV Banner (Tactical line playback) -->
          <div id="pv-banner-area" class="d-none"></div>

          <div class="d-flex align-items-stretch justify-content-center gap-2 gap-sm-3 mb-2">
            <!-- Vertical Animated Eval Bar -->
            <div class="eval-bar-wrapper flex-shrink-0">
              <div class="eval-black">
                <span class="eval-score-text text-white"></span>
              </div>
              <div class="eval-white"></div>
            </div>

            <!-- Chessboard Mount -->
            <div class="flex-grow-1 d-flex justify-content-center" id="review-board-mount"></div>
          </div>

          <!-- Move Notation & Comic Sound Effect Strip -->
          <div class="comic-card-sm p-2.5 mb-2 d-flex align-items-center justify-content-between" id="review-move-strip"></div>

          <!-- Step Navigation Bar -->
          <div class="comic-card-sm p-2 d-flex align-items-center justify-content-between gap-1">
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-light btn-sm comic-btn" id="btn-first" title="First Move"><i class="bi bi-chevron-bar-left"></i></button>
              <button type="button" class="btn btn-light btn-sm comic-btn" id="btn-prev" title="Previous Move"><i class="bi bi-chevron-left"></i></button>
              <button type="button" class="btn btn-light btn-sm comic-btn" id="btn-next" title="Next Move"><i class="bi bi-chevron-right"></i></button>
              <button type="button" class="btn btn-light btn-sm comic-btn" id="btn-last" title="Last Move"><i class="bi bi-chevron-bar-right"></i></button>
            </div>

            <span class="badge bg-secondary font-monospace px-2.5 py-1.5" id="ply-counter">0 / 0</span>

            <div class="d-flex align-items-center gap-1.5">
              <button type="button" class="btn btn-sm btn-outline-danger comic-btn" id="btn-toggle-threat" title="Toggle Threat Arrow">
                <i class="bi bi-shield-slash"></i>
              </button>
              <button type="button" class="btn btn-sm btn-warning comic-btn" id="btn-key-moment" title="Next Key Moment">
                <i class="bi bi-lightning-charge-fill me-1"></i>Key Moment
              </button>
              <button type="button" class="btn btn-sm btn-light comic-btn" id="btn-flip" title="Flip Board">
                <i class="bi bi-arrow-left-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Move List & Performance Stats -->
        <div class="col-12 col-lg-5 d-flex flex-column gap-3">
          <!-- Match Overview Header Card -->
          <div class="comic-card p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="fw-black fs-6 text-truncate" style="max-width: 240px;">
                  ${this.game.white} vs ${this.game.black}
                </div>
                <div class="text-secondary small" style="font-size: 11px;">
                  ${this.game.ecoName || this.game.ecoCode || 'Chess Match'} · ${this.game.date || ''}
                </div>
              </div>
              <span class="badge ${this.game.result === '1-0' ? 'bg-success' : this.game.result === '0-1' ? 'bg-danger' : 'bg-secondary'} font-monospace px-2.5 py-1.5 fs-6">
                ${this.game.result}
              </span>
            </div>
          </div>

          <!-- Move History List -->
          <div class="comic-card p-3">
            <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
              <h6 class="mb-0 fw-black"><i class="bi bi-list-ol me-1.5 text-warning"></i>Move History</h6>
              <span class="badge bg-body-secondary text-dark fw-bold font-monospace">${this.game.plies.length} Plies</span>
            </div>
            <div class="move-history-container">
              <table class="table table-sm table-hover align-middle mb-0" style="font-size: 13px;">
                <tbody>
                  ${this.buildMoveTableRows()}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Phase Accuracy & Elo Card -->
          <div class="comic-card p-3">
            <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
              <h6 class="mb-0 fw-black"><i class="bi bi-trophy-fill me-1.5 text-warning"></i>Game Performance</h6>
              <span class="badge bg-body-secondary text-secondary font-monospace fw-bold" style="font-size: 11px;">You vs Opponent</span>
            </div>

            <!-- Dual Accuracy Comparison -->
            <div class="row g-2 mb-3">
              <div class="col-6">
                <div class="arcade-stat-chip p-2 text-start">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="small fw-bold text-truncate">${isWhiteUser ? '⚪ White' : '⚫ Black'} (You)</span>
                    <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill font-monospace" style="font-size: 10px;">YOU</span>
                  </div>
                  <div class="d-flex align-items-baseline gap-1">
                    <span class="fw-black fs-4 text-success font-monospace">${userAcc}%</span>
                    <span class="text-secondary small">accuracy</span>
                  </div>
                </div>
              </div>
              <div class="col-6">
                <div class="arcade-stat-chip p-2 text-start">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="small fw-bold text-truncate">${isWhiteUser ? '⚫ Black' : '⚪ White'}</span>
                    <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill font-monospace" style="font-size: 10px;">OPP</span>
                  </div>
                  <div class="d-flex align-items-baseline gap-1">
                    <span class="fw-black fs-4 text-secondary font-monospace">${oppAcc}%</span>
                    <span class="text-secondary small">accuracy</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Phase Rating Comparison (Opening, Middle, Endgame) -->
            <div class="row g-2 text-center mb-3">
              <div class="col-4">
                <div class="arcade-stat-chip p-2">
                  <span class="text-secondary small d-block fw-bold mb-1.5"><i class="bi bi-compass me-1 text-primary"></i>Opening</span>
                  <div class="d-flex justify-content-around align-items-baseline">
                    <div class="text-center">
                      <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                      <span class="fw-black fs-6 text-primary font-monospace">${userOpeningElo}</span>
                    </div>
                    <div class="vr opacity-25 my-auto" style="height: 22px;"></div>
                    <div class="text-center">
                      <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                      <span class="fw-black fs-6 text-secondary font-monospace">${oppOpeningElo}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-4">
                <div class="arcade-stat-chip p-2">
                  <span class="text-secondary small d-block fw-bold mb-1.5"><i class="bi bi-shield-shaded me-1 text-warning"></i>Middle</span>
                  <div class="d-flex justify-content-around align-items-baseline">
                    <div class="text-center">
                      <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                      <span class="fw-black fs-6 text-warning font-monospace">${userMiddlegameElo}</span>
                    </div>
                    <div class="vr opacity-25 my-auto" style="height: 22px;"></div>
                    <div class="text-center">
                      <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                      <span class="fw-black fs-6 text-secondary font-monospace">${oppMiddlegameElo}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-4">
                <div class="arcade-stat-chip p-2">
                  <span class="text-secondary small d-block fw-bold mb-1.5"><i class="bi bi-flag-fill me-1 text-success"></i>Endgame</span>
                  <div class="d-flex justify-content-around align-items-baseline">
                    <div class="text-center">
                      <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                      <span class="fw-black fs-6 text-success font-monospace">${userEndgameElo}</span>
                    </div>
                    <div class="vr opacity-25 my-auto" style="height: 22px;"></div>
                    <div class="text-center">
                      <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                      <span class="fw-black fs-6 text-secondary font-monospace">${oppEndgameElo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Move Classification Breakdown (Player vs Opponent) -->
            <div class="border-top pt-2">
              <div class="d-flex align-items-center justify-content-between px-2 pb-1.5 text-secondary" style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
                <span style="width: 38px;" class="text-end">YOU</span>
                <span>MOVE QUALITY</span>
                <span style="width: 38px;" class="text-start">OPP</span>
              </div>
              <div class="d-flex flex-column gap-1">
                ${this.buildBadgesSummary()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mount Board
    const mount = this.container.querySelector('#review-board-mount');
    this.board = new Chessboard(mount, {
      fen: this.game.initialFen,
      orientation: this.orientation,
      theme: this.theme,
      interactive: false,
    });

    // Bind Navigation Buttons
    this.container.querySelector('#btn-first')?.addEventListener('click', () => this.goToPly(0));
    this.container.querySelector('#btn-prev')?.addEventListener('click', () => this.goToPly(this.currentPly - 1));
    this.container.querySelector('#btn-next')?.addEventListener('click', () => this.goToPly(this.currentPly + 1));
    this.container.querySelector('#btn-last')?.addEventListener('click', () => this.goToPly(this.game.plies.length));
    this.container.querySelector('#btn-key-moment')?.addEventListener('click', () => this.nextKeyMoment());
    this.container.querySelector('#btn-toggle-threat')?.addEventListener('click', () => this.toggleThreat());
    this.container.querySelector('#btn-flip')?.addEventListener('click', () => {
      this.orientation = this.orientation === 'w' ? 'b' : 'w';
      this.updateBoardAndControls();
    });

    // Bind Move rows click
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        const ply = parseInt(e.currentTarget.dataset.ply, 10);
        this.goToPly(ply);
      });
    });

    this.updateBoardAndControls();
  }

  buildMoveTableRows() {
    if (!this.game) return '';
    const plies = this.game.plies;
    let html = '';

    for (let i = 0; i < plies.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whitePly = plies[i];
      const blackPly = plies[i + 1] || null;

      html += `
        <tr>
          <td class="text-secondary fw-bold text-end" style="width: 38px;">${moveNum}.</td>
          <td class="move-list-row cursor-pointer rounded px-2 py-1" data-ply="${whitePly.ply}">
            <div class="d-flex align-items-center justify-content-between">
              <span class="font-monospace">${whitePly.san}</span>
              ${this.renderMiniBadge(whitePly.classification)}
            </div>
          </td>
          ${blackPly ? `
            <td class="move-list-row cursor-pointer rounded px-2 py-1" data-ply="${blackPly.ply}">
              <div class="d-flex align-items-center justify-content-between">
                <span class="font-monospace">${blackPly.san}</span>
                ${this.renderMiniBadge(blackPly.classification)}
              </div>
            </td>
          ` : '<td></td>'}
        </tr>
      `;
    }

    return html;
  }

  renderMiniBadge(cls) {
    if (!cls || cls === 'good') return '';
    const dict = COMIC_DICTIONARY[cls];
    if (!dict) return '';
    return `
      <span class="badge border border-dark rounded-circle d-inline-flex align-items-center justify-content-center"
        title="${dict.words[0]} (${dict.standardLabel})"
        style="width: 20px; height: 20px; font-size: 10px; background-color: ${dict.bg}; color: ${dict.text};">
        ${dict.symbol}
      </span>
    `;
  }

  buildBadgesSummary() {
    if (!this.game) return '';
    const userColor = this.game.userColor || 'w';
    let userCounts = this.game.userCounts;
    let oppCounts = this.game.opponentCounts;

    if (!userCounts || !oppCounts) {
      userCounts = {};
      oppCounts = {};
      (this.game.plies || []).forEach((p) => {
        if (!p) return;
        const isUser = p.color ? (p.color === userColor) : (p.ply % 2 === (userColor === 'w' ? 1 : 0));
        const target = isUser ? userCounts : oppCounts;
        target[p.classification] = (target[p.classification] || 0) + 1;
      });
    }

    const classifications = [
      'brilliant',
      'great',
      'best',
      'excellent',
      'good',
      'book',
      'inaccuracy',
      'mistake',
      'blunder',
      'missed_win'
    ];

    return classifications
      .map((cls) => {
        const dict = COMIC_DICTIONARY[cls];
        if (!dict) return '';
        const userCnt = userCounts[cls] || 0;
        const oppCnt = oppCounts[cls] || 0;
        const hasAny = userCnt > 0 || oppCnt > 0;

        return `
          <div class="d-flex align-items-center justify-content-between py-1 px-2 rounded ${hasAny ? 'bg-body-tertiary bg-opacity-25' : 'opacity-60'}" style="font-size: 12px;">
            <span class="font-monospace fw-black text-end ${userCnt > 0 ? 'text-primary' : 'text-body-tertiary'}" style="width: 38px;">
              ${userCnt}
            </span>
            <span class="badge border border-dark rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
              style="background-color: ${dict.bg}; color: ${dict.text}; font-size: 11px; font-weight: 800; min-width: 125px; justify-content: center;">
              <span>${dict.symbol}</span>
              <span>${dict.words[0]}</span>
            </span>
            <span class="font-monospace fw-black text-start ${oppCnt > 0 ? 'text-secondary' : 'text-body-tertiary'}" style="width: 38px;">
              ${oppCnt}
            </span>
          </div>
        `;
      })
      .join('');
  }
}
