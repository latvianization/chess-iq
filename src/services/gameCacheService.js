const INDEX_KEY = 'chess_iq_analyzed_index_v2';
const GAME_PREFIX = 'chess_iq_game_v2_';
const MAX_CACHED_GAMES = 30;

(function removeLegacyCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('chess_iq_game_v1_') || k === 'chess_iq_analyzed_index_v1')
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
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
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

function getCachedGame(gameIdOrPgn, userColor = 'w') {
  if (!gameIdOrPgn) return null;
  // 1. Check computed key
  const key = getGameCacheKey(gameIdOrPgn, userColor);
  if (key) {
    try {
      const raw = localStorage.getItem(`${GAME_PREFIX}${key}`);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  // 2. Direct key in storage
  if (typeof gameIdOrPgn === 'string' && gameIdOrPgn !== key) {
    try {
      const raw = localStorage.getItem(`${GAME_PREFIX}${gameIdOrPgn}`);
      if (raw) return JSON.parse(raw);
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
      if (raw) return JSON.parse(raw);
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

    const serialized = JSON.stringify(analyzedGame);
    localStorage.setItem(`${GAME_PREFIX}${key}`, serialized);

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
      timeControl: analyzedGame.timeControl || '',
      savedAt: Date.now()
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

function getCacheStats() {
  const index = getCacheIndex();
  return {
    count: index.length,
    index
  };
}
