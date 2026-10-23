import fs from 'node:fs';

const targets = {
  'app-data.js': [
    'src/components/pieceSvgs.js',
    'src/services/comicBadges.js',
    'src/services/ecoDictionary.js',
    'src/data/botsData.js',
  ],
  'app-services.js': [
    'src/services/sound.js',
    'src/services/stockfishWorker.js',
    'src/services/engineEvaluationTables.js',
    'src/services/engine.js',
    'src/services/engineRefutations.js',
    'src/services/gameCacheService.js',
    'src/services/importApi.js',
    'src/services/insightsAggregate.js',
    'src/services/backgroundAnalysisQueue.js',
    'src/services/insightsService.js',
  ],
  'app-components.js': [
    'src/components/board.js',
    'src/components/botGameOverModal.js',
    'src/components/botArena.js',
    'src/components/reviewAdvantageChart.js',
    'src/components/reviewRetryMistake.js',
    'src/components/reviewWhyModal.js',
    'src/components/insightsCharts.js',
    'src/components/insightsModal.js',
    'src/components/importModal.js',
    'src/components/reviewDashboard.js',
  ],
  'app-main.js': [
    'src/main.js',
  ],
};

const header = `/* ChessIQ Client Bundle */
var Chess = typeof window !== 'undefined' ? window.Chess : null;
var bootstrap = typeof window !== 'undefined' ? window.bootstrap : null;
var confetti = typeof window !== 'undefined' ? (window.confetti || function() {}) : function() {};

if (Chess && Chess.prototype) {
  if (!Chess.prototype.loadPgn && typeof Chess.prototype.load_pgn === 'function') {
    Chess.prototype.loadPgn = function(pgn, options) { return this.load_pgn(pgn, options); };
  }
  if (!Chess.prototype.isGameOver && typeof Chess.prototype.game_over === 'function') {
    Chess.prototype.isGameOver = function() { return this.game_over(); };
  }
  if (!Chess.prototype.isCheckmate && typeof Chess.prototype.in_checkmate === 'function') {
    Chess.prototype.isCheckmate = function() { return this.in_checkmate(); };
  }
  if (!Chess.prototype.isDraw && typeof Chess.prototype.in_draw === 'function') {
    Chess.prototype.isDraw = function() { return this.in_draw(); };
  }
  if (!Chess.prototype.inCheck && typeof Chess.prototype.in_check === 'function') {
    Chess.prototype.inCheck = function() { return this.in_check(); };
  }
  if (!Chess.prototype.isStalemate && typeof Chess.prototype.in_stalemate === 'function') {
    Chess.prototype.isStalemate = function() { return this.in_stalemate(); };
  }
  if (!Chess.prototype.isThreefoldRepetition && typeof Chess.prototype.in_threefold_repetition === 'function') {
    Chess.prototype.isThreefoldRepetition = function() { return this.in_threefold_repetition(); };
  }
  if (!Chess.prototype.isInsufficientMaterial && typeof Chess.prototype.insufficient_material === 'function') {
    Chess.prototype.isInsufficientMaterial = function() { return this.insufficient_material(); };
  }
}
`;

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import\s+(?:\{[\s\S]*?\}|[\w*\s,]+)\s+from\s+['"][^'"]+['"];?/g, '');
  content = content.replace(/import\s+['"][^'"]+['"];?/g, '');
  content = content.replace(/^export\s+(default\s+)?(const|let|var)\s+/gm, 'var ');
  content = content.replace(/^export\s+(default\s+)?(async\s+function|function|class)\s+/gm, '$2 ');
  content = content.replace(/export\s*\{[\s\S]*?\};?/g, '');
  content = content.replace(/^export\s+default\s+.*?;?\s*$/gm, '');
  content = content.replace(/^(const|let|var)\s+Chess\s*=\s*window\.Chess;?\s*$/gm, '');
  content = content.replace(/^(const|let|var)\s+confetti\s*=\s*window\.confetti.*?;?\s*$/gm, '');
  content = content.replace(/^(const|let|var)\s+bootstrap\s*=\s*window\.bootstrap;?\s*$/gm, '');
  return '\n/* --- ' + filePath + ' --- */\n' + content.trim() + '\n';
}

for (const [targetName, srcFiles] of Object.entries(targets)) {
  let body = header;
  for (const src of srcFiles) {
    body += transformFile(src);
  }

  // Ensure exported classes are attached to window
  body += `
if (typeof window !== 'undefined') {
  if (typeof Chessboard !== 'undefined') window.Chessboard = Chessboard;
  if (typeof BotArena !== 'undefined') window.BotArena = BotArena;
  if (typeof ReviewDashboard !== 'undefined') window.ReviewDashboard = ReviewDashboard;
  if (typeof ImportModal !== 'undefined') window.ImportModal = ImportModal;
  if (typeof StockfishPool !== 'undefined') window.StockfishPool = StockfishPool;
  if (typeof BackgroundAnalysisQueue !== 'undefined') window.BackgroundAnalysisQueue = BackgroundAnalysisQueue;
  if (typeof SoundService !== 'undefined') window.SoundService = SoundService;
}
`;

  fs.writeFileSync(targetName, body);
  console.log(`Built ${targetName} (${(body.length / 1024).toFixed(1)} KB)`);
}

if (!fs.existsSync('stockfish.js') && fs.existsSync('public/stockfish.js')) {
  fs.copyFileSync('public/stockfish.js', 'stockfish.js');
}
