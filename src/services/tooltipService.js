/**
 * Chess IQ - Tooltip & Feature Explanation Service
 * Provides rich "What & Why" hover popups and info icons for data cards.
 */

function escapeIqHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
if (typeof window !== 'undefined' && typeof window.insEscape === 'undefined') {
  window.insEscape = escapeIqHtml;
}
var insEscape = escapeIqHtml;

const IQ_TOOLTIPS = {
  // ==========================================
  // TOP NAVIGATION & GENERAL
  // ==========================================
  nav_brand: {
    title: 'Chess IQ Home',
    category: 'NAVIGATION',
    what: 'Returns to the main Game Review dashboard or starting home screen.',
    why: 'Quickly reset your view or access your imported matches and saved game history.',
  },
  nav_review: {
    title: 'Game Review Mode',
    category: 'MODE',
    what: 'Deep Stockfish analysis engine for games imported from Chess.com or pasted PGNs.',
    why: 'Uncovers your move accuracy, performance Elo, tactical blunders, positional pillars, and coaching drills.',
  },
  nav_bots: {
    title: '33 Bot Arena',
    category: 'MODE',
    what: 'Challenge 33 personality-driven chess bots spanning from Beginner (250 Elo) to Grandmaster (2850 Elo).',
    why: 'Practice openings, test tactical defense, or replay critical positions against realistic AI personalities.',
  },
  nav_sound: {
    title: 'Synthesized Web Audio',
    category: 'TOGGLE',
    what: 'Mutes or enables synthesized chess sound effects (moves, captures, checks, castling, and blunder alerts).',
    why: 'Plays distinct audio feedback so you immediately feel the impact of brilliant moves, mistakes, and captures.',
  },
  nav_theme_mode: {
    title: 'Day / Cyber Dark Theme',
    category: 'TOGGLE',
    what: 'Toggles between high-contrast Day mode and dark Cyber Arcade mode.',
    why: 'Reduces eye strain during late-night analysis sessions and matches your personal visual preference.',
  },
  nav_import: {
    title: 'Import Game',
    category: 'ACTION',
    what: 'Fetch matches directly from your Chess.com public profile archive or paste any PGN notation.',
    why: 'Bring any online or tournament game into Chess IQ for instant engine review with zero server latency.',
  },

  // ==========================================
  // LOOSE PIECES & BOARD VISION X-RAY
  // ==========================================
  xray_loose: {
    title: 'Loose & Hanging Pieces (X-Ray)',
    category: 'TACTICAL VISION',
    what: 'Highlights undefended pieces (⚠️ LOOSE - yellow ring) and attacked undefended pieces (🎯 HANGING - red ring) on the board.',
    why: 'Grandmaster John Nunn coined the famous chess rule: "LPDO — Loose Pieces Drop Often". An undefended piece has 0 protectors and is vulnerable to tactical strikes like forks, skewers, and discoveries. Spotting loose pieces is the #1 secret to avoiding blunders and finding winning tactics!',
  },
  board_piece_loose: {
    title: 'Undefended Piece (Loose)',
    category: 'LPDO WARNING',
    what: 'This piece has ZERO friendly defenders protecting it. Even if not attacked right now, it is completely unprotected.',
    why: 'Loose Pieces Drop Often! Tactical combinations (double attacks, knight forks, discovered attacks) almost always exploit undefended pieces. Either protect this piece with a pawn/piece or move it to safety.',
  },
  board_piece_hanging: {
    title: 'Hanging Piece (Under Attack!)',
    category: 'CRITICAL THREAT',
    what: 'This piece is actively attacked by enemy pieces while having NO defenders, or defenders of higher value, or where attackers outnumber defenders.',
    why: 'Immediate material loss! If left unaddressed, the opponent can capture this piece for free or win a favorable trade. Defend, retreat, or counter-attack immediately.',
  },
  xray_heatmap: {
    title: 'Square Control Heatmap',
    category: 'BOARD INFLUENCE',
    what: 'Color-codes all 64 squares showing territory control: Cyan for White domination, Rose for Black domination, Gold for contested squares.',
    why: 'Instantly visualizes who controls the center, identifies safe outposts for knights, and spots undefended infiltration routes into the enemy camp.',
  },
  ctrl_threat: {
    title: 'Threat Arrow',
    category: 'DEFENSIVE RADAR',
    what: 'Displays a red arrow showing the opponent\'s most lethal continuation if you were to pass your turn.',
    why: 'Teaches threat awareness: reveals whether the opponent threatens checkmate, a tactical fork, or winning a free piece.',
    shortcut: 'Keyboard: T',
  },
  xray_sandbox: {
    title: 'What-If Sandbox Mode',
    category: 'EXPLORATION',
    what: 'Drag and drop any piece on the board to test hypothetical moves and see instant Stockfish evaluations for alternative lines.',
    why: 'Lets you explore "What if I played this move instead?" without modifying your original game history. Click "Return to Game" anytime to reset.',
  },

  // ==========================================
  // TRAINING MODES & BOT SPARRING
  // ==========================================
  coach_practice_bot: {
    title: 'Practice Key Position vs Bot',
    category: 'BOT SPARRING',
    what: 'Transfers the decisive turning-point position into the Bot Arena to play out the rest of the game against an AI bot.',
    why: 'Test whether you can convert a winning advantage or defend a precarious endgame under game-clock pressure.',
  },
  ctrl_play_from_here: {
    title: 'Play From Here vs Bot',
    category: 'BOT SPARRING',
    what: 'Loads this exact board position into the 33-bot arena against a computer bot matched to your rating.',
    why: 'Practice converting positions or test how a bot refutes your plans in real gameplay.',
  },

  // ==========================================
  // NAVIGATION & BOARD CONTROLS
  // ==========================================
  ctrl_first: {
    title: 'First Move (Start)',
    category: 'NAVIGATION',
    what: 'Rewinds the board back to the initial starting setup (Ply 0).',
    why: 'Inspect the initial position or start stepping forward from move 1.',
    shortcut: 'Keyboard: Home / Ctrl + Left',
  },
  ctrl_prev: {
    title: 'Previous Move',
    category: 'NAVIGATION',
    what: 'Steps backward one single ply (half-move).',
    why: 'Analyze the position immediately prior to the current move.',
    shortcut: 'Keyboard: Left Arrow / Up Arrow',
  },
  ctrl_ply_counter: {
    title: 'Ply Counter',
    category: 'METRIC',
    what: 'Shows the current ply (half-move number) out of total plies in the match.',
    why: 'One full chess move contains two plies: White\'s turn and Black\'s turn.',
  },
  ctrl_next: {
    title: 'Next Move',
    category: 'NAVIGATION',
    what: 'Steps forward one single ply (half-move).',
    why: 'Advance to the next move played in the game.',
    shortcut: 'Keyboard: Right Arrow / Down Arrow',
  },
  ctrl_last: {
    title: 'Last Move (End)',
    category: 'NAVIGATION',
    what: 'Fast-forwards to the final position of the game.',
    why: 'Inspect the final checkmate, resignation, or draw position.',
    shortcut: 'Keyboard: End / Ctrl + Right',
  },
  ctrl_key_moment: {
    title: 'Next Key Moment',
    category: 'NAVIGATION',
    what: 'Auto-jumps forward to the next critical turn: turning points, blunders, mistakes, missed wins, or brilliant moves.',
    why: 'Save time by skipping routine opening development and jumping straight to where the game was won or lost.',
    shortcut: 'Keyboard: Spacebar',
  },
  ctrl_flip: {
    title: 'Flip Board',
    category: 'TOGGLE',
    what: 'Inverts the chessboard perspective between White and Black.',
    why: 'Reviewing the game from your opponent\'s point of view helps you spot tactical threats they were calculating.',
    shortcut: 'Keyboard: F',
  },

  // ==========================================
  // DATA CARDS & METRICS
  // ==========================================
  card_match_overview: {
    title: 'Match Overview & Players',
    category: 'CARD INFO',
    what: 'Summarizes opening ECO classification, date, players, official Elo ratings, Performance Elo, and overall Accuracy %.',
    why: 'Gives you an executive summary of who played, what opening system was chosen, and how accurately each side performed.',
  },
  stat_official_elo: {
    title: 'Official Player Rating (Elo)',
    category: 'METRIC',
    what: 'The player\'s established rating at the time the game was played on Chess.com.',
    why: 'Indicates baseline playing strength and match pairing.',
  },
  stat_performance_elo: {
    title: '⭐ Performance Elo Rating',
    category: 'METRIC',
    what: 'Estimated rating achieved during this specific game based on move quality, centipawn loss, and Stockfish precision.',
    why: 'Tells you if you played above or below your official rating in this individual match.',
  },
  stat_accuracy: {
    title: '🎯 Move Accuracy % (CAPS)',
    category: 'METRIC',
    what: 'Engine precision score from 0% to 100%. Calculated by comparing your played moves against the top engine continuations.',
    why: 'Scores above 85% indicate master-level precision; 70-85% is solid club play; below 65% indicates multiple tactical oversights.',
  },
  stat_result: {
    title: 'Game Result',
    category: 'METRIC',
    what: 'Official match outcome: 1-0 (White win), 0-1 (Black win), or 1/2-1/2 (Draw).',
    why: 'Shows the final outcome determined by checkmate, resignation, timeout, or draw agreement.',
  },
  metric_eval_bar: {
    title: 'Stockfish Evaluation Bar',
    category: 'EVALUATION',
    what: 'Displays current engine advantage in pawns (+1.5 = White is ahead by 1.5 pawns, -2.0 = Black ahead) or forced checkmate (M3 = Mate in 3).',
    why: 'White fill height visually represents White\'s statistical win probability from master databases.',
  },
  card_coach_study_plan: {
    title: 'Coach\'s Study Plan',
    category: 'CARD INFO',
    what: 'Synthesizes your game\'s tactical motifs, time management, and phase dips into a prioritized training action plan.',
    why: 'Transforms post-game analysis from passive reading into active, high-impact practice drills.',
  },
  coach_best_moment: {
    title: 'Best Moment of the Game',
    category: 'HIGHLIGHT',
    what: 'Your highest-rated, most accurate move of the entire match as evaluated by Stockfish.',
    why: 'Reviewing your best moves reinforces positive calculation patterns and tactical vision.',
  },
  card_turning_point: {
    title: 'Game Turning Point',
    category: 'CARD INFO',
    what: 'The single move in the game that caused the most catastrophic win probability shift between White and Black.',
    why: 'Click to jump directly to this move. This is the pivotal moment where the victory slipped away or was clinched.',
  },
  card_opening_deviation: {
    title: 'Left Opening Book',
    category: 'CARD INFO',
    what: 'The exact ply where the game departed from established master opening theory in the ECO encyclopedia.',
    why: 'Click to jump to this move. Studying the recommended theoretical book continuations helps you improve your opening repertoire.',
  },
  eco_opening: {
    title: 'ECO (Encyclopaedia of Chess Openings) Code',
    category: 'OPENING THEORY',
    what: 'The universal international code (A00–E99) categorizing your game\'s opening into one of 5 canonical volumes.',
    why: 'Click to explore the starting moves, strategic goals, and grandmaster database for this opening on Lichess, 365Chess, and Chess.com.',
  },
  card_positional_pillars: {
    title: '4-Pillar Positional X-Ray',
    category: 'CARD INFO',
    what: 'A dynamic 4-axis assessment of the current board state: Material, Piece Activity, King Safety, and Pawn Structure.',
    why: 'Chess isn\'t just tactics; understanding which side has the safer king, superior pawn structure, or more active pieces guides long-term strategy.',
    how: 'Visualizes White vs Black on a 0–100% tug-of-war balance bar. 50% represents exact parity; the light bar shows White\'s share of advantage on that metric.',
  },
  pillar_material: {
    title: 'Pillar 1: Material Balance',
    category: 'POSITIONAL PILLAR',
    what: 'Total valuation of all active pieces and pawns remaining on the board.',
    why: 'Material superiority is the most decisive advantage in chess. Being up material allows you to force advantageous trades and dominate the endgame.',
    how: 'Standard valuations (P=1, N=3, B=3.15, R=5, Q=9) + 0.5 bonus for holding the Bishop pair. White vs Black material difference determines the bar share and advantage label.',
  },
  pillar_activity: {
    title: 'Pillar 2: Piece Activity & Mobility',
    category: 'POSITIONAL PILLAR',
    what: 'Measures dynamic piece mobility, board influence, and central square dominance.',
    why: 'Active pieces control more territory, restrict enemy counterplay, and rapidly coordinate for attacking breakthroughs.',
    how: 'Counts all legal squares attacked or controlled across the 64 squares. Squares in the central 4×4 zone (c3–f6) receive a 1.5× weight multiplier. Scaled into a White vs Black balance percentage.',
  },
  pillar_king_safety: {
    title: 'Pillar 3: King Safety',
    category: 'POSITIONAL PILLAR',
    what: 'Evaluates king shelter, defensive fortress, and vulnerability to enemy threats, pins, or checks.',
    why: 'A compromised king overrides material advantages. An exposed king invites mating nets, piece pins, and crushing tactical combinations.',
    how: 'Starts at 78 base points. Adds +12 points for castling (g1/c1 for White, g8/c8 for Black). Deducts 9 points for every enemy piece attacking any square in the 3×3 king ring (clamped 10 to 98). White vs Black scores determine the bar balance.',
  },
  pillar_pawn_structure: {
    title: 'Pillar 4: Pawn Structure',
    category: 'POSITIONAL PILLAR',
    what: 'Analyzes pawn chains, structural integrity, and long-term pawn weaknesses.',
    why: 'Pawns cannot move backward. Structural pawn defects are permanent weaknesses that become liabilities in the endgame.',
    how: 'Starts at baseline structure. Deducts 12 points for doubled pawns stacked on the same file, and 8 points for isolated pawns lacking neighboring pawn support. Relative structural health determines the bar balance.',
  },
  card_advantage_chart: {
    title: 'Advantage Timeline Graph',
    category: 'CARD INFO',
    what: 'Interactive line graph mapping Stockfish evaluation across every move of the game, with color-coded moment badges.',
    why: 'Scrub or hover across the timeline to see exactly when and where momentum shifted. Click any dot to jump to that turn.',
  },
  card_move_history: {
    title: 'Move History & Filters',
    category: 'CARD INFO',
    what: 'Full algebraic notation list with move quality badges, time spent per move, and filter toggles.',
    why: 'Click any move in the list to jump to it. Use the filters to zero in on errors or key tactical moments.',
  },
  filter_moves_all: {
    title: 'Filter: All Moves',
    category: 'FILTER',
    what: 'Displays the complete turn-by-turn move list without omissions.',
    why: 'Step through the entire game sequentially from opening to endgame.',
  },
  filter_moves_key: {
    title: 'Filter: Key Moves',
    category: 'FILTER',
    what: 'Filters the move table to show only Brilliant, Great, Inaccuracies, Mistakes, Blunders, and Missed Wins.',
    why: 'Cuts out routine moves so you can review only turns that affected the game\'s outcome.',
  },
  filter_moves_errors: {
    title: 'Filter: Errors Only',
    category: 'FILTER',
    what: 'Filters the move table to show strictly Inaccuracies, Mistakes, Blunders, and Missed Wins.',
    why: 'Focuses 100% of your attention on self-correction and understanding your mistakes.',
  },
  card_game_performance: {
    title: 'Game Performance & Phase Breakdown',
    category: 'CARD INFO',
    what: 'Comparative statistical breakdown comparing your play against your opponent across Opening, Middlegame, and Endgame, plus move quality tallies.',
    why: 'Reveals which phase of the game is your strongest or weakest, and shows how many blunders vs brilliant moves both players made.',
  },
  card_phase_accuracy: {
    title: 'Your Phase-by-Phase Move Accuracy',
    category: 'CARD INFO',
    what: 'Displays the percentage of engine-accurate moves played specifically by YOU during the Opening, Middlegame, and Endgame.',
    why: 'Pinpoints exactly which stage of the game you excel at and where you need study (e.g. sharp tactical middlegames vs endgame conversions).',
  },
  phase_opening: {
    title: 'Opening Phase (Moves 1-10+)',
    category: 'PHASE STATS',
    what: 'Measures piece development, center control, and king castling precision against established theory.',
    why: 'A high opening accuracy ensures a playable middlegame position without tactical deficits.',
  },
  phase_middle: {
    title: 'Middlegame Phase',
    category: 'PHASE STATS',
    what: 'Measures tactical calculation, attack execution, and positional maneuvering once pieces are developed.',
    why: 'Most amateur games are won or lost in the middlegame through tactical strikes.',
  },
  phase_endgame: {
    title: 'Endgame Phase',
    category: 'PHASE STATS',
    what: 'Measures king activation, pawn promotion technique, and conversion of material advantage in simplified positions.',
    why: 'Precise endgame technique turns slight advantages into decisive wins.',
  },
  card_saved_games: {
    title: 'Saved Games in Local Cache',
    category: 'CARD INFO',
    what: 'Past games you have analyzed or imported, persisted securely in your browser\'s local storage.',
    why: 'Instant offline access! Open previously analyzed matches immediately with zero re-downloading or re-calculation.',
  },

  // ==========================================
  // MOVE CLASSIFICATIONS & BADGES
  // ==========================================
  badge_brilliant: {
    title: 'Brilliant Move (!!)',
    category: 'MOVE QUALITY',
    what: 'A spectacular move that sacrifices material to gain a decisive positional or tactical advantage.',
    why: 'The highest honor in chess engine analysis. Requires deep calculation where the sacrifice is objectively winning.',
  },
  badge_great: {
    title: 'Great Move (!)',
    category: 'MOVE QUALITY',
    what: 'The only winning or saving move in a difficult, razor-sharp position.',
    why: 'Finding the sole critical move under pressure demonstrates exceptional calculation.',
  },
  badge_best: {
    title: 'Best Move (★)',
    category: 'MOVE QUALITY',
    what: 'The #1 top move recommended by Stockfish at maximum search depth.',
    why: 'Optimal engine play that preserves or maximizes your advantage.',
  },
  badge_excellent: {
    title: 'Excellent Move',
    category: 'MOVE QUALITY',
    what: 'A very strong move that is nearly as good as the engine\'s top choice.',
    why: 'Maintains positional dominance with virtually zero centipawn loss.',
  },
  badge_good: {
    title: 'Good Move',
    category: 'MOVE QUALITY',
    what: 'A solid, natural move that maintains the balance of the position.',
    why: 'Safe and logical development or defense.',
  },
  badge_book: {
    title: 'Book Move (📖)',
    category: 'MOVE QUALITY',
    what: 'A move adhering to established grandmaster opening theory from the ECO encyclopedia.',
    why: 'Follows proven theoretical development played by masters for decades.',
  },
  badge_forced: {
    title: 'Forced Move (🔒)',
    category: 'MOVE QUALITY',
    what: 'The only legal move available on the board in this position.',
    why: 'Usually occurs when escaping check with only one legal reply or in locked endgames.',
  },
  badge_inaccuracy: {
    title: 'Inaccuracy (?!)',
    category: 'MOVE QUALITY',
    what: 'A suboptimal move that gives away a portion of your advantage or slightly worsens your position.',
    why: 'Not an outright blunder, but lets the opponent equalize or gain the upper hand.',
  },
  badge_mistake: {
    title: 'Mistake (?)',
    category: 'MOVE QUALITY',
    what: 'A significant error that noticeably harms your position and changes the evaluation.',
    why: 'Drops a pawn, misplaces a critical piece, or concedes positional initiative.',
  },
  badge_blunder: {
    title: 'Blunder (??)',
    category: 'MOVE QUALITY',
    what: 'A catastrophic blunder that loses a piece, overlooks a tactical strike, or ruins a winning position.',
    why: 'The primary cause of game losses. Use the "Why?" button to learn from it.',
  },
  badge_missed_win: {
    title: 'Missed Win (≠)',
    category: 'MOVE QUALITY',
    what: 'A move that overlooked a forced checkmate or an immediate decisive winning tactic.',
    why: 'Lets the opponent stay in the game when victory was right at your fingertips.',
  },
  clock_discipline: {
    title: 'Clock Discipline & Time Flags',
    category: 'TIME MANAGEMENT',
    what: '⚡ indicates an Impulsive Rush (played in <2s with lots of time left); 🔥 indicates Time Trouble (<20s remaining).',
    why: 'Over 60% of amateur blunders happen from moving too quickly without checking for threats, or panic under low clock.',
  },
  action_why_modal: {
    title: 'Why? Modal Explanation',
    category: 'TACTICAL DEEP DIVE',
    what: 'Opens an interactive 5-ply continuation modal explaining why this move was classified as a blunder, mistake, or brilliant sacrifice.',
    why: 'See the exact moves the engine uses to punish your mistake or reward your sacrifice.',
  },
  btn_reanalyze: {
    title: 'Re-Analyze Game',
    category: 'ACTION',
    what: 'Clears the cached evaluation and runs fresh deep Stockfish analysis on this match.',
    why: 'Useful if you want to recalculate with fresh depth or verify tactical lines.',
  },
  btn_share: {
    title: 'Share Review Summary',
    category: 'ACTION',
    what: 'Copies a formatted text summary of this game review (accuracies, result, players, opening) to your clipboard.',
    why: 'Paste directly into Discord, Reddit, or chat with chess study partners.',
  },
  btn_clear_history: {
    title: 'Clear Saved History',
    category: 'ACTION',
    what: 'Clears cached games from your local browser storage.',
    why: 'Frees up local browser storage or resets your analyzed games list.',
  },

  // ==========================================
  // BOT ARENA & IMPORT
  // ==========================================
  bot_tier_filter: {
    title: 'Bot Rating Tiers',
    category: 'ARENA FILTER',
    what: 'Filter bots by skill level: Beginner (250-700), Casual (750-1200), Intermediate (1250-1650), Advanced (1700-2100), Master (2150-2850).',
    why: 'Select the optimal challenge tailored to your current Elo rating.',
  },
  bot_ctrl_undo: {
    title: 'Takeback / Undo Move',
    category: 'BOT ARENA',
    what: 'Undoes your last move and the bot\'s reply.',
    why: 'Ideal for training and experimenting: rewind a blunder and try a better move immediately.',
  },
  bot_ctrl_resign: {
    title: 'Resign Match',
    category: 'BOT ARENA',
    what: 'Concedes the current match against the bot.',
    why: 'End the current game when in an unwinnable position to start a fresh game or review.',
  },
  bot_ctrl_rematch: {
    title: 'Rematch',
    category: 'BOT ARENA',
    what: 'Starts a brand-new match against the current bot with the same or swapped colors.',
    why: 'Try a different opening or test what you learned from the previous game.',
  },
  bot_ctrl_review: {
    title: 'Review Game in Analyzer',
    category: 'BOT ARENA',
    what: 'Sends the match you just played against the bot directly into the Stockfish Review Dashboard.',
    why: 'Find your mistakes, calculate your accuracy %, and see where the bot outplayed you.',
  },
  import_chesscom: {
    title: 'Chess.com Profile Sync',
    category: 'IMPORT',
    what: 'Fetches recent public matches played on Chess.com using your public username via the official API.',
    why: 'Fast, one-click access to all your rapid, blitz, and bullet games with zero manual copy-pasting.',
  },
  import_pgn: {
    title: 'Custom PGN / FEN Import',
    category: 'IMPORT',
    what: 'Paste any PGN (Portable Game Notation) text or FEN string from Lichess, books, or tournaments.',
    why: 'Analyze classical games, master miniatures, or study puzzle positions in Chess IQ.',
  }
};

/**
 * Helper to render an accessible info icon button with a tooltip trigger.
 * @param {string} tipKey - Key from IQ_TOOLTIPS
 * @param {string} [extraClass=''] - Additional CSS classes
 * @param {string} [style=''] - Inline styles
 * @returns {string} HTML string
 */
function renderInfoIcon(tipKey, extraClass = '', style = '') {
  const tip = IQ_TOOLTIPS[tipKey];
  const titleAttr = tip ? insEscape(tip.title) : 'Information';
  return `<button type="button" class="iq-info-icon-btn ${extraClass}" data-iq-tip="${tipKey}" style="${style}" aria-label="${titleAttr}" title=""><i class="bi bi-info-circle"></i></button>`;
}

/**
 * Global Tooltip Controller Class
 */
class IqTooltipService {
  constructor() {
    this.tooltipEl = null;
    this.currentTrigger = null;
    this.hideTimeout = null;
    this.showTimeout = null;
    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;

    // Create single global tooltip container
    let el = document.getElementById('iq-global-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'iq-global-tooltip';
      el.className = 'iq-tooltip-card d-none';
      el.setAttribute('role', 'tooltip');
      document.body.appendChild(el);
    }
    this.tooltipEl = el;

    // Event Delegation: Mouse & Touch
    document.addEventListener('mouseover', (e) => this.handleMouseEnter(e));
    document.addEventListener('mouseout', (e) => this.handleMouseLeave(e));
    document.addEventListener('focusin', (e) => this.handleMouseEnter(e));
    document.addEventListener('focusout', (e) => this.handleMouseLeave(e));

    // Mobile click to toggle on touch devices
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-iq-tip], [data-iq-title]');
      if (trigger) {
        if (this.currentTrigger === trigger && !this.tooltipEl.classList.contains('d-none')) {
          this.hide();
        } else {
          this.show(trigger);
        }
      } else if (!e.target.closest('#iq-global-tooltip')) {
        this.hide();
      }
    });

    // Dismiss on scroll or escape key
    window.addEventListener('scroll', () => this.hide(), { passive: true });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  handleMouseEnter(e) {
    const trigger = e.target.closest('[data-iq-tip], [data-iq-title]');
    if (!trigger) return;

    clearTimeout(this.hideTimeout);
    clearTimeout(this.showTimeout);

    // Intentional hover delay (220ms) so accidental mouse passes do not trigger popups
    this.showTimeout = setTimeout(() => {
      this.show(trigger);
    }, 220);
  }

  handleMouseLeave(e) {
    const trigger = e.target.closest('[data-iq-tip], [data-iq-title]');
    if (trigger && trigger.hasAttribute('data-original-title')) {
      trigger.setAttribute('title', trigger.getAttribute('data-original-title'));
      trigger.removeAttribute('data-original-title');
    }
    if (!trigger) return;

    clearTimeout(this.showTimeout);
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, 120);
  }

  show(trigger) {
    this.currentTrigger = trigger;
    const tipKey = trigger.getAttribute('data-iq-tip');
    let title = trigger.getAttribute('data-iq-title');
    let category = trigger.getAttribute('data-iq-cat') || 'INFORMATION';
    let what = trigger.getAttribute('data-iq-what');
    let why = trigger.getAttribute('data-iq-why');
    let how = trigger.getAttribute('data-iq-how');
    let shortcut = trigger.getAttribute('data-iq-shortcut');

    if (tipKey && IQ_TOOLTIPS[tipKey]) {
      const data = IQ_TOOLTIPS[tipKey];
      title = title || data.title;
      category = data.category || category;
      what = what || data.what;
      why = why || data.why;
      how = how || data.how;
      shortcut = shortcut || data.shortcut;
    }

    // Fallback if only basic title exists
    if (!title && trigger.getAttribute('title')) {
      title = trigger.getAttribute('title');
      trigger.setAttribute('data-original-title', title);
      trigger.removeAttribute('title'); // Prevent native browser tooltip collision
    }

    if (!title && !what) return;

    // Render tooltip content
    this.tooltipEl.innerHTML = `
      <div class="iq-tooltip-header">
        <div class="d-flex align-items-center gap-1.5 min-w-0">
          <span class="iq-tooltip-badge">${insEscape(category)}</span>
          <span class="iq-tooltip-title text-truncate">${insEscape(title)}</span>
        </div>
        ${shortcut ? `<span class="iq-tooltip-shortcut">${insEscape(shortcut)}</span>` : ''}
      </div>
      <div class="iq-tooltip-body">
        ${what ? `
          <div class="iq-tooltip-row">
            <span class="iq-tooltip-label text-warning">What:</span>
            <span class="iq-tooltip-text">${insEscape(what)}</span>
          </div>
        ` : ''}
        ${why ? `
          <div class="iq-tooltip-row mt-1.5 pt-1.5 border-top border-secondary border-opacity-25">
            <span class="iq-tooltip-label text-info">Why:</span>
            <span class="iq-tooltip-text">${insEscape(why)}</span>
          </div>
        ` : ''}
        ${how ? `
          <div class="iq-tooltip-row mt-1.5 pt-1.5 border-top border-secondary border-opacity-25">
            <span class="iq-tooltip-label text-success">How:</span>
            <span class="iq-tooltip-text">${insEscape(how)}</span>
          </div>
        ` : ''}
      </div>
      <div class="iq-tooltip-arrow"></div>
    `;

    this.tooltipEl.classList.remove('d-none');
    this.position(trigger);
  }

  position(trigger) {
    if (!this.tooltipEl || !trigger) return;

    const tRect = trigger.getBoundingClientRect();
    const tipRect = this.tooltipEl.getBoundingClientRect();
    const margin = 8;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // Default: position on top of target
    let top = tRect.top - tipRect.height - margin;
    let arrowPos = 'bottom';

    // If no room on top, position below
    if (top < 10) {
      top = tRect.bottom + margin;
      arrowPos = 'top';
      // If no room below either, clamp
      if (top + tipRect.height > viewH - 10) {
        top = Math.max(10, viewH - tipRect.height - 10);
      }
    }

    // Horizontal centering
    let left = tRect.left + (tRect.width / 2) - (tipRect.width / 2);
    // Clamp horizontally to stay inside viewport
    if (left < 10) left = 10;
    if (left + tipRect.width > viewW - 10) left = viewW - tipRect.width - 10;

    this.tooltipEl.style.top = `${Math.round(top + window.scrollY)}px`;
    this.tooltipEl.style.left = `${Math.round(left + window.scrollX)}px`;

    // Position arrow relative to trigger center
    const arrow = this.tooltipEl.querySelector('.iq-tooltip-arrow');
    if (arrow) {
      const triggerCenter = tRect.left + (tRect.width / 2) - left;
      const arrowLeft = Math.max(12, Math.min(tipRect.width - 12, triggerCenter));
      arrow.style.left = `${arrowLeft}px`;
      arrow.className = `iq-tooltip-arrow arrow-${arrowPos}`;
    }
  }

  hide() {
    clearTimeout(this.showTimeout);
    if (this.tooltipEl) {
      this.tooltipEl.classList.add('d-none');
    }
    this.currentTrigger = null;
  }
}

// Global instance
let iqTooltipInstance = null;
function initGlobalTooltips() {
  if (!iqTooltipInstance) {
    iqTooltipInstance = new IqTooltipService();
  }
  return iqTooltipInstance;
}

if (typeof window !== 'undefined') {
  window.IQ_TOOLTIPS = IQ_TOOLTIPS;
  window.renderInfoIcon = renderInfoIcon;
  window.initGlobalTooltips = initGlobalTooltips;
}
if (typeof globalThis !== 'undefined') {
  globalThis.IQ_TOOLTIPS = IQ_TOOLTIPS;
  globalThis.renderInfoIcon = renderInfoIcon;
  globalThis.initGlobalTooltips = initGlobalTooltips;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IQ_TOOLTIPS, renderInfoIcon, initGlobalTooltips };
}
