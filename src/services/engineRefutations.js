const Chess = window.Chess;
import { stockfishService } from "./stockfishWorker.js";
import { evaluateFenHybrid, findBestMoveLocal, isChessGameOver, isChessCheckmate, isChessInCheck } from "./engine.js";

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

export function replayPv(fen, pvMoves, maxPlies = 10) {
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

export async function prepareMoveExplanation(cur) {
  if (!cur) return null;
  try {
    const punishmentSteps = [
      { ply: 0, fen: cur.fen, from: cur.from, to: cur.to, san: cur.san }
    ];

    let deepPunish = [];
    if (cur.punishmentPv && cur.punishmentPv.length > 0) {
      deepPunish = replayPv(cur.fen, cur.punishmentPv, 10);
    }
    if (deepPunish.length === 0) {
      deepPunish = await getDeepContinuation(cur.fen, 10);
    }
    punishmentSteps.push(...deepPunish);

    const endFen = punishmentSteps[punishmentSteps.length - 1].fen;
    const punishmentSummary = summarizePunishment(cur.fen, endFen, cur.color);

    const bestSteps = [
      { ply: 0, fen: cur.fenBefore, from: null, to: null, san: 'Start' }
    ];

    let deepBest = [];
    if (cur.bestPv && cur.bestPv.length > 0) {
      deepBest = replayPv(cur.fenBefore, cur.bestPv, 10);
    }
    if (deepBest.length === 0) {
      const cBest = new Chess(cur.fenBefore);
      const bUci = cur.bestMoveUci;
      if (bUci && bUci.length >= 4) {
        const from = bUci.slice(0, 2);
        const to = bUci.slice(2, 4);
        const promotion = bUci.length > 4 ? bUci[4] : void 0;
        const m = cBest.move({ from, to, promotion });
        if (m) {
          deepBest.push({
            ply: 1,
            san: m.san,
            uci: bUci,
            from: m.from,
            to: m.to,
            fen: cBest.fen(),
            color: m.color
          });
          const further = await getDeepContinuation(cBest.fen(), 9);
          deepBest.push(...further);
        }
      }
    }
    bestSteps.push(...deepBest);

    const bestSan = cur.bestMoveSan || bestSteps[1]?.san || 'the suggested move';
    const bestSummary = `Playing ${bestSan} retains full equality or advantage with no tactical loss.`;

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
