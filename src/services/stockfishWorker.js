class StockfishWorkerService {
  constructor() {
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
    this.initWorker();
  }
  initWorker() {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      this.isAvailable = false;
      return;
    }
    try {
      const base = (typeof window !== "undefined" && window.__BASE_URL__) || "./";
      const workerUrl = `${base.endsWith("/") ? base : `${base}/`}stockfish.js`;
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      this.worker.onerror = () => {
        this.isAvailable = false;
        this.drainQueue();
      };
      this.worker.postMessage("uci");
    } catch {
      this.isAvailable = false;
    }
  }
  drainQueue() {
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
      if (this.worker) {
        this.worker.postMessage("setoption name MultiPV value 2");
        this.worker.postMessage("isready");
      }
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
      if (this.pendingResolve) {
        try {
          this.worker.postMessage("stop");
        } catch {}
      }
    }, item.maxWaitMs || 1200);

    try {
      this.worker.postMessage(`position fen ${item.fen}`);
      this.worker.postMessage(`go depth ${item.depth}`);
    } catch {
      if (this.evaluationTimeoutId) clearTimeout(this.evaluationTimeoutId);
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
const POOL_MAX_WORKERS = 8;

class StockfishPool {
  constructor() {
    const cores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
    this.targetSize = Math.min(POOL_MAX_WORKERS, Math.max(2, cores - 2));
    this.workers = [new StockfishWorkerService()];
  }
  warmUp() {
    while (this.workers.length < this.targetSize) {
      this.workers.push(new StockfishWorkerService());
    }
  }
  get size() {
    return this.workers.filter((w) => w.isAvailable).length;
  }
  get isAvailable() {
    return this.workers.some((w) => w.isAvailable);
  }
  isEngineReady() {
    return this.workers.some((w) => w.isEngineReady());
  }
  evaluate(fen, depth = 14, maxWaitMs = 1000) {
    const available = this.workers.filter((w) => w.isAvailable && w.worker);
    if (available.length === 0) return Promise.resolve(null);
    const load = (w) => w.queue.length + (w.isProcessing ? 1 : 0);
    const leastBusy = available.reduce((best, w) => (load(w) < load(best) ? w : best));
    return leastBusy.evaluate(fen, depth, maxWaitMs);
  }
}
export const stockfishService = new StockfishPool();
