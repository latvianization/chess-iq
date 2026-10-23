const Chess = window.Chess;
import { isBookMove } from "./ecoDictionary.js";
import { stockfishService } from "./stockfishWorker.js";
import {
  PIECE_VALUES,
  PST_MG_PAWN,
  PST_MG_KNIGHT,
  PST_MG_BISHOP,
  PST_MG_ROOK,
  PST_MG_QUEEN,
  PST_MG_KING
} from "./engineEvaluationTables.js";
import {
  detectThreat,
  getDeepContinuation,
  summarizePunishment
} from "./engineRefutations.js";

export {
  PIECE_VALUES,
  PST_MG_PAWN,
  PST_MG_KNIGHT,
  PST_MG_BISHOP,
  PST_MG_ROOK,
  PST_MG_QUEEN,
  PST_MG_KING,
  detectThreat,
  getDeepContinuation,
  summarizePunishment
};
export const FEN_EVAL_CACHE = /* @__PURE__ */ new Map();
export function cpToWinProb(cp, mate) {
  if (mate !== void 0 && mate !== null) {
    if (mate > 0) return 1.0;
    if (mate < 0) return 0.0;
    return 0.5;
  }
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}
export function calculateMoveAccuracy(winProbLoss) {
  if (winProbLoss <= 0.001) return 100;
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
export function isChessGameOver(c) {
  return typeof c.isGameOver === 'function' ? c.isGameOver() : (typeof c.game_over === 'function' ? c.game_over() : false);
}
export function isChessCheckmate(c) {
  return typeof c.isCheckmate === 'function' ? c.isCheckmate() : (typeof c.in_checkmate === 'function' ? c.in_checkmate() : false);
}
export function isChessInCheck(c) {
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

const ENGINE_PROFILES = {
  fast: { depth: 5, maxWaitMs: 2000 },
  deep: { depth: 10, maxWaitMs: 3000 }
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

export async function evaluateFenHybrid(fen, isDeep = false) {
  const cacheKey = `${normalizeFenKey(fen)}_${isDeep ? "deep" : "fast"}`;
  const cached = FEN_EVAL_CACHE.get(cacheKey);
  if (cached) return cached;

  if (isDeep && countTotalPieces(new Chess(fen)) <= 7) {
    const tablebase = await fetchSyzygyTablebase(fen);
    if (tablebase) {
      tablebase.bestMoveUci = tablebase.bestMoveUci || (tablebase.pv && tablebase.pv[0]) || "";
      tablebase.secondBestMoveUci = tablebase.secondBestMoveUci || findBestMoveLocal(fen, 1).secondBestMoveUci;
      const whiteResult = toWhitePerspective(tablebase, fen);
      FEN_EVAL_CACHE.set(cacheKey, whiteResult);
      return whiteResult;
    }
  }

  const profile = isDeep ? ENGINE_PROFILES.deep : ENGINE_PROFILES.fast;
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

  const localResult = localEvaluation(fen, isDeep ? 3 : 2);
  FEN_EVAL_CACHE.set(cacheKey, localResult);
  return localResult;
}

export async function prefetchEvaluations(fens, isDeep, onEach) {
  const unique = [...new Set(fens)];
  stockfishService.warmUp();
  const feederCount = Math.max(1, stockfishService.size);
  let next = 0;
  let done = 0;
  let failure = null;

  const feeders = Array.from({ length: feederCount }, async () => {
    while (!failure && next < unique.length) {
      const fen = unique[next++];
      try {
        await evaluateFenHybrid(fen, isDeep);
        done++;
        if (onEach) await onEach(done, unique.length);
      } catch (err) {
        failure = err;
      }
    }
  });
  await Promise.all(feeders);
  if (failure) throw failure;
}

export function isMaterialSacrifice(fenBefore, fenAfter, moverColor, opponentBestUci = null) {
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

export function classifyMove(
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

export function calculatePerformanceElo(baseElo, accuracy, movesCount, result = "*", userColor = "w") {
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

export const calculatePhaseElo = calculatePerformanceElo;
