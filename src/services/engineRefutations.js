const PIECE_NAME_MAP = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King"
};

function detectThreat(fen, threatUci, mateScore = null, pvAfter = []) {
  try {
    if (!fen || !threatUci || threatUci.length < 4) return null;
    const chess = new Chess(fen);
    if (isChessGameOver(chess)) return null;

    const moverSide = chess.turn();
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

    if (mateScore !== null && mateScore !== void 0) {
      const isMoverMating = (moverSide === "w" && mateScore > 0) || (moverSide === "b" && mateScore < 0);
      if (isMoverMating) {
        return {
          uci: threatUci,
          san: move.san,
          description: `Forces checkmate in ${Math.abs(mateScore)} moves (${move.san})!`
        };
      }
    }

    if (move.promotion) {
      const promoName = PIECE_NAME_MAP[move.promotion.toLowerCase()] || "Queen";
      return {
        uci: threatUci,
        san: move.san,
        description: `Promotes pawn to ${promoName} on ${move.to}!`
      };
    }

    if (move.captured) {
      const victimName = PIECE_NAME_MAP[move.captured.toLowerCase()] || "Piece";
      return {
        uci: threatUci,
        san: move.san,
        description: `Threatens to capture ${victimName} on ${move.to} (${move.san})`
      };
    }

    if (isChessInCheck(chess)) {
      const attackerName = PIECE_NAME_MAP[move.piece.toLowerCase()] || "Piece";
      return {
        uci: threatUci,
        san: move.san,
        description: `Threatens forcing check with ${attackerName} on ${move.to} (${move.san})`
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
        description: `Threatens tactical fork on ${move.to} (${move.san})`
      };
    }

    if (Array.isArray(pvAfter) && pvAfter.length >= 3) {
      const pvChess = new Chess(fen);
      for (let idx = 0; idx < Math.min(pvAfter.length, 4); idx++) {
        const u = pvAfter[idx];
        if (!u || u.length < 4) break;
        const m = pvChess.move({
          from: u.slice(0, 2),
          to: u.slice(2, 4),
          promotion: u.length > 4 ? u[4] : void 0
        });
        if (!m) break;
        if (idx >= 2 && m.color === moverSide && m.captured && ["q", "r", "b", "n"].includes(m.captured)) {
          const wonName = PIECE_NAME_MAP[m.captured.toLowerCase()] || "Piece";
          return {
            uci: threatUci,
            san: move.san,
            description: `Sets up tactical sequence (${move.san}) winning ${wonName} on ${m.to}`
          };
        }
      }
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
        const sf = await stockfishService.evaluate(fen, 12, 400);
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

function summarizePunishment(fenStart, fenEnd, moverColor, classification = "inaccuracy") {
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

    // Positional breakdown when no material is captured in the continuation
    const moverSide = moverColor === "w" ? "white" : "black";
    const oppSide = moverColor === "w" ? "black" : "white";

    if (typeof computePositionalPillars === "function") {
      const pStart = computePositionalPillars(fenStart);
      const pEnd = computePositionalPillars(fenEnd);

      if (pStart && pEnd) {
        const kingSafetyLoss = (pStart.kingSafety?.[moverSide] || 50) - (pEnd.kingSafety?.[moverSide] || 50);
        const oppActivityGain = (pEnd.activity?.[oppSide] || 50) - (pStart.activity?.[oppSide] || 50);
        const moverActivityLoss = (pStart.activity?.[moverSide] || 50) - (pEnd.activity?.[moverSide] || 50);
        const structureLoss = (pStart.pawnStructure?.[moverSide] || 50) - (pEnd.pawnStructure?.[moverSide] || 50);

        if (kingSafetyLoss >= 7) {
          return classification === "inaccuracy"
            ? "Weakens your King shelter, allowing opponent attacking pressure"
            : (classification === "blunder" ? "Decisively exposes your King to an overwhelming assault" : "Compromises King safety, giving opponent dangerous initiative");
        }
        if (structureLoss >= 7) {
          return classification === "inaccuracy"
            ? "Weakens your pawn structure, creating long-term structural targets"
            : (classification === "blunder" ? "Severely shatters your pawn defense, leaving critical weaknesses" : "Compromises pawn structure into chronic targets");
        }
        if (oppActivityGain >= 6 || moverActivityLoss >= 6) {
          return classification === "inaccuracy"
            ? "Concedes central control and active piece mobility to opponent"
            : (classification === "blunder" ? "Allows opponent to dominate the board with complete piece activity" : "Allows opponent to seize dominant piece activity and central control");
        }
      }
    }

    if (classification === "inaccuracy") {
      return "Opponent gains a slight positional edge and freer piece mobility";
    } else if (classification === "mistake") {
      return "Opponent consolidates a clear positional advantage";
    }
    return "Opponent converts into a dominating positional advantage";
  } catch {
    return "Opponent gains a strategic positional advantage";
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
      : summarizePunishment(cur.fen, endFen, cur.color, cur.classification);

    const bestSteps = [
      { ply: 0, fen: cur.fenBefore, from: null, to: null, san: "Start" }
    ];

    let deepBest = [];
    if (isBrilliant && Array.isArray(cur.secondBestPv) && cur.secondBestPv.length > 0) {
      deepBest = replayPv(cur.fenBefore, cur.secondBestPv, 5);
    } else if (isBrilliant && cur.secondBestMoveUci) {
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

const TACTICAL_MOTIF_CATALOG = {
  hanging_piece: {
    id: "hanging_piece",
    label: "Hanging Piece",
    icon: "🎯",
    color: "#ef4444",
    coachTip: "Before every move, scan all your pieces and ask: 'Is anything undefended or attacked by a lower-value piece?'"
  },
  fork: {
    id: "fork",
    label: "Fork / Double Attack",
    icon: "⚔️",
    color: "#f97316",
    coachTip: "Watch for opponent Knights and Queens landing on squares that attack two undefended or high-value pieces at once."
  },
  pin_skewer: {
    id: "pin_skewer",
    label: "Pin / Skewer",
    icon: "📌",
    color: "#a855f7",
    coachTip: "Avoid aligning your King and Queen on the same file, rank, or diagonal as enemy Rooks and Bishops."
  },
  back_rank: {
    id: "back_rank",
    label: "Back-Rank Weakness",
    icon: "🚪",
    color: "#dc2626",
    coachTip: "Create 'luft' (an escape square like h3/g3 or h6/g6) when your King is trapped behind three unmoved pawns."
  },
  king_danger: {
    id: "king_danger",
    label: "King Safety / Check",
    icon: "👑",
    color: "#e11d48",
    coachTip: "Forcing checks restrict your replies and strip your King's shelter—always calculate opponent checks first."
  },
  passed_pawn: {
    id: "passed_pawn",
    label: "Passed Pawn Threat",
    icon: "♟️",
    color: "#10b981",
    coachTip: "Passed pawns on the 6th/7th rank must be blockaded immediately; they often cost a full piece to stop."
  },
  center_king: {
    id: "center_king",
    label: "Uncastled King",
    icon: "🏰",
    color: "#f59e0b",
    coachTip: "Castle early! Leaving your King in the center past move 10 invites devastating central file attacks."
  },
  sacrifice: {
    id: "sacrifice",
    label: "Tactical Sacrifice",
    icon: "💎",
    color: "#06b6d4",
    coachTip: "A sacrifice trades immediate material for a forced mating net, decisive tempo, or winning material back with interest."
  },
  missed_tactic: {
    id: "missed_tactic",
    label: "Missed Tactical Shot",
    icon: "⚡",
    color: "#eab308",
    coachTip: "Use the 'Checks, Captures, Threats' checklist before playing a quiet developing move."
  },
  positional_pressure: {
    id: "positional_pressure",
    label: "Positional Advantage",
    icon: "📐",
    color: "#3b82f6",
    coachTip: "No material hangs immediately—look at piece activity, board control, and strong outpost squares."
  },
  pawn_weakness: {
    id: "pawn_weakness",
    label: "Pawn Structure",
    icon: "♟️",
    color: "#8b5cf6",
    coachTip: "Pawns cannot move backward. Avoid pawn pushes that create undefended holes or isolated targets."
  },
  space_advantage: {
    id: "space_advantage",
    label: "Space & Activity",
    icon: "🌐",
    color: "#0ea5e9",
    coachTip: "Active pieces control key central files and restrict opponent mobility, building long-term pressure."
  }
};

function getSquareAttackMap(board) {
  const attacks = {
    w: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => [])),
    b: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => []))
  };

  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const knightSteps = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const kingSteps = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const side = p.color;
      const type = p.type;
      const val = PIECE_PAWN_UNITS[type] || 0;
      const entry = { type, val, r, c };

      if (type === "p") {
        const dir = side === "w" ? -1 : 1;
        for (const dc of [-1, 1]) {
          if (inBounds(r + dir, c + dc)) {
            attacks[side][r + dir][c + dc].push(entry);
          }
        }
      } else if (type === "n") {
        for (const [dr, dc] of knightSteps) {
          if (inBounds(r + dr, c + dc)) {
            attacks[side][r + dr][c + dc].push(entry);
          }
        }
      } else if (type === "k") {
        for (const [dr, dc] of kingSteps) {
          if (inBounds(r + dr, c + dc)) {
            attacks[side][r + dr][c + dc].push(entry);
          }
        }
      } else {
        const dirs = type === "b" ? diagDirs : (type === "r" ? orthoDirs : [...diagDirs, ...orthoDirs]);
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (inBounds(nr, nc)) {
            attacks[side][nr][nc].push(entry);
            if (board[nr][nc]) break;
            nr += dr;
            nc += dc;
          }
        }
      }
    }
  }
  return attacks;
}

function analyzeBoardVision(fen) {
  const result = {
    squareControl: {},
    pieceStatus: {},
    whiteLooseCount: 0,
    blackLooseCount: 0,
    whiteHangingCount: 0,
    blackHangingCount: 0
  };
  if (!fen) return result;

  try {
    const chess = new Chess(fen);
    const board = chess.board();
    const attacks = getSquareAttackMap(board);
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = `${files[c]}${ranks[r]}`;
        const wAtt = attacks.w[r][c];
        const bAtt = attacks.b[r][c];
        result.squareControl[sq] = {
          whiteAttackers: wAtt.length,
          blackAttackers: bAtt.length,
          net: wAtt.length - bAtt.length
        };

        const p = board[r][c];
        if (!p || p.type === "k") continue;

        const ownAtt = p.color === "w" ? wAtt : bAtt;
        const oppAtt = p.color === "w" ? bAtt : wAtt;
        const pieceVal = PIECE_PAWN_UNITS[p.type] || 1;
        const minOppVal = oppAtt.length > 0 ? Math.min(...oppAtt.map((a) => a.val || 99)) : 99;

        const isHanging = oppAtt.length > 0 && (
          ownAtt.length === 0 ||
          minOppVal < pieceVal ||
          oppAtt.length > ownAtt.length
        );
        const isShelteredRook = p.type === "r" && (
          (p.color === "w" && r === 7 && board[6][c] && board[6][c].color === "w" && board[6][c].type === "p") ||
          (p.color === "b" && r === 0 && board[1][c] && board[1][c].color === "b" && board[1][c].type === "p")
        );
        const isLoose = !isHanging && ownAtt.length === 0 && p.type !== "p" && !isShelteredRook;

        if (isHanging) {
          if (p.color === "w") result.whiteHangingCount++;
          else result.blackHangingCount++;
          result.pieceStatus[sq] = {
            status: "hanging",
            color: p.color,
            type: p.type,
            attackers: oppAtt.length,
            defenders: ownAtt.length,
            label: ownAtt.length === 0
              ? `Undefended ${PIECE_NAME_MAP[p.type]} under attack!`
              : `${PIECE_NAME_MAP[p.type]} attacked by lower-value piece / outnumbered`
          };
        } else if (isLoose) {
          if (p.color === "w") result.whiteLooseCount++;
          else result.blackLooseCount++;
          result.pieceStatus[sq] = {
            status: "loose",
            color: p.color,
            type: p.type,
            attackers: 0,
            defenders: 0,
            label: `Undefended ${PIECE_NAME_MAP[p.type]} (Loose Piece)`
          };
        }
      }
    }
  } catch {}
  return result;
}

function detectRayPinOrSkewer(board, moverColor) {
  const oppColor = moverColor === "w" ? "b" : "w";
  let kingPos = null;
  let queenPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === moverColor) {
        if (p.type === "k") kingPos = [r, c];
        if (p.type === "q") queenPos = [r, c];
      }
    }
  }
  const targets = [kingPos, queenPos].filter(Boolean);
  const dirs = [
    [-1, 0, ["r", "q"]], [1, 0, ["r", "q"]], [0, -1, ["r", "q"]], [0, 1, ["r", "q"]],
    [-1, -1, ["b", "q"]], [-1, 1, ["b", "q"]], [1, -1, ["b", "q"]], [1, 1, ["b", "q"]]
  ];

  for (const [tr, tc] of targets) {
    for (const [dr, dc, sliders] of dirs) {
      let nr = tr + dr;
      let nc = tc + dc;
      let blocker = null;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const sqPiece = board[nr][nc];
        if (sqPiece) {
          if (!blocker) {
            if (sqPiece.color === moverColor && sqPiece.type !== "p") {
              blocker = sqPiece;
            } else {
              break;
            }
          } else {
            if (sqPiece.color === oppColor && sliders.includes(sqPiece.type)) {
              return true;
            }
            break;
          }
        }
        nr += dr;
        nc += dc;
      }
    }
  }
  return false;
}

function detectTacticalMotifs(fenBefore, fenAfter, moveObj, bestMoveUci, pvAfter, mateScore, classification, plyNumber = 1) {
  const motifs = [];
  const addMotif = (id) => {
    if (TACTICAL_MOTIF_CATALOG[id] && !motifs.some((m) => m.id === id)) {
      motifs.push(TACTICAL_MOTIF_CATALOG[id]);
    }
  };

  if (!fenAfter) return motifs;
  const isError = ["inaccuracy", "mistake", "blunder", "missed_win"].includes(classification);
  const isStandout = ["brilliant", "great"].includes(classification);
  if (!isError && !isStandout) return motifs;

  try {
    const chessAfter = new Chess(fenAfter);
    const boardAfter = chessAfter.board();
    const moverColor = moveObj?.color || (chessAfter.turn() === "w" ? "b" : "w");
    const oppColor = moverColor === "w" ? "b" : "w";

    if (classification === "brilliant") {
      addMotif("sacrifice");
    }

    const firstPunishUci = Array.isArray(pvAfter) && pvAfter.length > 0 ? pvAfter[0] : null;
    if (firstPunishUci && firstPunishUci.length >= 4 && isError) {
      const pChess = new Chess(fenAfter);
      const pm = pChess.move({
        from: firstPunishUci.slice(0, 2),
        to: firstPunishUci.slice(2, 4),
        promotion: firstPunishUci.length > 4 ? firstPunishUci[4] : void 0
      });

      if (pm) {
        if (isChessCheckmate(pChess) || (mateScore !== null && mateScore !== void 0)) {
          const destRank = pm.to[1];
          if ((moverColor === "w" && destRank === "1") || (moverColor === "b" && destRank === "8")) {
            addMotif("back_rank");
          } else {
            addMotif("king_danger");
          }
        }

        if (pm.captured && PIECE_PAWN_UNITS[pm.captured] >= 3) {
          addMotif("hanging_piece");
        }

        if (isChessInCheck(pChess)) {
          addMotif("king_danger");
        }

        if (pm.promotion || (pm.piece === "p" && ["2", "7", "1", "8"].includes(pm.to[1]))) {
          addMotif("passed_pawn");
        }

        const nextMoves = pChess.moves({ verbose: true });
        const forkedPieces = nextMoves.filter((m) => m.from === pm.to && m.captured && ["q", "r", "b", "n"].includes(m.captured));
        if (forkedPieces.length >= 2) {
          addMotif("fork");
        }
      }
    }

    if (isError && detectRayPinOrSkewer(boardAfter, moverColor)) {
      addMotif("pin_skewer");
    }

    if (isError && plyNumber >= 22) {
      const kingStartSq = moverColor === "w" ? [7, 4] : [0, 4];
      const kingOnStart = boardAfter[kingStartSq[0]][kingStartSq[1]];
      if (kingOnStart && kingOnStart.type === "k" && kingOnStart.color === moverColor) {
        addMotif("center_king");
      }
    }

    if (classification === "missed_win" || (isError && motifs.length === 0)) {
      if (bestMoveUci && bestMoveUci.length >= 4 && fenBefore) {
        const bChess = new Chess(fenBefore);
        const bm = bChess.move({
          from: bestMoveUci.slice(0, 2),
          to: bestMoveUci.slice(2, 4),
          promotion: bestMoveUci.length > 4 ? bestMoveUci[4] : void 0
        });
        if (bm) {
          const follow = bChess.moves({ verbose: true }).filter((m) => m.from === bm.to && m.captured && ["q", "r", "b", "n"].includes(m.captured));
          if (follow.length >= 2) addMotif("fork");
          else if (bm.captured && PIECE_PAWN_UNITS[bm.captured] >= 3) addMotif("hanging_piece");
          else if (classification === "inaccuracy") addMotif("positional_pressure");
          else addMotif("missed_tactic");
        } else if (classification === "inaccuracy") {
          addMotif("positional_pressure");
        }
      }
    }
  } catch {}

  return motifs.slice(0, 2);
}

function computePositionalPillars(fen) {
  const fallback = {
    material: { white: 50, black: 50, label: "Equal", whiteScore: 0, blackScore: 0 },
    activity: { white: 50, black: 50, label: "Balanced", whiteScore: 0, blackScore: 0 },
    kingSafety: { white: 50, black: 50, label: "Solid", whiteScore: 78, blackScore: 78 },
    pawnStructure: { white: 50, black: 50, label: "Symmetric", whiteScore: 70, blackScore: 70 }
  };
  if (!fen) return fallback;

  try {
    const chess = new Chess(fen);
    const board = chess.board();
    const attacks = getSquareAttackMap(board);

    let wMat = 0, bMat = 0;
    let wBishops = 0, bBishops = 0;
    let wActivity = 0, bActivity = 0;
    let wKingSafety = 70, bKingSafety = 70;
    let wStructure = 70, bStructure = 70;

    const wPawnCols = [0, 0, 0, 0, 0, 0, 0, 0];
    const bPawnCols = [0, 0, 0, 0, 0, 0, 0, 0];
    let wKingPos = [7, 4], bKingPos = [0, 4];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const wA = attacks.w[r][c].length;
        const bA = attacks.b[r][c].length;
        const centerBonus = (r >= 2 && r <= 5 && c >= 2 && c <= 5) ? 1.5 : 1;
        wActivity += wA * centerBonus;
        bActivity += bA * centerBonus;

        const p = board[r][c];
        if (!p) continue;
        const val = PIECE_PAWN_UNITS[p.type] || 0;
        if (p.color === "w") {
          wMat += val;
          if (p.type === "b") wBishops++;
          if (p.type === "p") wPawnCols[c]++;
          if (p.type === "k") wKingPos = [r, c];
        } else {
          bMat += val;
          if (p.type === "b") bBishops++;
          if (p.type === "p") bPawnCols[c]++;
          if (p.type === "k") bKingPos = [r, c];
        }
      }
    }

    if (wBishops >= 2) wMat += 0.5;
    if (bBishops >= 2) bMat += 0.5;

    // King Safety: check enemy attacks around king ring + castled position
    const scoreKingZone = (kr, kc, oppSide, isWhite) => {
      let score = 78;
      if (isWhite && kr === 7 && (kc === 6 || kc === 2)) score += 12;
      if (!isWhite && kr === 0 && (kc === 6 || kc === 2)) score += 12;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = kr + dr, nc = kc + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            score -= attacks[oppSide][nr][nc].length * 9;
          }
        }
      }
      return Math.max(10, Math.min(98, score));
    };
    wKingSafety = scoreKingZone(wKingPos[0], wKingPos[1], "b", true);
    bKingSafety = scoreKingZone(bKingPos[0], bKingPos[1], "w", false);

    // Pawn Structure: doubled & isolated penalties
    for (let c = 0; c < 8; c++) {
      if (wPawnCols[c] > 1) wStructure -= (wPawnCols[c] - 1) * 12;
      if (bPawnCols[c] > 1) bStructure -= (bPawnCols[c] - 1) * 12;
      const wHasNeighbor = (c > 0 && wPawnCols[c - 1] > 0) || (c < 7 && wPawnCols[c + 1] > 0);
      const bHasNeighbor = (c > 0 && bPawnCols[c - 1] > 0) || (c < 7 && bPawnCols[c + 1] > 0);
      if (wPawnCols[c] > 0 && !wHasNeighbor) wStructure -= 8;
      if (bPawnCols[c] > 0 && !bHasNeighbor) bStructure -= 8;
    }
    wStructure = Math.max(15, Math.min(95, wStructure));
    bStructure = Math.max(15, Math.min(95, bStructure));

    const toShare = (w, b, scale = 1) => {
      const diff = (w - b) * scale;
      const wPct = Math.round(Math.max(12, Math.min(88, 50 + diff)));
      return { white: wPct, black: 100 - wPct };
    };

    const matShare = toShare(wMat, bMat, 4.5);
    const actShare = toShare(wActivity, bActivity, 0.85);
    const ksShare = toShare(wKingSafety, bKingSafety, 0.6);
    const psShare = toShare(wStructure, bStructure, 0.65);

    const matDiff = Math.round((wMat - bMat) * 10) / 10;
    const matLabel = Math.abs(matDiff) < 0.4 ? "Equal" : (matDiff > 0 ? `White +${matDiff}` : `Black +${Math.abs(matDiff)}`);
    const actLabel = Math.abs(actShare.white - 50) <= 4 ? "Balanced" : (actShare.white > 50 ? "White Active" : "Black Active");
    const ksLabel = Math.abs(ksShare.white - 50) <= 5 ? "Solid" : (ksShare.white > 50 ? "White Safer" : "Black Safer");
    const psLabel = Math.abs(psShare.white - 50) <= 5 ? "Balanced" : (psShare.white > 50 ? "White Cleaner" : "Black Cleaner");

    return {
      material: { ...matShare, label: matLabel, whiteScore: Math.round(wMat * 10) / 10, blackScore: Math.round(bMat * 10) / 10 },
      activity: { ...actShare, label: actLabel, whiteScore: Math.round(wActivity), blackScore: Math.round(bActivity) },
      kingSafety: { ...ksShare, label: ksLabel, whiteScore: Math.round(wKingSafety), blackScore: Math.round(bKingSafety) },
      pawnStructure: { ...psShare, label: psLabel, whiteScore: Math.round(wStructure), blackScore: Math.round(bStructure) }
    };
  } catch {
    return fallback;
  }
}

