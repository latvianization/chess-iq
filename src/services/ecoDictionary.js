var ECO_DATABASE = [
  // Italian & Spanish
  { eco: 'C50', name: 'Italian Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
  { eco: 'C54', name: 'Giuoco Piano, Main Line', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4'] },
  { eco: 'C55', name: 'Two Knights Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
  { eco: 'C57', name: 'Fried Liver Attack', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7'] },
  { eco: 'C51', name: 'Evans Gambit', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'] },
  { eco: 'C60', name: 'Ruy Lopez', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
  { eco: 'C65', name: 'Ruy Lopez, Berlin Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'] },
  { eco: 'C78', name: 'Ruy Lopez, Archangelsk Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'b5', 'Bb3', 'Bb7'] },
  { eco: 'C88', name: 'Ruy Lopez, Closed', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3'] },

  // Open Games & Petrov
  { eco: 'C42', name: "Petrov's Defense", moves: ['e4', 'e5', 'Nf3', 'Nf6'] },
  { eco: 'C45', name: 'Scotch Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
  { eco: 'C44', name: 'King’s Pawn Game', moves: ['e4', 'e5', 'Nf3'] },
  { eco: 'C20', name: 'King’s Pawn Game', moves: ['e4', 'e5'] },
  { eco: 'C30', name: "King's Gambit", moves: ['e4', 'e5', 'f4'] },
  { eco: 'C24', name: "Bishop's Opening", moves: ['e4', 'e5', 'Bc4'] },
  { eco: 'C21', name: 'Center Game', moves: ['e4', 'e5', 'd4', 'exd4', 'Qxd4'] },

  // Sicilian Defense
  { eco: 'B20', name: 'Sicilian Defense', moves: ['e4', 'c5'] },
  { eco: 'B22', name: 'Sicilian Defense, Alapin Variation', moves: ['e4', 'c5', 'c3'] },
  { eco: 'B23', name: 'Sicilian Defense, Closed', moves: ['e4', 'c5', 'Nc3'] },
  { eco: 'B33', name: 'Sicilian Defense, Sveshnikov', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e5'] },
  { eco: 'B50', name: 'Sicilian Defense, Modern Line', moves: ['e4', 'c5', 'Nf3', 'd6'] },
  { eco: 'B70', name: 'Sicilian Defense, Dragon Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] },
  { eco: 'B90', name: 'Sicilian Defense, Najdorf Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },

  // French & Caro-Kann
  { eco: 'C00', name: 'French Defense', moves: ['e4', 'e6'] },
  { eco: 'C02', name: 'French Defense, Advance Variation', moves: ['e4', 'e6', 'd4', 'd5', 'e5'] },
  { eco: 'C05', name: 'French Defense, Tarrasch Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nd2', 'Nf6'] },
  { eco: 'C11', name: 'French Defense, Classical', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'] },
  { eco: 'C15', name: 'French Defense, Winawer', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'] },
  { eco: 'B10', name: 'Caro-Kann Defense', moves: ['e4', 'c6'] },
  { eco: 'B12', name: 'Caro-Kann Defense, Advance Variation', moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
  { eco: 'B18', name: 'Caro-Kann Defense, Classical', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'] },

  // Scandinavian & Others against e4
  { eco: 'B01', name: 'Scandinavian Defense', moves: ['e4', 'd5'] },
  { eco: 'B06', name: 'Modern Defense', moves: ['e4', 'g6'] },
  { eco: 'B07', name: 'Pirc Defense', moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6'] },
  { eco: 'B02', name: "Alekhine's Defense", moves: ['e4', 'Nf6'] },

  // Queen's Pawn Games & Queen's Gambit
  { eco: 'D00', name: "Queen's Pawn Game", moves: ['d4', 'd5'] },
  { eco: 'D02', name: "London System", moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'] },
  { eco: 'D06', name: "Queen's Gambit", moves: ['d4', 'd5', 'c4'] },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: ['d4', 'd5', 'c4', 'dxc4'] },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: ['d4', 'd5', 'c4', 'e6'] },
  { eco: 'D37', name: "Queen's Gambit Declined, Classical", moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'Be7'] },
  { eco: 'D10', name: 'Slav Defense', moves: ['d4', 'd5', 'c4', 'c6'] },
  { eco: 'D15', name: 'Slav Defense, Czech Variation', moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4'] },
  { eco: 'D45', name: 'Semi-Slav Defense', moves: ['d4', 'd5', 'c4', 'c6', 'Nc3', 'Nf6', 'Nf3', 'e6'] },

  // Indian Defenses
  { eco: 'E60', name: "King's Indian Defense", moves: ['d4', 'Nf6', 'c4', 'g6'] },
  { eco: 'E97', name: "King's Indian Defense, Classical", moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6'] },
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
  { eco: 'E12', name: "Queen's Indian Defense", moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'] },
  { eco: 'A56', name: 'Benoni Defense', moves: ['d4', 'Nf6', 'c4', 'c5'] },
  { eco: 'A80', name: 'Dutch Defense', moves: ['d4', 'f5'] },
  { eco: 'D80', name: 'Grünfeld Defense', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'] },

  // Flank Openings
  { eco: 'A04', name: 'Réti Opening', moves: ['Nf3'] },
  { eco: 'A10', name: 'English Opening', moves: ['c4'] },
  { eco: 'A15', name: 'English Opening, Anglo-Indian', moves: ['c4', 'Nf6'] },
  { eco: 'A00', name: 'Uncommon Opening', moves: [] }
];

function findMatchingEco(moveSans) {
  let bestMatch = ECO_DATABASE[ECO_DATABASE.length - 1];
  let maxMatched = 0;

  for (const entry of ECO_DATABASE) {
    if (entry.moves.length === 0) continue;
    let matches = true;
    for (let i = 0; i < entry.moves.length; i++) {
      if (i >= moveSans.length || moveSans[i] !== entry.moves[i]) {
        matches = false;
        break;
      }
    }
    if (matches && entry.moves.length > maxMatched) {
      maxMatched = entry.moves.length;
      bestMatch = entry;
    }
  }

  return {
    eco: bestMatch.eco,
    name: bestMatch.name,
    bookLength: maxMatched
  };
}

function isBookMove(moveSans, moveIndex) {
  for (const entry of ECO_DATABASE) {
    if (moveIndex < entry.moves.length) {
      let matches = true;
      for (let i = 0; i <= moveIndex; i++) {
        if (moveSans[i] !== entry.moves[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
  }
  return false;
}

function getBookContinuations(moveSans, plyIndex) {
  const continuations = [];
  const seenMoves = new Set();
  for (const entry of ECO_DATABASE) {
    if (entry.moves.length <= plyIndex) continue;
    let matchesPrefix = true;
    for (let i = 0; i < plyIndex; i++) {
      if (moveSans[i] !== entry.moves[i]) {
        matchesPrefix = false;
        break;
      }
    }
    const nextMove = entry.moves[plyIndex];
    if (matchesPrefix && nextMove && !seenMoves.has(nextMove)) {
      seenMoves.add(nextMove);
      continuations.push({ san: nextMove, eco: entry.eco, name: entry.name });
    }
  }
  return continuations.slice(0, 3);
}

const ECO_VOLUMES = {
  A: {
    volume: 'Volume A',
    category: 'Flank Openings & Irregular',
    theme: 'Flank openings (1.c4 English, 1.Nf3 Réti, Bird), Dutch Defense (1...f5), Benoni, and irregular sidelines.',
    strategicSummary: 'Hypermodern wing control, asymmetric pawn structures, and active piece play without immediate central pawn clashes.'
  },
  B: {
    volume: 'Volume B',
    category: 'Semi-Open Games (Non-e5/e6)',
    theme: 'Sharp asymmetric counters to 1.e4: Sicilian Defense (1...c5), Caro-Kann (1...c6), Pirc (1...d6), and Scandinavian (1...d5).',
    strategicSummary: 'Imbalanced pawn structures, dynamic queenside counter-play against White\'s central space, and sharp tactical races.'
  },
  C: {
    volume: 'Volume C',
    category: 'Open Games & French Defense',
    theme: 'Double King\'s Pawn classical openings (1.e4 e5: Italian Game, Ruy Lopez, Scotch, King\'s Gambit) and French Defense (1.e4 e6).',
    strategicSummary: 'Rapid piece development, early king castling, direct central tension over d4/e5, and pawn breaks on f4/c5.'
  },
  D: {
    volume: 'Volume D',
    category: 'Closed & Semi-Closed Games',
    theme: 'Queen\'s Pawn games (1.d4 d5: Queen\'s Gambit, Slav Defense, Semi-Slav) and Grünfeld Defense (1.d4 Nf6 2.c4 g6 3.Nc3 d5).',
    strategicSummary: 'Solid positional maneuvering, queen\'s wing minority attacks, central pawn tension, and structural endgame advantages.'
  },
  E: {
    volume: 'Volume E',
    category: 'Indian Defenses',
    theme: 'Indian Defenses following 1.d4 Nf6 2.c4: King\'s Indian Defense, Nimzo-Indian, Queen\'s Indian, and Catalan.',
    strategicSummary: 'Hypermodern central restraint, fierce kingside attacking chances, pawn wedges, and dynamic piece activity.'
  }
};

function formatMovesList(moves) {
  if (!Array.isArray(moves) || moves.length === 0) return '';
  const tokens = [];
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) {
      tokens.push(`${Math.floor(i / 2) + 1}.`);
    }
    tokens.push(moves[i]);
  }
  return tokens.join(' ');
}

function getEcoMetadata(ecoCode, ecoName) {
  const code = (ecoCode || 'A00').trim().toUpperCase();
  const letter = code.charAt(0);
  const volInfo = ECO_VOLUMES[letter] || {
    volume: `Volume ${letter}`,
    category: 'Chess Opening Classification',
    theme: 'Standard opening classification in the Encyclopaedia of Chess Openings.',
    strategicSummary: 'Standard opening principles: develop pieces toward the center, castle for king safety, and contest the key central squares.'
  };

  // Find matching canonical entry in ECO_DATABASE
  let entry = null;
  if (ecoName) {
    const cleanName = ecoName.trim().toLowerCase();
    entry = ECO_DATABASE.find((e) => e.name && e.name.toLowerCase() === cleanName);
  }
  if (!entry && code) {
    entry = ECO_DATABASE.find((e) => e.eco === code);
  }

  const moves = entry && entry.moves ? entry.moves : [];
  const movesStr = formatMovesList(moves);

  const safeCode = encodeURIComponent(code);
  const safeName = encodeURIComponent((ecoName || entry?.name || code).replace(/,/g, ''));

  return {
    code,
    name: ecoName || entry?.name || 'Chess Opening',
    volume: volInfo.volume,
    category: volInfo.category,
    theme: volInfo.theme,
    strategicSummary: volInfo.strategicSummary,
    canonicalMoves: moves,
    canonicalMovesStr: movesStr,
    links: {
      chess365: `https://www.365chess.com/eco/${safeCode}`,
      lichess: `https://lichess.org/opening/${safeName.replace(/%20/g, '_')}`,
      chessCom: `https://www.chess.com/openings/${safeName.replace(/%20/g, '-')}`
    }
  };
}

if (typeof window !== 'undefined') {
  window.ECO_DATABASE = ECO_DATABASE;
  window.findMatchingEco = findMatchingEco;
  window.isBookMove = isBookMove;
  window.getBookContinuations = getBookContinuations;
  window.getEcoMetadata = getEcoMetadata;
}

if (typeof globalThis !== 'undefined') {
  globalThis.ECO_DATABASE = ECO_DATABASE;
  globalThis.findMatchingEco = findMatchingEco;
  globalThis.isBookMove = isBookMove;
  globalThis.getBookContinuations = getBookContinuations;
  globalThis.getEcoMetadata = getEcoMetadata;
}

if (typeof module !== 'undefined') {
  module.exports = {
    ECO_DATABASE,
    findMatchingEco,
    isBookMove,
    getBookContinuations,
    getEcoMetadata
  };
}
