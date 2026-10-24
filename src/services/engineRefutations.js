const PIECE_NAME_MAP = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King"
};

function detectThreat(fen, threatUci) {
  try {
    if (!fen || !threatUci || threatUci.length < 4) return null;
    const chess = new Chess(fen);
    if (isChessGameOver(chess)) return null;

    const from = threatUci.slice(0, 2);
    const to = threatUci.slice(2, 4);
    const promotion = threatUci.length > 4 ? threatUci[4] : void 0;
    const move = chess.move({ from, to, promotion });
    if (!move) return null;

    if (isChessCheckmate(chess)) {
      return {
        uci: threatUci,
        san: move.san,
        description: `Immediate Checkmate on ${move.to}!`
      };
    }
    if (move.captured) {
      const victimName = PIECE_NAME_MAP[move.captured.toLowerCase()] || "Piece";
      return {
        uci: threatUci,
        san: move.san,
        description: `Threatens to capture ${victimName} on ${move.to}`
      };
    }
    if (isChessInCheck(chess)) {
      const attackerName = PIECE_NAME_MAP[move.piece.toLowerCase()] || "Piece";
      return {
        uci: threatUci,
        san: move.san,
        description: `Threatens forcing check with ${attackerName} on ${move.to}`
      };
    }
    const attackedSquares = chess.moves({ verbose: true });
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
  } catch {}
  return null;
}

async function getDeepContinuation(fen, maxPlies = 5) {
  const steps = [];
  if (!fen) return steps;
  try {
    const chess = new Chess(fen);
    if (isChessGameOver(chess)) return steps;

    let pvMoves = [];
    if (stockfishService && stockfishService.isAvailable) {
      try {
        const sf = await stockfishService.evaluate(fen, 10, 400);
        if (sf && sf.pv && sf.pv.length > 0) {
          pvMoves = sf.pv;
        }
      } catch {}
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
      let m = null;
      if (nextUci && nextUci.length >= 4) {
        const from = nextUci.slice(0, 2);
        const to = nextUci.slice(2, 4);
        const promotion = nextUci.length > 4 ? nextUci[4] : void 0;
        try { m = chess.move({ from, to, promotion }); } catch {}
      }
      if (!m) {
        const local = findBestMoveLocal(currentFen, 2);
        nextUci = local.bestMoveUci;
        if (nextUci && nextUci.length >= 4) {
          const from = nextUci.slice(0, 2);
          const to = nextUci.slice(2, 4);
          const promotion = nextUci.length > 4 ? nextUci[4] : void 0;
          try { m = chess.move({ from, to, promotion }); } catch {}
        }
      }
      if (!m) {
        const legal = chess.moves({ verbose: true });
        if (legal && legal.length > 0) {
          try { m = chess.move(legal[0]); } catch {}
        }
      }
      if (!m) break;

      currentFen = chess.fen();
      steps.push({
        ply: i + 1,
        san: m.san,
        uci: `${m.from}${m.to}${m.promotion || ""}`,
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
  } catch {}
  return steps;
}

const PIECE_PAWN_UNITS = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function getMaterialDiffInPawns(chess, moverColor) {
  let diff = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_PAWN_UNITS[p.type] || 0;
      diff += p.color === moverColor ? val : -val;
    }
  }
  return diff;
}

function summarizePunishment(fenStart, fenEnd, moverColor) {
  try {
    const cEnd = new Chess(fenEnd);
    if (isChessCheckmate(cEnd)) {
      return "Forces checkmate against you";
    }

    const cStart = new Chess(fenStart);
    const netLoss = getMaterialDiffInPawns(cStart, moverColor) - getMaterialDiffInPawns(cEnd, moverColor);
    if (netLoss >= 9) return `Opponent wins your Queen (+${netLoss})`;
    if (netLoss >= 5) return `Opponent wins a Rook (+${netLoss})`;
    if (netLoss >= 3) return `Opponent wins a minor piece (+${netLoss})`;
    if (netLoss >= 1) return `Opponent wins material (+${netLoss} pawn${netLoss > 1 ? "s" : ""})`;
    return "Opponent converts into a winning positional advantage";
  } catch {
    return "Opponent gains a decisive tactical advantage";
  }
}

function summarizeBrilliant(fenStart, fenEnd, moverColor) {
  try {
    const cEnd = new Chess(fenEnd);
    if (isChessCheckmate(cEnd)) {
      return "Forced checkmate sequence following the brilliant sacrifice!";
    }

    const cStart = new Chess(fenStart);
    const oppColor = moverColor === "w" ? "b" : "w";
    const netOppLoss = getMaterialDiffInPawns(cStart, oppColor) - getMaterialDiffInPawns(cEnd, oppColor);
    if (netOppLoss >= 9) return `Sacrifice shatters defenses to win opponent's Queen (+${netOppLoss})`;
    if (netOppLoss >= 5) return `Decisive tactical breakthrough wins a Rook (+${netOppLoss})`;
    if (netOppLoss >= 3) return `Sacrifice yields a decisive winning material advantage (+${netOppLoss})`;
    return "Sacrifices material to initiate a decisive winning attack";
  } catch {
    return "A brilliant tactical sacrifice that shatters the opponent's position";
  }
}

function replayPv(fen, pvMoves, maxPlies = 5) {
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

var MIN_CONTINUATION_PLIES = 5;

async function extendContinuation(startFen, steps, maxPlies = 5) {
  const validSteps = Array.isArray(steps) ? steps : [];
  if (validSteps.length >= MIN_CONTINUATION_PLIES) return validSteps;
  const lastFen = validSteps.length > 0 ? validSteps[validSteps.length - 1].fen : startFen;
  if (!lastFen) return validSteps;
  try {
    if (isChessGameOver(new Chess(lastFen))) return validSteps;
  } catch {
    return validSteps;
  }
  const needed = Math.max(1, maxPlies - validSteps.length);
  const extra = await getDeepContinuation(lastFen, needed);
  const merged = [...validSteps];
  extra.forEach((step) => merged.push({ ...step, ply: merged.length + 1 }));
  return merged;
}

function prepareMoveExplanation(cur) {
  if (!cur) return null;
  try {
    const punishmentSteps = [
      { ply: 0, fen: cur.fen, from: cur.from, to: cur.to, san: cur.san }
    ];

    if (cur.punishmentPv && cur.punishmentPv.length > 0) {
      punishmentSteps.push(...replayPv(cur.fen, cur.punishmentPv, 5));
    }

    const isBrilliant = cur.classification === "brilliant";
    const endFen = punishmentSteps[punishmentSteps.length - 1].fen;
    const punishmentSummary = isBrilliant
      ? summarizeBrilliant(cur.fen, endFen, cur.color)
      : summarizePunishment(cur.fen, endFen, cur.color);

    const bestSteps = [
      { ply: 0, fen: cur.fenBefore, from: null, to: null, san: "Start" }
    ];

    let deepBest = [];
    if (isBrilliant && cur.secondBestMoveUci) {
      deepBest = replayPv(cur.fenBefore, [cur.secondBestMoveUci], 1);
    } else if (cur.bestPv && cur.bestPv.length > 0) {
      deepBest = replayPv(cur.fenBefore, cur.bestPv, 5);
    }
    if (deepBest.length === 0 && (cur.secondBestMoveUci || cur.bestMoveUci)) {
      deepBest = replayPv(
        cur.fenBefore,
        [isBrilliant ? (cur.secondBestMoveUci || cur.bestMoveUci) : cur.bestMoveUci],
        1
      );
    }
    bestSteps.push(...deepBest);

    const bestSan = isBrilliant
      ? (cur.secondBestMoveSan || bestSteps[1]?.san || "a quiet alternative")
      : (cur.bestMoveSan || bestSteps[1]?.san || "the suggested move");
    const bestSummary = isBrilliant
      ? `Playing ${bestSan} misses the decisive tactical breakthrough.`
      : `Playing ${bestSan} retains full equality or advantage with no tactical loss.`;

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
