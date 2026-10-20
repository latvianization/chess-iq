import { Chess, PieceSymbol } from 'chess.js';
import { GamePhase, MoveClassification } from '../types/chess';
import { isBookMove } from './ecoDictionary';
import { stockfishService } from './stockfishWorker';

// Base piece static values in centipawns
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// PeSTO Midgame & Endgame Piece-Square Tables (White perspective)
// 64 squares from a8 (idx 0) to h1 (idx 63)
const PST_MG_PAWN = [
    0,   0,   0,   0,   0,   0,   0,   0,
   98, 134,  61,  95,  68, 126,  34, -11,
   -6,   7,  26,  31,  65,  56,  25, -20,
  -14,  13,   6,  21,  23,  12,  17, -23,
  -27,  -2,  -5,  12,  17,   6,  10, -25,
  -26,  -4,  -4, -10,   3,   3,  33, -12,
  -35,  -1, -20, -23, -15,  24,  38, -22,
    0,   0,   0,   0,   0,   0,   0,   0
];

const PST_MG_KNIGHT = [
  -167, -89, -34, -49,  61, -97, -15, -107,
   -73, -41,  72,  36,  23,  62,   7,  -17,
   -47,  60,  37,  65,  84, 129,  73,   44,
    -9,  17,  19,  53,  37,  69,  18,   22,
   -13,   4,  16,  13,  28,  19,  21,   -8,
   -23,  -9,  12,  10,  19,  17,  25,  -16,
   -29, -53, -12,  -3,  -1,  18, -14,  -19,
  -105, -21, -58, -33, -17, -28, -19,  -23
];

const PST_MG_BISHOP = [
  -29,   4, -82, -37, -25, -42,   7,  -8,
  -26,  16, -18, -13,  30,  59,  18, -47,
  -16,  37,  43,  40,  35,  50,  37,  -2,
   -4,   5,  19,  50,  37,  37,   7,  -2,
   -6,  13,  13,  26,  34,  12,  10,   4,
    0,  15,  15,  15,  14,  27,  18,  10,
    4,  15,  16,   0,   7,  21,  33,   1,
  -33,  -3, -14, -21, -13, -12, -39, -21
];

const PST_MG_ROOK = [
   32,  42,  32,  51,  63,   9,  31,  43,
   27,  32,  58,  62,  80,  67,  26,  44,
   -5,  19,  26,  36,  17,  45,  61,  16,
  -24, -11,   7,  26,  24,  35,  -8, -20,
  -36, -26, -12,  -1,   9,  -7,   6, -23,
  -45, -25, -16, -17,   3,   0,  -5, -33,
  -44, -16, -20,  -9,  -1,  11,  -6, -71,
  -19, -13,   1,  17,  16,   7, -37, -26
];

const PST_MG_QUEEN = [
  -28,   0,  29,  12,  59,  44,  43,  45,
  -24, -39,  -5,   1, -16,  57,  28,  54,
  -18, -15,  -7,  14,   4,  45,  13,  28,
  -15,  -5,  -4,   8,  18,  34,  36,  19,
   -7,   6,  10,  15,  24,  19,  16,  -2,
   -9,  -7,   8,  -8,  -2,   2,  -8, -10,
  -14, -13, -11, -10,  -9,  -9,  -4, -18,
  -18,  -9,   7,  -3,   3, -18, -15, -22
];

const PST_MG_KING = [
  -65,  23,  16, -15, -56, -34,   2,  13,
   29,  -1, -20,  -7,  -8,  -4, -38, -29,
   -9,  24,   2, -16, -20,   6,  22, -22,
  -17, -20, -12, -27, -30, -25, -14, -36,
  -49,  -1, -27, -39, -46, -44, -33, -51,
  -14, -14, -22, -46, -44, -30, -15, -27,
    1,   7,  -8, -64, -43, -16,   9,   8,
  -15,  36,  12, -54,   8, -28,  24,  14
];

// Fast in-memory evaluation cache for instant lookups
const FEN_EVAL_CACHE = new Map<string, EngineResult>();

export interface EngineResult {
  scoreCp: number; // Positive = White advantage, Negative = Black advantage
  mate?: number | null;
  pv: string[]; // UCI moves
  multiPv2ScoreCp?: number;
  source: 'cache' | 'cloud' | 'tablebase' | 'stockfish' | 'local';
}

/**
 * Centipawns to Win Probability (0.0 - 1.0)
 */
export function cpToWinProb(cp: number, mate?: number | null): number {
  if (mate !== undefined && mate !== null) {
    if (mate > 0) return 1.0;
    if (mate < 0) return 0.0;
    return 0.5;
  }
  return 1 / (1 + Math.pow(10, -cp / 400));
}

/**
 * Accuracy formula (Lichess/Chess.com standard)
 */
export function calculateMoveAccuracy(winProbLoss: number): number {
  const acc = 103.1668 * Math.exp(-4.354 * winProbLoss) - 3.1669;
  return Math.min(100, Math.max(0, Math.round(acc * 10) / 10));
}

/**
 * Count total pieces on board
 */
export function countTotalPieces(chess: Chess): number {
  let count = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]) count++;
    }
  }
  return count;
}

/**
 * Count major and minor pieces
 */
export function countMajorMinorPieces(chess: Chess) {
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
      if (p.type !== 'p' && p.type !== 'k') {
        total++;
        if (p.color === 'w') {
          if (p.type === 'q') whiteQueens++;
          if (p.type === 'r') whiteRooks++;
          if (p.type === 'b' || p.type === 'n') whiteMinors++;
          if (r === 7) whiteBackRank++;
        } else {
          if (p.type === 'q') blackQueens++;
          if (p.type === 'r') blackRooks++;
          if (p.type === 'b' || p.type === 'n') blackMinors++;
          if (r === 0) blackBackRank++;
        }
      }
    }
  }

  return { total, whiteBackRank, blackBackRank, whiteQueens, blackQueens, whiteRooks, blackRooks, whiteMinors, blackMinors };
}

/**
 * Determine Game Phase
 */
export function detectPhase(
  ply: number,
  chess: Chess,
  moveSans: string[],
  middlegameStartPly: number | null,
  endgameStartPly: number | null
): { phase: GamePhase; newMiddlegameStart: number | null; newEndgameStart: number | null } {
  if (endgameStartPly !== null && ply >= endgameStartPly) {
    return { phase: 'endgame', newMiddlegameStart: middlegameStartPly, newEndgameStart: endgameStartPly };
  }

  const mm = countMajorMinorPieces(chess);
  const isEndgame =
    mm.total <= 6 ||
    (mm.whiteQueens === 0 &&
      mm.blackQueens === 0 &&
      mm.whiteRooks <= 1 &&
      mm.blackRooks <= 1 &&
      mm.whiteMinors <= 1 &&
      mm.blackMinors <= 1);

  if (isEndgame) {
    return {
      phase: 'endgame',
      newMiddlegameStart: middlegameStartPly ?? ply,
      newEndgameStart: endgameStartPly ?? ply,
    };
  }

  if (middlegameStartPly !== null && ply >= middlegameStartPly) {
    return { phase: 'middlegame', newMiddlegameStart: middlegameStartPly, newEndgameStart: null };
  }

  const inBook = isBookMove(moveSans, ply - 1);
  const fullMoves = Math.floor((ply - 1) / 2) + 1;
  const isMiddlegame =
    (!inBook && fullMoves > 10) ||
    mm.total < 10 ||
    mm.whiteBackRank + mm.blackBackRank < 4;

  if (isMiddlegame) {
    return { phase: 'middlegame', newMiddlegameStart: ply, newEndgameStart: null };
  }

  return { phase: 'opening', newMiddlegameStart: null, newEndgameStart: null };
}

/**
 * Deep Positional Evaluator with PeSTO Piece-Square Tables
 */
export function evaluatePositionLocally(fen: string): { cp: number; mate: number | null } {
  const chess = new Chess(fen);
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      return { cp: 0, mate: chess.turn() === 'w' ? -1 : 1 };
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
      const flippedIdx = (7 - r) * 8 + c; // Black views board flipped vertically

      let pstVal = 0;
      switch (piece.type) {
        case 'p':
          pstVal = piece.color === 'w' ? PST_MG_PAWN[squareIdx] : PST_MG_PAWN[flippedIdx];
          break;
        case 'n':
          pstVal = piece.color === 'w' ? PST_MG_KNIGHT[squareIdx] : PST_MG_KNIGHT[flippedIdx];
          break;
        case 'b':
          pstVal = piece.color === 'w' ? PST_MG_BISHOP[squareIdx] : PST_MG_BISHOP[flippedIdx];
          break;
        case 'r':
          pstVal = piece.color === 'w' ? PST_MG_ROOK[squareIdx] : PST_MG_ROOK[flippedIdx];
          break;
        case 'q':
          pstVal = piece.color === 'w' ? PST_MG_QUEEN[squareIdx] : PST_MG_QUEEN[flippedIdx];
          break;
        case 'k':
          pstVal = piece.color === 'w' ? PST_MG_KING[squareIdx] : PST_MG_KING[flippedIdx];
          break;
      }

      if (piece.color === 'w') {
        material += baseVal;
        positional += pstVal;
      } else {
        material -= baseVal;
        positional -= pstVal;
      }
    }
  }

  // Tactical mobility and center control factor
  const currentTurn = chess.turn();
  const mobility = (currentTurn === 'w' ? 1 : -1) * (chess.moves().length * 2.5);

  return { cp: material + positional + Math.round(mobility), mate: null };
}

/**
 * Tactical Move Ordering using MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
 */
function scoreMoveForOrdering(move: any): number {
  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured as PieceSymbol] || 100;
    const attackerVal = PIECE_VALUES[move.piece as PieceSymbol] || 100;
    return 10000 + (victimVal * 10) - attackerVal;
  }
  if (move.promotion) {
    return 9000;
  }
  if (move.san.includes('+')) {
    return 5000;
  }
  return 0;
}

/**
 * Quiescence Search: resolves all tactical captures and checks to eliminate the horizon effect
 */
function quiescence(chess: Chess, alpha: number, beta: number, qDepth = 0): number {
  const standPat = evaluatePositionLocally(chess.fen()).cp;
  const isWhite = chess.turn() === 'w';

  if (qDepth >= 4) return standPat;

  if (isWhite) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  // Only search tactical captures and checks in quiescence
  const captures = chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion || m.san.includes('+'));
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

/**
 * Full Alpha-Beta Minimax Search with Move Ordering and Quiescence
 */
function alphaBeta(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  pvArray: string[]
): number {
  if (depth === 0 || chess.isGameOver()) {
    return quiescence(chess, alpha, beta);
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -30000 : 30000;
    }
    return 0;
  }

  // Order moves: captures first, checks, then quiet moves
  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));

  const isWhite = chess.turn() === 'w';
  let bestScore = isWhite ? -Infinity : Infinity;
  let childPv: string[] = [];

  for (const move of moves) {
    chess.move(move);
    const localChildPv: string[] = [];
    const score = alphaBeta(chess, depth - 1, alpha, beta, localChildPv);
    chess.undo();

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        const uci = `${move.from}${move.to}${move.promotion || ''}`;
        pvArray.length = 0;
        pvArray.push(uci, ...localChildPv);
      }
      if (bestScore > alpha) alpha = bestScore;
      if (beta <= alpha) break; // Beta cutoff
    } else {
      if (score < bestScore) {
        bestScore = score;
        const uci = `${move.from}${move.to}${move.promotion || ''}`;
        pvArray.length = 0;
        pvArray.push(uci, ...localChildPv);
      }
      if (bestScore < beta) beta = bestScore;
      if (beta <= alpha) break; // Alpha cutoff
    }
  }

  return bestScore;
}

/**
 * Find best move locally with full Alpha-Beta Quiescence search
 */
export function findBestMoveLocal(
  fen: string,
  depth = 3
): { bestMoveUci: string; bestMoveSan: string; evalCp: number; multiPv2Cp?: number; pv: string[] } {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return { bestMoveUci: '', bestMoveSan: '', evalCp: 0, pv: [] };
  }

  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));

  const isWhite = chess.turn() === 'w';
  let bestScore = isWhite ? -Infinity : Infinity;
  let secondBestScore = isWhite ? -Infinity : Infinity;
  let bestMove = moves[0];
  let finalPv: string[] = [];

  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    chess.move(move);
    const childPv: string[] = [];
    const score = alphaBeta(chess, depth - 1, alpha, beta, childPv);
    chess.undo();

    const moveUci = `${move.from}${move.to}${move.promotion || ''}`;

    if (isWhite) {
      if (score > bestScore) {
        secondBestScore = bestScore;
        bestScore = score;
        bestMove = move;
        finalPv = [moveUci, ...childPv];
        alpha = Math.max(alpha, bestScore);
      } else if (score > secondBestScore) {
        secondBestScore = score;
      }
    } else {
      if (score < bestScore) {
        secondBestScore = bestScore;
        bestScore = score;
        bestMove = move;
        finalPv = [moveUci, ...childPv];
        beta = Math.min(beta, bestScore);
      } else if (score < secondBestScore) {
        secondBestScore = score;
      }
    }
  }

  return {
    bestMoveUci: `${bestMove.from}${bestMove.to}${bestMove.promotion || ''}`,
    bestMoveSan: bestMove.san,
    evalCp: bestScore,
    multiPv2Cp: secondBestScore !== (isWhite ? -Infinity : Infinity) ? secondBestScore : undefined,
    pv: finalPv.length > 0 ? finalPv : [`${bestMove.from}${bestMove.to}${bestMove.promotion || ''}`],
  };
}

/**
 * Lichess Master Cloud Eval API (Depth 30-45+ Master evaluations)
 */
async function fetchLichessCloudEval(fen: string): Promise<EngineResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const encodedFen = encodeURIComponent(fen);
    const res = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodedFen}&multiPv=2`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.pvs && data.pvs.length > 0) {
        const top = data.pvs[0];
        const second = data.pvs[1];
        const pvStr = top.moves ? top.moves.split(' ') : [];
        return {
          scoreCp: top.cp ?? (top.mate ? (top.mate > 0 ? 3000 : -3000) : 0),
          mate: top.mate ?? null,
          pv: pvStr,
          multiPv2ScoreCp: second ? (second.cp ?? undefined) : undefined,
          source: 'cloud',
        };
      }
    }
  } catch {
    // Timeout or network offline
  }
  return null;
}

/**
 * Lichess Syzygy Tablebase API (<= 7 pieces)
 */
async function fetchSyzygyTablebase(fen: string): Promise<EngineResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const encodedFen = encodeURIComponent(fen);
    const res = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodedFen}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.category) {
        let cp = 0;
        let mate: number | null = null;
        if (data.category === 'win') {
          cp = 3000;
          mate = data.dtm ? Math.ceil(Math.abs(data.dtm) / 2) : 10;
        } else if (data.category === 'loss') {
          cp = -3000;
          mate = data.dtm ? -Math.ceil(Math.abs(data.dtm) / 2) : -10;
        }
        const topMove = data.moves && data.moves[0] ? data.moves[0].uci : '';
        return {
          scoreCp: cp,
          mate,
          pv: topMove ? [topMove] : [],
          source: 'tablebase',
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Hybrid Tournament-Grade Engine Evaluator
 * 1. In-memory FEN Cache (0ms)
 * 2. Lichess Master Cloud Stockfish (Depth 30-45+)
 * 3. Syzygy 7-Piece Endgame Tablebase (<= 7 pieces)
 * 4. Stockfish Web Worker (Depth 16-18)
 * 5. Full Alpha-Beta Quiescence engine fallback
 */
export async function evaluateFenHybrid(
  fen: string,
  isDeep = false
): Promise<EngineResult> {
  // Check in-memory cache first
  const cached = FEN_EVAL_CACHE.get(fen);
  if (cached) return cached;

  const chess = new Chess(fen);
  const totalPieces = countTotalPieces(chess);

  // Tier 1: Lichess Cloud Stockfish (Depth 30-45+)
  const cloud = await fetchLichessCloudEval(fen);
  if (cloud) {
    FEN_EVAL_CACHE.set(fen, cloud);
    return cloud;
  }

  // Tier 2: Syzygy Tablebase if <= 7 pieces
  if (totalPieces <= 7) {
    const tablebase = await fetchSyzygyTablebase(fen);
    if (tablebase) {
      FEN_EVAL_CACHE.set(fen, tablebase);
      return tablebase;
    }
  }

  // Tier 3: Stockfish Web Worker (Depth 16-18)
  const targetDepth = isDeep ? 18 : 16;
  const sfEval = await stockfishService.evaluate(fen, targetDepth, 1500);
  if (sfEval && sfEval.bestMoveUci) {
    const sfResult: EngineResult = {
      scoreCp: sfEval.scoreCp,
      mate: sfEval.mate,
      pv: sfEval.pv,
      multiPv2ScoreCp: sfEval.multiPv2ScoreCp,
      source: 'stockfish',
    };
    FEN_EVAL_CACHE.set(fen, sfResult);
    return sfResult;
  }

  // Tier 4: Tactical Alpha-Beta Search with Quiescence & Move Ordering
  const localSearch = findBestMoveLocal(fen, isDeep ? 4 : 3);
  const localResult: EngineResult = {
    scoreCp: localSearch.evalCp,
    mate: null,
    pv: localSearch.pv,
    multiPv2ScoreCp: localSearch.multiPv2Cp,
    source: 'local',
  };

  FEN_EVAL_CACHE.set(fen, localResult);
  return localResult;
}

/**
 * Genuine Opponent Threat Detector
 * Evaluates what the opponent would play if granted an immediate turn.
 * Only triggers if there is a real tactical threat (mate, check, piece capture, or fork).
 */
export async function detectThreat(
  fen: string
): Promise<{ uci: string; san: string; description: string } | null> {
  try {
    const chess = new Chess(fen);
    if (chess.isGameOver()) return null;

    // Invert the turn to simulate opponent having a free move
    const parts = fen.split(' ');
    const opponentColor = parts[1] === 'w' ? 'b' : 'w';
    parts[1] = opponentColor;
    parts[3] = '-'; // Clear en-passant for inverted position
    const invertedFen = parts.join(' ');

    const opponentChess = new Chess(invertedFen);
    const engineResult = await evaluateFenHybrid(invertedFen, false);

    if (engineResult.pv && engineResult.pv.length > 0) {
      const threatUci = engineResult.pv[0];
      const from = threatUci.slice(0, 2) as any;
      const to = threatUci.slice(2, 4) as any;
      const promotion = threatUci.length > 4 ? threatUci[4] : undefined;

      const move = opponentChess.move({ from, to, promotion });
      if (!move) return null;

      // Check if this move constitutes a genuine tactical threat
      const pieceNameMap: Record<string, string> = {
        p: 'Pawn',
        n: 'Knight',
        b: 'Bishop',
        r: 'Rook',
        q: 'Queen',
        k: 'King',
      };

      if (opponentChess.isCheckmate()) {
        return {
          uci: threatUci,
          san: move.san,
          description: `Immediate Checkmate on ${move.to}!`,
        };
      }

      if (move.captured) {
        const victimName = pieceNameMap[move.captured.toLowerCase()] || 'Piece';
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens to capture ${victimName} on ${move.to}`,
        };
      }

      if (opponentChess.inCheck()) {
        const attackerName = pieceNameMap[move.piece.toLowerCase()] || 'Piece';
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens forcing check with ${attackerName} on ${move.to}`,
        };
      }

      // Check if move forks two major/minor pieces
      const attackedSquares = opponentChess.moves({ verbose: true });
      const attackedValuable = attackedSquares.filter(
        (m) => m.captured && ['q', 'r', 'b', 'n'].includes(m.captured)
      );

      if (attackedValuable.length >= 2) {
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens tactical fork on ${move.to}`,
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Material sacrifice test for Brilliant moves
 */
function isMaterialSacrifice(
  fenBefore: string,
  fenAfter: string,
  moverColor: 'w' | 'b'
): boolean {
  const cBefore = new Chess(fenBefore);
  const cAfter = new Chess(fenAfter);

  let moverValBefore = 0;
  let moverValAfter = 0;

  cBefore.board().flat().forEach((p) => {
    if (p && p.color === moverColor && p.type !== 'k') {
      moverValBefore += PIECE_VALUES[p.type];
    }
  });

  cAfter.board().flat().forEach((p) => {
    if (p && p.color === moverColor && p.type !== 'k') {
      moverValAfter += PIECE_VALUES[p.type];
    }
  });

  return moverValAfter <= moverValBefore - 200;
}

/**
 * Classify a move (Chess.com standards)
 */
export function classifyMove(
  playedUci: string,
  bestMoveUci: string,
  winProbBefore: number,
  winProbAfter: number,
  winProbLoss: number,
  isBook: boolean,
  multiPv1WinProb: number,
  multiPv2WinProb: number | undefined,
  fenBefore: string,
  fenAfter: string,
  moverColor: 'w' | 'b'
): MoveClassification {
  if (isBook) return 'book';

  const isMatchingBest = playedUci === bestMoveUci || winProbLoss <= 0.01;

  if (isMatchingBest && winProbAfter >= 0.48 && winProbBefore < 0.90) {
    if (isMaterialSacrifice(fenBefore, fenAfter, moverColor)) {
      return 'brilliant';
    }
  }

  if (
    isMatchingBest &&
    multiPv2WinProb !== undefined &&
    multiPv1WinProb - multiPv2WinProb >= 0.15
  ) {
    return 'great';
  }

  if (winProbBefore >= 0.75 && winProbAfter <= 0.55) {
    return 'missed_win';
  }

  if (winProbLoss > 0.20) return 'blunder';
  if (winProbLoss > 0.10) return 'mistake';
  if (winProbLoss > 0.05) return 'inaccuracy';
  if (isMatchingBest || winProbLoss <= 0.005) return 'best';
  if (winProbLoss <= 0.02) return 'excellent';
  return 'good';
}

/**
 * Phase & Performance Elo Math
 */
export function calculatePhaseElo(
  baseElo: number,
  acpl: number,
  movesCount: number,
  isOverall = false,
  result: '1-0' | '0-1' | '1/2-1/2' | '*' = '*',
  userColor: 'w' | 'b' = 'w'
): number | null {
  if (movesCount < 3) return null;

  const expectedAcpl = Math.max(12.0, 145.0 - baseElo * 0.052);
  const eloDelta = (expectedAcpl - acpl) * 8.5;
  const clampedDelta = Math.min(600, Math.max(-600, eloDelta));

  let resultBonus = 0;
  if (isOverall) {
    if ((result === '1-0' && userColor === 'w') || (result === '0-1' && userColor === 'b')) {
      resultBonus = 40;
    } else if (result === '1/2-1/2') {
      resultBonus = 0;
    } else if (result !== '*') {
      resultBonus = -40;
    }
  }

  const estimated = Math.round(baseElo + clampedDelta + resultBonus);
  return Math.min(3200, Math.max(400, estimated));
}
