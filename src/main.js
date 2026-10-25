/**
 * Vanilla JS Application Entry Point
 * Orchestrates Mode switching (Game Review vs 33-Bot Arena),
 * Bootstrap 5 Light/Dark theming, and Stockfish analysis pipeline.
 */


function ensureChessCompat() {
  if (typeof window === 'undefined' || !window.Chess) return;
  const proto = window.Chess.prototype;
  if (!proto) return;
  if (!proto.loadPgn && typeof proto.load_pgn === 'function') {
    proto.loadPgn = function(pgn, options) { return this.load_pgn(pgn, options); };
  }
  if (!proto.isGameOver && typeof proto.game_over === 'function') {
    proto.isGameOver = function() { return this.game_over(); };
  }
  if (!proto.isCheckmate && typeof proto.in_checkmate === 'function') {
    proto.isCheckmate = function() { return this.in_checkmate(); };
  }
  if (!proto.isDraw && typeof proto.in_draw === 'function') {
    proto.isDraw = function() { return this.in_draw(); };
  }
  if (!proto.inCheck && typeof proto.in_check === 'function') {
    proto.inCheck = function() { return this.in_check(); };
  }
  if (!proto.isStalemate && typeof proto.in_stalemate === 'function') {
    proto.isStalemate = function() { return this.in_stalemate(); };
  }
  if (!proto.isThreefoldRepetition && typeof proto.in_threefold_repetition === 'function') {
    proto.isThreefoldRepetition = function() { return this.in_threefold_repetition(); };
  }
  if (!proto.isInsufficientMaterial && typeof proto.insufficient_material === 'function') {
    proto.isInsufficientMaterial = function() { return this.insufficient_material(); };
  }
}
ensureChessCompat();

class App {
  constructor() {
    this.appMode = 'review'; // 'review' | 'bot'
    this.isDarkMode = false;
    this.isDeepReview = true;

    this.reviewDashboard = null;
    this.botArena = null;
    this.importModal = null;

    this.init();
  }

  init() {
    this.setupTheme();
    this.bindHeader();
    if (typeof initGlobalTooltips === 'function') {
      initGlobalTooltips();
    }

    // Mount Review Dashboard
    const reviewMount = document.getElementById('review-view');
    if (reviewMount) {
      this.reviewDashboard = new ReviewDashboard(reviewMount, {
        onOpenImport: () => this.importModal?.show(),
        onSwitchToBots: () => this.switchMode('bot'),
        onPlayFromFen: (fen, userColor, targetElo) => {
          this.switchMode('bot');
          this.botArena?.startFromPosition(fen, userColor, targetElo);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onSelectGame: (pgn, userColor, cachedGame) => {
          if (cachedGame) {
            this.reviewDashboard?.setGame(cachedGame);
            soundService.playSuccess();
          } else {
            this.runAnalysis(pgn, userColor);
          }
        },
        onReanalyzeGame: (pgn, userColor) => {
          this.runAnalysis(pgn, userColor, true);
        },
      });
    }

    // Mount Bot Arena
    const botMount = document.getElementById('bot-view');
    if (botMount) {
      this.botArena = new BotArena(botMount, {
        onAnalyzeGame: (pgn, userColor, meta) => this.runAnalysis(pgn, userColor, false, meta),
      });
    }

    // Mount Import Modal
    const modalEl = document.getElementById('import-modal');
    if (modalEl) {
      this.importModal = new ImportModal(modalEl, {
        onSelectPgn: (pgn, userColor) => this.runAnalysis(pgn, userColor),
      });
    }

    // Default start view or load shared review link
    const hasSharedGame = this.checkShareLinkUrl();
    if (!hasSharedGame) {
      this.switchMode('review');
    }
  }

  checkShareLinkUrl() {
    try {
      let params = new URLSearchParams(window.location.search);
      if (!params.has('pgn') && window.location.hash.includes('pgn=')) {
        params = new URLSearchParams(window.location.hash.slice(1));
      }
      const pgn = params.get('pgn');
      if (pgn && pgn.trim().length > 10) {
        const userColor = params.get('color') === 'b' ? 'b' : 'w';
        console.log('[App] Shareable game link detected. Auto-loading game review...');
        setTimeout(() => {
          this.runAnalysis(pgn.trim(), userColor);
        }, 50);
        return true;
      }
    } catch (err) {
      console.warn('[App] Could not parse shareable link:', err);
    }
    return false;
  }

  setupTheme() {
    const saved = localStorage.getItem('chess_toon_theme');
    this.isDarkMode = saved === 'dark';
    document.documentElement.setAttribute('data-bs-theme', this.isDarkMode ? 'dark' : 'light');
    this.updateThemeIcon();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.setAttribute('data-bs-theme', this.isDarkMode ? 'dark' : 'light');
    localStorage.setItem('chess_toon_theme', this.isDarkMode ? 'dark' : 'light');
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.className = this.isDarkMode ? 'bi bi-moon-stars-fill text-warning' : 'bi bi-sun-fill text-warning';
    }
  }

  updateSoundIcon() {
    const icon = document.getElementById('sound-toggle-icon');
    if (icon) {
      icon.className = soundService.isMuted ? 'bi bi-volume-mute-fill text-danger' : 'bi bi-volume-up-fill';
    }
  }

  switchMode(mode) {
    this.appMode = mode;

    // Purge any open modals or backdrops to ensure page scroll is never trapped
    this.importModal?.hide();
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
    document.querySelectorAll('.modal.show').forEach((m) => m.classList.remove('show'));
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');

    if (typeof closeWhyModal === 'function' && this.reviewDashboard) {
      closeWhyModal(this.reviewDashboard);
    }
    document.getElementById('why-blunder-modal')?.remove();
    document.getElementById('blunder-bank-modal')?.remove();
    document.getElementById('positional-pillars-modal')?.remove();
    document.getElementById('iq-guide-modal-root')?.remove();
    if (typeof closeGameOverModal === 'function') {
      closeGameOverModal();
    }
    document.getElementById('bot-game-over-modal')?.remove();

    const reviewView = document.getElementById('review-view');
    const botView = document.getElementById('bot-view');
    const btnReview = document.getElementById('nav-mode-review');
    const btnBot = document.getElementById('nav-mode-bot');

    if (mode === 'review') {
      reviewView?.classList.remove('d-none');
      botView?.classList.add('d-none');
      btnReview?.classList.add('active');
      btnBot?.classList.remove('active');
    } else {
      reviewView?.classList.add('d-none');
      botView?.classList.remove('d-none');
      btnBot?.classList.add('active');
      btnReview?.classList.remove('active');
      if (this.botArena && !this.botArena.isPlaying) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }

  goToHome() {
    this.importModal?.hide();
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
    document.body.classList.remove('modal-open');

    if (typeof closeWhyModal === 'function' && this.reviewDashboard) {
      closeWhyModal(this.reviewDashboard);
    }
    document.getElementById('why-blunder-modal')?.remove();
    document.getElementById('blunder-bank-modal')?.remove();
    document.getElementById('positional-pillars-modal')?.remove();
    if (typeof closeGameOverModal === 'function') {
      closeGameOverModal();
    }

    if (this.reviewDashboard) {
      this.reviewDashboard.hideLoading();
      this.reviewDashboard.setGame(null);
    }
    if (this.botArena) {
      this.botArena.resetToPicker();
    }

    this.switchMode('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindHeader() {
    this.updateSoundIcon();

    const brandLogo = document.getElementById('brand-logo') || document.querySelector('.navbar-brand');
    if (brandLogo) {
      brandLogo.addEventListener('click', (e) => {
        e.preventDefault();
        this.goToHome();
      });
    }

    document.getElementById('nav-mode-review')?.addEventListener('click', () => this.switchMode('review'));
    document.getElementById('nav-mode-bot')?.addEventListener('click', () => this.switchMode('bot'));
    document.getElementById('nav-btn-import')?.addEventListener('click', () => {
      this.importModal?.show();
    });
    document.getElementById('nav-btn-theme')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('nav-btn-sound')?.addEventListener('click', () => {
      soundService.toggleMute();
      this.updateSoundIcon();
    });
    document.getElementById('nav-btn-help')?.addEventListener('click', () => {
      if (typeof openIqGuideModal === 'function') {
        openIqGuideModal();
      }
    });
  }

  async runAnalysis(pgn, userColor, forceFresh = false, meta = null) {
    console.log(`[App] runAnalysis requested (userColor: ${userColor}, deepReview: ${this.isDeepReview}, forceFresh: ${forceFresh})`);
    this.switchMode('review');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Clean up any lingering backdrops
    this.importModal?.hide();
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
    document.body.classList.remove('modal-open');
    document.getElementById('positional-pillars-modal')?.remove();

    if (!forceFresh) {
      let cachedGame = getCachedGame(pgn, userColor);
      if (!cachedGame && typeof pgn === 'string') {
        cachedGame = getCachedGame(pgn, 'w') || getCachedGame(pgn, 'b');
      }
      if (cachedGame) {
        console.log(`[App] Game found in cache: ${cachedGame.white} vs ${cachedGame.black} (${cachedGame.userAccuracy}% acc)`);
        this.reviewDashboard?.setGame(cachedGame);
        soundService.playSuccess();
        this.importModal?.setAnalyzing(false, 0, 0);
        return;
      }
    } else if (typeof FEN_EVAL_CACHE !== 'undefined' && FEN_EVAL_CACHE.clear) {
      FEN_EVAL_CACHE.clear();
    }

    // Resolve actual PGN if an ID or key was passed
    let actualPgn = typeof pgn === 'string' ? pgn.trim() : '';
    let matchedGameId = null;
    try {
      const savedImport = JSON.parse(localStorage.getItem('chess_iq_imported_games') || 'null');
      const match = savedImport?.games?.find((g) => g.id === actualPgn || g.pgn === actualPgn);
      if (match) {
        if (match.pgn) actualPgn = match.pgn;
        matchedGameId = match.id;
      }
    } catch {}
    if (actualPgn === pgn && !actualPgn.includes(' ') && typeof getCacheIndex === 'function') {
      const index = getCacheIndex();
      const entry = index.find((i) => i.id === pgn || i.key === pgn);
      if (entry?.pgn) actualPgn = entry.pgn;
    }

    if (!actualPgn || (!actualPgn.includes(' ') && !actualPgn.includes('.') && actualPgn.length < 15)) {
      console.warn('[App] Cannot run analysis: invalid or missing PGN notation:', pgn);
      this.reviewDashboard?.hideLoading();
      this.reviewDashboard?.render();
      this.importModal?.setAnalyzing(false, 0, 0);
      return;
    }

    console.log('[App] Starting fresh game analysis...');
    this.reviewDashboard?.showLoading(0, 0);

    // Allow modal hide and review loading view to paint before computation begins
    await new Promise((resolve) => setTimeout(resolve, 30));

    try {
      const analyzedGame = await analyzeFullPgn(
        actualPgn,
        userColor,
        this.isDeepReview,
        async (current, total) => {
          await this.reviewDashboard?.showLoading(current, total);
        }
      );

      if (matchedGameId) {
        analyzedGame.id = matchedGameId;
        analyzedGame.isImported = true;
      }

      if (meta?.isBotGame || meta?.bot) {
        analyzedGame.isBotGame = true;
        analyzedGame.isImported = false;
        if (meta.bot) {
          analyzedGame.botId = meta.bot.id;
          analyzedGame.botName = meta.bot.name;
          analyzedGame.botAvatar = meta.bot.avatar;
        }
      }

      console.log('[App] Analysis completed, caching and loading review...');
      saveCachedGame(actualPgn, userColor, analyzedGame);
      this.reviewDashboard?.setGame(analyzedGame);
      soundService.playSuccess();
    } catch (err) {
      console.error('[App] Analysis failed:', err);
      this.reviewDashboard?.hideLoading();
      this.reviewDashboard?.render();
    } finally {
      this.importModal?.setAnalyzing(false, 0, 0);
    }
  }
}

window.App = App;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chessApp = new App();
  });
} else {
  window.chessApp = new App();
}
