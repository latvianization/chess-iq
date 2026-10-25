/**
 * Vanilla JS Bot Arena Component
 * Provides 33 tiered bots (400–2000 Elo in 50-point increments),
 * all visible on one page separated into cards by tier.
 * Clicking any bot instantly starts a game with a random side.
 */

const BOT_TIERS = [
  { id: 'rookie', name: 'Rookies', range: '400 – 750 Elo', icon: '🌱', subtitle: 'Beginner & playful personalities' },
  { id: 'challenger', name: 'Challengers', range: '800 – 1150 Elo', icon: '⚡', subtitle: 'Solid club opponents' },
  { id: 'hero', name: 'Heroes', range: '1200 – 1550 Elo', icon: '🦸', subtitle: 'Sharp tactical fighters' },
  { id: 'titan', name: 'Titans', range: '1600 – 2000 Elo', icon: '👑', subtitle: 'Master tournament play' },
];

class BotArena {
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
    this.botMoveTimeout = null;
    this.gameResult = null; // 'win' | 'loss' | 'draw' | null
    this.board = null;
    this.lastSpeechPly = -10;
    this.isPlaying = false; // False = showing all bots by tier; True = live match
    this.scrollHandler = null;

    this.render();
  }

  cleanupScrollObserver() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
  }

  setActiveTierPill(tierId) {
    this.activeTier = tierId;
  }

  clearBotMoveTimeout() {
    if (this.botMoveTimeout) {
      clearTimeout(this.botMoveTimeout);
      this.botMoveTimeout = null;
    }
  }

  canUndo() {
    if (!this.chess) return false;
    const history = this.chess.history({ verbose: true });
    return history.some((m) => m.color === this.userColor);
  }

  undoMove() {
    if (!this.canUndo()) return;

    this.clearBotMoveTimeout();
    this.isBotThinking = false;

    let undone = this.chess.undo();
    while (undone && undone.color !== this.userColor) {
      undone = this.chess.undo();
    }

    this.gameResult = null;
    this.closeGameOverModal();
    soundService.playMove();

    this.updateBoard();
    this.updateControls();
    this.updateStatusText();
  }

  selectBotAndPlay(bot) {
    this.cleanupScrollObserver();
    this.selectedBot = bot;
    this.activeTier = bot.tier;
    const randomSide = Math.random() < 0.5 ? 'w' : 'b';
    this.userColor = randomSide;
    this.isPlaying = true;
    this.startNewGame(randomSide);
  }

  startNewGame(color = this.userColor) {
    this.clearBotMoveTimeout();
    this.isPlaying = true;
    this.userColor = color;
    this.customStartFen = null;
    this.chess.reset();
    this.gameResult = null;
    this.isBotThinking = false;
    this.gameStartTime = Date.now();
    this.closeGameOverModal();
    this.speechText = this.getRandomQuote(this.selectedBot.speech.onStart);
    this.isSpeechVisible = true;
    this.lastSpeechPly = 0;

    this.render();
    soundService.playSuccess();

    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      this.isSpeechVisible = false;
      this.updateSpeechBubble();
    }, 3800);

    if (this.userColor === 'b') {
      this.botMoveTimeout = setTimeout(() => this.triggerBotMove(), 600);
    }
  }

  startFromPosition(fen, userColor = 'w', targetElo = 1200) {
    this.cleanupScrollObserver();
    this.clearBotMoveTimeout();
    if (Array.isArray(BOTS_33) && BOTS_33.length > 0) {
      this.selectedBot = BOTS_33.reduce((best, b) =>
        Math.abs(b.elo - targetElo) < Math.abs(best.elo - targetElo) ? b : best
      );
      this.activeTier = this.selectedBot.tier;
    }
    this.isPlaying = true;
    this.userColor = userColor;
    this.customStartFen = fen;
    this.chess = new Chess(fen);
    this.gameResult = null;
    this.isBotThinking = false;
    this.gameStartTime = Date.now();
    this.closeGameOverModal();
    this.speechText = `Playing from custom position! Let's see how you play this out!`;
    this.isSpeechVisible = true;
    this.lastSpeechPly = 0;

    this.render();
    soundService.playSuccess();

    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      this.isSpeechVisible = false;
      this.updateSpeechBubble();
    }, 3800);

    if (!isChessGameOver(this.chess) && this.chess.turn() !== this.userColor) {
      this.botMoveTimeout = setTimeout(() => this.triggerBotMove(), 600);
    }
  }

  resetToPicker() {
    this.cleanupScrollObserver();
    this.clearBotMoveTimeout();
    this.isPlaying = false;
    this.isBotThinking = false;
    this.gameResult = null;
    this.chess.reset();
    this.closeGameOverModal();
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.game-over-modal-backdrop, .modal-backdrop, .why-modal-backdrop').forEach((el) => el.remove());
    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    this.board = null;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getRandomQuote(arr) {
    if (!arr || arr.length === 0) return 'Let us play chess!';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  setBotSpeech(text) {
    if (!text) return;
    this.speechText = text;
    this.isSpeechVisible = true;
    this.lastSpeechPly = this.chess ? this.chess.history().length : 0;
    this.updateSpeechBubble();

    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      this.isSpeechVisible = false;
      this.updateSpeechBubble();
    }, 3800);
  }

  handleUserMove(from, to) {
    if (this.isBotThinking || this.gameResult) return;

    // Evaluate position before move to detect quality
    const prevFen = this.chess.fen();
    const prevEval = evaluatePositionLocally(prevFen);

    try {
      const move = this.chess.move({ from, to, promotion: 'q' });
      if (!move) return;

      if (move.captured) {
        soundService.playCapture();
      } else {
        soundService.playMove();
      }

      // Check quality of user move
      const postEval = evaluatePositionLocally(this.chess.fen());
      const evalDiff = this.userColor === 'w' ? postEval.cp - prevEval.cp : prevEval.cp - postEval.cp;

      const plyCount = this.chess.history().length;
      const canSpeak = plyCount - this.lastSpeechPly >= 4;

      if (evalDiff <= -250) {
        soundService.playBlunder();
        if (canSpeak && Math.random() < 0.22) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserBlunder));
        }
      } else if (evalDiff >= 200) {
        soundService.playBrilliant();
        if (canSpeak && Math.random() < 0.20) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserGreat));
        }
      } else if (isChessInCheck(this.chess)) {
        soundService.playCheck();
        if (canSpeak && Math.random() < 0.15) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserGreat));
        }
      }

      this.updateBoard();
      this.updateControls();
      this.checkGameOver();

      if (!this.gameResult) {
        this.triggerBotMove();
      }
    } catch {
      // Invalid move
    }
  }

  triggerBotMove() {
    this.clearBotMoveTimeout();
    this.isBotThinking = true;
    this.updateStatusText();
    this.updateControls();

    const thinkTime = Math.min(1200, Math.max(350, 200 + (this.selectedBot.elo - 400) * 0.5));

    this.botMoveTimeout = setTimeout(() => {
      this.botMoveTimeout = null;
      if (isChessGameOver(this.chess)) return;

      const legalMoves = this.chess.moves({ verbose: true });
      if (legalMoves.length === 0) return;

      let chosenMove = null;
      const willMakeRandomMistake = Math.random() < this.selectedBot.randomness;

      if (willMakeRandomMistake && legalMoves.length > 1) {
        chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        const botSearchDepth = Math.max(1, Math.min(3, this.selectedBot.depth || 2));
        const searchResult = findBestMoveLocal(this.chess.fen(), botSearchDepth);
        if (searchResult && searchResult.bestMoveUci) {
          const from = searchResult.bestMoveUci.slice(0, 2);
          const to = searchResult.bestMoveUci.slice(2, 4);
          const promo = searchResult.bestMoveUci[4];
          const matched = legalMoves.find((m) => m.from === from && m.to === to && (!promo || m.promotion === promo));
          if (matched) chosenMove = matched;
        }
        if (!chosenMove) {
          chosenMove = legalMoves[0];
        }
      }

      const move = this.chess.move(chosenMove);
      this.isBotThinking = false;

      if (move) {
        if (move.captured) soundService.playCapture();
        else soundService.playMove();

        const isInCheck = isChessInCheck(this.chess);

        const plyCount = this.chess.history().length;
        const canSpeak = plyCount - this.lastSpeechPly >= 4;

        if (isInCheck) {
          soundService.playCheck();
          if (canSpeak && Math.random() < 0.18) {
            this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onBotCheck));
          }
        } else if (canSpeak && Math.random() < 0.04) {
          const generalQuotes = this.selectedBot.speech.onStart || [];
          if (generalQuotes.length > 0) {
            this.setBotSpeech(this.getRandomQuote(generalQuotes));
          }
        }
      }

      this.updateBoard();
      this.updateControls();
      this.updateStatusText();
      this.checkGameOver();
    }, thinkTime);
  }

  getEnrichedPgn() {
    const isUserWhite = this.userColor === 'w';
    const userName = 'You';
    const botName = `${this.selectedBot.name} (${this.selectedBot.elo})`;
    let result = '*';
    if (this.gameResult === 'win') result = isUserWhite ? '1-0' : '0-1';
    else if (this.gameResult === 'loss') result = isUserWhite ? '0-1' : '1-0';
    else if (this.gameResult === 'draw') result = '1/2-1/2';

    try {
      this.chess.header('Event', `Vs Bot: ${this.selectedBot.name}`);
      this.chess.header('Site', 'Chess IQ Bot Arena');
      this.chess.header('White', isUserWhite ? userName : botName);
      this.chess.header('Black', isUserWhite ? botName : userName);
      this.chess.header('WhiteElo', isUserWhite ? '1500' : String(this.selectedBot.elo));
      this.chess.header('BlackElo', isUserWhite ? String(this.selectedBot.elo) : '1500');
      this.chess.header('Result', result);
      this.chess.header('GameType', 'bot');
      this.chess.header('TimeControl', '-');
      this.chess.header('BotId', this.selectedBot.id);
      this.chess.header('BotName', this.selectedBot.name);
      this.chess.header('BotAvatar', this.selectedBot.avatar);
      if (this.customStartFen) {
        this.chess.header('SetUp', '1');
        this.chess.header('FEN', this.customStartFen);
      }
    } catch {}

    let pgn = '';
    try {
      pgn = this.chess.pgn();
    } catch {}

    if (!pgn || pgn.trim() === '') {
      const moves = this.chess.history();
      let moveStr = '';
      for (let i = 0; i < moves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        moveStr += `${moveNum}. ${moves[i]} ${moves[i + 1] || ''} `;
      }
      const fenHeaders = this.customStartFen ? `[SetUp "1"]\n[FEN "${this.customStartFen}"]\n` : '';
      const botHeaders = `[Event "Vs Bot: ${this.selectedBot.name}"]\n[Site "Chess IQ Bot Arena"]\n[GameType "bot"]\n[TimeControl "-"]\n[BotId "${this.selectedBot.id}"]\n[BotName "${this.selectedBot.name}"]\n[BotAvatar "${this.selectedBot.avatar}"]\n`;
      pgn = `${botHeaders}[White "${isUserWhite ? userName : botName}"]\n[Black "${isUserWhite ? botName : userName}"]\n[WhiteElo "${isUserWhite ? '1500' : this.selectedBot.elo}"]\n[BlackElo "${isUserWhite ? this.selectedBot.elo : '1500'}"]\n[Result "${result}"]\n${fenHeaders}\n${moveStr.trim()} ${result}`;
    }
    return pgn;
  }

  closeGameOverModal() {
    closeGameOverModal();
  }

  showGameOverModal(reason = 'Game Completed') {
    showGameOverModal(this, reason);
  }

  getBotRecords() {
    return getBotRecords();
  }

  recordBotResult(botId, result) {
    recordBotResult(botId, result);
  }

  checkGameOver() {
    let reason = '';
    const isMate = isChessCheckmate(this.chess);
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
      this.recordBotResult(this.selectedBot.id, this.gameResult);
      this.updateControls();
      this.updateStatusText();
      setTimeout(() => this.showGameOverModal(reason), 350);
    }
  }

  updateBoard() {
    if (!this.board) return;
    const history = this.chess.history({ verbose: true });
    const lastMove = history.length > 0 ? { from: history[history.length - 1].from, to: history[history.length - 1].to } : null;
    const isUserWhite = this.userColor === 'w';

    this.board.setProps({
      fen: this.chess.fen(),
      orientation: this.userColor,
      lastMove,
      selectedSquare: null,
      whiteName: isUserWhite ? 'You' : this.selectedBot.name,
      blackName: isUserWhite ? this.selectedBot.name : 'You',
      showPlayerBars: true,
      interactive: !this.isBotThinking && !this.gameResult,
      showLoosePieces: false,
      showBestMove: false,
      visionOverlay: 'none',
      badge: null,
      bestMove: null,
      secondBestMove: null,
      threatMove: null,
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

    const canUndo = this.canUndo();

    if (this.gameResult && this.onAnalyzeGame) {
      actionArea.innerHTML = `
        <div class="d-flex align-items-center flex-wrap justify-content-center gap-2">
          <button type="button" class="arcade-btn-primary px-4 py-2" id="bot-btn-review">
            <i class="bi bi-lightning-charge-fill me-1"></i> Review Game with Stockfish ⚡
          </button>
          <button type="button" class="btn btn-light comic-btn px-3 py-2" id="bot-btn-undo" ${!canUndo ? 'disabled' : ''}>
            <i class="bi bi-arrow-counterclockwise me-1"></i> Undo
          </button>
          <button type="button" class="btn btn-light comic-btn px-3 py-2" id="bot-btn-rematch">
            <i class="bi bi-arrow-repeat me-1"></i> Rematch
          </button>
          <button type="button" class="btn btn-outline-secondary comic-btn px-3 py-2" id="bot-btn-change-bot">
            <i class="bi bi-grid-fill me-1"></i> Change Bot
          </button>
        </div>
      `;

      actionArea.querySelector('#bot-btn-review')?.addEventListener('click', () => {
        this.onAnalyzeGame(this.getEnrichedPgn(), this.userColor, { isBotGame: true, bot: this.selectedBot });
      });
      actionArea.querySelector('#bot-btn-undo')?.addEventListener('click', () => {
        this.undoMove();
      });
      actionArea.querySelector('#bot-btn-rematch')?.addEventListener('click', () => {
        const randomSide = Math.random() < 0.5 ? 'w' : 'b';
        this.startNewGame(randomSide);
      });
      actionArea.querySelector('#bot-btn-change-bot')?.addEventListener('click', () => {
        this.resetToPicker();
      });
    } else {
      actionArea.innerHTML = `
        <div class="d-flex align-items-center flex-wrap justify-content-center gap-2">
          <button type="button" class="btn btn-light comic-btn px-3 py-1.5" id="bot-btn-new">
            <i class="bi bi-plus-circle me-1"></i> New Game
          </button>
          <button type="button" class="btn btn-light comic-btn px-3 py-1.5" id="bot-btn-undo" ${!canUndo ? 'disabled' : ''}>
            <i class="bi bi-arrow-counterclockwise me-1"></i> Undo
          </button>
          <button type="button" class="btn btn-light comic-btn px-3 py-1.5" id="bot-btn-flip">
            <i class="bi bi-arrow-left-right me-1"></i> Flip Sides
          </button>
          <button type="button" class="btn btn-outline-danger comic-btn px-3 py-1.5" id="bot-btn-resign">
            <i class="bi bi-flag me-1"></i> Resign
          </button>
          <button type="button" class="btn btn-outline-secondary comic-btn px-3 py-1.5" id="bot-btn-change-bot">
            <i class="bi bi-grid-fill me-1"></i> Change Bot
          </button>
        </div>
      `;

      actionArea.querySelector('#bot-btn-new')?.addEventListener('click', () => {
        const randomSide = Math.random() < 0.5 ? 'w' : 'b';
        this.startNewGame(randomSide);
      });
      actionArea.querySelector('#bot-btn-undo')?.addEventListener('click', () => {
        this.undoMove();
      });
      actionArea.querySelector('#bot-btn-flip')?.addEventListener('click', () => {
        this.startNewGame(this.userColor === 'w' ? 'b' : 'w');
      });
      actionArea.querySelector('#bot-btn-resign')?.addEventListener('click', () => {
        if (!this.gameResult && this.chess.history().length > 0) {
          this.clearBotMoveTimeout();
          this.isBotThinking = false;
          this.gameResult = 'loss';
          this.setBotSpeech('GG! You resigned. Ready for another round?');
          this.updateControls();
          this.updateStatusText();
          setTimeout(() => this.showGameOverModal('Resignation'), 350);
        }
      });
      actionArea.querySelector('#bot-btn-change-bot')?.addEventListener('click', () => {
        this.resetToPicker();
      });
    }
  }

  render() {
    this.cleanupScrollObserver();

    // ══════════════════════════════════════════════════════════════════════════
    // VIEW STATE 1: ALL BOTS ON ONE PAGE SEPARATED BY TIER (NO BOARD DISPLAYED)
    // ══════════════════════════════════════════════════════════════════════════
    if (!this.isPlaying) {
      this.board = null;
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      document.querySelectorAll('.game-over-modal-backdrop, .modal-backdrop, .why-modal-backdrop').forEach((el) => el.remove());

      const records = this.getBotRecords();

      this.container.innerHTML = `
        <div class="d-flex flex-column gap-3 w-100 py-1 position-relative">
          <!-- All Bots Grouped in Separate Cards by Tier -->
          ${BOT_TIERS.map((tier) => {
            const tierBots = BOTS_33.filter((b) => b.tier === tier.id);
            return `
              <div class="comic-card p-3 p-sm-4" id="tier-sec-${tier.id}">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
                  <div class="d-flex align-items-center gap-2">
                    <span class="fs-4">${tier.icon}</span>
                    <h4 class="fw-black mb-0 fs-5">${tier.name}</h4>
                    <span class="badge bg-warning text-dark fw-bold font-monospace" style="font-size: 11px;">${tier.range}</span>
                  </div>
                  <span class="text-secondary small fw-bold">${tier.subtitle} · ${tierBots.length} Bots</span>
                </div>

                <div class="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6">
                  ${tierBots
                    .map((b) => {
                      const wins = records[b.id]?.wins || 0;
                      return `
                      <div class="col">
                        <div class="bot-select-card comic-card p-3 d-flex flex-column h-100 cursor-pointer" data-bot-id="${b.id}" role="button" tabindex="0" aria-label="Play against ${b.name} (${b.elo} Elo)" style="cursor: pointer; position: relative; border-radius: 1rem;">
                          ${wins > 0 ? `<span class="badge bg-success text-white fw-bold position-absolute top-0 end-0 m-2.5" style="font-size: 10.5px;"><i class="bi bi-trophy-fill me-0.5"></i>${wins}W</span>` : ''}
                          <div class="d-flex align-items-center gap-2.5 mb-2">
                            <span class="bot-avatar-emoji fs-1 lh-1">${b.avatar}</span>
                            <div class="min-w-0 flex-grow-1">
                              <div class="fw-black text-truncate fs-6">${b.name}</div>
                              <div class="d-flex align-items-center gap-1.5 mt-0.5">
                                <span class="badge bg-warning text-dark fw-bold font-monospace" style="font-size: 11px;">${b.elo} Elo</span>
                                <span class="text-secondary small text-truncate fw-semibold" style="font-size: 11px;">${b.title}</span>
                              </div>
                            </div>
                          </div>
                          <p class="text-secondary small mb-0" style="font-size: 12px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 32px;">
                            ${b.description}
                          </p>
                        </div>
                      </div>
                    `;
                    })
                    .join('')}
                </div>
              </div>
            `;
          }).join('')}

          <!-- Floating Return to Top Button -->
          <button type="button" class="btn btn-warning rounded-circle shadow-lg position-fixed" id="bot-float-top-btn" title="Back to top" aria-label="Scroll to top" style="bottom: 24px; right: 24px; width: 44px; height: 44px; z-index: 1020; font-size: 1.25rem; display: none; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.45);">
            <i class="bi bi-chevron-up fw-black text-dark"></i>
          </button>
        </div>
      `;

      // Bind floating return to top button
      const floatTopBtn = this.container.querySelector('#bot-float-top-btn');
      floatTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Scroll listener to toggle floating return to top button
      this.scrollHandler = () => {
        const scrollY = window.scrollY;
        if (floatTopBtn) {
          floatTopBtn.style.display = scrollY > 200 ? 'flex' : 'none';
        }
      };
      window.addEventListener('scroll', this.scrollHandler, { passive: true });

      // Bind click and keyboard handlers to each bot card to start new game with random side
      this.container.querySelectorAll('[data-bot-id]').forEach((card) => {
        const handleStartGame = () => {
          const botId = card.getAttribute('data-bot-id');
          const targetBot = BOTS_33.find((b) => b.id === botId);
          if (targetBot) {
            this.selectBotAndPlay(targetBot);
          }
        };

        card.addEventListener('click', handleStartGame);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleStartGame();
          }
        });
      });

      return;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VIEW STATE 2: ACTIVE MATCH (BOT SELECTION CARDS ARE COMPLETELY HIDDEN)
    // ══════════════════════════════════════════════════════════════════════════
    this.container.innerHTML = `
      <div class="d-flex flex-column gap-2 w-100 mx-auto" style="max-width: min(840px, 98vw);">
        <!-- Live Match Banner & Personality Speech Bubble -->
        <div class="arcade-match-strip d-flex align-items-center justify-content-between p-2.5 px-3 rounded-3 flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2.5 flex-nowrap min-w-0">
            <span class="fs-3 lh-1 flex-shrink-0">${this.selectedBot.avatar}</span>
            <div class="flex-shrink-0">
              <div class="d-flex align-items-center gap-1.5 flex-wrap">
                <span class="fw-black fs-6">${this.selectedBot.name}</span>
                <span class="badge bg-warning text-dark fw-bold" style="font-size: 11px;">${this.selectedBot.elo} Elo</span>
                <span class="badge bg-secondary d-none d-sm-inline" style="font-size: 11px;">${this.selectedBot.title}</span>
                <span class="badge bg-body-secondary text-body fw-bold" style="font-size: 11px;">${this.userColor === 'w' ? '⚪ You play White' : '⚫ You play Black'}</span>
              </div>
            </div>
            <div class="comic-bubble ms-1 d-none d-md-flex">
              <span class="bot-speech-bubble-text">${this.speechText}</span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
            <div class="bot-status-text small fw-bold text-secondary">
              <span class="pulse-dot me-1.5"></span>Your turn (${this.userColor === 'w' ? 'White' : 'Black'})
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold py-1 px-2.5 text-nowrap" id="bot-match-change-btn" title="Choose another bot">
              <i class="bi bi-grid-fill me-1"></i><span class="d-none d-sm-inline">Change </span>Bot
            </button>
          </div>
        </div>

        <!-- Chessboard Container (Center Stage) -->
        <div class="d-flex justify-content-center" id="bot-board-mount"></div>

        <!-- Controls Area -->
        <div class="d-flex justify-content-center bot-game-actions mt-1"></div>
      </div>
    `;

    // Mount Chessboard
    const boardMount = this.container.querySelector('#bot-board-mount');
    const isUserWhite = this.userColor === 'w';
    this.board = new Chessboard(boardMount, {
      fen: this.chess.fen(),
      orientation: this.userColor,
      theme: this.theme,
      whiteName: isUserWhite ? 'You' : this.selectedBot.name,
      blackName: isUserWhite ? this.selectedBot.name : 'You',
      showPlayerBars: true,
      interactive: !this.isBotThinking && !this.gameResult,
      showLoosePieces: false,
      showBestMove: false,
      visionOverlay: 'none',
      badge: null,
      bestMove: null,
      secondBestMove: null,
      threatMove: null,
      legalMovesFrom: (sq) => {
        const moves = this.chess.moves({ square: sq, verbose: true });
        return moves.map((m) => m.to);
      },
      onMove: (from, to) => this.handleUserMove(from, to),
    });

    this.updateControls();
    this.updateStatusText();
    this.updateSpeechBubble();

    // Top Match Strip "Change Bot" button listener
    this.container.querySelector('#bot-match-change-btn')?.addEventListener('click', () => {
      this.resetToPicker();
    });
  }
}
