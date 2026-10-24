let nextWorkerId = 1;
let resolvedStockfishUrl = null;

function getCandidateWorkerUrls() {
  if (typeof window !== "undefined" && window.__STOCKFISH_URL__) {
    return [window.__STOCKFISH_URL__];
  }
  const isFileProtocol = typeof window !== "undefined" && window.location && window.location.protocol === "file:";
  const cdnBlobCandidates = [
    "blob:https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js",
    "blob:https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js"
  ];
  if (isFileProtocol) {
    return cdnBlobCandidates;
  }
  const base = (typeof window !== "undefined" && window.__BASE_URL__) || "./";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return [
    `${normalizedBase}public/stockfish.js`,
    "./public/stockfish.js",
    ...cdnBlobCandidates
  ];
}

function instantiateWorkerFromSpec(specUrl) {
  if (typeof specUrl === "string" && specUrl.startsWith("blob:")) {
    const remoteUrl = specUrl.slice(5);
    const workerCode = `importScripts(${JSON.stringify(remoteUrl)});`;
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const objectUrl = URL.createObjectURL(blob);
    return { worker: new Worker(objectUrl), objectUrl };
  }
  return { worker: new Worker(specUrl), objectUrl: null };
}

class StockfishWorkerService {
  constructor(onReadyCallback, id = `worker-${nextWorkerId++}`) {
    this.id = id;
    this.onReadyCallback = onReadyCallback || (() => {});
    this.worker = null;
    this.objectUrl = null;
    this.isInitialized = false;
    this.isReady = false;
    this.isAvailable = true;
    this.isBusy = false;
    this.currentTask = null;
    this.currentBestMove = "";
    this.currentScoreCp = 0;
    this.currentMate = null;
    this.currentPv = [];
    this.currentDepth = 0;
    this.secondBestCp = void 0;
    this.secondBestMove = "";
    this.secondBestPv = [];
    this.initTimeoutId = null;
    this.softTimeoutId = null;
    this.hardTimeoutId = null;
    this.candidateIndex = 0;
    this.initWorker();
  }

  cleanupWorkerInstance() {
    if (this.initTimeoutId) {
      clearTimeout(this.initTimeoutId);
      this.initTimeoutId = null;
    }
    try {
      if (this.worker) this.worker.terminate();
    } catch {}
    this.worker = null;
    if (this.objectUrl) {
      try {
        URL.revokeObjectURL(this.objectUrl);
      } catch {}
      this.objectUrl = null;
    }
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
      const created = instantiateWorkerFromSpec(workerUrl);
      this.worker = created.worker;
      this.objectUrl = created.objectUrl;
      this.initTimeoutId = setTimeout(() => {
        this.initTimeoutId = null;
        if (this.isReady) return;
        if (!this.isInitialized && !resolvedStockfishUrl && this.candidateIndex + 1 < candidates.length) {
          this.cleanupWorkerInstance();
          this.candidateIndex++;
          this.initWorker();
          return;
        }
        console.warn(`[StockfishPool][${this.id}] Init timed out`);
        this.isAvailable = false;
        this.isReady = false;
        this.abortCurrentTask();
        this.cleanupWorkerInstance();
        this.onReadyCallback();
      }, 2500);
      this.worker.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      this.worker.onerror = (err) => {
        if (!this.isInitialized && !resolvedStockfishUrl && this.candidateIndex + 1 < candidates.length) {
          this.cleanupWorkerInstance();
          this.candidateIndex++;
          this.initWorker();
          return;
        }

        const msg = (err && err.message) || (err && err.type ? `Event (${err.type})` : "Worker error");
        console.warn(`[StockfishPool][${this.id}] Worker offline (${msg})`);
        this.isAvailable = false;
        this.isReady = false;
        this.abortCurrentTask();
        this.cleanupWorkerInstance();
        this.onReadyCallback();
      };
      this.worker.postMessage("uci");
    } catch (err) {
      this.cleanupWorkerInstance();
      if (!this.isInitialized && !resolvedStockfishUrl && this.candidateIndex + 1 < candidates.length) {
        this.candidateIndex++;
        this.initWorker();
        return;
      }
      console.warn(`[StockfishPool][${this.id}] Init failed:`, err?.message || err);
      this.isAvailable = false;
      this.isReady = false;
      this.abortCurrentTask();
      this.onReadyCallback();
    }
  }

  clearTimers() {
    if (this.softTimeoutId) {
      clearTimeout(this.softTimeoutId);
      this.softTimeoutId = null;
    }
    if (this.hardTimeoutId) {
      clearTimeout(this.hardTimeoutId);
      this.hardTimeoutId = null;
    }
  }

  abortCurrentTask(fallbackValue = null) {
    this.clearTimers();
    this.isBusy = false;
    if (this.currentTask) {
      const task = this.currentTask;
      this.currentTask = null;
      task.resolve(fallbackValue);
    }
  }

  handleMessage(rawLine) {
    if (typeof rawLine !== "string") return;
    const line = rawLine.trim();
    if (!line) return;

    if (line === "uciok") {
      this.isInitialized = true;
      if (!resolvedStockfishUrl && this.workerUrl) {
        resolvedStockfishUrl = this.workerUrl;
      }
      if (this.worker) {
        this.worker.postMessage("setoption name MultiPV value 2");
        this.worker.postMessage("isready");
      }
      return;
    }

    if (line === "readyok") {
      if (this.initTimeoutId) {
        clearTimeout(this.initTimeoutId);
        this.initTimeoutId = null;
      }
      this.isReady = true;
      this.onReadyCallback();
      return;
    }

    if (line.startsWith("info depth")) {
      const isBound = line.includes("upperbound") || line.includes("lowerbound");
      if (isBound && this.currentBestMove) return;

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
        if (isMultiPv2) {
          this.secondBestCp = m > 0 ? 3e3 : -3e3;
        } else {
          this.currentMate = m;
          this.currentScoreCp = m > 0 ? 3e3 : -3e3;
        }
      }
      const pvMatch = line.match(/\bpv\s+(.+)$/);
      if (pvMatch) {
        const pvMoves = pvMatch[1].trim().split(/\s+/).filter((m) => /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(m));
        if (pvMoves.length > 0) {
          if (isMultiPv2) {
            this.secondBestMove = pvMoves[0] || "";
            this.secondBestPv = pvMoves;
          } else {
            this.currentPv = pvMoves;
            this.currentBestMove = pvMoves[0];
          }
        }
      }
      return;
    }

    if (line.startsWith("bestmove")) {
      this.clearTimers();
      if (!this.currentTask) {
        this.isBusy = false;
        this.onReadyCallback();
        return;
      }
      const parts = line.split(/\s+/);
      const bestMove = parts[1] && parts[1] !== "(none)" ? parts[1] : this.currentBestMove;
      const result = {
        bestMoveUci: bestMove,
        scoreCp: this.currentScoreCp,
        mate: this.currentMate,
        pv: this.currentPv.length > 0 ? this.currentPv : (bestMove ? [bestMove] : []),
        depth: this.currentDepth,
        multiPv2ScoreCp: this.secondBestCp,
        secondBestMoveUci: this.secondBestMove,
        secondBestPv: this.secondBestPv
      };
      const task = this.currentTask;
      this.currentTask = null;
      this.isBusy = false;
      task.resolve(result);
      this.onReadyCallback();
    }
  }

  runTask(task) {
    if (!this.isAvailable || !this.isReady || !this.worker) {
      task.resolve(null);
      return;
    }

    this.isBusy = true;
    this.currentTask = task;
    this.currentBestMove = "";
    this.currentScoreCp = 0;
    this.currentMate = null;
    this.currentPv = [];
    this.currentDepth = 0;
    this.secondBestCp = void 0;
    this.secondBestMove = "";
    this.secondBestPv = [];

    const waitMs = task.maxWaitMs || 800;
    this.softTimeoutId = setTimeout(() => {
      this.softTimeoutId = null;
      if (!this.currentTask) return;
      try {
        this.worker.postMessage("stop");
      } catch {}

      this.hardTimeoutId = setTimeout(() => {
        this.hardTimeoutId = null;
        if (!this.currentTask) return;
        console.warn(`[StockfishPool][${this.id}] Hard timeout, restarting worker`);
        const fallback = this.currentBestMove
          ? {
              bestMoveUci: this.currentBestMove,
              scoreCp: this.currentScoreCp,
              mate: this.currentMate,
              pv: this.currentPv.length > 0 ? this.currentPv : [this.currentBestMove],
              depth: this.currentDepth,
              multiPv2ScoreCp: this.secondBestCp,
              secondBestMoveUci: this.secondBestMove,
              secondBestPv: this.secondBestPv,
              timedOut: true
            }
          : null;

        this.cleanupWorkerInstance();
        this.isInitialized = false;
        this.isReady = false;

        this.abortCurrentTask(fallback);
        this.initWorker();
        this.onReadyCallback();
      }, 1500);
    }, waitMs + 450);

    try {
      this.worker.postMessage(`position fen ${task.fen}`);
      const movetimeCmd = task.maxWaitMs ? ` movetime ${task.maxWaitMs}` : "";
      this.worker.postMessage(`go depth ${task.depth}${movetimeCmd}`);
    } catch (err) {
      console.error(`[StockfishPool][${this.id}] postMessage failed:`, err);
      this.abortCurrentTask(null);
      this.onReadyCallback();
    }
  }

  isEngineReady() {
    return this.isAvailable && this.isReady;
  }
}

const POOL_MAX_WORKERS = 4;
const MAX_CONSECUTIVE_INIT_FAILURES = 3;

class StockfishPool {
  constructor() {
    const cores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
    this.targetSize = Math.min(POOL_MAX_WORKERS, Math.max(2, cores - 1));
    this.consecutiveFailures = 0;
    this.isPermanentlyDisabled = false;
    this.queue = [];
    this.workers = [];

    this.warmUp();
  }

  cleanDeadWorkers() {
    const dead = this.workers.filter((w) => !w.isAvailable);
    if (dead.length > 0) {
      this.consecutiveFailures += dead.length;
      this.workers = this.workers.filter((w) => w.isAvailable);
    }
    if (this.workers.length === 0 && (this.consecutiveFailures >= MAX_CONSECUTIVE_INIT_FAILURES || dead.length > 0)) {
      this.isPermanentlyDisabled = true;
      this.drainPoolQueue();
    }
  }

  drainPoolQueue() {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task && task.resolve) task.resolve(null);
    }
  }

  warmUp() {
    if (this.isPermanentlyDisabled) return;
    this.cleanDeadWorkers();
    if (this.isPermanentlyDisabled) return;
    while (this.workers.length < this.targetSize) {
      this.workers.push(new StockfishWorkerService(() => this.dispatch()));
    }
  }

  dispatch() {
    this.cleanDeadWorkers();
    if (this.isPermanentlyDisabled) return;

    const readyWorkers = this.workers.filter((w) => w.isAvailable && w.isReady);
    if (readyWorkers.length > 0) {
      this.consecutiveFailures = 0;
    }

    const idleWorkers = readyWorkers.filter((w) => !w.isBusy);
    while (idleWorkers.length > 0 && this.queue.length > 0) {
      const worker = idleWorkers.shift();
      const task = this.queue.shift();
      if (worker && task) {
        worker.runTask(task);
      }
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

  evaluate(fen, depth = 16, maxWaitMs = 1100) {
    if (this.isPermanentlyDisabled) {
      return Promise.resolve(null);
    }
    this.cleanDeadWorkers();
    if (this.isPermanentlyDisabled) {
      return Promise.resolve(null);
    }
    if (this.workers.length < this.targetSize) {
      this.warmUp();
    }
    if (this.workers.length === 0) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      this.queue.push({ fen, depth, maxWaitMs, resolve });
      this.dispatch();
    });
  }
}

var stockfishService = new StockfishPool();
