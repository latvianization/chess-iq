/**
 * Vanilla JS Game Review Dashboard Component
 * Displays Stockfish tournament analysis, interactive move history,
 * eval bar, phase ratings, comic sound effect badges, and tactical refutations.
 */

const Chess = window.Chess;
import { Chessboard } from './board.js';
import { soundService } from '../services/sound.js';
import { getComicBadge, COMIC_DICTIONARY } from '../services/comicBadges.js';
import { findBestMoveLocal, FEN_EVAL_CACHE } from '../services/engine.js';

function createCurvedPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

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
    this.advantagePoints = [];
    this.advantageMidY = 42;
    this.isRetryingMistake = false;
    this.retryHintActive = false;

    this.initKeyboardNavigation();
    this.render();
  }

  initKeyboardNavigation() {
    this.handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!this.game || this.isRetryingMistake) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.goToPly(this.currentPly - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.goToPly(this.currentPly + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'Home') {
        e.preventDefault();
        this.goToPly(0);
      } else if (e.key === 'ArrowDown' || e.key === 'End') {
        e.preventDefault();
        this.goToPly(this.game.plies.length);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.nextKeyMoment();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.orientation = this.orientation === 'w' ? 'b' : 'w';
        this.updateBoardAndControls();
      }
    };
    window.addEventListener('keydown', this.handleKeyDown);
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
    if (this.isRetryingMistake) {
      this.stopRetryMistake();
    }
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

  startRetryMistake() {
    const cur = this.getCurrentEval();
    if (!cur || !cur.bestMoveUci || !cur.fenBefore) return;

    this.isRetryingMistake = true;
    this.retryHintActive = false;
    this.stopPvPlayback();

    const banner = this.container.querySelector('#pv-banner-area');
    if (banner) {
      const turnName = cur.color === 'w' ? 'White' : 'Black';
      banner.classList.remove('d-none');
      banner.innerHTML = `
        <div class="alert alert-warning comic-card-sm d-flex align-items-center justify-content-between p-2.5 mb-2 rounded-3">
          <div class="d-flex align-items-center gap-2">
            <span class="spinner-grow spinner-grow-sm text-warning"></span>
            <span class="small fw-bold">Retry Mistake · <strong>${turnName}</strong> to find the best move</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-outline-dark fw-bold comic-btn" id="retry-hint-btn">Hint</button>
            <button type="button" class="btn btn-sm btn-light fw-bold comic-btn" id="retry-exit-btn">Exit</button>
          </div>
        </div>
      `;

      banner.querySelector('#retry-hint-btn')?.addEventListener('click', () => {
        this.retryHintActive = true;
        const fromSq = cur.bestMoveUci.slice(0, 2);
        const hintEl = banner.querySelector('strong');
        if (hintEl) hintEl.textContent = `Hint: piece starts on ${fromSq}`;
        if (this.board) {
          this.board.setProps({
            bestMove: { from: fromSq, to: fromSq }
          });
        }
      });

      banner.querySelector('#retry-exit-btn')?.addEventListener('click', () => {
        this.stopRetryMistake();
      });
    }

    if (this.board) {
      const testChess = new Chess(cur.fenBefore);
      this.board.setProps({
        fen: cur.fenBefore,
        orientation: this.orientation,
        interactive: true,
        lastMove: null,
        bestMove: null,
        secondBestMove: null,
        threatMove: null,
        badge: null,
        legalMovesFrom: (sq) => {
          const moves = testChess.moves({ square: sq, verbose: true });
          return moves.map((m) => m.to);
        },
        onMove: (from, to) => {
          const promo = (to.endsWith('8') || to.endsWith('1')) ? 'q' : undefined;
          const playedUci = `${from}${to}${promo || ''}`;
          const isCorrect = playedUci.startsWith(cur.bestMoveUci.slice(0, 4));

          if (isCorrect) {
            soundService.playSuccess();
            try {
              if (typeof window.confetti === 'function') {
                window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
              }
            } catch {}

            const bannerAlert = banner?.querySelector('.alert');
            if (bannerAlert) {
              bannerAlert.className = 'alert alert-success comic-card-sm d-flex align-items-center justify-content-between p-2.5 mb-2 rounded-3';
              bannerAlert.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-check-circle-fill text-success fs-5"></i>
                  <span class="small fw-bold">Solved! That's the best move: <strong>${cur.bestMoveSan || cur.bestMoveUci}</strong></span>
                </div>
              `;
            }

            testChess.move({ from, to, promotion: promo });
            this.board?.setProps({
              fen: testChess.fen(),
              interactive: false,
              lastMove: { from, to }
            });

            setTimeout(() => {
              this.stopRetryMistake();
            }, 1800);
          } else {
            soundService.playBlunder();
            const bannerStrong = banner?.querySelector('strong');
            if (bannerStrong) {
              bannerStrong.textContent = `Not quite. Try another move!`;
            }
            this.board?.setProps({ fen: cur.fenBefore, interactive: true });
          }
        }
      });
    }
  }

  stopRetryMistake() {
    this.isRetryingMistake = false;
    this.retryHintActive = false;
    const banner = this.container.querySelector('#pv-banner-area');
    if (banner) {
      banner.innerHTML = '';
      banner.classList.add('d-none');
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
      const fastKey = typeof normalizeFenKey === 'function' ? `${normalizeFenKey(fen)}_fast` : fen;
      const deepKey = typeof normalizeFenKey === 'function' ? `${normalizeFenKey(fen)}_deep` : fen;
      const cached = typeof FEN_EVAL_CACHE !== 'undefined'
        ? (FEN_EVAL_CACHE.get(deepKey) || FEN_EVAL_CACHE.get(fastKey) || FEN_EVAL_CACHE.get(fen))
        : null;
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
      const isOptimal = ['best', 'brilliant', 'great', 'book'].includes(cur.classification);
      let bestUci = cur.bestMoveUci;
      let secondUci = cur.secondBestMoveUci;

      if (!bestUci || !secondUci) {
        const top = this.getTopMovesForFen(cur.fenBefore);
        if (!bestUci && top.best) bestUci = `${top.best.from}${top.best.to}`;
        if (!secondUci && top.second) secondUci = `${top.second.from}${top.second.to}`;
      }

      if (isOptimal) {
        bestMove = { from: cur.from, to: cur.to };
        secondBestMove = null;
      } else {
        bestMove = bestUci && bestUci.length >= 4
          ? { from: bestUci.slice(0, 2), to: bestUci.slice(2, 4) }
          : null;

        secondBestMove = secondUci && secondUci.length >= 4 && (secondUci.slice(0, 2) !== bestMove?.from || secondUci.slice(2, 4) !== bestMove?.to)
          ? { from: secondUci.slice(0, 2), to: secondUci.slice(2, 4) }
          : null;
      }
    } else {
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
    this.updateAdvantageScrubber();

    // Update Move Strip Badge & Notation
    const stripEl = this.container.querySelector('#review-move-strip');
    if (stripEl) {
      if (cur) {
        const comic = getComicBadge(cur.classification, cur.san);
        const evalStr = cur.mate !== null
          ? `M${Math.abs(cur.mate)}`
          : (cur.scoreCp > 0 ? `+${(cur.scoreCp / 100).toFixed(1)}` : (cur.scoreCp / 100).toFixed(1));

        const isOptimal = ['best', 'brilliant', 'great', 'book'].includes(cur.classification);
        const isSuboptimal = !isOptimal;
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
            ${['inaccuracy', 'mistake', 'blunder'].includes(cur.classification) ? `
              <button type="button" class="btn btn-sm btn-warning fw-bold comic-btn" id="btn-retry-mistake" title="Practice finding the best move">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Retry
              </button>
            ` : ''}
            ${cur.tacticalContinuation && cur.tacticalContinuation.length > 0 ? `
              <button type="button" class="btn btn-sm btn-outline-primary fw-bold comic-btn" id="btn-show-why">
                <i class="bi bi-play-fill me-1"></i>Show Why
              </button>
            ` : ''}
          </div>
        `;
        stripEl.querySelector('#btn-retry-mistake')?.addEventListener('click', () => this.startRetryMistake());
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

    // Update Active Row in Move Table (scroll container only, never whole window)
    const scrollContainer = this.container.querySelector('.move-history-container');
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      const plyNum = parseInt(row.dataset.ply, 10);
      if (plyNum === this.currentPly) {
        row.classList.add('bg-warning-subtle', 'fw-black', 'border', 'border-warning');
        if (scrollContainer) {
          const rowTop = row.offsetTop;
          const rowHeight = row.offsetHeight;
          const containerTop = scrollContainer.scrollTop;
          const containerHeight = scrollContainer.clientHeight;
          if (rowTop < containerTop) {
            scrollContainer.scrollTop = rowTop;
          } else if (rowTop + rowHeight > containerTop + containerHeight) {
            scrollContainer.scrollTop = rowTop + rowHeight - containerHeight;
          }
        }
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
    const fillEl = this.container.querySelector('.eval-white-fill');
    const badgeEl = this.container.querySelector('.eval-score-badge');
    if (!fillEl || !badgeEl) return;

    let winProb = cur ? cur.winProb : 0.5;
    if (typeof winProb !== 'number' || isNaN(winProb)) winProb = 0.5;
    let whitePercent = Math.min(97, Math.max(3, winProb * 100));

    if (this.orientation === 'b') {
      fillEl.style.top = '0';
      fillEl.style.bottom = 'auto';
    } else {
      fillEl.style.bottom = '0';
      fillEl.style.top = 'auto';
    }
    fillEl.style.height = `${whitePercent}%`;

    let evalStr = '0.0';
    if (cur) {
      if (cur.mate !== null && typeof cur.mate !== 'undefined') {
        evalStr = `M${Math.abs(cur.mate)}`;
      } else {
        const cpVal = (cur.scoreCp || 0) / 100;
        evalStr = cpVal > 0 ? `+${cpVal.toFixed(1)}` : cpVal.toFixed(1);
      }
    }
    badgeEl.textContent = evalStr;

    const isWhiteDominant = whitePercent >= 50;
    const placeAtBottom = (this.orientation === 'w') ? isWhiteDominant : !isWhiteDominant;
    if (placeAtBottom) {
      badgeEl.style.bottom = '6px';
      badgeEl.style.top = 'auto';
    } else {
      badgeEl.style.top = '6px';
      badgeEl.style.bottom = 'auto';
    }
    badgeEl.style.color = isWhiteDominant ? '#0f172a' : '#f8fafc';
  }

  updateAdvantageScrubber() {
    if (!this.game || !this.advantagePoints || this.advantagePoints.length === 0) return;
    const group = this.container.querySelector('#advantage-scrubber-group');
    const line = this.container.querySelector('#scrubber-line');
    const circle = this.container.querySelector('#scrubber-circle');
    if (!group || !line || !circle) return;

    if (this.currentPly > 0 && this.currentPly <= this.advantagePoints.length) {
      const pt = this.advantagePoints[this.currentPly - 1];
      group.style.display = 'inline';
      line.setAttribute('x1', pt.x);
      line.setAttribute('x2', pt.x);
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
    } else if (this.currentPly === 0 && this.advantagePoints.length > 0) {
      const pt = this.advantagePoints[0];
      group.style.display = 'inline';
      line.setAttribute('x1', pt.x);
      line.setAttribute('x2', pt.x);
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', this.advantageMidY || 42);
    } else {
      group.style.display = 'none';
    }
  }

  renderAdvantageChart() {
    const chartArea = this.container.querySelector('#advantage-chart-area');
    if (!chartArea || !this.game || !this.game.plies || this.game.plies.length === 0) {
      if (chartArea) chartArea.innerHTML = '';
      return;
    }

    const totalPlies = this.game.plies.length;
    const width = 1000;
    const height = 84;
    const midY = height / 2;
    const padX = 12;
    const padY = 10;

    this.advantageMidY = midY;
    this.advantagePoints = this.game.plies.map((ply, i) => {
      const x = padX + (i / (totalPlies - 1 || 1)) * (width - padX * 2);
      const prob = typeof ply.winProb === 'number' && !isNaN(ply.winProb) ? ply.winProb : 0.5;
      const y = padY + (1 - prob) * (height - padY * 2);
      return { x, y, ply };
    });

    const curveD = createCurvedPath(this.advantagePoints);
    const firstX = this.advantagePoints[0].x;
    const lastX = this.advantagePoints[this.advantagePoints.length - 1].x;
    const areaD = `${curveD} L ${lastX} ${midY} L ${firstX} ${midY} Z`;

    const selectedPoint = (this.currentPly > 0 && this.currentPly <= totalPlies)
      ? this.advantagePoints[this.currentPly - 1]
      : (this.advantagePoints[0] || null);

    const mgPly = this.game.middlegameStartPly;
    const egPly = this.game.endgameStartPly;

    let phaseMarkersSvg = '';
    if (mgPly > 1 && mgPly <= totalPlies) {
      const mgPt = this.advantagePoints[mgPly - 1];
      phaseMarkersSvg += `
        <line x1="${mgPt.x}" y1="6" x2="${mgPt.x}" y2="${height - 6}" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65" />
        <text x="${mgPt.x}" y="12" fill="#93c5fd" font-size="9" font-weight="700" font-family="JetBrains Mono, monospace" text-anchor="middle">Middle</text>
      `;
    }
    if (egPly > 1 && egPly <= totalPlies) {
      const egPt = this.advantagePoints[egPly - 1];
      phaseMarkersSvg += `
        <line x1="${egPt.x}" y1="6" x2="${egPt.x}" y2="${height - 6}" stroke="#34d399" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65" />
        <text x="${egPt.x}" y="12" fill="#6ee7b7" font-size="9" font-weight="700" font-family="JetBrains Mono, monospace" text-anchor="middle">Endgame</text>
      `;
    }

    chartArea.innerHTML = `
      <div class="d-flex align-items-center justify-content-between px-1 pb-1 mb-1 border-bottom border-secondary border-opacity-25">
        <div class="d-flex align-items-center gap-1.5">
          <i class="bi bi-graph-up text-primary small"></i>
          <span class="small fw-black" style="font-size: 11px;">Advantage Timeline</span>
        </div>
        <div class="d-flex align-items-center gap-2 font-monospace" style="font-size: 10px;">
          <span class="d-flex align-items-center gap-1 text-info"><span class="rounded-circle d-inline-block bg-info" style="width: 6px; height: 6px;"></span>White+</span>
          <span class="d-flex align-items-center gap-1 text-secondary"><span class="rounded-circle d-inline-block bg-secondary" style="width: 6px; height: 6px;"></span>Black+</span>
        </div>
      </div>
      <div class="advantage-chart-canvas position-relative" id="advantage-chart-canvas">
        <svg class="w-100 h-100" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="display: block;">
          <defs>
            <linearGradient id="advWhiteGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <!-- 50% Equality Line -->
          <line x1="0" y1="${midY}" x2="${width}" y2="${midY}" stroke="#475569" stroke-width="1" stroke-dasharray="4,4" opacity="0.5" />
          <!-- Gradient Area -->
          <path d="${areaD}" fill="url(#advWhiteGrad)" />
          <!-- Main Advantage Spline -->
          <path d="${curveD}" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          <!-- Phase Markers -->
          ${phaseMarkersSvg}
          <!-- Active Move Scrubber -->
          <g id="advantage-scrubber-group" style="display: ${selectedPoint ? 'inline' : 'none'};">
            <line id="scrubber-line" x1="${selectedPoint?.x || 0}" y1="0" x2="${selectedPoint?.x || 0}" y2="${height}" stroke="#fbbf24" stroke-width="1.8" opacity="0.9" />
            <circle id="scrubber-circle" cx="${selectedPoint?.x || 0}" cy="${this.currentPly === 0 ? midY : (selectedPoint?.y || midY)}" r="4" fill="#fbbf24" stroke="#0f172a" stroke-width="1.5" />
          </g>
        </svg>
        <div id="advantage-chart-tooltip" class="position-absolute d-none px-2 py-1 rounded bg-dark border border-secondary shadow text-white small" style="pointer-events: none; z-index: 10; font-size: 11px;"></div>
      </div>
    `;

    const canvas = chartArea.querySelector('#advantage-chart-canvas');
    const tooltip = chartArea.querySelector('#advantage-chart-tooltip');
    if (canvas) {
      const handleInteraction = (clientX) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0) return;
        const relX = clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, relX / rect.width));
        const targetPly = Math.max(1, Math.min(totalPlies, Math.round(ratio * (totalPlies - 1)) + 1));
        this.goToPly(targetPly);
      };

      canvas.addEventListener('click', (e) => handleInteraction(e.clientX));

      let isDragging = false;
      canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleInteraction(e.clientX);
      });
      window.addEventListener('mousemove', (e) => {
        if (isDragging) handleInteraction(e.clientX);
      });
      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      canvas.addEventListener('mousemove', (e) => {
        if (!tooltip || !this.game || !this.game.plies.length) return;
        const rect = canvas.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, relX / rect.width));
        const idx = Math.max(0, Math.min(totalPlies - 1, Math.round(ratio * (totalPlies - 1))));
        const ply = this.game.plies[idx];
        if (!ply) return;

        const dict = COMIC_DICTIONARY[ply.classification] || COMIC_DICTIONARY['good'];
        const evalStr = ply.mate !== null && typeof ply.mate !== 'undefined'
          ? `M${Math.abs(ply.mate)}`
          : (ply.scoreCp > 0 ? `+${(ply.scoreCp / 100).toFixed(1)}` : (ply.scoreCp / 100).toFixed(1));

        tooltip.innerHTML = `
          <div class="d-flex align-items-center gap-1.5 font-monospace">
            <span class="badge border border-dark rounded-circle" style="background:${dict.bg}; color:${dict.text}; width:16px; height:16px; padding:0; display:inline-flex; align-items:center; justify-content:center; font-size:9px;">
              ${dict.symbol}
            </span>
            <span class="fw-bold">${ply.ply}. ${ply.san}</span>
            <span class="text-info fw-bold">(${evalStr})</span>
          </div>
        `;
        tooltip.classList.remove('d-none');
        const tipWidth = tooltip.offsetWidth || 120;
        const leftPos = Math.max(8, Math.min(rect.width - tipWidth - 8, relX + 10));
        tooltip.style.left = `${leftPos}px`;
        tooltip.style.top = `6px`;
      });

      canvas.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.classList.add('d-none');
      });
    }
  }

  render() {
    if (this.isAnalyzing) {
      const pct = this.analysisProgress.total > 0
        ? Math.round((this.analysisProgress.current / this.analysisProgress.total) * 100)
        : 10;
      this.container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-4 sm:p-5 text-center comic-card max-w-xl mx-auto my-5 shadow-lg" id="review-analysis-card">
          <div class="spinner-border text-warning mb-3" style="width: 3.5rem; height: 3.5rem;" role="status"></div>
          <h4 class="fw-black mb-1">Analyzing Game with Stockfish...</h4>
          <p class="fg-secondary small mb-3 fw-bold" id="review-analysis-subtitle">
            ${this.analysisProgress.total > 0 ? `Evaluating ply ${this.analysisProgress.current} of ${this.analysisProgress.total}...` : 'Starting rapid engine analysis...'}
          </p>
          <div class="progress w-100 max-w-md mx-auto mb-2" style="height: 14px; border: 2px solid #000000; border-radius: 999px; background: rgba(0,0,0,0.08);">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" id="review-analysis-bar" style="width: ${pct}%; transition: width 0.15s ease;"></div>
          </div>
          <div class="d-flex align-items-center justify-content-between w-100 max-w-md fg-secondary small font-monospace fw-bold px-1">
            <span id="review-analysis-step">${this.analysisProgress.total > 0 ? `${this.analysisProgress.current} / ${this.analysisProgress.total} plies` : 'Initializing...'}</span>
            <span class="badge bg-warning text-dark font-monospace" id="review-analysis-eta">Estimating time...</span>
            <span id="review-analysis-pct">${pct}%</span>
          </div>
        </div>
      `;
      return;
    }

    if (!this.game) {
      // Zero State (No game active)
      this.container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-4 sm:p-5 text-center comic-card max-w-2xl mx-auto my-4">
          <div class="badge bg-warning text-dark border border-dark rounded-4 p-3 fs-1 mb-3 shadow-sm d-inline-flex align-items-center justify-content-center" style="width: 72px; height: 72px;">
            <span class="lh-1" style="font-size: 2.25rem;">♟</span>
          </div>
          <h3 class="fw-black mb-2">No Game Currently in Review</h3>
          <p class="fg-secondary small max-w-md mx-auto mb-4 font-medium leading-relaxed">
            Import a game from Chess.com, Lichess, or paste any PGN to run deep Stockfish engine diagnostics
            with move quality classifications, phase ratings, and key moment analysis, or challenge our 33-bot arena!
          </p>
          <div class="d-flex align-items-center gap-3">
            <button type="button" class="btn-solid theme-warning comic-btn px-4 py-2.5" id="zero-btn-import" data-bs-toggle="modal" data-bs-target="#import-modal">
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
        <!-- Left: Board Column -->
        <div class="col-12 col-lg-6 col-xl-5 mobile-sticky-top">
          <!-- PV Banner (Tactical line playback) -->
          <div id="pv-banner-area" class="d-none"></div>

          <div class="d-flex align-items-stretch justify-content-center gap-2 gap-sm-3 mb-2">
            <!-- Vertical Animated Eval Bar -->
            <div class="eval-bar-wrapper flex-shrink-0" id="eval-bar">
              <div class="eval-white-fill"></div>
              <div class="eval-score-badge text-white">0.0</div>
            </div>

            <!-- Chessboard Mount -->
            <div class="flex-grow-1 d-flex justify-content-center" id="review-board-mount"></div>
          </div>

          <!-- Move Notation & Comic Sound Effect Strip -->
          <div class="comic-card-sm p-2.5 mb-2 d-flex align-items-center justify-content-between" id="review-move-strip"></div>

          <!-- Step Navigation Bar -->
          <div class="comic-card-sm p-2 d-flex flex-column gap-2 mb-2">
            <!-- Row 1: Big Thumb-Friendly Step Controls -->
            <div class="d-flex align-items-center justify-content-between gap-1.5">
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-first" title="First Move">
                <i class="bi bi-chevron-bar-left fs-6"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-prev" title="Previous Move">
                <i class="bi bi-chevron-left fs-5 fw-black me-1"></i><span class="small fw-black d-none sm:inline">Prev</span>
              </button>

              <span class="badge bg-secondary font-monospace px-2.5 sm:px-3 py-2 fs-6 fw-bold flex-shrink-0" id="ply-counter">0 / 0</span>

              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-next" title="Next Move">
                <span class="small fw-black d-none sm:inline me-1">Next</span><i class="bi bi-chevron-right fs-5 fw-black"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-last" title="Last Move">
                <i class="bi bi-chevron-bar-right fs-6"></i>
              </button>
            </div>

            <!-- Row 2: Actions (Key Moment, Threat, Flip) -->
            <div class="d-flex align-items-center justify-content-between gap-2">
              <button type="button" class="btn btn-warning comic-btn flex-grow-1 py-1.5 fw-black" id="btn-key-moment" title="Next Key Moment">
                <i class="bi bi-lightning-charge-fill me-1"></i>Key Moment
              </button>
              <button type="button" class="btn btn-outline-danger comic-btn px-2.5 py-1.5" id="btn-toggle-threat" title="Toggle Threat Arrow">
                <i class="bi bi-shield-slash me-1"></i>Threat
              </button>
              <button type="button" class="btn btn-light comic-btn px-2.5 py-1.5" id="btn-flip" title="Flip Board">
                <i class="bi bi-arrow-left-right me-1"></i>Flip
              </button>
            </div>
          </div>

          <!-- Advantage Timeline Line Graph -->
          <div class="comic-card-sm p-2 mb-2" id="advantage-chart-area"></div>
        </div>

        <!-- Right: Move List & Performance Stats in Columns on Desktop -->
        <div class="col-12 col-lg-6 col-xl-7 d-flex flex-column gap-3">
          <!-- Match Overview Header Card -->
          <div class="comic-card p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="fw-black fs-6 text-truncate" style="max-width: 280px;">
                  ${this.game.white} vs ${this.game.black}
                </div>
                <div class="text-secondary small" style="font-size: 11px;">
                  ${this.game.ecoName || this.game.ecoCode || 'Chess Match'} · ${this.game.date || ''}
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-2 py-1" id="btn-share-review" title="Copy Review Summary to Clipboard">
                  <i class="bi bi-share me-1"></i>Share
                </button>
                <span class="badge ${this.game.result === '1-0' ? 'bg-success' : this.game.result === '0-1' ? 'bg-danger' : 'bg-secondary'} font-monospace px-2.5 py-1.5 fs-6">
                  ${this.game.result}
                </span>
              </div>
            </div>
          </div>

          <!-- Desktop Columns: Move History & Performance Cards Side-by-Side -->
          <div class="row g-3">
            <!-- Column 1: Move History List -->
            <div class="col-12 col-md-6">
              <div class="comic-card p-3 h-100 d-flex flex-column">
                <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                  <h6 class="mb-0 fw-black"><i class="bi bi-list-ol me-1.5 text-warning"></i>Move History</h6>
                  <span class="badge bg-body-secondary text-dark fw-bold font-monospace">${this.game.plies.length} Plies</span>
                </div>
                <div class="move-history-container flex-grow-1" style="max-height: 480px;">
                  <table class="table table-sm table-hover align-middle mb-0" style="font-size: 13px;">
                    <tbody>
                      ${this.buildMoveTableRows()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Column 2: Phase Accuracy & Elo Card + Quality Breakdown -->
            <div class="col-12 col-md-6">
              <div class="comic-card p-3 h-100 d-flex flex-column gap-3">
                <div class="d-flex align-items-center justify-content-between border-bottom pb-2">
                  <h6 class="mb-0 fw-black"><i class="bi bi-trophy-fill me-1.5 text-warning"></i>Game Performance</h6>
                  <span class="badge bg-body-secondary text-secondary font-monospace fw-bold" style="font-size: 11px;">You vs Opponent</span>
                </div>

                <!-- Dual Accuracy Comparison -->
                <div class="row g-2">
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
                <div class="row g-2 text-center">
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

    this.container.querySelector('#btn-share-review')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const text = `⚡ Chess IQ Game Review
${this.game.white} (${userAcc}%) vs ${this.game.black} (${oppAcc}%)
Opening: ${this.game.ecoName || this.game.ecoCode || 'Standard'}
Total Moves: ${Math.ceil((this.game.plies?.length || 0) / 2)} moves
Result: ${this.game.result || '*'}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = `<i class="bi bi-check2 me-1"></i>Copied!`;
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
          }
        });
      }
    });

    // Bind Move rows click
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        const ply = parseInt(e.currentTarget.dataset.ply, 10);
        this.goToPly(ply);
      });
    });

    this.renderAdvantageChart();
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
