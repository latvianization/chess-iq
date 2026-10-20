class StockfishWorkerService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.isAvailable = true;
    this.pendingResolve = null;
    this.pendingReject = null;
    this.currentBestMove = "";
    this.currentScoreCp = 0;
    this.currentMate = null;
    this.currentPv = [];
    this.currentDepth = 0;
    this.secondBestCp = void 0;
    this.evaluationTimeoutId = null;
    this.initWorker();
  }
  initWorker() {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      this.isAvailable = false;
      return;
    }
    try {
      const base = import.meta.env.BASE_URL || "./";
      const workerUrl = `${base.endsWith("/") ? base : `${base}/`}stockfish.js`;
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      this.worker.onerror = () => {
        this.isAvailable = false;
      };
      this.worker.postMessage("uci");
    } catch {
      this.isAvailable = false;
    }
  }
  handleMessage(line) {
    if (typeof line !== "string") return;
    if (line === "uciok") {
      this.isInitialized = true;
      if (this.worker) {
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
      if (pvMatch && !isMultiPv2) {
        this.currentPv = pvMatch[1].trim().split(/\s+/);
        if (this.currentPv.length > 0) {
          this.currentBestMove = this.currentPv[0];
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
      if (this.pendingResolve) {
        const resolve = this.pendingResolve;
        this.pendingResolve = null;
        this.pendingReject = null;
        resolve({
          bestMoveUci: bestMove,
          scoreCp: this.currentScoreCp,
          mate: this.currentMate,
          pv: this.currentPv.length > 0 ? this.currentPv : [bestMove],
          depth: this.currentDepth,
          multiPv2ScoreCp: this.secondBestCp
        });
      }
    }
  }
  /**
   * Evaluate a FEN position to target depth using Stockfish
   */
  evaluate(fen, depth = 16, maxWaitMs = 1200) {
    if (!this.isAvailable || !this.worker) {
      return Promise.resolve(null);
    }
    const worker = this.worker;
    return new Promise((resolve) => {
      this.currentBestMove = "";
      this.currentScoreCp = 0;
      this.currentMate = null;
      this.currentPv = [];
      this.currentDepth = 0;
      this.secondBestCp = void 0;
      this.pendingResolve = resolve;
      this.pendingReject = () => resolve(null);
      this.evaluationTimeoutId = setTimeout(() => {
        if (this.pendingResolve) {
          try {
            worker.postMessage("stop");
          } catch {
          }
        }
      }, maxWaitMs);
      try {
        worker.postMessage("ucinewgame");
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
      } catch {
        if (this.evaluationTimeoutId) clearTimeout(this.evaluationTimeoutId);
        resolve(null);
      }
    });
  }
  isEngineReady() {
    return this.isAvailable && this.isInitialized;
  }
}
export const stockfishService = new StockfishWorkerService();
