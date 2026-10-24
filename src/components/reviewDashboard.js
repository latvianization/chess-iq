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
    this.isThreatActive = false;
    this.visionOverlay = 'none'; // 'none' | 'hanging' | 'heatmap'
    this.moveFilter = 'all'; // 'all' | 'key' | 'errors'
    this.sandboxState = null;
    this.retryPuzzleState = null;
    this.guessMoveState = null;
    this.board = null;
    this.analysisStartTime = null;
    this.advantagePoints = [];
    this.advantageMidY = 42;

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

  setTheme(newTheme) {
    this.theme = newTheme;
    if (this.board) {
      this.board.setProps({ theme: newTheme });
    }
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
    this.isThreatActive = false;
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
    if (this.retryPuzzleState?.active) {
      return this.retryPuzzleState.boardFen;
    }
    if (this.guessMoveState?.active) {
      return this.guessMoveState.boardFen;
    }
    if (this.sandboxState?.fen) {
      return this.sandboxState.fen;
    }
    const cur = this.getCurrentEval();
    return cur ? cur.fen : (this.game ? this.game.initialFen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
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
    this.visionOverlay = this.visionOverlay === mode ? 'none' : mode;
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

  toggleThreat() {
    this.isThreatActive = !this.isThreatActive;
    this.updateBoardAndControls();
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
      const normKey = normalizeFenKey(fen);
      const cached = FEN_EVAL_CACHE.get(`${normKey}_deep`) || FEN_EVAL_CACHE.get(`${normKey}_fast`) || FEN_EVAL_CACHE.get(fen);
      let bestUci = cached?.bestMoveUci;
      let secondUci = cached?.secondBestMoveUci;

      if (!bestUci) {
        const local = findBestMoveLocal(fen, 2);
        bestUci = local.bestMoveUci;
        secondUci = local.secondBestMoveUci;
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

    if (isBlindActive) {
      bestMove = null;
      secondBestMove = null;
    } else if (isSandboxMode) {
      const sbBestUci = this.sandboxState.evalResult?.bestMoveUci;
      bestMove = sbBestUci && sbBestUci.length >= 4
        ? { from: sbBestUci.slice(0, 2), to: sbBestUci.slice(2, 4) }
        : null;
      secondBestMove = null;
    } else if (cur) {
      const isOptimal = ['best', 'brilliant', 'great', 'book'].includes(cur.classification);
      let bestUci = cur.bestMoveUci;
      let secondUci = cur.secondBestMoveUci;

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

    const threatMove = !isBlindActive && !isSandboxMode && this.isThreatActive && cur?.threat?.uci && cur.threat.uci.length >= 4
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
        const bestSan = cur.bestMoveSan || (bestMove ? `${bestMove.from}-${bestMove.to}` : '');
        const secondSan = cur.secondBestMoveSan;
        const clockStr = this.formatClock(cur.clockSeconds ?? cur.clock);
        const spentStr = this.formatTimeSpent(cur.timeSpent);
        const motifs = (Array.isArray(cur.motifs) && cur.motifs.length > 0)
          ? cur.motifs
          : (typeof detectTacticalMotifs === 'function'
              ? detectTacticalMotifs(cur.fenBefore, cur.fen, { color: cur.color }, cur.bestMoveUci, cur.pv, cur.mate, cur.classification, cur.ply)
              : []);

        stripEl.innerHTML = `
          <div class="d-flex align-items-center flex-wrap gap-1.5">
            <span class="badge border border-dark rounded-pill px-2.5 py-1" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 900; font-size: 11px;">
              ${comic.symbol} ${comic.term}
            </span>
            <span class="font-monospace fw-black fs-5">${cur.san}</span>
            <span class="badge bg-body-tertiary text-secondary font-monospace fw-bold">${evalStr}</span>

            ${isSuboptimal && bestSan && bestSan !== cur.san ? `
              <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace fw-bold px-2 py-1" title="Top Engine Move (Thick Arrow)">
                ★ Best: ${bestSan}
              </span>
            ` : ''}

            ${isSuboptimal && secondSan && secondSan !== cur.san && secondSan !== bestSan ? `
              <span class="badge bg-body-secondary text-secondary font-monospace fw-semibold px-2 py-1" title="2nd Best Option (Thin Arrow)">
                2nd: ${secondSan}
              </span>
            ` : ''}

            ${motifs.map((m) => `
              <span class="motif-pill" style="border-color: ${m.color}; color: ${m.color}; background: ${m.color}18;" title="${insEscape(m.coachTip || m.label)}">
                ${m.icon} ${insEscape(m.label)}
              </span>
            `).join('')}

            ${clockStr ? `
              <span class="badge clock-discipline-badge font-monospace" title="Clock Remaining${spentStr ? ` (Spent ${spentStr})` : ''}">
                <i class="bi bi-stopwatch me-1"></i>${clockStr}${spentStr ? ` <span class="opacity-75">(-${spentStr})</span>` : ''}
              </span>
            ` : ''}

            ${cur.isImpulsive ? `
              <span class="badge impulsive-move-badge" title="Played in ${spentStr || '<2s'} with plenty of time on the clock">
                ⚡ Rushed (${spentStr || '<2s'})
              </span>
            ` : ''}

            ${cur.isTimeTrouble ? `
              <span class="badge time-trouble-badge" title="Played under severe time pressure (<20s left)">
                🔥 Time Trouble
              </span>
            ` : ''}
          </div>
          <div class="d-flex align-items-center gap-2">
            ${['inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(cur.classification) ? `
              <button type="button" class="btn btn-sm btn-outline-danger fw-bold comic-btn" id="btn-show-why" title="Explore what happens in the next 5 moves">
                <i class="bi bi-question-circle me-1"></i>Why ${cur.classification === 'blunder' ? 'Blunder' : (cur.classification === 'mistake' ? 'Mistake' : (cur.classification === 'missed_win' ? 'Missed Win' : 'Inaccuracy'))}?
              </button>
            ` : (cur.classification === 'brilliant' ? `
              <button type="button" class="btn btn-sm fw-bold comic-btn" id="btn-show-why" style="color: #06b6d4; border: 1px solid #06b6d4; background: rgba(6,182,212,0.08);" title="Explore why this brilliant sacrifice works">
                <i class="bi bi-gem me-1"></i>Why Brilliant?
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
        stripEl.innerHTML = `
          <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-secondary rounded-pill px-2.5 py-1">🏁 Start</span>
              <span class="small fw-bold text-secondary">Starting Position</span>
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
    const tableBtnPrev = this.container.querySelector('#table-btn-prev');
    const tableBtnNext = this.container.querySelector('#table-btn-next');

    if (btnFirst) btnFirst.disabled = isAtStart;
    if (btnPrev) btnPrev.disabled = isAtStart;
    if (tableBtnPrev) tableBtnPrev.disabled = isAtStart;
    if (btnNext) btnNext.disabled = isAtEnd;
    if (btnLast) btnLast.disabled = isAtEnd;
    if (tableBtnNext) tableBtnNext.disabled = isAtEnd;

    // Update Active Row in Move Table (scroll smoothly inside container)
    const scrollContainer = this.container.querySelector('.move-history-container');
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      const plyNum = parseInt(row.dataset.ply, 10);
      if (plyNum === this.currentPly) {
        row.classList.add('bg-warning-subtle', 'fw-black', 'border', 'border-warning');
        if (scrollContainer) {
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

    // Threat & Vision X-Ray active toggle visuals
    const threatBtn = this.container.querySelector('#btn-toggle-threat');
    if (threatBtn) {
      if (this.isThreatActive) {
        threatBtn.classList.replace('btn-outline-danger', 'btn-danger');
      } else {
        threatBtn.classList.replace('btn-danger', 'btn-outline-danger');
      }
    }

    this.container.querySelectorAll('[data-vision-toggle]').forEach((btn) => {
      const mode = btn.getAttribute('data-vision-toggle');
      btn.classList.toggle('active', this.visionOverlay === mode);
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
              <span class="small fw-bold">Move ${Math.ceil((target?.ply || 1) / 2)}: You played <span class="text-danger font-monospace fw-black">${insEscape(target?.san || '?')}</span></span>
            </div>
            <div class="d-flex align-items-center gap-1.5">
              <button type="button" class="btn btn-sm btn-outline-warning comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-hint" style="font-size: 11px;">
                <i class="bi bi-lightbulb-fill me-1"></i>Hint
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-solution" style="font-size: 11px;">
                <i class="bi bi-eye-fill me-1"></i>Solution
              </button>
              <button type="button" class="btn btn-sm btn-dark comic-btn py-0.5 px-2 fw-bold" id="btn-puzzle-exit" style="font-size: 11px;">
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

  updatePositionalPillars(fen) {
    const el = this.container.querySelector('#positional-pillars-area');
    if (!el || typeof computePositionalPillars !== 'function') return;
    const p = computePositionalPillars(fen);
    const items = [
      { icon: '⚖️', title: 'Material', data: p.material },
      { icon: '⚡', title: 'Piece Activity', data: p.activity },
      { icon: '🛡️', title: 'King Safety', data: p.kingSafety },
      { icon: '♟️', title: 'Pawn Structure', data: p.pawnStructure }
    ];

    el.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-1.5 px-1">
        <span class="small fw-black text-uppercase" style="font-size: 10px; letter-spacing: 0.5px;">
          <i class="bi bi-sliders me-1 text-info"></i>4-Pillar Positional X-Ray
        </span>
        <span class="text-secondary font-monospace" style="font-size: 10px;">⚪ White vs ⚫ Black</span>
      </div>
      <div class="row g-1.5">
        ${items.map((it) => `
          <div class="col-6">
            <div class="p-1.5 rounded" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
              <div class="d-flex align-items-center justify-content-between mb-1" style="font-size: 10px;">
                <span class="fw-bold">${it.icon} ${it.title}</span>
                <span class="font-monospace text-secondary fw-semibold">${insEscape(it.data.label)}</span>
              </div>
              <div class="positional-pillar-track">
                <div class="positional-pillar-white" style="width: ${it.data.white}%;"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
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
          ${mistakes.length > 0 ? `
            <button type="button" class="btn btn-sm btn-danger comic-btn fw-black py-1 px-2.5" id="btn-coach-drill-mistakes" style="font-size: 11px;">
              <i class="bi bi-bullseye me-1"></i>Drill ${mistakes.length} Mistake${mistakes.length > 1 ? 's' : ''}
            </button>
          ` : ''}
          <button type="button" class="btn btn-sm btn-primary comic-btn fw-black py-1 px-2.5" id="btn-coach-guess-move" style="font-size: 11px;">
            <i class="bi bi-question-diamond-fill me-1"></i>Guess the Move Mode
          </button>
          <button type="button" class="btn btn-sm btn-warning text-dark comic-btn fw-black py-1 px-2.5" id="btn-coach-blunder-bank" style="font-size: 11px;">
            <i class="bi bi-bank2 me-1"></i>Blunder Bank (${bankStats.total})
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold py-1 px-2.5" id="btn-coach-practice-bot" data-practice-ply="${practicePly}" style="font-size: 11px;">
            <i class="bi bi-robot me-1"></i>Practice Key Position vs Bot
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
        <div class="why-dialog p-3 p-md-4 shadow-lg" style="max-width: 780px; width: 100%; max-height: 94vh; overflow-y: auto; border-radius: 1.25rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);">
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
                    ${curPuzzle.mastered ? `<span class="badge bg-success"><i class="bi bi-check2-all me-1"></i>Mastered</span>` : `<span class="badge bg-warning text-dark">Needs Practice</span>`}
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

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
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
              <span class="badge bg-danger text-white fw-black" style="font-size: 10px;">
                <i class="bi bi-lightning-fill me-1"></i>GAME TURNING POINT
              </span>
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
              <span class="badge bg-warning text-dark fw-black" style="font-size: 10px;">
                <i class="bi bi-book-half me-1"></i>LEFT OPENING BOOK
              </span>
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

    const cachedIndex = getCacheIndex();
    cachedIndex.forEach((item) => {
      seenIds.add(item.id || item.key);
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
        savedAt: item.savedAt || 0
      });
    });

    try {
      const savedImport = JSON.parse(localStorage.getItem('chess_iq_imported_games') || 'null');
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
              savedAt: g.endTime || 0
            });
          }
        });
      }
    } catch {}

    return list;
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
          <div class="max-w-2xl mx-auto my-4 w-100">
            <div class="d-flex align-items-center justify-content-between mb-3 px-1">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-warning text-dark border border-dark rounded-pill px-2.5 py-1 fw-bold" style="font-size: 12px;">
                  <i class="bi bi-clock-history me-1"></i>Saved Games (${savedGames.length})
                </span>
                <span class="small text-secondary fw-bold">From local storage</span>
              </div>
              <button type="button" class="btn btn-outline-danger btn-sm py-1 px-2.5 comic-btn fw-bold" id="zero-btn-clear-history" style="font-size: 11px;">
                <i class="bi bi-trash3 me-1"></i>Clear All
              </button>
            </div>

            <div class="d-flex flex-column gap-2.5">
              ${savedGames.map((item, idx) => {
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

                return `
                  <div class="comic-card p-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 ${cardBorder}" data-saved-game-idx="${idx}" style="cursor: pointer;">
                    <div class="d-flex align-items-center gap-3">
                      <div class="flex-shrink-0 text-center" style="min-width: 58px;">
                        ${resultBadge}
                      </div>
                      <div class="d-flex flex-column">
                        <div class="d-flex align-items-center gap-1.5 flex-wrap">
                          <span class="fw-bold">${insEscape(item.white)}</span>
                          <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 11px;">${insEscape(item.whiteElo)}</span>
                          <span class="text-secondary small fw-bold">vs</span>
                          <span class="fw-bold">${insEscape(item.black)}</span>
                          <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 11px;">${insEscape(item.blackElo)}</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-1 text-secondary small flex-wrap">
                          <span><i class="bi bi-person-fill me-0.5"></i>Playing ${isUserWhite ? 'White' : 'Black'}</span>
                          ${item.ecoName || item.eco ? `<span>• <i class="bi bi-book me-0.5"></i>${insEscape(item.ecoName || item.eco)}</span>` : ''}
                          ${item.timeControl ? `<span>• <i class="bi bi-clock me-0.5"></i>${insEscape(item.timeControl)}</span>` : ''}
                          ${item.date ? `<span>• ${insEscape(item.date)}</span>` : ''}
                        </div>
                      </div>
                    </div>
                    <div class="d-flex align-items-center gap-2 flex-shrink-0 justify-content-end">
                      ${item.type === 'analyzed' ? `
                        <div class="text-end me-1 d-none d-sm-block">
                          <div class="fw-black text-warning font-monospace fs-6">${item.accuracy}%</div>
                          <div class="text-secondary small font-monospace" style="font-size: 11px;">${item.elo} Perf</div>
                        </div>
                        <button type="button" class="btn btn-warning btn-sm comic-btn fw-bold px-3 py-1.5" data-action-review="${idx}">
                          <i class="bi bi-search me-1"></i>Review
                        </button>
                      ` : `
                        <button type="button" class="btn btn-outline-warning btn-sm comic-btn fw-bold px-3 py-1.5" data-action-analyze="${idx}">
                          <i class="bi bi-lightning-charge-fill me-1"></i>Analyze
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
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

      this.container.querySelectorAll('[data-saved-game-idx]').forEach((card) => {
        card.addEventListener('click', () => {
          const idx = parseInt(card.getAttribute('data-saved-game-idx'), 10);
          const item = savedGames[idx];
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

    // Active Review Dashboard
    this.container.innerHTML = `
      <div class="row g-3 g-lg-4">
        <!-- Left: Board Column -->
        <div class="col-12 col-lg-6 col-xl-5 mobile-sticky-top">
          <!-- PV Banner (Tactical line playback) -->
          <div id="pv-banner-area" class="d-none"></div>

          <div class="d-flex align-items-stretch justify-content-center gap-2 gap-sm-3 mb-2">
            <!-- Vertical Animated Eval Bar -->
            <div class="eval-bar-wrapper flex-shrink-0" id="eval-bar">
              <div class="eval-white-fill"></div>
              <div class="eval-score-badge text-white">0.0</div>
            </div>

            <!-- Chessboard Mount -->
            <div class="flex-grow-1 d-flex justify-content-center" id="review-board-mount"></div>
          </div>

          <!-- Move Notation & Comic Sound Effect Strip -->
          <div class="comic-card-sm p-2.5 mb-2 d-flex align-items-center justify-content-between" id="review-move-strip"></div>

          <!-- Step Navigation Bar -->
          <div class="comic-card-sm p-2 d-flex flex-column gap-2 mb-2">
            <!-- Row 1: Big Thumb-Friendly Step Controls -->
            <div class="d-flex align-items-center justify-content-between gap-1.5">
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-first" title="First Move (Home / Ctrl+←)">
                <i class="bi bi-chevron-bar-left fs-6"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-prev" title="Previous Move (← / ↑ Arrow)">
                <i class="bi bi-chevron-left fs-5 fw-black me-1"></i><span class="small fw-black d-none sm:inline">Prev</span>
              </button>

              <span class="badge bg-secondary font-monospace px-2.5 sm:px-3 py-2 fs-6 fw-bold flex-shrink-0" id="ply-counter">0 / 0</span>

              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-next" title="Next Move (→ / ↓ Arrow)">
                <span class="small fw-black d-none sm:inline me-1">Next</span><i class="bi bi-chevron-right fs-5 fw-black"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-last" title="Last Move (End / Ctrl+→)">
                <i class="bi bi-chevron-bar-right fs-6"></i>
              </button>
            </div>

            <!-- Row 2: Actions (Key Moment, Retry Mistakes, Play From Here, Threat, Flip) -->
            <div class="d-flex align-items-center justify-content-between gap-1.5 flex-wrap">
              <button type="button" class="btn btn-warning comic-btn flex-grow-1 py-1.5 px-2 fw-black" id="btn-key-moment" title="Next Key Moment (Space)" style="font-size: 12px;">
                <i class="bi bi-lightning-charge-fill me-1"></i>Key Moment
              </button>
              ${this.getUserMistakePlies().length > 0 ? `
                <button type="button" class="btn btn-danger comic-btn flex-grow-1 py-1.5 px-2 fw-black" id="btn-retry-mistakes" title="Interactive Puzzle Mode: Replay your mistakes and find the best moves" style="font-size: 12px;">
                  <i class="bi bi-bullseye me-1"></i>Retry Mistakes (${this.getUserMistakePlies().length})
                </button>
              ` : ''}
              <button type="button" class="btn btn-outline-primary comic-btn py-1.5 px-2 fw-bold" id="btn-play-from-here" title="Play against an Elo-matched Bot from this exact board position" style="font-size: 12px;">
                <i class="bi bi-robot me-1"></i>Play From Here
              </button>
              <button type="button" class="btn btn-outline-danger comic-btn px-2 py-1.5" id="btn-toggle-threat" title="Toggle Threat Arrow" style="font-size: 12px;">
                <i class="bi bi-shield-slash"></i>
              </button>
              <button type="button" class="btn btn-light comic-btn px-2 py-1.5" id="btn-flip" title="Flip Board (F)" style="font-size: 12px;">
                <i class="bi bi-arrow-left-right"></i>
              </button>
            </div>

            <!-- Row 3: Board Vision X-Ray Overlays & Keyboard Hint -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-1.5 pt-1 border-top px-1" style="font-size: 11px; border-color: var(--arcade-border) !important;">
              <div class="d-flex align-items-center gap-1.5">
                <span class="text-secondary fw-bold"><i class="bi bi-eye-fill me-1 text-info"></i>X-Ray:</span>
                <button type="button" class="btn btn-xs xray-toggle-btn ${this.visionOverlay === 'hanging' ? 'active' : ''}" data-vision-toggle="hanging" title="Highlight undefended (loose) and hanging pieces on the board">
                  🛡️ Loose Pieces
                </button>
                <button type="button" class="btn btn-xs xray-toggle-btn ${this.visionOverlay === 'heatmap' ? 'active' : ''}" data-vision-toggle="heatmap" title="Show White vs Black square control intensity across all 64 squares">
                  🔥 Control Map
                </button>
              </div>
              <span class="text-secondary fw-semibold"><i class="bi bi-hand-index-thumb me-1 text-warning"></i>Drag pieces to explore</span>
            </div>
          </div>

          <!-- Advantage Timeline Line Graph -->
          <div class="comic-card-sm p-2 mb-2" id="advantage-chart-area"></div>

          <!-- 4-Pillar Positional X-Ray Breakdown -->
          <div class="comic-card-sm p-2 mb-2" id="positional-pillars-area"></div>
        </div>

        <!-- Right: Move List & Performance Stats in Columns on Desktop -->
        <div class="col-12 col-lg-6 col-xl-7 d-flex flex-column gap-3">
          <!-- Match Overview & Player VS Player Header Card -->
          <div class="comic-card p-3">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-warning text-dark font-monospace fw-black px-2 py-1">${this.game.ecoCode || 'PGN'}</span>
                <span class="fw-bold small text-truncate" style="max-width: 260px;">${this.game.ecoName || 'Chess Match'}</span>
                <span class="text-secondary small font-monospace d-none sm:inline">· ${this.game.date || ''}</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-outline-secondary comic-btn fw-bold px-2 py-1" id="btn-reanalyze-review" title="Run fresh deep Stockfish analysis">
                  <i class="bi bi-arrow-repeat me-1"></i>Re-analyze
                </button>
                <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-2 py-1" id="btn-share-review" title="Copy Review Summary to Clipboard">
                  <i class="bi bi-share me-1"></i>Share
                </button>
              </div>
            </div>

            <!-- Player VS Player Cards Row -->
            <div class="row g-2 align-items-center">
              <!-- White Player -->
              <div class="col-5">
                <div class="p-2 rounded d-flex flex-column gap-1" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
                  <div class="d-flex align-items-center gap-1.5 min-w-0">
                    <span class="fs-6 lh-1">⚪</span>
                    <span class="fw-black small text-truncate ${isWhiteUser ? 'text-warning' : 'text-body'}">${whiteName}</span>
                    ${isWhiteUser ? '<span class="badge bg-warning text-dark fw-bold px-1 py-0.5" style="font-size: 8px;">YOU</span>' : ''}
                  </div>
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 font-monospace" style="font-size: 11px;">
                    <span class="text-secondary">${whiteElo} Elo</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">⭐ ${whiteGameElo}</span>
                    <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold">🎯 ${whiteAcc}%</span>
                  </div>
                </div>
              </div>

              <!-- Center VS & Result -->
              <div class="col-2 text-center">
                <div class="d-flex flex-column align-items-center justify-content-center">
                  <span class="badge ${this.game.result === '1-0' ? 'bg-success' : this.game.result === '0-1' ? 'bg-danger' : 'bg-secondary'} font-monospace px-2 py-1 mb-1 fw-black" style="font-size: 13px;">
                    ${this.game.result}
                  </span>
                  <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 9px;">RESULT</span>
                </div>
              </div>

              <!-- Black Player -->
              <div class="col-5">
                <div class="p-2 rounded d-flex flex-column gap-1" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
                  <div class="d-flex align-items-center justify-content-between min-w-0">
                    <div class="d-flex align-items-center gap-1.5 min-w-0">
                      <span class="fs-6 lh-1">⚫</span>
                      <span class="fw-black small text-truncate ${!isWhiteUser ? 'text-warning' : 'text-body'}">${blackName}</span>
                      ${!isWhiteUser ? '<span class="badge bg-warning text-dark fw-bold px-1 py-0.5" style="font-size: 8px;">YOU</span>' : ''}
                    </div>
                  </div>
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 font-monospace" style="font-size: 11px;">
                    <span class="text-secondary">${blackElo} Elo</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">⭐ ${blackGameElo}</span>
                    <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold">🎯 ${blackAcc}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Coach's Study Plan: Takeaways & Active Drills -->
          ${this.buildCoachStudyPlanCard()}

          <!-- Coaching Callouts: Turning Point & Opening Deviation -->
          ${this.buildCoachingCallouts()}

          <!-- Desktop Columns: Move History & Performance Cards Side-by-Side -->
          <div class="row g-3">
            <!-- Column 1: Move History List -->
            <div class="col-12 col-md-6">
              <div class="comic-card p-3 h-100 d-flex flex-column">
                <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2 flex-wrap gap-1.5">
                  <div class="d-flex align-items-center gap-1.5">
                    <h6 class="mb-0 fw-black"><i class="bi bi-list-ol me-1 text-warning"></i>Moves</h6>
                    <div class="btn-group btn-group-sm" role="group" aria-label="Move filter">
                      <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'all' ? 'active' : ''}" data-move-filter="all">All</button>
                      <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'key' ? 'active' : ''}" data-move-filter="key" title="Brilliant, Great, Inaccuracy, Mistake, Blunder, Missed Win">Key</button>
                      <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'errors' ? 'active' : ''}" data-move-filter="errors" title="Inaccuracies, Mistakes, Blunders, Missed Wins">Errors</button>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-1">
                    <button type="button" class="btn btn-sm btn-outline-secondary py-0.5 px-1.5 comic-btn" id="table-btn-prev" title="Previous Move (← / ↑)">
                      <i class="bi bi-chevron-left"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-secondary py-0.5 px-1.5 comic-btn" id="table-btn-next" title="Next Move (→ / ↓)">
                      <i class="bi bi-chevron-right"></i>
                    </button>
                  </div>
                </div>
                <div class="move-history-container flex-grow-1" style="max-height: 480px;">
                  <table class="table table-sm table-hover align-middle mb-0" style="font-size: 13px;">
                    <tbody id="move-history-tbody">
                      ${this.buildMoveTableRows()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Column 2: Phase Accuracy & Elo Card + Quality Breakdown -->
            <div class="col-12 col-md-6">
              <div class="comic-card p-3 h-100 d-flex flex-column gap-3">
                <div class="d-flex align-items-center justify-content-between border-bottom pb-2">
                  <h6 class="mb-0 fw-black"><i class="bi bi-trophy-fill me-1.5 text-warning"></i>Game Performance</h6>
                  <span class="badge bg-body-secondary text-secondary font-monospace fw-bold" style="font-size: 11px;">You vs Opponent</span>
                </div>

                <!-- Dual Accuracy Comparison -->
                <div class="row g-2">
                  <div class="col-6">
                    <div class="arcade-stat-chip p-2 text-start">
                      <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="small fw-bold text-truncate">${isWhiteUser ? '⚪ White' : '⚫ Black'} (You)</span>
                        <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill font-monospace" style="font-size: 10px;">YOU</span>
                      </div>
                      <div class="d-flex align-items-baseline gap-1">
                        <span class="fw-black fs-4 text-success font-monospace">${userAcc}%</span>
                        <span class="text-secondary small">accuracy</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="arcade-stat-chip p-2 text-start">
                      <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="small fw-bold text-truncate">${isWhiteUser ? '⚫ Black' : '⚪ White'}</span>
                        <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill font-monospace" style="font-size: 10px;">OPP</span>
                      </div>
                      <div class="d-flex align-items-baseline gap-1">
                        <span class="fw-black fs-4 text-secondary font-monospace">${oppAcc}%</span>
                        <span class="text-secondary small">accuracy</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Phase Rating & Accuracy Comparison (Opening, Middle, Endgame) -->
                <div class="row g-2 text-center">
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1"><i class="bi bi-compass me-1 text-primary"></i>Opening</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-primary font-monospace">${userOpeningAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${userOpeningElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 28px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppOpeningAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${oppOpeningElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1"><i class="bi bi-shield-shaded me-1 text-warning"></i>Middle</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-warning font-monospace">${userMiddleAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${userMiddlegameElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 28px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppMiddleAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${oppMiddlegameElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1"><i class="bi bi-flag-fill me-1 text-success"></i>Endgame</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-success font-monospace">${userEndAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${userEndgameElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 28px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppEndAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${oppEndgameElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Move Classification Breakdown (Player vs Opponent) -->
                <div class="border-top pt-2">
                  <div class="d-flex align-items-center justify-content-between px-2 pb-1.5 text-secondary" style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
                    <span style="width: 38px;" class="text-end">YOU</span>
                    <span>MOVE QUALITY</span>
                    <span style="width: 38px;" class="text-start">OPP</span>
                  </div>
                  <div class="d-flex flex-column gap-1">
                    ${this.buildBadgesSummary()}
                  </div>
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
    bindNavBtn('#table-btn-prev', () => this.goToPly(this.currentPly - 1));
    bindNavBtn('#table-btn-next', () => this.goToPly(this.currentPly + 1));
    bindNavBtn('#btn-key-moment', () => this.nextKeyMoment());
    bindNavBtn('#btn-retry-mistakes', () => this.startRetryMistakes());
    bindNavBtn('#btn-play-from-here', () => this.playFromCurrentPosition());
    bindNavBtn('#btn-toggle-threat', () => this.toggleThreat());
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

    // Bind Coach's Study Plan Drills
    this.container.querySelector('#btn-coach-drill-mistakes')?.addEventListener('click', () => this.startRetryMistakes());
    this.container.querySelector('#btn-coach-guess-move')?.addEventListener('click', () => this.startGuessTheMove());
    this.container.querySelector('#btn-coach-blunder-bank')?.addEventListener('click', () => this.openBlunderBankModal('all'));
    this.container.querySelector('#btn-coach-practice-bot')?.addEventListener('click', (e) => {
      const ply = parseInt(e.currentTarget.getAttribute('data-practice-ply'), 10);
      this.playFromCurrentPosition(!isNaN(ply) ? ply : null);
    });

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

    this.bindMoveTableRowClicks();
    this.renderAdvantageChart();
    this.updateBoardAndControls();
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
    return `
      <span class="badge border border-dark rounded-circle d-inline-flex align-items-center justify-content-center"
        title="${dict.words[0]} (${dict.standardLabel})"
        style="width: 20px; height: 20px; font-size: 10px; background-color: ${dict.bg}; color: ${dict.text};">
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
          <div class="d-flex align-items-center justify-content-between py-1 px-2 rounded ${hasAny ? 'bg-body-tertiary bg-opacity-25' : 'opacity-50'}" style="font-size: 12px;">
            <span class="font-monospace fw-black text-end ${userCnt > 0 ? 'text-primary' : 'text-body-tertiary'}" style="width: 38px;">
              ${userCnt}
            </span>
            <span class="badge rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
              style="background-color: ${dict.bg}; color: ${dict.text}; font-size: 11px; font-weight: 800; min-width: 125px; justify-content: center;">
              <span>${dict.symbol}</span>
              <span>${dict.words[0]}</span>
            </span>
            <span class="font-monospace fw-black text-start ${oppCnt > 0 ? 'text-secondary' : 'text-body-tertiary'}" style="width: 38px;">
              ${oppCnt}
            </span>
          </div>
        `;
      })
      .join('');
  }
}
