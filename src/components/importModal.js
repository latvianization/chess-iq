/**
 * Vanilla JS Import Modal Component
 * Bootstrap 5 modal supporting Chess.com imports.
 * Only analyzes user-imported games with live Stockfish progress.
 */

class ImportModal {
  constructor(modalEl, options = {}) {
    this.modalEl = modalEl;
    this.onSelectPgn = options.onSelectPgn || null; // (pgn, userColor) => {}

    this.activeTab = 'chesscom';
    this.username = '';
    this.isFetching = false;
    this.fetchedGames = [];
    this.fetchError = null;

    this.isAnalyzing = false;
    this.analysisProgress = { current: 0, total: 0 };
    this.bsModal = null;

    try {
      const saved = JSON.parse(localStorage.getItem('chess_iq_imported_games') || 'null');
      if (saved && Array.isArray(saved.games) && saved.games.length > 0) {
        this.username = saved.username || '';
        this.activeTab = 'chesscom';
        this.fetchedGames = saved.games;
        backgroundAnalysisQueue.setQueue(saved.games, this.username);
      }
    } catch {}

    window.addEventListener('chess_iq_game_analyzed', () => {
      if (this.fetchedGames.length > 0) this.renderTabContent();
    });
    window.addEventListener('chess_iq_cache_cleared', () => {
      if (this.fetchedGames.length > 0) this.renderTabContent();
    });
    window.addEventListener('chess_iq_cache_updated', () => {
      if (this.fetchedGames.length > 0) this.renderTabContent();
    });

    this.render();
  }

  formatOpeningBadge(eco) {
    if (!eco) {
      return `<span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">PGN</span>`;
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
        class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-block text-truncate text-decoration-none"
        style="max-width: 130px; font-size: 11px; vertical-align: middle;"
        title="${label} (${eco})"
        onclick="event.stopPropagation();">
        <i class="bi bi-book me-1"></i>${label} <i class="bi bi-box-arrow-up-right ms-0.5" style="font-size: 9px;"></i>
      </a>`;
    }
    return `<span class="badge bg-body-secondary text-secondary font-monospace d-inline-block text-truncate" style="max-width: 110px; font-size: 10px; vertical-align: middle;">${eco}</span>`;
  }

  getBsModal() {
    if (this.bsModal) return this.bsModal;
    try {
      if (window.bootstrap?.Modal) {
        this.bsModal = window.bootstrap.Modal.getOrCreateInstance(this.modalEl);
      }
      return this.bsModal;
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
  }

  show() {
    this.resetCardStates();
    const modal = this.getBsModal();
    if (modal) {
      modal.show();
    } else {
      this.modalEl.classList.add('show');
      this.modalEl.style.display = 'block';
      this.modalEl.removeAttribute('aria-hidden');
      this.modalEl.setAttribute('aria-modal', 'true');
      document.body.classList.add('modal-open');
      let backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', () => this.hide());
      }
    }
  }

  hide() {
    this.resetCardStates();
    const modal = this.getBsModal();
    if (modal) {
      try { modal.hide(); } catch {}
    }
    this.modalEl.classList.remove('show');
    this.modalEl.style.display = 'none';
    this.modalEl.setAttribute('aria-hidden', 'true');
    this.modalEl.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
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
      const games = await fetchChessComGames(this.username);
      this.fetchedGames = games;
      if (games.length === 0) {
        this.fetchError = 'No recent games found for this player.';
      } else {
        backgroundAnalysisQueue.setQueue(games, this.username);
        try {
          localStorage.setItem('chess_iq_imported_games', JSON.stringify({
            platform: 'chesscom',
            username: this.username,
            games,
            timestamp: Date.now()
          }));
          window.dispatchEvent(new CustomEvent('chess_iq_games_imported'));
        } catch {}
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

    container.innerHTML = `
      <div class="d-flex flex-column gap-3">
        <div class="input-group">
          <span class="input-group-text bg-body-secondary border-end-0 text-secondary"><i class="bi bi-person-fill"></i></span>
          <input type="text" class="form-control border-start-0 ps-1" id="platform-username-input"
            placeholder="Enter Chess.com username..." value="${this.username}">
          <button type="button" class="btn btn-warning fw-black px-3 d-flex align-items-center" id="btn-fetch-platform" ${this.isFetching ? 'disabled' : ''}>
            ${this.isFetching ? '<span class="spinner-border spinner-border-sm me-1.5"></span>Fetching...' : '<i class="bi bi-search me-1.5"></i>Fetch'}
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
          <div class="alert alert-danger py-2 px-3 small font-medium mb-0">${this.fetchError}</div>
        ` : ''}

        ${this.fetchedGames.length > 0 ? `
          <div class="d-flex flex-column gap-2 mt-1 w-100">
            <div class="d-flex align-items-center justify-content-between">
              <span class="small fw-bold text-secondary">Select a recent game to analyze:</span>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-warning btn-sm py-0.5 px-2 fw-bold comic-btn" id="btn-open-insights" style="font-size: 11px;">
                  <i class="bi bi-graph-up-arrow me-1"></i>In-depth Insights (100 games)
                </button>
                ${getCacheStats().count > 0 ? `
                  <button type="button" class="btn btn-outline-danger btn-sm py-0.5 px-2 fw-bold comic-btn" id="btn-clear-game-cache" style="font-size: 11px;">
                    <i class="bi bi-trash3 me-1"></i>Clear Cache (${getCacheStats().count})
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="d-flex flex-column gap-2 overflow-y-auto overflow-x-hidden pe-1 w-100" style="max-height: 280px; scrollbar-width: thin;">
              ${this.fetchedGames.map((g) => {
                const isUserWhite = g.white.toLowerCase() === this.username.trim().toLowerCase();
                const isUserBlack = g.black.toLowerCase() === this.username.trim().toLowerCase();
                const userColor = isUserWhite ? 'w' : (isUserBlack ? 'b' : 'w');
                const cacheInfo = getGameCacheInfo(g.id || g.pgn, userColor);
                const isReviewed = Boolean(cacheInfo);

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

                const cardStatusClass = userWon ? 'card-win' : (userLost ? 'card-loss' : (isDraw ? 'card-draw' : ''));

                return `
                  <div class="imported-game-card ${cardStatusClass} p-3 cursor-pointer w-100 mb-1" data-game-id="${g.id}">
                    <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-light-subtle gap-2 flex-nowrap">
                      <div class="d-flex align-items-center gap-2 overflow-hidden me-auto" style="min-width: 0;">
                        <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-bold flex-shrink-0" style="font-size: 11px;">
                          <i class="bi ${tcIcon} me-1"></i>${g.timeControl}
                        </span>
                        ${this.formatOpeningBadge(g.eco)}
                      </div>
                      <div class="d-flex align-items-center gap-2 flex-shrink-0">
                        ${isReviewed ? `
                          <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold font-monospace" style="font-size: 10px;">
                            <i class="bi bi-lightning-charge-fill me-0.5"></i>Reviewed
                          </span>
                        ` : ''}
                        <span class="text-secondary small font-monospace text-nowrap" style="font-size: 11px;">${g.date}</span>
                        ${resultBadge}
                      </div>
                    </div>

                    <div class="d-flex align-items-center justify-content-between gap-3" style="min-width: 0;">
                      <div class="d-flex flex-column gap-1 flex-grow-1" style="min-width: 0; overflow: hidden;">
                        <div class="d-flex align-items-center gap-2 ${isUserWhite ? 'fw-black text-warning' : 'fw-medium text-body'}" style="min-width: 0;">
                          <span class="fs-6 lh-1">⚪</span>
                          <span class="text-truncate" style="max-width: 170px;">${insEscape(g.white)}</span>
                          <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">${insEscape(g.whiteElo)}</span>
                          ${isUserWhite ? '<span class="badge bg-warning text-dark fw-bold px-1.5 py-0.5" style="font-size: 9px;">YOU</span>' : ''}
                        </div>

                        <div class="d-flex align-items-center gap-2 ${isUserBlack ? 'fw-black text-warning' : 'fw-medium text-body'}" style="min-width: 0;">
                          <span class="fs-6 lh-1">⚫</span>
                          <span class="text-truncate" style="max-width: 170px;">${insEscape(g.black)}</span>
                          <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">${insEscape(g.blackElo)}</span>
                          ${isUserBlack ? '<span class="badge bg-warning text-dark fw-bold px-1.5 py-0.5" style="font-size: 9px;">YOU</span>' : ''}
                        </div>

                        ${isReviewed ? `
                          <div class="d-flex align-items-center gap-1.5 mt-0.5">
                            <span class="badge bg-success-subtle text-success font-monospace fw-bold" style="font-size: 10px;">🎯 ${cacheInfo.accuracy}% acc</span>
                            <span class="badge bg-primary-subtle text-primary font-monospace fw-bold" style="font-size: 10px;">⭐ ${cacheInfo.elo} Elo</span>
                          </div>
                        ` : ''}
                      </div>

                      <div class="flex-shrink-0">
                        <button type="button" class="arcade-btn-primary px-3 py-1.5 text-nowrap btn-analyze-card d-flex align-items-center gap-1.5 ${isReviewed ? 'bg-success border-success' : ''}" style="border-radius: 0.65rem; font-size: 13px !important;">
                          <span>${isReviewed ? 'View Review' : 'Analyze'}</span> <i class="bi ${isReviewed ? 'bi-lightning-charge-fill' : 'bi-chevron-right'}" style="font-size: 11px;"></i>
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

    container.querySelector('#btn-open-insights')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openInsights({
        platform: 'chesscom',
        username: this.username,
        onSelectGame: (pgn, userColor) => this.onSelectPgn && this.onSelectPgn(pgn, userColor)
      });
    });

    container.querySelector('#btn-clear-game-cache')?.addEventListener('click', (e) => {
      e.stopPropagation();
      clearGameCache();
      this.renderTabContent();
    });

    container.querySelectorAll('[data-game-id]').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (this.isAnalyzing) return;
        const gameId = e.currentTarget.getAttribute('data-game-id');
        const game = this.fetchedGames.find((g) => g.id === gameId);
        if (game && this.onSelectPgn) {
          const isWhite = game.white.toLowerCase() === this.username.trim().toLowerCase();
          const userColor = isWhite ? 'w' : 'b';
          const cacheInfo = getGameCacheInfo(game.id || game.pgn, userColor);

          if (cacheInfo) {
            this.onSelectPgn(game.pgn, userColor);
            return;
          }

          this.isAnalyzing = true;
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
            this.onSelectPgn(game.pgn, userColor);
          }, 40);
        }
      });
    });
  }

  render() {
    this.modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content comic-card overflow-hidden">
          <div class="modal-header border-bottom bg-body-tertiary px-3 px-sm-4 py-3 d-flex align-items-center justify-content-between">
            <h5 class="modal-title fw-black fs-5 mb-0 d-flex align-items-center">
              <i class="bi bi-cloud-arrow-up-fill me-2 fg-warning"></i>Import from Chess.com
            </h5>
            <button type="button" class="btn-close" id="btn-modal-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <!-- Progress overlay when analyzing -->
          <div id="import-analysis-progress" class="d-none px-4"></div>

          <!-- Content -->
          <div id="import-tabs-content">
            <div class="modal-body p-3 p-sm-4 overflow-x-hidden" id="import-tab-body"></div>
          </div>
        </div>
      </div>
    `;

    // Explicit close button click
    this.modalEl.querySelector('#btn-modal-close')?.addEventListener('click', () => this.hide());

    // Backdrop click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.hide();
      }
    });

    this.renderTabContent();
  }
}
