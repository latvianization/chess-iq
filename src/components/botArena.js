/**
 * Vanilla JS Bot Arena Component
 * Provides 33 tiered bots (400–2000 Elo in 50-point increments),
 * quick Elo slider, tier tabs, live gameplay, and dynamic personality speech bubbles.
 */

import { Chess } from 'chess.js';
import { BOTS_33, TIER_CONFIG } from '../data/botsData.js';
import { Chessboard } from './board.js';
import { soundService } from '../services/sound.js';
import { evaluatePositionLocally } from '../services/engine.js';
import confetti from 'canvas-confetti';

export class BotArena {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onAnalyzeGame = options.onAnalyzeGame || null; // (pgn, userColor) => {}
    this.theme = options.theme || 'green';

    this.chess = new Chess();
    this.userColor = 'w';
    this.selectedBot = BOTS_33[0]; // 400 Elo Pawn Piper
    this.activeTier = 'rookie';
    this.speechText = this.selectedBot.speech.onStart[0];
    this.isBotThinking = false;
    this.gameResult = null; // 'win' | 'loss' | 'draw' | null
    this.board = null;

    this.render();
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    if (this.board) {
      this.board.setProps({ theme: newTheme });
    }
  }

  startNewGame(color = this.userColor) {
    this.userColor = color;
    this.chess.reset();
    this.gameResult = null;
    this.speechText = this.getRandomQuote(this.selectedBot.speech.onStart);

    this.updateBoard();
    this.updateControls();
    this.updateSpeechBubble();

    soundService.playSuccess();

    if (this.userColor === 'b') {
      setTimeout(() => this.triggerBotMove(), 600);
    }
  }

  selectBot(bot) {
    this.selectedBot = bot;
    this.activeTier = bot.tier;
    this.speechText = this.getRandomQuote(bot.speech.onStart);
    this.startNewGame();
    this.render();
  }

  getRandomQuote(arr) {
    if (!arr || arr.length === 0) return 'Let us play chess!';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  handleUserMove(from, to) {
    if (this.isBotThinking || this.gameResult) return;

    // Evaluate position before move to detect quality
    const prevFen = this.chess.fen();
    const prevEval = evaluatePositionLocally(prevFen, 3);

    try {
      const move = this.chess.move({ from, to, promotion: 'q' });
      if (!move) return;

      if (move.captured) {
        soundService.playCapture();
      } else {
        soundService.playMove();
      }

      // Check quality of user move
      const postEval = evaluatePositionLocally(this.chess.fen(), 3);
      const evalDiff = this.userColor === 'w' ? postEval.score - prevEval.score : prevEval.score - postEval.score;

      if (evalDiff <= -250) {
        soundService.playBlunder();
        this.speechText = this.getRandomQuote(this.selectedBot.speech.onUserBlunder);
      } else if (evalDiff >= 200 || this.chess.inCheck()) {
        if (this.chess.inCheck()) soundService.playCheck();
        else soundService.playBrilliant();
        this.speechText = this.getRandomQuote(this.selectedBot.speech.onUserGreat);
      }

      this.updateBoard();
      this.updateSpeechBubble();
      this.checkGameOver();

      if (!this.gameResult) {
        this.triggerBotMove();
      }
    } catch {
      // Invalid move
    }
  }

  triggerBotMove() {
    this.isBotThinking = true;
    this.updateStatusText();

    const thinkTime = Math.min(1200, Math.max(350, 200 + (this.selectedBot.elo - 400) * 0.5));

    setTimeout(() => {
      if (this.chess.isGameOver()) return;

      const legalMoves = this.chess.moves({ verbose: true });
      if (legalMoves.length === 0) return;

      let chosenMove = null;
      const willMakeRandomMistake = Math.random() < this.selectedBot.randomness;

      if (willMakeRandomMistake && legalMoves.length > 1) {
        chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        // Find best move via local alpha-beta search
        let bestScore = -Infinity;
        chosenMove = legalMoves[0];

        for (const m of legalMoves) {
          this.chess.move(m);
          const ev = evaluatePositionLocally(this.chess.fen(), this.selectedBot.depth);
          // Score relative to bot
          const score = this.userColor === 'w' ? -ev.score : ev.score;
          this.chess.undo();

          if (score > bestScore) {
            bestScore = score;
            chosenMove = m;
          }
        }
      }

      const move = this.chess.move(chosenMove);
      this.isBotThinking = false;

      if (move) {
        if (move.captured) soundService.playCapture();
        else soundService.playMove();

        if (this.chess.inCheck()) {
          soundService.playCheck();
          this.speechText = this.getRandomQuote(this.selectedBot.speech.onBotCheck);
        }
      }

      this.updateBoard();
      this.updateSpeechBubble();
      this.updateStatusText();
      this.checkGameOver();
    }, thinkTime);
  }

  checkGameOver() {
    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'b' : 'w';
      if (winner === this.userColor) {
        this.gameResult = 'win';
        this.speechText = this.getRandomQuote(this.selectedBot.speech.onBotLoss);
        soundService.playSuccess();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } else {
        this.gameResult = 'loss';
        this.speechText = this.getRandomQuote(this.selectedBot.speech.onBotWin);
        soundService.playBlunder();
      }
    } else if (this.chess.isDraw()) {
      this.gameResult = 'draw';
      this.speechText = 'A noble comic draw! Well fought!';
    }

    if (this.gameResult) {
      this.updateSpeechBubble();
      this.updateControls();
    }
  }

  updateBoard() {
    if (!this.board) return;
    const history = this.chess.history({ verbose: true });
    const lastMove = history.length > 0 ? { from: history[history.length - 1].from, to: history[history.length - 1].to } : null;

    this.board.setProps({
      fen: this.chess.fen(),
      orientation: this.userColor,
      lastMove,
      interactive: !this.isBotThinking && !this.gameResult,
      legalMovesFrom: (sq) => {
        const moves = this.chess.moves({ square: sq, verbose: true });
        return moves.map((m) => m.to);
      },
      onMove: (from, to) => this.handleUserMove(from, to),
    });
  }

  updateSpeechBubble() {
    const bubbleEl = this.container.querySelector('.bot-speech-bubble-text');
    if (bubbleEl) {
      bubbleEl.textContent = this.speechText;
      const bubbleContainer = this.container.querySelector('.comic-bubble');
      if (bubbleContainer) {
        bubbleContainer.style.animation = 'none';
        void bubbleContainer.offsetWidth; // trigger reflow
        bubbleContainer.style.animation = 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      }
    }
  }

  updateStatusText() {
    const statusEl = this.container.querySelector('.bot-status-text');
    if (statusEl) {
      if (this.isBotThinking) {
        statusEl.innerHTML = `<span class="spinner-border spinner-border-sm text-warning me-1"></span>Thinking...`;
      } else if (this.gameResult === 'win') {
        statusEl.innerHTML = `<span class="badge bg-success">Victory! You won!</span>`;
      } else if (this.gameResult === 'loss') {
        statusEl.innerHTML = `<span class="badge bg-danger">Defeat! Bot wins!</span>`;
      } else if (this.gameResult === 'draw') {
        statusEl.innerHTML = `<span class="badge bg-secondary">Draw Game!</span>`;
      } else {
        const turnColor = this.chess.turn() === this.userColor ? 'Your turn' : `${this.selectedBot.name}'s turn`;
        statusEl.textContent = turnColor;
      }
    }
  }

  updateControls() {
    const actionArea = this.container.querySelector('.bot-game-actions');
    if (!actionArea) return;

    if (this.gameResult && this.onAnalyzeGame) {
      actionArea.innerHTML = `
        <button type="button" class="btn btn-warning comic-btn px-4 py-2 me-2" id="bot-btn-review">
          <i class="bi bi-graph-up-arrow me-1"></i> Review This Game with Stockfish ⚡
        </button>
        <button type="button" class="btn btn-outline-dark comic-btn px-3 py-2" id="bot-btn-rematch">
          <i class="bi bi-arrow-repeat me-1"></i> Rematch
        </button>
      `;

      actionArea.querySelector('#bot-btn-review')?.addEventListener('click', () => {
        this.onAnalyzeGame(this.chess.pgn(), this.userColor);
      });
      actionArea.querySelector('#bot-btn-rematch')?.addEventListener('click', () => {
        this.startNewGame();
      });
    } else {
      actionArea.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-light comic-btn px-3 py-1.5" id="bot-btn-new">
            <i class="bi bi-plus-circle me-1"></i> New Game
          </button>
          <button type="button" class="btn btn-light comic-btn px-3 py-1.5" id="bot-btn-flip">
            <i class="bi bi-arrow-left-right me-1"></i> Flip Sides
          </button>
          <button type="button" class="btn btn-outline-danger comic-btn px-3 py-1.5" id="bot-btn-resign">
            <i class="bi bi-flag me-1"></i> Resign
          </button>
        </div>
      `;

      actionArea.querySelector('#bot-btn-new')?.addEventListener('click', () => this.startNewGame());
      actionArea.querySelector('#bot-btn-flip')?.addEventListener('click', () => {
        this.startNewGame(this.userColor === 'w' ? 'b' : 'w');
      });
      actionArea.querySelector('#bot-btn-resign')?.addEventListener('click', () => {
        if (!this.gameResult && this.chess.history().length > 0) {
          this.gameResult = 'loss';
          this.speechText = 'GG! You resigned. Ready for another round?';
          this.updateSpeechBubble();
          this.updateControls();
          this.updateStatusText();
        }
      });
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="d-flex flex-column gap-3 max-w-4xl mx-auto">
        <!-- Bot Selection Card -->
        <div class="comic-card p-3 p-sm-4">
          <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="fs-4">${this.selectedBot.avatar}</span>
                <h4 class="mb-0 fw-black">${this.selectedBot.name}</h4>
                <span class="badge bg-warning text-dark fw-bold border border-dark">${this.selectedBot.elo} Elo</span>
                <span class="badge bg-secondary fw-semibold">${this.selectedBot.title}</span>
              </div>
              <p class="text-secondary small mb-0 mt-1">${this.selectedBot.description}</p>
            </div>

            <!-- 4 Tier Selector Pills -->
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-sm ${this.activeTier === 'rookie' ? 'btn-primary' : 'btn-outline-primary'} fw-bold" data-tier="rookie">🌱 Rookies</button>
              <button type="button" class="btn btn-sm ${this.activeTier === 'challenger' ? 'btn-success' : 'btn-outline-success'} fw-bold" data-tier="challenger">⚡ Challengers</button>
              <button type="button" class="btn btn-sm ${this.activeTier === 'hero' ? 'btn-warning' : 'btn-outline-warning text-dark'} fw-bold" data-tier="hero">🦸 Heroes</button>
              <button type="button" class="btn btn-sm ${this.activeTier === 'titan' ? 'btn-info' : 'btn-outline-info'} fw-bold" data-tier="titan">👑 Titans</button>
            </div>
          </div>

          <!-- Elo Step Slider (400 to 2000 in 50 increments) -->
          <div class="d-flex align-items-center gap-3 bg-body-tertiary p-2.5 rounded-3 border">
            <span class="small fw-bold text-nowrap"><i class="bi bi-speedometer2 me-1"></i>Elo Level:</span>
            <input type="range" class="form-range" id="bot-elo-slider" min="400" max="2000" step="50" value="${this.selectedBot.elo}">
            <span class="badge bg-dark fw-bold text-nowrap px-2.5 py-1.5 fs-6">${this.selectedBot.elo}</span>
          </div>

          <!-- Tier Bots Carousel Row -->
          <div class="d-flex gap-2 overflow-x-auto py-2.5 mt-2" id="tier-bots-row" style="scrollbar-width: thin;">
            ${BOTS_33.filter((b) => b.tier === this.activeTier)
              .map(
                (b) => `
                <div class="card p-2 text-center comic-card-sm flex-shrink-0 cursor-pointer ${b.id === this.selectedBot.id ? 'border-warning border-3 shadow-sm' : ''}" style="width: 95px;" data-bot-id="${b.id}">
                  <span class="fs-3">${b.avatar}</span>
                  <span class="small fw-black text-truncate mt-1">${b.name}</span>
                  <span class="badge bg-warning-subtle text-dark border border-dark-subtle fw-bold" style="font-size: 10px;">${b.elo}</span>
                </div>
              `
              )
              .join('')}
          </div>
        </div>

        <!-- Bot Personality Speech Bubble & Status -->
        <div class="d-flex align-items-center justify-content-between px-2">
          <div class="comic-bubble">
            <span class="me-1">${this.selectedBot.avatar}</span>
            <span class="bot-speech-bubble-text">${this.speechText}</span>
          </div>
          <div class="bot-status-text small fw-bold text-secondary">
            Your turn (White)
          </div>
        </div>

        <!-- Chessboard Container -->
        <div class="d-flex justify-content-center" id="bot-board-mount"></div>

        <!-- Controls Area -->
        <div class="d-flex justify-content-center bot-game-actions mt-1"></div>
      </div>
    `;

    // Mount Chessboard
    const boardMount = this.container.querySelector('#bot-board-mount');
    this.board = new Chessboard(boardMount, {
      fen: this.chess.fen(),
      orientation: this.userColor,
      theme: this.theme,
      interactive: true,
      legalMovesFrom: (sq) => {
        const moves = this.chess.moves({ square: sq, verbose: true });
        return moves.map((m) => m.to);
      },
      onMove: (from, to) => this.handleUserMove(from, to),
    });

    this.updateControls();

    // Bind Tier switcher buttons
    this.container.querySelectorAll('[data-tier]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tier = e.currentTarget.getAttribute('data-tier');
        this.activeTier = tier;
        const firstBotInTier = BOTS_33.find((b) => b.tier === tier);
        if (firstBotInTier) {
          this.selectBot(firstBotInTier);
        }
      });
    });

    // Bind Elo Range Slider
    const slider = this.container.querySelector('#bot-elo-slider');
    slider?.addEventListener('input', (e) => {
      const eloVal = parseInt(e.target.value, 10);
      const targetBot = BOTS_33.find((b) => b.elo === eloVal) || BOTS_33[0];
      this.selectBot(targetBot);
    });

    // Bind Bot character cards in carousel
    this.container.querySelectorAll('[data-bot-id]').forEach((card) => {
      card.addEventListener('click', (e) => {
        const botId = e.currentTarget.getAttribute('data-bot-id');
        const targetBot = BOTS_33.find((b) => b.id === botId);
        if (targetBot) {
          this.selectBot(targetBot);
        }
      });
    });
  }
}
