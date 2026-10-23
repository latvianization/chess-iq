import { getCachedGame, saveCachedGame } from './gameCacheService.js';
import { analyzeFullPgn } from './importApi.js';

class BackgroundAnalysisQueue {
  constructor() {
    this.queue = [];
    this.isAnalyzing = false;
    this.isPaused = true;
    this.idleHandle = null;
    this.timer = null;
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

  enqueueGames(games, username = '') {
    this.setQueue(games, username);
  }

  startIdleProcessing() {
    this.isPaused = false;
    this.scheduleNext(1000);
  }

  pause() {
    this.isPaused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.idleHandle && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(this.idleHandle);
      this.idleHandle = null;
    }
  }

  resume() {
    this.startIdleProcessing();
  }

  scheduleNext(delayMs = 1500) {
    if (this.isPaused || this.isAnalyzing || this.queue.length === 0) return;

    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      if (this.isPaused || this.isAnalyzing || this.queue.length === 0) return;

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        this.idleHandle = window.requestIdleCallback(
          (deadline) => {
            if (deadline.timeRemaining() > 10 || deadline.didTimeout) {
              this.processOne();
            } else {
              this.scheduleNext(1000);
            }
          },
          { timeout: 3000 }
        );
      } else {
        this.processOne();
      }
    }, delayMs);
  }

  async processOne() {
    if (this.isPaused || this.isAnalyzing || this.queue.length === 0) return;

    this.isAnalyzing = true;
    const item = this.queue.shift();

    try {
      const alreadyCached = getCachedGame(item.id || item.pgn, item.userColor);
      if (!alreadyCached) {
        const analyzed = await analyzeFullPgn(item.pgn, item.userColor, false, async () => {
          if (this.isPaused) throw new Error('aborted');
          await new Promise((r) => setTimeout(r, 12));
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
    } catch {
    } finally {
      this.isAnalyzing = false;
      if (!this.isPaused && this.queue.length > 0) {
        this.scheduleNext(2000);
      }
    }
  }

  clear() {
    this.queue = [];
    this.pause();
    this.isAnalyzing = false;
  }
}

export const backgroundAnalysisQueue = new BackgroundAnalysisQueue();
