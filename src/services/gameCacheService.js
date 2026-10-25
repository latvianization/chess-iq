const INDEX_KEY = 'chess_iq_analyzed_index_v3';
const GAME_PREFIX = 'chess_iq_game_v3_';
const MAX_CACHED_GAMES = 30;

(function removeLegacyCache() {
  try {
    Object.keys(localStorage)
      .filter((k) =>
        k.startsWith('chess_iq_game_v1_') ||
        k === 'chess_iq_analyzed_index_v1' ||
        k.startsWith('chess_iq_game_v2_') ||
        k === 'chess_iq_analyzed_index_v2' ||
        k.startsWith('chess_iq_insights_')
      )
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
})();

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function detectBotInGame(white, black) {
  if (typeof BOTS_33 === 'undefined' || !Array.isArray(BOTS_33)) return null;
  const w = (white || '').toLowerCase();
  const b = (black || '').toLowerCase();
  for (const bot of BOTS_33) {
    const name = bot.name.toLowerCase();
    if (w.includes(name) || b.includes(name)) {
      return bot;
    }
  }
  return null;
}

function getGameCacheKey(gameIdOrPgn, userColor = 'w') {
  if (!gameIdOrPgn) return '';
  const clean = typeof gameIdOrPgn === 'string' ? gameIdOrPgn.trim() : '';
  if (!clean) return '';
  // If clean is already a full cache key (e.g. pgn_xyz_w or id_xyz_w)
  if ((clean.startsWith('pgn_') || clean.startsWith('id_')) && (clean.endsWith('_w') || clean.endsWith('_b'))) {
    return clean;
  }
  if (clean.length < 64 && !clean.includes('\n') && !clean.includes('1.')) {
    return `id_${clean}_${userColor}`;
  }
  return `pgn_${hashString(clean)}_${userColor}`;
}

function getCacheIndex() {
  try {
    const list = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    let modified = false;
    list.forEach((item) => {
      const isBot = Boolean(
        item.isBotGame ||
        item.botId ||
        (typeof detectBotInGame === 'function' && detectBotInGame(item.white, item.black)) ||
        item.white === 'You' || item.black === 'You'
      );
      if (isBot) {
        if (!item.isBotGame) {
          item.isBotGame = true;
          modified = true;
        }
        if (item.timeControl) {
          item.timeControl = '';
          modified = true;
        }
      }
    });
    if (modified) {
      try { localStorage.setItem(INDEX_KEY, JSON.stringify(list)); } catch {}
    }
    return list;
  } catch {
    return [];
  }
}

function saveCacheIndex(index) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {}
}

function getGameCacheInfo(gameIdOrPgn, userColor = 'w') {
  const key = getGameCacheKey(gameIdOrPgn, userColor);
  const index = getCacheIndex();
  let entry = key ? index.find((item) => item.key === key) : null;
  if (!entry && gameIdOrPgn) {
    entry = index.find((item) =>
      item.key === gameIdOrPgn ||
      item.id === gameIdOrPgn ||
      (item.key && item.key.includes(gameIdOrPgn)) ||
      (item.pgn && item.pgn === gameIdOrPgn)
    );
  }
  return entry || null;
}

function sanitizeGamePlies(game) {
  if (!game || !Array.isArray(game.plies)) return game;
  const isValidUci = (u) => typeof u === 'string' && u.length >= 4 && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(u);
  for (const p of game.plies) {
    if (p) {
      if (!isValidUci(p.bestMoveUci)) p.bestMoveUci = '';
      if (!isValidUci(p.secondBestMoveUci)) p.secondBestMoveUci = '';
    }
  }
  return game;
}

function getCachedGame(gameIdOrPgn, userColor = 'w') {
  if (!gameIdOrPgn) return null;
  // 1. Check computed key
  const key = getGameCacheKey(gameIdOrPgn, userColor);
  if (key) {
    try {
      const raw = localStorage.getItem(`${GAME_PREFIX}${key}`);
      if (raw) return sanitizeGamePlies(JSON.parse(raw));
    } catch {}
  }
  // 2. Direct key in storage
  if (typeof gameIdOrPgn === 'string' && gameIdOrPgn !== key) {
    try {
      const raw = localStorage.getItem(`${GAME_PREFIX}${gameIdOrPgn}`);
      if (raw) return sanitizeGamePlies(JSON.parse(raw));
    } catch {}
  }
  // 3. Fallback: Search index
  try {
    const index = getCacheIndex();
    const entry = index.find((item) =>
      item.key === gameIdOrPgn ||
      item.id === gameIdOrPgn ||
      (item.key && item.key.includes(gameIdOrPgn)) ||
      (item.pgn && item.pgn === gameIdOrPgn)
    );
    if (entry && entry.key) {
      const raw = localStorage.getItem(`${GAME_PREFIX}${entry.key}`);
      if (raw) return sanitizeGamePlies(JSON.parse(raw));
    }
  } catch {}
  return null;
}

function saveCachedGame(gameIdOrPgn, userColor, analyzedGame) {
  if (!gameIdOrPgn || !analyzedGame) return;
  const key = getGameCacheKey(gameIdOrPgn, userColor);
  if (!key) return;

  try {
    const pgnToSave = analyzedGame.pgn || (typeof gameIdOrPgn === 'string' && (gameIdOrPgn.includes(' ') || gameIdOrPgn.includes('\n') || gameIdOrPgn.includes('.')) ? gameIdOrPgn : '');
    analyzedGame.pgn = pgnToSave;

    const botMatch = detectBotInGame(analyzedGame.white, analyzedGame.black);
    const isBot = Boolean(
      analyzedGame.isBotGame ||
      botMatch ||
      (analyzedGame.white === 'You' || analyzedGame.black === 'You')
    );
    if (isBot) {
      analyzedGame.isBotGame = true;
      analyzedGame.timeControl = '';
    }

    const serialized = JSON.stringify(analyzedGame);
    localStorage.setItem(`${GAME_PREFIX}${key}`, serialized);

    const isImported = Boolean(
      analyzedGame.isImported ||
      (analyzedGame.id && String(analyzedGame.id).startsWith('chesscom_')) ||
      analyzedGame.platform === 'chesscom'
    );

    let index = getCacheIndex().filter((item) => item.key !== key);
    index.unshift({
      key,
      id: analyzedGame.id || key,
      pgn: pgnToSave,
      white: analyzedGame.white || 'White',
      black: analyzedGame.black || 'Black',
      whiteElo: analyzedGame.whiteElo || 1500,
      blackElo: analyzedGame.blackElo || 1500,
      result: analyzedGame.result || '*',
      date: analyzedGame.date || '',
      userColor: analyzedGame.userColor || userColor,
      accuracy: analyzedGame.userAccuracy ?? analyzedGame.accuracy ?? 85,
      elo: analyzedGame.overallGameElo || 1500,
      eco: analyzedGame.eco || '',
      ecoName: analyzedGame.ecoName || '',
      timeControl: isBot ? '' : (analyzedGame.timeControl || ''),
      savedAt: Date.now(),
      isBotGame: isBot,
      botId: analyzedGame.botId || (botMatch ? botMatch.id : null),
      botName: analyzedGame.botName || (botMatch ? botMatch.name : null),
      botAvatar: analyzedGame.botAvatar || (botMatch ? botMatch.avatar : null),
      isImported: isImported
    });

    while (index.length > MAX_CACHED_GAMES) {
      const removed = index.pop();
      if (removed) {
        localStorage.removeItem(`${GAME_PREFIX}${removed.key}`);
      }
    }

    saveCacheIndex(index);
    window.dispatchEvent(new CustomEvent('chess_iq_cache_updated', { detail: { key } }));
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      pruneOldestGames(10);
      try {
        localStorage.setItem(`${GAME_PREFIX}${key}`, JSON.stringify(analyzedGame));
      } catch {}
    }
  }
}

function pruneOldestGames(count = 5) {
  let index = getCacheIndex();
  for (let i = 0; i < count && index.length > 0; i++) {
    const removed = index.pop();
    if (removed) {
      localStorage.removeItem(`${GAME_PREFIX}${removed.key}`);
    }
  }
  saveCacheIndex(index);
}

function clearGameCache() {
  const index = getCacheIndex();
  index.forEach((item) => {
    localStorage.removeItem(`${GAME_PREFIX}${item.key}`);
  });
  localStorage.removeItem(INDEX_KEY);
  window.dispatchEvent(new CustomEvent('chess_iq_cache_cleared'));
}

function removeCachedGame(gameKeyOrId) {
  if (!gameKeyOrId) return false;
  let index = getCacheIndex();
  const entry = index.find((item) =>
    item.key === gameKeyOrId ||
    item.id === gameKeyOrId ||
    (item.key && item.key.includes(gameKeyOrId)) ||
    (item.id && item.id.includes(gameKeyOrId))
  );

  const keyToRemove = entry ? entry.key : gameKeyOrId;
  const idToRemove = entry ? entry.id : gameKeyOrId;

  try {
    localStorage.removeItem(`${GAME_PREFIX}${keyToRemove}`);
    if (idToRemove && idToRemove !== keyToRemove) {
      localStorage.removeItem(`${GAME_PREFIX}${idToRemove}`);
    }
  } catch {}

  const newIndex = index.filter((item) =>
    item.key !== keyToRemove &&
    item.id !== idToRemove &&
    item.id !== keyToRemove &&
    item.key !== idToRemove
  );

  saveCacheIndex(newIndex);
  window.dispatchEvent(new CustomEvent('chess_iq_cache_updated', { detail: { key: keyToRemove, removed: true } }));
  return true;
}

function getCacheStats() {
  const index = getCacheIndex();
  return {
    count: index.length,
    index
  };
}

if (typeof window !== 'undefined') {
  window.getGameCacheKey = getGameCacheKey;
  window.getCacheIndex = getCacheIndex;
  window.saveCacheIndex = saveCacheIndex;
  window.getGameCacheInfo = getGameCacheInfo;
  window.getCachedGame = getCachedGame;
  window.saveCachedGame = saveCachedGame;
  window.removeCachedGame = removeCachedGame;
  window.clearGameCache = clearGameCache;
  window.getCacheStats = getCacheStats;
  window.detectBotInGame = detectBotInGame;
}
