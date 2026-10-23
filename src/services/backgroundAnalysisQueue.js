class BackgroundAnalysisQueue {
  constructor() {
    this.queue = [];
    this.isAnalyzing = false;
    this.isPaused = true;
    this.isUserActive = false;
    this.idleHandle = null;
    this.timer = null;
    this.activityTimer = null;
    this.currentItem = null;
  }

  setQueue(games, username = '') {
    if (!games || !Array.isArray(games)) return;
    const cleanUser = username.trim().toLowerCase();

    games.forEach((g) => {
      if (!g || !g.pgn) return;
      const isWhite = g.white && cleanUser && g.white.toLowerCase() === cleanUser;
      const userColor = isWhite ? 'w' : (g.userColor || 'w');
      const cacheKey = g.id || g.pgn;

      if (!getCachedGame(cacheKey, userColor)) {
        if (!this.queue.some((item) => item.id === g.id && item.userColor === userColor)) {
          this.queue.push({
            id: g.id || `game_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            pgn: g.pgn,
            userColor
          });
        }
      }
    });
  }

  /**
   * Called whenever the user interacts with the app (navigating moves, dragging pieces, scrubbing).
   * Instantly pauses background analysis to guarantee responsive 60fps animations and zero lag.
   * Debounces resumption until the user is idle for pauseDurationMs.
   */
  notifyUserActivity(pauseDurationMs = 5000) {
    this.isUserActive = true;
    this.clearTimers();

    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    this.activityTimer = setTimeout(() => {
      this.isUserActive = false;
      this.activityTimer = null;
      if (!this.isPaused && this.queue.length > 0) {
        this.scheduleNext(1500);
      }
    }, pauseDurationMs);
  }

  clearTimers() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.idleHandle && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(this.idleHandle);
      this.idleHandle = null;
    }
  }

  startIdleProcessing() {
    this.isPaused = false;
    if (!this.isUserActive) {
      this.scheduleNext(1500);
    }
  }

  pause() {
    this.isPaused = true;
    this.clearTimers();
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  scheduleNext(delayMs = 2000) {
    if (this.isPaused || this.isUserActive || this.isAnalyzing || this.queue.length === 0) return;

    this.clearTimers();

    this.timer = setTimeout(() => {
      if (this.isPaused || this.isUserActive || this.isAnalyzing || this.queue.length === 0) return;

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        this.idleHandle = window.requestIdleCallback(
          (deadline) => {
            if (this.isPaused || this.isUserActive) return;
            if (deadline.timeRemaining() > 15 || deadline.didTimeout) {
              this.processOne();
            } else {
              this.scheduleNext(1500);
            }
          },
          { timeout: 5000 }
        );
      } else {
        this.processOne();
      }
    }, delayMs);
  }

  async processOne() {
    if (this.isPaused || this.isUserActive || this.isAnalyzing || this.queue.length === 0) return;

    this.isAnalyzing = true;
    const item = this.queue.shift();
    this.currentItem = item;

    try {
      const alreadyCached = getCachedGame(item.id || item.pgn, item.userColor);
      if (!alreadyCached) {
        const analyzed = await analyzeFullPgn(item.pgn, item.userColor, false, async (current, total) => {
          if (this.isPaused || this.isUserActive) {
            throw new Error('aborted');
          }
          // Cooperative yield: yields main event loop ticks to ensure 60fps animations
          await new Promise((r) => setTimeout(r, 25));
        });

        if (analyzed) {
          saveCachedGame(item.id || item.pgn, item.userColor, analyzed);
          window.dispatchEvent(
            new CustomEvent('chess_iq_game_analyzed', {
              detail: {
                id: item.id,
                userColor: item.userColor,
                accuracy: analyzed.userAccuracy ?? analyzed.accuracy,
                elo: analyzed.overallGameElo
              }
            })
          );
        }
      }
      this.currentItem = null;
    } catch (err) {
      if (err && err.message === 'aborted' && this.currentItem) {
        // Return aborted item back to queue so it can complete when idle
        this.queue.unshift(this.currentItem);
        this.currentItem = null;
      }
    } finally {
      this.isAnalyzing = false;
      if (!this.isPaused && !this.isUserActive && this.queue.length > 0) {
        this.scheduleNext(2500);
      }
    }
  }
}

var backgroundAnalysisQueue = new BackgroundAnalysisQueue();
