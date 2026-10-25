const BLUNDER_BANK_STORAGE_KEY = 'chess_iq_blunder_bank_v1';
const MAX_BLUNDER_BANK_ITEMS = 150;

function loadBlunderBank() {
  try {
    const raw = localStorage.getItem(BLUNDER_BANK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBlunderBank(items) {
  try {
    const trimmed = items.slice(0, MAX_BLUNDER_BANK_ITEMS);
    localStorage.setItem(BLUNDER_BANK_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

function syncGameToBlunderBank(game) {
  if (!game || !Array.isArray(game.plies)) return 0;
  const userColor = game.userColor || 'w';
  const existing = loadBlunderBank();
  const byId = new Map(existing.map((item) => [item.id, item]));
  let addedCount = 0;

  game.plies.forEach((p) => {
    if (!p) return;
    const isUser = p.color ? (p.color === userColor) : (p.ply % 2 === (userColor === 'w' ? 1 : 0));
    if (!isUser) return;
    if (!['inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(p.classification)) return;
    if (!p.fenBefore || !p.bestMoveUci || p.bestMoveUci === p.uci) return;

    const fenCore = p.fenBefore.split(' ').slice(0, 4).join(' ');
    const id = `${fenCore}|${p.bestMoveUci}`;
    const motifIds = Array.isArray(p.motifs) && p.motifs.length > 0
      ? p.motifs.map((m) => m.id)
      : ['missed_tactic'];

    if (!byId.has(id)) {
      byId.set(id, {
        id,
        fenBefore: p.fenBefore,
        userColor,
        ply: p.ply,
        playedSan: p.san,
        playedUci: p.uci,
        bestMoveSan: p.bestMoveSan || p.bestMoveUci,
        bestMoveUci: p.bestMoveUci,
        classification: p.classification,
        phase: p.phase || 'middlegame',
        motifs: motifIds,
        gameId: game.id || null,
        white: game.white || 'White',
        black: game.black || 'Black',
        ecoName: game.ecoName || game.ecoCode || 'Match',
        date: game.date || '',
        streak: 0,
        attempts: 0,
        mastered: false,
        addedAt: Date.now()
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    const merged = Array.from(byId.values()).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    saveBlunderBank(merged);
  }
  return addedCount;
}

function getBlunderBankPuzzles(filter = 'all') {
  const all = loadBlunderBank();
  if (filter === 'all') return all;
  if (filter === 'unmastered') return all.filter((item) => !item.mastered);
  if (filter === 'daily') return getDailyWorkoutPuzzles(5);
  return all.filter((item) => Array.isArray(item.motifs) && item.motifs.includes(filter));
}

function getDailyWorkoutPuzzles(count = 5) {
  const all = loadBlunderBank();
  if (all.length === 0) return [];
  const sorted = [...all].sort((a, b) => {
    if (a.mastered !== b.mastered) return a.mastered ? 1 : -1;
    if ((a.streak || 0) !== (b.streak || 0)) return (a.streak || 0) - (b.streak || 0);
    return (a.lastAttemptAt || 0) - (b.lastAttemptAt || 0);
  });
  return sorted.slice(0, count);
}

function recordBlunderBankAttempt(puzzleId, solved) {
  const all = loadBlunderBank();
  const idx = all.findIndex((p) => p.id === puzzleId);
  if (idx === -1) return null;
  const item = all[idx];
  item.attempts = (item.attempts || 0) + 1;
  if (solved) {
    item.streak = (item.streak || 0) + 1;
    if (item.streak >= 1) item.mastered = true;
  } else {
    item.streak = 0;
    item.mastered = false;
  }
  item.lastAttemptAt = Date.now();
  saveBlunderBank(all);
  return item;
}

function getBlunderBankStats() {
  const all = loadBlunderBank();
  const mastered = all.filter((p) => p.mastered).length;
  const motifCounts = {};
  all.forEach((p) => {
    (p.motifs || []).forEach((m) => {
      motifCounts[m] = (motifCounts[m] || 0) + 1;
    });
  });
  return {
    total: all.length,
    mastered,
    due: all.length - mastered,
    motifCounts
  };
}

function removeGameFromBlunderBank(matchCriteria = {}) {
  const all = loadBlunderBank();
  if (all.length === 0) return 0;
  const { gameId, white, black, date } = matchCriteria;
  const filtered = all.filter((item) => {
    if (gameId && item.gameId && item.gameId === gameId) return false;
    if (white && black) {
      const matchW = (item.white || '').toLowerCase() === white.toLowerCase();
      const matchB = (item.black || '').toLowerCase() === black.toLowerCase();
      if (matchW && matchB) {
        if (!date || item.date === date) return false;
      }
    }
    return true;
  });

  const removedCount = all.length - filtered.length;
  if (removedCount > 0) {
    saveBlunderBank(filtered);
    window.dispatchEvent(new CustomEvent('chess_iq_blunder_bank_updated', { detail: { removedCount } }));
  }
  return removedCount;
}

function removeBlunderBankItem(puzzleId) {
  if (!puzzleId) return false;
  const all = loadBlunderBank();
  const filtered = all.filter((item) => item.id !== puzzleId);
  if (filtered.length !== all.length) {
    saveBlunderBank(filtered);
    window.dispatchEvent(new CustomEvent('chess_iq_blunder_bank_updated', { detail: { puzzleId } }));
    return true;
  }
  return false;
}

function clearBlunderBank() {
  try {
    localStorage.removeItem(BLUNDER_BANK_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('chess_iq_blunder_bank_updated'));
  } catch {}
}

if (typeof window !== 'undefined') {
  window.loadBlunderBank = loadBlunderBank;
  window.saveBlunderBank = saveBlunderBank;
  window.syncGameToBlunderBank = syncGameToBlunderBank;
  window.getBlunderBankPuzzles = getBlunderBankPuzzles;
  window.getDailyWorkoutPuzzles = getDailyWorkoutPuzzles;
  window.recordBlunderBankAttempt = recordBlunderBankAttempt;
  window.getBlunderBankStats = getBlunderBankStats;
  window.removeGameFromBlunderBank = removeGameFromBlunderBank;
  window.removeBlunderBankItem = removeBlunderBankItem;
  window.clearBlunderBank = clearBlunderBank;
}
