/**
 * Vanilla JS Game Review Dashboard Component
 * Displays Stockfish tournament analysis, interactive move history,
 * eval bar, phase ratings, comic sound effect badges, and tactical refutations.
 */


class ReviewDashboard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onOpenImport = options.onOpenImport || null;
    this.onBackToImportedGames = options.onBackToImportedGames || options.onOpenImport || null;
    this.onSwitchToBots = options.onSwitchToBots || null;
    this.onPlayFromFen = options.onPlayFromFen || null;
    this.onSelectGame = options.onSelectGame || null;
    this.onReanalyzeGame = options.onReanalyzeGame || null;
    this.theme = 'green';
    this.reviewTab = 'moves'; // 'moves' | 'coach'

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
    this.initTouchNavigation();
    this.render();
  }

  initTouchNavigation() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDeltaX = 0;
    let touchDeltaY = 0;
    let isBoardDrag = false;

    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDeltaX = 0;
      touchDeltaY = 0;
      isBoardDrag = Boolean(e.target.closest('#review-board-mount') && this.board?.interactive);
    }, { passive: true });

    this.container.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      touchDeltaX = e.touches[0].clientX - touchStartX;
      touchDeltaY = e.touches[0].clientY - touchStartY;
    }, { passive: true });

    this.container.addEventListener('touchend', () => {
      if (!this.game) return;
      if (document.querySelector('.modal.show') || document.querySelector('.why-modal-backdrop') || document.body.classList.contains('modal-open')) return;

      const isEdgeSwipe = touchStartX < 50;
      if ((isEdgeSwipe || !isBoardDrag) && touchDeltaX > 70 && Math.abs(touchDeltaX) > Math.abs(touchDeltaY) * 1.3) {
        if (typeof this.onBackToImportedGames === 'function') {
          this.onBackToImportedGames();
        }
      }
      touchDeltaX = 0;
      touchDeltaY = 0;
      isBoardDrag = false;
    }, { passive: true });
  }

  initKeyboardNavigation() {
    this.handleKeyDown = (e) => {
      // Don't intercept when user is typing in form controls
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable) return;

      // Don't intercept if review view is currently hidden (e.g. user in bot mode)
      const reviewView = document.getElementById('review-view');
      if (reviewView && reviewView.classList.contains('d-none')) return;

      // Don't intercept if any modal is active (Bootstrap modal, Why-blunder modal, Winning-path modal, etc.)
      if (
        document.querySelector('.modal.show') ||
        document.getElementById('why-blunder-modal') ||
        document.getElementById('winning-path-modal') ||
        document.querySelector('.why-modal-backdrop') ||
        document.body.classList.contains('modal-open')
      ) return;

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
    if (typeof handleReviewBoardMove === 'function') {
      return await handleReviewBoardMove(this, from, to);
    }
  }

  startRetryMistakes() {
    if (typeof startRetryMistakes === 'function') startRetryMistakes(this);
  }

  loadMistakeAtIndex(idx) {
    if (typeof loadMistakeAtIndex === 'function') loadMistakeAtIndex(this, idx);
  }

  showPuzzleHint() {
    if (typeof showPuzzleHint === 'function') showPuzzleHint(this);
  }

  revealPuzzleSolution() {
    if (typeof revealPuzzleSolution === 'function') revealPuzzleSolution(this);
  }

  startGuessTheMove() {
    if (typeof startGuessTheMove === 'function') startGuessTheMove(this);
  }

  loadGuessTurnAtIndex(idx) {
    if (typeof loadGuessTurnAtIndex === 'function') loadGuessTurnAtIndex(this, idx);
  }

  exitSpecialMode() {
    if (typeof exitSpecialMode === 'function') exitSpecialMode(this);
  }

  toggleVisionOverlay(mode) {
    if (typeof toggleVisionOverlay === 'function') toggleVisionOverlay(this, mode);
  }

  playFromCurrentPosition(overridePly = null) {
    if (typeof playFromCurrentPosition === 'function') playFromCurrentPosition(this, overridePly);
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
      let pgn = this.game.pgn || '';
      if (!pgn && Array.isArray(this.game.plies) && this.game.plies.length > 0) {
        const moves = this.game.plies.map(p => p.san).filter(Boolean);
        const white = this.game.white || 'White';
        const black = this.game.black || 'Black';
        const res = this.game.result || '*';
        const date = this.game.date || new Date().toISOString().split('T')[0];
        pgn = `[Event "Shared Review"]\n[White "${white}"]\n[Black "${black}"]\n[Date "${date}"]\n[Result "${res}"]\n\n` + moves.join(' ');
      }

      // Compact & sanitize PGN to strip clocks, evaluations and unnecessary headers
      const cleanPgn = this.sanitizePgnForShare(pgn) || pgn;
      const userColor = this.game.userColor || 'w';

      // Always use URL Hash fragment (#pgn=...&color=...) so data is never sent in HTTP request
      // line headers to the web server, completely avoiding HTTP 414 'URI Too Long' errors!
      const baseUrl = window.location.href.split('#')[0].split('?')[0];
      const pgnParam = encodeURIComponent(cleanPgn);
      const colorParam = encodeURIComponent(userColor);
      const shareUrl = `${baseUrl}#pgn=${pgnParam}&color=${colorParam}`;

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

  sanitizePgnForShare(pgn) {
    if (!pgn || typeof pgn !== 'string') return '';
    // Strip inline and clock comments {...}
    let text = pgn.replace(/\{[^}]*\}/g, ' ');
    // Strip semicolon comments
    text = text.replace(/;[^\r\n]*/g, ' ');

    const lines = text.split('\n');
    const allowedHeaders = /^\s*\[(Event|Site|Date|Round|White|Black|Result|WhiteElo|BlackElo|ECO|TimeControl|FEN|SetUp|BotId|BotName|BotAvatar|GameType)\b/i;
    const headers = [];
    const moveLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[')) {
        if (allowedHeaders.test(trimmed)) {
          headers.push(trimmed);
        }
      } else if (trimmed) {
        moveLines.push(trimmed);
      }
    }

    const movesText = moveLines.join(' ').replace(/\s+/g, ' ').trim();
    if (headers.length > 0) {
      return headers.join('\n') + '\n\n' + movesText;
    }
    return movesText;
  }

  closeWhyModal() {
    if (typeof closeWhyModal === 'function') closeWhyModal(this);
  }

  openWhyModal(targetEval = null) {
    if (typeof openWhyModal === 'function') return openWhyModal(this, targetEval);
  }

  closeWinningPathModal() {
    if (typeof closeWinningPathModal === 'function') closeWinningPathModal();
  }

  openWinningPathModal(plyOverride = null) {
    if (typeof openWinningPathModal === 'function') openWinningPathModal(this, plyOverride);
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
      if (cur.isForced === undefined && cur.fenBefore && typeof isForcedMove === 'function') {
        cur.isForced = isForcedMove(cur.fenBefore);
      }
      const isForced = Boolean(cur.isForced || cur.classification === 'forced');
      const isOptimal = isForced || ['best', 'brilliant', 'great', 'book', 'forced'].includes(cur.classification);
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

    const threatMove = !isBlindActive && !isSandboxMode && this.isThreatActive && cur?.threat?.uci && cur.threat.uci.length >= 4
      ? { from: cur.threat.uci.slice(0, 2), to: cur.threat.uci.slice(2, 4) }
      : null;

    const isCurForced = Boolean(cur && (cur.isForced || cur.classification === 'forced'));
    const badge = !isBlindActive && !isSandboxMode && cur ? { square: cur.to, classification: isCurForced ? 'forced' : cur.classification } : null;

    this.board?.setProps({
      fen,
      orientation: this.orientation,
      lastMove,
      bestMove,
      secondBestMove,
      threatMove,
      badge,
      visionOverlay: this.visionOverlay,
      showBestMove: !isBlindActive && this.showBestMove,
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
        const isForced = Boolean(cur.isForced || cur.classification === 'forced');
        const effectiveCls = isForced ? 'forced' : cur.classification;
        const comic = getComicBadge(effectiveCls, cur.san);
        const evalStr = cur.mate !== null
          ? `M${Math.abs(cur.mate)}`
          : (cur.scoreCp > 0 ? `+${(cur.scoreCp / 100).toFixed(1)}` : (cur.scoreCp / 100).toFixed(1));

        const isOptimal = isForced || ['best', 'brilliant', 'great', 'book', 'forced'].includes(cur.classification);
        const isSuboptimal = !isOptimal;
        const topForCur = (!cur.bestMoveSan && cur.fenBefore) ? this.getTopMovesForFen(cur.fenBefore) : null;
        const bestSan = cur.bestMoveSan || (cur.bestMoveUci && cur.bestMoveUci.length >= 4 ? `${cur.bestMoveUci.slice(0, 2)}-${cur.bestMoveUci.slice(2, 4)}` : (topForCur?.best ? `${topForCur.best.from}-${topForCur.best.to}` : ''));
        const secondSan = cur.secondBestMoveSan || (topForCur?.second ? `${topForCur.second.from}-${topForCur.second.to}` : null);
        const clockStr = this.formatClock(cur.clockSeconds ?? cur.clock);
        const spentStr = this.formatTimeSpent(cur.timeSpent);
        const motifs = (Array.isArray(cur.motifs) && cur.motifs.length > 0)
          ? cur.motifs
          : (typeof detectTacticalMotifs === 'function'
              ? detectTacticalMotifs(cur.fenBefore, cur.fen, { color: cur.color }, cur.bestMoveUci, cur.pv, cur.mate, effectiveCls, cur.ply)
              : []);

        stripEl.innerHTML = `
          <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
            <div class="d-flex align-items-center flex-wrap gap-1.5">
              <span class="badge border border-dark rounded-pill px-2.5 py-1 cursor-help" data-iq-tip="badge_${effectiveCls}" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 900; font-size: 12px;">
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
            <div class="d-flex align-items-center gap-2 ms-auto">
              ${!isForced && ['inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(cur.classification) ? `
                <button type="button" class="btn btn-sm btn-outline-danger fw-bold comic-btn" id="btn-show-why" title="Explore what happens in the next 5 moves">
                  <i class="bi bi-question-circle me-1"></i>Why?
                </button>
              ` : (!isForced && cur.classification === 'brilliant' ? `
                <button type="button" class="btn btn-sm fw-bold comic-btn" id="btn-show-why" style="color: #06b6d4; border: 1px solid #06b6d4; background: rgba(6,182,212,0.08);" title="Explore why this brilliant sacrifice works">
                  <i class="bi bi-gem me-1"></i>Why?
                </button>
              ` : '')}
            </div>
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

    // Update Active Cell & Row in Move Table (scroll smoothly inside container if visible)
    const scrollContainer = this.container.querySelector('.move-history-container');
    this.container.querySelectorAll('.move-table-row').forEach((row) => {
      row.classList.remove('table-row-selected');
    });
    this.container.querySelectorAll('.move-cell[data-row-ply]').forEach((cell) => {
      const plyNum = parseInt(cell.dataset.rowPly, 10);
      if (plyNum === this.currentPly) {
        cell.classList.add('active-cell');
        const parentRow = cell.closest('.move-table-row');
        if (parentRow) {
          parentRow.classList.add('table-row-selected');
          if (scrollContainer && scrollContainer.clientHeight > 0) {
            const rowTop = parentRow.offsetTop;
            const rowHeight = parentRow.offsetHeight;
            const containerTop = scrollContainer.scrollTop;
            const containerHeight = scrollContainer.clientHeight;
            if (rowTop < containerTop) {
              scrollContainer.scrollTop = rowTop;
            } else if (rowTop + rowHeight > containerTop + containerHeight) {
              scrollContainer.scrollTop = rowTop + rowHeight - containerHeight;
            }
          }
        }
      } else {
        cell.classList.remove('active-cell');
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

    // Vision Dropdown Badges Visuals
    const heatmapBadge = this.container.querySelector('#badge-vision-heatmap');
    if (heatmapBadge) {
      heatmapBadge.textContent = this.visionOverlay === 'heatmap' ? 'ON' : 'OFF';
      heatmapBadge.className = `badge font-monospace ${this.visionOverlay === 'heatmap' ? 'bg-warning text-dark' : 'bg-secondary'}`;
    }
    const looseBadge = this.container.querySelector('#badge-vision-loose');
    if (looseBadge) {
      looseBadge.textContent = this.showLoosePieces ? 'ON' : 'OFF';
      looseBadge.className = `badge font-monospace ${this.showLoosePieces ? 'bg-warning text-dark' : 'bg-secondary'}`;
    }
    const threatBadge = this.container.querySelector('#badge-vision-threat');
    if (threatBadge) {
      threatBadge.textContent = this.isThreatActive ? 'ON' : 'OFF';
      threatBadge.className = `badge font-monospace ${this.isThreatActive ? 'bg-warning text-dark' : 'bg-secondary'}`;
    }
    const bestBadge = this.container.querySelector('#badge-vision-best');
    if (bestBadge) {
      bestBadge.textContent = this.showBestMove ? 'ON' : 'OFF';
      bestBadge.className = `badge font-monospace ${this.showBestMove ? 'bg-warning text-dark' : 'bg-secondary'}`;
    }
  }


  updateModeBanner(cur) {
    if (typeof updateModeBanner === 'function') updateModeBanner(this, cur);
  }

  buildPositionalPillarsHtml(fen) {
    return typeof buildPositionalPillarsHtml === 'function' ? buildPositionalPillarsHtml(fen) : '';
  }

  bindPositionalPillarsEvents(el) {
    if (typeof bindPositionalPillarsEvents === 'function') bindPositionalPillarsEvents(this, el);
  }

  updatePositionalPillars(fen) {
    if (typeof updatePositionalPillars === 'function') updatePositionalPillars(this, fen);
  }

  closePillarsGuideModal() {
    if (typeof closePillarsGuideModal === 'function') closePillarsGuideModal();
  }

  openPillarsGuideModal(activeKey = null) {
    if (typeof openPillarsGuideModal === 'function') openPillarsGuideModal(this, activeKey);
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


  closeBlunderBankModal() {
    if (typeof closeBlunderBankModal === 'function') closeBlunderBankModal();
  }

  openBlunderBankModal(initialFilter = 'all') {
    if (typeof openBlunderBankModal === 'function') openBlunderBankModal(this, initialFilter);
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

      const botMatch = typeof detectBotInGame === 'function' ? detectBotInGame(item.white, item.black) : null;
      const isBotGame = Boolean(
        item.isBotGame ||
        botMatch ||
        item.botId ||
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
        timeControl: isBotGame ? '' : (item.timeControl || ''),
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

            const botMatch = typeof detectBotInGame === 'function' ? detectBotInGame(g.white, g.black) : null;
            const isBotGame = Boolean(
              g.isBotGame ||
              botMatch ||
              g.botId ||
              (g.white && (g.white.toLowerCase().includes('bot') || g.white.toLowerCase().includes('computer'))) ||
              (g.black && (g.black.toLowerCase().includes('bot') || g.black.toLowerCase().includes('computer'))) ||
              (g.pgn && (g.pgn.includes('[GameType "bot"]') || g.pgn.toLowerCase().includes('vs computer')))
            );

            let botInfo = botMatch;
            if (!botInfo && isBotGame) {
              const botRawName = isUserWhite ? g.black : g.white;
              botInfo = {
                name: g.botName || botRawName || 'Bot',
                avatar: g.botAvatar || '🤖',
                elo: isUserWhite ? g.blackElo : g.whiteElo
              };
            }

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
              timeControl: isBotGame ? '' : (g.timeControl || ''),
              savedAt: g.endTime || 0,
              isImported: true,
              isBotGame,
              botInfo
            });
          }
        });
      }
    } catch {}

    return list;
  }


  buildDetailedPerformanceHtml() {
    return typeof buildDetailedPerformanceHtml === 'function' ? buildDetailedPerformanceHtml(this) : '';
  }



  closeOpeningModal() {
    if (typeof closeOpeningModal === 'function') closeOpeningModal();
  }

  openOpeningModal() {
    if (typeof openOpeningModal === 'function') openOpeningModal(this);
  }



  closeFullReportModal() {
    if (typeof closeFullReportModal === 'function') closeFullReportModal();
  }

  openDetailedPerformanceModal() {
    if (typeof openDetailedPerformanceModal === 'function') openDetailedPerformanceModal(this);
  }

  openFullReportModal() {
    if (typeof openFullReportModal === 'function') openFullReportModal(this);
  }


  setReviewTab(tabName) {
    if (!['moves', 'coach'].includes(tabName)) return;
    this.reviewTab = tabName;
    this.container.querySelectorAll('[data-review-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-review-tab') === tabName);
    });
    this.container.querySelectorAll('.review-tab-pane').forEach((pane) => {
      pane.classList.toggle('d-none', pane.getAttribute('data-pane-tab') !== tabName);
    });
    if (tabName === 'moves') {
      setTimeout(() => this.renderAdvantageChart(), 10);
    }
  }

  downloadAnnotatedPgn() {
    if (!this.game) return;
    const lines = [];
    lines.push(`[Event "${this.game.event || 'Chess IQ Review'}"]`);
    lines.push(`[Site "${this.game.site || 'Chess IQ'}"]`);
    lines.push(`[Date "${this.game.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.')}"]`);
    lines.push(`[White "${this.game.white || 'White'}"]`);
    lines.push(`[Black "${this.game.black || 'Black'}"]`);
    lines.push(`[Result "${this.game.result || '*'}"]`);
    if (this.game.whiteElo) lines.push(`[WhiteElo "${this.game.whiteElo}"]`);
    if (this.game.blackElo) lines.push(`[BlackElo "${this.game.blackElo}"]`);
    if (this.game.ecoCode) lines.push(`[ECO "${this.game.ecoCode}"]`);
    if (this.game.ecoName) lines.push(`[Opening "${this.game.ecoName}"]`);
    lines.push(`[Annotator "Stockfish 16 (Chess IQ)"]`);
    lines.push('');

    let movesText = '';
    const glyphMap = {
      blunder: '??',
      mistake: '?',
      inaccuracy: '?!',
      great: '!',
      brilliant: '!!',
      missed_win: '??'
    };

    (this.game.plies || []).forEach((p, idx) => {
      if (!p) return;
      const moveNum = Math.floor(idx / 2) + 1;
      const isWhite = idx % 2 === 0;

      if (isWhite) {
        movesText += `${moveNum}. `;
      } else if (idx === 0) {
        movesText += `${moveNum}... `;
      }

      movesText += p.san;
      if (glyphMap[p.classification]) {
        movesText += glyphMap[p.classification];
      }

      let evalComment = '';
      if (p.mate !== null && p.mate !== undefined) {
        evalComment = `[%eval #${p.mate}]`;
      } else if (p.scoreCp !== null && p.scoreCp !== undefined) {
        const val = (p.scoreCp / 100).toFixed(2);
        const sign = p.scoreCp > 0 ? '+' : '';
        evalComment = `[%eval ${sign}${val}]`;
      }

      if (['blunder', 'mistake', 'inaccuracy', 'missed_win'].includes(p.classification) && p.bestMoveSan && p.bestMoveSan !== p.san) {
        evalComment = `${evalComment} (Best: ${p.bestMoveSan})`.trim();
      }

      if (evalComment) {
        movesText += ` { ${evalComment} }`;
      }
      movesText += ' ';
    });

    movesText += this.game.result || '*';
    lines.push(movesText);
    const content = lines.join('\n');

    const blob = new Blob([content], { type: 'application/x-chess-pgn;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeW = (this.game.white || 'White').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeB = (this.game.black || 'Black').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.href = url;
    a.download = `chess_iq_${safeW}_vs_${safeB}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    soundService.playSuccess();
  }

  copyCurrentFen() {
    const fen = this.getActiveBoardFen();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fen).then(() => {
        soundService.playSuccess();
        alert('FEN copied to clipboard!\n\n' + fen);
      });
    } else {
      prompt('Copy board FEN:', fen);
    }
  }

  renderCoachTabHtml(userCounts, userOpeningAcc, userMiddleAcc, userEndAcc, userOpeningElo, userMiddlegameElo, userEndgameElo) {
    const userColor = this.game?.userColor || 'w';
    const userPlies = (this.game?.plies || []).filter((p) => p && p.color === userColor);

    let timedMoves = 0;
    let totalTime = 0;
    let impulsiveCount = 0;
    let timeTroubleCount = 0;

    userPlies.forEach((p) => {
      if (p.timeSpent !== null && p.timeSpent !== undefined) {
        timedMoves++;
        totalTime += p.timeSpent;
      }
      if (p.isImpulsive) impulsiveCount++;
      if (p.isTimeTrouble && ['blunder', 'mistake', 'missed_win'].includes(p.classification)) timeTroubleCount++;
    });

    const avgTime = timedMoves > 0 ? (totalTime / timedMoves).toFixed(1) : null;
    const totalErrors = (userCounts.blunder || 0) + (userCounts.mistake || 0) + (userCounts.missed_win || 0);

    return `
      <!-- 1. Key Moments Chips -->
      <div class="comic-card p-2.5 mb-2">
        <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
          <span class="small fw-black text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
            <i class="bi bi-lightning-charge-fill text-warning me-1"></i>Key Moments
          </span>
          <span class="text-secondary small font-monospace" style="font-size: 10px;">Click to jump</span>
        </div>
        <div class="d-flex align-items-center flex-wrap gap-1.5">
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
          ${totalErrors === 0 && (userCounts.best || 0) > 0 ? `
            <span class="badge bg-success-subtle text-success border border-success fw-bold px-2 py-1">
              🌟 Impeccable Play! Zero Tactical Errors.
            </span>
          ` : ''}
        </div>
      </div>

      <!-- 2. Phase Accuracy Snapshot -->
      <div class="comic-card p-2.5 mb-2">
        <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
          <span class="small fw-black text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
            <i class="bi bi-diagram-3-fill text-warning me-1"></i>Phase Accuracy (You)
          </span>
          ${typeof renderInfoIcon === 'function' ? renderInfoIcon('card_phase_accuracy') : ''}
        </div>
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-1.5">
          <div class="glance-phase-pill p-2 flex-grow-1 text-center cursor-help" data-iq-tip="phase_opening">
            <div class="text-secondary small font-monospace"><i class="bi bi-compass text-primary me-1"></i>Opening</div>
            <div class="fw-black text-primary font-monospace fs-6">${userOpeningAcc}</div>
            <div class="text-secondary small font-monospace" style="font-size: 10px;">${userOpeningElo} Elo</div>
          </div>
          <div class="glance-phase-pill p-2 flex-grow-1 text-center cursor-help" data-iq-tip="phase_middle">
            <div class="text-secondary small font-monospace"><i class="bi bi-shield-shaded text-warning me-1"></i>Middle</div>
            <div class="fw-black text-warning font-monospace fs-6">${userMiddleAcc}</div>
            <div class="text-secondary small font-monospace" style="font-size: 10px;">${userMiddlegameElo} Elo</div>
          </div>
          <div class="glance-phase-pill p-2 flex-grow-1 text-center cursor-help" data-iq-tip="phase_endgame">
            <div class="text-secondary small font-monospace"><i class="bi bi-flag-fill text-success me-1"></i>Endgame</div>
            <div class="fw-black text-success font-monospace fs-6">${userEndAcc}</div>
            <div class="text-secondary small font-monospace" style="font-size: 10px;">${userEndgameElo} Elo</div>
          </div>
        </div>
      </div>

      ${timedMoves > 0 ? `
        <!-- 3. Move Pace & Time-Trouble Diagnostic -->
        <div class="comic-card p-2.5 mb-2">
          <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
            <span class="small fw-black text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
              <i class="bi bi-stopwatch-fill text-info me-1"></i>Move Pace & Clock Diagnostic
            </span>
            <span class="badge bg-secondary font-monospace" style="font-size: 9.5px;">Clock Tracked</span>
          </div>
          <div class="row g-2">
            <div class="col-4 text-center p-1.5 rounded" style="background: rgba(0,0,0,0.03);">
              <div class="text-secondary small font-monospace" style="font-size: 10px;">Avg Time</div>
              <div class="fw-black font-monospace fs-6 text-info">${avgTime}s</div>
            </div>
            <div class="col-4 text-center p-1.5 rounded" style="background: rgba(0,0,0,0.03);">
              <div class="text-secondary small font-monospace" style="font-size: 10px;">Fast Blunders</div>
              <div class="fw-black font-monospace fs-6 ${impulsiveCount > 0 ? 'text-danger' : 'text-success'}">${impulsiveCount}</div>
            </div>
            <div class="col-4 text-center p-1.5 rounded" style="background: rgba(0,0,0,0.03);">
              <div class="text-secondary small font-monospace" style="font-size: 10px;">Time Trouble</div>
              <div class="fw-black font-monospace fs-6 ${timeTroubleCount > 0 ? 'text-danger' : 'text-success'}">${timeTroubleCount}</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 3.5. Turning Point & Opening Departure Callouts -->
      <div class="mb-2">
        ${this.buildCoachingCallouts()}
      </div>

      <!-- 4. Practice & Actionable Drills -->
      <div class="comic-card p-2.5">
        <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
          <span class="small fw-black text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
            <i class="bi bi-mortarboard-fill text-warning me-1"></i>Practice & Drills
          </span>
        </div>
        <div class="d-flex align-items-center gap-1.5 flex-wrap">
          ${totalErrors > 0 ? `
            <button type="button" class="btn btn-sm btn-danger comic-btn flex-grow-1 fw-black py-1.5 px-2.5" id="btn-coach-retry-errors" style="font-size: 11.5px;">
              <i class="bi bi-bullseye me-1"></i>Retry Mistakes (${totalErrors})
            </button>
          ` : ''}
          <button type="button" class="btn btn-sm btn-outline-warning comic-btn flex-grow-1 fw-bold py-1.5 px-2.5" id="btn-coach-guess-move" style="font-size: 11.5px;">
            <i class="bi bi-patch-question-fill me-1"></i>Guess Move
          </button>
          <button type="button" class="btn btn-sm btn-warning comic-btn flex-grow-1 fw-bold text-dark py-1.5 px-2.5" id="btn-coach-goto-bank" style="font-size: 11.5px;">
            <i class="bi bi-bank2 me-1"></i>Daily 5 Bank
          </button>
        </div>
      </div>
    `;
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
        <div class="d-flex flex-column align-items-center justify-content-center p-4 p-sm-5 text-center comic-card max-w-xl mx-auto my-5 shadow-lg" id="review-analysis-card">
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
        <div class="d-flex flex-column align-items-center justify-content-center p-4 p-sm-5 text-center comic-card max-w-2xl mx-auto my-4">
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
                <span class="badge bg-warning text-dark border border-dark rounded-pill px-2.5 py-1 fw-bold text-nowrap" style="font-size: 12px;">
                  <i class="bi bi-clock-history me-1"></i>Saved Games (${totalCount})
                </span>
                <div class="d-flex align-items-center gap-1 flex-wrap p-1 rounded-pill bg-body-tertiary border" role="group" aria-label="Game Filter">
                  <button type="button" class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold text-nowrap ${currentFilter === 'all' ? 'btn-warning text-dark shadow-sm' : 'btn-ghost text-secondary'}" data-saved-filter="all" style="font-size: 11px;">
                    All (${totalCount})
                  </button>
                  <button type="button" class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold text-nowrap ${currentFilter === 'players' ? 'btn-info text-dark shadow-sm' : 'btn-ghost text-secondary'}" data-saved-filter="players" style="font-size: 11px;">
                    <i class="bi bi-people-fill me-1"></i>vs Players (${playerCount})
                  </button>
                  <button type="button" class="btn btn-sm rounded-pill px-2.5 py-0.5 fw-bold text-nowrap ${currentFilter === 'bots' ? 'shadow-sm text-white' : 'btn-ghost text-secondary'}" data-saved-filter="bots" style="font-size: 11px; ${currentFilter === 'bots' ? 'background: #8b5cf6; border-color: #8b5cf6;' : ''}">
                    <i class="bi bi-robot me-1"></i>vs Bots (${botCount})
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-outline-danger btn-sm py-1 px-2.5 comic-btn fw-bold text-nowrap" id="zero-btn-clear-history" style="font-size: 11px;">
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
              <div class="row row-cols-1 row-cols-md-2 g-3">
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
                              ${!item.isBotGame && item.timeControl && item.timeControl !== '-' && item.timeControl !== 'none' && item.timeControl !== '0' ? `<span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;"><i class="bi bi-clock me-0.5"></i>${insEscape(item.timeControl)}</span>` : ''}
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

                        <div class="d-flex align-items-center gap-2 flex-shrink-0 justify-content-between pt-2 border-top border-opacity-10 mt-auto flex-wrap">
                          ${item.type === 'analyzed' ? `
                            <div class="d-flex align-items-center gap-1.5 flex-wrap">
                              <span class="match-stat-badge match-acc-badge font-monospace text-nowrap"><i class="bi bi-bullseye me-0.5"></i><span class="stat-num">${item.accuracy}%</span> <span class="stat-lbl">Acc</span></span>
                              <span class="match-stat-badge match-perf-badge font-monospace text-nowrap"><i class="bi bi-star-fill me-0.5"></i><span class="stat-num">${item.elo}</span> <span class="stat-lbl">Perf</span></span>
                            </div>
                          ` : `
                            <span class="text-secondary small font-monospace text-nowrap" style="font-size: 11px;">Unanalyzed</span>
                          `}

                          <div class="d-flex align-items-center gap-1.5 ms-auto flex-nowrap flex-shrink-0">
                            ${item.isImported ? `
                              <span class="badge bg-body-secondary text-secondary font-monospace border border-secondary-subtle px-1.5 py-1 text-nowrap d-inline-flex align-items-center" style="font-size: 10px;" title="Imported from Chess.com">
                                <i class="bi bi-cloud-arrow-down-fill"></i><span class="d-none d-sm-inline ms-1">Imported</span>
                              </span>
                            ` : ''}
                            <button type="button" class="btn btn-outline-danger btn-sm comic-btn fw-bold px-2 py-1 btn-delete-saved-game text-nowrap d-inline-flex align-items-center justify-content-center" data-game-key="${insEscape(item.key || item.id)}" title="Remove this game and moves from blunder bank" aria-label="Remove game" style="font-size: 11px;">
                              <i class="bi bi-trash3"></i><span class="d-none d-sm-inline ms-1">Remove</span>
                            </button>
                            ${item.type === 'analyzed' ? `
                              <button type="button" class="btn btn-warning btn-sm comic-btn fw-bold px-2.5 py-1 text-nowrap d-inline-flex align-items-center justify-content-center" data-action-review="${idx}" title="Review Game" aria-label="Review Game" style="font-size: 11px;">
                                <i class="bi bi-search"></i><span class="d-none d-sm-inline ms-1">Review</span>
                              </button>
                            ` : `
                              <button type="button" class="btn btn-outline-warning btn-sm comic-btn fw-bold px-2.5 py-1 text-nowrap d-inline-flex align-items-center justify-content-center" data-action-analyze="${idx}" title="Analyze Game" aria-label="Analyze Game" style="font-size: 11px;">
                                <i class="bi bi-lightning-charge-fill"></i><span class="d-none d-sm-inline ms-1">Analyze</span>
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
              ob.innerHTML = '<i class="bi bi-trash3"></i><span class="d-none d-sm-inline ms-1">Remove</span>';
              ob.classList.remove('btn-danger');
              ob.classList.add('btn-outline-danger');
            });

            btn.dataset.confirming = 'true';
            btn.innerHTML = '<i class="bi bi-check-lg"></i><span class="d-none d-sm-inline ms-1">Confirm?</span>';
            btn.classList.remove('btn-outline-danger');
            btn.classList.add('btn-danger');
            setTimeout(() => {
              if (btn && btn.isConnected && btn.dataset.confirming === 'true') {
                btn.dataset.confirming = 'false';
                btn.innerHTML = '<i class="bi bi-trash3"></i><span class="d-none d-sm-inline ms-1">Remove</span>';
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

    const userMistakes = this.getUserMistakePlies();
    const mistakesCount = userMistakes.length;
    const bankStats = typeof getBlunderBankStats === 'function' ? getBlunderBankStats() : { total: 0 };

    // Active Review Dashboard - Streamlined Prominent Large Board & Compact Tabbed Sidebar Layout
    this.container.innerHTML = `
      <div class="row g-2.5 g-xl-3 align-items-start w-100 mx-0">
        <!-- Column 1: Board & Tactical Controls (Dominant Large Desktop Workspace) -->
        <div class="col-12 col-lg-7 col-xl-6 col-xxl-6 mobile-sticky-top d-flex flex-column align-items-center gap-2 px-1 px-sm-2">
          <div class="w-100 review-board-column-inner">
            <!-- Active Mode / Sandbox / Retry Mistakes Banner -->
            <div id="sandbox-banner" class="d-none w-100"></div>
            <div id="pv-banner-area" class="d-none"></div>

            <div class="d-flex align-items-stretch justify-content-center gap-2 gap-sm-2.5 mb-1 w-100">
              <!-- Vertical Animated Eval Bar -->
              <div class="eval-bar-wrapper flex-shrink-0 cursor-help" id="eval-bar" data-iq-tip="metric_eval_bar">
                <div class="eval-white-fill"></div>
                <div class="eval-score-badge text-white">0.0</div>
              </div>

              <!-- Chessboard Mount -->
              <div class="flex-grow-1 d-flex justify-content-center" id="review-board-mount"></div>
            </div>

            <!-- Dedicated Step Navigation Card (Right under the board) -->
            <div class="comic-card-sm p-1.5 mb-1 d-flex align-items-center justify-content-between gap-1.5 w-100" id="review-nav-controls">
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-first" title="First Move (Home / Ctrl+←)">
                <i class="bi bi-chevron-bar-left fs-6"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-prev" title="Previous Move (← / ↑ Arrow)">
                <i class="bi bi-chevron-left fs-5 fw-black me-1"></i><span class="small fw-black d-none d-sm-inline">Prev</span>
              </button>

              <span class="badge bg-secondary font-monospace px-2.5 px-sm-3 py-1.5 fs-6 fw-bold flex-shrink-0" id="ply-counter">0 / 0</span>

              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-next" title="Next Move (→ / ↓ Arrow)">
                <span class="small fw-black d-none d-sm-inline me-1">Next</span><i class="bi bi-chevron-right fs-5 fw-black"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-last" title="Last Move (End / Ctrl+→)">
                <i class="bi bi-chevron-bar-right fs-6"></i>
              </button>
            </div>

            <!-- Move Notation & Comic Sound Effect Strip -->
            <div class="comic-card-sm p-1.5 mb-1.5 d-flex align-items-center justify-content-between w-100" id="review-move-strip"></div>

            <!-- Streamlined Action Strip (3 Grouped Dropdowns + Key Moment) -->
            <div class="comic-card-sm p-1.5 mb-1 d-flex align-items-center justify-content-between gap-1.5 flex-wrap w-100" id="review-action-strip">
              <!-- Key Moment Button (Highest Frequency Action) -->
              <button type="button" class="btn btn-warning comic-btn btn-sm py-1.5 px-2.5 fw-black flex-grow-1" id="btn-key-moment" title="Jump to Next Key Moment (Space)" style="font-size: 11.5px;">
                <i class="bi bi-lightning-charge-fill me-1"></i>Key Moment
              </button>

              <div class="d-flex align-items-center gap-1.5 flex-wrap">
                <!-- 🥋 Train Dropdown -->
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-warning comic-btn dropdown-toggle fw-bold py-1.5 px-2.5 d-flex align-items-center" type="button" id="btn-dropdown-train" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 11.5px;">
                    <i class="bi bi-mortarboard-fill me-1"></i>Train
                    ${mistakesCount > 0 ? `<span class="badge bg-danger ms-1 font-monospace" style="font-size: 9.5px;">${mistakesCount}</span>` : ''}
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg py-2" aria-labelledby="btn-dropdown-train" style="min-width: 220px;">
                    <li class="dropdown-header text-uppercase font-monospace fw-bold small text-secondary px-3 py-1">Active Drills</li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 d-flex align-items-center justify-content-between" id="action-retry-mistakes" type="button" ${mistakesCount === 0 ? 'disabled' : ''}>
                        <span><i class="bi bi-bullseye me-2 text-danger"></i>Retry Mistakes</span>
                        <span class="badge ${mistakesCount > 0 ? 'bg-danger' : 'bg-secondary'} font-monospace">${mistakesCount}</span>
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 d-flex align-items-center justify-content-between" id="action-guess-move" type="button">
                        <span><i class="bi bi-patch-question-fill me-2 text-warning"></i>Guess Move Drill</span>
                        <span class="badge bg-warning text-dark font-monospace">GM</span>
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 d-flex align-items-center justify-content-between" id="action-blunder-bank" type="button">
                        <span><i class="bi bi-bank2 me-2 text-primary"></i>Blunder Bank</span>
                        <span class="badge bg-primary font-monospace">${bankStats.total}</span>
                      </button>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li class="dropdown-header text-uppercase font-monospace fw-bold small text-secondary px-3 py-1">Position Sparring</li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3" id="action-show-win" type="button">
                        <i class="bi bi-trophy-fill me-2 text-warning"></i>Show Winning Path
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3" id="action-play-bot" type="button">
                        <i class="bi bi-robot me-2" style="color: #8b5cf6;"></i>Play vs Bot from Position
                      </button>
                    </li>
                  </ul>
                </div>

                <!-- 👁️ Vision Dropdown -->
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-secondary comic-btn dropdown-toggle fw-bold py-1.5 px-2.5 d-flex align-items-center" type="button" id="btn-dropdown-vision" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 11.5px;">
                    <i class="bi bi-eye-fill me-1"></i>Vision
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg py-2" aria-labelledby="btn-dropdown-vision" style="min-width: 220px;">
                    <li class="dropdown-header text-uppercase font-monospace fw-bold small text-secondary px-3 py-1">Board Overlays</li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 d-flex align-items-center justify-content-between" id="action-toggle-heatmap" type="button">
                        <span>🔥 Control Heatmap</span>
                        <span class="badge font-monospace ${this.visionOverlay === 'heatmap' ? 'bg-warning text-dark' : 'bg-secondary'}" id="badge-vision-heatmap">${this.visionOverlay === 'heatmap' ? 'ON' : 'OFF'}</span>
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 d-flex align-items-center justify-content-between" id="action-toggle-loose" type="button">
                        <span>⚠️ Loose Pieces (LPDO)</span>
                        <span class="badge font-monospace ${this.showLoosePieces ? 'bg-warning text-dark' : 'bg-secondary'}" id="badge-vision-loose">${this.showLoosePieces ? 'ON' : 'OFF'}</span>
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 d-flex align-items-center justify-content-between" id="action-toggle-threat" type="button">
                        <span>🎯 Opponent Threat</span>
                        <span class="badge font-monospace ${this.isThreatActive ? 'bg-warning text-dark' : 'bg-secondary'}" id="badge-vision-threat">${this.isThreatActive ? 'ON' : 'OFF'}</span>
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 d-flex align-items-center justify-content-between" id="action-toggle-best-move" type="button">
                        <span>💡 Best Move Arrow</span>
                        <span class="badge font-monospace ${this.showBestMove ? 'bg-warning text-dark' : 'bg-secondary'}" id="badge-vision-best">${this.showBestMove ? 'ON' : 'OFF'}</span>
                      </button>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 d-flex align-items-center justify-content-between" id="action-flip-board" type="button">
                        <span><i class="bi bi-arrow-left-right me-2 text-info"></i>Flip Board</span>
                        <kbd class="small text-secondary font-monospace">F</kbd>
                      </button>
                    </li>
                  </ul>
                </div>

                <!-- ⚡ More Tools Dropdown -->
                <div class="dropdown">
                  <button class="arcade-btn-icon" style="width: 32px; height: 32px; border-radius: 0.6rem;" type="button" id="btn-dropdown-more-tools" data-bs-toggle="dropdown" aria-expanded="false" title="More Tools & Export">
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-lg py-2" aria-labelledby="btn-dropdown-more-tools" style="min-width: 220px;">
                    <li class="dropdown-header text-uppercase font-monospace fw-bold small text-secondary px-3 py-1">Share & Export</li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3" id="action-share-link" type="button">
                        <i class="bi bi-share-fill me-2 text-info"></i>Share Review Link
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3" id="action-export-annotated-pgn" type="button">
                        <i class="bi bi-file-earmark-arrow-down-fill me-2 text-success"></i>Export Annotated PGN
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3" id="action-copy-fen" type="button">
                        <i class="bi bi-clipboard-check-fill me-2 text-primary"></i>Copy Current FEN
                      </button>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                      <button class="dropdown-item py-1.5 px-3 text-secondary" id="action-reanalyze-review" type="button">
                        <i class="bi bi-arrow-repeat me-2"></i>Re-analyze Game
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2: Review Intelligence Sidebar (Tabbed Layout: Moves & Eval / Coach) -->
        <div class="col-12 col-lg-5 col-xl-6 col-xxl-6 d-flex flex-column gap-2 px-1 px-sm-2 review-sidebar">
          <!-- Compact PvP Header Card -->
          <div class="comic-card p-2.5">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
              <div class="d-flex align-items-center gap-1.5 flex-wrap min-w-0">
                <button type="button" class="eco-interactive-btn cursor-pointer" id="btn-open-eco-modal" data-iq-tip="eco_opening" title="Click to view Opening theory, moves & ECO classification">
                  <span class="badge bg-warning text-dark font-monospace fw-black px-2 py-1 eco-code-badge">${this.game.ecoCode || 'PGN'}</span>
                  <span class="fw-black text-truncate eco-name-label" style="max-width: 170px; font-size: 13px;">${this.game.ecoName || 'Chess Match'}</span>
                  <i class="bi bi-info-circle text-secondary" style="font-size: 11px;"></i>
                </button>
                ${this.game.date ? `<span class="text-secondary small font-monospace d-none d-sm-inline">· ${this.game.date}</span>` : ''}
              </div>
              <button type="button" class="btn btn-sm btn-warning text-dark comic-btn fw-black px-3 py-1 d-inline-flex align-items-center gap-1.5" id="btn-open-full-report-modal" title="View Full Performance & Comprehensive Game Report" style="font-size: 12px;">
                <i class="bi bi-file-earmark-bar-graph-fill"></i><span>Game Report</span>
              </button>
            </div>

            <!-- Player VS Player Compact Header -->
            <div class="row g-2 align-items-center">
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
          </div>

          <!-- Segmented Tab Group -->
          <div class="arcade-tab-group mb-1" role="tablist">
            <button type="button" class="arcade-tab-btn ${this.reviewTab === 'moves' ? 'active' : ''}" data-review-tab="moves">
              <i class="bi bi-list-ol me-1.5"></i>Moves & Eval
            </button>
            <button type="button" class="arcade-tab-btn ${this.reviewTab === 'coach' ? 'active' : ''}" data-review-tab="coach">
              <i class="bi bi-mortarboard-fill me-1.5"></i>Coach & Diagnostics
            </button>
          </div>

          <!-- TAB PANE 1: Moves & Eval -->
          <div class="review-tab-pane ${this.reviewTab === 'moves' ? '' : 'd-none'}" data-pane-tab="moves">
            <!-- Advantage Timeline Line Graph -->
            <div class="comic-card-sm p-2 mb-2" id="advantage-chart-area"></div>

            <!-- Move History Card -->
            <div class="comic-card p-2 mb-2" id="review-moves-card">
              <div class="d-flex align-items-center justify-content-between mb-1.5 pb-1 border-bottom border-opacity-10" style="border-color: var(--arcade-border) !important;">
                <div class="d-flex align-items-center gap-1.5">
                  <i class="bi bi-list-ol text-warning"></i>
                  <span class="small fw-black text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Move List</span>
                  <span class="badge bg-secondary font-monospace" style="font-size: 10px;">${Math.ceil((this.game.plies?.length || 0) / 2)} moves</span>
                </div>
                <div class="btn-group btn-group-sm" role="group" aria-label="Move filter">
                  <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'all' ? 'active' : ''}" data-move-filter="all">All</button>
                  <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'key' ? 'active' : ''}" data-move-filter="key" title="Brilliant, Great, Inaccuracy, Mistake, Blunder, Missed Win">Key</button>
                  <button type="button" class="btn btn-xs move-filter-pill ${this.moveFilter === 'errors' ? 'active' : ''}" data-move-filter="errors" title="Inaccuracies, Mistakes, Blunders, Missed Wins">Errors</button>
                </div>
              </div>
              <div class="move-history-container" style="max-height: 255px; overflow-y: auto;">
                <table class="table table-sm table-hover align-middle mb-0" style="font-size: 12px;">
                  <tbody id="move-history-tbody">
                    ${this.buildMoveTableRows()}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 4-Pillar Positional Evaluation X-Ray -->
            <div class="comic-card-sm p-2.5" id="positional-pillars-area"></div>
          </div>

          <!-- TAB PANE 2: Coach & Diagnostics -->
          <div class="review-tab-pane ${this.reviewTab === 'coach' ? '' : 'd-none'}" data-pane-tab="coach" id="pane-tab-coach">
            ${this.renderCoachTabHtml(userCounts, userOpeningAcc, userMiddleAcc, userEndAcc, userOpeningElo, userMiddlegameElo, userEndgameElo)}
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

    // Bind Tab Switching
    this.container.querySelectorAll('[data-review-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-review-tab');
        if (tab) this.setReviewTab(tab);
      });
    });

    // Bind Train Dropdown Actions
    this.container.querySelector('#action-retry-mistakes')?.addEventListener('click', () => this.startRetryMistakes());
    this.container.querySelector('#action-guess-move')?.addEventListener('click', () => this.startGuessTheMove());
    this.container.querySelector('#action-blunder-bank')?.addEventListener('click', () => this.openBlunderBankModal('all'));
    this.container.querySelector('#action-show-win')?.addEventListener('click', () => {
      if (typeof openWinningPathModal === 'function') openWinningPathModal(this);
    });
    this.container.querySelector('#action-play-bot')?.addEventListener('click', () => this.playFromCurrentPosition());

    // Bind Vision Dropdown Actions
    this.container.querySelector('#action-toggle-heatmap')?.addEventListener('click', () => {
      this.toggleVisionOverlay('heatmap');
    });
    this.container.querySelector('#action-toggle-loose')?.addEventListener('click', () => {
      this.toggleVisionOverlay('loose');
    });
    this.container.querySelector('#action-toggle-threat')?.addEventListener('click', () => {
      this.isThreatActive = !this.isThreatActive;
      this.updateBoardAndControls();
    });
    this.container.querySelector('#action-toggle-best-move')?.addEventListener('click', () => {
      this.showBestMove = !this.showBestMove;
      this.updateBoardAndControls();
    });
    this.container.querySelector('#action-flip-board')?.addEventListener('click', () => {
      this.orientation = this.orientation === 'w' ? 'b' : 'w';
      this.updateBoardAndControls();
    });

    // Bind More Tools Dropdown Actions
    this.container.querySelector('#action-share-link')?.addEventListener('click', (e) => this.shareGameReviewLink(e.currentTarget));
    this.container.querySelector('#action-export-annotated-pgn')?.addEventListener('click', () => this.downloadAnnotatedPgn());
    this.container.querySelector('#action-copy-fen')?.addEventListener('click', () => this.copyCurrentFen());
    this.container.querySelector('#action-reanalyze-review')?.addEventListener('click', () => {
      if (this.game && this.onReanalyzeGame) {
        this.onReanalyzeGame(this.game.pgn || this.game.id, this.game.userColor || 'w');
      }
    });

    // Bind Coach Tab Specific Actions
    this.container.querySelector('#btn-coach-retry-errors')?.addEventListener('click', () => this.startRetryMistakes());
    this.container.querySelector('#btn-coach-guess-move')?.addEventListener('click', () => this.startGuessTheMove());
    this.container.querySelector('#btn-coach-goto-bank')?.addEventListener('click', () => this.openBlunderBankModal('daily'));

    // Legacy compatibility triggers
    bindNavBtn('#btn-retry-mistakes', () => this.startRetryMistakes());
    bindNavBtn('#btn-show-win', () => {
      if (typeof openWinningPathModal === 'function') openWinningPathModal(this);
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

    this.container.querySelector('#btn-open-eco-modal')?.addEventListener('click', () => {
      this.openOpeningModal();
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
    if (typeof bindMoveTableRowClicks === 'function') bindMoveTableRowClicks(this);
  }

  matchesMoveFilter(plyObj) {
    return typeof matchesMoveFilter === 'function' ? matchesMoveFilter(this, plyObj) : true;
  }

  renderMoveCellContent(plyObj) {
    return typeof renderMoveCellContent === 'function' ? renderMoveCellContent(this, plyObj) : '';
  }

  buildMoveTableRows() {
    return typeof buildMoveTableRows === 'function' ? buildMoveTableRows(this) : '';
  }

  renderMiniBadge(cls) {
    return typeof renderMiniBadge === 'function' ? renderMiniBadge(cls) : '';
  }

  buildBadgesSummary() {
    return typeof buildBadgesSummary === 'function' ? buildBadgesSummary(this) : '';
  }

}

if (typeof window !== 'undefined') {
  window.ReviewDashboard = ReviewDashboard;
}
