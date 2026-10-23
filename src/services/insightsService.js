const INSIGHTS_KEY_PREFIX = 'chess_iq_insights_v1_';
const INSIGHTS_GAME_LIMIT = 100;
const INSIGHTS_MIN_PLIES = 20;
const INSIGHTS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const INSIGHTS_CANCELLED = 'insights_cancelled';

function insStorageKey(platform, username) {
  return `${INSIGHTS_KEY_PREFIX}${platform}_${username.trim().toLowerCase()}`;
}

function insTimeControlLabel(timeControl) {
  const text = String(timeControl || '');
  if (text.includes('/')) return 'Daily';
  const [base, increment] = text.split('+').map((n) => parseInt(n, 10));
  if (isNaN(base)) return 'Rapid';
  const estimated = base + 40 * (increment || 0);
  if (estimated < 180) return 'Bullet';
  if (estimated < 480) return 'Blitz';
  if (estimated <= 1500) return 'Rapid';
  return 'Classical';
}

function insUserColor(game, username) {
  const name = username.trim().toLowerCase();
  if (game.white.toLowerCase() === name) return 'w';
  if (game.black.toLowerCase() === name) return 'b';
  return null;
}

function insUserResult(game, color) {
  if (game.result === '1/2-1/2') return 'd';
  if (game.result === '1-0') return color === 'w' ? 'w' : 'l';
  if (game.result === '0-1') return color === 'b' ? 'w' : 'l';
  return null;
}

function insSummarize(game, analyzed, color) {
  const result = insUserResult(game, color);
  if (!result || !analyzed || analyzed.plies.length < INSIGHTS_MIN_PLIES) return null;

  const phaseErr = { opening: 0, middlegame: 0, endgame: 0 };
  const phaseMoves = { opening: 0, middlegame: 0, endgame: 0 };
  analyzed.plies.forEach((p) => {
    if (!p || p.color !== color || phaseMoves[p.phase] === undefined) return;
    phaseMoves[p.phase] += 1;
    if (p.classification === 'mistake' || p.classification === 'blunder') phaseErr[p.phase] += 1;
  });

  const isWhite = color === 'w';
  return {
    id: game.id,
    ts: game.endTime || Date.parse(game.date) || 0,
    date: game.date,
    color,
    result,
    ownElo: isWhite ? game.whiteElo : game.blackElo,
    oppElo: isWhite ? game.blackElo : game.whiteElo,
    oppName: isWhite ? game.black : game.white,
    acc: analyzed.userAccuracy,
    oppAcc: analyzed.opponentAccuracy,
    perf: analyzed.overallGameElo,
    phaseAcc: analyzed.userPhaseAccuracy,
    phaseErr,
    phaseMoves,
    counts: analyzed.userCounts,
    plies: analyzed.plies.length,
    eco: game.eco,
    ecoName: analyzed.ecoName,
    tc: insTimeControlLabel(game.timeControl),
    ttBlunders: analyzed.timeTroubleBlunders || 0,
    impBlunders: analyzed.impulsiveBlunders || 0,
    pgn: game.pgn
  };
}

function insFetchGames(platform, username) {
  if (platform === 'chesscom') return fetchChessComGames(username, INSIGHTS_GAME_LIMIT);
  return fetchLichessGames(username, INSIGHTS_GAME_LIMIT);
}

function loadInsights(platform, username) {
  try {
    const raw = localStorage.getItem(insStorageKey(platform, username));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function insSave(platform, username, entry) {
  try {
    localStorage.setItem(insStorageKey(platform, username), JSON.stringify(entry));
  } catch {}
}

function isInsightsFresh(entry) {
  return Boolean(entry && entry.report && entry.generatedAt && Date.now() - entry.generatedAt < INSIGHTS_MAX_AGE_MS);
}

function clearInsights(platform, username) {
  try {
    localStorage.removeItem(insStorageKey(platform, username));
  } catch {}
}

async function runInsights({ platform, username, force = false, onStatus, shouldCancel }) {
  const previous = loadInsights(platform, username);
  if (!force && isInsightsFresh(previous)) return { entry: previous, cancelled: false };

  backgroundAnalysisQueue.pause();
  onStatus({ stage: 'fetching' });

  const fetched = await insFetchGames(platform, username);
  const games = fetched.filter((g) => g.pgn && insUserColor(g, username));
  const gameIds = new Set(games.map((g) => g.id));

  const entry = {
    generatedAt: 0,
    report: previous?.report || null,
    skipped: (previous?.skipped || []).filter((id) => gameIds.has(id)),
    summaries: {}
  };
  Object.values(previous?.summaries || {}).forEach((s) => {
    if (gameIds.has(s.id)) entry.summaries[s.id] = s;
  });

  const pending = games.filter((g) => !entry.summaries[g.id] && !entry.skipped.includes(g.id));
  const startedAt = Date.now();
  let cancelled = false;
  let doneCount = 0;
  let nextIdx = 0;
  const CONCURRENCY = 2;

  async function worker() {
    while (nextIdx < pending.length && !cancelled) {
      if (shouldCancel()) {
        cancelled = true;
        break;
      }
      const i = nextIdx++;
      const game = pending[i];
      const color = insUserColor(game, username);
      const elapsed = Date.now() - startedAt;
      const etaMs = doneCount > 0 ? (elapsed / doneCount) * (pending.length - doneCount) : null;
      onStatus({ stage: 'analyzing', done: doneCount, total: pending.length, game, etaMs });

      try {
        let analyzed = getCachedGame(game.id || game.pgn, color);
        if (!analyzed) {
          analyzed = await analyzeFullPgn(game.pgn, color, 'insights', (current, total) => {
            if (shouldCancel()) throw new Error(INSIGHTS_CANCELLED);
            onStatus({ stage: 'analyzing', done: doneCount, total: pending.length, game, etaMs, ply: current, plyTotal: total });
          }, true);
          if (analyzed) saveCachedGame(game.id || game.pgn, color, analyzed);
        }
        const summary = insSummarize(game, analyzed, color);
        if (summary) entry.summaries[game.id] = summary;
        else entry.skipped.push(game.id);
      } catch (err) {
        if (err && err.message === INSIGHTS_CANCELLED) {
          cancelled = true;
          break;
        }
        entry.skipped.push(game.id);
      }
      doneCount++;
      insSave(platform, username, entry);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () => worker());
  await Promise.all(workers);

  entry.report = computeInsights(Object.values(entry.summaries)) || entry.report;
  entry.generatedAt = cancelled ? 0 : Date.now();
  insSave(platform, username, entry);
  return { entry, cancelled };
}
