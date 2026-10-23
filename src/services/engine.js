const Chess = window.Chess;
import { isBookMove } from "./ecoDictionary.js";
import { stockfishService } from "./stockfishWorker.js";
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 2e4
};
const PST_MG_PAWN = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  98,
  134,
  61,
  95,
  68,
  126,
  34,
  -11,
  -6,
  7,
  26,
  31,
  65,
  56,
  25,
  -20,
  -14,
  13,
  6,
  21,
  23,
  12,
  17,
  -23,
  -27,
  -2,
  -5,
  12,
  17,
  6,
  10,
  -25,
  -26,
  -4,
  -4,
  -10,
  3,
  3,
  33,
  -12,
  -35,
  -1,
  -20,
  -23,
  -15,
  24,
  38,
  -22,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
];
const PST_MG_KNIGHT = [
  -167,
  -89,
  -34,
  -49,
  61,
  -97,
  -15,
  -107,
  -73,
  -41,
  72,
  36,
  23,
  62,
  7,
  -17,
  -47,
  60,
  37,
  65,
  84,
  129,
  73,
  44,
  -9,
  17,
  19,
  53,
  37,
  69,
  18,
  22,
  -13,
  4,
  16,
  13,
  28,
  19,
  21,
  -8,
  -23,
  -9,
  12,
  10,
  19,
  17,
  25,
  -16,
  -29,
  -53,
  -12,
  -3,
  -1,
  18,
  -14,
  -19,
  -105,
  -21,
  -58,
  -33,
  -17,
  -28,
  -19,
  -23
];
const PST_MG_BISHOP = [
  -29,
  4,
  -82,
  -37,
  -25,
  -42,
  7,
  -8,
  -26,
  16,
  -18,
  -13,
  30,
  59,
  18,
  -47,
  -16,
  37,
  43,
  40,
  35,
  50,
  37,
  -2,
  -4,
  5,
  19,
  50,
  37,
  37,
  7,
  -2,
  -6,
  13,
  13,
  26,
  34,
  12,
  10,
  4,
  0,
  15,
  15,
  15,
  14,
  27,
  18,
  10,
  4,
  15,
  16,
  0,
  7,
  21,
  33,
  1,
  -33,
  -3,
  -14,
  -21,
  -13,
  -12,
  -39,
  -21
];
const PST_MG_ROOK = [
  32,
  42,
  32,
  51,
  63,
  9,
  31,
  43,
  27,
  32,
  58,
  62,
  80,
  67,
  26,
  44,
  -5,
  19,
  26,
  36,
  17,
  45,
  61,
  16,
  -24,
  -11,
  7,
  26,
  24,
  35,
  -8,
  -20,
  -36,
  -26,
  -12,
  -1,
  9,
  -7,
  6,
  -23,
  -45,
  -25,
  -16,
  -17,
  3,
  0,
  -5,
  -33,
  -44,
  -16,
  -20,
  -9,
  -1,
  11,
  -6,
  -71,
  -19,
  -13,
  1,
  17,
  16,
  7,
  -37,
  -26
];
const PST_MG_QUEEN = [
  -28,
  0,
  29,
  12,
  59,
  44,
  43,
  45,
  -24,
  -39,
  -5,
  1,
  -16,
  57,
  28,
  54,
  -18,
  -15,
  -7,
  14,
  4,
  45,
  13,
  28,
  -15,
  -5,
  -4,
  8,
  18,
  34,
  36,
  19,
  -7,
  6,
  10,
  15,
  24,
  19,
  16,
  -2,
  -9,
  -7,
  8,
  -8,
  -2,
  2,
  -8,
  -10,
  -14,
  -13,
  -11,
  -10,
  -9,
  -9,
  -4,
  -18,
  -18,
  -9,
  7,
  -3,
  3,
  -18,
  -15,
  -22
];
const PST_MG_KING = [
  -65,
  23,
  16,
  -15,
  -56,
  -34,
  2,
  13,
  29,
  -1,
  -20,
  -7,
  -8,
  -4,
  -38,
  -29,
  -9,
  24,
  2,
  -16,
  -20,
  6,
  22,
  -22,
  -17,
  -20,
  -12,
  -27,
  -30,
  -25,
  -14,
  -36,
  -49,
  -1,
  -27,
  -39,
  -46,
  -44,
  -33,
  -51,
  -14,
  -14,
  -22,
  -46,
  -44,
  -30,
  -15,
  -27,
  1,
  7,
  -8,
  -64,
  -43,
  -16,
  9,
  8,
  -15,
  36,
  12,
  -54,
  8,
  -28,
  24,
  14
];
export const FEN_EVAL_CACHE = /* @__PURE__ */ new Map();
export function cpToWinProb(cp, mate) {
  if (mate !== void 0 && mate !== null) {
    if (mate > 0) return 1;
    if (mate < 0) return 0;
    return 0.5;
  }
  return 1 / (1 + Math.pow(10, -cp / 400));
}
export function calculateMoveAccuracy(winProbLoss) {
  const acc = 103.1668 * Math.exp(-4.354 * winProbLoss) - 3.1669;
  return Math.min(100, Math.max(0, Math.round(acc * 10) / 10));
}
export function countTotalPieces(chess) {
  let count = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]) count++;
    }
  }
  return count;
}
export function countMajorMinorPieces(chess) {
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
export function detectPhase(ply, chess, moveSans, middlegameStartPly, endgameStartPly) {
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

export function evaluatePositionLocally(fen) {
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
export function findBestMoveLocal(fen, depth = 3) {
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
export function normalizeFenKey(fen) {
  if (!fen) return "";
  const parts = fen.trim().split(/\s+/);
  return parts.slice(0, 4).join(" ");
}

export async function evaluateFenHybrid(fen, isDeep = false) {
  const cacheKey = `${normalizeFenKey(fen)}_${isDeep ? "deep" : "fast"}`;
  const cached = FEN_EVAL_CACHE.get(cacheKey);
  if (cached) return cached;

  if (!isDeep) {
    const localSearch = findBestMoveLocal(fen, 1);
    const localResult = {
      scoreCp: localSearch.evalCp,
      mate: null,
      pv: localSearch.pv,
      bestMoveUci: localSearch.bestMoveUci,
      secondBestMoveUci: localSearch.secondBestMoveUci,
      multiPv2ScoreCp: localSearch.multiPv2Cp,
      source: "local"
    };
    FEN_EVAL_CACHE.set(cacheKey, localResult);
    return localResult;
  }

  const chess = new Chess(fen);
  const totalPieces = countTotalPieces(chess);
  if (totalPieces <= 7) {
    const tablebase = await fetchSyzygyTablebase(fen);
    if (tablebase) {
      if (!tablebase.bestMoveUci && tablebase.pv && tablebase.pv[0]) {
        tablebase.bestMoveUci = tablebase.pv[0];
      }
      if (!tablebase.secondBestMoveUci) {
        const fallback = findBestMoveLocal(fen, 1);
        tablebase.secondBestMoveUci = fallback.secondBestMoveUci;
      }
      FEN_EVAL_CACHE.set(cacheKey, tablebase);
      return tablebase;
    }
  }

  const targetDepth = 14;
  const sfEval = await stockfishService.evaluate(fen, targetDepth, 800);
  if (sfEval && sfEval.bestMoveUci) {
    const fallback = findBestMoveLocal(fen, 1);
    const sfResult = {
      scoreCp: sfEval.scoreCp,
      mate: sfEval.mate,
      pv: sfEval.pv,
      bestMoveUci: sfEval.bestMoveUci,
      secondBestMoveUci: fallback.secondBestMoveUci,
      multiPv2ScoreCp: sfEval.multiPv2ScoreCp,
      source: "stockfish"
    };
    FEN_EVAL_CACHE.set(cacheKey, sfResult);
    return sfResult;
  }

  const localSearch = findBestMoveLocal(fen, 3);
  const localResult = {
    scoreCp: localSearch.evalCp,
    mate: null,
    pv: localSearch.pv,
    bestMoveUci: localSearch.bestMoveUci,
    secondBestMoveUci: localSearch.secondBestMoveUci,
    multiPv2ScoreCp: localSearch.multiPv2Cp,
    source: "local"
  };
  FEN_EVAL_CACHE.set(cacheKey, localResult);
  return localResult;
}
export async function detectThreat(fen) {
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
function isMaterialSacrifice(fenBefore, fenAfter, moverColor) {
  const cBefore = new Chess(fenBefore);
  const cAfter = new Chess(fenAfter);
  let moverValBefore = 0;
  let moverValAfter = 0;
  cBefore.board().flat().forEach((p) => {
    if (p && p.color === moverColor && p.type !== "k") {
      moverValBefore += PIECE_VALUES[p.type];
    }
  });
  cAfter.board().flat().forEach((p) => {
    if (p && p.color === moverColor && p.type !== "k") {
      moverValAfter += PIECE_VALUES[p.type];
    }
  });
  return moverValAfter <= moverValBefore - 200;
}
export function classifyMove(playedUci, bestMoveUci, winProbBefore, winProbAfter, winProbLoss, isBook, multiPv1WinProb, multiPv2WinProb, fenBefore, fenAfter, moverColor) {
  if (isBook) return "book";
  const isExactBest = Boolean(bestMoveUci && playedUci && playedUci.toLowerCase() === bestMoveUci.toLowerCase());

  if (isExactBest) {
    if (winProbAfter >= 0.48 && winProbBefore < 0.9) {
      if (isMaterialSacrifice(fenBefore, fenAfter, moverColor)) {
        return "brilliant";
      }
    }
    if (multiPv2WinProb !== void 0 && multiPv1WinProb - multiPv2WinProb >= 0.15) {
      return "great";
    }
    return "best";
  }

  if (winProbBefore >= 0.75 && winProbAfter <= 0.55) {
    return "missed_win";
  }
  if (winProbLoss > 0.2) return "blunder";
  if (winProbLoss > 0.1) return "mistake";
  if (winProbLoss > 0.05) return "inaccuracy";
  if (winProbLoss <= 0.02) return "excellent";
  return "good";
}
export function calculatePhaseElo(baseElo, acpl, movesCount, isOverall = false, result = "*", userColor = "w") {
  if (movesCount < 3) return null;
  const expectedAcpl = Math.max(18, 135 - baseElo * 0.05);
  const eloDelta = (expectedAcpl - acpl) * 4.5;
  const maxClamp = isOverall ? 320 : 220;
  const clampedDelta = Math.min(maxClamp, Math.max(-maxClamp, eloDelta));
  let resultBonus = 0;
  if (isOverall) {
    if (result === "1-0" && userColor === "w" || result === "0-1" && userColor === "b") {
      resultBonus = 25;
    } else if (result === "1/2-1/2") {
      resultBonus = 0;
    } else if (result !== "*") {
      resultBonus = -25;
    }
  }
  const estimated = Math.round(baseElo + clampedDelta + resultBonus);
  return Math.min(3000, Math.max(400, estimated));
}

export async function getDeepContinuation(fen, maxPlies = 10) {
  const steps = [];
  try {
    const chess = new Chess(fen);
    let pvMoves = [];

    if (stockfishService && stockfishService.isAvailable) {
      try {
        const sf = await stockfishService.evaluate(fen, 12, 500);
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

export function summarizePunishment(fenStart, fenEnd, moverColor) {
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
