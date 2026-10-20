import { MoveClassification } from '../types/chess';

export interface ComicBadgeData {
  term: string;
  symbol: string;
  badgeLabel: string;
  bg: string;
  border: string;
  text: string;
  accentBg: string;
  starColor: string;
}

export const COMIC_DICTIONARY: Record<
  MoveClassification,
  {
    words: string[];
    symbol: string;
    standardLabel: string;
    bg: string;
    border: string;
    text: string;
    accentBg: string;
    starColor: string;
  }
> = {
  brilliant: {
    words: ['KABOOM!', 'BOOM!', 'EPIC!', 'GENIUS!'],
    symbol: '💥',
    standardLabel: '!!',
    bg: '#06b6d4', // Vibrant Cyan
    border: '#083344',
    text: '#ffffff',
    accentBg: '#cffafe',
    starColor: '#22d3ee',
  },
  great: {
    words: ['POW!', 'WHAM!', 'SUPER!', 'SMASH!'],
    symbol: '⚡',
    standardLabel: '!',
    bg: '#3b82f6', // Comic Blue
    border: '#1e3a8a',
    text: '#ffffff',
    accentBg: '#dbeafe',
    starColor: '#60a5fa',
  },
  best: {
    words: ['ZAP!', 'SWOOSH!', 'BULLSEYE!', 'BAM!'],
    symbol: '🎯',
    standardLabel: '★',
    bg: '#10b981', // Emerald Hero
    border: '#064e3b',
    text: '#ffffff',
    accentBg: '#d1fae5',
    starColor: '#34d399',
  },
  excellent: {
    words: ['NICE!', 'SHARP!', 'CLEAN!', 'SWEET!'],
    symbol: '✨',
    standardLabel: '✓',
    bg: '#22c55e', // Fresh Green
    border: '#14532d',
    text: '#ffffff',
    accentBg: '#dcfce7',
    starColor: '#4ade80',
  },
  good: {
    words: ['SOLID!', 'COOL!', 'OKAY!', 'SMOOTH!'],
    symbol: '👍',
    standardLabel: '·',
    bg: '#84cc16', // Lime Pop
    border: '#365314',
    text: '#ffffff',
    accentBg: '#ecfccb',
    starColor: '#a3e635',
  },
  book: {
    words: ['THEORY!', 'CLASSIC!', 'BOOK!', 'PRO!'],
    symbol: '📖',
    standardLabel: '📖',
    bg: '#8b5cf6', // Comic Purple
    border: '#4c1d95',
    text: '#ffffff',
    accentBg: '#ede9fe',
    starColor: '#a78bfa',
  },
  inaccuracy: {
    words: ['HMM?', 'MEH!', 'WHOOPS!', 'UH-OH!'],
    symbol: '🤔',
    standardLabel: '?!',
    bg: '#eab308', // Comic Yellow
    border: '#713f12',
    text: '#000000',
    accentBg: '#fef9c3',
    starColor: '#facc15',
  },
  mistake: {
    words: ['OUCH!', 'YIKES!', 'CLUNK!', 'DOH!'],
    symbol: '🩹',
    standardLabel: '?',
    bg: '#f97316', // Comic Orange
    border: '#7c2d12',
    text: '#ffffff',
    accentBg: '#ffedd5',
    starColor: '#fb923c',
  },
  blunder: {
    words: ['SPLAT!', 'CRASH!', 'KABLOOEY!', 'FACEPALM!'],
    symbol: '💥',
    standardLabel: '??',
    bg: '#ef4444', // Comic Crimson
    border: '#7f1d1d',
    text: '#ffffff',
    accentBg: '#fee2e2',
    starColor: '#f87171',
  },
  missed_win: {
    words: ['NOOO!', 'MISSED!', 'WIPEOUT!', 'LOST IT!'],
    symbol: '💨',
    standardLabel: '✖',
    bg: '#be123c', // Deep Crimson
    border: '#4c0519',
    text: '#ffffff',
    accentBg: '#ffe4e6',
    starColor: '#f43f5e',
  },
};

/**
 * Deterministically pick a varied comic word based on ply or string seed
 */
export function getComicBadge(
  classification: MoveClassification,
  seed: number | string = 0
): ComicBadgeData {
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
