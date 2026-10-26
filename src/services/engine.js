const MAX_FEN_CACHE_SIZE = 6000;
const PST_BY_TYPE = {
  p: PST_MG_PAWN,
  n: PST_MG_KNIGHT,
  b: PST_MG_BISHOP,
  r: PST_MG_ROOK,
  q: PST_MG_QUEEN,
  k: PST_MG_KING
};

const PST_EG_BY_TYPE = {
  p: typeof PST_EG_PAWN !== "undefined" ? PST_EG_PAWN : PST_MG_PAWN,
  n: typeof PST_EG_KNIGHT !== "undefined" ? PST_EG_KNIGHT : PST_MG_KNIGHT,
  b: typeof PST_EG_BISHOP !== "undefined" ? PST_EG_BISHOP : PST_MG_BISHOP,
  r: typeof PST_EG_ROOK !== "undefined" ? PST_EG_ROOK : PST_MG_ROOK,
  q: typeof PST_EG_QUEEN !== "undefined" ? PST_EG_QUEEN : PST_MG_QUEEN,
  k: typeof PST_EG_KING !== "undefined" ? PST_EG_KING : PST_MG_KING
};

const PHASE_WEIGHTS = { p: 0, n: 1, b: 1, r: 2, q: 4, k: 0 };
const MAX_PHASE = 24;

var FEN_EVAL_CACHE = new Map();
var LOCAL_TT = new Map();
const MAX_LOCAL_TT_SIZE = 12000;

function setFenCache(key, value) {
  if (FEN_EVAL_CACHE.size >= MAX_FEN_CACHE_SIZE && !FEN_EVAL_CACHE.has(key)) {
    const oldestKey = FEN_EVAL_CACHE.keys().next().value;
    if (oldestKey !== undefined) FEN_EVAL_CACHE.delete(oldestKey);
  }
  FEN_EVAL_CACHE.set(key, value);
}

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

function sumBoardMaterial(chess, color) {
  let total = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color && p.type !== "k") {
        total += PIECE_VALUES[p.type] || 0;
      }
    }
  }
  return total;
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
      if (!p || p.type === "p" || p.type === "k") continue;
      total++;
      if (p.color === "w") {
        if (p.type === "q") whiteQueens++;
        else if (p.type === "r") whiteRooks++;
        else if (p.type === "b" || p.type === "n") whiteMinors++;
        if (r === 7) whiteBackRank++;
      } else {
        if (p.type === "q") blackQueens++;
        else if (p.type === "r") blackRooks++;
        else if (p.type === "b" || p.type === "n") blackMinors++;
        if (r === 0) blackBackRank++;
      }
    }
  }
  return { total, whiteBackRank, blackBackRank, whiteQueens, blackQueens, whiteRooks, blackRooks, whiteMinors, blackMinors };
}

function detectPhase(ply, chess, moveSansOrIsBook, middlegameStartPly, endgameStartPly) {
  if (endgameStartPly !== null && ply >= endgameStartPly) {
    return { phase: "endgame", newMiddlegameStart: middlegameStartPly, newEndgameStart: endgameStartPly };
  }
  const mm = countMajorMinorPieces(chess);
  const isEndgame = mm.total <= 6 || (mm.whiteQueens === 0 && mm.blackQueens === 0 && mm.whiteRooks <= 1 && mm.blackRooks <= 1 && mm.whiteMinors <= 1 && mm.blackMinors <= 1);
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
  const inBook = typeof moveSansOrIsBook === "boolean" ? moveSansOrIsBook : isBookMove(moveSansOrIsBook, ply - 1);
  const fullMoves = Math.floor((ply - 1) / 2) + 1;
  const isMiddlegame = (!inBook && fullMoves > 10) || mm.total < 10 || mm.whiteBackRank + mm.blackBackRank < 4;
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

function evaluateBoardScore(chess) {
  let mgScore = 0;
  let egScore = 0;
  let phase = 0;
  let whiteBishops = 0;
  let blackBishops = 0;
  const whitePawnCols = [0, 0, 0, 0, 0, 0, 0, 0];
  const blackPawnCols = [0, 0, 0, 0, 0, 0, 0, 0];
  const whiteMinPawnRank = [8, 8, 8, 8, 8, 8, 8, 8];
  const blackMaxPawnRank = [-1, -1, -1, -1, -1, -1, -1, -1];
  const whiteRooks = [];
  const blackRooks = [];

  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const type = piece.type;
      const isW = piece.color === "w";
      const mgBase = PIECE_VALUES[type] || 0;
      const egBase = (typeof PIECE_VALUES_EG !== "undefined" && PIECE_VALUES_EG[type]) || mgBase;
      const pstMg = PST_BY_TYPE[type];
      const pstEg = PST_EG_BY_TYPE[type];
      const sqIdx = isW ? r * 8 + c : (7 - r) * 8 + c;
      const mgVal = mgBase + (pstMg ? pstMg[sqIdx] : 0);
      const egVal = egBase + (pstEg ? pstEg[sqIdx] : 0);

      if (isW) {
        mgScore += mgVal;
        egScore += egVal;
        if (type === "b") whiteBishops++;
        else if (type === "p") {
          whitePawnCols[c]++;
          if (r < whiteMinPawnRank[c]) whiteMinPawnRank[c] = r;
        } else if (type === "r") {
          whiteRooks.push(c);
        }
      } else {
        mgScore -= mgVal;
        egScore -= egVal;
        if (type === "b") blackBishops++;
        else if (type === "p") {
          blackPawnCols[c]++;
          if (r > blackMaxPawnRank[c]) blackMaxPawnRank[c] = r;
        } else if (type === "r") {
          blackRooks.push(c);
        }
      }
      phase += PHASE_WEIGHTS[type] || 0;
    }
  }

  let bonus = 0;
  if (whiteBishops >= 2) bonus += 32;
  if (blackBishops >= 2) bonus -= 32;

  for (let c = 0; c < 8; c++) {
    if (whitePawnCols[c] > 1) bonus -= 14 * (whitePawnCols[c] - 1);
    if (blackPawnCols[c] > 1) bonus += 14 * (blackPawnCols[c] - 1);

    const wLeft = c > 0 ? whitePawnCols[c - 1] : 0;
    const wRight = c < 7 ? whitePawnCols[c + 1] : 0;
    if (whitePawnCols[c] > 0 && wLeft === 0 && wRight === 0) bonus -= 12;

    const bLeft = c > 0 ? blackPawnCols[c - 1] : 0;
    const bRight = c < 7 ? blackPawnCols[c + 1] : 0;
    if (blackPawnCols[c] > 0 && bLeft === 0 && bRight === 0) bonus += 12;

    if (whitePawnCols[c] > 0) {
      const wRank = whiteMinPawnRank[c];
      const bBlockC = blackMaxPawnRank[c] > -1 && blackMaxPawnRank[c] < wRank;
      const bBlockL = c > 0 && blackMaxPawnRank[c - 1] > -1 && blackMaxPawnRank[c - 1] < wRank;
      const bBlockR = c < 7 && blackMaxPawnRank[c + 1] > -1 && blackMaxPawnRank[c + 1] < wRank;
      if (!bBlockC && !bBlockL && !bBlockR) {
        const advancement = 7 - wRank;
        bonus += advancement * advancement * 4;
      }
    }
    if (blackPawnCols[c] > 0) {
      const bRank = blackMaxPawnRank[c];
      const wBlockC = whiteMinPawnRank[c] < 8 && whiteMinPawnRank[c] > bRank;
      const wBlockL = c > 0 && whiteMinPawnRank[c - 1] < 8 && whiteMinPawnRank[c - 1] > bRank;
      const wBlockR = c < 7 && whiteMinPawnRank[c + 1] < 8 && whiteMinPawnRank[c + 1] > bRank;
      if (!wBlockC && !wBlockL && !wBlockR) {
        const advancement = bRank;
        bonus -= advancement * advancement * 4;
      }
    }
  }

  for (const col of whiteRooks) {
    if (whitePawnCols[col] === 0) {
      bonus += blackPawnCols[col] === 0 ? 22 : 11;
    }
  }
  for (const col of blackRooks) {
    if (blackPawnCols[col] === 0) {
      bonus -= whitePawnCols[col] === 0 ? 22 : 11;
    }
  }

  const clampedPhase = Math.min(MAX_PHASE, phase);
  const tapered = Math.round((mgScore * clampedPhase + egScore * (MAX_PHASE - clampedPhase)) / MAX_PHASE);
  return tapered + bonus;
}

function evaluatePositionLocally(fen) {
  const chess = new Chess(fen);
  if (isChessGameOver(chess)) {
    if (isChessCheckmate(chess)) {
      return { cp: 0, mate: chess.turn() === "w" ? -1 : 1 };
    }
    return { cp: 0, mate: null };
  }
  const currentTurn = chess.turn();
  const mobility = (currentTurn === "w" ? 1 : -1) * (chess.moves().length * 2.5);
  return { cp: evaluateBoardScore(chess) + Math.round(mobility), mate: null };
}

function scoreMoveForOrdering(move, ttBestUci = "") {
  const uci = `${move.from}${move.to}${move.promotion || ""}`;
  if (ttBestUci && uci === ttBestUci) return 3e4;
  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured] || 100;
    const attackerVal = PIECE_VALUES[move.piece] || 100;
    return 1e4 + victimVal * 10 - attackerVal;
  }
  if (move.promotion) {
    return 9e3 + (PIECE_VALUES[move.promotion] || 0);
  }
  if (move.san.includes("+")) {
    return 5e3;
  }
  return 0;
}

function quiescence(chess, alpha, beta, qDepth = 0) {
  const standPat = evaluateBoardScore(chess);
  const isWhite = chess.turn() === "w";
  if (qDepth >= 4) return standPat;

  if (isWhite) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  const captures = chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion || (qDepth === 0 && m.san.includes("+")));
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

function alphaBeta(chess, depth, alpha, beta, pvArray, plyFromRoot = 1) {
  if (depth <= 0) {
    return quiescence(chess, alpha, beta);
  }
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    if (isChessCheckmate(chess)) {
      return chess.turn() === "w" ? -(3e4 - plyFromRoot * 10) : (3e4 - plyFromRoot * 10);
    }
    return 0;
  }
  if (isChessGameOver(chess)) {
    return 0;
  }

  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  const isWhite = chess.turn() === "w";
  let bestScore = isWhite ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const localChildPv = [];
    const score = alphaBeta(chess, depth - 1, alpha, beta, localChildPv, plyFromRoot + 1);
    chess.undo();
    const uci = `${move.from}${move.to}${move.promotion || ""}`;
    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        pvArray.length = 0;
        pvArray.push(uci, ...localChildPv);
      }
      if (bestScore > alpha) alpha = bestScore;
      if (beta <= alpha) break;
    } else {
      if (score < bestScore) {
        bestScore = score;
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
    return { bestMoveUci: "", bestMoveSan: "", secondBestMoveUci: "", secondBestMoveSan: "", secondBestPv: [], evalCp: 0, pv: [] };
  }

  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  const isWhite = chess.turn() === "w";
  let bestScore = isWhite ? -Infinity : Infinity;
  let secondBestScore = isWhite ? -Infinity : Infinity;
  let bestMove = moves[0];
  let secondBestMove = moves.length > 1 ? moves[1] : null;
  let finalPv = [];
  let secondFinalPv = [];
  let alpha = -Infinity;
  let beta = Infinity;

  for (const move of moves) {
    chess.move(move);
    const childPv = [];
    const score = alphaBeta(chess, depth - 1, alpha, beta, childPv, 1);
    chess.undo();
    const moveUci = `${move.from}${move.to}${move.promotion || ""}`;
    if (isWhite) {
      if (score > bestScore) {
        secondBestScore = bestScore;
        secondBestMove = bestMove;
        secondFinalPv = finalPv;
        bestScore = score;
        bestMove = move;
        finalPv = [moveUci, ...childPv];
        alpha = Math.max(alpha, bestScore);
      } else if (score > secondBestScore) {
        secondBestScore = score;
        secondBestMove = move;
        secondFinalPv = [moveUci, ...childPv];
      }
    } else {
      if (score < bestScore) {
        secondBestScore = bestScore;
        secondBestMove = bestMove;
        secondFinalPv = finalPv;
        bestScore = score;
        bestMove = move;
        finalPv = [moveUci, ...childPv];
        beta = Math.min(beta, bestScore);
      } else if (score < secondBestScore) {
        secondBestScore = score;
        secondBestMove = move;
        secondFinalPv = [moveUci, ...childPv];
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
    secondBestPv: secondFinalPv,
    evalCp: bestScore,
    multiPv2Cp: secondBestScore !== (isWhite ? -Infinity : Infinity) ? secondBestScore : void 0,
    pv: finalPv.length > 0 ? finalPv : [bestMoveUci]
  };
}

function normalizeFenKey(fen) {
  if (!fen) return "";
  const parts = fen.trim().split(/\s+/);
  return parts.slice(0, 4).join(" ");
}

const ENGINE_PROFILES = {
  fast: { depth: 10, maxWaitMs: 400, localDepth: 2 },
  deep: { depth: 14, maxWaitMs: 600, localDepth: 3 },
  ultra: { depth: 16, maxWaitMs: 1000, localDepth: 3 }
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
  const isMate = Math.abs(localSearch.evalCp) >= 29000;
  return {
    scoreCp: isMate ? (localSearch.evalCp > 0 ? 3000 : -3000) : localSearch.evalCp,
    mate: isMate ? (localSearch.evalCp > 0 ? Math.max(1, Math.ceil((30000 - localSearch.evalCp) / 20)) : -Math.max(1, Math.ceil((30000 + localSearch.evalCp) / 20))) : null,
    pv: localSearch.pv,
    bestMoveUci: localSearch.bestMoveUci,
    secondBestMoveUci: localSearch.secondBestMoveUci,
    secondBestPv: localSearch.secondBestPv || [],
    multiPv2ScoreCp: localSearch.multiPv2Cp,
    depth,
    source: "local"
  };
}

async function evaluateFenHybrid(fen, isDeep = true) {
  const profileKey = isDeep === "ultra" ? "ultra" : (isDeep ? "deep" : "fast");
  const normKey = normalizeFenKey(fen);
  const cacheKey = `${normKey}_${profileKey}`;
  if (profileKey !== "ultra") {
    const ultraCached = FEN_EVAL_CACHE.get(`${normKey}_ultra`);
    if (ultraCached) return ultraCached;
  }
  const cached = FEN_EVAL_CACHE.get(cacheKey);
  if (cached) return cached;

  try {
    const chess = new Chess(fen);
    if (isChessGameOver(chess)) {
      const isMate = isChessCheckmate(chess);
      const turn = chess.turn();
      const terminalResult = {
        scoreCp: isMate ? (turn === "w" ? -3e3 : 3e3) : 0,
        mate: isMate ? (turn === "w" ? -1 : 1) : null,
        pv: [],
        bestMoveUci: "",
        secondBestMoveUci: "",
        secondBestPv: [],
        depth: 0,
        source: "terminal"
      };
      setFenCache(cacheKey, terminalResult);
      return terminalResult;
    }
  } catch {}

  const profile = ENGINE_PROFILES[profileKey] || ENGINE_PROFILES.deep;
  const sfEval = await stockfishService.evaluate(fen, profile.depth, profile.maxWaitMs);
  if (sfEval && sfEval.bestMoveUci) {
    const sfResult = toWhitePerspective({
      scoreCp: sfEval.scoreCp,
      mate: sfEval.mate,
      pv: sfEval.pv,
      bestMoveUci: sfEval.bestMoveUci,
      secondBestMoveUci: sfEval.secondBestMoveUci || "",
      secondBestPv: sfEval.secondBestPv || [],
      multiPv2ScoreCp: sfEval.multiPv2ScoreCp,
      depth: sfEval.depth || profile.depth,
      source: "stockfish"
    }, fen);
    setFenCache(cacheKey, sfResult);
    if (profileKey === "ultra") {
      setFenCache(`${normKey}_deep`, sfResult);
    }
    return sfResult;
  }

  const localResult = localEvaluation(fen, profile.localDepth || 4);
  setFenCache(cacheKey, localResult);
  if (profileKey === "ultra") {
    setFenCache(`${normKey}_deep`, localResult);
  }
  return localResult;
}

async function prefetchEvaluations(fens, isDeep, onEach) {
  const unique = [...new Set(fens)];
  if (unique.length === 0) return;

  stockfishService.warmUp();
  const workerCount = stockfishService.isAvailable
    ? Math.max(2, stockfishService.targetSize || stockfishService.size)
    : 1;
  const concurrency = Math.min(workerCount, unique.length);
  console.log(`[Engine] Evaluating ${unique.length} positions across ${concurrency} workers (profile: ${isDeep})`);

  let next = 0;
  let done = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (next < unique.length) {
      const fen = unique[next++];
      await evaluateFenHybrid(fen, isDeep);
      done++;
      if (onEach) await onEach(done, unique.length);
      if (!stockfishService.isAvailable && done % 2 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  });

  await Promise.all(workers);
}

function isMaterialSacrifice(fenBefore, fenAfter, moverColor, opponentBestUci = null) {
  try {
    const cBefore = new Chess(fenBefore);
    const cAfter = new Chess(fenAfter);
    const moverValBefore = sumBoardMaterial(cBefore, moverColor);
    const moverValAfter = sumBoardMaterial(cAfter, moverColor);

    if (moverValAfter <= moverValBefore - 200) {
      return true;
    }

    if (opponentBestUci && opponentBestUci.length >= 4) {
      const from = opponentBestUci.slice(0, 2);
      const to = opponentBestUci.slice(2, 4);
      const promotion = opponentBestUci.length > 4 ? opponentBestUci[4] : void 0;
      const oppMove = cAfter.move({ from, to, promotion });
      if (oppMove && oppMove.captured) {
        const moverValAfterOpp = sumBoardMaterial(cAfter, moverColor);
        if (moverValAfterOpp <= moverValBefore - 200) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

function isForcedMove(fenBefore) {
  if (!fenBefore) return false;
  try {
    const c = new Chess(fenBefore);
    return c.moves().length === 1;
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
  if (isForcedMove(fenBefore)) return "forced";
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

  // Missed win: player had a decisive win/advantage and let it slip to drawn or losing
  if (winProbBefore >= 0.80 && winProbAfter <= 0.58) {
    return "missed_win";
  }

  const isDecisivelyWinning = winProbAfter >= 0.78;
  const wasAlreadyHopeless = winProbBefore <= 0.12;

  // Blunder: disastrous swing in game outcome (turns win/equal into loss, or huge material loss)
  const isDecisiveSwing = (winProbBefore >= 0.45 && winProbAfter <= 0.25 && winProbLoss > 0.22);
  if ((winProbLoss > 0.28 || isDecisiveSwing) && !isDecisivelyWinning && !wasAlreadyHopeless) {
    return "blunder";
  }

  // Mistake: significant damage to position
  if (winProbLoss > 0.16) {
    if (isDecisivelyWinning) return "good";
    if (wasAlreadyHopeless) return "inaccuracy";
    return "mistake";
  }

  // Inaccuracy: slight slip or sub-optimal positional choice
  if (winProbLoss > 0.08) {
    if (isDecisivelyWinning || wasAlreadyHopeless) return "good";
    return "inaccuracy";
  }

  // Excellent: very close to best engine move
  if (winProbLoss <= 0.035) return "excellent";

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
