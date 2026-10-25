/**
 * Vanilla JS Game Review Dashboard Component
 * Displays Stockfish tournament analysis, interactive move history,
 * eval bar, phase ratings, comic sound effect badges, and tactical refutations.
 */


class ReviewDashboard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onOpenImport = options.onOpenImport || null;
    this.onSwitchToBots = options.onSwitchToBots || null;
    this.onPlayFromFen = options.onPlayFromFen || null;
    this.onSelectGame = options.onSelectGame || null;
    this.onReanalyzeGame = options.onReanalyzeGame || null;
    this.theme = options.theme || 'green';

    this.game = null; // AnalyzedGame object
    this.isAnalyzing = false;
    this.analysisProgress = { current: 0, total: 0 };
    this.currentPly = 0;
    this.orientation = 'w';
    this.isThreatActive = true;
    this.showBestMove = true;
    this.showLoosePieces = true;
    this.visionOverlay = 'none'; // 'none' | 'heatmap'
    this.moveFilter = 'all'; // 'all' | 'key' | 'errors'
    this.sandboxState = null;
    this.retryPuzzleState = null;
    this.guessMoveState = null;
    this.board = null;
    this.analysisStartTime = null;
    this.advantagePoints = [];
    this.advantageMidY = 42;
    this.savedGamesFilter = 'all'; // 'all' | 'players' | 'bots'

    window.addEventListener('chess_iq_cache_updated', () => {
      if (!this.game && !this.isAnalyzing) this.render();
    });
    window.addEventListener('chess_iq_cache_cleared', () => {
      if (!this.game && !this.isAnalyzing) this.render();
    });
    window.addEventListener('chess_iq_games_imported', () => {
      if (!this.game && !this.isAnalyzing) this.render();
    });

    this.initKeyboardNavigation();
    this.render();
  }

  initKeyboardNavigation() {
    this.handleKeyDown = (e) => {
      // Don't intercept when user is typing in form controls
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable) return;

      // Don't intercept if review view is currently hidden (e.g. user in bot mode)
      const reviewView = document.getElementById('review-view');
      if (reviewView && reviewView.classList.contains('d-none')) return;

      // Don't intercept if any modal is active (Bootstrap modal or Why-blunder modal)
      if (document.querySelector('.modal.show') || document.getElementById('why-blunder-modal')) return;

      if (!this.game) return;

      const isPrev = e.key === 'ArrowLeft' || e.key === 'Left' || e.code === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Up' || e.code === 'ArrowUp';
      const isNext = e.key === 'ArrowRight' || e.key === 'Right' || e.code === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Down' || e.code === 'ArrowDown';
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (e.key === 'Home' || (isCtrlOrMeta && isPrev)) {
        e.preventDefault();
        this.goToPly(0);
      } else if (e.key === 'End' || (isCtrlOrMeta && isNext)) {
        e.preventDefault();
        this.goToPly(this.game.plies.length);
      } else if (isPrev) {
        e.preventDefault();
        this.goToPly(this.currentPly - 1);
      } else if (isNext) {
        e.preventDefault();
        this.goToPly(this.currentPly + 1);
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

  async showLoading(current = 0, total = 0) {
    if (!this.isAnalyzing || !this.analysisStartTime) {
      this.analysisStartTime = Date.now();
      this.lastUiYieldTime = 0;
    }
    this.isAnalyzing = true;
    this.analysisProgress = { current, total };

    const card = this.container.querySelector('#review-analysis-card');
    if (card) {
      this.updateLoadingCard(current, total);
    } else {
      this.render();
    }

    // Cooperative yield: ensures the browser paints DOM updates without freezing
    const now = Date.now();
    if (now - (this.lastUiYieldTime || 0) >= 16 || current === 0 || current >= total) {
      this.lastUiYieldTime = now;
      await new Promise((resolve) => setTimeout(resolve, 0));
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
      if (remainingSec >= 60) {
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        etaText = `~${mins}m ${secs}s remaining`;
      } else {
        etaText = `~${remainingSec}s remaining`;
      }
    } else if (current >= total && total > 0) {
      etaText = 'Finalizing report...';
    }

    if (subtitleEl) {
      if (total > 0) {
        if (current >= total) {
          subtitleEl.textContent = 'Finalizing tactical report...';
        } else if (current === 0) {
          subtitleEl.textContent = `Starting Stockfish analysis (${total} plies)...`;
        } else if (pct >= 85) {
          subtitleEl.textContent = `Verifying critical moments (${current} / ${total})...`;
        } else {
          subtitleEl.textContent = `Evaluating ply ${current} of ${total}...`;
        }
      } else {
        subtitleEl.textContent = 'Starting Stockfish analysis...';
      }
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
    this.lastUiYieldTime = 0;
  }

  setGame(analyzedGame) {
    this.isAnalyzing = false;
    this.analysisStartTime = null;
    this.lastUiYieldTime = 0;
    this.game = analyzedGame;
    if (analyzedGame && typeof syncGameToBlunderBank === 'function') {
      try { syncGameToBlunderBank(analyzedGame); } catch {}
    }
    this.currentPly = analyzedGame && Array.isArray(analyzedGame.plies) && analyzedGame.plies.length > 0 ? 1 : 0;
    this.orientation = analyzedGame ? analyzedGame.userColor : 'w';
    this.isThreatActive = true;
    this.showBestMove = true;
    this.showLoosePieces = true;
    this.visionOverlay = 'none';
    this.moveFilter = 'all';
    this.sandboxState = null;
    this.retryPuzzleState = null;
    this.guessMoveState = null;
    this.render();
  }

  formatClock(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return null;
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  formatTimeSpent(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return null;
    if (seconds < 10) return `${seconds.toFixed(1)}s`;
    return `${Math.round(seconds)}s`;
  }

  getUserMistakePlies() {
    if (!this.game || !Array.isArray(this.game.plies)) return [];
    const userColor = this.game.userColor || 'w';
    const errorTypes = ['blunder', 'mistake', 'missed_win', 'inaccuracy'];
    return this.game.plies.filter((p) => p && p.color === userColor && errorTypes.includes(p.classification));
  }

  getActiveBoardFen() {
    if (this.retryPuzzleState?.active && this.retryPuzzleState.boardFen) {
      return this.retryPuzzleState.boardFen;
    }
    if (this.guessMoveState?.active && this.guessMoveState.boardFen) {
      return this.guessMoveState.boardFen;
    }
    if (this.sandboxState?.fen) {
      return this.sandboxState.fen;
    }
    const cur = this.getCurrentEval();
    if (cur && cur.fen) return cur.fen;
    if (this.game && this.game.initialFen) return this.game.initialFen;
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  legalMovesFrom(square) {
    try {
      const c = new Chess(this.getActiveBoardFen());
      return c.moves({ square, verbose: true }).map((m) => m.to);
    } catch {
      return [];
    }
  }

  async handleBoardMove(from, to) {
    if (!this.game) return;

    // 1. Retry Mistakes Puzzle Mode
    if (this.retryPuzzleState?.active && !this.retryPuzzleState.solved) {
      const cur = this.getCurrentEval();
      if (!cur) return;
      try {
        const c = new Chess(cur.fenBefore);
        const move = c.move({ from, to, promotion: 'q' });
        if (!move) return;

        const playedUci = `${move.from}${move.to}`;
        const bestPrefix = (cur.bestMoveUci || '').slice(0, 4).toLowerCase();
        const isCorrect = playedUci.toLowerCase() === bestPrefix || move.san === cur.bestMoveSan;

        if (isCorrect) {
          this.retryPuzzleState.solved = true;
          this.retryPuzzleState.boardFen = c.fen();
          this.retryPuzzleState.lastMove = { from: move.from, to: move.to };
          this.retryPuzzleState.message = `✅ Found it! ${move.san} is the top engine move.`;
          this.retryPuzzleState.isError = false;
          if (this.board) this.board.userHighlights.clear();
          soundService.playBrilliant();
        } else {
          this.retryPuzzleState.message = `❌ ${move.san} is not the best move here — try again or use Hint!`;
          this.retryPuzzleState.isError = true;
          soundService.playBlunder();
        }
        this.updateBoardAndControls();
      } catch {}
      return;
    }

    // 2. Guess the Move Active Mode
    if (this.guessMoveState?.active && !this.guessMoveState.answered) {
      const cur = this.getCurrentEval();
      if (!cur) return;
      try {
        const c = new Chess(cur.fenBefore);
        const move = c.move({ from, to, promotion: 'q' });
        if (!move) return;

        const playedUci = `${move.from}${move.to}`.toLowerCase();
        const bestPrefix = (cur.bestMoveUci || '').slice(0, 4).toLowerCase();
        const secondPrefix = (cur.secondBestMoveUci || '').slice(0, 4).toLowerCase();
        const actualGameSan = cur.san;

        this.guessMoveState.answered = true;
        this.guessMoveState.boardFen = c.fen();
        this.guessMoveState.lastMove = { from: move.from, to: move.to };
        this.guessMoveState.maxScore += 3;

        if (playedUci === bestPrefix || move.san === cur.bestMoveSan) {
          this.guessMoveState.score += 3;
          this.guessMoveState.grade = '⭐⭐⭐ Engine #1!';
          this.guessMoveState.isError = false;
          this.guessMoveState.message = `Spot on! ${move.san} is Stockfish's #1 choice (in the game you played ${actualGameSan}).`;
          soundService.playBrilliant();
        } else if (playedUci === secondPrefix || move.san === cur.secondBestMoveSan || (move.san === actualGameSan && ['best', 'excellent', 'great', 'good'].includes(cur.classification))) {
          this.guessMoveState.score += 2;
          this.guessMoveState.grade = '⭐⭐ Solid Move';
          this.guessMoveState.isError = false;
          this.guessMoveState.message = `Good choice! ${move.san} is a strong continuation (Engine #1: ${cur.bestMoveSan}, game move: ${actualGameSan}).`;
          soundService.playMove();
        } else {
          this.guessMoveState.grade = '⚠️ Inaccurate';
          this.guessMoveState.isError = true;
          this.guessMoveState.message = `You guessed ${move.san}. Engine preferred ${cur.bestMoveSan} (in the game you played ${actualGameSan}).`;
          soundService.playBlunder();
        }
        this.updateBoardAndControls();
      } catch {}
      return;
    }

    // 3. Interactive What-If Sandbox Mode
    try {
      const baseFen = this.getActiveBoardFen();
      const c = new Chess(baseFen);
      const move = c.move({ from, to, promotion: 'q' });
      if (!move) return;

      if (move.captured) soundService.playCapture();
      else soundService.playMove();

      const newFen = c.fen();
      const prevMoves = this.sandboxState?.moveHistorySan || [];
      this.sandboxState = {
        fen: newFen,
        lastMove: { from: move.from, to: move.to },
        moveHistorySan: [...prevMoves, move.san],
        evalResult: null,
        isEvaluating: true
      };
      this.updateBoardAndControls();

      const evalRes = await evaluateFenHybrid(newFen, false);
      if (this.sandboxState && this.sandboxState.fen === newFen) {
        this.sandboxState.evalResult = evalRes;
        this.sandboxState.isEvaluating = false;
        this.updateBoardAndControls();
      }
    } catch {}
  }

  startRetryMistakes() {
    const mistakes = this.getUserMistakePlies();
    if (mistakes.length === 0) return;
    this.sandboxState = null;
    this.guessMoveState = null;
    if (this.board) this.board.userHighlights.clear();
    const first = mistakes[0];
    this.currentPly = first.ply;
    this.retryPuzzleState = {
      active: true,
      mistakes,
      currentIndex: 0,
      solved: false,
      hintShown: false,
      boardFen: first.fenBefore,
      lastMove: null,
      message: `You played ${first.san} (${first.classification.replace('_', ' ')}). Drag the best move on the board!`,
      isError: false
    };
    this.updateBoardAndControls();
  }

  loadMistakeAtIndex(idx) {
    if (!this.retryPuzzleState?.active) return;
    const mistakes = this.retryPuzzleState.mistakes;
    if (idx < 0 || idx >= mistakes.length) return;
    if (this.board) this.board.userHighlights.clear();
    const target = mistakes[idx];
    this.currentPly = target.ply;
    this.retryPuzzleState.currentIndex = idx;
    this.retryPuzzleState.solved = false;
    this.retryPuzzleState.hintShown = false;
    this.retryPuzzleState.boardFen = target.fenBefore;
    this.retryPuzzleState.lastMove = null;
    this.retryPuzzleState.message = `You played ${target.san} (${target.classification.replace('_', ' ')}). Drag the best move on the board!`;
    this.retryPuzzleState.isError = false;
    this.updateBoardAndControls();
  }

  showPuzzleHint() {
    if (!this.retryPuzzleState?.active) return;
    const cur = this.getCurrentEval();
    if (!cur || !cur.bestMoveUci || cur.bestMoveUci.length < 4) return;
    const fromSq = cur.bestMoveUci.slice(0, 2);
    this.retryPuzzleState.hintShown = true;
    this.retryPuzzleState.message = `💡 Hint: Move the piece on ${fromSq.toUpperCase()}!`;
    this.retryPuzzleState.isError = false;
    if (this.board) {
      this.board.userHighlights.clear();
      this.board.userHighlights.add(fromSq);
    }
    this.updateBoardAndControls();
  }

  revealPuzzleSolution() {
    if (!this.retryPuzzleState?.active) return;
    const cur = this.getCurrentEval();
    if (!cur) return;
    this.retryPuzzleState.solved = true;
    this.retryPuzzleState.boardFen = cur.fen;
    this.retryPuzzleState.lastMove = { from: cur.from, to: cur.to };
    this.retryPuzzleState.message = `👁 Solution: ${cur.bestMoveSan} was the best move (you played ${cur.san}).`;
    this.retryPuzzleState.isError = false;
    if (this.board) this.board.userHighlights.clear();
    this.updateBoardAndControls();
  }

  startGuessTheMove() {
    if (!this.game || !Array.isArray(this.game.plies)) return;
    const userColor = this.game.userColor || 'w';
    const userTurns = this.game.plies.filter((p) => p && p.color === userColor && p.ply > 6 && p.classification !== 'book');
    if (userTurns.length === 0) return;

    this.sandboxState = null;
    this.retryPuzzleState = null;
    if (this.board) this.board.userHighlights.clear();

    const first = userTurns[0];
    this.currentPly = first.ply;
    this.guessMoveState = {
      active: true,
      turns: userTurns,
      currentIndex: 0,
      answered: false,
      score: 0,
      maxScore: 0,
      grade: '',
      boardFen: first.fenBefore,
      lastMove: null,
      message: `Move ${Math.ceil(first.ply / 2)}: What move would you play here? Drag a piece on the board!`,
      isError: false
    };
    this.updateBoardAndControls();
  }

  loadGuessTurnAtIndex(idx) {
    if (!this.guessMoveState?.active) return;
    const turns = this.guessMoveState.turns;
    if (idx < 0 || idx >= turns.length) return;
    if (this.board) this.board.userHighlights.clear();
    const target = turns[idx];
    this.currentPly = target.ply;
    this.guessMoveState.currentIndex = idx;
    this.guessMoveState.answered = false;
    this.guessMoveState.grade = '';
    this.guessMoveState.boardFen = target.fenBefore;
    this.guessMoveState.lastMove = null;
    this.guessMoveState.message = `Move ${Math.ceil(target.ply / 2)}: What move would you play here?`;
    this.guessMoveState.isError = false;
    this.updateBoardAndControls();
  }

  exitSpecialMode() {
    this.sandboxState = null;
    this.retryPuzzleState = null;
    this.guessMoveState = null;
    if (this.board) this.board.userHighlights.clear();
    this.updateBoardAndControls();
  }

  toggleVisionOverlay(mode) {
    if (mode === 'loose') {
      this.showLoosePieces = !this.showLoosePieces;
    } else {
      this.visionOverlay = this.visionOverlay === mode ? 'none' : mode;
    }
    this.updateBoardAndControls();
  }

  playFromCurrentPosition(overridePly = null) {
    if (!this.game || !this.onPlayFromFen) return;
    if (overridePly !== null && overridePly > 0 && this.game.plies[overridePly - 1]) {
      this.goToPly(overridePly);
    }
    const fen = this.getActiveBoardFen();
    const userColor = this.game.userColor || 'w';
    const oppElo = userColor === 'w' ? (this.game.blackElo || 1200) : (this.game.whiteElo || 1200);
    this.onPlayFromFen(fen, userColor, oppElo);
  }

  goToPly(ply) {
    if (!this.game) return;
    this.sandboxState = null;
    this.retryPuzzleState = null;
    this.guessMoveState = null;
    if (this.board) this.board.userHighlights.clear();
    this.currentPly = Math.max(0, Math.min(this.game.plies.length, ply));

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

  syncEvalBarHeight() {
    const evalBar = this.container.querySelector('#eval-bar');
    const boardEl = this.container.querySelector('#review-board-mount .board-container');
    if (!evalBar || !boardEl) return;
    const boardHeight = boardEl.offsetHeight;
    if (boardHeight > 50) {
      evalBar.style.height = `${boardHeight}px`;
      evalBar.style.minHeight = `${boardHeight}px`;
      evalBar.style.alignSelf = 'center';
    }
  }

  setupEvalBarObserver() {
    if (this._evalBarObserver) {
      this._evalBarObserver.disconnect();
      this._evalBarObserver = null;
    }
    const boardEl = this.container.querySelector('#review-board-mount .board-container');
    if (boardEl && typeof ResizeObserver !== 'undefined') {
      this._evalBarObserver = new ResizeObserver(() => {
        this.syncEvalBarHeight();
      });
      this._evalBarObserver.observe(boardEl);
    }
    this.syncEvalBarHeight();
  }

  shareGameReviewLink(btnEl) {
    if (!this.game) return;
    try {
      const pgn = this.game.pgn || '';
      const userColor = this.game.userColor || 'w';
      const origin = (window.location.origin && window.location.origin !== 'null' && window.location.protocol !== 'file:')
        ? window.location.origin
        : '';
      const path = window.location.pathname || '';
      const pgnParam = encodeURIComponent(pgn);
      const colorParam = encodeURIComponent(userColor);
      const shareUrl = `${origin}${path}?pgn=${pgnParam}&color=${colorParam}`;

      const onSuccess = () => {
        if (btnEl) {
          const originalHtml = btnEl.innerHTML;
          btnEl.innerHTML = '<i class="bi bi-check2-circle me-1 text-success"></i>Copied!';
          btnEl.classList.add('border-success');
          setTimeout(() => {
            if (btnEl) {
              btnEl.innerHTML = originalHtml;
              btnEl.classList.remove('border-success');
            }
          }, 2500);
        }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(onSuccess).catch(() => {
          prompt('Copy this link to share the game review:', shareUrl);
        });
      } else {
        prompt('Copy this link to share the game review:', shareUrl);
      }
    } catch (err) {
      console.error('Failed to share game link:', err);
    }
  }

  closeWhyModal() {
    closeWhyModal(this);
  }

  openWhyModal(targetEval = null) {
    return openWhyModal(this, targetEval);
  }

  getCurrentEval() {
    if (!this.game || this.currentPly === 0 || this.currentPly > this.game.plies.length) return null;
    return this.game.plies[this.currentPly - 1];
  }

  getTopMovesForFen(fen) {
    if (!fen) return { best: null, second: null };
    try {
      const isValidUci = (u) => typeof u === 'string' && u.length >= 4 && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(u);
      const normKey = normalizeFenKey(fen);
      const cached = FEN_EVAL_CACHE.get(`${normKey}_deep`) || FEN_EVAL_CACHE.get(`${normKey}_fast`) || FEN_EVAL_CACHE.get(fen);
      let bestUci = isValidUci(cached?.bestMoveUci) ? cached.bestMoveUci : null;
      let secondUci = isValidUci(cached?.secondBestMoveUci) ? cached.secondBestMoveUci : null;

      if (!bestUci) {
        const local = findBestMoveLocal(fen, 2);
        bestUci = isValidUci(local.bestMoveUci) ? local.bestMoveUci : null;
        secondUci = isValidUci(local.secondBestMoveUci) ? local.secondBestMoveUci : null;
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
    const isPuzzleMode = Boolean(this.retryPuzzleState?.active);
    const isPuzzleUnsolved = isPuzzleMode && !this.retryPuzzleState.solved;
    const isGuessMode = Boolean(this.guessMoveState?.active);
    const isGuessUnanswered = isGuessMode && !this.guessMoveState.answered;
    const isBlindActive = isPuzzleUnsolved || isGuessUnanswered;
    const isSandboxMode = Boolean(this.sandboxState && !isPuzzleMode && !isGuessMode);

    const fen = this.getActiveBoardFen();
    const lastMove = isPuzzleMode
      ? this.retryPuzzleState.lastMove
      : (isGuessMode
          ? this.guessMoveState.lastMove
          : (isSandboxMode ? this.sandboxState.lastMove : (cur ? { from: cur.from, to: cur.to } : null)));

    let bestMove = null;
    let secondBestMove = null;

    const isValidUci = (u) => typeof u === 'string' && u.length >= 4 && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(u);

    if (isBlindActive) {
      bestMove = null;
      secondBestMove = null;
    } else if (isSandboxMode) {
      const sbBestUci = this.sandboxState.evalResult?.bestMoveUci;
      bestMove = isValidUci(sbBestUci)
        ? { from: sbBestUci.slice(0, 2), to: sbBestUci.slice(2, 4) }
        : null;
      secondBestMove = null;
    } else if (cur) {
      const isOptimal = ['best', 'brilliant', 'great', 'book'].includes(cur.classification);
      let bestUci = isValidUci(cur.bestMoveUci) ? cur.bestMoveUci : null;
      let secondUci = isValidUci(cur.secondBestMoveUci) ? cur.secondBestMoveUci : null;

      if (!bestUci || !secondUci) {
        const top = this.getTopMovesForFen(cur.fenBefore);
        if (!bestUci && top.best) bestUci = `${top.best.from}${top.best.to}`;
        if (!secondUci && top.second) secondUci = `${top.second.from}${top.second.to}`;
      }

      if (isOptimal && !isPuzzleMode && !isGuessMode) {
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

    const threatMove = !isBlindActive && !isSandboxMode && cur?.threat?.uci && cur.threat.uci.length >= 4
      ? { from: cur.threat.uci.slice(0, 2), to: cur.threat.uci.slice(2, 4) }
      : null;

    const badge = !isBlindActive && !isSandboxMode && cur ? { square: cur.to, classification: cur.classification } : null;

    this.board?.setProps({
      fen,
      orientation: this.orientation,
      lastMove,
      bestMove,
      secondBestMove,
      threatMove,
      badge,
      visionOverlay: this.visionOverlay,
      showBestMove: true,
      showLoosePieces: !isBlindActive && this.showLoosePieces,
      whiteName: this.game?.white || 'White',
      blackName: this.game?.black || 'Black',
      showPlayerBars: true,
    });

    // Update Banner Area (Sandbox, Retry Mistakes Puzzle, or Guess the Move)
    this.updateModeBanner(cur);

    // Update 4-Pillar Positional Breakdown
    this.updatePositionalPillars(fen);

    // Update Eval Bar
    if (isSandboxMode && this.sandboxState.evalResult) {
      const sbEval = this.sandboxState.evalResult;
      this.updateEvalBar({
        scoreCp: sbEval.scoreCp,
        mate: sbEval.mate,
        winProb: cpToWinProb(sbEval.scoreCp, sbEval.mate)
      });
    } else {
      this.updateEvalBar(cur);
    }
    this.updateAdvantageScrubber();
    this.syncEvalBarHeight();

    // Update Move Strip Badge & Notation
    const stripEl = this.container.querySelector('#review-move-strip');
    if (stripEl) {
      if (cur && !isBlindActive) {
        const comic = getComicBadge(cur.classification, cur.san);
        const evalStr = cur.mate !== null
          ? `M${Math.abs(cur.mate)}`
          : (cur.scoreCp > 0 ? `+${(cur.scoreCp / 100).toFixed(1)}` : (cur.scoreCp / 100).toFixed(1));

        const isOptimal = ['best', 'brilliant', 'great', 'book'].includes(cur.classification);
        const isSuboptimal = !isOptimal;
        const topForCur = (!cur.bestMoveSan && cur.fenBefore) ? this.getTopMovesForFen(cur.fenBefore) : null;
        const bestSan = cur.bestMoveSan || (cur.bestMoveUci && cur.bestMoveUci.length >= 4 ? `${cur.bestMoveUci.slice(0, 2)}-${cur.bestMoveUci.slice(2, 4)}` : (topForCur?.best ? `${topForCur.best.from}-${topForCur.best.to}` : ''));
        const secondSan = cur.secondBestMoveSan || (topForCur?.second ? `${topForCur.second.from}-${topForCur.second.to}` : null);
        const clockStr = this.formatClock(cur.clockSeconds ?? cur.clock);
        const spentStr = this.formatTimeSpent(cur.timeSpent);
        const motifs = (Array.isArray(cur.motifs) && cur.motifs.length > 0)
          ? cur.motifs
          : (typeof detectTacticalMotifs === 'function'
              ? detectTacticalMotifs(cur.fenBefore, cur.fen, { color: cur.color }, cur.bestMoveUci, cur.pv, cur.mate, cur.classification, cur.ply)
              : []);

        stripEl.innerHTML = `
          <div class="d-flex align-items-center flex-wrap gap-1.5">
            <span class="badge border border-dark rounded-pill px-2.5 py-1 cursor-help" data-iq-tip="badge_${cur.classification}" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 900; font-size: 12px;">
              ${comic.symbol} ${comic.term}
            </span>
            <span class="font-monospace fw-black fs-5">${cur.san}</span>
            <span class="badge eval-chip-badge font-monospace fw-bold cursor-help" data-iq-tip="metric_eval_bar"><i class="bi bi-speedometer2 me-1"></i>${evalStr}</span>

            ${isSuboptimal && bestSan && bestSan !== cur.san ? `
              <span class="badge best-move-chip font-monospace fw-bold px-2 py-1 cursor-help" data-iq-tip="badge_best" title="Top Engine Move (Thick Arrow)">
                ★ Best: ${bestSan}
              </span>
            ` : ''}

            ${isSuboptimal && secondSan && secondSan !== cur.san && secondSan !== bestSan ? `
              <span class="badge second-move-chip font-monospace fw-bold px-2 py-1 cursor-help" data-iq-tip="badge_great" title="2nd Best Option (Thin Arrow)">
                2nd: ${secondSan}
              </span>
            ` : ''}

            ${motifs.map((m) => `
              <span class="motif-pill cursor-help" style="border-color: ${m.color}; color: ${m.color}; background: ${m.color}18;" data-iq-title="Tactical Motif: ${insEscape(m.label)}" data-iq-what="${insEscape(m.coachTip || m.label)}" data-iq-why="Tactical themes recur across games. Identifying motifs helps you execute combinations automatically." title="${insEscape(m.coachTip || m.label)}">
                ${m.icon} ${insEscape(m.label)}
              </span>
            `).join('')}

            ${clockStr ? `
              <span class="badge clock-discipline-badge font-monospace" title="Clock Remaining${spentStr ? ` (Spent ${spentStr})` : ''}">
                <i class="bi bi-stopwatch me-1"></i>${clockStr}${spentStr ? ` <span class="opacity-75">(-${spentStr})</span>` : ''}
              </span>
            ` : ''}

            ${cur.isImpulsive ? `
              <span class="badge impulsive-move-badge cursor-help" data-iq-tip="clock_discipline" title="Played in ${spentStr || '<2s'} with plenty of time on the clock">
                ⚡ Rushed (${spentStr || '<2s'})
              </span>
            ` : ''}

            ${cur.isTimeTrouble ? `
              <span class="badge time-trouble-badge cursor-help" data-iq-tip="clock_discipline" title="Played under severe time pressure (<20s left)">
                🔥 Time Trouble
              </span>
            ` : ''}
          </div>
          <div class="d-flex align-items-center gap-2">
            ${['inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(cur.classification) ? `
              <button type="button" class="btn btn-sm btn-outline-danger fw-bold comic-btn" id="btn-show-why" title="Explore what happens in the next 5 moves">
                <i class="bi bi-question-circle me-1"></i>Why?
              </button>
            ` : (cur.classification === 'brilliant' ? `
              <button type="button" class="btn btn-sm fw-bold comic-btn" id="btn-show-why" style="color: #06b6d4; border: 1px solid #06b6d4; background: rgba(6,182,212,0.08);" title="Explore why this brilliant sacrifice works">
                <i class="bi bi-gem me-1"></i>Why?
              </button>
            ` : '')}
          </div>
        `;
        stripEl.querySelector('#btn-show-why')?.addEventListener('click', () => this.openWhyModal());
      } else if (isBlindActive) {
        stripEl.innerHTML = `
          <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-warning text-dark border border-dark rounded-pill px-2.5 py-1 fw-black">🧠 Active Training</span>
              <span class="small fw-bold text-secondary">Move hidden — drag your chosen move directly on the board!</span>
            </div>
          </div>
        `;
      } else {
        const top = this.getTopMovesForFen(fen);
        const topSan = top?.best ? `${top.best.from}-${top.best.to}` : '';
        stripEl.innerHTML = `
          <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge bg-secondary text-white rounded-pill px-2.5 py-1 fw-bold">🏁 Start</span>
              <span class="small fw-bold text-secondary">Starting Position</span>
              ${topSan ? `
                <span class="badge best-move-chip font-monospace fw-bold px-2 py-1" title="Top Engine Opening Move">
                  ★ Best: ${topSan}
                </span>
              ` : ''}
            </div>
            <span class="small text-secondary"><i class="bi bi-hand-index-thumb me-1 text-warning"></i>Drag any piece on the board to explore "What-If" lines</span>
          </div>
        `;
      }
    }

    // Update Step Counter
    const counterEl = this.container.querySelector('#ply-counter');
    if (counterEl) {
      counterEl.textContent = `${this.currentPly} / ${this.game?.plies.length || 0}`;
    }

    // Update navigation buttons disabled state
    const isAtStart = this.currentPly === 0;
    const isAtEnd = !this.game || this.currentPly >= (this.game.plies?.length || 0);

    const btnFirst = this.container.querySelector('#btn-first');
    const btnPrev = this.container.querySelector('#btn-prev');
    const btnNext = this.container.querySelector('#btn-next');
    const btnLast = this.container.querySelector('#btn-last');

    if (btnFirst) btnFirst.disabled = isAtStart;
    if (btnPrev) btnPrev.disabled = isAtStart;
    if (btnNext) btnNext.disabled = isAtEnd;
    if (btnLast) btnLast.disabled = isAtEnd;

    // Update Active Row in Move Table (scroll smoothly inside container if visible)
    const scrollContainer = this.container.querySelector('.move-history-container');
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      const plyNum = parseInt(row.dataset.ply, 10);
      if (plyNum === this.currentPly) {
        row.classList.add('bg-warning-subtle', 'fw-black', 'border', 'border-warning');
        if (scrollContainer && scrollContainer.clientHeight > 0) {
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

    // Vision X-Ray active toggle visuals
    this.container.querySelectorAll('[data-vision-toggle]').forEach((btn) => {
      const mode = btn.getAttribute('data-vision-toggle');
      if (mode === 'loose') {
        btn.classList.toggle('active', Boolean(this.showLoosePieces));
      } else {
        btn.classList.toggle('active', this.visionOverlay === mode);
      }
    });
  }

  updateModeBanner(cur) {
    const bannerEl = this.container.querySelector('#pv-banner-area');
    if (!bannerEl) return;

    if (this.retryPuzzleState?.active) {
      const st = this.retryPuzzleState;
      const target = st.mistakes[st.currentIndex];
      const total = st.mistakes.length;
      const idx = st.currentIndex;

      let statusAlert = '';
      if (st.solved) {
        statusAlert = `
          <div class="alert alert-success py-1.5 px-2.5 mb-0 mt-2 d-flex align-items-center justify-content-between small fw-bold">
            <span>${insEscape(st.message || 'Correct move!')}</span>
            <div class="d-flex align-items-center gap-1.5">
              ${idx + 1 < total ? `
                <button type="button" class="btn btn-xs btn-success comic-btn fw-black py-0.5 px-2" id="btn-puzzle-next">
                  Next Mistake <i class="bi bi-arrow-right ms-1"></i>
                </button>
              ` : `
                <button type="button" class="btn btn-xs btn-dark comic-btn fw-black py-0.5 px-2" id="btn-puzzle-finish">
                  Done <i class="bi bi-trophy-fill ms-1 text-warning"></i>
                </button>
              `}
            </div>
          </div>
        `;
      } else if (st.isError) {
        statusAlert = `
          <div class="alert alert-danger py-1.5 px-2.5 mb-0 mt-2 d-flex align-items-center justify-content-between small fw-bold">
            <span>${insEscape(st.message || 'Try another move!')}</span>
          </div>
        `;
      } else if (st.message) {
        statusAlert = `<div class="small fw-semibold text-secondary mt-1">${insEscape(st.message)}</div>`;
      }

      bannerEl.classList.remove('d-none');
      bannerEl.innerHTML = `
        <div class="comic-card-sm p-2.5 mb-2 border-2 border-warning" style="background: rgba(245, 158, 11, 0.1);">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-warning text-dark border border-dark fw-black">🎯 RETRY MISTAKE ${idx + 1} / ${total}</span>
              ${typeof renderInfoIcon === 'function' ? renderInfoIcon('ctrl_retry_mistakes') : ''}
              <span class="small fw-bold">Move ${Math.ceil((target?.ply || 1) / 2)}: You played <span class="text-danger font-monospace fw-black">${insEscape(target?.san || '?')}</span></span>
            </div>
            <div class="d-flex align-items-center gap-1.5">
              <button type="button" class="btn btn-sm btn-outline-warning comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-hint" style="font-size: 11px;">
                <i class="bi bi-lightbulb-fill me-1"></i>Hint
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-solution" style="font-size: 11px;">
                <i class="bi bi-eye-fill me-1"></i>Solution
              </button>
              <button type="button" class="btn btn-sm btn-dark comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-exit" title="Exit Workout" aria-label="Exit Workout" style="font-size: 11px;">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          ${statusAlert}
        </div>
      `;

      bannerEl.querySelector('#btn-puzzle-hint')?.addEventListener('click', () => this.showPuzzleHint());
      bannerEl.querySelector('#btn-puzzle-solution')?.addEventListener('click', () => this.revealPuzzleSolution());
      bannerEl.querySelector('#btn-puzzle-exit')?.addEventListener('click', () => this.exitSpecialMode());
      bannerEl.querySelector('#btn-puzzle-next')?.addEventListener('click', () => this.loadMistakeAtIndex(idx + 1));
      bannerEl.querySelector('#btn-puzzle-finish')?.addEventListener('click', () => this.exitSpecialMode());
      return;
    }

    if (this.guessMoveState?.active) {
      const gm = this.guessMoveState;
      const total = gm.turns.length;
      const idx = gm.currentIndex;

      bannerEl.classList.remove('d-none');
      bannerEl.innerHTML = `
        <div class="comic-card-sm p-2.5 mb-2 border-2 border-primary" style="background: rgba(59, 130, 246, 0.1);">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-primary text-white border border-dark fw-black">🤔 GUESS THE MOVE ${idx + 1} / ${total}</span>
              <span class="badge bg-warning text-dark font-monospace fw-bold">Score: ${gm.score} / ${gm.maxScore}</span>
              ${gm.grade ? `<span class="badge ${gm.isError ? 'bg-danger' : 'bg-success'} fw-black">${gm.grade}</span>` : ''}
            </div>
            <div class="d-flex align-items-center gap-1.5">
              ${gm.answered && idx + 1 < total ? `
                <button type="button" class="btn btn-sm btn-primary comic-btn py-0.5 px-2.5 fw-black" id="btn-guess-next" style="font-size: 11px;">
                  Next Turn <i class="bi bi-arrow-right ms-1"></i>
                </button>
              ` : ''}
              <button type="button" class="btn btn-sm btn-dark comic-btn py-0.5 px-2 fw-bold" id="btn-guess-exit" style="font-size: 11px;">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          <div class="small fw-bold mt-1.5 ${gm.isError ? 'text-danger' : (gm.answered ? 'text-success' : 'text-body')}">
            ${insEscape(gm.message)}
          </div>
        </div>
      `;
      bannerEl.querySelector('#btn-guess-next')?.addEventListener('click', () => this.loadGuessTurnAtIndex(idx + 1));
      bannerEl.querySelector('#btn-guess-exit')?.addEventListener('click', () => this.exitSpecialMode());
      return;
    }

    if (this.sandboxState) {
      const sb = this.sandboxState;
      const movesArr = sb.moveHistorySan || sb.moves || [];
      const movesStr = movesArr.join(' → ');
      let evalBadge = '';
      if (sb.isEvaluating || sb.evaluating) {
        evalBadge = `<span class="badge bg-secondary font-monospace"><span class="spinner-border spinner-border-sm me-1" style="width: 10px; height: 10px;"></span>Stockfish thinking...</span>`;
      } else if (sb.evalResult) {
        const cp = (sb.evalResult.scoreCp || 0) / 100;
        const cpStr = sb.evalResult.mate !== null && sb.evalResult.mate !== undefined
          ? `M${Math.abs(sb.evalResult.mate)}`
          : (cp > 0 ? `+${cp.toFixed(1)}` : cp.toFixed(1));
        const bestSan = sb.evalResult.bestMoveSan ? ` · Best next: ${sb.evalResult.bestMoveSan}` : '';
        evalBadge = `<span class="badge bg-info text-dark border border-dark font-monospace fw-bold">Eval: ${cpStr}${insEscape(bestSan)}</span>`;
      }

      bannerEl.classList.remove('d-none');
      bannerEl.innerHTML = `
        <div class="comic-card-sm p-2.5 mb-2 border-2 border-info" style="background: rgba(6, 182, 212, 0.1);">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge bg-info text-dark border border-dark fw-black"><i class="bi bi-compass-fill me-1"></i>WHAT-IF SANDBOX</span>
              <span class="small font-monospace fw-bold">${insEscape(movesStr)}</span>
              ${evalBadge}
            </div>
            <div class="d-flex align-items-center gap-1.5">
              <button type="button" class="btn btn-sm btn-warning comic-btn py-0.5 px-2.5 fw-black" id="btn-sandbox-reset" style="font-size: 11px;">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Return to Game
              </button>
            </div>
          </div>
        </div>
      `;
      bannerEl.querySelector('#btn-sandbox-reset')?.addEventListener('click', () => this.exitSpecialMode());
      return;
    }

    bannerEl.classList.add('d-none');
    bannerEl.innerHTML = '';
  }

  buildPositionalPillarsHtml(fen) {
    if (typeof computePositionalPillars !== 'function' || !fen) return '';
    const p = computePositionalPillars(fen);
    const items = [
      { key: 'material', icon: '⚖️', title: 'Material', tipKey: 'pillar_material', data: p.material },
      { key: 'activity', icon: '⚡', title: 'Piece Activity', tipKey: 'pillar_activity', data: p.activity },
      { key: 'kingSafety', icon: '🛡️', title: 'King Safety', tipKey: 'pillar_king_safety', data: p.kingSafety },
      { key: 'pawnStructure', icon: '♟️', title: 'Pawn Structure', tipKey: 'pillar_pawn_structure', data: p.pawnStructure }
    ];

    return `
      <div class="d-flex align-items-center justify-content-between mb-1.5 px-1">
        <div class="d-flex align-items-center gap-1.5">
          <span class="small fw-black text-uppercase" style="font-size: 10px; letter-spacing: 0.5px;">
            <i class="bi bi-sliders me-1 text-info"></i>4-Pillar Positional X-Ray
          </span>
          <button type="button" class="btn btn-sm btn-link p-0 text-info fw-bold text-decoration-none d-inline-flex align-items-center gap-1" id="btn-pillars-guide" data-iq-tip="card_positional_pillars" title="Learn what these bars mean and how they are calculated">
            <i class="bi bi-info-circle-fill" style="font-size: 11px;"></i>
            <span class="d-none d-sm-inline" style="font-size: 10px; opacity: 0.9;">How it works</span>
          </button>
        </div>
        <span class="text-secondary font-monospace" style="font-size: 10px;">⚪ White vs ⚫ Black</span>
      </div>
      <div class="row g-1.5">
        ${items.map((it) => `
          <div class="col-6">
            <div class="p-1.5 rounded positional-pillar-card" data-iq-tip="${it.tipKey}" data-pillar-key="${it.key}" title="Click to view full calculation guide" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
              <div class="d-flex align-items-center justify-content-between mb-1" style="font-size: 10px;">
                <span class="fw-bold d-flex align-items-center gap-1">
                  <span>${it.icon}</span>
                  <span class="text-truncate" style="max-width: 82px;">${it.title}</span>
                  <i class="bi bi-question-circle text-secondary opacity-50" style="font-size: 9px;"></i>
                </span>
                <span class="font-monospace text-secondary fw-semibold">${insEscape(it.data.label)}</span>
              </div>
              <div class="positional-pillar-track" title="White: ${it.data.white}% vs Black: ${it.data.black}%">
                <div class="positional-pillar-white" style="width: ${it.data.white}%;"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  bindPositionalPillarsEvents(el) {
    if (!el) return;
    el.querySelector('#btn-pillars-guide')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openPillarsGuideModal();
    });

    el.querySelectorAll('.positional-pillar-card').forEach((card) => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-pillar-key');
        this.openPillarsGuideModal(key);
      });
    });
  }

  updatePositionalPillars(fen) {
    const el = this.container.querySelector('#positional-pillars-area');
    if (!el || typeof computePositionalPillars !== 'function') return;
    this.lastRenderedFen = fen;
    el.innerHTML = this.buildPositionalPillarsHtml(fen);
    this.bindPositionalPillarsEvents(el);
  }

  openPillarsGuideModal(activeKey = null) {
    const existing = document.getElementById('positional-pillars-modal');
    if (existing) existing.remove();

    const fen = this.lastRenderedFen || (this.board ? this.board.fen : null);
    const p = typeof computePositionalPillars === 'function' && fen ? computePositionalPillars(fen) : null;
    const curMove = this.game && this.currentPly > 0 ? this.game.moves[this.currentPly - 1] : null;
    const moveInfo = curMove ? `Move ${Math.ceil(this.currentPly / 2)}${curMove.color === 'b' ? '...' : '.'} ${curMove.san}` : 'Current Position';

    const modal = document.createElement('div');
    modal.className = 'why-modal-backdrop';
    modal.id = 'positional-pillars-modal';

    const pillars = [
      {
        key: 'activity',
        icon: '⚡',
        title: 'Piece Activity & Board Control',
        badge: 'DYNAMIC MOBILITY',
        badgeClass: 'bg-warning text-dark',
        summary: 'Measures how actively pieces are deployed across the chessboard and how much territory they dominate.',
        why: 'Pieces stuck on back ranks or corners have low mobility. Active pieces control key squares, restrict enemy pieces to passive defense, and create unstoppable tactical combinations.',
        liveData: p?.activity,
        calculation: [
          {
            label: 'Square Influence Count',
            text: 'Counts the total number of squares currently attacked, protected, or reachable by each side\'s pieces across all 64 squares.'
          },
          {
            label: '1.5× Center Dominance Multiplier',
            text: 'Squares located in the central 4×4 box (c3–f6, including d4, e4, d5, e5) receive a 1.5× multiplier bonus. Central real estate is strategically paramount because pieces in the center can swiftly pivot to either wing.'
          },
          {
            label: 'Tug-of-War Balance Ratio',
            text: 'Calculates the difference between White\'s weighted square attacks and Black\'s, converting it into a 0–100% comparative split (scaled with a 0.85 factor centered at 50%).'
          }
        ],
        tip: 'Develop knights toward the center (e.g. Nf3/Nc3, not Nh3/Na3) and open diagonal highways for your bishops early in the opening.'
      },
      {
        key: 'kingSafety',
        icon: '🛡️',
        title: 'King Safety & Shelter',
        badge: 'ATTACK ZONE SECURITY',
        badgeClass: 'bg-danger text-white',
        summary: 'Evaluates the defensive resilience of each king against opponent tactical invasions, checks, and mating nets.',
        why: 'King safety supersedes all other advantages. Even if you are up a queen in material, having an exposed king will lead to checkmate or devastating double attacks.',
        liveData: p?.kingSafety,
        calculation: [
          {
            label: 'Baseline Fortress Score (78 pts)',
            text: 'Both kings begin with a baseline safety score of 78 points.'
          },
          {
            label: '+12 Points Castled Bonus',
            text: 'Kings castled behind a pawn wall to the safety of the corners (g1 or c1 for White, g8 or c8 for Black) receive a +12 point castle bonus.'
          },
          {
            label: '−9 Points per King Ring Attacker',
            text: 'Evaluates the 3×3 "King Ring" (the king\'s square and all 8 surrounding neighbor squares). Every enemy piece exerting an attack on any square in this ring subtracts 9 points from the king\'s safety score.'
          },
          {
            label: 'Score Clamping & Tug-of-War',
            text: 'Raw safety scores are clamped between 10 (mating danger) and 98 (impenetrable fortress). The relative difference is mapped onto the 0–100% White vs Black balance bar.'
          }
        ],
        tip: 'Castle within the first 10 moves. Never advance pawns directly in front of your castled king unless forced, as pawn moves create permanent holes.'
      },
      {
        key: 'material',
        icon: '⚖️',
        title: 'Material Balance',
        badge: 'PIECE VALUE COUNT',
        badgeClass: 'bg-primary text-white',
        summary: 'The total fighting force and piece point valuation remaining on the board.',
        why: 'Material superiority is the most reliable path to victory. Being ahead in material lets you force piece simplifications into an easily winning endgame.',
        liveData: p?.material,
        calculation: [
          {
            label: 'Standard Piece Values',
            text: 'Pawn = 1.0 · Knight = 3.0 · Bishop = 3.15 · Rook = 5.0 · Queen = 9.0 points.'
          },
          {
            label: '+0.5 Bishop Pair Bonus',
            text: 'Holding both light- and dark-squared bishops grants an extra +0.5 point bonus for long-range complementary diagonal control.'
          },
          {
            label: 'Advantage Bar',
            text: 'The net difference between White and Black material is scaled into the balance percentage and displayed with the exact point lead (e.g., White +2).'
          }
        ],
        tip: 'When ahead in material, trade pieces (queens, rooks, minor pieces) to extinguish counterplay, but keep pawns on the board to promote.'
      },
      {
        key: 'pawnStructure',
        icon: '♟️',
        title: 'Pawn Structure Health',
        badge: 'CHAIN INTEGRITY',
        badgeClass: 'bg-secondary text-white',
        summary: 'Analyzes the compactness, cohesion, and vulnerability of the pawn skeleton.',
        why: 'Pawns can never move backwards. Every pawn weakness—such as doubled or isolated pawns—remains a permanent target for enemy rooks and knights to exploit.',
        liveData: p?.pawnStructure,
        calculation: [
          {
            label: '−12 Points Doubled Pawns Penalty',
            text: 'Deducts 12 points for each additional pawn stacked vertically on the same column (file). Stacked pawns block each other\'s movement and cannot defend one another.'
          },
          {
            label: '−8 Points Isolated Pawns Penalty',
            text: 'Deducts 8 points for any pawn with zero friendly pawns on adjacent files. Isolated pawns require babysitting by heavy pieces and cannot be defended by fellow pawns.'
          },
          {
            label: 'Comparative Cleanliness',
            text: 'The structural health scores of both sides are balanced against each other to compute the percentage bar (e.g., White Cleaner).'
          }
        ],
        tip: 'Keep your pawn chains connected. Avoid creating doubled or isolated pawns unless you get open files or active attacking piece play in return.'
      }
    ];

    modal.innerHTML = `
      <div class="why-dialog p-3 p-md-4 shadow-lg" style="max-width: 760px; width: 100%; border-radius: 1.25rem; background: var(--arcade-card); border: 1.5px solid var(--arcade-border);">
        <!-- Modal Header -->
        <div class="d-flex align-items-center justify-content-between pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-info text-dark border border-dark px-2.5 py-1.5 fw-black">
              <i class="bi bi-sliders me-1"></i>4-PILLAR POSITIONAL X-RAY
            </span>
            <span class="text-secondary small fw-bold d-none d-sm-inline">How Metrics Are Calculated</span>
          </div>
          <button type="button" class="btn-close" id="pillars-modal-close" aria-label="Close"></button>
        </div>

        <!-- Tug of War Visual Guide Box -->
        <div class="p-3 rounded mb-3" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
          <div class="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-1">
            <span class="fw-bold small d-flex align-items-center gap-1.5">
              <i class="bi bi-info-circle-fill text-info"></i>
              How the Tug-of-War Balance Bars Work
            </span>
            ${p ? `<span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">${insEscape(moveInfo)}</span>` : ''}
          </div>
          <p class="small text-secondary mb-2" style="font-size: 11.5px; line-height: 1.45;">
            Each bar measures the real-time strategic balance between <strong>⚪ White</strong> and <strong>⚫ Black</strong>:
          </p>
          <div class="positional-pillar-track mb-1.5" style="height: 10px;">
            <div class="positional-pillar-white" style="width: 50%;"></div>
          </div>
          <div class="d-flex justify-content-between font-monospace text-secondary" style="font-size: 10.5px;">
            <span>⚪ 0% (Black Dominates)</span>
            <span class="fw-bold text-body">50% (Equal / Balanced)</span>
            <span>(White Dominates) 100% ⚫</span>
          </div>
        </div>

        <!-- Pillar Detailed Cards List -->
        <div class="d-flex flex-column gap-3" id="pillars-list-container">
          ${pillars.map((pil) => {
            const isTarget = activeKey === pil.key;
            return `
              <div class="p-3 rounded ${isTarget ? 'pillar-guide-highlight' : ''}" id="pillar-card-${pil.key}" style="background: var(--arcade-card); border: 1.5px solid ${isTarget ? '#38bdf8' : 'var(--arcade-border)'}; transition: border-color 0.2s ease, box-shadow 0.2s ease;">
                <!-- Pillar Header Row -->
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
                  <div class="d-flex align-items-center gap-2">
                    <span class="fs-5">${pil.icon}</span>
                    <h6 class="fw-black mb-0 text-body" style="font-size: 14px;">${insEscape(pil.title)}</h6>
                    <span class="badge ${pil.badgeClass} font-monospace" style="font-size: 9px;">${insEscape(pil.badge)}</span>
                  </div>
                  ${pil.liveData ? `
                    <div class="d-flex align-items-center gap-1.5 font-monospace small">
                      <span class="text-secondary" style="font-size: 11px;">Current:</span>
                      <span class="badge bg-secondary-subtle text-body border border-secondary-subtle fw-bold" style="font-size: 11px;">
                        ${insEscape(pil.liveData.label)} (${pil.liveData.white}% White)
                      </span>
                    </div>
                  ` : ''}
                </div>

                <!-- What & Why Summary -->
                <div class="mb-2.5">
                  <div class="small mb-1 text-body" style="font-size: 12px; line-height: 1.45;">
                    <strong class="text-warning">What it means:</strong> ${insEscape(pil.summary)}
                  </div>
                  <div class="small text-secondary" style="font-size: 11.5px; line-height: 1.4;">
                    <strong class="text-info">Strategic Importance:</strong> ${insEscape(pil.why)}
                  </div>
                </div>

                <!-- How it is Calculated Details -->
                <div class="p-2.5 rounded mb-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.02)); border: 1px solid var(--arcade-border);">
                  <div class="small fw-bold text-success mb-1.5 d-flex align-items-center gap-1" style="font-size: 11px;">
                    <i class="bi bi-calculator-fill"></i>
                    <span>HOW IT IS CALCULATED:</span>
                  </div>
                  <ul class="list-unstyled mb-0 d-flex flex-column gap-1.5" style="font-size: 11px; line-height: 1.4;">
                    ${pil.calculation.map((c) => `
                      <li class="d-flex align-items-start gap-1.5">
                        <i class="bi bi-check-circle-fill text-success mt-0.5" style="font-size: 10px; flex-shrink: 0;"></i>
                        <div>
                          <strong>${insEscape(c.label)}:</strong>
                          <span class="text-secondary">${insEscape(c.text)}</span>
                        </div>
                      </li>
                    `).join('')}
                  </ul>
                </div>

                <!-- Pro Tip -->
                <div class="small text-body-secondary d-flex align-items-center gap-1.5 pt-1 font-italic" style="font-size: 11px;">
                  <i class="bi bi-lightbulb-fill text-warning flex-shrink-0"></i>
                  <span><strong>Coach Tip:</strong> ${insEscape(pil.tip)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer -->
        <div class="pt-3 mt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2" style="border-color: var(--arcade-border) !important;">
          <span class="small text-secondary" style="font-size: 11px;">
            <i class="bi bi-cpu me-1 text-info"></i>Evaluated via hybrid attack maps & Stockfish positional heuristics.
          </span>
          <button type="button" class="btn btn-sm btn-outline-secondary comic-btn px-4 fw-bold" id="pillars-modal-ok-btn">
            Got It
          </button>
        </div>
      </div>
    `;

    const closeModal = () => {
      modal.remove();
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };

    const dialogEl = modal.querySelector('.why-dialog');
    const safeClose = typeof setupModalSwipeAndHistory === 'function'
      ? setupModalSwipeAndHistory(modal, dialogEl, closeModal)
      : closeModal;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        safeClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    modal.querySelector('#pillars-modal-close')?.addEventListener('click', safeClose);
    modal.querySelector('#pillars-modal-ok-btn')?.addEventListener('click', safeClose);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        safeClose();
      }
    });

    document.body.classList.add('modal-open');
    document.body.appendChild(modal);

    if (activeKey) {
      setTimeout(() => {
        modal.querySelector(`#pillar-card-${activeKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  }

  buildCoachStudyPlanCard() {
    if (!this.game) return '';
    const summary = this.game.gameCoachSummary || {};
    const mistakes = this.getUserMistakePlies();
    const bankStats = typeof getBlunderBankStats === 'function' ? getBlunderBankStats() : { total: 0, due: 0 };

    // Determine #1 Priority Coaching Focus
    let priorityTitle = 'Solid Positional Consistency';
    let priorityDesc = 'You played a clean game with very few tactical oversights. Use Guess-the-Move mode to test your grandmaster calculation!';
    let priorityIcon = '🏆';

    if (summary.topMotifId && typeof TACTICAL_MOTIF_CATALOG !== 'undefined' && TACTICAL_MOTIF_CATALOG[summary.topMotifId]) {
      const cat = TACTICAL_MOTIF_CATALOG[summary.topMotifId];
      priorityIcon = cat.icon;
      priorityTitle = `Pattern Alert: ${cat.label} (${summary.topMotifCount}× in this game)`;
      priorityDesc = cat.coachTip;
    } else if ((this.game.impulsiveBlunders || 0) >= 1) {
      priorityIcon = '⚡';
      priorityTitle = `Clock Discipline: ${this.game.impulsiveBlunders} Rushed Mistake${this.game.impulsiveBlunders > 1 ? 's' : ''}`;
      priorityDesc = 'You played critical mistakes in under 2 seconds despite having plenty of clock time. Sit on your hands for 5 seconds before capturing or responding to threats!';
    } else if (summary.weakestPhase && summary.weakestPhaseAcc < 78) {
      priorityIcon = '📉';
      const phCap = summary.weakestPhase.charAt(0).toUpperCase() + summary.weakestPhase.slice(1);
      priorityTitle = `${phCap} Precision (${summary.weakestPhaseAcc}% Accuracy)`;
      priorityDesc = `Your accuracy dipped most during the ${summary.weakestPhase}. Practice playing from the critical ${summary.weakestPhase} transition against an Elo-matched bot!`;
    } else if (mistakes.length > 0) {
      priorityIcon = '🎯';
      priorityTitle = `Tactical Calculation (${mistakes.length} Key Error${mistakes.length > 1 ? 's' : ''})`;
      priorityDesc = 'Re-play your mistakes on the board right now to build muscle memory for the correct tactical continuation.';
    }

    const bright = summary.brightestMove;
    const practicePly = summary.practicePly || this.game.turningPoint?.ply || 1;

    return `
      <div class="comic-card p-3 coach-plan-card">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-warning text-dark border border-dark fw-black px-2 py-1" style="font-size: 11px;">
              🎓 COACH'S STUDY PLAN
            </span>
            <span class="small fw-bold text-secondary">Personalized Takeaways & Active Drills</span>
            ${typeof renderInfoIcon === 'function' ? renderInfoIcon('card_coach_study_plan') : ''}
          </div>
          ${bright ? `
            <button type="button" class="btn btn-xs btn-outline-info comic-btn fw-bold py-0.5 px-2" data-callout-ply="${bright.ply}" title="Jump to your highest-rated move">
              ✨ Best Moment: Move ${Math.ceil(bright.ply / 2)} (${insEscape(bright.san)})
            </button>
          ` : ''}
        </div>

        <div class="d-flex align-items-start gap-2.5 mb-2.5">
          <div class="fs-4 lh-1 mt-0.5">${priorityIcon}</div>
          <div class="flex-grow-1">
            <div class="fw-black small text-warning">${insEscape(priorityTitle)}</div>
            <div class="text-secondary small" style="font-size: 12px;">${insEscape(priorityDesc)}</div>
          </div>
        </div>

        <div class="d-flex align-items-center flex-wrap gap-2 pt-1">
          <button type="button" class="btn btn-sm btn-primary comic-btn fw-black py-1 px-2.5 flex-grow-1" id="btn-coach-guess-move" style="font-size: 11px;">
            <i class="bi bi-question-diamond-fill me-1"></i>Guess the Move Mode
          </button>
          <button type="button" class="btn btn-sm btn-warning text-dark comic-btn fw-black py-1 px-2.5 flex-grow-1" id="btn-coach-blunder-bank" style="font-size: 11px;">
            <i class="bi bi-bank2 me-1"></i>Blunder Bank (${bankStats.total})
          </button>
        </div>
      </div>
    `;
  }

  openBlunderBankModal(initialFilter = 'all') {
    const existing = document.getElementById('blunder-bank-modal');
    if (existing) existing.remove();

    let currentFilter = initialFilter;
    let puzzles = typeof getBlunderBankPuzzles === 'function' ? getBlunderBankPuzzles(currentFilter) : [];
    let currentIdx = 0;
    let solved = false;
    let feedback = '';
    let isErr = false;
    let modalBoard = null;

    const modal = document.createElement('div');
    modal.className = 'why-modal-backdrop';
    modal.id = 'blunder-bank-modal';

    const renderModalContent = () => {
      const stats = typeof getBlunderBankStats === 'function' ? getBlunderBankStats() : { total: 0, mastered: 0, due: 0, motifCounts: {} };
      puzzles = typeof getBlunderBankPuzzles === 'function' ? getBlunderBankPuzzles(currentFilter) : [];
      if (currentIdx >= puzzles.length) currentIdx = 0;
      const curPuzzle = puzzles[currentIdx] || null;

      const motifFilters = [
        { id: 'all', label: `All (${stats.total})` },
        { id: 'unmastered', label: `Due (${stats.due})` },
        ...Object.entries(stats.motifCounts || {}).map(([mId, cnt]) => {
          const cat = (typeof TACTICAL_MOTIF_CATALOG !== 'undefined' && TACTICAL_MOTIF_CATALOG[mId]) || { icon: '⚡', label: mId };
          return { id: mId, label: `${cat.icon} ${cat.label} (${cnt})` };
        })
      ];

      modal.innerHTML = `
        <div class="why-dialog p-3 p-md-4 shadow-lg" style="max-width: 780px; width: 100%; border-radius: 1.25rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);">
          <div class="d-flex align-items-center justify-content-between pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-warning text-dark border border-dark px-2.5 py-1.5 fw-black">🧠 PERSONAL BLUNDER BANK</span>
              <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace fw-bold">
                Mastered: ${stats.mastered} / ${stats.total}
              </span>
            </div>
            <button type="button" class="btn-close" id="bb-btn-close" aria-label="Close"></button>
          </div>

          <div class="d-flex align-items-center flex-wrap gap-1.5 mb-3">
            ${motifFilters.map((f) => `
              <button type="button" class="btn btn-xs move-filter-pill ${currentFilter === f.id ? 'active' : ''}" data-bb-filter="${f.id}">
                ${f.label}
              </button>
            `).join('')}
          </div>

          ${!curPuzzle ? `
            <div class="text-center py-5 text-secondary">
              <div class="fs-1 mb-2">🎉</div>
              <h6 class="fw-black text-body">No Puzzles in This Filter!</h6>
              <p class="small mb-0">Analyze games to automatically populate your personal Blunder Bank with mistakes from your own matches.</p>
            </div>
          ` : `
            <div class="row g-3 align-items-stretch">
              <div class="col-12 col-md-7 d-flex justify-content-center">
                <div id="bb-modal-board" style="width: 100%; max-width: 360px; aspect-ratio: 1/1;"></div>
              </div>
              <div class="col-12 col-md-5 d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="badge bg-secondary font-monospace">Puzzle ${currentIdx + 1} of ${puzzles.length}</span>
                    <div class="d-flex align-items-center gap-1.5">
                      ${curPuzzle.mastered ? `<span class="badge bg-success"><i class="bi bi-check2-all me-1"></i>Mastered</span>` : `<span class="badge bg-warning text-dark">Needs Practice</span>`}
                      <button type="button" class="btn btn-outline-danger btn-sm p-1 py-0.5 comic-btn" id="bb-btn-delete-puzzle" title="Remove this move/puzzle from Blunder Bank" style="font-size: 11px;">
                        <i class="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                  <div class="p-2.5 rounded mb-2" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
                    <div class="small fw-bold mb-1">${insEscape(curPuzzle.white)} vs ${insEscape(curPuzzle.black)}</div>
                    <div class="text-secondary small" style="font-size: 11px;">
                      Move ${Math.ceil((curPuzzle.ply || 1) / 2)} · In the game you played <span class="text-danger font-monospace fw-black">${insEscape(curPuzzle.playedSan)}</span> (${insEscape(curPuzzle.classification)})
                    </div>
                  </div>
                  <div class="alert ${solved ? 'alert-success' : (isErr ? 'alert-danger' : 'alert-warning')} py-2 px-2.5 small fw-bold mb-2">
                    ${insEscape(feedback || `Playing as ${curPuzzle.userColor === 'w' ? 'White' : 'Black'}: Find the best move on the board!`)}
                  </div>
                </div>

                <div class="d-flex flex-column gap-2">
                  <div class="d-flex align-items-center gap-1.5">
                    <button type="button" class="btn btn-sm btn-outline-warning comic-btn flex-grow-1 fw-bold" id="bb-btn-hint">
                      <i class="bi bi-lightbulb-fill me-1"></i>Hint
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary comic-btn flex-grow-1 fw-bold" id="bb-btn-solution">
                      <i class="bi bi-eye-fill me-1"></i>Solution
                    </button>
                  </div>
                  <div class="d-flex align-items-center justify-content-between gap-2">
                    <button type="button" class="btn btn-sm btn-light comic-btn px-3 fw-bold" id="bb-btn-prev" ${puzzles.length <= 1 ? 'disabled' : ''}>
                      <i class="bi bi-chevron-left me-1"></i>Prev
                    </button>
                    <button type="button" class="btn btn-sm btn-warning text-dark comic-btn flex-grow-1 fw-black" id="bb-btn-next" ${puzzles.length <= 1 ? 'disabled' : ''}>
                      Next Puzzle <i class="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `}
        </div>
      `;

      modal.querySelector('#bb-btn-close')?.addEventListener('click', () => modal.remove());
      modal.querySelectorAll('[data-bb-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          currentFilter = btn.getAttribute('data-bb-filter') || 'all';
          currentIdx = 0;
          solved = false;
          feedback = '';
          isErr = false;
          renderModalContent();
        });
      });

      if (curPuzzle) {
        const mount = modal.querySelector('#bb-modal-board');
        const bestMoveArrow = solved && curPuzzle.bestMoveUci && curPuzzle.bestMoveUci.length >= 4
          ? { from: curPuzzle.bestMoveUci.slice(0, 2), to: curPuzzle.bestMoveUci.slice(2, 4) }
          : null;

        modalBoard = new Chessboard(mount, {
          fen: curPuzzle.fenBefore,
          orientation: curPuzzle.userColor || 'w',
          theme: this.theme,
          interactive: !solved,
          bestMove: bestMoveArrow,
          showPlayerBars: false,
          legalMovesFrom: (sq) => {
            try {
              const c = new Chess(curPuzzle.fenBefore);
              return c.moves({ square: sq, verbose: true }).map((m) => m.to);
            } catch {
              return [];
            }
          },
          onMove: (from, to) => {
            try {
              const c = new Chess(curPuzzle.fenBefore);
              const m = c.move({ from, to, promotion: 'q' });
              if (!m) return;
              const uci = `${m.from}${m.to}`.toLowerCase();
              const targetPrefix = (curPuzzle.bestMoveUci || '').slice(0, 4).toLowerCase();
              if (uci === targetPrefix || m.san === curPuzzle.bestMoveSan) {
                solved = true;
                isErr = false;
                feedback = `✅ Mastered! ${m.san} is the top move.`;
                if (typeof recordBlunderBankAttempt === 'function') recordBlunderBankAttempt(curPuzzle.id, true);
                soundService.playBrilliant();
              } else {
                isErr = true;
                feedback = `❌ ${m.san} is not the best move — try again!`;
                if (typeof recordBlunderBankAttempt === 'function') recordBlunderBankAttempt(curPuzzle.id, false);
                soundService.playBlunder();
              }
              renderModalContent();
            } catch {}
          }
        });

        modal.querySelector('#bb-btn-delete-puzzle')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (curPuzzle && typeof removeBlunderBankItem === 'function') {
            removeBlunderBankItem(curPuzzle.id);
            feedback = 'Puzzle removed from your Blunder Bank.';
            solved = false;
            isErr = false;
            renderModalContent();
          }
        });

        modal.querySelector('#bb-btn-hint')?.addEventListener('click', () => {
          const fromSq = (curPuzzle.bestMoveUci || '').slice(0, 2);
          if (fromSq && modalBoard) {
            modalBoard.userHighlights.clear();
            modalBoard.userHighlights.add(fromSq);
            modalBoard.render();
            feedback = `💡 Hint: Move the piece on ${fromSq.toUpperCase()}!`;
            isErr = false;
          }
        });

        modal.querySelector('#bb-btn-solution')?.addEventListener('click', () => {
          solved = true;
          isErr = false;
          feedback = `👁 Solution: ${curPuzzle.bestMoveSan} was the best move.`;
          renderModalContent();
        });

        modal.querySelector('#bb-btn-prev')?.addEventListener('click', () => {
          currentIdx = (currentIdx - 1 + puzzles.length) % puzzles.length;
          solved = false;
          feedback = '';
          isErr = false;
          renderModalContent();
        });

        modal.querySelector('#bb-btn-next')?.addEventListener('click', () => {
          currentIdx = (currentIdx + 1) % puzzles.length;
          solved = false;
          feedback = '';
          isErr = false;
          renderModalContent();
        });
      }
    };

    const closeBlunderBank = () => {
      modal.remove();
      document.body.classList.remove('modal-open');
    };

    const dialogEl = modal.querySelector('.why-dialog');
    const safeClose = typeof setupModalSwipeAndHistory === 'function'
      ? setupModalSwipeAndHistory(modal, dialogEl, closeBlunderBank)
      : closeBlunderBank;

    modal.querySelector('#bb-btn-close')?.addEventListener('click', safeClose);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) safeClose();
    });

    document.body.classList.add('modal-open');
    document.body.appendChild(modal);
    renderModalContent();
  }

  buildCoachingCallouts() {
    if (!this.game) return '';
    const tp = this.game.turningPoint;
    const od = this.game.openingDeviation;
    if (!tp && !od) return '';

    const cards = [];

    if (tp) {
      const moveNum = Math.ceil(tp.ply / 2);
      const moveDots = tp.color === 'b' ? '...' : '.';
      const beforePct = Math.round((tp.prevWinProb ?? 0.5) * 100);
      const afterPct = Math.round((tp.winProb ?? 0.5) * 100);
      cards.push(`
        <div class="col-12 ${od ? 'col-md-6' : ''}">
          <div class="comic-card p-2.5 h-100 coaching-callout-card border-start border-4 border-danger cursor-pointer" data-callout-ply="${tp.ply}" title="Click to jump to the Game Turning Point">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <div class="d-flex align-items-center gap-1">
                <span class="badge bg-danger text-white fw-black" style="font-size: 10px;">
                  <i class="bi bi-lightning-fill me-1"></i>GAME TURNING POINT
                </span>
                ${typeof renderInfoIcon === 'function' ? renderInfoIcon('card_turning_point') : ''}
              </div>
              <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">Move ${moveNum}${moveDots}${insEscape(tp.san)}</span>
            </div>
            <div class="small fw-bold mb-1">
              ${tp.isUserMove ? 'Your' : "Opponent's"} <span class="text-danger font-monospace fw-black">${ moveNum }${ moveDots }${ insEscape(tp.san) }</span> swung win probability by <span class="text-danger fw-black">${tp.swingPct}%</span> (${beforePct}% → ${afterPct}% White).
            </div>
            ${tp.bestMoveSan ? `
              <div class="text-secondary" style="font-size: 11px;">
                <i class="bi bi-check2-circle text-success me-1"></i>Engine recommended <span class="font-monospace fw-bold text-success">${insEscape(tp.bestMoveSan)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `);
    }

    if (od) {
      const moveNum = Math.ceil(od.ply / 2);
      const moveDots = od.color === 'b' ? '...' : '.';
      const bookAlts = (od.alternatives || []).map((a) => `<span class="badge bg-body-secondary text-body font-monospace me-1">${insEscape(a.move)} (${insEscape(a.eco)})</span>`).join('');
      cards.push(`
        <div class="col-12 ${tp ? 'col-md-6' : ''}">
          <div class="comic-card p-2.5 h-100 coaching-callout-card border-start border-4 border-warning cursor-pointer" data-callout-ply="${od.ply}" title="Click to jump to the Opening Book Deviation">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <div class="d-flex align-items-center gap-1">
                <span class="badge bg-warning text-dark fw-black" style="font-size: 10px;">
                  <i class="bi bi-book-half me-1"></i>LEFT OPENING BOOK
                </span>
                ${typeof renderInfoIcon === 'function' ? renderInfoIcon('card_opening_deviation') : ''}
              </div>
              <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">Move ${moveNum}${moveDots}${insEscape(od.san)}</span>
            </div>
            <div class="small fw-bold mb-1">
              Deviated from <span class="text-warning fw-black">${insEscape(od.lastBookEco)} ${insEscape(od.lastBookName)}</span> with <span class="font-monospace fw-black">${moveNum}${moveDots}${insEscape(od.san)}</span>.
            </div>
            ${bookAlts ? `
              <div class="text-secondary d-flex align-items-center flex-wrap gap-1" style="font-size: 11px;">
                <span>Book lines:</span> ${bookAlts}
              </div>
            ` : `
              <div class="text-secondary" style="font-size: 11px;">
                Best continuation: <span class="font-monospace fw-bold text-success">${insEscape(od.bestMoveSan || 'Standard development')}</span>
              </div>
            `}
          </div>
        </div>
      `);
    }

    return `
      <div class="row g-2">
        ${cards.join('')}
      </div>
    `;
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
    updateAdvantageScrubber(this);
  }

  renderAdvantageChart() {
    renderAdvantageChart(this);
  }

  getSavedGamesList() {
    const list = [];
    const seenIds = new Set();

    let savedImport = null;
    const importedIds = new Set();
    const importedPgns = new Set();
    try {
      savedImport = JSON.parse(localStorage.getItem('chess_iq_imported_games') || 'null');
      if (savedImport && Array.isArray(savedImport.games)) {
        savedImport.games.forEach((g) => {
          if (g.id) importedIds.add(String(g.id));
          if (g.pgn) importedPgns.add(String(g.pgn).trim());
        });
      }
    } catch {}

    const cachedIndex = typeof getCacheIndex === 'function' ? getCacheIndex() : [];
    cachedIndex.forEach((item) => {
      seenIds.add(item.id || item.key);

      const isImported = Boolean(
        item.isImported ||
        (item.id && (String(item.id).startsWith('chesscom_') || importedIds.has(String(item.id)))) ||
        (item.pgn && importedPgns.has(String(item.pgn).trim()))
      );

      const botMatch = !isImported && typeof detectBotInGame === 'function' ? detectBotInGame(item.white, item.black) : null;
      const isBotGame = !isImported && Boolean(
        item.isBotGame ||
        botMatch ||
        (item.white === 'You' || item.black === 'You')
      );

      let botInfo = botMatch;
      if (!botInfo && isBotGame) {
        const isUserWhite = item.userColor === 'w';
        const botRawName = isUserWhite ? item.black : item.white;
        botInfo = {
          name: item.botName || botRawName || 'Bot',
          avatar: item.botAvatar || '🤖',
          elo: isUserWhite ? item.blackElo : item.whiteElo
        };
      }

      list.push({
        type: 'analyzed',
        key: item.key,
        id: item.id || item.key,
        pgn: item.pgn || '',
        white: item.white || 'White',
        black: item.black || 'Black',
        whiteElo: item.whiteElo || 1500,
        blackElo: item.blackElo || 1500,
        result: item.result || '*',
        date: item.date || '',
        userColor: item.userColor || 'w',
        accuracy: item.accuracy ?? 85,
        elo: item.elo || 1500,
        eco: item.eco || '',
        ecoName: item.ecoName || '',
        timeControl: item.timeControl || '',
        savedAt: item.savedAt || 0,
        isImported,
        isBotGame,
        botInfo
      });
    });

    try {
      if (savedImport && Array.isArray(savedImport.games)) {
        const username = (savedImport.username || '').toLowerCase();
        savedImport.games.forEach((g) => {
          if (!seenIds.has(g.id)) {
            seenIds.add(g.id);
            const isUserWhite = g.white && g.white.toLowerCase() === username;
            const isUserBlack = g.black && g.black.toLowerCase() === username;
            const userColor = isUserWhite ? 'w' : (isUserBlack ? 'b' : 'w');
            list.push({
              type: 'imported',
              id: g.id,
              key: g.id,
              pgn: g.pgn,
              white: g.white || 'White',
              black: g.black || 'Black',
              whiteElo: g.whiteElo || 1500,
              blackElo: g.blackElo || 1500,
              result: g.result || '*',
              date: g.date || '',
              userColor,
              eco: g.eco || '',
              ecoName: '',
              timeControl: g.timeControl || '',
              savedAt: g.endTime || 0,
              isImported: true,
              isBotGame: false,
              botInfo: null
            });
          }
        });
      }
    } catch {}

    return list;
  }

  buildDetailedPerformanceHtml() {
    if (!this.game) return '';
    const userColor = this.game.userColor || 'w';
    const isWhiteUser = userColor === 'w';

    const userAcc = Number(this.game.userAccuracy ?? this.game.accuracy ?? this.game.overallAccuracy ?? 85).toFixed(1);
    const oppAcc = Number(this.game.opponentAccuracy ?? 85).toFixed(1);

    const userPhases = this.game.userPhaseElos || this.game.phaseElos || {};
    const oppPhases = this.game.opponentPhaseElos || {};

    const userPhaseAcc = this.game.userPhaseAccuracy || {};
    const oppPhaseAcc = this.game.opponentPhaseAccuracy || {};

    const userOpeningAcc = userPhaseAcc.opening !== null && userPhaseAcc.opening !== undefined ? `${userPhaseAcc.opening}%` : '—';
    const userMiddleAcc = userPhaseAcc.middlegame !== null && userPhaseAcc.middlegame !== undefined ? `${userPhaseAcc.middlegame}%` : '—';
    const userEndAcc = userPhaseAcc.endgame !== null && userPhaseAcc.endgame !== undefined ? `${userPhaseAcc.endgame}%` : '—';

    const oppOpeningAcc = oppPhaseAcc.opening !== null && oppPhaseAcc.opening !== undefined ? `${oppPhaseAcc.opening}%` : '—';
    const oppMiddleAcc = oppPhaseAcc.middlegame !== null && oppPhaseAcc.middlegame !== undefined ? `${oppPhaseAcc.middlegame}%` : '—';
    const oppEndAcc = oppPhaseAcc.endgame !== null && oppPhaseAcc.endgame !== undefined ? `${oppPhaseAcc.endgame}%` : '—';

    const userOpeningElo = userPhases.opening ?? 1500;
    const userMiddlegameElo = userPhases.middlegame ?? 1500;
    const userEndgameElo = userPhases.endgame ?? 1500;

    const oppOpeningElo = oppPhases.opening ?? 1500;
    const oppMiddlegameElo = oppPhases.middlegame ?? 1500;
    const oppEndgameElo = oppPhases.endgame ?? 1500;

    return `
      <!-- Dual Accuracy Comparison -->
      <div class="row g-2 mb-2">
        <div class="col-6">
          <div class="arcade-stat-chip p-2 text-start cursor-help" data-iq-tip="stat_accuracy">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="fw-bold text-truncate" style="font-size: 11px;">${isWhiteUser ? '⚪ White' : '⚫ Black'} (You)</span>
              <span class="badge bg-success text-white font-monospace fw-black px-1.5 py-0.5 rounded-pill" style="font-size: 9px;">YOU</span>
            </div>
            <div class="d-flex align-items-baseline gap-1.5">
              <span class="fw-black fs-4 text-emerald font-monospace">${userAcc}%</span>
              <span class="small fw-bold text-uppercase" style="font-size: 10px; color: var(--arcade-text-muted);">Accuracy</span>
            </div>
          </div>
        </div>
        <div class="col-6">
          <div class="arcade-stat-chip p-2 text-start cursor-help" data-iq-tip="stat_accuracy">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="fw-bold text-truncate" style="font-size: 11px;">${isWhiteUser ? '⚫ Black' : '⚪ White'}</span>
              <span class="badge bg-primary text-white font-monospace fw-black px-1.5 py-0.5 rounded-pill" style="font-size: 9px;">OPP</span>
            </div>
            <div class="d-flex align-items-baseline gap-1.5">
              <span class="fw-black fs-4 text-cyan font-monospace">${oppAcc}%</span>
              <span class="small fw-bold text-uppercase" style="font-size: 10px; color: var(--arcade-text-muted);">Accuracy</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase Rating & Accuracy Comparison (Opening, Middle, Endgame) -->
      <div class="row g-1.5 text-center mb-2">
        <div class="col-4">
          <div class="arcade-stat-chip p-1.5 cursor-help" data-iq-tip="phase_opening">
            <span class="small d-block fw-black mb-1 text-uppercase" style="font-size: 10.5px; letter-spacing: 0.5px;"><i class="bi bi-compass me-1 text-primary"></i>Opening</span>
            <div class="d-flex justify-content-around align-items-center">
              <div class="text-center">
                <span class="d-block text-warning fw-black" style="font-size: 9px;">YOU</span>
                <span class="fw-black fs-6 text-primary font-monospace d-block">${userOpeningAcc}</span>
                <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Opening Phase Rating">${userOpeningElo} Elo</span>
              </div>
              <div class="vr opacity-25 my-auto" style="height: 32px;"></div>
              <div class="text-center">
                <span class="d-block text-cyan fw-black" style="font-size: 9px;">OPP</span>
                <span class="fw-black fs-6 text-cyan font-monospace d-block">${oppOpeningAcc}</span>
                <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Opponent Opening Phase Rating">${oppOpeningElo} Elo</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="arcade-stat-chip p-1.5 cursor-help" data-iq-tip="phase_middle">
            <span class="small d-block fw-black mb-1 text-uppercase" style="font-size: 10.5px; letter-spacing: 0.5px;"><i class="bi bi-shield-shaded me-1 text-warning"></i>Middle</span>
            <div class="d-flex justify-content-around align-items-center">
              <div class="text-center">
                <span class="d-block text-warning fw-black" style="font-size: 9px;">YOU</span>
                <span class="fw-black fs-6 text-warning font-monospace d-block">${userMiddleAcc}</span>
                <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Middlegame Phase Rating">${userMiddlegameElo} Elo</span>
              </div>
              <div class="vr opacity-25 my-auto" style="height: 32px;"></div>
              <div class="text-center">
                <span class="d-block text-cyan fw-black" style="font-size: 9px;">OPP</span>
                <span class="fw-black fs-6 text-cyan font-monospace d-block">${oppMiddleAcc}</span>
                <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Opponent Middlegame Phase Rating">${oppMiddlegameElo} Elo</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="arcade-stat-chip p-1.5 cursor-help" data-iq-tip="phase_endgame">
            <span class="small d-block fw-black mb-1 text-uppercase" style="font-size: 10.5px; letter-spacing: 0.5px;"><i class="bi bi-flag-fill me-1 text-success"></i>Endgame</span>
            <div class="d-flex justify-content-around align-items-center">
              <div class="text-center">
                <span class="d-block text-warning fw-black" style="font-size: 9px;">YOU</span>
                <span class="fw-black fs-6 text-success font-monospace d-block">${userEndAcc}</span>
                <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Endgame Phase Rating">${userEndgameElo} Elo</span>
              </div>
              <div class="vr opacity-25 my-auto" style="height: 32px;"></div>
              <div class="text-center">
                <span class="d-block text-cyan fw-black" style="font-size: 9px;">OPP</span>
                <span class="fw-black fs-6 text-cyan font-monospace d-block">${oppEndAcc}</span>
                <span class="badge phase-elo-chip font-monospace mt-0.5" style="font-size: 9.5px;" title="Opponent Endgame Phase Rating">${oppEndgameElo} Elo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Move Classification Breakdown (Player vs Opponent) -->
      <div class="border-top pt-2">
        <div class="d-flex align-items-center justify-content-between px-2 pb-1" style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;">
          <span style="width: 42px;" class="text-end text-warning fw-black">YOU</span>
          <span class="text-uppercase fw-bold" style="color: var(--arcade-text-muted);">MOVE QUALITY</span>
          <span style="width: 42px;" class="text-start text-cyan fw-black">OPP</span>
        </div>
        <div class="d-flex flex-column gap-1">
          ${this.buildBadgesSummary()}
        </div>
      </div>
    `;
  }

  openDetailedPerformanceModal() {
    this.openFullReportModal();
  }

  openFullReportModal() {
    if (!this.game) return;
    const existing = document.getElementById('review-detailed-modal');
    if (existing) existing.remove();

    const userColor = this.game.userColor || 'w';
    const isWhiteUser = userColor === 'w';

    const whiteName = insEscape(this.game.white || 'White');
    const blackName = insEscape(this.game.black || 'Black');
    const whiteElo = this.game.whiteElo || 1500;
    const blackElo = this.game.blackElo || 1500;

    const userAcc = Number(this.game.userAccuracy ?? this.game.accuracy ?? this.game.overallAccuracy ?? 85).toFixed(1);
    const oppAcc = Number(this.game.opponentAccuracy ?? 85).toFixed(1);
    const whiteAcc = isWhiteUser ? userAcc : oppAcc;
    const blackAcc = isWhiteUser ? oppAcc : userAcc;

    const userGameElo = this.game.userGameElo || this.game.overallGameElo || (isWhiteUser ? whiteElo : blackElo);
    const oppGameElo = this.game.oppGameElo || this.game.opponentGameElo || (isWhiteUser ? blackElo : whiteElo);
    const whiteGameElo = isWhiteUser ? userGameElo : oppGameElo;
    const blackGameElo = isWhiteUser ? oppGameElo : userGameElo;

    const userPhases = this.game.userPhaseElos || this.game.phaseElos || {};
    const oppPhases = this.game.opponentPhaseElos || {};
    const userPhaseAcc = this.game.userPhaseAccuracy || {};
    const oppPhaseAcc = this.game.opponentPhaseAccuracy || {};

    const whitePhaseAcc = isWhiteUser ? userPhaseAcc : oppPhaseAcc;
    const blackPhaseAcc = isWhiteUser ? oppPhaseAcc : userPhaseAcc;
    const whitePhaseElos = isWhiteUser ? userPhases : oppPhases;
    const blackPhaseElos = isWhiteUser ? oppPhases : userPhases;

    const whiteOpeningAcc = whitePhaseAcc.opening !== null && whitePhaseAcc.opening !== undefined ? `${whitePhaseAcc.opening}%` : '—';
    const whiteMiddleAcc = whitePhaseAcc.middlegame !== null && whitePhaseAcc.middlegame !== undefined ? `${whitePhaseAcc.middlegame}%` : '—';
    const whiteEndAcc = whitePhaseAcc.endgame !== null && whitePhaseAcc.endgame !== undefined ? `${whitePhaseAcc.endgame}%` : '—';

    const blackOpeningAcc = blackPhaseAcc.opening !== null && blackPhaseAcc.opening !== undefined ? `${blackPhaseAcc.opening}%` : '—';
    const blackMiddleAcc = blackPhaseAcc.middlegame !== null && blackPhaseAcc.middlegame !== undefined ? `${blackPhaseAcc.middlegame}%` : '—';
    const blackEndAcc = blackPhaseAcc.endgame !== null && blackPhaseAcc.endgame !== undefined ? `${blackPhaseAcc.endgame}%` : '—';

    const whiteOpeningElo = whitePhaseElos.opening ?? whiteElo;
    const whiteMiddleElo = whitePhaseElos.middlegame ?? whiteElo;
    const whiteEndElo = whitePhaseElos.endgame ?? whiteElo;

    const blackOpeningElo = blackPhaseElos.opening ?? blackElo;
    const blackMiddleElo = blackPhaseElos.middlegame ?? blackElo;
    const blackEndElo = blackPhaseElos.endgame ?? blackElo;

    const getAccuracyTier = (acc) => {
      const n = parseFloat(acc);
      if (n >= 96) return { label: 'Grandmaster Precision', color: '#10b981', icon: '💎' };
      if (n >= 88) return { label: 'Master Execution', color: '#06b6d4', icon: '⭐' };
      if (n >= 80) return { label: 'Solid Tactical Play', color: '#fbbf24', icon: '🎯' };
      if (n >= 70) return { label: 'Fighting Game', color: '#f59e0b', icon: '⚔️' };
      return { label: 'Volatile Battle', color: '#f43f5e', icon: '🌪️' };
    };

    const whiteTier = getAccuracyTier(whiteAcc);
    const blackTier = getAccuracyTier(blackAcc);

    let resTitle = 'Match Drawn (½-½)';
    let whiteBadge = '<span class="badge bg-secondary font-monospace fw-bold px-2 py-1">DRAW</span>';
    let blackBadge = '<span class="badge bg-secondary font-monospace fw-bold px-2 py-1">DRAW</span>';
    if (this.game.result === '1-0') {
      resTitle = `${whiteName} Won (1-0)`;
      whiteBadge = '<span class="badge bg-success text-white font-monospace fw-black px-2 py-1">VICTORY</span>';
      blackBadge = '<span class="badge bg-danger text-white font-monospace fw-black px-2 py-1">DEFEAT</span>';
    } else if (this.game.result === '0-1') {
      resTitle = `${blackName} Won (0-1)`;
      whiteBadge = '<span class="badge bg-danger text-white font-monospace fw-black px-2 py-1">DEFEAT</span>';
      blackBadge = '<span class="badge bg-success text-white font-monospace fw-black px-2 py-1">VICTORY</span>';
    }

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
    const whiteCounts = isWhiteUser ? userCounts : oppCounts;
    const blackCounts = isWhiteUser ? oppCounts : userCounts;

    const totalPlies = (this.game.plies || []).length;
    const totalMoves = Math.ceil(totalPlies / 2);
    const whiteMovesCount = (this.game.plies || []).filter((p) => p && p.color === 'w').length || 1;
    const blackMovesCount = (this.game.plies || []).filter((p) => p && p.color === 'b').length || 1;

    const whiteOptCount = (whiteCounts.brilliant || 0) + (whiteCounts.great || 0) + (whiteCounts.best || 0);
    const blackOptCount = (blackCounts.brilliant || 0) + (blackCounts.great || 0) + (blackCounts.best || 0);
    const whiteErrCount = (whiteCounts.inaccuracy || 0) + (whiteCounts.mistake || 0) + (whiteCounts.blunder || 0) + (whiteCounts.missed_win || 0);
    const blackErrCount = (blackCounts.inaccuracy || 0) + (blackCounts.mistake || 0) + (blackCounts.blunder || 0) + (blackCounts.missed_win || 0);

    const tp = this.game.turningPoint;
    const od = this.game.openingDeviation;

    // Critical user mistakes
    const userMistakes = (this.game.plies || [])
      .filter((p) => p && p.color === userColor && ['blunder', 'missed_win', 'mistake', 'inaccuracy'].includes(p.classification))
      .sort((a, b) => {
        const dropA = Math.abs((a.winProbBefore ?? 0.5) - (a.winProb ?? 0.5));
        const dropB = Math.abs((b.winProbBefore ?? 0.5) - (b.winProb ?? 0.5));
        return dropB - dropA;
      });

    // Time & Clock Stats
    let whiteTimeTotal = 0, whiteTimeMoves = 0;
    let blackTimeTotal = 0, blackTimeMoves = 0;
    let fastestMove = null, slowestMove = null;
    let timeTroubleCount = 0, impulsiveCount = 0;

    (this.game.plies || []).forEach((p) => {
      if (!p) return;
      if (typeof p.timeSpent === 'number' && p.timeSpent > 0) {
        if (p.color === 'w') {
          whiteTimeTotal += p.timeSpent;
          whiteTimeMoves++;
        } else {
          blackTimeTotal += p.timeSpent;
          blackTimeMoves++;
        }
        if (!fastestMove || p.timeSpent < fastestMove.timeSpent) fastestMove = p;
        if (!slowestMove || p.timeSpent > slowestMove.timeSpent) slowestMove = p;
      }
      if (p.isTimeTrouble) timeTroubleCount++;
      if (p.isImpulsive) impulsiveCount++;
    });

    const whiteAvgTime = whiteTimeMoves > 0 ? (whiteTimeTotal / whiteTimeMoves).toFixed(1) + 's' : null;
    const blackAvgTime = blackTimeMoves > 0 ? (blackTimeTotal / blackTimeMoves).toFixed(1) + 's' : null;

    // Tactical Motifs
    const motifMap = {};
    (this.game.plies || []).forEach((p) => {
      if (!p || !Array.isArray(p.motifs)) return;
      p.motifs.forEach((m) => {
        const key = m.label || m.name || m;
        if (!motifMap[key]) {
          motifMap[key] = { label: key, count: 0, icon: m.icon || '⚡', coachTip: m.coachTip || '' };
        }
        motifMap[key].count++;
      });
    });
    const detectedMotifs = Object.values(motifMap).sort((a, b) => b.count - a.count);

    // Dynamic executive narrative
    let executiveNarrative = `A dynamic match fought in the <strong>${insEscape(this.game.ecoName || this.game.ecoCode || 'standard lines')}</strong>. `;
    if (this.game.result === '1-0') {
      executiveNarrative += isWhiteUser
        ? `You seized the initiative with ${whiteAcc}% accuracy, converting your advantage to claim victory in ${totalMoves} moves.`
        : `White played with strong precision (${whiteAcc}%), leveraging critical tactical turns to seal victory in ${totalMoves} moves.`;
    } else if (this.game.result === '0-1') {
      executiveNarrative += !isWhiteUser
        ? `You navigated key complications with ${blackAcc}% accuracy, outplaying White to secure victory in ${totalMoves} moves.`
        : `Black demonstrated clinical accuracy (${blackAcc}%), capitalizing on open lines to achieve victory in ${totalMoves} moves.`;
    } else {
      executiveNarrative += `Both sides battled to a hard-fought draw with well-matched accuracy (${whiteAcc}% White vs ${blackAcc}% Black) over ${totalMoves} moves.`;
    }

    // Coach Study Plan stats
    const summary = this.game.gameCoachSummary || {};
    const bankStats = typeof getBlunderBankStats === 'function' ? getBlunderBankStats() : { total: 0, due: 0 };
    let priorityTitle = 'Solid Positional Consistency';
    let priorityDesc = 'You played a clean game with very few tactical oversights. Use Guess-the-Move mode to sharpen your grandmaster calculation!';
    let priorityIcon = '🏆';

    if (summary.topMotifId && typeof TACTICAL_MOTIF_CATALOG !== 'undefined' && TACTICAL_MOTIF_CATALOG[summary.topMotifId]) {
      const cat = TACTICAL_MOTIF_CATALOG[summary.topMotifId];
      priorityIcon = cat.icon;
      priorityTitle = `Pattern Alert: ${cat.label} (${summary.topMotifCount}× in this game)`;
      priorityDesc = cat.coachTip;
    } else if ((this.game.impulsiveBlunders || 0) >= 1) {
      priorityIcon = '⚡';
      priorityTitle = `Clock Discipline: ${this.game.impulsiveBlunders} Rushed Mistake${this.game.impulsiveBlunders > 1 ? 's' : ''}`;
      priorityDesc = 'You played critical mistakes in under 2 seconds despite having plenty of clock time. Take a deep breath and sit on your hands for 5 seconds before capturing or responding to threats!';
    } else if (summary.weakestPhase && summary.weakestPhaseAcc < 78) {
      priorityIcon = '📉';
      const phCap = summary.weakestPhase.charAt(0).toUpperCase() + summary.weakestPhase.slice(1);
      priorityTitle = `${phCap} Precision (${summary.weakestPhaseAcc}% Accuracy)`;
      priorityDesc = `Your accuracy dipped most during the ${summary.weakestPhase}. Practice critical transitions from this phase against an Elo-matched bot!`;
    } else if (userMistakes.length > 0) {
      priorityIcon = '🎯';
      priorityTitle = `Tactical Calculation (${userMistakes.length} Key Error${userMistakes.length > 1 ? 's' : ''})`;
      priorityDesc = 'Re-play your mistakes on the board right now in puzzle workout mode to build muscle memory for the correct tactical continuation.';
    }

    const modal = document.createElement('div');
    modal.id = 'review-detailed-modal';
    modal.className = 'why-modal-backdrop';
    modal.innerHTML = `
      <div class="why-dialog full-report-dialog comic-card p-3 p-sm-4 shadow-2xl" style="max-width: 980px; width: 100%; max-height: min(94vh, 920px); overflow-y: auto;">
        <!-- 1. Report Header & Utility Actions -->
        <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom flex-wrap gap-2" style="border-color: var(--arcade-border) !important;">
          <div class="d-flex align-items-center gap-2 flex-wrap min-w-0">
            <span class="badge bg-warning text-dark font-monospace fw-black px-2.5 py-1.5 fs-6">
              <i class="bi bi-file-earmark-bar-graph-fill me-1.5"></i>Full Game Report
            </span>
            <span class="badge bg-secondary font-monospace">${this.game.ecoCode || 'PGN'}</span>
            <span class="fw-black text-truncate" style="max-width: 280px; font-size: 14px;">${insEscape(this.game.ecoName || 'Chess Match')}</span>
          </div>
          <div class="d-flex align-items-center gap-1.5 no-print flex-shrink-0">
            <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-2.5 py-1" id="btn-report-share" title="Share Game Review Link">
              <i class="bi bi-share-fill me-1"></i>Share Link
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold px-2.5 py-1" id="btn-report-copy" title="Copy Full Report Summary to Clipboard">
              <i class="bi bi-clipboard-check me-1"></i>Copy Summary
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold px-2.5 py-1" id="btn-report-print" title="Print Game Report">
              <i class="bi bi-printer me-1"></i>Print
            </button>
            <button type="button" class="btn btn-sm btn-dark comic-btn py-1 px-2.5 fw-bold" id="btn-close-perf-modal" title="Close Report">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <!-- Metadata Strip -->
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 p-2 rounded mb-3" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border); font-size: 11.5px;">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span><i class="bi bi-calendar3 me-1 text-secondary"></i><strong class="font-monospace">${this.game.date || 'Recent Match'}</strong></span>
            <span class="text-secondary opacity-50">·</span>
            <span><i class="bi bi-stopwatch me-1 text-secondary"></i><strong class="font-monospace">${this.game.timeControl || 'Standard'}</strong></span>
            <span class="text-secondary opacity-50">·</span>
            <span><i class="bi bi-trophy-fill me-1 text-warning"></i><strong class="font-monospace">${resTitle}</strong></span>
          </div>
          <div class="d-flex align-items-center gap-2 font-monospace">
            <span><i class="bi bi-hash me-0.5 text-secondary"></i><strong>${totalMoves} moves (${totalPlies} plies)</strong></span>
            <span class="text-secondary opacity-50">·</span>
            <span class="badge bg-secondary-subtle text-secondary border font-monospace text-uppercase">${this.game.platform || 'PGN'}</span>
          </div>
        </div>

        <div class="d-flex flex-column gap-3">
          <!-- 2. Executive Head-to-Head Player Overview -->
          <div class="row g-2.5">
            <!-- White Player Card -->
            <div class="col-12 col-md-6">
              <div class="report-metric-card h-100 ${isWhiteUser ? 'border-warning' : ''}">
                <div class="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
                  <div class="d-flex align-items-center gap-1.5 min-w-0">
                    <span class="lh-1 fs-5">⚪</span>
                    <span class="fw-black fs-6 text-truncate ${isWhiteUser ? 'text-warning' : ''}">${whiteName}</span>
                    <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${whiteElo}</span>
                  </div>
                  <div class="d-flex align-items-center gap-1">
                    ${isWhiteUser ? '<span class="badge bg-warning text-dark font-monospace fw-black px-1.5 py-0.5 rounded-pill" style="font-size: 9px;">YOU</span>' : ''}
                    ${whiteBadge}
                  </div>
                </div>

                <div class="row g-2 align-items-baseline mb-2">
                  <div class="col-6">
                    <span class="small text-secondary fw-bold text-uppercase d-block" style="font-size: 10px;">Move Accuracy</span>
                    <span class="fw-black fs-2 text-emerald font-monospace">${whiteAcc}%</span>
                  </div>
                  <div class="col-6">
                    <span class="small text-secondary fw-bold text-uppercase d-block" style="font-size: 10px;">Performance Rating</span>
                    <span class="fw-black fs-3 font-monospace text-warning">${whiteGameElo} <span class="fs-6 text-secondary fw-normal">Elo</span></span>
                  </div>
                </div>

                <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 pt-1.5 border-top border-opacity-10" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                  <span class="badge rounded-pill fw-bold" style="background: ${whiteTier.color}20; color: ${whiteTier.color}; border: 1px solid ${whiteTier.color}50;">
                    ${whiteTier.icon} ${whiteTier.label}
                  </span>
                  <span class="text-secondary font-monospace">
                    <strong class="text-success">${whiteOptCount}</strong> best · <strong class="text-danger">${whiteErrCount}</strong> errors
                  </span>
                </div>
              </div>
            </div>

            <!-- Black Player Card -->
            <div class="col-12 col-md-6">
              <div class="report-metric-card h-100 ${!isWhiteUser ? 'border-warning' : ''}">
                <div class="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
                  <div class="d-flex align-items-center gap-1.5 min-w-0">
                    <span class="lh-1 fs-5">⚫</span>
                    <span class="fw-black fs-6 text-truncate ${!isWhiteUser ? 'text-warning' : ''}">${blackName}</span>
                    <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${blackElo}</span>
                  </div>
                  <div class="d-flex align-items-center gap-1">
                    ${!isWhiteUser ? '<span class="badge bg-warning text-dark font-monospace fw-black px-1.5 py-0.5 rounded-pill" style="font-size: 9px;">YOU</span>' : ''}
                    ${blackBadge}
                  </div>
                </div>

                <div class="row g-2 align-items-baseline mb-2">
                  <div class="col-6">
                    <span class="small text-secondary fw-bold text-uppercase d-block" style="font-size: 10px;">Move Accuracy</span>
                    <span class="fw-black fs-2 text-cyan font-monospace">${blackAcc}%</span>
                  </div>
                  <div class="col-6">
                    <span class="small text-secondary fw-bold text-uppercase d-block" style="font-size: 10px;">Performance Rating</span>
                    <span class="fw-black fs-3 font-monospace text-info">${blackGameElo} <span class="fs-6 text-secondary fw-normal">Elo</span></span>
                  </div>
                </div>

                <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 pt-1.5 border-top border-opacity-10" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                  <span class="badge rounded-pill fw-bold" style="background: ${blackTier.color}20; color: ${blackTier.color}; border: 1px solid ${blackTier.color}50;">
                    ${blackTier.icon} ${blackTier.label}
                  </span>
                  <span class="text-secondary font-monospace">
                    <strong class="text-success">${blackOptCount}</strong> best · <strong class="text-danger">${blackErrCount}</strong> errors
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Executive Match Narrative -->
          <div class="p-2.5 rounded" style="background: rgba(251, 191, 36, 0.08); border-left: 4px solid var(--arcade-gold); font-size: 12.5px;">
            <div class="d-flex align-items-center gap-1.5 mb-1">
              <i class="bi bi-journal-text text-warning"></i>
              <strong class="text-warning text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Executive Match Verdict</strong>
            </div>
            <div class="text-body">${executiveNarrative}</div>
          </div>

          <!-- 3. Phase-by-Phase Breakdown (Opening, Middlegame, Endgame) -->
          <div>
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-black mb-0 d-flex align-items-center gap-1.5">
                <i class="bi bi-compass text-warning"></i>Phase-by-Phase Mastery
              </h6>
              <span class="text-secondary font-monospace" style="font-size: 11px;">⚪ White vs ⚫ Black</span>
            </div>
            <div class="row g-2">
              <!-- Opening -->
              <div class="col-12 col-md-4">
                <div class="report-phase-card d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="fw-black text-uppercase text-primary" style="font-size: 11px;"><i class="bi bi-compass me-1"></i>Opening</span>
                      <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">Moves 1–${Math.ceil((this.game.middlegameStartPly || 20) / 2)}</span>
                    </div>
                    <div class="d-flex justify-content-around align-items-center py-1 mb-2 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03));">
                      <div class="text-center">
                        <span class="d-block text-secondary small" style="font-size: 9.5px;">⚪ White</span>
                        <span class="fw-black font-monospace text-primary fs-5">${whiteOpeningAcc}</span>
                        <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${whiteOpeningElo} Elo</span>
                      </div>
                      <div class="vr opacity-25 my-auto" style="height: 30px;"></div>
                      <div class="text-center">
                        <span class="d-block text-secondary small" style="font-size: 9.5px;">⚫ Black</span>
                        <span class="fw-black font-monospace text-cyan fs-5">${blackOpeningAcc}</span>
                        <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${blackOpeningElo} Elo</span>
                      </div>
                    </div>
                  </div>
                  <div class="small pt-1.5 border-top border-opacity-10 text-secondary" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                    ${od ? `
                      <div class="d-flex align-items-center justify-content-between gap-1 flex-wrap">
                        <span>Left book move ${Math.ceil(od.ply / 2)} (<strong class="font-monospace">${insEscape(od.san)}</strong>)</span>
                        <button type="button" class="btn btn-xs btn-outline-warning comic-btn py-0 px-1.5 fw-bold" data-report-jump="${od.ply}">Jump</button>
                      </div>
                    ` : `
                      <span>Adhered to established book theory.</span>
                    `}
                  </div>
                </div>
              </div>

              <!-- Middlegame -->
              <div class="col-12 col-md-4">
                <div class="report-phase-card d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="fw-black text-uppercase text-warning" style="font-size: 11px;"><i class="bi bi-shield-shaded me-1"></i>Middlegame</span>
                      <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">Moves ${Math.ceil((this.game.middlegameStartPly || 20) / 2)}–${Math.ceil((this.game.endgameStartPly || 50) / 2)}</span>
                    </div>
                    <div class="d-flex justify-content-around align-items-center py-1 mb-2 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03));">
                      <div class="text-center">
                        <span class="d-block text-secondary small" style="font-size: 9.5px;">⚪ White</span>
                        <span class="fw-black font-monospace text-warning fs-5">${whiteMiddleAcc}</span>
                        <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${whiteMiddleElo} Elo</span>
                      </div>
                      <div class="vr opacity-25 my-auto" style="height: 30px;"></div>
                      <div class="text-center">
                        <span class="d-block text-secondary small" style="font-size: 9.5px;">⚫ Black</span>
                        <span class="fw-black font-monospace text-cyan fs-5">${blackMiddleAcc}</span>
                        <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${blackMiddleElo} Elo</span>
                      </div>
                    </div>
                  </div>
                  <div class="small pt-1.5 border-top border-opacity-10 text-secondary" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                    ${tp && tp.ply >= (this.game.middlegameStartPly || 20) && tp.ply <= (this.game.endgameStartPly || 50) ? `
                      <div class="d-flex align-items-center justify-content-between gap-1 flex-wrap">
                        <span class="text-danger fw-bold">Turning point at move ${Math.ceil(tp.ply / 2)}</span>
                        <button type="button" class="btn btn-xs btn-outline-danger comic-btn py-0 px-1.5 fw-bold" data-report-jump="${tp.ply}">Jump</button>
                      </div>
                    ` : `
                      <span>Complicated tactical maneuvering and piece trades.</span>
                    `}
                  </div>
                </div>
              </div>

              <!-- Endgame -->
              <div class="col-12 col-md-4">
                <div class="report-phase-card d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="fw-black text-uppercase text-success" style="font-size: 11px;"><i class="bi bi-flag-fill me-1"></i>Endgame</span>
                      <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">Moves ${Math.ceil((this.game.endgameStartPly || 50) / 2)}+</span>
                    </div>
                    <div class="d-flex justify-content-around align-items-center py-1 mb-2 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03));">
                      <div class="text-center">
                        <span class="d-block text-secondary small" style="font-size: 9.5px;">⚪ White</span>
                        <span class="fw-black font-monospace text-success fs-5">${whiteEndAcc}</span>
                        <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${whiteEndElo} Elo</span>
                      </div>
                      <div class="vr opacity-25 my-auto" style="height: 30px;"></div>
                      <div class="text-center">
                        <span class="d-block text-secondary small" style="font-size: 9.5px;">⚫ Black</span>
                        <span class="fw-black font-monospace text-cyan fs-5">${blackEndAcc}</span>
                        <span class="badge phase-elo-chip font-monospace" style="font-size: 9px;">${blackEndElo} Elo</span>
                      </div>
                    </div>
                  </div>
                  <div class="small pt-1.5 border-top border-opacity-10 text-secondary" style="border-color: var(--arcade-border) !important; font-size: 11px;">
                    ${totalPlies >= (this.game.endgameStartPly || 50) ? `
                      <span>Pawn promotion and king conversion endgame technique.</span>
                    ` : `
                      <span>Game concluded before the technical endgame phase.</span>
                    `}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Move Quality & Classification Matrix -->
          <div>
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-black mb-0 d-flex align-items-center gap-1.5">
                <i class="bi bi-bar-chart-steps text-warning"></i>Move Quality & Classification Breakdown
              </h6>
              <span class="text-secondary font-monospace" style="font-size: 11px;">White vs Black Distribution</span>
            </div>
            <div class="comic-card p-2.5">
              <div class="d-flex align-items-center justify-content-between px-2 pb-1.5 border-bottom border-opacity-10 font-monospace" style="border-color: var(--arcade-border) !important; font-size: 11px; font-weight: 800;">
                <span style="width: 80px;" class="text-start text-warning">⚪ White</span>
                <span class="text-uppercase text-secondary fw-bold">Classification</span>
                <span style="width: 80px;" class="text-end text-cyan">⚫ Black</span>
              </div>
              <div class="d-flex flex-column gap-1.5 pt-2">
                ${['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'blunder', 'missed_win'].map((cls) => {
                  const dict = COMIC_DICTIONARY[cls];
                  if (!dict) return '';
                  const wCnt = whiteCounts[cls] || 0;
                  const bCnt = blackCounts[cls] || 0;
                  const wPct = whiteMovesCount > 0 ? Math.round((wCnt / whiteMovesCount) * 100) : 0;
                  const bPct = blackMovesCount > 0 ? Math.round((bCnt / blackMovesCount) * 100) : 0;
                  const sumCnt = wCnt + bCnt;
                  const wBarPct = sumCnt > 0 ? Math.round((wCnt / sumCnt) * 100) : 50;
                  const bBarPct = sumCnt > 0 ? 100 - wBarPct : 50;

                  return `
                    <div class="p-1.5 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.02)); border: 1px solid var(--arcade-border);">
                      <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <div style="width: 90px;" class="d-flex align-items-baseline gap-1">
                          <strong class="font-monospace fs-6 ${wCnt > 0 ? 'text-warning' : 'text-secondary opacity-50'}">${wCnt}</strong>
                          <span class="text-secondary small font-monospace" style="font-size: 10px;">(${wPct}%)</span>
                        </div>

                        <span class="badge rounded-pill d-inline-flex align-items-center gap-1 px-2.5 py-1" style="background-color: ${dict.bg}; color: ${dict.text}; font-weight: 800; font-size: 11px;">
                          <span>${dict.symbol}</span>
                          <span>${dict.words[0]}</span>
                        </span>

                        <div style="width: 90px;" class="d-flex align-items-baseline justify-content-end gap-1 text-end">
                          <span class="text-secondary small font-monospace" style="font-size: 10px;">(${bPct}%)</span>
                          <strong class="font-monospace fs-6 ${bCnt > 0 ? 'text-cyan' : 'text-secondary opacity-50'}">${bCnt}</strong>
                        </div>
                      </div>

                      ${sumCnt > 0 ? `
                        <div class="report-dual-bar-track" title="White: ${wCnt} (${wBarPct}%) vs Black: ${bCnt} (${bBarPct}%)">
                          <div class="report-dual-bar-white" style="width: ${wBarPct}%;"></div>
                          <div class="report-dual-bar-black" style="width: ${bBarPct}%;"></div>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- 5. Tactical Highlights: Turning Point & Top Mistakes -->
          <div>
            <h6 class="fw-black mb-2 d-flex align-items-center gap-1.5">
              <i class="bi bi-lightning-charge-fill text-danger"></i>Critical Turning Points & Tactical Highlights
            </h6>
            <div class="row g-2.5">
              ${tp ? `
                <div class="col-12 ${userMistakes.length > 0 ? 'col-lg-6' : ''}">
                  <div class="report-metric-card border-danger h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div class="d-flex align-items-center justify-content-between mb-1.5">
                        <span class="badge bg-danger text-white fw-black" style="font-size: 10px;">
                          <i class="bi bi-lightning-fill me-1"></i>GAME TURNING POINT
                        </span>
                        <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">Move ${Math.ceil(tp.ply / 2)}${tp.color === 'b' ? '...' : '.'}${insEscape(tp.san)}</span>
                      </div>
                      <div class="small fw-bold mb-1.5">
                        ${tp.isUserMove ? 'Your' : "Opponent's"} <span class="text-danger font-monospace fw-black">${Math.ceil(tp.ply / 2)}${tp.color === 'b' ? '...' : '.'}${insEscape(tp.san)}</span> shifted win probability by <span class="text-danger fw-black">${tp.swingPct}%</span> (${Math.round((tp.prevWinProb ?? 0.5) * 100)}% → ${Math.round((tp.winProb ?? 0.5) * 100)}% White).
                      </div>
                      ${tp.bestMoveSan ? `
                        <div class="text-secondary small mb-2">
                          <i class="bi bi-check2-circle text-success me-1"></i>Stockfish recommended <strong class="font-monospace text-success">${insEscape(tp.bestMoveSan)}</strong>
                        </div>
                      ` : ''}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger comic-btn fw-bold w-100 py-1" data-report-jump="${tp.ply}">
                      <i class="bi bi-crosshair me-1"></i>View Turning Point on Board
                    </button>
                  </div>
                </div>
              ` : ''}

              <!-- Top Mistakes List -->
              <div class="col-12 ${tp ? 'col-lg-6' : ''}">
                <div class="report-metric-card h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="small fw-black text-uppercase text-danger" style="font-size: 10.5px;">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>Key Blunders & Missed Wins
                      </span>
                      <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">${userMistakes.length} error${userMistakes.length === 1 ? '' : 's'}</span>
                    </div>

                    ${userMistakes.length > 0 ? `
                      <div class="d-flex flex-column gap-1.5 mb-2">
                        ${userMistakes.slice(0, 4).map((m) => {
                          const moveNum = Math.ceil(m.ply / 2);
                          const dots = m.color === 'b' ? '...' : '.';
                          const comic = getComicBadge(m.classification, m.san);
                          const bestSan = m.bestMoveSan || (m.bestMoveUci ? `${m.bestMoveUci.slice(0, 2)}-${m.bestMoveUci.slice(2, 4)}` : '');
                          return `
                            <div class="report-blunder-row d-flex align-items-center justify-content-between gap-1.5">
                              <div class="d-flex align-items-center gap-1.5 min-w-0">
                                <span class="badge" style="background-color: ${comic.bg}; color: ${comic.text}; font-size: 10px; font-weight: 800;">
                                  ${comic.symbol}
                                </span>
                                <span class="font-monospace fw-black small">${moveNum}${dots}${insEscape(m.san)}</span>
                                ${bestSan ? `<span class="text-secondary small font-monospace d-none sm:inline">→ <strong class="text-success">${insEscape(bestSan)}</strong></span>` : ''}
                              </div>
                              <button type="button" class="btn btn-xs btn-outline-secondary comic-btn py-0.5 px-2 fw-bold flex-shrink-0" data-report-jump="${m.ply}">
                                View <i class="bi bi-arrow-right ms-0.5"></i>
                              </button>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : `
                      <div class="text-secondary small py-3 text-center">
                        <i class="bi bi-shield-check text-success fs-4 d-block mb-1"></i>
                        No critical blunders or missed wins found! Clean tactical game.
                      </div>
                    `}
                  </div>

                  ${userMistakes.length > 0 ? `
                    <button type="button" class="btn btn-sm btn-danger comic-btn fw-black w-100 py-1" id="btn-report-retry-mistakes">
                      <i class="bi bi-bullseye me-1"></i>Retry All Mistakes in Puzzle Workout (${userMistakes.length})
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- 6. Tactical Motifs Diagnosed -->
          ${detectedMotifs.length > 0 ? `
            <div>
              <div class="d-flex align-items-center justify-content-between mb-2">
                <h6 class="fw-black mb-0 d-flex align-items-center gap-1.5">
                  <i class="bi bi-puzzle-fill text-warning"></i>Tactical Motifs Diagnosed in this Game
                </h6>
                <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${detectedMotifs.length} motifs detected</span>
              </div>
              <div class="row g-2">
                ${detectedMotifs.slice(0, 6).map((m) => `
                  <div class="col-12 col-sm-6 col-md-4">
                    <div class="report-metric-card p-2 h-100">
                      <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="fw-black small d-flex align-items-center gap-1">
                          <span>${m.icon}</span>
                          <span>${insEscape(m.label)}</span>
                        </span>
                        <span class="badge bg-warning-subtle text-warning border border-warning-subtle font-monospace fw-black" style="font-size: 9.5px;">${m.count}×</span>
                      </div>
                      ${m.coachTip ? `<div class="text-secondary small" style="font-size: 11px;">${insEscape(m.coachTip)}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- 7. Time Management & Clock Discipline -->
          ${whiteAvgTime || blackAvgTime ? `
            <div>
              <h6 class="fw-black mb-2 d-flex align-items-center gap-1.5">
                <i class="bi bi-clock-history text-info"></i>Time Management & Clock Discipline
              </h6>
              <div class="row g-2">
                <div class="col-6 col-md-3">
                  <div class="report-metric-card text-center p-2">
                    <span class="text-secondary text-uppercase fw-bold d-block" style="font-size: 9.5px;">⚪ White Avg Time</span>
                    <strong class="fs-5 font-monospace text-warning">${whiteAvgTime || '—'}</strong>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="report-metric-card text-center p-2">
                    <span class="text-secondary text-uppercase fw-bold d-block" style="font-size: 9.5px;">⚫ Black Avg Time</span>
                    <strong class="fs-5 font-monospace text-cyan">${blackAvgTime || '—'}</strong>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="report-metric-card text-center p-2">
                    <span class="text-secondary text-uppercase fw-bold d-block" style="font-size: 9.5px;">⚡ Rushed Moves (&lt;2s)</span>
                    <strong class="fs-5 font-monospace text-danger">${impulsiveCount}</strong>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="report-metric-card text-center p-2">
                    <span class="text-secondary text-uppercase fw-bold d-block" style="font-size: 9.5px;">🔥 Time Trouble (&lt;20s)</span>
                    <strong class="fs-5 font-monospace text-warning">${timeTroubleCount}</strong>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- 8. Positional Pillars Profile -->
          <div>
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-black mb-0 d-flex align-items-center gap-1.5">
                <i class="bi bi-sliders text-info"></i>4-Pillar Positional Assessment
              </h6>
              <span class="text-secondary font-monospace" style="font-size: 11px;">Material · Activity · King Safety · Structure</span>
            </div>
            <div class="row g-2">
              <div class="col-6 col-md-3">
                <div class="report-metric-card p-2">
                  <div class="d-flex align-items-center gap-1.5 mb-1">
                    <span class="fs-5">⚖️</span>
                    <div>
                      <strong class="d-block small fw-black">Material</strong>
                      <span class="text-secondary font-monospace" style="font-size: 9.5px;">Piece exchanges</span>
                    </div>
                  </div>
                  <div class="text-secondary" style="font-size: 11px;">Evaluates pawn units, minor piece trades, and unbalanced piece trades.</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="report-metric-card p-2">
                  <div class="d-flex align-items-center gap-1.5 mb-1">
                    <span class="fs-5">⚡</span>
                    <div>
                      <strong class="d-block small fw-black">Piece Activity</strong>
                      <span class="text-secondary font-monospace" style="font-size: 9.5px;">Square control</span>
                    </div>
                  </div>
                  <div class="text-secondary" style="font-size: 11px;">Measures center attacks, mobility, open lines, and pressure on enemy squares.</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="report-metric-card p-2">
                  <div class="d-flex align-items-center gap-1.5 mb-1">
                    <span class="fs-5">🛡️</span>
                    <div>
                      <strong class="d-block small fw-black">King Safety</strong>
                      <span class="text-secondary font-monospace" style="font-size: 9.5px;">Shield & shelter</span>
                    </div>
                  </div>
                  <div class="text-secondary" style="font-size: 11px;">Evaluates pawn shelter intactness, castling security, and open files toward the king.</div>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="report-metric-card p-2">
                  <div class="d-flex align-items-center gap-1.5 mb-1">
                    <span class="fs-5">♟️</span>
                    <div>
                      <strong class="d-block small fw-black">Pawn Structure</strong>
                      <span class="text-secondary font-monospace" style="font-size: 9.5px;">Islands & chains</span>
                    </div>
                  </div>
                  <div class="text-secondary" style="font-size: 11px;">Monitors doubled pawns, isolated pawns, backward weaknesses, and passed pawns.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 9. Personalized Coach Study Plan & Drills -->
          <div class="border-top pt-3" style="border-color: var(--arcade-border) !important;">
            <div class="comic-card p-3 coach-plan-card">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-warning text-dark border border-dark fw-black px-2 py-1" style="font-size: 11px;">
                    🎓 COACH'S STUDY PLAN
                  </span>
                  <span class="small fw-bold text-secondary">Personalized Takeaways & Active Drills</span>
                </div>
                ${summary.brightestMove ? `
                  <button type="button" class="btn btn-xs btn-outline-info comic-btn fw-bold py-0.5 px-2" data-report-jump="${summary.brightestMove.ply}" title="Jump to your highest-rated move">
                    ✨ Best Moment: Move ${Math.ceil(summary.brightestMove.ply / 2)} (${insEscape(summary.brightestMove.san)})
                  </button>
                ` : ''}
              </div>

              <div class="d-flex align-items-start gap-2.5 mb-3">
                <div class="fs-3 lh-1 mt-0.5">${priorityIcon}</div>
                <div class="flex-grow-1">
                  <div class="fw-black small text-warning mb-0.5">${insEscape(priorityTitle)}</div>
                  <div class="text-secondary small" style="font-size: 12px;">${insEscape(priorityDesc)}</div>
                </div>
              </div>

              <div class="d-flex align-items-center flex-wrap gap-2 pt-1 border-top border-opacity-10" style="border-color: var(--arcade-border) !important;">
                <button type="button" class="btn btn-sm btn-primary comic-btn fw-black py-1 px-2.5 flex-grow-1" id="btn-coach-guess-move" style="font-size: 11px;">
                  <i class="bi bi-question-diamond-fill me-1"></i>Guess the Move Workout
                </button>
                <button type="button" class="btn btn-sm btn-warning text-dark comic-btn fw-black py-1 px-2.5 flex-grow-1" id="btn-coach-blunder-bank" style="font-size: 11px;">
                  <i class="bi bi-bank2 me-1"></i>Open Blunder Bank (${bankStats.total})
                </button>
              </div>
            </div>
          </div>

          <!-- 10. Footer Utility Actions -->
          <div class="d-flex align-items-center justify-content-between pt-2 border-top no-print flex-wrap gap-2" style="border-color: var(--arcade-border) !important;">
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-3 py-1" id="btn-report-copy-footer">
                <i class="bi bi-clipboard-check me-1"></i>Copy Report Summary
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold px-3 py-1" id="btn-report-print-footer">
                <i class="bi bi-printer me-1"></i>Print / Save
              </button>
            </div>
            <button type="button" class="btn btn-sm btn-dark comic-btn px-4 py-1 fw-bold" id="btn-report-close-footer">
              Close Report
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');

    const closeFn = () => {
      modal.remove();
      document.body.classList.remove('modal-open');
    };

    const dialogEl = modal.querySelector('.full-report-dialog') || modal.querySelector('.why-dialog');
    const safeClose = typeof setupModalSwipeAndHistory === 'function'
      ? setupModalSwipeAndHistory(modal, dialogEl, closeFn)
      : closeFn;

    modal.querySelector('#btn-close-perf-modal')?.addEventListener('click', safeClose);
    modal.querySelector('#btn-report-close-footer')?.addEventListener('click', safeClose);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) safeClose();
    });
    modal.querySelector('#btn-report-share')?.addEventListener('click', (e) => {
      this.shareGameReviewLink(e.currentTarget);
    });

    // Copy Summary Helper
    const copyReportSummary = (btn) => {
      const summaryText = `⚡ CHESS IQ COMPREHENSIVE GAME REPORT
Match: ${this.game.white || 'White'} (${whiteElo}) vs ${this.game.black || 'Black'} (${blackElo})
Result: ${resTitle}
ECO: ${this.game.ecoCode || 'PGN'} · ${this.game.ecoName || 'Chess Match'}
Date: ${this.game.date || 'Recent Match'} | Time Control: ${this.game.timeControl || 'Standard'}
Moves: ${totalMoves} moves (${totalPlies} plies)

📊 PERFORMANCE & ACCURACY:
• White (${whiteName}): ${whiteAcc}% Accuracy | ${whiteGameElo} Performance Elo (${whiteTier.label})
• Black (${blackName}): ${blackAcc}% Accuracy | ${blackGameElo} Performance Elo (${blackTier.label})

🧭 PHASE BREAKDOWN:
• Opening: White ${whiteOpeningAcc} (${whiteOpeningElo} Elo) vs Black ${blackOpeningAcc} (${blackOpeningElo} Elo)
• Middlegame: White ${whiteMiddleAcc} (${whiteMiddleElo} Elo) vs Black ${blackMiddleAcc} (${blackMiddleElo} Elo)
• Endgame: White ${whiteEndAcc} (${whiteEndElo} Elo) vs Black ${blackEndAcc} (${blackEndElo} Elo)
${tp ? `
⚡ TURNING POINT:
Move ${Math.ceil(tp.ply / 2)}${tp.color === 'b' ? '...' : '.'}${tp.san} swung win probability by ${tp.swingPct}% (${Math.round((tp.prevWinProb ?? 0.5) * 100)}% → ${Math.round((tp.winProb ?? 0.5) * 100)}% White).
${tp.bestMoveSan ? `Stockfish Recommended: ${tp.bestMoveSan}` : ''}` : ''}

🎓 COACH TAKEAWAY:
${priorityTitle}
${priorityDesc}`;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(summaryText).then(() => {
          if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = `<i class="bi bi-check2 me-1"></i>Copied!`;
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
          }
        });
      }
    };

    modal.querySelector('#btn-report-copy')?.addEventListener('click', (e) => copyReportSummary(e.currentTarget));
    modal.querySelector('#btn-report-copy-footer')?.addEventListener('click', (e) => copyReportSummary(e.currentTarget));
    modal.querySelector('#btn-report-print')?.addEventListener('click', () => window.print());
    modal.querySelector('#btn-report-print-footer')?.addEventListener('click', () => window.print());

    modal.querySelector('#btn-coach-guess-move')?.addEventListener('click', () => {
      closeFn();
      this.startGuessTheMove();
    });
    modal.querySelector('#btn-coach-blunder-bank')?.addEventListener('click', () => {
      closeFn();
      this.openBlunderBankModal('all');
    });
    modal.querySelector('#btn-report-retry-mistakes')?.addEventListener('click', () => {
      closeFn();
      this.startRetryMistakes();
    });

    modal.querySelectorAll('[data-report-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ply = parseInt(btn.getAttribute('data-report-jump'), 10);
        if (!isNaN(ply)) {
          closeFn();
          this.goToPly(ply);
        }
      });
    });
  }

  render() {
    if (this.isAnalyzing) {
      const total = this.analysisProgress.total;
      const current = this.analysisProgress.current;
      const pct = total > 0
        ? Math.min(100, Math.round((current / total) * 100))
        : 10;
      const subtitle = total > 0
        ? (current >= total
            ? 'Finalizing tactical report...'
            : current === 0
            ? `Starting Stockfish analysis (${total} plies)...`
            : pct >= 85
            ? `Verifying critical moments (${current} / ${total})...`
            : `Evaluating ply ${current} of ${total}...`)
        : 'Starting Stockfish analysis...';
      const stepText = total > 0 ? `${current} / ${total} plies` : 'Initializing...';
      this.container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-4 sm:p-5 text-center comic-card max-w-xl mx-auto my-5 shadow-lg" id="review-analysis-card">
          <div class="spinner-border text-warning mb-3" style="width: 3.5rem; height: 3.5rem;" role="status"></div>
          <h4 class="fw-black mb-1">Analyzing Game with Stockfish...</h4>
          <p class="fg-secondary small mb-3 fw-bold" id="review-analysis-subtitle">${subtitle}</p>
          <div class="progress w-100 max-w-md mx-auto mb-2" style="height: 14px; border: 2px solid #000000; border-radius: 999px; background: rgba(0,0,0,0.08);">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" id="review-analysis-bar" style="width: ${pct}%; transition: width 0.15s ease;"></div>
          </div>
          <div class="d-flex align-items-center justify-content-between w-100 max-w-md fg-secondary small font-monospace fw-bold px-1">
            <span id="review-analysis-step">${stepText}</span>
            <span class="badge bg-warning text-dark font-monospace" id="review-analysis-eta">Estimating time...</span>
            <span id="review-analysis-pct">${pct}%</span>
          </div>
        </div>
      `;
      return;
    }

    if (!this.game) {
      const savedGames = this.getSavedGamesList();
      const totalCount = savedGames.length;
      const botCount = savedGames.filter((g) => g.isBotGame).length;
      const playerCount = savedGames.filter((g) => !g.isBotGame).length;

      const currentFilter = this.savedGamesFilter || 'all';
      const filteredGames = savedGames.filter((g) => {
        if (currentFilter === 'bots') return g.isBotGame;
        if (currentFilter === 'players') return !g.isBotGame;
        return true;
      });

      const bankStats = typeof getBlunderBankStats === 'function' ? getBlunderBankStats() : { total: 0, due: 0 };
      this.container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-4 sm:p-5 text-center comic-card max-w-2xl mx-auto my-4">
          <div class="badge bg-warning text-dark border border-dark rounded-4 p-3 fs-1 mb-3 shadow-sm d-inline-flex align-items-center justify-content-center" style="width: 72px; height: 72px;">
            <span class="lh-1" style="font-size: 2.25rem;">♟</span>
          </div>
          <h3 class="fw-black mb-2">No Game Currently in Review</h3>
          <p class="fg-secondary small max-w-md mx-auto mb-4 font-medium leading-relaxed">
            Import a game from Chess.com to run deep Stockfish engine diagnostics
            with move quality classifications, phase ratings, and key moment analysis, or challenge our 33-bot arena!
          </p>
          <div class="d-flex align-items-center justify-content-center flex-wrap gap-2.5">
            <button type="button" class="btn-solid theme-warning comic-btn px-4 py-2.5" id="zero-btn-import" data-bs-toggle="modal" data-bs-target="#import-modal">
              <i class="bi bi-cloud-arrow-up-fill me-1.5"></i> Import Game
            </button>
            <button type="button" class="btn btn-light comic-btn px-4 py-2.5" id="zero-btn-bots">
              <i class="bi bi-robot me-1.5"></i> Play 33 Bots
            </button>
            <button type="button" class="btn btn-outline-warning comic-btn px-3.5 py-2.5 fw-bold" id="zero-btn-blunder-bank">
              <i class="bi bi-bank2 me-1.5"></i> Blunder Bank (${bankStats.total})
            </button>
          </div>
        </div>

        ${savedGames.length > 0 ? `
          <div class="w-100 my-4 px-1" style="max-width: 1300px; margin-left: auto; margin-right: auto;">
            <div class="d-flex align-items-center justify-content-between mb-3 px-1 gap-2 flex-wrap">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="badge bg-warning text-dark border border-dark rounded-pill px-2.5 py-1 fw-bold" style="font-size: 12px;">
                  <i class="bi bi-clock-history me-1"></i>Saved Games (${totalCount})
                </span>
                <div class="btn-group btn-group-sm rounded-pill p-0.5 bg-body-tertiary border" role="group" aria-label="Game Filter">
                  <button type="button" class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold ${currentFilter === 'all' ? 'btn-warning text-dark shadow-sm' : 'btn-ghost text-secondary'}" data-saved-filter="all" style="font-size: 11px;">
                    All (${totalCount})
                  </button>
                  <button type="button" class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold ${currentFilter === 'players' ? 'btn-info text-dark shadow-sm' : 'btn-ghost text-secondary'}" data-saved-filter="players" style="font-size: 11px;">
                    <i class="bi bi-people-fill me-1"></i>vs Players (${playerCount})
                  </button>
                  <button type="button" class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold ${currentFilter === 'bots' ? 'shadow-sm text-white' : 'btn-ghost text-secondary'}" data-saved-filter="bots" style="font-size: 11px; ${currentFilter === 'bots' ? 'background: #8b5cf6; border-color: #8b5cf6;' : ''}">
                    <i class="bi bi-robot me-1"></i>vs Bots (${botCount})
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-outline-danger btn-sm py-1 px-2.5 comic-btn fw-bold" id="zero-btn-clear-history" style="font-size: 11px;">
                <i class="bi bi-trash3 me-1"></i>Clear All
              </button>
            </div>

            ${filteredGames.length === 0 ? `
              <div class="text-center py-5 comic-card p-4 my-2">
                <div class="fs-1 mb-2">${currentFilter === 'bots' ? '🤖' : '👥'}</div>
                <h5 class="fw-black mb-1">No ${currentFilter === 'bots' ? 'Bot Matches' : 'Player Games'} Found</h5>
                <p class="text-secondary small mb-3">
                  ${currentFilter === 'bots'
                    ? 'You have not played or reviewed any games against our 33 bots yet.'
                    : 'No imported games from Chess.com or player games in your history.'}
                </p>
                ${currentFilter === 'bots' ? `
                  <button type="button" class="btn btn-warning btn-sm comic-btn fw-bold px-3 py-1.5" id="btn-goto-bots-empty">
                    <i class="bi bi-robot me-1"></i>Play 33 Bots
                  </button>
                ` : `
                  <button type="button" class="btn btn-warning btn-sm comic-btn fw-bold px-3 py-1.5" id="btn-goto-import-empty" data-bs-toggle="modal" data-bs-target="#import-modal">
                    <i class="bi bi-cloud-arrow-up-fill me-1"></i>Import from Chess.com
                  </button>
                `}
              </div>
            ` : `
              <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                ${filteredGames.map((item, idx) => {
                  const isUserWhite = item.userColor === 'w';
                  let resultBadge = '';
                  let cardBorder = '';
                  let isWin = false;
                  let isLoss = false;
                  const isDraw = item.result === '1/2-1/2';

                  if (item.result === '1-0') {
                    if (isUserWhite) isWin = true;
                    else isLoss = true;
                  } else if (item.result === '0-1') {
                    if (!isUserWhite) isWin = true;
                    else isLoss = true;
                  }

                  if (isWin) {
                    resultBadge = '<span class="badge bg-success text-white fw-bold px-2 py-1"><i class="bi bi-trophy-fill me-1"></i>Win</span>';
                    cardBorder = 'border-start border-4 border-success';
                  } else if (isLoss) {
                    resultBadge = '<span class="badge bg-danger text-white fw-bold px-2 py-1"><i class="bi bi-x-circle-fill me-1"></i>Loss</span>';
                    cardBorder = 'border-start border-4 border-danger';
                  } else if (isDraw) {
                    resultBadge = '<span class="badge bg-secondary text-white fw-bold px-2 py-1">Draw</span>';
                    cardBorder = 'border-start border-4 border-secondary';
                  } else {
                    resultBadge = `<span class="badge bg-body-secondary text-secondary fw-bold px-2 py-1">${item.result}</span>`;
                  }

                  // Match Category Badge
                  let typeBadge = '';
                  if (item.isBotGame) {
                    const botName = item.botInfo?.name || (isUserWhite ? item.black : item.white);
                    typeBadge = `<span class="badge rounded-pill fw-bold" style="font-size: 10px; background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3);"><i class="bi bi-robot me-1"></i>${insEscape(botName)}</span>`;
                  } else if (item.isImported) {
                    typeBadge = `<span class="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill fw-bold" style="font-size: 10px;"><i class="bi bi-people-fill me-1"></i>vs Player</span>`;
                  } else {
                    typeBadge = `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill fw-bold" style="font-size: 10px;"><i class="bi bi-file-earmark-text me-1"></i>Custom</span>`;
                  }

                  // Player Lines Formatting
                  let whitePlayerHtml = '';
                  let blackPlayerHtml = '';
                  if (item.isBotGame) {
                    const botAvatar = item.botInfo?.avatar || '🤖';
                    const botName = item.botInfo?.name || (isUserWhite ? item.black : item.white);
                    if (isUserWhite) {
                      whitePlayerHtml = `
                        <div class="d-flex align-items-center gap-1.5 min-w-0">
                          <span class="fs-6 lh-1">⚪</span>
                          <span class="fw-black text-warning text-truncate" style="max-width: 110px;">You</span>
                          <span class="badge saved-game-elo-badge font-monospace">${insEscape(item.whiteElo)} Elo</span>
                          <span class="badge bg-warning text-dark font-monospace fw-black px-1.5 py-0.2 rounded-pill" style="font-size: 9.5px;">YOU</span>
                        </div>
                      `;
                      blackPlayerHtml = `
                        <div class="d-flex align-items-center gap-1.5 min-w-0">
                          <span class="fs-6 lh-1">${botAvatar}</span>
                          <span class="fw-bold text-truncate" style="max-width: 120px;">${insEscape(botName)}</span>
                          <span class="badge saved-game-elo-badge font-monospace">${insEscape(item.blackElo)} Elo</span>
                          <span class="badge rounded-pill font-monospace fw-black px-1.5 py-0.2" style="font-size: 9px; background: #8b5cf6; color: white;">BOT</span>
                        </div>
                      `;
                    } else {
                      whitePlayerHtml = `
                        <div class="d-flex align-items-center gap-1.5 min-w-0">
                          <span class="fs-6 lh-1">${botAvatar}</span>
                          <span class="fw-bold text-truncate" style="max-width: 120px;">${insEscape(botName)}</span>
                          <span class="badge saved-game-elo-badge font-monospace">${insEscape(item.whiteElo)} Elo</span>
                          <span class="badge rounded-pill font-monospace fw-black px-1.5 py-0.2" style="font-size: 9px; background: #8b5cf6; color: white;">BOT</span>
                        </div>
                      `;
                      blackPlayerHtml = `
                        <div class="d-flex align-items-center gap-1.5 min-w-0">
                          <span class="fs-6 lh-1">⚫</span>
                          <span class="fw-black text-warning text-truncate" style="max-width: 110px;">You</span>
                          <span class="badge saved-game-elo-badge font-monospace">${insEscape(item.blackElo)} Elo</span>
                          <span class="badge bg-warning text-dark font-monospace fw-black px-1.5 py-0.2 rounded-pill" style="font-size: 9.5px;">YOU</span>
                        </div>
                      `;
                    }
                  } else {
                    whitePlayerHtml = `
                      <div class="d-flex align-items-center gap-1.5 min-w-0">
                        <span class="fs-6 lh-1">⚪</span>
                        <span class="fw-bold text-truncate ${isUserWhite ? 'text-warning fw-black' : ''}" style="max-width: 120px;">${insEscape(item.white)}</span>
                        <span class="badge saved-game-elo-badge font-monospace">${insEscape(item.whiteElo)} Elo</span>
                        ${isUserWhite ? '<span class="badge bg-warning text-dark font-monospace fw-black px-1.5 py-0.2 rounded-pill" style="font-size: 9.5px;">YOU</span>' : ''}
                      </div>
                    `;
                    blackPlayerHtml = `
                      <div class="d-flex align-items-center gap-1.5 min-w-0">
                        <span class="fs-6 lh-1">⚫</span>
                        <span class="fw-bold text-truncate ${!isUserWhite ? 'text-warning fw-black' : ''}" style="max-width: 120px;">${insEscape(item.black)}</span>
                        <span class="badge saved-game-elo-badge font-monospace">${insEscape(item.blackElo)} Elo</span>
                        ${!isUserWhite ? '<span class="badge bg-warning text-dark font-monospace fw-black px-1.5 py-0.2 rounded-pill" style="font-size: 9.5px;">YOU</span>' : ''}
                      </div>
                    `;
                  }

                  const botClass = item.isBotGame ? 'card-bot-match' : 'card-player-match';
                  return `
                    <div class="col">
                      <div class="comic-card saved-game-card ${botClass} p-3 d-flex flex-column justify-content-between h-100 gap-2.5 ${cardBorder}" data-saved-game-idx="${idx}" style="cursor: pointer;">
                        <div>
                          <div class="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom border-light-subtle gap-2 flex-nowrap">
                            <div class="d-flex align-items-center gap-1.5 overflow-hidden">
                              ${resultBadge}
                              ${typeBadge}
                            </div>
                            <div class="d-flex align-items-center gap-1 flex-shrink-0">
                              ${item.timeControl ? `<span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;"><i class="bi bi-clock me-0.5"></i>${insEscape(item.timeControl)}</span>` : ''}
                              <span class="text-secondary small font-monospace text-nowrap" style="font-size: 11px;">${insEscape(item.date)}</span>
                            </div>
                          </div>

                          <div class="d-flex flex-column gap-1.5 min-w-0">
                            ${whitePlayerHtml}
                            ${blackPlayerHtml}
                            ${item.ecoName || item.eco ? `
                              <div class="d-flex align-items-center gap-1 mt-0.5 text-secondary small flex-wrap" style="font-size: 11px;">
                                <i class="bi bi-book me-0.5"></i><span class="text-truncate" style="max-width: 200px;">${insEscape(item.ecoName || item.eco)}</span>
                              </div>
                            ` : ''}
                          </div>
                        </div>

                        <div class="d-flex align-items-center gap-2 flex-shrink-0 justify-content-between pt-2 border-top border-opacity-10 mt-auto">
                          ${item.type === 'analyzed' ? `
                            <div class="d-flex align-items-center gap-1.5 flex-wrap">
                              <span class="match-stat-badge match-acc-badge font-monospace"><i class="bi bi-bullseye me-0.5"></i><span class="stat-num">${item.accuracy}%</span> <span class="stat-lbl">Acc</span></span>
                              <span class="match-stat-badge match-perf-badge font-monospace"><i class="bi bi-star-fill me-0.5"></i><span class="stat-num">${item.elo}</span> <span class="stat-lbl">Perf</span></span>
                            </div>
                          ` : `
                            <span class="text-secondary small font-monospace" style="font-size: 11px;">Unanalyzed</span>
                          `}

                          <div class="d-flex align-items-center gap-1.5 ms-auto">
                            ${item.isImported ? `
                              <span class="badge bg-body-secondary text-secondary font-monospace border border-secondary-subtle px-1.5 py-1" style="font-size: 10px;" title="Imported from Chess.com">
                                <i class="bi bi-cloud-arrow-down-fill me-0.5"></i>Imported
                              </span>
                            ` : ''}
                            <button type="button" class="btn btn-outline-danger btn-sm comic-btn fw-bold px-2 py-1 btn-delete-saved-game" data-game-key="${insEscape(item.key || item.id)}" title="Remove this game and moves from blunder bank" style="font-size: 11px;">
                              <i class="bi bi-trash3 me-1"></i>Remove
                            </button>
                            ${item.type === 'analyzed' ? `
                              <button type="button" class="btn btn-warning btn-sm comic-btn fw-bold px-2.5 py-1" data-action-review="${idx}">
                                <i class="bi bi-search me-1"></i>Review
                              </button>
                            ` : `
                              <button type="button" class="btn btn-outline-warning btn-sm comic-btn fw-bold px-2.5 py-1" data-action-analyze="${idx}">
                                <i class="bi bi-lightning-charge-fill me-1"></i>Analyze
                              </button>
                            `}
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        ` : ''}
      `;

      this.container.querySelector('#zero-btn-import')?.addEventListener('click', () => {
        if (this.onOpenImport) this.onOpenImport();
      });
      this.container.querySelector('#zero-btn-bots')?.addEventListener('click', () => {
        if (this.onSwitchToBots) this.onSwitchToBots();
      });
      this.container.querySelector('#zero-btn-blunder-bank')?.addEventListener('click', () => {
        this.openBlunderBankModal('all');
      });
      this.container.querySelector('#zero-btn-clear-history')?.addEventListener('click', () => {
        clearGameCache();
        try { localStorage.removeItem('chess_iq_imported_games'); } catch {}
        this.render();
      });

      this.container.querySelector('#btn-goto-bots-empty')?.addEventListener('click', () => {
        if (this.onSwitchToBots) this.onSwitchToBots();
      });
      this.container.querySelector('#btn-goto-import-empty')?.addEventListener('click', () => {
        if (this.onOpenImport) this.onOpenImport();
      });

      this.container.querySelectorAll('[data-saved-filter]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const filter = btn.getAttribute('data-saved-filter');
          if (filter) {
            this.savedGamesFilter = filter;
            this.render();
          }
        });
      });

      this.container.querySelectorAll('.btn-delete-saved-game').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const key = btn.getAttribute('data-game-key');
          if (!key) return;

          if (btn.dataset.confirming === 'true') {
            if (typeof removeCachedGame === 'function') {
              removeCachedGame(key);
            }
            const targetGame = filteredGames.find((g) => (g.key === key || g.id === key));
            if (targetGame && typeof removeGameFromBlunderBank === 'function') {
              removeGameFromBlunderBank({
                gameId: targetGame.id,
                white: targetGame.white,
                black: targetGame.black,
                date: targetGame.date
              });
            }
            try {
              const savedImport = JSON.parse(localStorage.getItem('chess_iq_imported_games') || 'null');
              if (savedImport && Array.isArray(savedImport.games)) {
                savedImport.games = savedImport.games.filter((g) => g.id !== key && (!targetGame || g.id !== targetGame.id));
                localStorage.setItem('chess_iq_imported_games', JSON.stringify(savedImport));
              }
            } catch {}
            if (typeof soundService !== 'undefined' && soundService.playMove) {
              soundService.playMove();
            }
            this.render();
          } else {
            this.container.querySelectorAll('.btn-delete-saved-game[data-confirming="true"]').forEach((ob) => {
              ob.dataset.confirming = 'false';
              ob.innerHTML = '<i class="bi bi-trash3 me-1"></i>Remove';
              ob.classList.remove('btn-danger');
              ob.classList.add('btn-outline-danger');
            });

            btn.dataset.confirming = 'true';
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Confirm?';
            btn.classList.remove('btn-outline-danger');
            btn.classList.add('btn-danger');
            setTimeout(() => {
              if (btn && btn.isConnected && btn.dataset.confirming === 'true') {
                btn.dataset.confirming = 'false';
                btn.innerHTML = '<i class="bi bi-trash3 me-1"></i>Remove';
                btn.classList.remove('btn-danger');
                btn.classList.add('btn-outline-danger');
              }
            }, 3000);
          }
        });
      });

      this.container.querySelectorAll('[data-saved-game-idx]').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-saved-game')) return;
          const idx = parseInt(card.getAttribute('data-saved-game-idx'), 10);
          const item = filteredGames[idx];
          if (!item) return;
          if (item.type === 'analyzed') {
            const cached = getCachedGame(item.key, item.userColor) || getCachedGame(item.id, item.userColor);
            if (cached) {
              if (this.onSelectGame) this.onSelectGame(cached.pgn || item.pgn, item.userColor, cached);
              else { this.setGame(cached); soundService.playSuccess(); }
              return;
            }
          }
          if (this.onSelectGame) {
            this.onSelectGame(item.pgn || item.id, item.userColor);
          }
        });
      });

      return;
    }

    const userColor = this.game.userColor || 'w';
    const isWhiteUser = userColor === 'w';

    const whiteName = insEscape(this.game.white || 'White');
    const blackName = insEscape(this.game.black || 'Black');
    const whiteElo = this.game.whiteElo || 1500;
    const blackElo = this.game.blackElo || 1500;

    const userAcc = Number(this.game.userAccuracy ?? this.game.accuracy ?? this.game.overallAccuracy ?? 85).toFixed(1);
    const oppAcc = Number(this.game.opponentAccuracy ?? 85).toFixed(1);

    const whiteAcc = isWhiteUser ? userAcc : oppAcc;
    const blackAcc = isWhiteUser ? oppAcc : userAcc;

    const userGameElo = this.game.userGameElo || this.game.overallGameElo || (isWhiteUser ? whiteElo : blackElo);
    const oppGameElo = this.game.oppGameElo || this.game.opponentGameElo || (isWhiteUser ? blackElo : whiteElo);

    const whiteGameElo = isWhiteUser ? userGameElo : oppGameElo;
    const blackGameElo = isWhiteUser ? oppGameElo : userGameElo;

    const userPhases = this.game.userPhaseElos || this.game.phaseElos || {};
    const oppPhases = this.game.opponentPhaseElos || {};

    const userPhaseAcc = this.game.userPhaseAccuracy || {};
    const oppPhaseAcc = this.game.opponentPhaseAccuracy || {};

    const userOpeningAcc = userPhaseAcc.opening !== null && userPhaseAcc.opening !== undefined ? `${userPhaseAcc.opening}%` : '—';
    const userMiddleAcc = userPhaseAcc.middlegame !== null && userPhaseAcc.middlegame !== undefined ? `${userPhaseAcc.middlegame}%` : '—';
    const userEndAcc = userPhaseAcc.endgame !== null && userPhaseAcc.endgame !== undefined ? `${userPhaseAcc.endgame}%` : '—';

    const oppOpeningAcc = oppPhaseAcc.opening !== null && oppPhaseAcc.opening !== undefined ? `${oppPhaseAcc.opening}%` : '—';
    const oppMiddleAcc = oppPhaseAcc.middlegame !== null && oppPhaseAcc.middlegame !== undefined ? `${oppPhaseAcc.middlegame}%` : '—';
    const oppEndAcc = oppPhaseAcc.endgame !== null && oppPhaseAcc.endgame !== undefined ? `${oppPhaseAcc.endgame}%` : '—';

    const userOpeningElo = userPhases.opening ?? 1500;
    const userMiddlegameElo = userPhases.middlegame ?? 1500;
    const userEndgameElo = userPhases.endgame ?? 1500;

    const oppOpeningElo = oppPhases.opening ?? 1500;
    const oppMiddlegameElo = oppPhases.middlegame ?? 1500;
    const oppEndgameElo = oppPhases.endgame ?? 1500;

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

    // Active Review Dashboard - Prominent Large Board & Compact Quick Sidebar Layout
    this.container.innerHTML = `
      <div class="row g-2.5 g-xl-3 align-items-start w-100 mx-0">
        <!-- Column 1: Board & Tactical Controls (Dominant Large Desktop Workspace) -->
        <div class="col-12 col-lg-7 col-xl-6 col-xxl-6 mobile-sticky-top d-flex flex-column align-items-center gap-2 px-1 px-sm-2">
          <div class="w-100 review-board-column-inner">
            <!-- PV Banner (Tactical line playback) -->
            <div id="pv-banner-area" class="d-none"></div>

            <div class="d-flex align-items-stretch justify-content-center gap-2 gap-sm-2.5 mb-1 w-100">
              <!-- Vertical Animated Eval Bar -->
              <div class="eval-bar-wrapper flex-shrink-0 cursor-help" id="eval-bar" data-iq-tip="metric_eval_bar">
                <div class="eval-white-fill"></div>
                <div class="eval-score-badge text-white">0.0</div>
              </div>

              <!-- Chessboard Mount (Sized so move notation card is visible without scrolling) -->
              <div class="flex-grow-1 d-flex justify-content-center" id="review-board-mount"></div>
            </div>

            <!-- Dedicated Step Navigation Card (Right under the board) -->
            <div class="comic-card-sm p-1.5 mb-1 d-flex align-items-center justify-content-between gap-1.5 w-100" id="review-nav-controls">
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-first" title="First Move (Home / Ctrl+←)">
                <i class="bi bi-chevron-bar-left fs-6"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-prev" title="Previous Move (← / ↑ Arrow)">
                <i class="bi bi-chevron-left fs-5 fw-black me-1"></i><span class="small fw-black d-none sm:inline">Prev</span>
              </button>

              <span class="badge bg-secondary font-monospace px-2.5 sm:px-3 py-1.5 fs-6 fw-bold flex-shrink-0" id="ply-counter">0 / 0</span>

              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-next" title="Next Move (→ / ↓ Arrow)">
                <span class="small fw-black d-none sm:inline me-1">Next</span><i class="bi bi-chevron-right fs-5 fw-black"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-last" title="Last Move (End / Ctrl+→)">
                <i class="bi bi-chevron-bar-right fs-6"></i>
              </button>
            </div>

            <!-- Move Notation & Comic Sound Effect Strip -->
            <div class="comic-card-sm p-1.5 mb-1 d-flex align-items-center justify-content-between w-100" id="review-move-strip"></div>
          </div>
        </div>

        <!-- Column 2: Review Intelligence Sidebar (Glanceable Summary & Expandable Secondary Details) -->
        <div class="col-12 col-lg-5 col-xl-6 col-xxl-6 d-flex flex-column gap-2 px-1 px-sm-2 review-sidebar">
          <!-- 1. Match Overview & Quick Performance Card (Glanceable) -->
          <div class="comic-card p-2.5">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
              <div class="d-flex align-items-center gap-1.5 flex-wrap min-w-0">
                <span class="match-overview-pill"><i class="bi bi-diagram-3-fill me-1"></i>Overview</span>
                <span class="badge bg-warning text-dark font-monospace fw-black px-2 py-1">${this.game.ecoCode || 'PGN'}</span>
                <span class="fw-black text-truncate" style="max-width: 170px; font-size: 13px;">${this.game.ecoName || 'Chess Match'}</span>
                ${this.game.date ? `<span class="text-secondary small font-monospace d-none sm:inline">· ${this.game.date}</span>` : ''}
              </div>
              <div class="d-flex align-items-center gap-1 flex-shrink-0">
                <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-2 py-0.5" id="btn-share-game-link" title="Share link to this analyzed game review">
                  <i class="bi bi-share-fill me-1"></i>Share Link
                </button>
                <button type="button" class="btn btn-sm btn-warning text-dark comic-btn fw-black px-2.5 py-1" id="btn-open-full-report-modal" title="View Full Performance & Comprehensive Game Report">
                  <i class="bi bi-file-earmark-bar-graph-fill me-1"></i>Report
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold px-2 py-0.5" id="btn-reanalyze-review" title="Run fresh deep Stockfish analysis">
                  <i class="bi bi-arrow-repeat me-1"></i>Re-analyze
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold px-2 py-0.5" id="btn-share-review" title="Copy Review Summary to Clipboard">
                  <i class="bi bi-share"></i>
                </button>
              </div>
            </div>

            <!-- Player VS Player Compact Header -->
            <div class="row g-2 align-items-center mb-2">
              <!-- White Player -->
              <div class="col-5">
                <div class="player-pvp-card ${isWhiteUser ? 'is-user' : ''} p-2 d-flex flex-column gap-1">
                  <div class="d-flex align-items-center justify-content-between gap-1 min-w-0">
                    <div class="d-flex align-items-center gap-1 min-w-0">
                      <span class="lh-1" style="font-size: 13px;">⚪</span>
                      <span class="fw-black text-truncate ${isWhiteUser ? 'text-warning' : 'text-body'}" style="font-size: 12px;">${whiteName}</span>
                    </div>
                    ${isWhiteUser ? '<span class="badge bg-warning text-dark font-monospace fw-black px-1 py-0.5 rounded-pill" style="font-size: 9px;">YOU</span>' : ''}
                  </div>
                  <div class="d-flex align-items-center flex-wrap gap-1 font-monospace" style="font-size: 11px;">
                    <span class="fw-bold ${isWhiteUser ? 'text-emerald' : 'text-cyan'}">${whiteAcc}%</span>
                    <span class="text-secondary">· ${whiteGameElo} Perf</span>
                  </div>
                </div>
              </div>

              <!-- Center VS & Result -->
              <div class="col-2 text-center px-0">
                <div class="d-flex flex-column align-items-center justify-content-center">
                  <span class="badge ${this.game.result === '1-0' ? 'bg-success' : this.game.result === '0-1' ? 'bg-danger' : 'bg-secondary'} match-result-badge mb-0.5">
                    ${this.game.result}
                  </span>
                </div>
              </div>

              <!-- Black Player -->
              <div class="col-5">
                <div class="player-pvp-card ${!isWhiteUser ? 'is-user' : ''} p-2 d-flex flex-column gap-1">
                  <div class="d-flex align-items-center justify-content-between gap-1 min-w-0">
                    <div class="d-flex align-items-center gap-1 min-w-0">
                      <span class="lh-1" style="font-size: 13px;">⚫</span>
                      <span class="fw-black text-truncate ${!isWhiteUser ? 'text-warning' : 'text-body'}" style="font-size: 12px;">${blackName}</span>
                    </div>
                    ${!isWhiteUser ? '<span class="badge bg-warning text-dark font-monospace fw-black px-1 py-0.5 rounded-pill" style="font-size: 9px;">YOU</span>' : ''}
                  </div>
                  <div class="d-flex align-items-center flex-wrap gap-1 font-monospace" style="font-size: 11px;">
                    <span class="fw-bold ${!isWhiteUser ? 'text-emerald' : 'text-cyan'}">${blackAcc}%</span>
                    <span class="text-secondary">· ${blackGameElo} Perf</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Glanceable Key Moments Badges Row -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 pt-1.5 border-top border-opacity-10" style="border-color: var(--arcade-border) !important;">
              <span class="text-secondary fw-bold text-uppercase" style="font-size: 10px; letter-spacing: 0.5px;">Key Moments:</span>
              <div class="d-flex align-items-center flex-wrap gap-1">
                ${userCounts.brilliant > 0 ? `
                  <span class="badge glance-chip bg-info text-dark font-monospace fw-black cursor-pointer" data-filter-jump="brilliant" title="Jump to Brilliant Move">
                    💎 ${userCounts.brilliant} Brilliant
                  </span>
                ` : ''}
                ${userCounts.great > 0 ? `
                  <span class="badge glance-chip bg-primary-subtle text-primary border border-primary font-monospace fw-black cursor-pointer" data-filter-jump="great" title="Jump to Great Move">
                    ⭐ ${userCounts.great} Great
                  </span>
                ` : ''}
                ${userCounts.best > 0 ? `
                  <span class="badge glance-chip bg-success-subtle text-success border border-success font-monospace fw-bold" title="${userCounts.best} Best Moves played">
                    ✓ ${userCounts.best} Best
                  </span>
                ` : ''}
                ${userCounts.inaccuracy > 0 ? `
                  <span class="badge glance-chip bg-warning-subtle text-warning border border-warning font-monospace fw-bold cursor-pointer" data-filter-jump="inaccuracy" title="Jump to First Inaccuracy">
                    ⚠️ ${userCounts.inaccuracy} Inacc.
                  </span>
                ` : ''}
                ${userCounts.mistake > 0 ? `
                  <span class="badge glance-chip bg-warning text-dark font-monospace fw-black cursor-pointer" data-filter-jump="mistake" title="Jump to First Mistake">
                    ❓ ${userCounts.mistake} Mistake${userCounts.mistake > 1 ? 's' : ''}
                  </span>
                ` : ''}
                ${userCounts.blunder > 0 ? `
                  <span class="badge glance-chip bg-danger text-white font-monospace fw-black cursor-pointer" data-filter-jump="blunder" title="Jump to First Blunder">
                    💥 ${userCounts.blunder} Blunder${userCounts.blunder > 1 ? 's' : ''}
                  </span>
                ` : ''}
                ${userCounts.missed_win > 0 ? `
                  <span class="badge glance-chip bg-danger-subtle text-danger border border-danger font-monospace fw-black cursor-pointer" data-filter-jump="missed_win" title="Jump to Missed Win">
                    ❌ ${userCounts.missed_win} Missed Win${userCounts.missed_win > 1 ? 's' : ''}
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- Glanceable Phase Snapshot Row -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-1.5 mt-2 pt-1.5 border-top border-opacity-10" style="border-color: var(--arcade-border) !important;">
              <span class="glance-phase-pill"><i class="bi bi-compass me-1 text-primary"></i>Opening: <span class="font-monospace fw-bold">${userOpeningAcc}</span></span>
              <span class="glance-phase-pill"><i class="bi bi-shield-shaded me-1 text-warning"></i>Middle: <span class="font-monospace fw-bold">${userMiddleAcc}</span></span>
              <span class="glance-phase-pill"><i class="bi bi-flag-fill me-1 text-success"></i>Endgame: <span class="font-monospace fw-bold">${userEndAcc}</span></span>
            </div>
          </div>

          <!-- 2. Game Actions & Tools Card (Moved from under board) -->
          <div class="comic-card p-2 d-flex flex-column gap-1.5" id="review-action-tools-card">
            <div class="d-flex align-items-center justify-content-between pb-1 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
              <span class="small fw-black text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                <i class="bi bi-tools text-warning me-1.5"></i>Actions & Tools
              </span>
              <span class="text-secondary fw-semibold" style="font-size: 10.5px;">
                <i class="bi bi-hand-index-thumb me-1 text-warning"></i>Drag piece to test lines
              </span>
            </div>

            <div class="d-flex align-items-center gap-1.5 flex-wrap">
              <button type="button" class="btn btn-warning comic-btn flex-grow-1 py-1.5 px-2.5 fw-black" id="btn-key-moment" title="Jump to Next Key Moment (Space)" style="font-size: 12px;">
                <i class="bi bi-lightning-charge-fill me-1"></i>Key Moment
              </button>

              ${this.getUserMistakePlies().length > 0 ? `
                <button type="button" class="btn btn-danger comic-btn flex-grow-1 py-1.5 px-2.5 fw-black" id="btn-retry-mistakes" title="Interactive Puzzle Mode: Replay your mistakes and find the best moves" style="font-size: 12px;">
                  <i class="bi bi-bullseye me-1"></i>Retry Mistakes (${this.getUserMistakePlies().length})
                </button>
              ` : ''}

              <button type="button" class="btn btn-warning comic-btn flex-grow-1 py-1.5 px-2.5 fw-black text-dark" id="btn-show-win" title="Generate winning engine moves until checkmate or unstoppable win" style="font-size: 12px;">
                <i class="bi bi-trophy-fill me-1"></i>Show Win
              </button>

              <button type="button" class="btn btn-outline-primary comic-btn flex-grow-1 py-1.5 px-2.5 fw-bold" id="btn-play-from-here" title="Play against an Elo-matched Bot from this exact board position" style="font-size: 12px;">
                <i class="bi bi-robot me-1"></i>Play vs Bot
              </button>

              <button type="button" class="btn btn-light comic-btn px-2.5 py-1.5" id="btn-flip" title="Flip Board (F)" style="font-size: 12px;">
                <i class="bi bi-arrow-left-right me-1"></i>Flip
              </button>

              <button type="button" class="btn btn-xs xray-toggle-btn ${this.visionOverlay === 'heatmap' ? 'active' : ''} py-1.5 px-2" data-vision-toggle="heatmap" data-iq-tip="xray_heatmap" title="Show White vs Black square control intensity across all 64 squares">
                🔥 Control Map
              </button>
            </div>
          </div>

          <!-- 3. Advantage Timeline Line Graph -->
          <div class="comic-card-sm p-2" id="advantage-chart-area"></div>

          <!-- 4. Move History (Collapsed by Default) -->
          <div class="comic-card p-2" id="review-moves-card">
            <div class="d-flex align-items-center justify-content-between cursor-pointer collapsed py-1 px-1" data-bs-toggle="collapse" data-bs-target="#collapse-moves-history" aria-expanded="false" aria-controls="collapse-moves-history" id="header-toggle-moves">
              <div class="d-flex align-items-center gap-1.5">
                <i class="bi bi-list-ol text-warning"></i>
                <span class="small fw-black text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Moves</span>
                <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${Math.ceil((this.game.plies?.length || 0) / 2)} moves</span>
                <span class="text-secondary small ms-1 collapse-hint-text" style="font-size: 10px;"></span>
              </div>
              <i class="bi bi-chevron-down text-secondary collapse-chevron" style="font-size: 12px;"></i>
            </div>

            <div class="collapse" id="collapse-moves-history">
              <div class="pt-2 border-top border-opacity-10 mt-1" style="border-color: var(--arcade-border) !important;">
                <div class="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-1">
                  <div class="btn-group btn-group-sm" role="group" aria-label="Move filter">
                    <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'all' ? 'active' : ''}" data-move-filter="all">All</button>
                    <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'key' ? 'active' : ''}" data-move-filter="key" title="Brilliant, Great, Inaccuracy, Mistake, Blunder, Missed Win">Key</button>
                    <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'errors' ? 'active' : ''}" data-move-filter="errors" title="Inaccuracies, Mistakes, Blunders, Missed Wins">Errors</button>
                  </div>
                  <span class="text-secondary font-monospace" style="font-size: 10px;">Click any move to jump</span>
                </div>
                <div class="move-history-container">
                  <table class="table table-sm table-hover align-middle mb-0" style="font-size: 12px;">
                    <tbody id="move-history-tbody">
                      ${this.buildMoveTableRows()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mount Board (Interactive for What-If Sandbox & Retry Mistakes Puzzle Mode)
    const mount = this.container.querySelector('#review-board-mount');
    this.board = new Chessboard(mount, {
      fen: this.game.initialFen,
      orientation: this.orientation,
      theme: this.theme,
      interactive: true,
      legalMovesFrom: (sq) => this.legalMovesFrom(sq),
      onMove: (from, to) => this.handleBoardMove(from, to),
      showPlayerBars: true,
      whiteName: this.game.white || 'White',
      blackName: this.game.black || 'Black',
      showBestMove: true,
      showLoosePieces: this.showLoosePieces,
    });

    // Bind Navigation Buttons
    const bindNavBtn = (id, fn) => {
      this.container.querySelector(id)?.addEventListener('click', (e) => {
        fn();
        e.currentTarget?.blur();
      });
    };

    bindNavBtn('#btn-first', () => this.goToPly(0));
    bindNavBtn('#btn-prev', () => this.goToPly(this.currentPly - 1));
    bindNavBtn('#btn-next', () => this.goToPly(this.currentPly + 1));
    bindNavBtn('#btn-last', () => this.goToPly(this.game.plies.length));
    bindNavBtn('#btn-key-moment', () => this.nextKeyMoment());
    bindNavBtn('#btn-retry-mistakes', () => this.startRetryMistakes());
    bindNavBtn('#btn-show-win', () => {
      if (typeof openWinningPathModal === 'function') {
        openWinningPathModal(this);
      }
    });
    bindNavBtn('#btn-play-from-here', () => this.playFromCurrentPosition());
    bindNavBtn('#btn-flip', () => {
      this.orientation = this.orientation === 'w' ? 'b' : 'w';
      this.updateBoardAndControls();
    });

    // Bind Coaching Callout Cards
    this.container.querySelectorAll('[data-callout-ply]').forEach((card) => {
      card.addEventListener('click', () => {
        const ply = parseInt(card.getAttribute('data-callout-ply'), 10);
        if (!isNaN(ply)) this.goToPly(ply);
      });
    });

    // Bind Board Vision X-Ray Toggles
    this.container.querySelectorAll('[data-vision-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-vision-toggle');
        if (mode) this.toggleVisionOverlay(mode);
      });
    });

    // Auto-scroll active move row into view when Moves history is expanded
    const collapseMoves = this.container.querySelector('#collapse-moves-history');
    if (collapseMoves) {
      collapseMoves.addEventListener('shown.bs.collapse', () => {
        const scrollContainer = this.container.querySelector('.move-history-container');
        const activeRow = this.container.querySelector(`.move-list-row[data-ply="${this.currentPly}"]`);
        if (scrollContainer && activeRow) {
          const rowTop = activeRow.offsetTop;
          const rowHeight = activeRow.offsetHeight;
          const containerHeight = scrollContainer.clientHeight;
          scrollContainer.scrollTop = Math.max(0, rowTop - (containerHeight / 2) + (rowHeight / 2));
        }
      });
    }

    // Bind Move History Filter Pills
    this.container.querySelectorAll('[data-move-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-move-filter') || 'all';
        this.moveFilter = filter;
        this.container.querySelectorAll('[data-move-filter]').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-move-filter') === filter);
        });
        const tbody = this.container.querySelector('#move-history-tbody');
        if (tbody) {
          tbody.innerHTML = this.buildMoveTableRows();
          this.bindMoveTableRowClicks();
          this.updateBoardAndControls();
        }
      });
    });

    this.container.querySelector('#btn-reanalyze-review')?.addEventListener('click', () => {
      if (this.game && this.onReanalyzeGame) {
        this.onReanalyzeGame(this.game.pgn || this.game.id, this.game.userColor || 'w');
      }
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

    this.container.querySelector('#btn-open-full-report-modal')?.addEventListener('click', () => {
      this.openDetailedPerformanceModal();
    });

    this.container.querySelectorAll('[data-filter-jump]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const cls = chip.getAttribute('data-filter-jump');
        const userColor = this.game?.userColor || 'w';
        const target = (this.game?.plies || []).find((p) => p && p.classification === cls && (p.color === userColor));
        if (target && typeof target.ply === 'number') {
          this.goToPly(target.ply);
        }
      });
    });

    this.container.querySelector('#btn-share-game-link')?.addEventListener('click', (e) => {
      this.shareGameReviewLink(e.currentTarget);
    });

    this.bindMoveTableRowClicks();
    this.renderAdvantageChart();
    this.updateBoardAndControls();
    this.setupEvalBarObserver();
  }

  bindMoveTableRowClicks() {
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        const ply = parseInt(e.currentTarget.dataset.ply, 10);
        if (!isNaN(ply)) this.goToPly(ply);
      });
    });
  }

  matchesMoveFilter(plyObj) {
    if (!plyObj) return false;
    if (this.moveFilter === 'key') {
      return ['brilliant', 'great', 'inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(plyObj.classification);
    }
    if (this.moveFilter === 'errors') {
      return ['inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(plyObj.classification);
    }
    return true;
  }

  renderMoveCellContent(plyObj) {
    if (!plyObj) return '';
    const timeStr = this.formatTimeSpent(plyObj.timeSpent);
    let clockIndicator = '';
    if (plyObj.isImpulsive) {
      clockIndicator = `<span class="text-danger ms-1" title="Rushed move (${timeStr || 'fast'})" style="font-size: 10px;">⚡</span>`;
    } else if (plyObj.isTimeTrouble) {
      clockIndicator = `<span class="text-warning ms-1" title="Time trouble (${this.formatClock(plyObj.clockSeconds)})" style="font-size: 10px;">🔥</span>`;
    } else if (timeStr) {
      clockIndicator = `<span class="text-secondary opacity-75 ms-1 font-monospace" style="font-size: 10px;">${timeStr}</span>`;
    }

    return `
      <div class="d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-baseline min-w-0">
          <span class="font-monospace">${plyObj.san || '-'}</span>
          ${clockIndicator}
        </div>
        ${this.renderMiniBadge(plyObj.classification)}
      </div>
    `;
  }

  buildMoveTableRows() {
    if (!this.game || !Array.isArray(this.game.plies) || this.game.plies.length === 0) {
      return `
        <tr>
          <td colspan="3" class="text-center text-secondary py-4 small fw-bold">
            <i class="bi bi-info-circle me-1"></i>No moves recorded for this game.
          </td>
        </tr>
      `;
    }
    const plies = this.game.plies;
    let html = '';
    let matchCount = 0;

    for (let i = 0; i < plies.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whitePly = plies[i];
      const blackPly = plies[i + 1] || null;
      if (!whitePly) continue;

      const showWhite = this.matchesMoveFilter(whitePly);
      const showBlack = blackPly ? this.matchesMoveFilter(blackPly) : false;

      if (!showWhite && !showBlack) continue;
      matchCount++;

      html += `
        <tr>
          <td class="text-secondary fw-bold text-end" style="width: 38px;">${moveNum}.</td>
          ${showWhite ? `
            <td class="move-list-row cursor-pointer rounded px-2 py-1" data-ply="${whitePly.ply}">
              ${this.renderMoveCellContent(whitePly)}
            </td>
          ` : '<td class="text-secondary opacity-25 font-monospace px-2 py-1">...</td>'}
          ${blackPly && showBlack ? `
            <td class="move-list-row cursor-pointer rounded px-2 py-1" data-ply="${blackPly.ply}">
              ${this.renderMoveCellContent(blackPly)}
            </td>
          ` : '<td></td>'}
        </tr>
      `;
    }

    if (matchCount === 0) {
      return `
        <tr>
          <td colspan="3" class="text-center text-secondary py-4 small fw-bold">
            <i class="bi bi-funnel me-1"></i>No moves match the "${insEscape(this.moveFilter)}" filter.
          </td>
        </tr>
      `;
    }

    return html;
  }

  renderMiniBadge(cls) {
    if (!cls || cls === 'good') return '';
    const dict = COMIC_DICTIONARY[cls];
    if (!dict) return '';
    const isMultiChar = String(dict.symbol).length > 1;
    return `
      <span class="badge mini-move-badge ${isMultiChar ? 'multi-char' : ''} rounded-circle d-inline-flex align-items-center justify-content-center"
        title="${dict.words[0]} (${dict.standardLabel})"
        style="width: 22px; height: 22px; font-size: ${isMultiChar ? '10px' : '11px'}; font-weight: 800; ${isMultiChar ? 'letter-spacing: -0.6px;' : ''} background-color: ${dict.bg}; color: ${dict.text};">
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
          <div class="d-flex align-items-center justify-content-between py-1 px-2 rounded cursor-help move-quality-row ${hasAny ? 'has-moves' : 'no-moves'}" data-iq-tip="badge_${cls}">
            <span class="font-monospace fw-black fs-6 text-end ${userCnt > 0 ? 'text-warning' : 'move-count-zero'}" style="width: 42px;">
              ${userCnt}
            </span>
            <span class="badge rounded-pill move-quality-badge d-inline-flex align-items-center gap-1.5"
              style="background-color: ${dict.bg}; color: ${dict.text};">
              <span class="fs-6 lh-1">${dict.symbol}</span>
              <span>${dict.words[0]}</span>
            </span>
            <span class="font-monospace fw-black fs-6 text-start ${oppCnt > 0 ? 'text-cyan' : 'move-count-zero'}" style="width: 42px;">
              ${oppCnt}
            </span>
          </div>
        `;
      })
      .join('');
  }
}
