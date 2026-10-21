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
    this.isSpeechVisible = false;
    this.speechTimeout = null;
    this.gameStartTime = Date.now();
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
    this.gameStartTime = Date.now();
    this.closeGameOverModal();
    this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onStart));

    this.updateBoard();
    this.updateControls();

    soundService.playSuccess();

    if (this.userColor === 'b') {
      setTimeout(() => this.triggerBotMove(), 600);
    }
  }

  selectBot(bot) {
    this.selectedBot = bot;
    this.activeTier = bot.tier;
    this.startNewGame();
    this.render();
  }

  getRandomQuote(arr) {
    if (!arr || arr.length === 0) return 'Let us play chess!';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  setBotSpeech(text) {
    this.speechText = text;
    this.isSpeechVisible = true;
    this.updateSpeechBubble();

    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      this.isSpeechVisible = false;
      this.updateSpeechBubble();
    }, 4500);
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

      const shouldSpeak = Math.random() < 0.18;
      if (evalDiff <= -250) {
        soundService.playBlunder();
        if (shouldSpeak) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserBlunder));
        }
      } else if (evalDiff >= 200) {
        soundService.playBrilliant();
        if (shouldSpeak) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserGreat));
        }
      } else if (typeof this.chess.inCheck === 'function' ? this.chess.inCheck() : (typeof this.chess.in_check === 'function' ? this.chess.in_check() : false)) {
        soundService.playCheck();
        if (shouldSpeak) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserGreat));
        }
      }

      this.updateBoard();
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
      const isOver = typeof this.chess.isGameOver === 'function'
        ? this.chess.isGameOver()
        : (typeof this.chess.game_over === 'function' ? this.chess.game_over() : false);
      if (isOver) return;

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

        const isInCheck = typeof this.chess.inCheck === 'function'
          ? this.chess.inCheck()
          : (typeof this.chess.in_check === 'function' ? this.chess.in_check() : false);

        if (isInCheck) {
          soundService.playCheck();
          if (Math.random() < 0.20) {
            this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onBotCheck));
          }
        } else if (Math.random() < 0.08) {
          const generalQuotes = this.selectedBot.speech.onStart || [];
          if (generalQuotes.length > 0) {
            this.setBotSpeech(this.getRandomQuote(generalQuotes));
          }
        }
      }

      this.updateBoard();
      this.updateStatusText();
      this.checkGameOver();
    }, thinkTime);
  }

  getEnrichedPgn() {
    const isUserWhite = this.userColor === 'w';
    const userName = 'You';
    const botName = `${this.selectedBot.name} (${this.selectedBot.elo})`;
    this.chess.header('White', isUserWhite ? userName : botName);
    this.chess.header('Black', isUserWhite ? botName : userName);
    this.chess.header('WhiteElo', isUserWhite ? '1500' : String(this.selectedBot.elo));
    this.chess.header('BlackElo', isUserWhite ? String(this.selectedBot.elo) : '1500');
    if (this.gameResult === 'win') {
      this.chess.header('Result', isUserWhite ? '1-0' : '0-1');
    } else if (this.gameResult === 'loss') {
      this.chess.header('Result', isUserWhite ? '0-1' : '1-0');
    } else if (this.gameResult === 'draw') {
      this.chess.header('Result', '1/2-1/2');
    }
    return this.chess.pgn();
  }

  closeGameOverModal() {
    const existing = document.getElementById('bot-game-over-modal');
    if (existing) existing.remove();
  }

  showGameOverModal(reason = 'Game Completed') {
    this.closeGameOverModal();

    const isWin = this.gameResult === 'win';
    const isLoss = this.gameResult === 'loss';

    let resultBadgeClass = 'bg-secondary text-white';
    let resultTitle = 'DRAW';
    let resultIcon = '🤝';
    if (isWin) {
      resultBadgeClass = 'bg-success text-white border border-light';
      resultTitle = 'VICTORY!';
      resultIcon = '🏆';
    } else if (isLoss) {
      resultBadgeClass = 'bg-danger text-white border border-light';
      resultTitle = 'DEFEAT';
      resultIcon = '💀';
    }

    const durationSec = Math.max(1, Math.floor((Date.now() - this.gameStartTime) / 1000));
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const moveCount = Math.ceil(this.chess.history().length / 2);

    const modal = document.createElement('div');
    modal.className = 'game-over-modal-backdrop';
    modal.id = 'bot-game-over-modal';
    modal.innerHTML = `
      <div class="game-over-dialog comic-card p-4 text-center">
        <div class="mb-3">
          <span class="badge ${resultBadgeClass} fs-5 px-3.5 py-2 rounded-pill shadow-sm">
            ${resultIcon} ${resultTitle}
          </span>
          <div class="text-secondary small mt-1 fw-bold">By ${reason}</div>
        </div>

        <div class="d-flex align-items-center justify-content-center gap-3 p-3 bg-body-tertiary rounded-3 border mb-3">
          <span class="fs-1">${this.selectedBot.avatar}</span>
          <div class="text-start">
            <div class="fw-black fs-5">${this.selectedBot.name}</div>
            <div class="d-flex align-items-center gap-1.5">
              <span class="badge bg-warning text-dark fw-bold border border-dark">${this.selectedBot.elo} Elo</span>
              <span class="badge bg-secondary">${this.selectedBot.title}</span>
            </div>
          </div>
        </div>

        <div class="row g-2 mb-4 text-center">
          <div class="col-4">
            <div class="p-2.5 bg-body rounded-3 border">
              <div class="text-secondary small fw-bold">Moves</div>
              <div class="fw-black fs-5">${moveCount}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="p-2.5 bg-body rounded-3 border">
              <div class="text-secondary small fw-bold">Time</div>
              <div class="fw-black fs-5">${durationStr}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="p-2.5 bg-body rounded-3 border">
              <div class="text-secondary small fw-bold">Your Side</div>
              <div class="fw-black fs-5">${this.userColor === 'w' ? '⚪ White' : '⚫ Black'}</div>
            </div>
          </div>
        </div>

        <div class="d-flex flex-column gap-2">
          <button type="button" class="arcade-btn-primary py-2.5 fw-black fs-6" id="modal-btn-review">
            <i class="bi bi-lightning-charge-fill me-1.5"></i> Review Game with Stockfish ⚡
          </button>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-light comic-btn flex-grow-1 py-2" id="modal-btn-rematch">
              <i class="bi bi-arrow-repeat me-1"></i> Rematch
            </button>
            <button type="button" class="btn btn-outline-secondary comic-btn flex-grow-1 py-2" id="modal-btn-close">
              <i class="bi bi-x-lg me-1"></i> Close
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#modal-btn-review')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      if (btn) {
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Preparing Review...`;
        btn.classList.add('disabled');
      }
      this.closeGameOverModal();
      if (this.onAnalyzeGame) {
        this.onAnalyzeGame(this.getEnrichedPgn(), this.userColor);
      }
    });

    modal.querySelector('#modal-btn-rematch')?.addEventListener('click', () => {
      this.closeGameOverModal();
      this.startNewGame();
    });

    modal.querySelector('#modal-btn-close')?.addEventListener('click', () => {
      this.closeGameOverModal();
    });
  }

  checkGameOver() {
    let reason = '';
    const isMate = typeof this.chess.isCheckmate === 'function'
      ? this.chess.isCheckmate()
      : (typeof this.chess.in_checkmate === 'function' ? this.chess.in_checkmate() : false);

    const isDraw = typeof this.chess.isDraw === 'function'
      ? this.chess.isDraw()
      : (typeof this.chess.in_draw === 'function' ? this.chess.in_draw() : false);

    if (isMate) {
      const winner = this.chess.turn() === 'w' ? 'b' : 'w';
      if (winner === this.userColor) {
        this.gameResult = 'win';
        reason = 'Checkmate';
        this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onBotLoss));
        soundService.playSuccess();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } else {
        this.gameResult = 'loss';
        reason = 'Checkmate';
        this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onBotWin));
        soundService.playBlunder();
      }
    } else if (isDraw) {
      this.gameResult = 'draw';
      reason = 'Draw / Stalemate';
      this.setBotSpeech('A noble draw! Well fought!');
    }

    if (this.gameResult) {
      this.updateControls();
      this.updateStatusText();
      setTimeout(() => this.showGameOverModal(reason), 350);
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
    const bubbleContainer = this.container.querySelector('.comic-bubble');
    if (bubbleEl) {
      bubbleEl.textContent = this.speechText;
    }
    if (bubbleContainer) {
      if (this.isSpeechVisible) {
        bubbleContainer.style.opacity = '1';
        bubbleContainer.style.visibility = 'visible';
        bubbleContainer.style.transform = 'scale(1)';
        bubbleContainer.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      } else {
        bubbleContainer.style.opacity = '0';
        bubbleContainer.style.visibility = 'hidden';
        bubbleContainer.style.transform = 'scale(0.92)';
        bubbleContainer.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      }
    }
  }

  updateStatusText() {
    const statusEl = this.container.querySelector('.bot-status-text');
    if (statusEl) {
      if (this.isBotThinking) {
        statusEl.innerHTML = `<span class="spinner-border spinner-border-sm text-warning me-1.5"></span><span class="fw-bold">Thinking...</span>`;
      } else if (this.gameResult === 'win') {
        statusEl.innerHTML = `<span class="badge bg-success px-2.5 py-1.5"><i class="bi bi-trophy-fill me-1"></i>Victory!</span>`;
      } else if (this.gameResult === 'loss') {
        statusEl.innerHTML = `<span class="badge bg-danger px-2.5 py-1.5"><i class="bi bi-x-circle-fill me-1"></i>Defeat!</span>`;
      } else if (this.gameResult === 'draw') {
        statusEl.innerHTML = `<span class="badge bg-secondary px-2.5 py-1.5">Draw</span>`;
      } else {
        const isUserTurn = this.chess.turn() === this.userColor;
        if (isUserTurn) {
          statusEl.innerHTML = `<span class="pulse-dot me-1.5"></span><span class="text-body fw-black">Your Turn</span>`;
        } else {
          statusEl.innerHTML = `<span class="badge bg-body-secondary text-secondary fw-bold">${this.selectedBot.name}'s turn</span>`;
        }
      }
    }
  }

  updateControls() {
    const actionArea = this.container.querySelector('.bot-game-actions');
    if (!actionArea) return;

    if (this.gameResult && this.onAnalyzeGame) {
      actionArea.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="arcade-btn-primary px-4 py-2" id="bot-btn-review">
            <i class="bi bi-lightning-charge-fill me-1"></i> Review Game with Stockfish ⚡
          </button>
          <button type="button" class="btn btn-outline-secondary comic-btn px-3 py-2" id="bot-btn-rematch">
            <i class="bi bi-arrow-repeat me-1"></i> Rematch
          </button>
        </div>
      `;

      actionArea.querySelector('#bot-btn-review')?.addEventListener('click', () => {
        this.onAnalyzeGame(this.getEnrichedPgn(), this.userColor);
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
          this.setBotSpeech('GG! You resigned. Ready for another round?');
          this.updateControls();
          this.updateStatusText();
          setTimeout(() => this.showGameOverModal('Resignation'), 350);
        }
      });
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="d-flex flex-column gap-3 max-w-4xl mx-auto">
        <!-- Collectible Bot Selection Card -->
        <div class="comic-card p-3 p-sm-4">
          <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="fs-3">${this.selectedBot.avatar}</span>
                <h4 class="mb-0 fw-black">${this.selectedBot.name}</h4>
                <span class="badge bg-warning text-dark fw-bold border border-dark">${this.selectedBot.elo} Elo</span>
                <span class="badge bg-secondary fw-semibold">${this.selectedBot.title}</span>
              </div>
              <p class="text-secondary small mb-0 mt-1">${this.selectedBot.description}</p>
            </div>

            <!-- 4 Tier Selector Tabs -->
            <div class="d-flex align-items-center gap-1.5 flex-wrap" role="group">
              <button type="button" class="arcade-tier-tab ${this.activeTier === 'rookie' ? 'active' : ''}" data-tier="rookie">🌱 Rookies</button>
              <button type="button" class="arcade-tier-tab ${this.activeTier === 'challenger' ? 'active' : ''}" data-tier="challenger">⚡ Challengers</button>
              <button type="button" class="arcade-tier-tab ${this.activeTier === 'hero' ? 'active' : ''}" data-tier="hero">🦸 Heroes</button>
              <button type="button" class="arcade-tier-tab ${this.activeTier === 'titan' ? 'active' : ''}" data-tier="titan">👑 Titans</button>
            </div>
          </div>

          <!-- Elo Step Slider (400 to 2000 in 50 increments) -->
          <div class="d-flex align-items-center gap-3 bg-body-tertiary p-2.5 rounded-3 border mb-3">
            <span class="small fw-bold text-nowrap"><i class="bi bi-speedometer2 me-1 text-warning"></i>Elo Level:</span>
            <input type="range" class="form-range arcade-range" id="bot-elo-slider" min="400" max="2000" step="50" value="${this.selectedBot.elo}">
            <span class="badge bg-dark fw-bold text-nowrap px-2.5 py-1.5 fs-6 font-monospace">${this.selectedBot.elo}</span>
          </div>

          <!-- Tier Collectible Bots Carousel -->
          <div class="d-flex gap-2.5 overflow-x-auto py-2" id="tier-bots-row" style="scrollbar-width: thin;">
            ${BOTS_33.filter((b) => b.tier === this.activeTier)
              .map(
                (b) => `
                <div class="arcade-bot-card flex-shrink-0 ${b.id === this.selectedBot.id ? 'active' : ''}" data-bot-id="${b.id}">
                  <span class="arcade-bot-avatar">${b.avatar}</span>
                  <span class="arcade-bot-name">${b.name}</span>
                  <span class="arcade-bot-elo">${b.elo}</span>
                </div>
              `
              )
              .join('')}
          </div>
        </div>

        <!-- Live Match Banner & Personality Speech Bubble -->
        <div class="arcade-match-strip">
          <div class="d-flex align-items-center gap-2">
            <span class="fs-4">${this.selectedBot.avatar}</span>
            <div class="comic-bubble">
              <span class="bot-speech-bubble-text">${this.speechText}</span>
            </div>
          </div>
          <div class="bot-status-text small fw-bold text-secondary">
            <span class="pulse-dot me-1.5"></span>Your turn (White)
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
