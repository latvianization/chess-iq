/**
 * Vanilla JS Import Modal Component
 * Bootstrap 5 modal supporting Chess.com, Lichess, and custom PGN imports.
 * Only analyzes user-imported games with live Stockfish progress.
 */

import { Modal } from 'bootstrap';
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
    this.bsModal = null;

    this.render();
  }

  getBsModal() {
    if (this.bsModal) return this.bsModal;
    try {
      if (window.bootstrap?.Modal) {
        this.bsModal = window.bootstrap.Modal.getOrCreateInstance(this.modalEl);
      } else {
        this.bsModal = Modal.getOrCreateInstance(this.modalEl);
      }
      return this.bsModal;
    } catch {
      return null;
    }
  }

  show() {
    const modal = this.getBsModal();
    if (modal) {
      modal.show();
    } else {
      // Direct DOM fallback
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
    const modal = this.getBsModal();
    if (modal) {
      modal.hide();
    }
    this.modalEl.classList.remove('show');
    this.modalEl.style.display = 'none';
    this.modalEl.setAttribute('aria-hidden', 'true');
    this.modalEl.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
  }

  setAnalyzing(isAnalyzing, current = 0, total = 0) {
    this.isAnalyzing = isAnalyzing;
    this.analysisProgress = { current, total };
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
            <button type="button" class="btn btn-warning fw-bold comic-btn" id="btn-fetch-platform" ${this.isFetching ? 'disabled' : ''}>
              ${this.isFetching ? '<span class="spinner-border spinner-border-sm me-1"></span>Fetching...' : '<i class="bi bi-search me-1"></i>Fetch'}
            </button>
          </div>

          ${this.fetchError ? `
            <div class="alert alert-danger py-2 px-3 small font-medium mb-0">${this.fetchError}</div>
          ` : ''}

          ${this.fetchedGames.length > 0 ? `
            <div class="d-flex flex-column gap-2 mt-2">
              <span class="small fw-bold text-secondary">Select a recent game to analyze:</span>
              <div class="d-flex flex-column gap-1.5 overflow-y-auto" style="max-height: 240px;">
                ${this.fetchedGames.map((g) => {
                  const isWhite = g.white.toLowerCase() === this.username.trim().toLowerCase();
                  return `
                    <div class="card p-2.5 comic-card-sm cursor-pointer hover-shadow" data-game-id="${g.id}">
                      <div class="d-flex align-items-center justify-content-between">
                        <div>
                          <div class="fw-black small text-truncate" style="max-width: 260px;">${g.white} vs ${g.black}</div>
                          <div class="text-secondary small" style="font-size: 11px;">${g.date} · Result: ${g.result}</div>
                        </div>
                        <div class="d-flex align-items-center gap-1.5">
                          <span class="badge bg-body-secondary text-dark font-monospace">${g.timeControl}</span>
                          <i class="bi bi-chevron-right text-secondary"></i>
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
          const gameId = e.currentTarget.getAttribute('data-game-id');
          const game = this.fetchedGames.find((g) => g.id === gameId);
          if (game && this.onSelectPgn) {
            const isWhite = game.white.toLowerCase() === this.username.trim().toLowerCase();
            this.onSelectPgn(game.pgn, isWhite ? 'w' : 'b');
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

          <button type="button" class="btn btn-warning comic-btn py-2.5 w-100 fw-black" id="btn-analyze-custom-pgn" ${!this.customPgn.trim() ? 'disabled' : ''}>
            Analyze PGN with Comic Badges ⚡
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
          this.onSelectPgn(this.customPgn.trim(), this.customColor);
        }
      });
    }
  }

  render() {
    this.modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content comic-card overflow-hidden">
          <div class="modal-header border-bottom bg-body-tertiary px-4 py-3">
            <h5 class="modal-title fw-black"><i class="bi bi-cloud-arrow-up-fill me-2 text-warning"></i>Import Game for Comic Review</h5>
            <button type="button" class="btn-close" id="btn-modal-close" aria-label="Close"></button>
          </div>

          <!-- Progress overlay when analyzing -->
          <div id="import-analysis-progress" class="d-none px-4"></div>

          <!-- Tab Selector -->
          <div id="import-tabs-content">
            <ul class="nav nav-tabs nav-fill border-bottom bg-body-tertiary px-3 pt-2">
              <li class="nav-item">
                <button class="nav-link ${this.activeTab === 'chesscom' ? 'active fw-black text-warning' : 'fw-bold'}" data-import-tab="chesscom">
                  <span class="badge bg-success rounded-circle p-1 me-1"> </span> Chess.com
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link ${this.activeTab === 'lichess' ? 'active fw-black text-warning' : 'fw-bold'}" data-import-tab="lichess">
                  <i class="bi bi-globe me-1 text-info"></i> Lichess
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link ${this.activeTab === 'pgn' ? 'active fw-black text-warning' : 'fw-bold'}" data-import-tab="pgn">
                  <i class="bi bi-file-text-fill me-1 text-primary"></i> Paste PGN
                </button>
              </li>
            </ul>

            <div class="modal-body p-4" id="import-tab-body"></div>
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
