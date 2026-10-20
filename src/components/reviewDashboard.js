/**
 * Vanilla JS Game Review Dashboard Component
 * Displays Stockfish tournament analysis, interactive move history,
 * eval bar, phase ratings, comic sound effect badges, and tactical refutations.
 */

import { Chess } from 'chess.js';
import { Chessboard } from './board.js';
import { soundService } from '../services/sound.js';
import { getComicBadge, COMIC_DICTIONARY } from '../services/comicBadges.js';

export class ReviewDashboard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onOpenImport = options.onOpenImport || null;
    this.onSwitchToBots = options.onSwitchToBots || null;
    this.theme = options.theme || 'green';

    this.game = null; // AnalyzedGame object
    this.currentPly = 0;
    this.orientation = 'w';
    this.isThreatActive = false;
    this.isPlayingPv = false;
    this.pvTimer = null;
    this.board = null;

    this.render();
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    if (this.board) {
      this.board.setProps({ theme: newTheme });
    }
  }

  setGame(analyzedGame) {
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

  updateBoardAndControls() {
    const cur = this.getCurrentEval();
    const fen = cur ? cur.fen : (this.game ? this.game.initialFen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const lastMove = cur ? { from: cur.from, to: cur.to } : null;

    const bestMove = cur?.bestMoveUci && cur.bestMoveUci.length >= 4
      ? { from: cur.bestMoveUci.slice(0, 2), to: cur.bestMoveUci.slice(2, 4) }
      : null;

    const threatMove = this.isThreatActive && cur?.threat?.uci && cur.threat.uci.length >= 4
      ? { from: cur.threat.uci.slice(0, 2), to: cur.threat.uci.slice(2, 4) }
      : null;

    const badge = cur ? { square: cur.to, classification: cur.classification } : null;

    this.board?.setProps({
      fen,
      orientation: this.orientation,
      lastMove,
      bestMove,
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
        stripEl.innerHTML = `
          <div class="d-flex align-items-center gap-2">
            <span class="badge" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 900; font-size: 11px;">
              ${comic.symbol} ${comic.term}
            </span>
            <span class="font-monospace fw-black fs-6">${cur.san}</span>
            <span class="small text-secondary fw-semibold">(${cur.classification.replace('_', ' ')})</span>
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
        stripEl.innerHTML = `<span class="small fw-bold text-secondary">Starting Position</span>`;
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
            with comic sound effect badges (KABOOM!, POW!, ZAP!, SPLAT!), or challenge our 33-bot arena!
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
            <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
              <h6 class="mb-0 fw-black"><i class="bi bi-trophy-fill me-1.5 text-warning"></i>Game Performance</h6>
              <span class="badge bg-success fw-bold font-monospace">${this.game.accuracy.toFixed(1)}% Accuracy</span>
            </div>

            <div class="row g-2 text-center mb-3">
              <div class="col-4">
                <div class="p-2 rounded-3 bg-body-tertiary border">
                  <span class="text-secondary small d-block">Opening</span>
                  <span class="fw-black text-primary">${this.game.phaseElos.opening}</span>
                </div>
              </div>
              <div class="col-4">
                <div class="p-2 rounded-3 bg-body-tertiary border">
                  <span class="text-secondary small d-block">Middlegame</span>
                  <span class="fw-black text-warning">${this.game.phaseElos.middlegame}</span>
                </div>
              </div>
              <div class="col-4">
                <div class="p-2 rounded-3 bg-body-tertiary border">
                  <span class="text-secondary small d-block">Endgame</span>
                  <span class="fw-black text-success">${this.game.phaseElos.endgame}</span>
                </div>
              </div>
            </div>

            <!-- Comic Badges Count Summary -->
            <div class="d-flex flex-wrap gap-1.5 justify-content-center">
              ${this.buildBadgesSummary()}
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
        style="width: 18px; height: 18px; font-size: 9px; background-color: ${dict.bg}; color: ${dict.text};">
        ${dict.standardLabel}
      </span>
    `;
  }

  buildBadgesSummary() {
    if (!this.game) return '';
    const counts = {};
    this.game.plies.forEach((p) => {
      counts[p.classification] = (counts[p.classification] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([cls, cnt]) => {
        const dict = COMIC_DICTIONARY[cls];
        if (!dict) return '';
        return `
          <span class="badge border border-dark rounded-pill px-2.5 py-1.5"
            style="background-color: ${dict.bg}; color: ${dict.text}; font-size: 11px;">
            ${dict.symbol} ${dict.words[0]} : <strong>${cnt}</strong>
          </span>
        `;
      })
      .join('');
  }
}
