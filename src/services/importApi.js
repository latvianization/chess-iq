function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
var insEscape = escapeHtml;

function parseClockToSeconds(clockStr) {
  const match = clockStr.match(/(\d+):(\d+):?(\d+)?(\.\d+)?/);
  if (!match) return null;
  if (match[3] !== void 0) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseFloat(`${match[3]}${match[4] || ""}`);
    return h * 3600 + m * 60 + s;
  } else {
    const m = parseInt(match[1], 10);
    const s = parseFloat(`${match[2]}${match[4] || ""}`);
    return m * 60 + s;
  }
}
function extractMovesAndClocks(pgn) {
  if (!pgn || typeof pgn !== "string") return { moves: [], clocks: [] };

  // 1. Separate headers from move text: headers are [...] lines before the moves
  let text = pgn.replace(/^\s*\[[^\]]+\]\s*$/gm, " ");

  // 2. Remove variations (...) first
  text = text.replace(/\([^)]*\)/g, " ");

  // 3. Tokenize while tracking moves and clocks
  const moves = [];
  const clocks = [];
  const tokenRegex = /(\{[^}]*\}|[^\s{}]+)/g;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;

    // Check for comment containing [%clk hh:mm:ss]
    if (raw.startsWith("{")) {
      const clkMatch = raw.match(/\[%clk\s+([^\]]+)\]/);
      if (clkMatch) {
        const seconds = parseClockToSeconds(clkMatch[1]);
        if (clocks.length > 0 && clocks[clocks.length - 1] === null) {
          clocks[clocks.length - 1] = seconds;
        }
      }
      continue;
    }

    // Skip game results
    if (["1-0", "0-1", "1/2-1/2", "*"].includes(raw)) continue;

    // Skip standalone move numbers e.g. "1.", "12...", "1..."
    if (/^\d+\.+$/.test(raw)) continue;

    // Clean move token: strip leading move numbers (e.g. "1.e4" -> "e4", "1...e5" -> "e5")
    let moveToken = raw.replace(/^\d+\.+/, "");

    // Remove annotations like ?!, ?, !, !!, !?, and NAGs like $1
    moveToken = moveToken.replace(/[$]\d+/, "").replace(/[?!]+$/, "");

    if (!moveToken) continue;

    // Verify it matches valid chess SAN notation
    if (/^[a-hKQRBNPOo0-9+#=x-]+$/.test(moveToken)) {
      moves.push(moveToken);
      clocks.push(null);
    }
  }

  return { moves, clocks };
}
async function analyzeFullPgn(pgn, userColorTarget, isDeep = true, onProgress) {
  const chess = new Chess();
  try {
    if (typeof chess.loadPgn === "function") {
      chess.loadPgn(pgn);
    } else if (typeof chess.load_pgn === "function") {
      chess.load_pgn(pgn);
    }
  } catch {
  }
  const header = chess.header();
  const customStartFen = header["FEN"] || null;
  const initialFen = customStartFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const white = header["White"] || "White";
  const black = header["Black"] || "Black";
  const whiteElo = parseInt(header["WhiteElo"] || "1500", 10) || 1500;
  const blackElo = parseInt(header["BlackElo"] || "1500", 10) || 1500;
  const resultRaw = header["Result"] || "*";
  const result = ["1-0", "0-1", "1/2-1/2"].includes(resultRaw) ? resultRaw : "*";
  const date = header["Date"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const rawTc = header["TimeControl"] || "";
  const gameType = header["GameType"] || (header["Event"] && header["Event"].toLowerCase().includes("bot") ? "bot" : null);
  const botId = header["BotId"] || null;
  const botName = header["BotName"] || null;
  const botAvatar = header["BotAvatar"] || null;
  const botMatch = typeof detectBotInGame === 'function' ? detectBotInGame(white, black) : null;
  const isBotGame = Boolean(
    gameType === "bot" ||
    botId ||
    botMatch ||
    (header["Event"] && (header["Event"].toLowerCase().includes("bot") || header["Event"].toLowerCase().includes("vs computer"))) ||
    (white && (white.toLowerCase().includes("bot") || white.toLowerCase().includes("computer") || white === "You")) ||
    (black && (black.toLowerCase().includes("bot") || black.toLowerCase().includes("computer") || black === "You"))
  );
  let timeControl = "";
  if (!isBotGame) {
    if (rawTc && rawTc !== "-" && rawTc.toLowerCase() !== "none" && rawTc !== "0") {
      timeControl = rawTc;
    } else if (!rawTc) {
      timeControl = "300+0";
    }
  }
  const { moves: parsedMoves, clocks } = extractMovesAndClocks(pgn);
  let moveHistory = chess.history({ verbose: true });
  if (moveHistory.length === 0 && parsedMoves.length > 0) {
    const fallbackChess = customStartFen ? new Chess(customStartFen) : new Chess();
    for (const san of parsedMoves) {
      try {
        fallbackChess.move(san);
      } catch {}
    }
    moveHistory = fallbackChess.history({ verbose: true });
  }
  const moveSans = moveHistory.length > 0 ? moveHistory.map((m) => m.san) : parsedMoves;
  const userColor = userColorTarget || "w";
  const userBaseElo = userColor === "w" ? whiteElo : blackElo;
  const ecoMatch = customStartFen ? { eco: "FEN", name: "Custom Position", bookLength: 0 } : findMatchingEco(moveSans);
  const ecoCode = header["ECO"] || ecoMatch.eco;
  const ecoName = ecoMatch.name;
  const replayChess = customStartFen ? new Chess(customStartFen) : new Chess();
  const precomputed = [];
  let middlegameStartPly = null;
  let endgameStartPly = null;
  let lastWhiteClock = null;
  let lastBlackClock = null;
  let bookCount = 0;
  let openingDeviation = null;
  for (let i = 0; i < moveHistory.length; i++) {
    const moveObj = moveHistory[i];
    const fenBefore = replayChess.fen();
    const side = replayChess.turn();
    const plyNum = i + 1;
    const isBook = !customStartFen && isBookMove(moveSans, i);
    if (isBook) {
      bookCount++;
    } else if (!customStartFen && !openingDeviation && (i === 0 || precomputed[i - 1].isBook)) {
      const bookMoves = typeof getBookContinuations === "function" ? getBookContinuations(moveSans, i) : [];
      if (bookMoves.length > 0) {
        openingDeviation = {
          ply: plyNum,
          san: moveObj.san,
          color: side,
          bookMoves
        };
      }
    }
    const phaseInfo = detectPhase(plyNum, replayChess, isBook, middlegameStartPly, endgameStartPly);
    if (phaseInfo.newMiddlegameStart && !middlegameStartPly) middlegameStartPly = phaseInfo.newMiddlegameStart;
    if (phaseInfo.newEndgameStart && !endgameStartPly) endgameStartPly = phaseInfo.newEndgameStart;
    const rawClock = clocks[i] ?? null;
    let timeSpent = null;
    if (rawClock !== null) {
      if (side === "w") {
        if (lastWhiteClock !== null) timeSpent = Math.max(0.1, lastWhiteClock - rawClock);
        lastWhiteClock = rawClock;
      } else {
        if (lastBlackClock !== null) timeSpent = Math.max(0.1, lastBlackClock - rawClock);
        lastBlackClock = rawClock;
      }
    }
    const isTimeTrouble = rawClock !== null && rawClock < 20;
    replayChess.move(moveObj);
    const fenAfter = replayChess.fen();
    precomputed.push({
      plyNum,
      moveObj,
      fenBefore,
      fenAfter,
      side,
      isBook,
      rawClock,
      timeSpent,
      isTimeTrouble,
      phase: phaseInfo.phase
    });
  }
  const totalPlies = precomputed.length;
  const plies = new Array(totalPlies);
  const analysisStart = Date.now();
  console.log(`[Analysis] Starting: ${white} (${whiteElo}) vs ${black} (${blackElo}) | ${totalPlies} plies | userColor: ${userColor} | deep: ${isDeep}`);

  if (onProgress) {
    const p = onProgress(0, totalPlies);
    if (p && typeof p.then === 'function') await p;
    else await new Promise((resolve) => setTimeout(resolve, 35));
  }

  const fensToEvaluate = [];
  if (totalPlies > 0 && !precomputed[0].isBook) fensToEvaluate.push(precomputed[0].fenBefore);
  precomputed.forEach((item, idx) => {
    const nextIsEngineMove = idx + 1 < totalPlies && !precomputed[idx + 1].isBook;
    if (!item.isBook || nextIsEngineMove) fensToEvaluate.push(item.fenAfter);
  });
  console.log(`[Analysis] Pass 1: Evaluating ${fensToEvaluate.length} positions (${bookCount} book moves skipped)`);
  const hasPrefetch = fensToEvaluate.length > 0;
  let lastReportedPly = 0;
  const reportScaledProgress = async (fraction) => {
    if (!onProgress || totalPlies <= 0) return;
    const plyTarget = Math.max(1, Math.min(totalPlies, Math.round(fraction * totalPlies)));
    if (plyTarget > lastReportedPly) {
      lastReportedPly = plyTarget;
      const p = onProgress(lastReportedPly, totalPlies);
      if (p && typeof p.then === "function") await p;
    }
  };

  if (hasPrefetch) {
    await prefetchEvaluations(fensToEvaluate, isDeep, async (done, total) => {
      await reportScaledProgress((done / total) * 0.85);
    });
  }

  // Pass 2: Identify top critical moments (blunders/mistakes/sacrifices) and verify at ultra depth
  if (isDeep && totalPlies > 0 && stockfishService && stockfishService.isEngineReady()) {
    const criticalCandidates = [];
    for (let i = 0; i < totalPlies; i++) {
      const item = precomputed[i];
      if (item.isBook) continue;
      const eb = await evaluateFenHybrid(item.fenBefore, isDeep);
      const ea = await evaluateFenHybrid(item.fenAfter, isDeep);
      const wBefore = cpToWinProb(eb.scoreCp, eb.mate);
      const wAfter = cpToWinProb(ea.scoreCp, ea.mate);
      const mBefore = item.side === "w" ? wBefore : 1 - wBefore;
      const mAfter = item.side === "w" ? wAfter : 1 - wAfter;
      const loss = Math.max(0, mBefore - mAfter);
      const playedUciCheck = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const bestUciCheck = (eb.pv && eb.pv[0]) || eb.bestMoveUci || "";
      const isSacCandidate = playedUciCheck.toLowerCase() === bestUciCheck.toLowerCase() &&
        isMaterialSacrifice(item.fenBefore, item.fenAfter, item.side, (ea.pv && ea.pv[0]) || ea.bestMoveUci || "");

      if (loss >= 0.14 || isSacCandidate) {
        criticalCandidates.push({ loss: isSacCandidate ? 1.0 : loss, fenBefore: item.fenBefore, fenAfter: item.fenAfter });
      }
    }

    criticalCandidates.sort((a, b) => b.loss - a.loss);
    const criticalFens = [];
    for (const cand of criticalCandidates.slice(0, 4)) {
      criticalFens.push(cand.fenBefore, cand.fenAfter);
    }

    const uniqueCritical = [...new Set(criticalFens)];
    if (uniqueCritical.length > 0) {
      console.log(`[Analysis] Pass 2: Ultra-deep verification on ${uniqueCritical.length} critical positions`);
      await prefetchEvaluations(uniqueCritical, "ultra", async (done, total) => {
        await reportScaledProgress(0.85 + (done / total) * 0.14);
      });
    }
  }

  let prevEngine = precomputed.length > 0 && !precomputed[0].isBook
    ? await evaluateFenHybrid(precomputed[0].fenBefore, isDeep)
    : { scoreCp: 20, mate: null, pv: [] };

  const sanHelperChess = new Chess();
  const uciToSanOnLoadedBoard = (uci) => {
    if (!uci || uci.length < 4) return "";
    try {
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : void 0;
      const m = sanHelperChess.move({ from, to, promotion });
      if (m) {
        sanHelperChess.undo();
        return m.san;
      }
    } catch {}
    return uci;
  };

  for (let i = 0; i < totalPlies; i++) {
    const item = precomputed[i];
    const forcedMove = typeof isForcedMove === "function" ? isForcedMove(item.fenBefore) : false;
    if (item.isBook) {
      const playedUci2 = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const isImpulsive2 = item.timeSpent !== null && item.timeSpent < 2 && !item.isTimeTrouble;
      const bookStatic = typeof evaluatePositionLocally === "function" ? evaluatePositionLocally(item.fenAfter) : { cp: 20, mate: null };
      const bookScoreCp = Math.max(-60, Math.min(60, bookStatic.cp || 20));
      const bookWinProb = cpToWinProb(bookScoreCp, null);
      const prevBookWinProb = prevEngine ? cpToWinProb(prevEngine.scoreCp ?? 20, null) : 0.52;
      plies[i] = {
        ply: item.plyNum,
        san: item.moveObj.san,
        uci: playedUci2,
        from: item.moveObj.from,
        to: item.moveObj.to,
        piece: item.moveObj.piece,
        captured: item.moveObj.captured,
        color: item.side,
        fen: item.fenAfter,
        fenBefore: item.fenBefore,
        isForced: forcedMove,
        clock: item.rawClock,
        clockSeconds: item.clockSeconds,
        timeSpent: item.timeSpent,
        isTimeTrouble: item.isTimeTrouble,
        isImpulsive: isImpulsive2,
        scoreBefore: prevEngine?.scoreCp ?? 20,
        scoreAfter: bookScoreCp,
        scoreCp: bookScoreCp,
        mate: null,
        winProb: bookWinProb,
        winProbBefore: prevBookWinProb,
        moverWinProbBefore: item.side === "w" ? prevBookWinProb : 1 - prevBookWinProb,
        moverWinProbAfter: item.side === "w" ? bookWinProb : 1 - bookWinProb,
        winProbLoss: 0,
        accuracy: 100,
        classification: forcedMove ? "forced" : "book",
        bestMoveUci: playedUci2,
        bestMoveSan: item.moveObj.san,
        secondBestMoveUci: "",
        secondBestMoveSan: "",
        pv: [playedUci2],
        threat: null,
        explanation: null,
        motifs: [],
        phase: item.phase
      };
      prevEngine = { scoreCp: bookScoreCp, mate: null, pv: [playedUci2] };
    } else {
      let engineBefore = prevEngine;
      if (!engineBefore || !engineBefore.bestMoveUci || (i > 0 && precomputed[i - 1].isBook)) {
        engineBefore = await evaluateFenHybrid(item.fenBefore, isDeep);
      }
      const engineAfter = await evaluateFenHybrid(item.fenAfter, isDeep);
      prevEngine = engineAfter;

      const whiteScoreBefore = engineBefore.scoreCp;
      const whiteWinProbBefore = cpToWinProb(whiteScoreBefore, engineBefore.mate);
      const whiteScoreAfter = engineAfter.scoreCp;
      const whiteWinProbAfter = cpToWinProb(whiteScoreAfter, engineAfter.mate);
      const moverWinProbBefore = item.side === "w" ? whiteWinProbBefore : 1 - whiteWinProbBefore;
      const moverWinProbAfter = item.side === "w" ? whiteWinProbAfter : 1 - whiteWinProbAfter;

      const isValidUciMove = (u) => typeof u === "string" && u.length >= 4 && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(u);
      const rawBest = (engineBefore.pv && engineBefore.pv[0]) || engineBefore.bestMoveUci || "";
      const bestMoveUci = isValidUciMove(rawBest) ? rawBest : "";
      const rawSecond = engineBefore.secondBestMoveUci || "";
      const secondBestMoveUci = isValidUciMove(rawSecond) ? rawSecond : "";
      const playedUci = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const isExactBest = forcedMove || Boolean(bestMoveUci && playedUci && playedUci.toLowerCase() === bestMoveUci.toLowerCase());

      const rawWinProbLoss = Math.max(0, moverWinProbBefore - moverWinProbAfter);
      const winProbLoss = isExactBest ? 0 : rawWinProbLoss;
      const accuracy = isExactBest ? 100 : calculateMoveAccuracy(winProbLoss);

      let bestMoveSan = "";
      let secondBestMoveSan = "";
      if (bestMoveUci || (secondBestMoveUci && secondBestMoveUci !== bestMoveUci)) {
        try {
          sanHelperChess.load(item.fenBefore);
          if (bestMoveUci) bestMoveSan = uciToSanOnLoadedBoard(bestMoveUci);
          if (secondBestMoveUci && secondBestMoveUci !== bestMoveUci) {
            secondBestMoveSan = uciToSanOnLoadedBoard(secondBestMoveUci);
          }
        } catch {
          bestMoveSan = bestMoveUci;
          secondBestMoveSan = secondBestMoveUci !== bestMoveUci ? secondBestMoveUci : "";
        }
      }

      const oppBestUci = (engineAfter.pv && engineAfter.pv[0]) || engineAfter.bestMoveUci || "";
      const multiPv2WinProb = engineBefore.multiPv2ScoreCp !== void 0 ? cpToWinProb(engineBefore.multiPv2ScoreCp) : void 0;
      const moverMultiPv2WinProb = multiPv2WinProb !== void 0
        ? (item.side === "w" ? multiPv2WinProb : 1 - multiPv2WinProb)
        : void 0;

      const classification = forcedMove ? "forced" : classifyMove(
        playedUci,
        bestMoveUci,
        moverWinProbBefore,
        moverWinProbAfter,
        winProbLoss,
        item.isBook,
        moverWinProbBefore,
        moverMultiPv2WinProb,
        item.fenBefore,
        item.fenAfter,
        item.side,
        oppBestUci
      );

      const isImpulsive = item.timeSpent !== null && item.timeSpent < 2 && (classification === "blunder" || classification === "mistake") && !item.isTimeTrouble;
      let threat = null;
      let explanation = null;
      if (classification === "blunder" || classification === "mistake" || classification === "missed_win" || winProbLoss > 0.12) {
        threat = detectThreat(item.fenAfter, oppBestUci, engineAfter.mate, engineAfter.pv);
      }
      if (classification === "blunder" || classification === "mistake" || classification === "inaccuracy" || classification === "missed_win" || classification === "brilliant") {
        explanation = prepareMoveExplanation({
          fen: item.fenAfter,
          fenBefore: item.fenBefore,
          from: item.moveObj.from,
          to: item.moveObj.to,
          san: item.moveObj.san,
          color: item.side,
          bestMoveUci,
          bestMoveSan: bestMoveSan || item.moveObj.san,
          secondBestMoveUci,
          secondBestMoveSan,
          secondBestPv: engineBefore.secondBestPv || [],
          punishmentPv: engineAfter.pv,
          bestPv: engineBefore.pv,
          winProbBefore: moverWinProbBefore,
          winProbAfter: moverWinProbAfter,
          scoreBefore: whiteScoreBefore,
          scoreAfter: whiteScoreAfter,
          classification
        });
      }
      let motifs = [];
      try {
        if (typeof detectTacticalMotifs === "function") {
          motifs = detectTacticalMotifs(
            item.fenBefore,
            item.fenAfter,
            item.moveObj,
            bestMoveUci,
            engineAfter.pv,
            engineAfter.mate,
            classification,
            item.plyNum
          );
        }
      } catch {}

      plies[i] = {
        ply: item.plyNum,
        san: item.moveObj.san,
        uci: playedUci,
        from: item.moveObj.from,
        to: item.moveObj.to,
        piece: item.moveObj.piece,
        captured: item.moveObj.captured,
        color: item.side,
        fen: item.fenAfter,
        fenBefore: item.fenBefore,
        isForced: forcedMove,
        clock: item.rawClock,
        clockSeconds: item.clockSeconds,
        timeSpent: item.timeSpent,
        isTimeTrouble: item.isTimeTrouble,
        isImpulsive,
        scoreBefore: whiteScoreBefore,
        scoreAfter: whiteScoreAfter,
        scoreCp: whiteScoreAfter,
        mate: engineAfter.mate,
        winProb: whiteWinProbAfter,
        winProbBefore: whiteWinProbBefore,
        moverWinProbBefore,
        moverWinProbAfter,
        winProbLoss,
        accuracy,
        classification,
        bestMoveUci,
        bestMoveSan: bestMoveSan || item.moveObj.san,
        secondBestMoveUci,
        secondBestMoveSan,
        pv: engineBefore.pv,
        depth: engineAfter.depth || engineBefore.depth || 14,
        threat,
        explanation,
        motifs,
        phase: item.phase
      };
    }
  }

  if (onProgress && lastReportedPly < totalPlies) {
    const pRes = onProgress(totalPlies, totalPlies);
    if (pRes && typeof pRes.then === "function") await pRes;
  }
  const createEmptyCounts = () => ({
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    forced: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missed_win: 0
  });
  const userCounts = createEmptyCounts();
  const opponentCounts = createEmptyCounts();
  let userAccuracySum = 0;
  let userMovesCount = 0;
  let oppAccuracySum = 0;
  let oppMovesCount = 0;
  let impulsiveBlunders = 0;
  let timeTroubleBlunders = 0;
  const userPhaseAcc = {
    opening: [],
    middlegame: [],
    endgame: []
  };
  const oppPhaseAcc = {
    opening: [],
    middlegame: [],
    endgame: []
  };
  let turningPoint = null;
  let brightestMove = null;
  const userMotifCounts = {};

  plies.forEach((p) => {
    if (!p) return;
    const prevWhiteWp = p.winProbBefore ?? 0.5;
    const currWhiteWp = p.winProb ?? 0.5;
    const wpSwing = Math.abs(currWhiteWp - prevWhiteWp);
    if (wpSwing >= 0.15 && (!turningPoint || wpSwing > turningPoint.swing)) {
      turningPoint = {
        ply: p.ply,
        san: p.san,
        color: p.color,
        isUserMove: p.color === userColor,
        swing: wpSwing,
        swingPct: Math.round(wpSwing * 100),
        prevWinProb: prevWhiteWp,
        winProb: currWhiteWp,
        winProbBefore: p.moverWinProbBefore ?? p.winProbBefore,
        winProbAfter: p.moverWinProbAfter ?? p.winProb,
        winProbLoss: p.winProbLoss,
        classification: p.classification,
        bestMoveSan: p.bestMoveSan
      };
    }
    if (p.color === userColor) {
      userCounts[p.classification] = (userCounts[p.classification] || 0) + 1;
      userAccuracySum += p.accuracy;
      userMovesCount++;
      if (p.isImpulsive) impulsiveBlunders++;
      if (p.isTimeTrouble && (p.classification === "blunder" || p.classification === "mistake")) {
        timeTroubleBlunders++;
      }
      if (userPhaseAcc[p.phase]) userPhaseAcc[p.phase].push(p.accuracy);

      if (["inaccuracy", "mistake", "blunder", "missed_win"].includes(p.classification) && Array.isArray(p.motifs)) {
        p.motifs.forEach((m) => {
          if (m && m.id) userMotifCounts[m.id] = (userMotifCounts[m.id] || 0) + 1;
        });
      }

      if (["brilliant", "great", "best"].includes(p.classification) && p.ply > 8) {
        const score = (p.classification === "brilliant" ? 200 : p.classification === "great" ? 150 : 100) + (p.accuracy || 0);
        if (!brightestMove || score > brightestMove.rankScore) {
          brightestMove = {
            ply: p.ply,
            san: p.san,
            classification: p.classification,
            phase: p.phase,
            rankScore: score
          };
        }
      }
    } else {
      opponentCounts[p.classification] = (opponentCounts[p.classification] || 0) + 1;
      oppAccuracySum += p.accuracy;
      oppMovesCount++;
      if (oppPhaseAcc[p.phase]) oppPhaseAcc[p.phase].push(p.accuracy);
    }
  });
  const userAccuracy = userMovesCount > 0 ? Math.round(userAccuracySum / userMovesCount * 10) / 10 : 85;
  const opponentAccuracy = oppMovesCount > 0 ? Math.round(oppAccuracySum / oppMovesCount * 10) / 10 : 85;
  const overallAccuracy = Math.round((userAccuracy + opponentAccuracy) / 2 * 10) / 10;
  const calcAvgAcc = (arr) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

  const userPhaseAccuracy = {
    opening: calcAvgAcc(userPhaseAcc.opening),
    middlegame: calcAvgAcc(userPhaseAcc.middlegame),
    endgame: calcAvgAcc(userPhaseAcc.endgame)
  };
  const opponentPhaseAccuracy = {
    opening: calcAvgAcc(oppPhaseAcc.opening),
    middlegame: calcAvgAcc(oppPhaseAcc.middlegame),
    endgame: calcAvgAcc(oppPhaseAcc.endgame)
  };

  const oppColor = userColor === "w" ? "b" : "w";
  const oppBaseElo = userColor === "w" ? blackElo : whiteElo;

  const overallGameElo = calculatePerformanceElo(userBaseElo, userAccuracy, userMovesCount, result, userColor) ?? userBaseElo;
  const oppOverallGameElo = calculatePerformanceElo(oppBaseElo, opponentAccuracy, oppMovesCount, result, oppColor) ?? oppBaseElo;

  const openingElo = calculatePerformanceElo(userBaseElo, userPhaseAccuracy.opening ?? userAccuracy, userPhaseAcc.opening.length, "*", userColor) ?? userBaseElo;
  const middlegameElo = calculatePerformanceElo(userBaseElo, userPhaseAccuracy.middlegame ?? userAccuracy, userPhaseAcc.middlegame.length, "*", userColor) ?? userBaseElo;
  const endgameElo = calculatePerformanceElo(userBaseElo, userPhaseAccuracy.endgame ?? userAccuracy, userPhaseAcc.endgame.length, "*", userColor) ?? userBaseElo;

  const oppOpeningElo = calculatePerformanceElo(oppBaseElo, opponentPhaseAccuracy.opening ?? opponentAccuracy, oppPhaseAcc.opening.length, "*", oppColor) ?? oppBaseElo;
  const oppMiddlegameElo = calculatePerformanceElo(oppBaseElo, opponentPhaseAccuracy.middlegame ?? opponentAccuracy, oppPhaseAcc.middlegame.length, "*", oppColor) ?? oppBaseElo;
  const oppEndgameElo = calculatePerformanceElo(oppBaseElo, opponentPhaseAccuracy.endgame ?? opponentAccuracy, oppPhaseAcc.endgame.length, "*", oppColor) ?? oppBaseElo;

  // Build Coach's Study Plan Summary
  let topMotifId = null;
  let topMotifCount = 0;
  Object.entries(userMotifCounts).forEach(([id, cnt]) => {
    if (cnt > topMotifCount) {
      topMotifId = id;
      topMotifCount = cnt;
    }
  });

  let weakestPhase = "middlegame";
  let lowestPhaseAcc = 101;
  ["opening", "middlegame", "endgame"].forEach((ph) => {
    const val = userPhaseAccuracy[ph];
    if (val !== null && val !== undefined && val < lowestPhaseAcc) {
      lowestPhaseAcc = val;
      weakestPhase = ph;
    }
  });

  const gameCoachSummary = {
    topMotifId,
    topMotifCount,
    userMotifCounts,
    weakestPhase,
    weakestPhaseAcc: lowestPhaseAcc <= 100 ? lowestPhaseAcc : userAccuracy,
    impulsiveBlunders,
    timeTroubleBlunders,
    brightestMove,
    practicePly: turningPoint?.ply || endgameStartPly || middlegameStartPly || 1
  };

  const analyzedResult = {
    id: `game_${Date.now()}`,
    platform: "pgn",
    pgn,
    white,
    black,
    whiteElo,
    blackElo,
    userColor,
    result,
    date,
    timeControl: isBotGame ? "" : timeControl,
    ecoCode,
    ecoName,
    initialFen,
    plies,
    openingDeviation,
    turningPoint,
    gameCoachSummary,
    overallAccuracy,
    userAccuracy,
    opponentAccuracy,
    userPhaseAccuracy,
    opponentPhaseAccuracy,
    overallGameElo,
    oppGameElo: oppOverallGameElo,
    userPhaseElos: {
      opening: openingElo,
      middlegame: middlegameElo,
      endgame: endgameElo
    },
    opponentPhaseElos: {
      opening: oppOpeningElo,
      middlegame: oppMiddlegameElo,
      endgame: oppEndgameElo
    },
    middlegameStartPly: middlegameStartPly ?? 20,
    endgameStartPly: endgameStartPly ?? 50,
    userCounts,
    opponentCounts,
    impulsiveBlunders,
    timeTroubleBlunders,
    isBotGame,
    botId: botId || (botMatch ? botMatch.id : null),
    botName: botName || (botMatch ? botMatch.name : (isBotGame ? (white.toLowerCase().includes('bot') ? white : black) : null)),
    botAvatar: botAvatar || (botMatch ? botMatch.avatar : (isBotGame ? '🤖' : null))
  };

  if (typeof syncGameToBlunderBank === "function") {
    try { syncGameToBlunderBank(analyzedResult); } catch {}
  }

  const totalDuration = Date.now() - analysisStart;
  console.log(`[Analysis] Finished in ${totalDuration}ms: User accuracy ${userAccuracy}%, Opponent ${opponentAccuracy}%, Performance ${overallGameElo} Elo`);
  return analyzedResult;
}
const CHESSCOM_DRAW_RESULTS = ["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"];

function mapChessComGame(g, idx) {
  const whiteName = g.white?.username || "White";
  const blackName = g.black?.username || "Black";
  let res = "*";
  if (g.white?.result === "win") res = "1-0";
  else if (g.black?.result === "win") res = "0-1";
  else if (CHESSCOM_DRAW_RESULTS.includes(g.white?.result)) res = "1/2-1/2";

  const botMatch = typeof detectBotInGame === 'function' ? detectBotInGame(whiteName, blackName) : null;
  const isBotGame = Boolean(
    botMatch ||
    (whiteName && (whiteName.toLowerCase().includes("bot") || whiteName.toLowerCase().includes("computer"))) ||
    (blackName && (blackName.toLowerCase().includes("bot") || blackName.toLowerCase().includes("computer"))) ||
    (g.pgn && (g.pgn.includes('[GameType "bot"]') || g.pgn.toLowerCase().includes("vs computer"))) ||
    (g.url && g.url.includes("/computer/"))
  );

  let tc = "";
  if (!isBotGame) {
    if (g.time_control && g.time_control !== "-" && g.time_control !== "none" && g.time_control !== "0") {
      tc = g.time_control;
    } else if (g.time_class && g.time_class !== "unrated") {
      tc = g.time_class.charAt(0).toUpperCase() + g.time_class.slice(1);
    }
  }

  return {
    id: `chesscom_${g.url ? g.url.split("/").pop() : idx}`,
    platform: "chesscom",
    white: whiteName,
    black: blackName,
    whiteElo: g.white?.rating || 1500,
    blackElo: g.black?.rating || 1500,
    result: res,
    date: g.end_time ? new Date(g.end_time * 1e3).toISOString().split("T")[0] : "Recent",
    endTime: g.end_time ? g.end_time * 1e3 : 0,
    timeControl: tc,
    eco: g.eco || "C50",
    pgn: g.pgn || "",
    isBotGame,
    botId: botMatch ? botMatch.id : null,
    botName: botMatch ? botMatch.name : (isBotGame ? (whiteName.toLowerCase().includes('bot') ? whiteName : blackName) : null),
    botAvatar: botMatch ? botMatch.avatar : (isBotGame ? '🤖' : null)
  };
}

async function fetchChessComGames(username, limit = 15) {
  const cleanUsername = username.trim().toLowerCase();
  const archivesUrl = `https://api.chess.com/pub/player/${cleanUsername}/games/archives`;
  const archRes = await fetch(archivesUrl);
  if (!archRes.ok) {
    if (archRes.status === 404) {
      throw new Error(`Chess.com user '${username}' not found.`);
    }
    throw new Error(`Failed to fetch Chess.com player data (HTTP ${archRes.status}).`);
  }
  const archData = await archRes.json();
  const archives = archData.archives || [];
  const collected = [];
  for (let i = archives.length - 1; i >= 0 && collected.length < limit; i--) {
    const gamesRes = await fetch(archives[i]);
    if (!gamesRes.ok) {
      if (collected.length === 0) throw new Error("Failed to fetch monthly games from Chess.com");
      break;
    }
    const monthData = await gamesRes.json();
    const standardGames = (monthData.games || []).filter((g) => g.rules === "chess" && g.pgn);
    collected.push(...standardGames.reverse());
  }
  return collected.slice(0, limit).map(mapChessComGame);
}
