/**
 * Stockfish UCI Web Worker Service
 * Runs official compiled Stockfish engine in a dedicated background worker.
 * Provides true Tournament Quality (Depth 16-18) evaluations with Multi-PV and PV continuations.
 */

export interface StockfishEvaluation {
  bestMoveUci: string;
  scoreCp: number;
  mate: number | null;
  pv: string[]; // Full UCI Principal Variation
  depth: number;
  multiPv2ScoreCp?: number;
}

class StockfishWorkerService {
  private worker: Worker | null = null;
  private isInitialized = false;
  private isAvailable = true;
  private pendingResolve: ((res: StockfishEvaluation) => void) | null = null;
  private pendingReject: ((err: any) => void) | null = null;
  private currentBestMove = '';
  private currentScoreCp = 0;
  private currentMate: number | null = null;
  private currentPv: string[] = [];
  private currentDepth = 0;
  private secondBestCp: number | undefined = undefined;
  private evaluationTimeoutId: any = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      this.isAvailable = false;
      return;
    }

    try {
      const base = import.meta.env.BASE_URL || './';
      const workerUrl = `${base.endsWith('/') ? base : `${base}/`}stockfish.js`;
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.worker.onerror = () => {
        this.isAvailable = false;
      };

      // Send initial UCI handshake
      this.worker.postMessage('uci');
    } catch {
      this.isAvailable = false;
    }
  }

  private handleMessage(line: any) {
    if (typeof line !== 'string') return;

    if (line === 'uciok') {
      this.isInitialized = true;
      if (this.worker) {
        this.worker.postMessage('isready');
      }
      return;
    }

    // Parse engine search information
    // e.g.: info depth 16 seldepth 22 multipv 1 score cp 34 ... pv e2e4 e7e5 g1f3
    if (line.startsWith('info depth')) {
      const depthMatch = line.match(/depth\s+(\d+)/);
      if (depthMatch) {
        this.currentDepth = parseInt(depthMatch[1], 10);
      }

      // Check for MultiPV 2 score
      const multiPvMatch = line.match(/multipv\s+(\d+)/);
      const isMultiPv2 = multiPvMatch && multiPvMatch[1] === '2';

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
          this.currentScoreCp = m > 0 ? 3000 : -3000;
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

    // Engine finished calculating target depth
    // e.g.: bestmove e2e4 ponder e7e5
    if (line.startsWith('bestmove')) {
      if (this.evaluationTimeoutId) {
        clearTimeout(this.evaluationTimeoutId);
        this.evaluationTimeoutId = null;
      }

      const parts = line.split(/\s+/);
      const bestMove = parts[1] && parts[1] !== '(none)' ? parts[1] : this.currentBestMove;

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
          multiPv2ScoreCp: this.secondBestCp,
        });
      }
    }
  }

  /**
   * Evaluate a FEN position to target depth using Stockfish
   */
  public evaluate(
    fen: string,
    depth = 16,
    maxWaitMs = 1200
  ): Promise<StockfishEvaluation | null> {
    if (!this.isAvailable || !this.worker) {
      return Promise.resolve(null);
    }

    const worker = this.worker;

    return new Promise((resolve) => {
      // Reset state for new evaluation
      this.currentBestMove = '';
      this.currentScoreCp = 0;
      this.currentMate = null;
      this.currentPv = [];
      this.currentDepth = 0;
      this.secondBestCp = undefined;

      this.pendingResolve = resolve;
      this.pendingReject = () => resolve(null);

      // Timeout safety: if engine takes longer than maxWaitMs, command it to stop and yield best move found
      this.evaluationTimeoutId = setTimeout(() => {
        if (this.pendingResolve) {
          try {
            worker.postMessage('stop');
          } catch {}
        }
      }, maxWaitMs);

      try {
        worker.postMessage('ucinewgame');
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth}`);
      } catch {
        if (this.evaluationTimeoutId) clearTimeout(this.evaluationTimeoutId);
        resolve(null);
      }
    });
  }

  public isEngineReady(): boolean {
    return this.isAvailable && this.isInitialized;
  }
}

export const stockfishService = new StockfishWorkerService();
