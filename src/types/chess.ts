export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win';

export type GamePhase = 'opening' | 'middlegame' | 'endgame';

export interface PlyEvaluation {
  ply: number;
  san: string;
  uci: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  color: 'w' | 'b';
  fen: string;
  fenBefore: string;
  clock?: number | null; // seconds remaining
  timeSpent?: number | null; // seconds taken
  isTimeTrouble?: boolean;
  isImpulsive?: boolean;
  scoreCp: number; // Centipawns from mover's perspective
  mate?: number | null;
  winProb: number; // 0.0 - 1.0 (from mover's perspective)
  winProbBefore: number;
  winProbLoss: number;
  accuracy: number; // 0 - 100
  classification: MoveClassification;
  bestMoveUci: string;
  bestMoveSan: string;
  pv: string[]; // sequence of UCI or SAN moves
  threat?: {
    uci: string;
    san: string;
    description: string;
  } | null;
  phase: GamePhase;
}

export interface AnalyzedGame {
  id: string;
  platform: 'chesscom' | 'lichess' | 'pgn';
  white: string;
  black: string;
  whiteElo: number;
  blackElo: number;
  userColor: 'w' | 'b';
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  date: string;
  timeControl: string;
  ecoCode: string;
  ecoName: string;
  initialFen: string;
  plies: PlyEvaluation[];
  overallAccuracy: number;
  userAccuracy: number;
  opponentAccuracy: number;
  overallGameElo: number;
  openingElo: number | null;
  middlegameElo: number | null;
  endgameElo: number | null;
  middlegameStartPly: number;
  endgameStartPly: number;
  counts: Record<MoveClassification, number>;
  impulsiveBlunders: number;
  timeTroubleBlunders: number;
  phaseAcpl: {
    opening: number;
    middlegame: number;
    endgame: number;
    overall: number;
  };
}

export interface BlunderPuzzle {
  id: string;
  gameId: string;
  fen: string;
  turn: 'w' | 'b';
  playedSan: string;
  playedUci: string;
  bestSan: string;
  bestUci: string;
  pvLine: string[];
  winProbLoss: number;
  phase: GamePhase;
  explanation: string;
}

export type BoardTheme = 'green' | 'wood' | 'icy';
