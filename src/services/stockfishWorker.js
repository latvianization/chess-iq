let nextWorkerId = 1;
let resolvedStockfishUrl = null;

function getCandidateWorkerUrls() {
  if (typeof window !== "undefined" && window.__STOCKFISH_URL__) {
    return [window.__STOCKFISH_URL__];
  }
  const base = (typeof window !== "undefined" && window.__BASE_URL__) || "./";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return [
    `${normalizedBase}public/stockfish.js`,
    "./public/stockfish.js"
  ];
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
    if (typeof window !== "undefined" && window.location && window.location.protocol === "file:") {
      this.isAvailable = false;
      this.drainQueue();
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
      let settled = false;
      const safeResolve = (val) => {
        if (settled) return;
        settled = true;
        clearTimeout(overallTimeout);
        resolve(val);
      };
      const overallTimeout = setTimeout(() => {
        safeResolve(null);
      }, (maxWaitMs || 1200) + 2500);

      this.queue.push({ fen, depth, maxWaitMs, resolve: safeResolve });
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
    this.consecutiveFailures = 0;
    this.isPermanentlyDisabled = false;

    if (typeof window !== "undefined" && window.location && window.location.protocol === "file:") {
      this.isPermanentlyDisabled = true;
      this.workers = [];
      return;
    }

    this.workers = [new StockfishWorkerService()];
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
      this.isPermanentlyDisabled = true;
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
