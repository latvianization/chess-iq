/**
 * Vanilla JS Application Entry Point
 * Orchestrates Mode switching (Game Review vs 33-Bot Arena),
 * Bootstrap 5 Light/Dark theming, and Stockfish analysis pipeline.
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;
import './styles/comic-bootstrap.css';

import { ReviewDashboard } from './components/reviewDashboard.js';
import { BotArena } from './components/botArena.js';
import { ImportModal } from './components/importModal.js';
import { analyzeFullPgn } from './services/importApi.js';
import { soundService } from './services/sound.js';

function ensureChessCompat() {
  if (typeof window === 'undefined' || !window.Chess) return;
  const proto = window.Chess.prototype;
  if (!proto) return;
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
    this.boardTheme = 'green';
    this.isDeepReview = false;

    this.reviewDashboard = null;
    this.botArena = null;
    this.importModal = null;

    this.init();
  }

  init() {
    this.setupTheme();
    this.bindHeader();

    // Mount Review Dashboard
    const reviewMount = document.getElementById('review-view');
    if (reviewMount) {
      this.reviewDashboard = new ReviewDashboard(reviewMount, {
        theme: this.boardTheme,
        onOpenImport: () => this.importModal?.show(),
        onSwitchToBots: () => this.switchMode('bot'),
      });
    }

    // Mount Bot Arena
    const botMount = document.getElementById('bot-view');
    if (botMount) {
      this.botArena = new BotArena(botMount, {
        theme: this.boardTheme,
        onAnalyzeGame: (pgn, userColor) => this.runAnalysis(pgn, userColor),
      });
    }

    // Mount Import Modal
    const modalEl = document.getElementById('import-modal');
    if (modalEl) {
      this.importModal = new ImportModal(modalEl, {
        onSelectPgn: (pgn, userColor) => this.runAnalysis(pgn, userColor),
      });
    }

    // Default start view
    this.switchMode('review');
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
    }
  }

  bindHeader() {
    this.updateSoundIcon();
    document.getElementById('nav-mode-review')?.addEventListener('click', () => this.switchMode('review'));
    document.getElementById('nav-mode-bot')?.addEventListener('click', () => this.switchMode('bot'));
    document.getElementById('nav-btn-import')?.addEventListener('click', () => this.importModal?.show());
    document.getElementById('nav-btn-theme')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('nav-btn-sound')?.addEventListener('click', () => {
      soundService.toggleMute();
      this.updateSoundIcon();
    });

    // Theme selector dropdown/menu
    const menuToggle = document.querySelector('[data-bs-toggle="menu"], [data-bs-toggle="dropdown"]');
    const menuEl = document.querySelector('.menu, .dropdown-menu');
    if (menuToggle && menuEl) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menuEl.classList.toggle('show');
      });
      document.addEventListener('click', (e) => {
        if (!menuEl.contains(e.target) && e.target !== menuToggle) {
          menuEl.classList.remove('show');
        }
      });
    }

    document.querySelectorAll('[data-board-theme]').forEach((item) => {
      item.addEventListener('click', (e) => {
        this.boardTheme = e.currentTarget.getAttribute('data-board-theme');
        this.reviewDashboard?.setTheme(this.boardTheme);
        this.botArena?.setTheme(this.boardTheme);
        menuEl?.classList.remove('show');
      });
    });
  }

  async runAnalysis(pgn, userColor) {
    this.switchMode('review');
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.reviewDashboard?.showLoading(0, 0);
    this.importModal?.hide();

    // Clean up any lingering backdrops
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
    document.body.classList.remove('modal-open');

    // Allow modal hide and review loading view to paint before computation begins
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));

    try {
      const analyzedGame = await analyzeFullPgn(
        pgn,
        userColor,
        this.isDeepReview,
        (current, total) => {
          this.reviewDashboard?.showLoading(current, total);
        }
      );

      this.reviewDashboard?.setGame(analyzedGame);
      soundService.playSuccess();
    } catch (err) {
      console.error('Analysis failed:', err);
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
