import { Chess } from "chess.js";
import {
  calculateMoveAccuracy,
  calculatePhaseElo,
  classifyMove,
  cpToWinProb,
  detectPhase,
  detectThreat,
  evaluateFenHybrid
} from "./engine";
import { findMatchingEco, isBookMove } from "./ecoDictionary";
export function parseClockToSeconds(clockStr) {
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
export function extractMovesAndClocks(pgn) {
  const moveText = pgn.replace(/\[[^\]]*\]/g, " ").trim();
  const moves = [];
  const clocks = [];
  const tokens = moveText.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    if (/^\d+\.+$/.test(token) || ["1-0", "0-1", "1/2-1/2", "*"].includes(token)) {
      continue;
    }
    if (token.includes("[%clk")) {
      let comment = token;
      while (!comment.includes("]") && i + 1 < tokens.length) {
        i++;
        comment += " " + tokens[i];
      }
      const clkMatch = comment.match(/\[%clk\s+([^\]]+)\]/);
      if (clkMatch) {
        const clk = parseClockToSeconds(clkMatch[1]);
        if (clocks.length > 0 && clocks[clocks.length - 1] === null) {
          clocks[clocks.length - 1] = clk;
        }
      }
      continue;
    }
    if (/^[a-hKQRBNPOo0-9+#=x-]+$/.test(token)) {
      moves.push(token);
      clocks.push(null);
    }
  }
  return { moves, clocks };
}
export async function analyzeFullPgn(pgn, userColorTarget, isDeep = false, onProgress) {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
  }
  const header = chess.header();
  const white = header["White"] || "White";
  const black = header["Black"] || "Black";
  const whiteElo = parseInt(header["WhiteElo"] || "1500", 10) || 1500;
  const blackElo = parseInt(header["BlackElo"] || "1500", 10) || 1500;
  const resultRaw = header["Result"] || "*";
  const result = ["1-0", "0-1", "1/2-1/2"].includes(resultRaw) ? resultRaw : "*";
  const date = header["Date"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const timeControl = header["TimeControl"] || "300+0";
  const { moves: parsedMoves, clocks } = extractMovesAndClocks(pgn);
  let moveHistory = chess.history({ verbose: true });
  if (moveHistory.length === 0 && parsedMoves.length > 0) {
    const fallbackChess = new Chess();
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
  const ecoMatch = findMatchingEco(moveSans);
  const ecoCode = header["ECO"] || ecoMatch.eco;
  const ecoName = ecoMatch.name;
  const replayChess = new Chess();
  const precomputed = [];
  let middlegameStartPly = null;
  let endgameStartPly = null;
  let lastWhiteClock = null;
  let lastBlackClock = null;
  for (let i = 0; i < moveHistory.length; i++) {
    const moveObj = moveHistory[i];
    const fenBefore = replayChess.fen();
    const side = replayChess.turn();
    const plyNum = i + 1;
    const phaseInfo = detectPhase(plyNum, replayChess, moveSans, middlegameStartPly, endgameStartPly);
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
    const isBook = isBookMove(moveSans, i);
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

  if (onProgress) {
    onProgress(0, totalPlies);
    await new Promise((resolve) => setTimeout(resolve, 35));
  }

  let prevEngine = precomputed.length > 0
    ? await evaluateFenHybrid(precomputed[0].fenBefore, isDeep)
    : { scoreCp: 20, mate: null, pv: [] };

  for (let i = 0; i < totalPlies; i++) {
    const item = precomputed[i];
    if (item.isBook) {
      const playedUci2 = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const isImpulsive2 = item.timeSpent !== null && item.timeSpent < 2 && !item.isTimeTrouble;
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
        clock: item.rawClock,
        timeSpent: item.timeSpent,
        isTimeTrouble: item.isTimeTrouble,
        isImpulsive: isImpulsive2,
        scoreCp: 20,
        mate: null,
        winProb: 0.52,
        winProbBefore: 0.5,
        winProbLoss: 0,
        accuracy: 100,
        classification: "book",
        bestMoveUci: playedUci2,
        bestMoveSan: item.moveObj.san,
        secondBestMoveUci: "",
        secondBestMoveSan: "",
        pv: [playedUci2],
        threat: null,
        phase: item.phase
      };
      prevEngine = { scoreCp: 20, mate: null, pv: [playedUci2] };
    } else {
      const engineBefore = prevEngine;
      const engineAfter = await evaluateFenHybrid(item.fenAfter, isDeep);
      prevEngine = engineAfter;

      const whiteScoreBefore = engineBefore.scoreCp;
      const whiteWinProbBefore = cpToWinProb(whiteScoreBefore, engineBefore.mate);
      const whiteScoreAfter = engineAfter.scoreCp;
      const whiteWinProbAfter = cpToWinProb(whiteScoreAfter, engineAfter.mate);
      const moverWinProbBefore = item.side === "w" ? whiteWinProbBefore : 1 - whiteWinProbBefore;
      const moverWinProbAfter = item.side === "w" ? whiteWinProbAfter : 1 - whiteWinProbAfter;
      const winProbLoss = Math.max(0, moverWinProbBefore - moverWinProbAfter);
      const accuracy = calculateMoveAccuracy(winProbLoss);
      const bestMoveUci = engineBefore.pv && engineBefore.pv[0] ? engineBefore.pv[0] : "";
      let bestMoveSan = "";
      if (bestMoveUci) {
        try {
          const testChess = new Chess(item.fenBefore);
          const from = bestMoveUci.slice(0, 2);
          const to = bestMoveUci.slice(2, 4);
          const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : void 0;
          const m = testChess.move({ from, to, promotion });
          if (m) bestMoveSan = m.san;
        } catch {
          bestMoveSan = bestMoveUci;
        }
      }
      const secondBestMoveUci = engineBefore.secondBestMoveUci || "";
      let secondBestMoveSan = "";
      if (secondBestMoveUci && secondBestMoveUci !== bestMoveUci) {
        try {
          const testChess2 = new Chess(item.fenBefore);
          const from = secondBestMoveUci.slice(0, 2);
          const to = secondBestMoveUci.slice(2, 4);
          const promotion = secondBestMoveUci.length > 4 ? secondBestMoveUci[4] : void 0;
          const m2 = testChess2.move({ from, to, promotion });
          if (m2) secondBestMoveSan = m2.san;
        } catch {
          secondBestMoveSan = secondBestMoveUci;
        }
      }
      const playedUci = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const multiPv2WinProb = engineBefore.multiPv2ScoreCp !== void 0 ? cpToWinProb(engineBefore.multiPv2ScoreCp) : void 0;
      const classification = classifyMove(
        playedUci,
        bestMoveUci,
        moverWinProbBefore,
        moverWinProbAfter,
        winProbLoss,
        false,
        moverWinProbBefore,
        multiPv2WinProb,
        item.fenBefore,
        item.fenAfter,
        item.side
      );
      const isImpulsive = item.timeSpent !== null && item.timeSpent < 2 && (classification === "blunder" || classification === "mistake") && !item.isTimeTrouble;
      let threat = null;
      if (classification === "blunder" || classification === "mistake" || classification === "inaccuracy" || winProbLoss > 0.03) {
        threat = await detectThreat(item.fenAfter);
      }
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
        clock: item.rawClock,
        timeSpent: item.timeSpent,
        isTimeTrouble: item.isTimeTrouble,
        isImpulsive,
        scoreCp: whiteScoreAfter,
        mate: engineAfter.mate,
        winProb: whiteWinProbAfter,
        winProbBefore: whiteWinProbBefore,
        winProbLoss,
        accuracy,
        classification,
        bestMoveUci,
        bestMoveSan: bestMoveSan || item.moveObj.san,
        secondBestMoveUci,
        secondBestMoveSan,
        pv: engineBefore.pv,
        threat,
        phase: item.phase
      };
    }
    if (onProgress && (i % 2 === 0 || i === totalPlies - 1)) {
      onProgress(i + 1, totalPlies);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  const createEmptyCounts = () => ({
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
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
  const userPhaseLosses = {
    opening: [],
    middlegame: [],
    endgame: [],
    overall: []
  };
  const oppPhaseLosses = {
    opening: [],
    middlegame: [],
    endgame: [],
    overall: []
  };
  plies.forEach((p) => {
    if (!p) return;
    const cpLoss = Math.min(300, Math.max(0, p.scoreCp < 0 ? -p.scoreCp : 0));
    if (p.color === userColor) {
      userCounts[p.classification] = (userCounts[p.classification] || 0) + 1;
      userAccuracySum += p.accuracy;
      userMovesCount++;
      if (p.isImpulsive) impulsiveBlunders++;
      if (p.isTimeTrouble && (p.classification === "blunder" || p.classification === "mistake")) {
        timeTroubleBlunders++;
      }
      userPhaseLosses[p.phase].push(cpLoss);
      userPhaseLosses.overall.push(cpLoss);
    } else {
      opponentCounts[p.classification] = (opponentCounts[p.classification] || 0) + 1;
      oppAccuracySum += p.accuracy;
      oppMovesCount++;
      oppPhaseLosses[p.phase].push(cpLoss);
      oppPhaseLosses.overall.push(cpLoss);
    }
  });
  const userAccuracy = userMovesCount > 0 ? Math.round(userAccuracySum / userMovesCount * 10) / 10 : 85;
  const opponentAccuracy = oppMovesCount > 0 ? Math.round(oppAccuracySum / oppMovesCount * 10) / 10 : 85;
  const overallAccuracy = Math.round((userAccuracy + opponentAccuracy) / 2 * 10) / 10;
  const calcAcpl = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 25;

  const oppColor = userColor === "w" ? "b" : "w";
  const oppBaseElo = userColor === "w" ? blackElo : whiteElo;

  const userPhaseAcpl = {
    opening: calcAcpl(userPhaseLosses.opening),
    middlegame: calcAcpl(userPhaseLosses.middlegame),
    endgame: calcAcpl(userPhaseLosses.endgame),
    overall: calcAcpl(userPhaseLosses.overall)
  };
  const oppPhaseAcpl = {
    opening: calcAcpl(oppPhaseLosses.opening),
    middlegame: calcAcpl(oppPhaseLosses.middlegame),
    endgame: calcAcpl(oppPhaseLosses.endgame),
    overall: calcAcpl(oppPhaseLosses.overall)
  };

  const overallGameElo = calculatePhaseElo(userBaseElo, userPhaseAcpl.overall, userMovesCount, true, result, userColor) ?? userBaseElo;
  const openingElo = calculatePhaseElo(userBaseElo, userPhaseAcpl.opening, userPhaseLosses.opening.length) ?? userBaseElo;
  const middlegameElo = calculatePhaseElo(userBaseElo, userPhaseAcpl.middlegame, userPhaseLosses.middlegame.length) ?? userBaseElo;
  const endgameElo = calculatePhaseElo(userBaseElo, userPhaseAcpl.endgame, userPhaseLosses.endgame.length) ?? userBaseElo;

  const oppOpeningElo = calculatePhaseElo(oppBaseElo, oppPhaseAcpl.opening, oppPhaseLosses.opening.length) ?? oppBaseElo;
  const oppMiddlegameElo = calculatePhaseElo(oppBaseElo, oppPhaseAcpl.middlegame, oppPhaseLosses.middlegame.length) ?? oppBaseElo;
  const oppEndgameElo = calculatePhaseElo(oppBaseElo, oppPhaseAcpl.endgame, oppPhaseLosses.endgame.length) ?? oppBaseElo;

  return {
    id: `game_${Date.now()}`,
    platform: "pgn",
    white,
    black,
    whiteElo,
    blackElo,
    userColor,
    result,
    date,
    timeControl,
    ecoCode,
    ecoName,
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    plies,
    accuracy: userAccuracy,
    overallAccuracy,
    userAccuracy,
    opponentAccuracy,
    overallGameElo,
    openingElo,
    middlegameElo,
    endgameElo,
    phaseElos: {
      opening: openingElo,
      middlegame: middlegameElo,
      endgame: endgameElo
    },
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
    counts: userCounts,
    userCounts,
    opponentCounts,
    impulsiveBlunders,
    timeTroubleBlunders,
    phaseAcpl: userPhaseAcpl
  };
}
export async function fetchChessComGames(username) {
  const cleanUsername = username.trim().toLowerCase();
  const archivesUrl = `https://api.chess.com/pub/player/${cleanUsername}/games/archives`;
  const headers = {
    "User-Agent": "ChessAnalyzerFlutterApp/1.0 (contact@example.com)"
  };
  const archRes = await fetch(archivesUrl, { headers });
  if (!archRes.ok) {
    throw new Error(`Chess.com user '${username}' not found or profile is private.`);
  }
  const archData = await archRes.json();
  const archives = archData.archives || [];
  if (archives.length === 0) return [];
  const latestMonthUrl = archives[archives.length - 1];
  const gamesRes = await fetch(latestMonthUrl, { headers });
  if (!gamesRes.ok) throw new Error("Failed to fetch monthly games from Chess.com");
  const monthData = await gamesRes.json();
  const games = monthData.games || [];
  return games.slice(-15).reverse().map((g, idx) => {
    const whiteName = g.white?.username || "White";
    const blackName = g.black?.username || "Black";
    let res = "*";
    if (g.white?.result === "win") res = "1-0";
    else if (g.black?.result === "win") res = "0-1";
    else if (g.white?.result === "agreed" || g.white?.result === "repetition" || g.white?.result === "stalemate") res = "1/2-1/2";
    return {
      id: `chesscom_${g.url ? g.url.split("/").pop() : idx}`,
      platform: "chesscom",
      white: whiteName,
      black: blackName,
      whiteElo: g.white?.rating || 1500,
      blackElo: g.black?.rating || 1500,
      result: res,
      date: g.end_time ? new Date(g.end_time * 1e3).toISOString().split("T")[0] : "Recent",
      timeControl: g.time_control || "Rapid",
      eco: g.eco || "C50",
      pgn: g.pgn || ""
    };
  });
}
export async function fetchLichessGames(username) {
  const cleanUsername = username.trim().toLowerCase();
  const url = `https://lichess.org/api/games/user/${cleanUsername}?max=15&clocks=true&evals=true&opening=true`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/x-ndjson",
      "User-Agent": "ChessAnalyzerFlutterApp/1.0 (contact@example.com)"
    }
  });
  if (!res.ok) throw new Error(`Lichess user '${username}' not found.`);
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  return lines.map((line, idx) => {
    try {
      const g = JSON.parse(line);
      const whiteName = g.players?.white?.user?.name || "White";
      const blackName = g.players?.black?.user?.name || "Black";
      let res2 = "*";
      if (g.winner === "white") res2 = "1-0";
      else if (g.winner === "black") res2 = "0-1";
      else if (g.status === "draw" || g.status === "stalemate") res2 = "1/2-1/2";
      return {
        id: `lichess_${g.id || idx}`,
        platform: "lichess",
        white: whiteName,
        black: blackName,
        whiteElo: g.players?.white?.rating || 1500,
        blackElo: g.players?.black?.rating || 1500,
        result: res2,
        date: g.createdAt ? new Date(g.createdAt).toISOString().split("T")[0] : "Recent",
        timeControl: `${g.clock?.initial || 180}+${g.clock?.increment || 0}`,
        eco: g.opening?.eco || "B00",
        pgn: g.pgn || ""
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}
