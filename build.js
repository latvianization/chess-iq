import fs from 'node:fs';

const files = [
  'src/components/pieceSvgs.js',
  'src/services/comicBadges.js',
  'src/services/sound.js',
  'src/services/ecoDictionary.js',
  'src/data/botsData.js',
  'src/services/stockfishWorker.js',
  'src/services/engine.js',
  'src/services/importApi.js',
  'src/components/board.js',
  'src/components/botArena.js',
  'src/components/reviewDashboard.js',
  'src/components/importModal.js',
  'src/main.js'
];

let body = '';
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import\s+(?:\{[\s\S]*?\}|[\w*\s,]+)\s+from\s+['"][^'"]+['"];?/g, '');
  content = content.replace(/import\s+['"][^'"]+['"];?/g, '');
  content = content.replace(/^export\s+(default\s+)?(async\s+function|function|class|const|let|var)\s+/gm, '$2 ');
  content = content.replace(/export\s*\{[\s\S]*?\};?/g, '');
  content = content.replace(/^export\s+default\s+.*?;?\s*$/gm, '');
  content = content.replace(/^const\s+Chess\s*=\s*window\.Chess;?\s*$/gm, '');
  content = content.replace(/^const\s+confetti\s*=\s*window\.confetti.*?;?\s*$/gm, '');
  content = content.replace(/^const\s+bootstrap\s*=\s*window\.bootstrap;?\s*$/gm, '');
  body += '\n/* --- ' + f + ' --- */\n' + content.trim() + '\n';
}

const header = `(function() {
  "use strict";
  const Chess = window.Chess;
  if (Chess && Chess.prototype) {
    if (!Chess.prototype.loadPgn && typeof Chess.prototype.load_pgn === "function") {
      Chess.prototype.loadPgn = function(pgn, options) { return this.load_pgn(pgn, options); };
    }
    if (!Chess.prototype.isGameOver && typeof Chess.prototype.game_over === "function") {
      Chess.prototype.isGameOver = function() { return this.game_over(); };
    }
    if (!Chess.prototype.isCheckmate && typeof Chess.prototype.in_checkmate === "function") {
      Chess.prototype.isCheckmate = function() { return this.in_checkmate(); };
    }
    if (!Chess.prototype.isDraw && typeof Chess.prototype.in_draw === "function") {
      Chess.prototype.isDraw = function() { return this.in_draw(); };
    }
    if (!Chess.prototype.inCheck && typeof Chess.prototype.in_check === "function") {
      Chess.prototype.inCheck = function() { return this.in_check(); };
    }
    if (!Chess.prototype.isStalemate && typeof Chess.prototype.in_stalemate === "function") {
      Chess.prototype.isStalemate = function() { return this.in_stalemate(); };
    }
    if (!Chess.prototype.isThreefoldRepetition && typeof Chess.prototype.in_threefold_repetition === "function") {
      Chess.prototype.isThreefoldRepetition = function() { return this.in_threefold_repetition(); };
    }
    if (!Chess.prototype.isInsufficientMaterial && typeof Chess.prototype.insufficient_material === "function") {
      Chess.prototype.isInsufficientMaterial = function() { return this.insufficient_material(); };
    }
  }
  const confetti = window.confetti || function() {};
  const bootstrap = window.bootstrap;
`;

const footer = `\n})();\n`;

fs.writeFileSync('app.js', header + body + footer);
