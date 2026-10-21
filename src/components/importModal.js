/**
 * Vanilla JS Import Dialog Component
 * Bootstrap 6 Dialog supporting Chess.com, Lichess, and custom PGN imports.
 * Only analyzes user-imported games with live Stockfish progress.
 */

import { fetchChessComGames, fetchLichessGames } from '../services/importApi.js';

export class ImportModal {
  constructor(modalEl, options = {}) {
    this.modalEl = modalEl;
    this.onSelectPgn = options.onSelectPgn || null; // (pgn, userColor) => {}

    this.activeTab = 'chesscom';
    this.username = '';
    this.isFetching = false;
    this.fetchedGames = [];
    this.fetchError = null;
    this.customPgn = '';
    this.customColor = 'w';

    this.isAnalyzing = false;
    this.analysisProgress = { current: 0, total: 0 };
    this.bsDialog = null;

    this.render();
  }

  formatOpeningBadge(eco) {
    if (!eco) {
      return `<span class="badge theme-secondary font-monospace" style="font-size: 10px;">PGN</span>`;
    }
    if (typeof eco === 'string' && eco.startsWith('http')) {
      let label = 'Opening';
      try {
        const slug = eco.split('/openings/')[1] || eco.split('/').filter(Boolean).pop();
        if (slug) {
          const raw = slug.split(/-\d+\./)[0].replace(/-/g, ' ').trim();
          label = decodeURIComponent(raw) || 'Opening';
        }
      } catch {}
      return `<a href="${eco}" target="_blank" rel="noopener noreferrer"
        class="badge theme-warning text-decoration-none border border-warning-subtle text-truncate"
        style="max-width: 140px; font-size: 10px; vertical-align: middle;"
        title="${label} (${eco})"
        onclick="event.stopPropagation();">
        <i class="bi bi-book me-1"></i>${label} <i class="bi bi-box-arrow-up-right ms-0.5" style="font-size: 8px;"></i>
      </a>`;
    }
    return `<span class="badge theme-secondary font-monospace" style="font-size: 10px;">${eco}</span>`;
  }

  getBsDialog() {
    if (this.bsDialog) return this.bsDialog;
    try {
      const Dialog = window.bootstrap?.Dialog || window.bootstrap?.Modal;
      if (Dialog) {
        this.bsDialog = Dialog.getOrCreateInstance(this.modalEl);
      }
      return this.bsDialog;
    } catch {
      return null;
    }
  }

  resetCardStates() {
    this.isAnalyzing = false;
    const container = this.modalEl.querySelector('#import-tab-body');
    if (!container) return;
    container.querySelectorAll('[data-game-id]').forEach((card) => {
      card.style.pointerEvents = 'auto';
      card.style.opacity = '1';
      card.classList.remove('border-warning');
      const btn = card.querySelector('.btn-analyze-card');
      if (btn) {
        btn.innerHTML = `Analyze <i class="bi bi-chevron-right ms-0.5"></i>`;
        btn.classList.remove('disabled');
      }
    });
    const customBtn = container.querySelector('#btn-analyze-custom-pgn');
    if (customBtn) {
      customBtn.innerHTML = `Analyze PGN with Stockfish ⚡`;
      customBtn.disabled = !this.customPgn.trim();
    }
  }

  show() {
    this.resetCardStates();
    const dialog = this.getBsDialog();
    if (dialog && typeof dialog.show === 'function') {
      dialog.show();
    } else if (typeof this.modalEl.showModal === 'function') {
      try {
        if (!this.modalEl.open) this.modalEl.showModal();
      } catch {
        this.modalEl.setAttribute('open', '');
      }
    } else {
      this.modalEl.setAttribute('open', '');
    }
  }

  hide() {
    this.resetCardStates();
    const dialog = this.getBsDialog();
    if (dialog && typeof dialog.hide === 'function') {
      try { dialog.hide(); } catch {}
    }
    if (typeof this.modalEl.close === 'function') {
      try {
        if (this.modalEl.open) this.modalEl.close();
      } catch {
        this.modalEl.removeAttribute('open');
      }
    } else {
      this.modalEl.removeAttribute('open');
    }
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
  }

  setAnalyzing(isAnalyzing, current = 0, total = 0) {
    this.isAnalyzing = isAnalyzing;
    this.analysisProgress = { current, total };
    if (!isAnalyzing) {
      this.resetCardStates();
    }
    this.updateProgress();
  }

  async handleFetch() {
    if (!this.username.trim() || this.isFetching) return;
    this.isFetching = true;
    this.fetchError = null;
    this.fetchedGames = [];
    this.renderTabContent();

    try {
      if (this.activeTab === 'chesscom') {
        const games = await fetchChessComGames(this.username);
        this.fetchedGames = games;
        if (games.length === 0) this.fetchError = 'No recent games found for this player.';
      } else if (this.activeTab === 'lichess') {
        const games = await fetchLichessGames(this.username);
        this.fetchedGames = games;
        if (games.length === 0) this.fetchError = 'No recent games found for this player.';
      }
    } catch (err) {
      this.fetchError = err.message || 'Failed to fetch games.';
    } finally {
      this.isFetching = false;
      this.renderTabContent();
    }
  }

  updateProgress() {
    const progressContainer = this.modalEl.querySelector('#import-analysis-progress');
    const tabsContainer = this.modalEl.querySelector('#import-tabs-content');
    if (!progressContainer || !tabsContainer) return;

    if (this.isAnalyzing) {
      progressContainer.classList.remove('d-none');
      tabsContainer.classList.add('d-none');

      const pct = this.analysisProgress.total > 0
        ? (this.analysisProgress.current / this.analysisProgress.total) * 100
        : 0;

      progressContainer.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-warning mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
          <h5 class="fw-black mb-1">Analyzing Imported Game with Stockfish...</h5>
          <p class="text-secondary small font-medium mb-3">
            Evaluating ply ${this.analysisProgress.current} of ${this.analysisProgress.total} · Generating comic sound effect badges
          </p>
          <div class="progress mx-auto" style="width: 240px; height: 10px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    } else {
      progressContainer.classList.add('d-none');
      tabsContainer.classList.remove('d-none');
    }
  }

  renderTabContent() {
    const container = this.modalEl.querySelector('#import-tab-body');
    if (!container) return;

    if (this.activeTab === 'chesscom' || this.activeTab === 'lichess') {
      const platformName = this.activeTab === 'chesscom' ? 'Chess.com' : 'Lichess';
      container.innerHTML = `
        <div class="d-flex flex-column gap-3">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-person-fill"></i></span>
            <input type="text" class="form-control" id="platform-username-input"
              placeholder="Enter ${platformName} username..." value="${this.username}">
            <button type="button" class="arcade-btn-primary px-3 py-1.5" id="btn-fetch-platform" ${this.isFetching ? 'disabled' : ''}>
              ${this.isFetching ? '<span class="spinner-border spinner-border-sm me-1"></span>Fetching...' : '<i class="bi bi-search me-1"></i>Fetch'}
            </button>
          </div>

          ${this.isFetching ? `
            <div class="placeholder-wave d-flex flex-column gap-2 mt-2 w-100">
              <div class="comic-card-sm p-3 w-100 border border-secondary border-opacity-25">
                <div class="d-flex justify-content-between mb-2">
                  <span class="placeholder col-4 bg-warning rounded py-1"></span>
                  <span class="placeholder col-2 bg-secondary rounded py-1"></span>
                </div>
                <div class="d-flex flex-column gap-1.5">
                  <span class="placeholder col-7 bg-body-secondary rounded"></span>
                  <span class="placeholder col-5 bg-body-secondary rounded"></span>
                </div>
              </div>
              <div class="comic-card-sm p-3 w-100 border border-secondary border-opacity-25">
                <div class="d-flex justify-content-between mb-2">
                  <span class="placeholder col-3 bg-warning rounded py-1"></span>
                  <span class="placeholder col-2 bg-secondary rounded py-1"></span>
                </div>
                <div class="d-flex flex-column gap-1.5">
                  <span class="placeholder col-6 bg-body-secondary rounded"></span>
                  <span class="placeholder col-4 bg-body-secondary rounded"></span>
                </div>
              </div>
            </div>
          ` : ''}

          ${this.fetchError ? `
            <div class="alert theme-danger py-2 px-3 small font-medium mb-0">${this.fetchError}</div>
          ` : ''}

          ${this.fetchedGames.length > 0 ? `
            <div class="d-flex flex-column gap-2 mt-2 w-100">
              <span class="small fw-bold text-secondary">Select a recent game to analyze:</span>
              <div class="d-flex flex-column gap-2 overflow-y-auto overflow-x-hidden w-100" style="max-height: 280px; scrollbar-width: thin;">
                ${this.fetchedGames.map((g) => {
                  const isUserWhite = g.white.toLowerCase() === this.username.trim().toLowerCase();
                  const isUserBlack = g.black.toLowerCase() === this.username.trim().toLowerCase();
                  let userWon = false;
                  let userLost = false;
                  const isDraw = g.result === '1/2-1/2';

                  if (g.result === '1-0') {
                    if (isUserWhite) userWon = true;
                    else if (isUserBlack) userLost = true;
                  } else if (g.result === '0-1') {
                    if (isUserBlack) userWon = true;
                    else if (isUserWhite) userLost = true;
                  }

                  let resultBadge = '';
                  if (userWon) {
                    resultBadge = `<span class="badge bg-success text-white fw-bold px-2 py-1 flex-shrink-0"><i class="bi bi-trophy-fill me-1"></i>Win</span>`;
                  } else if (userLost) {
                    resultBadge = `<span class="badge bg-danger text-white fw-bold px-2 py-1 flex-shrink-0"><i class="bi bi-x-circle-fill me-1"></i>Loss</span>`;
                  } else if (isDraw) {
                    resultBadge = `<span class="badge bg-secondary text-white fw-bold px-2 py-1 flex-shrink-0">Draw</span>`;
                  } else {
                    resultBadge = `<span class="badge bg-body-secondary text-dark fw-bold px-2 py-1 flex-shrink-0">${g.result}</span>`;
                  }

                  let tcIcon = 'bi-stopwatch';
                  if (g.timeControl && (g.timeControl.includes('+') || !isNaN(Number(g.timeControl)))) {
                    tcIcon = 'bi-lightning-charge-fill';
                  }

                  return `
                    <div class="imported-game-card comic-card-sm p-2.5 p-sm-3 cursor-pointer w-100" data-game-id="${g.id}">
                      <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                        <div class="d-flex align-items-center gap-1.5 flex-wrap" style="min-width: 0;">
                          <span class="badge bg-warning-subtle text-dark border border-warning-subtle fw-bold" style="font-size: 11px;">
                            <i class="bi ${tcIcon} me-1"></i>${g.timeControl}
                          </span>
                          ${this.formatOpeningBadge(g.eco)}
                          <span class="text-secondary small" style="font-size: 11px;">
                            ${g.date}
                          </span>
                        </div>
                        ${resultBadge}
                      </div>

                      <div class="d-flex align-items-center justify-content-between gap-2" style="min-width: 0;">
                        <div class="d-flex flex-column gap-1 flex-grow-1" style="min-width: 0; overflow: hidden;">
                          <div class="d-flex align-items-center gap-1.5 ${isUserWhite ? 'fw-black text-warning' : 'fw-semibold text-body'}" style="min-width: 0;">
                            <span class="player-dot white-dot flex-shrink-0"></span>
                            <span class="text-truncate" style="max-width: 140px;">${g.white}</span>
                            <span class="badge bg-body-secondary text-secondary font-monospace flex-shrink-0" style="font-size: 10px;">${g.whiteElo}</span>
                            ${isUserWhite ? '<span class="badge bg-warning text-dark fw-bold flex-shrink-0" style="font-size: 9px;">YOU</span>' : ''}
                          </div>

                          <div class="d-flex align-items-center gap-1.5 ${isUserBlack ? 'fw-black text-warning' : 'fw-semibold text-body'}" style="min-width: 0;">
                            <span class="player-dot black-dot flex-shrink-0"></span>
                            <span class="text-truncate" style="max-width: 140px;">${g.black}</span>
                            <span class="badge bg-body-secondary text-secondary font-monospace flex-shrink-0" style="font-size: 10px;">${g.blackElo}</span>
                            ${isUserBlack ? '<span class="badge bg-warning text-dark fw-bold flex-shrink-0" style="font-size: 9px;">YOU</span>' : ''}
                          </div>
                        </div>

                        <div class="d-flex align-items-center ms-2 flex-shrink-0">
                          <button type="button" class="btn btn-sm btn-outline-warning comic-btn px-2.5 py-1 text-nowrap btn-analyze-card">
                            Analyze <i class="bi bi-chevron-right ms-0.5"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const input = container.querySelector('#platform-username-input');
      input?.addEventListener('input', (e) => { this.username = e.target.value; });
      input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleFetch(); });
      container.querySelector('#btn-fetch-platform')?.addEventListener('click', () => this.handleFetch());

      container.querySelectorAll('[data-game-id]').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (this.isAnalyzing) return;
          const gameId = e.currentTarget.getAttribute('data-game-id');
          const game = this.fetchedGames.find((g) => g.id === gameId);
          if (game && this.onSelectPgn) {
            this.isAnalyzing = true;
            const isWhite = game.white.toLowerCase() === this.username.trim().toLowerCase();
            const btn = card.querySelector('.btn-analyze-card');
            if (btn) {
              btn.innerHTML = `<span class="spinner-border spinner-border-sm text-warning me-1"></span>Analyzing...`;
              btn.classList.add('disabled');
            }
            container.querySelectorAll('[data-game-id]').forEach((c) => {
              c.style.pointerEvents = 'none';
              c.style.opacity = '0.65';
            });
            card.style.opacity = '1';
            card.classList.add('border-warning');
            setTimeout(() => {
              this.onSelectPgn(game.pgn, isWhite ? 'w' : 'b');
            }, 40);
          }
        });
      });
    } else {
      // Paste PGN Tab
      container.innerHTML = `
        <div class="d-flex flex-column gap-3">
          <div>
            <label class="form-label small fw-bold mb-1">Paste standard PGN notation below:</label>
            <textarea class="form-control font-monospace" id="custom-pgn-textarea" rows="6"
              placeholder="[Event &quot;Live Chess&quot;]&#10;1. e4 e5 2. Nf3 Nc6 3. Bc4...">${this.customPgn}</textarea>
          </div>

          <div class="d-flex align-items-center justify-content-between">
            <span class="small fw-bold text-secondary">Analyze perspective:</span>
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-sm ${this.customColor === 'w' ? 'btn-dark' : 'btn-outline-dark'} fw-bold" id="btn-color-white">White</button>
              <button type="button" class="btn btn-sm ${this.customColor === 'b' ? 'btn-dark' : 'btn-outline-dark'} fw-bold" id="btn-color-black">Black</button>
            </div>
          </div>

          <button type="button" class="arcade-btn-primary py-2.5 w-100 fw-black" id="btn-analyze-custom-pgn" ${!this.customPgn.trim() ? 'disabled' : ''}>
            Analyze PGN with Stockfish ⚡
          </button>
        </div>
      `;

      const textarea = container.querySelector('#custom-pgn-textarea');
      const submitBtn = container.querySelector('#btn-analyze-custom-pgn');

      textarea?.addEventListener('input', (e) => {
        this.customPgn = e.target.value;
        if (submitBtn) {
          submitBtn.disabled = !this.customPgn.trim();
        }
      });

      container.querySelector('#btn-color-white')?.addEventListener('click', () => {
        this.customColor = 'w';
        this.renderTabContent();
      });

      container.querySelector('#btn-color-black')?.addEventListener('click', () => {
        this.customColor = 'b';
        this.renderTabContent();
      });

      submitBtn?.addEventListener('click', () => {
        if (this.customPgn.trim() && this.onSelectPgn) {
          submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Starting Review...`;
          submitBtn.disabled = true;
          this.onSelectPgn(this.customPgn.trim(), this.customColor);
        }
      });
    }
  }

  render() {
    this.modalEl.innerHTML = `
      <div class="dialog-header border-bottom bg-body-tertiary px-4 py-3">
        <h5 class="dialog-title fw-black"><i class="bi bi-cloud-arrow-up-fill me-2 fg-warning"></i>Import Game for Review ⚡</h5>
        <button type="button" class="btn-close" id="btn-modal-close" data-bs-dismiss="dialog" aria-label="Close"></button>
      </div>

      <!-- Progress overlay when analyzing -->
      <div id="import-analysis-progress" class="d-none px-4"></div>

      <!-- Tab Selector -->
      <div id="import-tabs-content">
        <ul class="nav nav-tabs nav-fill border-bottom bg-body-tertiary px-3 pt-2">
          <li class="nav-item">
            <button class="nav-link ${this.activeTab === 'chesscom' ? 'active fw-black fg-warning' : 'fw-bold'}" data-import-tab="chesscom">
              <span class="badge theme-success rounded-circle p-1 me-1"> </span> Chess.com
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link ${this.activeTab === 'lichess' ? 'active fw-black fg-warning' : 'fw-bold'}" data-import-tab="lichess">
              <i class="bi bi-globe me-1 fg-info"></i> Lichess
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link ${this.activeTab === 'pgn' ? 'active fw-black fg-warning' : 'fw-bold'}" data-import-tab="pgn">
              <i class="bi bi-file-text-fill me-1 fg-primary"></i> Paste PGN
            </button>
          </li>
        </ul>

        <div class="dialog-body p-3 sm:p-4 overflow-x-hidden" id="import-tab-body"></div>
      </div>
    `;

    // Explicit close button click
    this.modalEl.querySelector('#btn-modal-close')?.addEventListener('click', () => this.hide());

    // Native dialog cancel event (pressing Escape)
    this.modalEl.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.hide();
    });

    // Backdrop click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.hide();
      }
    });

    // Bind tab clicks
    this.modalEl.querySelectorAll('[data-import-tab]').forEach((tabBtn) => {
      tabBtn.addEventListener('click', (e) => {
        this.activeTab = e.currentTarget.getAttribute('data-import-tab');
        this.fetchError = null;
        this.render();
      });
    });

    this.renderTabContent();
  }
}
