/**
 * Comic Badges Service
 * Provides colorful comic sound effect terms (KABOOM!, POW!, ZAP!, SPLAT!)
 * and color tokens for move classifications.
 */

var COMIC_DICTIONARY = {
  brilliant: {
    words: ['Brilliant'],
    symbol: '💎',
    standardLabel: '!!',
    bg: '#06b6d4',
    border: '#083344',
    text: '#ffffff',
    accentBg: '#cffafe',
    starColor: '#22d3ee',
  },
  great: {
    words: ['Great Move'],
    symbol: '⚡',
    standardLabel: '!',
    bg: '#3b82f6',
    border: '#1e3a8a',
    text: '#ffffff',
    accentBg: '#dbeafe',
    starColor: '#60a5fa',
  },
  best: {
    words: ['Best Move'],
    symbol: '⭐',
    standardLabel: '★',
    bg: '#10b981',
    border: '#064e3b',
    text: '#ffffff',
    accentBg: '#d1fae5',
    starColor: '#34d399',
  },
  excellent: {
    words: ['Excellent'],
    symbol: '✓',
    standardLabel: '✓',
    bg: '#22c55e',
    border: '#14532d',
    text: '#ffffff',
    accentBg: '#dcfce7',
    starColor: '#4ade80',
  },
  good: {
    words: ['Good'],
    symbol: '👍',
    standardLabel: '·',
    bg: '#84cc16',
    border: '#365314',
    text: '#ffffff',
    accentBg: '#ecfccb',
    starColor: '#a3e635',
  },
  book: {
    words: ['Book Move'],
    symbol: '📖',
    standardLabel: '📖',
    bg: '#8b5cf6',
    border: '#4c1d95',
    text: '#ffffff',
    accentBg: '#ede9fe',
    starColor: '#a78bfa',
  },
  inaccuracy: {
    words: ['Inaccuracy'],
    symbol: '⁈',
    standardLabel: '?!',
    bg: '#eab308',
    border: '#713f12',
    text: '#000000',
    accentBg: '#fef9c3',
    starColor: '#facc15',
  },
  mistake: {
    words: ['Mistake'],
    symbol: '⁇',
    standardLabel: '?',
    bg: '#f97316',
    border: '#7c2d12',
    text: '#ffffff',
    accentBg: '#ffedd5',
    starColor: '#fb923c',
  },
  blunder: {
    words: ['Blunder'],
    symbol: '💥',
    standardLabel: '??',
    bg: '#ef4444',
    border: '#7f1d1d',
    text: '#ffffff',
    accentBg: '#fee2e2',
    starColor: '#f87171',
  },
  missed_win: {
    words: ['Missed Win'],
    symbol: '✖',
    standardLabel: '✖',
    bg: '#be123c',
    border: '#4c0519',
    text: '#ffffff',
    accentBg: '#ffe4e6',
    starColor: '#f43f5e',
  },
};

/**
 * Deterministically pick a varied comic word based on ply or string seed
 */
function getComicBadge(classification, seed = 0) {
  const config = COMIC_DICTIONARY[classification] || COMIC_DICTIONARY.good;
  let hash = 0;
  if (typeof seed === 'number') {
    hash = Math.abs(seed);
  } else {
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    hash = Math.abs(hash);
  }

  const wordIndex = hash % config.words.length;
  const term = config.words[wordIndex];

  return {
    term,
    symbol: config.symbol,
    badgeLabel: config.standardLabel,
    bg: config.bg,
    border: config.border,
    text: config.text,
    accentBg: config.accentBg,
    starColor: config.starColor,
  };
}
