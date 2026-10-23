/* ChessIQ Client Bundle */
var Chess = typeof window !== 'undefined' ? window.Chess : null;
var bootstrap = typeof window !== 'undefined' ? window.bootstrap : null;
var confetti = typeof window !== 'undefined' ? (window.confetti || function() {}) : function() {};

if (Chess && Chess.prototype) {
  if (!Chess.prototype.loadPgn && typeof Chess.prototype.load_pgn === 'function') {
    Chess.prototype.loadPgn = function(pgn, options) { return this.load_pgn(pgn, options); };
  }
  if (!Chess.prototype.isGameOver && typeof Chess.prototype.game_over === 'function') {
    Chess.prototype.isGameOver = function() { return this.game_over(); };
  }
  if (!Chess.prototype.isCheckmate && typeof Chess.prototype.in_checkmate === 'function') {
    Chess.prototype.isCheckmate = function() { return this.in_checkmate(); };
  }
  if (!Chess.prototype.isDraw && typeof Chess.prototype.in_draw === 'function') {
    Chess.prototype.isDraw = function() { return this.in_draw(); };
  }
  if (!Chess.prototype.inCheck && typeof Chess.prototype.in_check === 'function') {
    Chess.prototype.inCheck = function() { return this.in_check(); };
  }
  if (!Chess.prototype.isStalemate && typeof Chess.prototype.in_stalemate === 'function') {
    Chess.prototype.isStalemate = function() { return this.in_stalemate(); };
  }
  if (!Chess.prototype.isThreefoldRepetition && typeof Chess.prototype.in_threefold_repetition === 'function') {
    Chess.prototype.isThreefoldRepetition = function() { return this.in_threefold_repetition(); };
  }
  if (!Chess.prototype.isInsufficientMaterial && typeof Chess.prototype.insufficient_material === 'function') {
    Chess.prototype.isInsufficientMaterial = function() { return this.insufficient_material(); };
  }
}

/* --- src/services/sound.js --- */
class SoundService {
  constructor() {
    this.ctx = null;
    this.isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('chess_iq_muted') === 'true' : false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('chess_iq_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    try {
      localStorage.setItem('chess_iq_muted', String(this.isMuted));
    } catch {}
  }

  getContext() {
    if (typeof window === 'undefined' || this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playMove() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      if (osc.frequency?.setValueAtTime) {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
      }

      if (gain.gain?.setValueAtTime) {
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);

      this.triggerHaptic('light');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playCapture() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      if (osc1.frequency?.setValueAtTime) {
        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      }
      if (gain1.gain?.setValueAtTime) {
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      }
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      if (osc2.frequency?.setValueAtTime) {
        osc2.frequency.setValueAtTime(420, now + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      }
      if (gain2.gain?.setValueAtTime) {
        gain2.gain.setValueAtTime(0.2, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      }
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.02);
      osc2.stop(now + 0.13);

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playCheck() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (osc.frequency?.setValueAtTime) {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
      }

      if (gain.gain?.setValueAtTime) {
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playBlunder() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      [164.81, 155.56, 110.0].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, now + i * 0.03);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.35);
        }

        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.2, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + 0.42);
      });

      this.triggerHaptic('heavy');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playBrilliant() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, noteTime);
        }

        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.18, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.36);
      });

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      [440, 554.37, 659.25].forEach((freq, i) => {
        const noteTime = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, noteTime);
        }
        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.2, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.26);
      });
      this.triggerHaptic('light');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  triggerHaptic(type) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(12);
        else if (type === 'medium') navigator.vibrate(35);
        else if (type === 'heavy') navigator.vibrate([60, 30, 80]);
      } catch {
        // Ignore vibration errors if blocked by browser
      }
    }
  }
}

var soundService = new SoundService();

/* --- src/services/stockfishWorker.js --- */
let nextWorkerId = 1;
let resolvedStockfishUrl = null;

function getCandidateWorkerUrls() {
  if (typeof window !== "undefined" && window.__STOCKFISH_URL__) {
    return [window.__STOCKFISH_URL__];
  }
  const base = (typeof window !== "undefined" && window.__BASE_URL__) || "./";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const list = [
    `${normalizedBase}stockfish.js`,
    `${normalizedBase}public/stockfish.js`,
    "./stockfish.js",
    "./public/stockfish.js",
    "/stockfish.js"
  ];
  return [...new Set(list)];
}

class StockfishWorkerService {
  constructor(id = `worker-${nextWorkerId++}`) {
    this.id = id;
    this.worker = null;
    this.isInitialized = false;
    this.isAvailable = true;
    this.queue = [];
    this.isProcessing = false;
    this.pendingResolve = null;
    this.currentBestMove = "";
    this.currentScoreCp = 0;
    this.currentMate = null;
    this.currentPv = [];
    this.currentDepth = 0;
    this.secondBestCp = void 0;
    this.secondBestMove = "";
    this.evaluationTimeoutId = null;
    this.hardTimeoutId = null;
    this.candidateIndex = 0;
    this.initWorker();
  }
  initWorker() {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      this.isAvailable = false;
      return;
    }
    const candidates = getCandidateWorkerUrls();
    const workerUrl = resolvedStockfishUrl || candidates[this.candidateIndex] || candidates[0];
    this.workerUrl = workerUrl;

    try {
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      this.worker.onerror = (err) => {
        if (!this.isInitialized && !resolvedStockfishUrl && this.candidateIndex + 1 < candidates.length) {
          try {
            this.worker.terminate();
          } catch {}
          this.candidateIndex++;
          this.initWorker();
          return;
        }

        const msg = (err && err.message) || (err && err.type ? `Event (${err.type})` : "Worker error");
        console.warn(`[StockfishPool][${this.id}] Worker offline (${msg})`);
        this.isAvailable = false;
        this.drainQueue();
        try {
          this.worker.terminate();
        } catch {}
      };
      this.worker.postMessage("uci");
    } catch (err) {
      if (!this.isInitialized && !resolvedStockfishUrl && this.candidateIndex + 1 < candidates.length) {
        this.candidateIndex++;
        this.initWorker();
        return;
      }
      console.warn(`[StockfishPool][${this.id}] Init failed:`, err?.message || err);
      this.isAvailable = false;
      this.drainQueue();
    }
  }
  drainQueue() {
    if (this.evaluationTimeoutId) {
      clearTimeout(this.evaluationTimeoutId);
      this.evaluationTimeoutId = null;
    }
    if (this.hardTimeoutId) {
      clearTimeout(this.hardTimeoutId);
      this.hardTimeoutId = null;
    }
    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve(null);
    }
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item && item.resolve) item.resolve(null);
    }
    this.isProcessing = false;
  }
  handleMessage(line) {
    if (typeof line !== "string") return;
    if (line === "uciok") {
      this.isInitialized = true;
      if (!resolvedStockfishUrl && this.workerUrl) {
        resolvedStockfishUrl = this.workerUrl;
      }
      console.log(`[StockfishPool][${this.id}] Initialized and ready (uciok)`);
      if (this.worker) {
        this.worker.postMessage("setoption name MultiPV value 2");
        this.worker.postMessage("isready");
      }
      this.processQueue();
      return;
    }
    if (line.startsWith("info depth")) {
      const depthMatch = line.match(/depth\s+(\d+)/);
      if (depthMatch) {
        this.currentDepth = parseInt(depthMatch[1], 10);
      }
      const multiPvMatch = line.match(/multipv\s+(\d+)/);
      const isMultiPv2 = multiPvMatch && multiPvMatch[1] === "2";
      const scoreCpMatch = line.match(/score\s+cp\s+(-?\d+)/);
      if (scoreCpMatch) {
        const cp = parseInt(scoreCpMatch[1], 10);
        if (isMultiPv2) {
          this.secondBestCp = cp;
        } else {
          this.currentScoreCp = cp;
          this.currentMate = null;
        }
      }
      const scoreMateMatch = line.match(/score\s+mate\s+(-?\d+)/);
      if (scoreMateMatch) {
        const m = parseInt(scoreMateMatch[1], 10);
        if (!isMultiPv2) {
          this.currentMate = m;
          this.currentScoreCp = m > 0 ? 3e3 : -3e3;
        }
      }
      const pvMatch = line.match(/pv\s+(.+)$/);
      if (pvMatch) {
        const pvMoves = pvMatch[1].trim().split(/\s+/);
        if (isMultiPv2) {
          this.secondBestMove = pvMoves[0] || "";
        } else {
          this.currentPv = pvMoves;
          if (pvMoves.length > 0) {
            this.currentBestMove = pvMoves[0];
          }
        }
      }
    }
    if (line.startsWith("bestmove")) {
      if (this.evaluationTimeoutId) {
        clearTimeout(this.evaluationTimeoutId);
        this.evaluationTimeoutId = null;
      }
      if (this.hardTimeoutId) {
        clearTimeout(this.hardTimeoutId);
        this.hardTimeoutId = null;
      }
      if (!this.pendingResolve) {
        return;
      }
      const parts = line.split(/\s+/);
      const bestMove = parts[1] && parts[1] !== "(none)" ? parts[1] : this.currentBestMove;
      const result = {
        bestMoveUci: bestMove,
        scoreCp: this.currentScoreCp,
        mate: this.currentMate,
        pv: this.currentPv.length > 0 ? this.currentPv : [bestMove],
        depth: this.currentDepth,
        multiPv2ScoreCp: this.secondBestCp,
        secondBestMoveUci: this.secondBestMove
      };
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      this.isProcessing = false;
      if (resolve) resolve(result);
      this.processQueue();
    }
  }
  processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !this.worker || !this.isAvailable) {
      return;
    }
    if (!this.isInitialized) {
      return;
    }
    const item = this.queue.shift();
    if (!item) return;

    this.isProcessing = true;
    this.currentBestMove = "";
    this.currentScoreCp = 0;
    this.currentMate = null;
    this.currentPv = [];
    this.currentDepth = 0;
    this.secondBestCp = void 0;
    this.secondBestMove = "";
    this.pendingResolve = item.resolve;

    this.evaluationTimeoutId = setTimeout(() => {
      this.evaluationTimeoutId = null;
      if (this.pendingResolve) {
        try {
          this.worker.postMessage("stop");
        } catch {}

        this.hardTimeoutId = setTimeout(() => {
          this.hardTimeoutId = null;
          if (this.pendingResolve) {
            console.warn(`[StockfishPool][${this.id}] Hard timeout: engine did not return bestmove, terminating and restarting worker`);
            const fallback = {
              bestMoveUci: this.currentBestMove || "",
              scoreCp: this.currentScoreCp,
              mate: this.currentMate,
              pv: this.currentPv.length > 0 ? this.currentPv : [],
              depth: this.currentDepth,
              multiPv2ScoreCp: this.secondBestCp,
              secondBestMoveUci: this.secondBestMove,
              timedOut: true
            };
            const resolve = this.pendingResolve;
            this.pendingResolve = null;
            this.isProcessing = false;

            try {
              if (this.worker) this.worker.terminate();
            } catch {}
            this.worker = null;
            this.isInitialized = false;

            resolve(fallback);
            this.initWorker();
          }
        }, 1500);
      }
    }, (item.maxWaitMs || 1200) + 300);

    try {
      this.worker.postMessage(`position fen ${item.fen}`);
      const movetimeCmd = item.maxWaitMs ? ` movetime ${item.maxWaitMs}` : "";
      this.worker.postMessage(`go depth ${item.depth}${movetimeCmd}`);
    } catch (err) {
      console.error(`[StockfishPool][${this.id}] postMessage failed:`, err);
      if (this.evaluationTimeoutId) clearTimeout(this.evaluationTimeoutId);
      if (this.hardTimeoutId) clearTimeout(this.hardTimeoutId);
      this.isProcessing = false;
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      if (resolve) resolve(null);
      this.processQueue();
    }
  }
  evaluate(fen, depth = 14, maxWaitMs = 1000) {
    if (!this.isAvailable || !this.worker) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      this.queue.push({ fen, depth, maxWaitMs, resolve });
      this.processQueue();
    });
  }
  isEngineReady() {
    return this.isAvailable && this.isInitialized;
  }
}
const POOL_MAX_WORKERS = 4;
const MAX_CONSECUTIVE_INIT_FAILURES = 3;

class StockfishPool {
  constructor() {
    const cores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
    this.targetSize = Math.min(POOL_MAX_WORKERS, Math.max(1, cores - 1));
    this.workers = [new StockfishWorkerService()];
    this.consecutiveFailures = 0;
    this.isPermanentlyDisabled = false;
  }
  cleanDeadWorkers() {
    const dead = this.workers.filter((w) => !w.isAvailable);
    if (dead.length > 0) {
      const failedDuringInit = dead.some((w) => !w.isInitialized);
      if (failedDuringInit) {
        this.consecutiveFailures += dead.length;
      }
      this.workers = this.workers.filter((w) => w.isAvailable);
    }
    if (this.consecutiveFailures >= MAX_CONSECUTIVE_INIT_FAILURES && this.workers.length === 0) {
      if (!this.isPermanentlyDisabled) {
        this.isPermanentlyDisabled = true;
        console.warn("[StockfishPool] Web Workers cannot run in this environment. Falling back to built-in local engine.");
      }
    }
  }
  warmUp() {
    if (this.isPermanentlyDisabled) return;
    this.cleanDeadWorkers();
    if (this.isPermanentlyDisabled) return;
    while (this.workers.length < this.targetSize) {
      this.workers.push(new StockfishWorkerService());
    }
  }
  get size() {
    return this.isPermanentlyDisabled ? 0 : this.workers.filter((w) => w.isAvailable).length;
  }
  get isAvailable() {
    return !this.isPermanentlyDisabled && this.workers.some((w) => w.isAvailable);
  }
  isEngineReady() {
    return !this.isPermanentlyDisabled && this.workers.some((w) => w.isEngineReady());
  }
  evaluate(fen, depth = 14, maxWaitMs = 1000) {
    if (this.isPermanentlyDisabled) {
      return Promise.resolve(null);
    }
    this.cleanDeadWorkers();
    if (this.isPermanentlyDisabled) {
      return Promise.resolve(null);
    }
    if (this.workers.length === 0) {
      this.workers.push(new StockfishWorkerService());
    }
    if (this.workers.length < this.targetSize) {
      this.warmUp();
    }
    const readyWorkers = this.workers.filter((w) => w.isAvailable && w.worker && w.isInitialized);
    if (readyWorkers.length > 0) {
      this.consecutiveFailures = 0;
    }
    const available = readyWorkers.length > 0
      ? readyWorkers
      : this.workers.filter((w) => w.isAvailable && w.worker);

    if (available.length === 0) {
      return Promise.resolve(null);
    }
    const load = (w) => w.queue.length + (w.isProcessing ? 1 : 0);
    const leastBusy = available.reduce((best, w) => (load(w) < load(best) ? w : best));
    return leastBusy.evaluate(fen, depth, maxWaitMs);
  }
}
var stockfishService = new StockfishPool();

/* --- src/services/engineEvaluationTables.js --- */
var PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 2e4
};

var PST_MG_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0,
  98, 134, 61, 95, 68, 126, 34, -11,
  -6, 7, 26, 31, 65, 56, 25, -20,
  -14, 13, 6, 21, 23, 12, 17, -23,
  -27, -2, -5, 12, 17, 6, 10, -25,
  -26, -4, -4, -10, 3, 3, 33, -12,
  -35, -1, -20, -23, -15, 24, 38, -22,
  0, 0, 0, 0, 0, 0, 0, 0
];

var PST_MG_KNIGHT = [
  -167, -89, -34, -49, 61, -97, -15, -107,
  -73, -41, 72, 36, 23, 62, 7, -17,
  -47, 60, 37, 65, 84, 129, 73, 44,
  -9, 17, 19, 53, 37, 69, 18, 22,
  -13, 4, 16, 13, 28, 19, 21, -8,
  -23, -9, 12, 10, 19, 17, 25, -16,
  -29, -53, -12, -3, -1, 18, -14, -19,
  -105, -21, -58, -33, -17, -28, -19, -23
];

var PST_MG_BISHOP = [
  -29, 4, -82, -37, -25, -42, 7, -8,
  -26, 16, -18, -13, 30, 59, 18, -47,
  -16, 37, 43, 40, 35, 50, 37, -2,
  -4, 5, 19, 50, 37, 37, 7, -2,
  -6, 13, 13, 26, 34, 12, 10, 4,
  0, 15, 15, 15, 14, 27, 18, 10,
  4, 15, 16, 0, 7, 21, 33, 1,
  -33, -3, -14, -21, -13, -12, -39, -21
];

var PST_MG_ROOK = [
  32, 42, 32, 51, 63, 9, 31, 43,
  27, 32, 58, 62, 80, 67, 26, 44,
  -5, 19, 26, 36, 17, 45, 61, 16,
  -24, -11, 7, 26, 24, 35, -8, -20,
  -36, -26, -12, -1, 9, -7, 6, -23,
  -45, -25, -16, -17, 3, 0, -5, -33,
  -44, -16, -20, -9, -1, 11, -6, -71,
  -19, -13, 1, 17, 16, 7, -37, -26
];

var PST_MG_QUEEN = [
  -28, 0, 29, 12, 59, 44, 43, 45,
  -24, -39, -5, 1, -16, 57, 28, 54,
  -18, -15, -7, 14, 4, 45, 13, 28,
  -15, -5, -4, 8, 18, 34, 36, 19,
  -7, 6, 10, 15, 24, 19, 16, -2,
  -9, -7, 8, -8, -2, 2, -8, -10,
  -14, -13, -11, -10, -9, -9, -4, -18,
  -18, -9, 7, -3, 3, -18, -15, -22
];

var PST_MG_KING = [
  -65, 23, 16, -15, -56, -34, 2, 13,
  29, -1, -20, -7, -8, -4, -38, -29,
  -9, 24, 2, -16, -20, 6, 22, -22,
  -17, -20, -12, -27, -30, -25, -14, -36,
  -49, -1, -27, -39, -46, -44, -33, -51,
  -14, -14, -22, -46, -44, -30, -15, -27,
  1, 7, -8, -64, -43, -16, 9, 8,
  -15, 36, 12, -54, 8, -28, 24, 14
];

/* --- src/services/engine.js --- */
var FEN_EVAL_CACHE = /* @__PURE__ */ new Map();
function cpToWinProb(cp, mate) {
  if (mate !== void 0 && mate !== null) {
    if (mate > 0) return 1.0;
    if (mate < 0) return 0.0;
    return 0.5;
  }
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}
function calculateMoveAccuracy(winProbLoss) {
  if (winProbLoss <= 0.001) return 100;
  const acc = 103.1668 * Math.exp(-4.354 * winProbLoss) - 3.1669;
  return Math.min(100, Math.max(0, Math.round(acc * 10) / 10));
}
function countTotalPieces(chess) {
  let count = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]) count++;
    }
  }
  return count;
}
function countMajorMinorPieces(chess) {
  const board = chess.board();
  let total = 0;
  let whiteBackRank = 0;
  let blackBackRank = 0;
  let whiteQueens = 0;
  let blackQueens = 0;
  let whiteRooks = 0;
  let blackRooks = 0;
  let whiteMinors = 0;
  let blackMinors = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.type !== "p" && p.type !== "k") {
        total++;
        if (p.color === "w") {
          if (p.type === "q") whiteQueens++;
          if (p.type === "r") whiteRooks++;
          if (p.type === "b" || p.type === "n") whiteMinors++;
          if (r === 7) whiteBackRank++;
        } else {
          if (p.type === "q") blackQueens++;
          if (p.type === "r") blackRooks++;
          if (p.type === "b" || p.type === "n") blackMinors++;
          if (r === 0) blackBackRank++;
        }
      }
    }
  }
  return { total, whiteBackRank, blackBackRank, whiteQueens, blackQueens, whiteRooks, blackRooks, whiteMinors, blackMinors };
}
function detectPhase(ply, chess, moveSans, middlegameStartPly, endgameStartPly) {
  if (endgameStartPly !== null && ply >= endgameStartPly) {
    return { phase: "endgame", newMiddlegameStart: middlegameStartPly, newEndgameStart: endgameStartPly };
  }
  const mm = countMajorMinorPieces(chess);
  const isEndgame = mm.total <= 6 || mm.whiteQueens === 0 && mm.blackQueens === 0 && mm.whiteRooks <= 1 && mm.blackRooks <= 1 && mm.whiteMinors <= 1 && mm.blackMinors <= 1;
  if (isEndgame) {
    return {
      phase: "endgame",
      newMiddlegameStart: middlegameStartPly ?? ply,
      newEndgameStart: endgameStartPly ?? ply
    };
  }
  if (middlegameStartPly !== null && ply >= middlegameStartPly) {
    return { phase: "middlegame", newMiddlegameStart: middlegameStartPly, newEndgameStart: null };
  }
  const inBook = isBookMove(moveSans, ply - 1);
  const fullMoves = Math.floor((ply - 1) / 2) + 1;
  const isMiddlegame = !inBook && fullMoves > 10 || mm.total < 10 || mm.whiteBackRank + mm.blackBackRank < 4;
  if (isMiddlegame) {
    return { phase: "middlegame", newMiddlegameStart: ply, newEndgameStart: null };
  }
  return { phase: "opening", newMiddlegameStart: null, newEndgameStart: null };
}
function isChessGameOver(c) {
  return typeof c.isGameOver === 'function' ? c.isGameOver() : (typeof c.game_over === 'function' ? c.game_over() : false);
}
function isChessCheckmate(c) {
  return typeof c.isCheckmate === 'function' ? c.isCheckmate() : (typeof c.in_checkmate === 'function' ? c.in_checkmate() : false);
}
function isChessInCheck(c) {
  return typeof c.inCheck === 'function' ? c.inCheck() : (typeof c.in_check === 'function' ? c.in_check() : false);
}

function evaluatePositionLocally(fen) {
  const chess = new Chess(fen);
  if (isChessGameOver(chess)) {
    if (isChessCheckmate(chess)) {
      return { cp: 0, mate: chess.turn() === "w" ? -1 : 1 };
    }
    return { cp: 0, mate: null };
  }
  let material = 0;
  let positional = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const baseVal = PIECE_VALUES[piece.type];
      const squareIdx = r * 8 + c;
      const flippedIdx = (7 - r) * 8 + c;
      let pstVal = 0;
      switch (piece.type) {
        case "p":
          pstVal = piece.color === "w" ? PST_MG_PAWN[squareIdx] : PST_MG_PAWN[flippedIdx];
          break;
        case "n":
          pstVal = piece.color === "w" ? PST_MG_KNIGHT[squareIdx] : PST_MG_KNIGHT[flippedIdx];
          break;
        case "b":
          pstVal = piece.color === "w" ? PST_MG_BISHOP[squareIdx] : PST_MG_BISHOP[flippedIdx];
          break;
        case "r":
          pstVal = piece.color === "w" ? PST_MG_ROOK[squareIdx] : PST_MG_ROOK[flippedIdx];
          break;
        case "q":
          pstVal = piece.color === "w" ? PST_MG_QUEEN[squareIdx] : PST_MG_QUEEN[flippedIdx];
          break;
        case "k":
          pstVal = piece.color === "w" ? PST_MG_KING[squareIdx] : PST_MG_KING[flippedIdx];
          break;
      }
      if (piece.color === "w") {
        material += baseVal;
        positional += pstVal;
      } else {
        material -= baseVal;
        positional -= pstVal;
      }
    }
  }
  const currentTurn = chess.turn();
  const mobility = (currentTurn === "w" ? 1 : -1) * (chess.moves().length * 2.5);
  return { cp: material + positional + Math.round(mobility), mate: null };
}
function scoreMoveForOrdering(move) {
  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured] || 100;
    const attackerVal = PIECE_VALUES[move.piece] || 100;
    return 1e4 + victimVal * 10 - attackerVal;
  }
  if (move.promotion) {
    return 9e3;
  }
  if (move.san.includes("+")) {
    return 5e3;
  }
  return 0;
}
function quiescence(chess, alpha, beta, qDepth = 0) {
  const standPat = evaluatePositionLocally(chess.fen()).cp;
  const isWhite = chess.turn() === "w";
  if (qDepth >= 4) return standPat;
  if (isWhite) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }
  const captures = chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion || m.san.includes("+"));
  captures.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  for (const cap of captures) {
    chess.move(cap);
    const score = quiescence(chess, alpha, beta, qDepth + 1);
    chess.undo();
    if (isWhite) {
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    } else {
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
  }
  return isWhite ? alpha : beta;
}
function alphaBeta(chess, depth, alpha, beta, pvArray) {
  if (depth === 0 || isChessGameOver(chess)) {
    return quiescence(chess, alpha, beta);
  }
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    if (isChessCheckmate(chess)) {
      return chess.turn() === "w" ? -3e4 : 3e4;
    }
    return 0;
  }
  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  const isWhite = chess.turn() === "w";
  let bestScore = isWhite ? -Infinity : Infinity;
  let childPv = [];
  for (const move of moves) {
    chess.move(move);
    const localChildPv = [];
    const score = alphaBeta(chess, depth - 1, alpha, beta, localChildPv);
    chess.undo();
    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        const uci = `${move.from}${move.to}${move.promotion || ""}`;
        pvArray.length = 0;
        pvArray.push(uci, ...localChildPv);
      }
      if (bestScore > alpha) alpha = bestScore;
      if (beta <= alpha) break;
    } else {
      if (score < bestScore) {
        bestScore = score;
        const uci = `${move.from}${move.to}${move.promotion || ""}`;
        pvArray.length = 0;
        pvArray.push(uci, ...localChildPv);
      }
      if (bestScore < beta) beta = bestScore;
      if (beta <= alpha) break;
    }
  }
  return bestScore;
}
function findBestMoveLocal(fen, depth = 3) {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return { bestMoveUci: "", bestMoveSan: "", secondBestMoveUci: "", secondBestMoveSan: "", evalCp: 0, pv: [] };
  }
  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  const isWhite = chess.turn() === "w";
  let bestScore = isWhite ? -Infinity : Infinity;
  let secondBestScore = isWhite ? -Infinity : Infinity;
  let bestMove = moves[0];
  let secondBestMove = moves.length > 1 ? moves[1] : null;
  let finalPv = [];
  let alpha = -Infinity;
  let beta = Infinity;
  for (const move of moves) {
    chess.move(move);
    const childPv = [];
    const score = alphaBeta(chess, depth - 1, alpha, beta, childPv);
    chess.undo();
    const moveUci = `${move.from}${move.to}${move.promotion || ""}`;
    if (isWhite) {
      if (score > bestScore) {
        secondBestScore = bestScore;
        secondBestMove = bestMove;
        bestScore = score;
        bestMove = move;
        finalPv = [moveUci, ...childPv];
        alpha = Math.max(alpha, bestScore);
      } else if (score > secondBestScore) {
        secondBestScore = score;
        secondBestMove = move;
      }
    } else {
      if (score < bestScore) {
        secondBestScore = bestScore;
        secondBestMove = bestMove;
        bestScore = score;
        bestMove = move;
        finalPv = [moveUci, ...childPv];
        beta = Math.min(beta, bestScore);
      } else if (score < secondBestScore) {
        secondBestScore = score;
        secondBestMove = move;
      }
    }
  }

  const bestMoveUci = `${bestMove.from}${bestMove.to}${bestMove.promotion || ""}`;
  let secondBestMoveUci = "";
  let secondBestMoveSan = "";
  if (secondBestMove && (secondBestMove.from !== bestMove.from || secondBestMove.to !== bestMove.to)) {
    secondBestMoveUci = `${secondBestMove.from}${secondBestMove.to}${secondBestMove.promotion || ""}`;
    secondBestMoveSan = secondBestMove.san || "";
  } else if (moves.length > 1) {
    const fallbackMove = moves.find((m) => m.from !== bestMove.from || m.to !== bestMove.to);
    if (fallbackMove) {
      secondBestMoveUci = `${fallbackMove.from}${fallbackMove.to}${fallbackMove.promotion || ""}`;
      secondBestMoveSan = fallbackMove.san || "";
    }
  }

  return {
    bestMoveUci,
    bestMoveSan: bestMove.san,
    secondBestMoveUci,
    secondBestMoveSan,
    evalCp: bestScore,
    multiPv2Cp: secondBestScore !== (isWhite ? -Infinity : Infinity) ? secondBestScore : void 0,
    pv: finalPv.length > 0 ? finalPv : [bestMoveUci]
  };
}
async function fetchLichessCloudEval(fen) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e3);
    const encodedFen = encodeURIComponent(fen);
    const res = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodedFen}&multiPv=2`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.pvs && data.pvs.length > 0) {
        const top = data.pvs[0];
        const second = data.pvs[1];
        const pvStr = top.moves ? top.moves.split(" ") : [];
        return {
          scoreCp: top.cp ?? (top.mate ? top.mate > 0 ? 3e3 : -3e3 : 0),
          mate: top.mate ?? null,
          pv: pvStr,
          multiPv2ScoreCp: second ? second.cp ?? void 0 : void 0,
          source: "cloud"
        };
      }
    }
  } catch {
  }
  return null;
}
async function fetchSyzygyTablebase(fen) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const encodedFen = encodeURIComponent(fen);
    const res = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodedFen}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.category) {
        let cp = 0;
        let mate = null;
        if (data.category === "win") {
          cp = 3e3;
          mate = data.dtm ? Math.ceil(Math.abs(data.dtm) / 2) : 10;
        } else if (data.category === "loss") {
          cp = -3e3;
          mate = data.dtm ? -Math.ceil(Math.abs(data.dtm) / 2) : -10;
        }
        const topMove = data.moves && data.moves[0] ? data.moves[0].uci : "";
        return {
          scoreCp: cp,
          mate,
          pv: topMove ? [topMove] : [],
          source: "tablebase"
        };
      }
    }
  } catch {
  }
  return null;
}
function normalizeFenKey(fen) {
  if (!fen) return "";
  const parts = fen.trim().split(/\s+/);
  return parts.slice(0, 4).join(" ");
}

const ENGINE_PROFILES = {
  fast: { depth: 8, maxWaitMs: 300 },
  deep: { depth: 12, maxWaitMs: 600 },
  insights: { depth: 8, maxWaitMs: 100 }
};

function toWhitePerspective(result, fen) {
  if (fen.split(" ")[1] !== "b") return result;
  return {
    ...result,
    scoreCp: -result.scoreCp,
    mate: result.mate === null || result.mate === void 0 ? result.mate : -result.mate,
    multiPv2ScoreCp: result.multiPv2ScoreCp === void 0 ? void 0 : -result.multiPv2ScoreCp
  };
}

function localEvaluation(fen, depth) {
  const localSearch = findBestMoveLocal(fen, depth);
  return {
    scoreCp: localSearch.evalCp,
    mate: null,
    pv: localSearch.pv,
    bestMoveUci: localSearch.bestMoveUci,
    secondBestMoveUci: localSearch.secondBestMoveUci,
    multiPv2ScoreCp: localSearch.multiPv2Cp,
    source: "local"
  };
}

async function evaluateFenHybrid(fen, isDeep = false) {
  const profileKey = typeof isDeep === "string" ? isDeep : (isDeep ? "deep" : "fast");
  const cacheKey = `${normalizeFenKey(fen)}_${profileKey}`;
  const cached = FEN_EVAL_CACHE.get(cacheKey);
  if (cached) return cached;

  if (isDeep === true && countTotalPieces(new Chess(fen)) <= 7) {
    const tablebase = await fetchSyzygyTablebase(fen);
    if (tablebase) {
      tablebase.bestMoveUci = tablebase.bestMoveUci || (tablebase.pv && tablebase.pv[0]) || "";
      tablebase.secondBestMoveUci = tablebase.secondBestMoveUci || findBestMoveLocal(fen, 1).secondBestMoveUci;
      const whiteResult = toWhitePerspective(tablebase, fen);
      FEN_EVAL_CACHE.set(cacheKey, whiteResult);
      return whiteResult;
    }
  }

  const profile = ENGINE_PROFILES[profileKey] || ENGINE_PROFILES.fast;
  const sfEval = await stockfishService.evaluate(fen, profile.depth, profile.maxWaitMs);
  if (sfEval && sfEval.bestMoveUci) {
    const fallback = sfEval.secondBestMoveUci && sfEval.multiPv2ScoreCp !== void 0 ? null : findBestMoveLocal(fen, 1);
    const sfResult = toWhitePerspective({
      scoreCp: sfEval.scoreCp,
      mate: sfEval.mate,
      pv: sfEval.pv,
      bestMoveUci: sfEval.bestMoveUci,
      secondBestMoveUci: sfEval.secondBestMoveUci || fallback?.secondBestMoveUci || "",
      multiPv2ScoreCp: sfEval.multiPv2ScoreCp ?? fallback?.multiPv2Cp,
      source: "stockfish"
    }, fen);
    FEN_EVAL_CACHE.set(cacheKey, sfResult);
    return sfResult;
  }

  const localResult = localEvaluation(fen, profile.depth <= 8 ? 2 : 3);
  FEN_EVAL_CACHE.set(cacheKey, localResult);
  return localResult;
}

async function prefetchEvaluations(fens, isDeep, onEach) {
  const unique = [...new Set(fens)];
  stockfishService.warmUp();
  const feederCount = Math.max(2, stockfishService.targetSize || stockfishService.size);
  const profileKey = typeof isDeep === "string" ? isDeep : (isDeep ? "deep" : "fast");
  console.log(`[Engine] Starting prefetch: ${unique.length} positions (profile: ${profileKey}, feeders: ${feederCount})`);
  let next = 0;
  let done = 0;
  let failure = null;
  const startedAt = Date.now();

  const feeders = Array.from({ length: feederCount }, async (_, feederIdx) => {
    while (!failure && next < unique.length) {
      const fen = unique[next++];
      try {
        await evaluateFenHybrid(fen, isDeep);
        done++;
        if (onEach) await onEach(done, unique.length);
      } catch (err) {
        console.error(`[Engine] Feeder ${feederIdx} error on fen ${fen}:`, err);
        failure = err;
      }
    }
  });
  await Promise.all(feeders);
  const elapsedMs = Date.now() - startedAt;
  console.log(`[Engine] Prefetch completed: ${done}/${unique.length} positions evaluated in ${elapsedMs}ms (${(elapsedMs / (done || 1)).toFixed(1)}ms/pos)`);
  if (failure) throw failure;
}

function isMaterialSacrifice(fenBefore, fenAfter, moverColor, opponentBestUci = null) {
  try {
    const cBefore = new Chess(fenBefore);
    const cAfter = new Chess(fenAfter);

    if (opponentBestUci && opponentBestUci.length >= 4) {
      const from = opponentBestUci.slice(0, 2);
      const to = opponentBestUci.slice(2, 4);
      const promotion = opponentBestUci.length > 4 ? opponentBestUci[4] : void 0;
      const oppMove = cAfter.move({ from, to, promotion });
      if (oppMove && oppMove.captured) {
        let moverValBefore = 0;
        let moverValAfterOpp = 0;
        cBefore.board().flat().forEach((p) => {
          if (p && p.color === moverColor && p.type !== "k") moverValBefore += PIECE_VALUES[p.type];
        });
        cAfter.board().flat().forEach((p) => {
          if (p && p.color === moverColor && p.type !== "k") moverValAfterOpp += PIECE_VALUES[p.type];
        });
        if (moverValAfterOpp <= moverValBefore - 200) {
          return true;
        }
      }
    }

    let moverValBefore = 0;
    let moverValAfter = 0;
    cBefore.board().flat().forEach((p) => {
      if (p && p.color === moverColor && p.type !== "k") moverValBefore += PIECE_VALUES[p.type];
    });
    cAfter.board().flat().forEach((p) => {
      if (p && p.color === moverColor && p.type !== "k") moverValAfter += PIECE_VALUES[p.type];
    });
    return moverValAfter <= moverValBefore - 200;
  } catch {
    return false;
  }
}

function classifyMove(
  playedUci,
  bestMoveUci,
  winProbBefore,
  winProbAfter,
  winProbLoss,
  isBook,
  multiPv1WinProb,
  multiPv2WinProb,
  fenBefore,
  fenAfter,
  moverColor,
  opponentBestUci = null
) {
  if (isBook) return "book";
  const isExactBest = Boolean(bestMoveUci && playedUci && playedUci.toLowerCase() === bestMoveUci.toLowerCase());

  if (isExactBest) {
    if (winProbAfter >= 0.48 && winProbBefore < 0.90) {
      if (isMaterialSacrifice(fenBefore, fenAfter, moverColor, opponentBestUci)) {
        return "brilliant";
      }
    }
    if (multiPv2WinProb !== void 0 && multiPv1WinProb - multiPv2WinProb >= 0.10) {
      return "great";
    }
    return "best";
  }

  if (winProbBefore >= 0.75 && winProbAfter <= 0.55) {
    return "missed_win";
  }
  if (winProbLoss > 0.20) return "blunder";
  if (winProbLoss > 0.10) return "mistake";
  if (winProbLoss > 0.05) return "inaccuracy";
  if (winProbLoss <= 0.02) return "excellent";
  return "good";
}

function calculatePerformanceElo(baseElo, accuracy, movesCount, result = "*", userColor = "w") {
  if (!movesCount || movesCount < 3) return null;
  const anchor = baseElo && baseElo >= 400 ? baseElo : 1500;
  const acc = typeof accuracy === 'number' && !isNaN(accuracy) ? accuracy : 80;
  const expectedAcc = Math.min(96, Math.max(50, 48 + (anchor / 50)));
  const accDelta = acc - expectedAcc;
  const eloDelta = accDelta * 32;
  const clampedDelta = Math.min(500, Math.max(-500, eloDelta));

  let resultBonus = 0;
  if (result === "1-0") {
    resultBonus = userColor === "w" ? 25 : -25;
  } else if (result === "0-1") {
    resultBonus = userColor === "b" ? 25 : -25;
  }

  const estimated = Math.round(anchor + clampedDelta + resultBonus);
  return Math.min(3100, Math.max(400, estimated));
}

var calculatePhaseElo = calculatePerformanceElo;

/* --- src/services/engineRefutations.js --- */
async function detectThreat(fen) {
  try {
    const chess = new Chess(fen);
    if (isChessGameOver(chess)) return null;
    const parts = fen.split(" ");
    const opponentColor = parts[1] === "w" ? "b" : "w";
    parts[1] = opponentColor;
    parts[3] = "-";
    const invertedFen = parts.join(" ");
    const opponentChess = new Chess(invertedFen);
    const engineResult = await evaluateFenHybrid(invertedFen, false);
    if (engineResult.pv && engineResult.pv.length > 0) {
      const threatUci = engineResult.pv[0];
      const from = threatUci.slice(0, 2);
      const to = threatUci.slice(2, 4);
      const promotion = threatUci.length > 4 ? threatUci[4] : void 0;
      const move = opponentChess.move({ from, to, promotion });
      if (!move) return null;
      const pieceNameMap = {
        p: "Pawn",
        n: "Knight",
        b: "Bishop",
        r: "Rook",
        q: "Queen",
        k: "King"
      };
      if (isChessCheckmate(opponentChess)) {
        return {
          uci: threatUci,
          san: move.san,
          description: `Immediate Checkmate on ${move.to}!`
        };
      }
      if (move.captured) {
        const victimName = pieceNameMap[move.captured.toLowerCase()] || "Piece";
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens to capture ${victimName} on ${move.to}`
        };
      }
      if (isChessInCheck(opponentChess)) {
        const attackerName = pieceNameMap[move.piece.toLowerCase()] || "Piece";
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens forcing check with ${attackerName} on ${move.to}`
        };
      }
      const attackedSquares = opponentChess.moves({ verbose: true });
      const attackedValuable = attackedSquares.filter(
        (m) => m.captured && ["q", "r", "b", "n"].includes(m.captured)
      );
      if (attackedValuable.length >= 2) {
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens tactical fork on ${move.to}`
        };
      }
    }
  } catch {
  }
  return null;
}

async function getDeepContinuation(fen, maxPlies = 10) {
  const steps = [];
  try {
    const chess = new Chess(fen);
    let pvMoves = [];

    if (stockfishService && stockfishService.isAvailable) {
      try {
        const sf = await stockfishService.evaluate(fen, 14, 1000);
        if (sf && sf.pv && sf.pv.length > 0) {
          pvMoves = sf.pv;
        }
      } catch {
      }
    }

    if (pvMoves.length === 0) {
      const local = findBestMoveLocal(fen, 2);
      if (local && local.pv && local.pv.length > 0) {
        pvMoves = local.pv;
      }
    }

    let currentFen = fen;
    for (let i = 0; i < maxPlies; i++) {
      if (isChessGameOver(chess)) break;

      let nextUci = pvMoves[i];
      if (!nextUci) {
        const local = findBestMoveLocal(currentFen, 2);
        nextUci = local.bestMoveUci;
      }
      if (!nextUci || nextUci.length < 4) break;

      const from = nextUci.slice(0, 2);
      const to = nextUci.slice(2, 4);
      const promotion = nextUci.length > 4 ? nextUci[4] : void 0;
      const m = chess.move({ from, to, promotion });
      if (!m) break;

      currentFen = chess.fen();
      steps.push({
        ply: i + 1,
        san: m.san,
        uci: `${m.from}${m.to}${m.promotion || ''}`,
        from: m.from,
        to: m.to,
        fen: currentFen,
        color: m.color,
        piece: m.piece,
        captured: m.captured || null,
        isCheck: isChessInCheck(chess),
        isCheckmate: isChessCheckmate(chess)
      });
    }
  } catch {
  }
  return steps;
}

function summarizePunishment(fenStart, fenEnd, moverColor) {
  try {
    const cEnd = new Chess(fenEnd);
    if (isChessCheckmate(cEnd)) {
      return "Forces checkmate against you";
    }

    const cStart = new Chess(fenStart);
    const pieceVal = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let moverStart = 0;
    let oppStart = 0;
    cStart.board().flat().forEach((p) => {
      if (p) {
        if (p.color === moverColor) moverStart += (pieceVal[p.type] || 0);
        else oppStart += (pieceVal[p.type] || 0);
      }
    });

    let moverEnd = 0;
    let oppEnd = 0;
    cEnd.board().flat().forEach((p) => {
      if (p) {
        if (p.color === moverColor) moverEnd += (pieceVal[p.type] || 0);
        else oppEnd += (pieceVal[p.type] || 0);
      }
    });

    const netLoss = (moverStart - oppStart) - (moverEnd - oppEnd);
    if (netLoss >= 9) return `Opponent wins your Queen (+${netLoss})`;
    if (netLoss >= 5) return `Opponent wins a Rook (+${netLoss})`;
    if (netLoss >= 3) return `Opponent wins a minor piece (+${netLoss})`;
    if (netLoss >= 1) return `Opponent wins material (+${netLoss} pawn${netLoss > 1 ? 's' : ''})`;
    return "Opponent converts into a winning positional advantage";
  } catch {
    return "Opponent gains a decisive tactical advantage";
  }
}

function replayPv(fen, pvMoves, maxPlies = 10) {
  const steps = [];
  if (!fen || !Array.isArray(pvMoves) || pvMoves.length === 0) return steps;
  try {
    const chess = new Chess(fen);
    for (let i = 0; i < Math.min(pvMoves.length, maxPlies); i++) {
      if (isChessGameOver(chess)) break;
      const uci = pvMoves[i];
      if (!uci || uci.length < 4) break;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : void 0;
      const m = chess.move({ from, to, promotion });
      if (!m) break;
      steps.push({
        ply: i + 1,
        san: m.san,
        uci,
        from: m.from,
        to: m.to,
        fen: chess.fen(),
        color: m.color,
        piece: m.piece
      });
    }
  } catch {}
  return steps;
}

var MIN_CONTINUATION_PLIES = 6;

async function extendContinuation(startFen, steps, maxPlies = 10) {
  if (steps.length >= MIN_CONTINUATION_PLIES) return steps;
  const lastFen = steps.length > 0 ? steps[steps.length - 1].fen : startFen;
  const extra = await getDeepContinuation(lastFen, maxPlies - steps.length);
  const merged = [...steps];
  extra.forEach((step) => merged.push({ ...step, ply: merged.length + 1 }));
  return merged;
}

async function prepareMoveExplanation(cur) {
  if (!cur) return null;
  try {
    const punishmentSteps = [
      { ply: 0, fen: cur.fen, from: cur.from, to: cur.to, san: cur.san }
    ];

    let deepPunish = [];
    if (cur.punishmentPv && cur.punishmentPv.length > 0) {
      deepPunish = replayPv(cur.fen, cur.punishmentPv, 10);
    }
    punishmentSteps.push(...deepPunish);

    const endFen = punishmentSteps[punishmentSteps.length - 1].fen;
    const punishmentSummary = summarizePunishment(cur.fen, endFen, cur.color);

    const bestSteps = [
      { ply: 0, fen: cur.fenBefore, from: null, to: null, san: 'Start' }
    ];

    let deepBest = [];
    if (cur.bestPv && cur.bestPv.length > 0) {
      deepBest = replayPv(cur.fenBefore, cur.bestPv, 10);
    }
    if (deepBest.length === 0) {
      deepBest = replayPv(cur.fenBefore, [cur.bestMoveUci], 1);
    }
    bestSteps.push(...deepBest);

    const bestSan = cur.bestMoveSan || bestSteps[1]?.san || 'the suggested move';
    const bestSummary = `Playing ${bestSan} retains full equality or advantage with no tactical loss.`;

    return {
      punishmentSteps,
      punishmentSummary,
      bestSteps,
      bestSummary,
      winProbBefore: cur.winProbBefore,
      winProbAfter: cur.winProbAfter,
      scoreBefore: cur.scoreBefore,
      scoreAfter: cur.scoreAfter,
      classification: cur.classification
    };
  } catch {
    return null;
  }
}

/* --- src/services/gameCacheService.js --- */
const INDEX_KEY = 'chess_iq_analyzed_index_v2';
const GAME_PREFIX = 'chess_iq_game_v2_';
const MAX_CACHED_GAMES = 30;

(function removeLegacyCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('chess_iq_game_v1_') || k === 'chess_iq_analyzed_index_v1')
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
})();

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function getGameCacheKey(gameIdOrPgn, userColor = 'w') {
  if (!gameIdOrPgn) return '';
  const clean = typeof gameIdOrPgn === 'string' ? gameIdOrPgn.trim() : '';
  if (clean.length < 64 && !clean.includes('\n') && !clean.includes('1.')) {
    return `id_${clean}_${userColor}`;
  }
  return `pgn_${hashString(clean)}_${userColor}`;
}

function getCacheIndex() {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCacheIndex(index) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {}
}

function getGameCacheInfo(gameIdOrPgn, userColor = 'w') {
  const key = getGameCacheKey(gameIdOrPgn, userColor);
  if (!key) return null;
  const index = getCacheIndex();
  const entry = index.find((item) => item.key === key);
  return entry || null;
}

function getCachedGame(gameIdOrPgn, userColor = 'w') {
  const key = getGameCacheKey(gameIdOrPgn, userColor);
  if (!key) return null;
  try {
    const raw = localStorage.getItem(`${GAME_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCachedGame(gameIdOrPgn, userColor, analyzedGame) {
  if (!gameIdOrPgn || !analyzedGame) return;
  const key = getGameCacheKey(gameIdOrPgn, userColor);
  if (!key) return;

  try {
    const serialized = JSON.stringify(analyzedGame);
    localStorage.setItem(`${GAME_PREFIX}${key}`, serialized);

    let index = getCacheIndex().filter((item) => item.key !== key);
    index.unshift({
      key,
      id: analyzedGame.id || key,
      white: analyzedGame.white || 'White',
      black: analyzedGame.black || 'Black',
      whiteElo: analyzedGame.whiteElo || 1500,
      blackElo: analyzedGame.blackElo || 1500,
      result: analyzedGame.result || '*',
      date: analyzedGame.date || '',
      userColor: analyzedGame.userColor || userColor,
      accuracy: analyzedGame.userAccuracy ?? analyzedGame.accuracy ?? 85,
      elo: analyzedGame.overallGameElo || 1500,
      eco: analyzedGame.eco || '',
      ecoName: analyzedGame.ecoName || '',
      timeControl: analyzedGame.timeControl || '',
      savedAt: Date.now()
    });

    while (index.length > MAX_CACHED_GAMES) {
      const removed = index.pop();
      if (removed) {
        localStorage.removeItem(`${GAME_PREFIX}${removed.key}`);
      }
    }

    saveCacheIndex(index);
    window.dispatchEvent(new CustomEvent('chess_iq_cache_updated', { detail: { key } }));
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      pruneOldestGames(10);
      try {
        localStorage.setItem(`${GAME_PREFIX}${key}`, JSON.stringify(analyzedGame));
      } catch {}
    }
  }
}

function pruneOldestGames(count = 5) {
  let index = getCacheIndex();
  for (let i = 0; i < count && index.length > 0; i++) {
    const removed = index.pop();
    if (removed) {
      localStorage.removeItem(`${GAME_PREFIX}${removed.key}`);
    }
  }
  saveCacheIndex(index);
}

function clearGameCache() {
  const index = getCacheIndex();
  index.forEach((item) => {
    localStorage.removeItem(`${GAME_PREFIX}${item.key}`);
  });
  localStorage.removeItem(INDEX_KEY);
  window.dispatchEvent(new CustomEvent('chess_iq_cache_cleared'));
}

function getCacheStats() {
  const index = getCacheIndex();
  return {
    count: index.length,
    index
  };
}

/* --- src/services/importApi.js --- */
function parseClockToSeconds(clockStr) {
  const match = clockStr.match(/(\d+):(\d+):?(\d+)?(\.\d+)?/);
  if (!match) return null;
  if (match[3] !== void 0) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseFloat(`${match[3]}${match[4] || ""}`);
    return h * 3600 + m * 60 + s;
  } else {
    const m = parseInt(match[1], 10);
    const s = parseFloat(`${match[2]}${match[4] || ""}`);
    return m * 60 + s;
  }
}
function extractMovesAndClocks(pgn) {
  const moveText = pgn.replace(/\[[^\]]*\]/g, " ").trim();
  const moves = [];
  const clocks = [];
  const tokens = moveText.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    if (/^\d+\.+$/.test(token) || ["1-0", "0-1", "1/2-1/2", "*"].includes(token)) {
      continue;
    }
    if (token.includes("[%clk")) {
      let comment = token;
      while (!comment.includes("]") && i + 1 < tokens.length) {
        i++;
        comment += " " + tokens[i];
      }
      const clkMatch = comment.match(/\[%clk\s+([^\]]+)\]/);
      if (clkMatch) {
        const clk = parseClockToSeconds(clkMatch[1]);
        if (clocks.length > 0 && clocks[clocks.length - 1] === null) {
          clocks[clocks.length - 1] = clk;
        }
      }
      continue;
    }
    if (/^[a-hKQRBNPOo0-9+#=x-]+$/.test(token)) {
      moves.push(token);
      clocks.push(null);
    }
  }
  return { moves, clocks };
}
async function analyzeFullPgn(pgn, userColorTarget, isDeep = false, onProgress, skipExtras = false) {
  const chess = new Chess();
  try {
    if (typeof chess.loadPgn === "function") {
      chess.loadPgn(pgn);
    } else if (typeof chess.load_pgn === "function") {
      chess.load_pgn(pgn);
    }
  } catch {
  }
  const header = chess.header();
  const white = header["White"] || "White";
  const black = header["Black"] || "Black";
  const whiteElo = parseInt(header["WhiteElo"] || "1500", 10) || 1500;
  const blackElo = parseInt(header["BlackElo"] || "1500", 10) || 1500;
  const resultRaw = header["Result"] || "*";
  const result = ["1-0", "0-1", "1/2-1/2"].includes(resultRaw) ? resultRaw : "*";
  const date = header["Date"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const timeControl = header["TimeControl"] || "300+0";
  const { moves: parsedMoves, clocks } = extractMovesAndClocks(pgn);
  let moveHistory = chess.history({ verbose: true });
  if (moveHistory.length === 0 && parsedMoves.length > 0) {
    const fallbackChess = new Chess();
    for (const san of parsedMoves) {
      try {
        fallbackChess.move(san);
      } catch {}
    }
    moveHistory = fallbackChess.history({ verbose: true });
  }
  const moveSans = moveHistory.length > 0 ? moveHistory.map((m) => m.san) : parsedMoves;
  const userColor = userColorTarget || "w";
  const userBaseElo = userColor === "w" ? whiteElo : blackElo;
  const ecoMatch = findMatchingEco(moveSans);
  const ecoCode = header["ECO"] || ecoMatch.eco;
  const ecoName = ecoMatch.name;
  const replayChess = new Chess();
  const precomputed = [];
  let middlegameStartPly = null;
  let endgameStartPly = null;
  let lastWhiteClock = null;
  let lastBlackClock = null;
  for (let i = 0; i < moveHistory.length; i++) {
    const moveObj = moveHistory[i];
    const fenBefore = replayChess.fen();
    const side = replayChess.turn();
    const plyNum = i + 1;
    const phaseInfo = detectPhase(plyNum, replayChess, moveSans, middlegameStartPly, endgameStartPly);
    if (phaseInfo.newMiddlegameStart && !middlegameStartPly) middlegameStartPly = phaseInfo.newMiddlegameStart;
    if (phaseInfo.newEndgameStart && !endgameStartPly) endgameStartPly = phaseInfo.newEndgameStart;
    const rawClock = clocks[i] ?? null;
    let timeSpent = null;
    if (rawClock !== null) {
      if (side === "w") {
        if (lastWhiteClock !== null) timeSpent = Math.max(0.1, lastWhiteClock - rawClock);
        lastWhiteClock = rawClock;
      } else {
        if (lastBlackClock !== null) timeSpent = Math.max(0.1, lastBlackClock - rawClock);
        lastBlackClock = rawClock;
      }
    }
    const isTimeTrouble = rawClock !== null && rawClock < 20;
    const isBook = isBookMove(moveSans, i);
    replayChess.move(moveObj);
    const fenAfter = replayChess.fen();
    precomputed.push({
      plyNum,
      moveObj,
      fenBefore,
      fenAfter,
      side,
      isBook,
      rawClock,
      timeSpent,
      isTimeTrouble,
      phase: phaseInfo.phase
    });
  }
  const totalPlies = precomputed.length;
  const plies = new Array(totalPlies);
  const analysisStart = Date.now();
  console.log(`[Analysis] Starting: ${white} (${whiteElo}) vs ${black} (${blackElo}) | ${totalPlies} plies | userColor: ${userColor} | deep: ${isDeep}`);

  if (onProgress) {
    onProgress(0, totalPlies);
    await new Promise((resolve) => setTimeout(resolve, 35));
  }

  const fensToEvaluate = [];
  if (totalPlies > 0) fensToEvaluate.push(precomputed[0].fenBefore);
  precomputed.forEach((item, idx) => {
    const nextIsEngineMove = idx + 1 < totalPlies && !precomputed[idx + 1].isBook;
    if (!item.isBook || nextIsEngineMove) fensToEvaluate.push(item.fenAfter);
  });
  console.log(`[Analysis] Collected ${fensToEvaluate.length} positions to evaluate (${precomputed.filter(p => p.isBook).length} book moves skipped)`);
  await prefetchEvaluations(fensToEvaluate, isDeep, (done, total) => {
    if (onProgress) return onProgress(Math.round((done / total) * totalPlies), totalPlies);
  });

  let prevEngine = precomputed.length > 0
    ? await evaluateFenHybrid(precomputed[0].fenBefore, isDeep)
    : { scoreCp: 20, mate: null, pv: [] };

  for (let i = 0; i < totalPlies; i++) {
    const item = precomputed[i];
    if (i === 0 || i % 20 === 0 || i === totalPlies - 1) {
      console.log(`[Analysis] Move evaluation progress: ${i + 1}/${totalPlies} plies`);
    }
    if (item.isBook) {
      const playedUci2 = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const isImpulsive2 = item.timeSpent !== null && item.timeSpent < 2 && !item.isTimeTrouble;
      plies[i] = {
        ply: item.plyNum,
        san: item.moveObj.san,
        uci: playedUci2,
        from: item.moveObj.from,
        to: item.moveObj.to,
        piece: item.moveObj.piece,
        captured: item.moveObj.captured,
        color: item.side,
        fen: item.fenAfter,
        fenBefore: item.fenBefore,
        clock: item.rawClock,
        timeSpent: item.timeSpent,
        isTimeTrouble: item.isTimeTrouble,
        isImpulsive: isImpulsive2,
        scoreCp: 20,
        mate: null,
        winProb: 0.52,
        winProbBefore: 0.5,
        winProbLoss: 0,
        accuracy: 100,
        classification: "book",
        bestMoveUci: playedUci2,
        bestMoveSan: item.moveObj.san,
        secondBestMoveUci: "",
        secondBestMoveSan: "",
        pv: [playedUci2],
        threat: null,
        phase: item.phase
      };
      prevEngine = { scoreCp: 20, mate: null, pv: [playedUci2] };
    } else {
      let engineBefore = prevEngine;
      if (!engineBefore || !engineBefore.bestMoveUci || (i > 0 && precomputed[i - 1].isBook)) {
        engineBefore = await evaluateFenHybrid(item.fenBefore, isDeep);
      }
      const engineAfter = await evaluateFenHybrid(item.fenAfter, isDeep);
      prevEngine = engineAfter;

      const whiteScoreBefore = engineBefore.scoreCp;
      const whiteWinProbBefore = cpToWinProb(whiteScoreBefore, engineBefore.mate);
      const whiteScoreAfter = engineAfter.scoreCp;
      const whiteWinProbAfter = cpToWinProb(whiteScoreAfter, engineAfter.mate);
      const moverWinProbBefore = item.side === "w" ? whiteWinProbBefore : 1 - whiteWinProbBefore;
      const moverWinProbAfter = item.side === "w" ? whiteWinProbAfter : 1 - whiteWinProbAfter;
      const winProbLoss = Math.max(0, moverWinProbBefore - moverWinProbAfter);
      const accuracy = calculateMoveAccuracy(winProbLoss);
      const bestMoveUci = (engineBefore.pv && engineBefore.pv[0]) || engineBefore.bestMoveUci || "";
      let bestMoveSan = "";
      if (bestMoveUci) {
        try {
          const testChess = new Chess(item.fenBefore);
          const from = bestMoveUci.slice(0, 2);
          const to = bestMoveUci.slice(2, 4);
          const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : void 0;
          const m = testChess.move({ from, to, promotion });
          if (m) bestMoveSan = m.san;
        } catch {
          bestMoveSan = bestMoveUci;
        }
      }
      const secondBestMoveUci = engineBefore.secondBestMoveUci || "";
      let secondBestMoveSan = "";
      if (secondBestMoveUci && secondBestMoveUci !== bestMoveUci) {
        try {
          const testChess2 = new Chess(item.fenBefore);
          const from = secondBestMoveUci.slice(0, 2);
          const to = secondBestMoveUci.slice(2, 4);
          const promotion = secondBestMoveUci.length > 4 ? secondBestMoveUci[4] : void 0;
          const m2 = testChess2.move({ from, to, promotion });
          if (m2) secondBestMoveSan = m2.san;
        } catch {
          secondBestMoveSan = secondBestMoveUci;
        }
      }
      const playedUci = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const oppBestUci = (engineAfter.pv && engineAfter.pv[0]) || "";
      const multiPv2WinProb = engineBefore.multiPv2ScoreCp !== void 0 ? cpToWinProb(engineBefore.multiPv2ScoreCp) : void 0;
      const moverMultiPv2WinProb = multiPv2WinProb !== void 0
        ? (item.side === "w" ? multiPv2WinProb : 1 - multiPv2WinProb)
        : void 0;
      const classification = classifyMove(
        playedUci,
        bestMoveUci,
        moverWinProbBefore,
        moverWinProbAfter,
        winProbLoss,
        item.isBook,
        moverWinProbBefore,
        moverMultiPv2WinProb,
        item.fenBefore,
        item.fenAfter,
        item.side,
        oppBestUci
      );
      const isImpulsive = item.timeSpent !== null && item.timeSpent < 2 && (classification === "blunder" || classification === "mistake") && !item.isTimeTrouble;
      let threat = null;
      let explanation = null;
      if (!skipExtras && (classification === "blunder" || winProbLoss > 0.15)) {
        threat = await detectThreat(item.fenAfter);
      }
      if (!skipExtras && (classification === "blunder" || classification === "mistake" || classification === "inaccuracy")) {
        explanation = await prepareMoveExplanation({
          fen: item.fenAfter,
          fenBefore: item.fenBefore,
          from: item.moveObj.from,
          to: item.moveObj.to,
          san: item.moveObj.san,
          color: item.side,
          bestMoveUci,
          bestMoveSan: bestMoveSan || item.moveObj.san,
          punishmentPv: engineAfter.pv,
          bestPv: engineBefore.pv,
          winProbBefore: moverWinProbBefore,
          winProbAfter: moverWinProbAfter,
          scoreBefore: whiteScoreBefore,
          scoreAfter: whiteScoreAfter,
          classification
        });
      }
      plies[i] = {
        ply: item.plyNum,
        san: item.moveObj.san,
        uci: playedUci,
        from: item.moveObj.from,
        to: item.moveObj.to,
        piece: item.moveObj.piece,
        captured: item.moveObj.captured,
        color: item.side,
        fen: item.fenAfter,
        fenBefore: item.fenBefore,
        clock: item.rawClock,
        timeSpent: item.timeSpent,
        isTimeTrouble: item.isTimeTrouble,
        isImpulsive,
        scoreBefore: whiteScoreBefore,
        scoreAfter: whiteScoreAfter,
        scoreCp: whiteScoreAfter,
        mate: engineAfter.mate,
        winProb: whiteWinProbAfter,
        winProbBefore: whiteWinProbBefore,
        moverWinProbBefore,
        moverWinProbAfter,
        winProbLoss,
        accuracy,
        classification,
        bestMoveUci,
        bestMoveSan: bestMoveSan || item.moveObj.san,
        secondBestMoveUci,
        secondBestMoveSan,
        pv: engineBefore.pv,
        threat,
        explanation,
        phase: item.phase
      };
    }
    if (i % 8 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const createEmptyCounts = () => ({
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missed_win: 0
  });
  const userCounts = createEmptyCounts();
  const opponentCounts = createEmptyCounts();
  let userAccuracySum = 0;
  let userMovesCount = 0;
  let oppAccuracySum = 0;
  let oppMovesCount = 0;
  let impulsiveBlunders = 0;
  let timeTroubleBlunders = 0;
  const userPhaseLosses = {
    opening: [],
    middlegame: [],
    endgame: [],
    overall: []
  };
  const oppPhaseLosses = {
    opening: [],
    middlegame: [],
    endgame: [],
    overall: []
  };
  const userPhaseAcc = {
    opening: [],
    middlegame: [],
    endgame: []
  };
  const oppPhaseAcc = {
    opening: [],
    middlegame: [],
    endgame: []
  };
  plies.forEach((p) => {
    if (!p) return;
    const cpLoss = (p.classification === 'best' || p.classification === 'book')
      ? 0
      : Math.min(350, Math.round((p.winProbLoss || 0) * 500));
    if (p.color === userColor) {
      userCounts[p.classification] = (userCounts[p.classification] || 0) + 1;
      userAccuracySum += p.accuracy;
      userMovesCount++;
      if (p.isImpulsive) impulsiveBlunders++;
      if (p.isTimeTrouble && (p.classification === "blunder" || p.classification === "mistake")) {
        timeTroubleBlunders++;
      }
      userPhaseLosses[p.phase].push(cpLoss);
      userPhaseLosses.overall.push(cpLoss);
      if (userPhaseAcc[p.phase]) userPhaseAcc[p.phase].push(p.accuracy);
    } else {
      opponentCounts[p.classification] = (opponentCounts[p.classification] || 0) + 1;
      oppAccuracySum += p.accuracy;
      oppMovesCount++;
      oppPhaseLosses[p.phase].push(cpLoss);
      oppPhaseLosses.overall.push(cpLoss);
      if (oppPhaseAcc[p.phase]) oppPhaseAcc[p.phase].push(p.accuracy);
    }
  });
  const userAccuracy = userMovesCount > 0 ? Math.round(userAccuracySum / userMovesCount * 10) / 10 : 85;
  const opponentAccuracy = oppMovesCount > 0 ? Math.round(oppAccuracySum / oppMovesCount * 10) / 10 : 85;
  const overallAccuracy = Math.round((userAccuracy + opponentAccuracy) / 2 * 10) / 10;
  const calcAcpl = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 25;
  const calcAvgAcc = (arr) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

  const userPhaseAccuracy = {
    opening: calcAvgAcc(userPhaseAcc.opening),
    middlegame: calcAvgAcc(userPhaseAcc.middlegame),
    endgame: calcAvgAcc(userPhaseAcc.endgame)
  };
  const opponentPhaseAccuracy = {
    opening: calcAvgAcc(oppPhaseAcc.opening),
    middlegame: calcAvgAcc(oppPhaseAcc.middlegame),
    endgame: calcAvgAcc(oppPhaseAcc.endgame)
  };

  const oppColor = userColor === "w" ? "b" : "w";
  const oppBaseElo = userColor === "w" ? blackElo : whiteElo;

  const userPhaseAcpl = {
    opening: calcAcpl(userPhaseLosses.opening),
    middlegame: calcAcpl(userPhaseLosses.middlegame),
    endgame: calcAcpl(userPhaseLosses.endgame),
    overall: calcAcpl(userPhaseLosses.overall)
  };
  const oppPhaseAcpl = {
    opening: calcAcpl(oppPhaseLosses.opening),
    middlegame: calcAcpl(oppPhaseLosses.middlegame),
    endgame: calcAcpl(oppPhaseLosses.endgame),
    overall: calcAcpl(oppPhaseLosses.overall)
  };

  const overallGameElo = calculatePerformanceElo(userBaseElo, userAccuracy, userMovesCount, result, userColor) ?? userBaseElo;
  const oppOverallGameElo = calculatePerformanceElo(oppBaseElo, opponentAccuracy, oppMovesCount, result, oppColor) ?? oppBaseElo;

  const openingElo = calculatePerformanceElo(userBaseElo, userPhaseAccuracy.opening ?? userAccuracy, userPhaseAcc.opening.length, "*", userColor) ?? userBaseElo;
  const middlegameElo = calculatePerformanceElo(userBaseElo, userPhaseAccuracy.middlegame ?? userAccuracy, userPhaseAcc.middlegame.length, "*", userColor) ?? userBaseElo;
  const endgameElo = calculatePerformanceElo(userBaseElo, userPhaseAccuracy.endgame ?? userAccuracy, userPhaseAcc.endgame.length, "*", userColor) ?? userBaseElo;

  const oppOpeningElo = calculatePerformanceElo(oppBaseElo, opponentPhaseAccuracy.opening ?? opponentAccuracy, oppPhaseAcc.opening.length, "*", oppColor) ?? oppBaseElo;
  const oppMiddlegameElo = calculatePerformanceElo(oppBaseElo, opponentPhaseAccuracy.middlegame ?? opponentAccuracy, oppPhaseAcc.middlegame.length, "*", oppColor) ?? oppBaseElo;
  const oppEndgameElo = calculatePerformanceElo(oppBaseElo, opponentPhaseAccuracy.endgame ?? opponentAccuracy, oppPhaseAcc.endgame.length, "*", oppColor) ?? oppBaseElo;

  const analyzedResult = {
    id: `game_${Date.now()}`,
    platform: "pgn",
    white,
    black,
    whiteElo,
    blackElo,
    userColor,
    result,
    date,
    timeControl,
    ecoCode,
    ecoName,
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    plies,
    accuracy: userAccuracy,
    overallAccuracy,
    userAccuracy,
    opponentAccuracy,
    userPhaseAccuracy,
    opponentPhaseAccuracy,
    overallGameElo,
    userGameElo: overallGameElo,
    oppGameElo: oppOverallGameElo,
    opponentGameElo: oppOverallGameElo,
    openingElo,
    middlegameElo,
    endgameElo,
    oppOpeningElo,
    oppMiddlegameElo,
    oppEndgameElo,
    phaseElos: {
      opening: openingElo,
      middlegame: middlegameElo,
      endgame: endgameElo
    },
    userPhaseElos: {
      opening: openingElo,
      middlegame: middlegameElo,
      endgame: endgameElo
    },
    opponentPhaseElos: {
      opening: oppOpeningElo,
      middlegame: oppMiddlegameElo,
      endgame: oppEndgameElo
    },
    middlegameStartPly: middlegameStartPly ?? 20,
    endgameStartPly: endgameStartPly ?? 50,
    counts: userCounts,
    userCounts,
    opponentCounts,
    impulsiveBlunders,
    timeTroubleBlunders,
    phaseAcpl: userPhaseAcpl
  };
  const totalDuration = Date.now() - analysisStart;
  console.log(`[Analysis] Finished in ${totalDuration}ms: User accuracy ${userAccuracy}%, Opponent ${opponentAccuracy}%, Performance ${overallGameElo} Elo`);
  return analyzedResult;
}
const CHESSCOM_DRAW_RESULTS = ["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"];

function mapChessComGame(g, idx) {
  const whiteName = g.white?.username || "White";
  const blackName = g.black?.username || "Black";
  let res = "*";
  if (g.white?.result === "win") res = "1-0";
  else if (g.black?.result === "win") res = "0-1";
  else if (CHESSCOM_DRAW_RESULTS.includes(g.white?.result)) res = "1/2-1/2";
  return {
    id: `chesscom_${g.url ? g.url.split("/").pop() : idx}`,
    platform: "chesscom",
    white: whiteName,
    black: blackName,
    whiteElo: g.white?.rating || 1500,
    blackElo: g.black?.rating || 1500,
    result: res,
    date: g.end_time ? new Date(g.end_time * 1e3).toISOString().split("T")[0] : "Recent",
    endTime: g.end_time ? g.end_time * 1e3 : 0,
    timeControl: g.time_control || "Rapid",
    eco: g.eco || "C50",
    pgn: g.pgn || ""
  };
}

async function fetchChessComGames(username, limit = 15) {
  const cleanUsername = username.trim().toLowerCase();
  const archivesUrl = `https://api.chess.com/pub/player/${cleanUsername}/games/archives`;
  const archRes = await fetch(archivesUrl);
  if (!archRes.ok) {
    if (archRes.status === 404) {
      throw new Error(`Chess.com user '${username}' not found.`);
    }
    throw new Error(`Failed to fetch Chess.com player data (HTTP ${archRes.status}).`);
  }
  const archData = await archRes.json();
  const archives = archData.archives || [];
  const collected = [];
  for (let i = archives.length - 1; i >= 0 && collected.length < limit; i--) {
    const gamesRes = await fetch(archives[i]);
    if (!gamesRes.ok) {
      if (collected.length === 0) throw new Error("Failed to fetch monthly games from Chess.com");
      break;
    }
    const monthData = await gamesRes.json();
    const standardGames = (monthData.games || []).filter((g) => g.rules === "chess" && g.pgn);
    collected.push(...standardGames.reverse());
  }
  return collected.slice(0, limit).map(mapChessComGame);
}
async function fetchLichessGames(username, limit = 15) {
  const cleanUsername = username.trim().toLowerCase();
  const url = `https://lichess.org/api/games/user/${cleanUsername}?max=${limit}&clocks=true&opening=true&pgnInJson=true&perfType=ultraBullet,bullet,blitz,rapid,classical`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/x-ndjson"
    }
  });
  if (!res.ok) throw new Error(`Lichess user '${username}' not found.`);
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  return lines.map((line, idx) => {
    try {
      const g = JSON.parse(line);
      const whiteName = g.players?.white?.user?.name || "White";
      const blackName = g.players?.black?.user?.name || "Black";
      let res2 = "*";
      if (g.winner === "white") res2 = "1-0";
      else if (g.winner === "black") res2 = "0-1";
      else if (g.status === "draw" || g.status === "stalemate") res2 = "1/2-1/2";
      return {
        id: `lichess_${g.id || idx}`,
        platform: "lichess",
        white: whiteName,
        black: blackName,
        whiteElo: g.players?.white?.rating || 1500,
        blackElo: g.players?.black?.rating || 1500,
        result: res2,
        date: g.createdAt ? new Date(g.createdAt).toISOString().split("T")[0] : "Recent",
        endTime: g.lastMoveAt || g.createdAt || 0,
        timeControl: `${g.clock?.initial || 180}+${g.clock?.increment || 0}`,
        eco: g.opening?.eco || "B00",
        pgn: g.pgn || ""
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/* --- src/services/insightsAggregate.js --- */
const INS_PHASES = ['opening', 'middlegame', 'endgame'];
const INS_PHASE_LABELS = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' };
const INS_EMPTY_RECORD = () => ({ w: 0, d: 0, l: 0 });

function insAverage(values) {
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

function insRound(value, digits = 1) {
  if (value === null || value === undefined) return null;
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function insScore(record) {
  const total = record.w + record.d + record.l;
  return total ? ((record.w + record.d * 0.5) / total) * 100 : null;
}

function insAddResult(record, result) {
  record[result] += 1;
}

function insGroupBy(summaries, keyFn) {
  const groups = new Map();
  summaries.forEach((s) => {
    const key = keyFn(s);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  });
  return groups;
}

function insGroupStats(list) {
  const record = INS_EMPTY_RECORD();
  list.forEach((s) => insAddResult(record, s.result));
  return {
    games: list.length,
    record,
    score: insRound(insScore(record)),
    accuracy: insRound(insAverage(list.map((s) => s.acc)))
  };
}

function insStreaks(summaries) {
  let bestWin = 0;
  let worstLoss = 0;
  let win = 0;
  let loss = 0;
  summaries.forEach((s) => {
    win = s.result === 'w' ? win + 1 : 0;
    loss = s.result === 'l' ? loss + 1 : 0;
    bestWin = Math.max(bestWin, win);
    worstLoss = Math.max(worstLoss, loss);
  });
  return { bestWin, worstLoss };
}

function insHighlight(s) {
  return {
    id: s.id,
    pgn: s.pgn,
    color: s.color,
    oppName: s.oppName,
    oppElo: s.oppElo,
    ownElo: s.ownElo,
    acc: s.acc,
    date: s.date
  };
}

function insBuildNotes(report) {
  const notes = [];
  const phaseAcc = report.phaseAccuracy;
  const ranked = INS_PHASES.filter((p) => phaseAcc[p] !== null).sort((a, b) => phaseAcc[b] - phaseAcc[a]);
  if (ranked.length >= 2) {
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    notes.push({ type: 'strength', text: `${INS_PHASE_LABELS[best]} is your strongest phase (${phaseAcc[best]}% accuracy).` });
    if (phaseAcc[best] - phaseAcc[worst] >= 3) {
      notes.push({ type: 'weakness', text: `${INS_PHASE_LABELS[worst]} is your weakest phase (${phaseAcc[worst]}% vs ${phaseAcc[best]}% in the ${INS_PHASE_LABELS[best].toLowerCase()}).` });
    }
  }

  const white = report.byColor.w;
  const black = report.byColor.b;
  if (white.games >= 5 && black.games >= 5 && white.score !== null && black.score !== null && Math.abs(white.score - black.score) >= 10) {
    const strong = white.score > black.score ? 'White' : 'Black';
    const weak = strong === 'White' ? 'Black' : 'White';
    const strongScore = Math.max(white.score, black.score);
    const weakScore = Math.min(white.score, black.score);
    notes.push({ type: 'strength', text: `You score ${strongScore}% as ${strong}.` });
    notes.push({ type: 'weakness', text: `You score only ${weakScore}% as ${weak}.` });
  }

  const { stronger, weaker } = report.byOpponentStrength;
  if (stronger.games >= 5 && stronger.score !== null && stronger.score >= 40) {
    notes.push({ type: 'strength', text: `You hold your own against stronger opponents (${stronger.score}% score).` });
  }
  if (weaker.games >= 5 && weaker.score !== null && weaker.score < 70) {
    notes.push({ type: 'weakness', text: `You only score ${weaker.score}% against weaker opponents. Convert winning positions more carefully.` });
  }

  if (report.moves.blunderRate !== null) {
    notes.push({
      type: report.moves.blunderRate <= 1.5 ? 'strength' : 'weakness',
      text: `You make ${report.moves.blunderRate} blunders and ${report.moves.mistakeRate} mistakes per 100 moves.`
    });
  }

  if (report.timeTrouble.blunders >= 3) {
    notes.push({ type: 'weakness', text: `${report.timeTrouble.blunders} of your blunders and mistakes came with under 20 seconds on the clock. Manage your time earlier.` });
  }
  if (report.timeTrouble.impulsive >= 3) {
    notes.push({ type: 'weakness', text: `${report.timeTrouble.impulsive} blunders and mistakes were played in under 2 seconds. Slow down in critical positions.` });
  }

  if (report.moves.brilliantPerGame >= 0.2) {
    notes.push({ type: 'strength', text: `You find ${report.moves.brilliantPerGame} brilliant moves per game.` });
  }

  const timeControls = report.byTimeControl.filter((t) => t.games >= 5 && t.score !== null).sort((a, b) => b.score - a.score);
  if (timeControls.length >= 2) {
    const best = timeControls[0];
    const worst = timeControls[timeControls.length - 1];
    if (best.score - worst.score >= 10) {
      notes.push({ type: 'strength', text: `${best.label} is your best time control (${best.score}% score).` });
      notes.push({ type: 'weakness', text: `${worst.label} is your weakest time control (${worst.score}% score).` });
    }
  }

  const openings = report.openings.filter((o) => o.games >= 3 && o.score !== null);
  if (openings.length >= 2) {
    const sorted = [...openings].sort((a, b) => b.score - a.score);
    notes.push({ type: 'strength', text: `Best opening: ${sorted[0].name} (${sorted[0].score}% score in ${sorted[0].games} games).` });
    const worst = sorted[sorted.length - 1];
    if (worst.score < 45) {
      notes.push({ type: 'weakness', text: `Struggling opening: ${worst.name} (${worst.score}% score in ${worst.games} games).` });
    }
  }

  return notes;
}

function insClassifyOpponent(s) {
  const diff = s.oppElo - s.ownElo;
  if (diff > 50) return 'stronger';
  if (diff < -50) return 'weaker';
  return 'equal';
}

function insMoveStats(summaries) {
  const totals = {};
  let totalMoves = 0;
  summaries.forEach((s) => {
    Object.keys(s.counts || {}).forEach((k) => {
      totals[k] = (totals[k] || 0) + s.counts[k];
      totalMoves += s.counts[k];
    });
  });
  const perHundred = (key) => (totalMoves ? insRound(((totals[key] || 0) / totalMoves) * 100) : null);
  const perGame = (key) => (summaries.length ? insRound((totals[key] || 0) / summaries.length, 2) : 0);
  return {
    totals,
    totalMoves,
    blunderRate: perHundred('blunder'),
    mistakeRate: perHundred('mistake'),
    brilliantPerGame: perGame('brilliant'),
    greatPerGame: perGame('great')
  };
}

function insPhaseStats(summaries) {
  const accuracy = {};
  const errorsPerGame = {};
  const errorsPer100 = {};
  INS_PHASES.forEach((phase) => {
    accuracy[phase] = insRound(insAverage(summaries.map((s) => s.phaseAcc?.[phase])));
    const errors = summaries.reduce((sum, s) => sum + (s.phaseErr?.[phase] || 0), 0);
    const moves = summaries.reduce((sum, s) => sum + (s.phaseMoves?.[phase] || 0), 0);
    errorsPerGame[phase] = summaries.length ? insRound(errors / summaries.length, 2) : 0;
    errorsPer100[phase] = moves ? insRound((errors / moves) * 100) : null;
  });
  return { accuracy, errorsPerGame, errorsPer100 };
}

function insOpeningStats(summaries) {
  const groups = insGroupBy(summaries, (s) => s.ecoName || s.eco || 'Unknown');
  return [...groups.entries()]
    .map(([name, list]) => ({ name, eco: list[0].eco, ...insGroupStats(list) }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 8);
}

function insTimeControlStats(summaries) {
  const order = ['Bullet', 'Blitz', 'Rapid', 'Classical', 'Daily'];
  const groups = insGroupBy(summaries, (s) => s.tc);
  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, ...insGroupStats(groups.get(label)) }));
}

function insAccuracyHistogram(summaries) {
  const buckets = [
    { label: '<60', min: 0, max: 60 },
    { label: '60s', min: 60, max: 70 },
    { label: '70s', min: 70, max: 80 },
    { label: '80s', min: 80, max: 90 },
    { label: '90+', min: 90, max: 101 }
  ];
  return buckets.map((b) => ({
    label: b.label,
    value: summaries.filter((s) => s.acc >= b.min && s.acc < b.max).length
  }));
}

function computeInsights(summaryList) {
  const summaries = [...summaryList].sort((a, b) => a.ts - b.ts);
  if (summaries.length === 0) return null;

  const record = INS_EMPTY_RECORD();
  summaries.forEach((s) => insAddResult(record, s.result));

  const byColor = {
    w: insGroupStats(summaries.filter((s) => s.color === 'w')),
    b: insGroupStats(summaries.filter((s) => s.color === 'b'))
  };

  const opponentGroups = { stronger: [], equal: [], weaker: [] };
  summaries.forEach((s) => opponentGroups[insClassifyOpponent(s)].push(s));
  const byOpponentStrength = {
    stronger: insGroupStats(opponentGroups.stronger),
    equal: insGroupStats(opponentGroups.equal),
    weaker: insGroupStats(opponentGroups.weaker)
  };

  const wins = summaries.filter((s) => s.result === 'w').sort((a, b) => b.oppElo - a.oppElo);
  const losses = summaries.filter((s) => s.result === 'l').sort((a, b) => a.oppElo - b.oppElo);
  const phase = insPhaseStats(summaries);
  const moves = insMoveStats(summaries);

  const report = {
    games: summaries.length,
    record,
    winRate: insRound((record.w / summaries.length) * 100),
    score: insRound(insScore(record)),
    avgAccuracy: insRound(insAverage(summaries.map((s) => s.acc))),
    avgOpponentAccuracy: insRound(insAverage(summaries.map((s) => s.oppAcc))),
    avgOwnElo: Math.round(insAverage(summaries.map((s) => s.ownElo))),
    avgOpponentElo: Math.round(insAverage(summaries.map((s) => s.oppElo))),
    avgPerformanceElo: Math.round(insAverage(summaries.map((s) => s.perf))),
    avgGameLength: Math.round(insAverage(summaries.map((s) => s.plies / 2))),
    currentElo: summaries[summaries.length - 1].ownElo,
    startElo: summaries[0].ownElo,
    peakElo: Math.max(...summaries.map((s) => s.ownElo)),
    lowestElo: Math.min(...summaries.map((s) => s.ownElo)),
    firstDate: summaries[0].date,
    lastDate: summaries[summaries.length - 1].date,
    streaks: insStreaks(summaries),
    byColor,
    byOpponentStrength,
    phaseAccuracy: phase.accuracy,
    phaseErrorsPerGame: phase.errorsPerGame,
    phaseErrorsPer100: phase.errorsPer100,
    moves,
    timeTrouble: {
      blunders: summaries.reduce((sum, s) => sum + (s.ttBlunders || 0), 0),
      impulsive: summaries.reduce((sum, s) => sum + (s.impBlunders || 0), 0)
    },
    openings: insOpeningStats(summaries),
    byTimeControl: insTimeControlStats(summaries),
    accuracyHistogram: insAccuracyHistogram(summaries),
    timeline: summaries.map((s) => ({
      date: s.date,
      ownElo: s.ownElo,
      oppElo: s.oppElo,
      acc: s.acc,
      perf: s.perf,
      result: s.result
    })),
    bestWins: wins.slice(0, 3).map(insHighlight),
    worstLosses: losses.slice(0, 3).map(insHighlight),
    bestAccuracyGame: insHighlight([...summaries].sort((a, b) => b.acc - a.acc)[0]),
    worstAccuracyGame: insHighlight([...summaries].sort((a, b) => a.acc - b.acc)[0])
  };

  report.notes = insBuildNotes(report);
  return report;
}

/* --- src/services/backgroundAnalysisQueue.js --- */
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

var backgroundAnalysisQueue = new BackgroundAnalysisQueue();

/* --- src/services/insightsService.js --- */
const INSIGHTS_KEY_PREFIX = 'chess_iq_insights_v1_';
const INSIGHTS_GAME_LIMIT = 100;
const INSIGHTS_MIN_PLIES = 20;
const INSIGHTS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const INSIGHTS_CANCELLED = 'insights_cancelled';

function insStorageKey(platform, username) {
  return `${INSIGHTS_KEY_PREFIX}${platform}_${username.trim().toLowerCase()}`;
}

function insTimeControlLabel(timeControl) {
  const text = String(timeControl || '');
  if (text.includes('/')) return 'Daily';
  const [base, increment] = text.split('+').map((n) => parseInt(n, 10));
  if (isNaN(base)) return 'Rapid';
  const estimated = base + 40 * (increment || 0);
  if (estimated < 180) return 'Bullet';
  if (estimated < 480) return 'Blitz';
  if (estimated <= 1500) return 'Rapid';
  return 'Classical';
}

function insUserColor(game, username) {
  const name = username.trim().toLowerCase();
  if (game.white.toLowerCase() === name) return 'w';
  if (game.black.toLowerCase() === name) return 'b';
  return null;
}

function insUserResult(game, color) {
  if (game.result === '1/2-1/2') return 'd';
  if (game.result === '1-0') return color === 'w' ? 'w' : 'l';
  if (game.result === '0-1') return color === 'b' ? 'w' : 'l';
  return null;
}

function insSummarize(game, analyzed, color) {
  const result = insUserResult(game, color);
  if (!result || !analyzed || analyzed.plies.length < INSIGHTS_MIN_PLIES) return null;

  const phaseErr = { opening: 0, middlegame: 0, endgame: 0 };
  const phaseMoves = { opening: 0, middlegame: 0, endgame: 0 };
  analyzed.plies.forEach((p) => {
    if (!p || p.color !== color || phaseMoves[p.phase] === undefined) return;
    phaseMoves[p.phase] += 1;
    if (p.classification === 'mistake' || p.classification === 'blunder') phaseErr[p.phase] += 1;
  });

  const isWhite = color === 'w';
  return {
    id: game.id,
    ts: game.endTime || Date.parse(game.date) || 0,
    date: game.date,
    color,
    result,
    ownElo: isWhite ? game.whiteElo : game.blackElo,
    oppElo: isWhite ? game.blackElo : game.whiteElo,
    oppName: isWhite ? game.black : game.white,
    acc: analyzed.userAccuracy,
    oppAcc: analyzed.opponentAccuracy,
    perf: analyzed.overallGameElo,
    phaseAcc: analyzed.userPhaseAccuracy,
    phaseErr,
    phaseMoves,
    counts: analyzed.userCounts,
    plies: analyzed.plies.length,
    eco: game.eco,
    ecoName: analyzed.ecoName,
    tc: insTimeControlLabel(game.timeControl),
    ttBlunders: analyzed.timeTroubleBlunders || 0,
    impBlunders: analyzed.impulsiveBlunders || 0,
    pgn: game.pgn
  };
}

function insFetchGames(platform, username) {
  if (platform === 'chesscom') return fetchChessComGames(username, INSIGHTS_GAME_LIMIT);
  return fetchLichessGames(username, INSIGHTS_GAME_LIMIT);
}

function loadInsights(platform, username) {
  try {
    const raw = localStorage.getItem(insStorageKey(platform, username));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function insSave(platform, username, entry) {
  try {
    localStorage.setItem(insStorageKey(platform, username), JSON.stringify(entry));
  } catch {}
}

function isInsightsFresh(entry) {
  return Boolean(entry && entry.report && entry.generatedAt && Date.now() - entry.generatedAt < INSIGHTS_MAX_AGE_MS);
}

function clearInsights(platform, username) {
  try {
    localStorage.removeItem(insStorageKey(platform, username));
  } catch {}
}

async function runInsights({ platform, username, force = false, onStatus, shouldCancel }) {
  const previous = loadInsights(platform, username);
  if (!force && isInsightsFresh(previous)) return { entry: previous, cancelled: false };

  backgroundAnalysisQueue.pause();
  onStatus({ stage: 'fetching' });

  const fetched = await insFetchGames(platform, username);
  const games = fetched.filter((g) => g.pgn && insUserColor(g, username));
  const gameIds = new Set(games.map((g) => g.id));

  const entry = {
    generatedAt: 0,
    report: previous?.report || null,
    skipped: (previous?.skipped || []).filter((id) => gameIds.has(id)),
    summaries: {}
  };
  Object.values(previous?.summaries || {}).forEach((s) => {
    if (gameIds.has(s.id)) entry.summaries[s.id] = s;
  });

  const pending = games.filter((g) => !entry.summaries[g.id] && !entry.skipped.includes(g.id));
  const startedAt = Date.now();
  let cancelled = false;
  let doneCount = 0;
  let nextIdx = 0;
  const CONCURRENCY = 2;

  async function worker() {
    while (nextIdx < pending.length && !cancelled) {
      if (shouldCancel()) {
        cancelled = true;
        break;
      }
      const i = nextIdx++;
      const game = pending[i];
      const color = insUserColor(game, username);
      const elapsed = Date.now() - startedAt;
      const etaMs = doneCount > 0 ? (elapsed / doneCount) * (pending.length - doneCount) : null;
      onStatus({ stage: 'analyzing', done: doneCount, total: pending.length, game, etaMs });

      try {
        let analyzed = getCachedGame(game.id || game.pgn, color);
        if (!analyzed) {
          analyzed = await analyzeFullPgn(game.pgn, color, 'insights', (current, total) => {
            if (shouldCancel()) throw new Error(INSIGHTS_CANCELLED);
            onStatus({ stage: 'analyzing', done: doneCount, total: pending.length, game, etaMs, ply: current, plyTotal: total });
          }, true);
          if (analyzed) saveCachedGame(game.id || game.pgn, color, analyzed);
        }
        const summary = insSummarize(game, analyzed, color);
        if (summary) entry.summaries[game.id] = summary;
        else entry.skipped.push(game.id);
      } catch (err) {
        if (err && err.message === INSIGHTS_CANCELLED) {
          cancelled = true;
          break;
        }
        entry.skipped.push(game.id);
      }
      doneCount++;
      insSave(platform, username, entry);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => worker());
  await Promise.all(workers);

  entry.report = computeInsights(Object.values(entry.summaries)) || entry.report;
  entry.generatedAt = cancelled ? 0 : Date.now();
  insSave(platform, username, entry);
  return { entry, cancelled };
}

if (typeof window !== 'undefined') {
  if (typeof Chessboard !== 'undefined') window.Chessboard = Chessboard;
  if (typeof BotArena !== 'undefined') window.BotArena = BotArena;
  if (typeof ReviewDashboard !== 'undefined') window.ReviewDashboard = ReviewDashboard;
  if (typeof ImportModal !== 'undefined') window.ImportModal = ImportModal;
  if (typeof StockfishPool !== 'undefined') window.StockfishPool = StockfishPool;
  if (typeof BackgroundAnalysisQueue !== 'undefined') window.BackgroundAnalysisQueue = BackgroundAnalysisQueue;
  if (typeof SoundService !== 'undefined') window.SoundService = SoundService;
}
