/* ChessIQ Client Bundle */
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

/* --- src/components/board.js --- */
/**
 * Vanilla JS Chessboard Component
 * Renders an interactive 8x8 chessboard with SVG piece rendering,
 * move highlights, arrows, comic sound effect badges, captured pieces,
 * in-check King highlight, and drag-and-drop move interaction.
 */


const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const THEMES = {
  green: { light: '#ebecd0', dark: '#739552' },
  wood: { light: '#f0d9b5', dark: '#b58863' },
  icy: { light: '#dee3e6', dark: '#587a9f' },
};

function getCapturedPiecesAndDiff(fen) {
  const STARTING = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
  };
  const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const current = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };

  const placement = (fen || '').split(' ')[0] || '';
  for (const char of placement) {
    if (/[pnbrq]/i.test(char)) {
      const color = char === char.toUpperCase() ? 'w' : 'b';
      const type = char.toLowerCase();
      if (current[color] && current[color][type] !== undefined) {
        current[color][type]++;
      }
    }
  }

  const capturedByWhite = [];
  ['q', 'r', 'b', 'n', 'p'].forEach((type) => {
    const missing = Math.max(0, STARTING.b[type] - current.b[type]);
    for (let i = 0; i < missing; i++) capturedByWhite.push(`b${type.toUpperCase()}`);
  });

  const capturedByBlack = [];
  ['q', 'r', 'b', 'n', 'p'].forEach((type) => {
    const missing = Math.max(0, STARTING.w[type] - current.w[type]);
    for (let i = 0; i < missing; i++) capturedByBlack.push(`w${type.toUpperCase()}`);
  });

  let whiteMaterial = 0;
  let blackMaterial = 0;
  Object.keys(PIECE_VALUES).forEach((type) => {
    whiteMaterial += current.w[type] * PIECE_VALUES[type];
    blackMaterial += current.b[type] * PIECE_VALUES[type];
  });

  const diff = whiteMaterial - blackMaterial;

  return {
    capturedByWhite,
    capturedByBlack,
    whiteDiff: diff > 0 ? diff : 0,
    blackDiff: diff < 0 ? Math.abs(diff) : 0
  };
}

class Chessboard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.fen = options.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.orientation = options.orientation || 'w';
    this.theme = options.theme || 'green';
    this.interactive = options.interactive || false;
    this.showPlayerBars = options.showPlayerBars !== undefined ? options.showPlayerBars : true;
    this.whiteName = options.whiteName || 'White';
    this.blackName = options.blackName || 'Black';
    this.onMove = options.onMove || null; // (from, to) => {}
    this.legalMovesFrom = options.legalMovesFrom || null; // (square) => string[] destinations
    this.lastMove = options.lastMove || null; // { from, to }
    this.bestMove = options.bestMove || null; // { from, to }
    this.secondBestMove = options.secondBestMove || null; // { from, to }
    this.threatMove = options.threatMove || null; // { from, to }
    this.badge = options.badge || null; // { square, classification }

    this.selectedSquare = null;
    this.possibleDests = [];
    this.lastAnimatedMoveKey = null;
    this.userArrows = [];
    this.userHighlights = new Set();
    this.rightClickStartSquare = null;

    this.render();
  }

  setProps(newProps) {
    let shouldRerender = false;
    ['fen', 'orientation', 'theme', 'interactive', 'showPlayerBars', 'whiteName', 'blackName', 'onMove', 'legalMovesFrom', 'lastMove', 'bestMove', 'secondBestMove', 'threatMove', 'badge'].forEach((k) => {
      if (newProps[k] !== undefined && newProps[k] !== this[k]) {
        this[k] = newProps[k];
        shouldRerender = true;
      }
    });

    if (newProps.selectedSquare !== undefined) {
      this.selectedSquare = newProps.selectedSquare;
      this.possibleDests = this.legalMovesFrom && this.selectedSquare ? this.legalMovesFrom(this.selectedSquare) : [];
      shouldRerender = true;
    }

    if (shouldRerender) {
      this.render();
    }
  }

  parseFen(fen) {
    const rows = (fen || '').split(' ')[0].split('/');
    const board = [];
    for (const r of rows) {
      const row = [];
      for (const char of r) {
        if (/\d/.test(char)) {
          const emptyCount = parseInt(char, 10);
          for (let i = 0; i < emptyCount; i++) row.push(null);
        } else {
          row.push(char);
        }
      }
      board.push(row);
    }
    return board;
  }

  handleSquareClick(square, piece) {
    if (!this.interactive) return;

    if (this.selectedSquare) {
      if (this.selectedSquare === square) {
        this.selectedSquare = null;
        this.possibleDests = [];
        this.render();
        return;
      }

      if (this.possibleDests.includes(square)) {
        const from = this.selectedSquare;
        this.selectedSquare = null;
        this.possibleDests = [];
        if (this.onMove) {
          this.onMove(from, square);
        }
        return;
      }
    }

    if (piece) {
      this.selectedSquare = square;
      this.possibleDests = this.legalMovesFrom ? this.legalMovesFrom(square) : [];
      this.render();
    } else {
      this.selectedSquare = null;
      this.possibleDests = [];
      this.render();
    }
  }

  createPlayerBar(color, capturedData) {
    const isWhite = color === 'w';
    const name = isWhite ? (this.whiteName || 'White') : (this.blackName || 'Black');
    const captured = isWhite ? capturedData.capturedByWhite : capturedData.capturedByBlack;
    const diff = isWhite ? capturedData.whiteDiff : capturedData.blackDiff;

    const bar = document.createElement('div');
    bar.className = 'board-player-bar';

    const left = document.createElement('div');
    left.className = 'd-flex align-items-center gap-1.5 min-w-0';
    left.innerHTML = `
      <span style="font-size: 13px; line-height: 1;">${isWhite ? '⚪' : '⚫'}</span>
      <span class="text-truncate fw-bold" style="max-width: 160px;">${name}</span>
    `;

    const right = document.createElement('div');
    right.className = 'd-flex align-items-center';

    const piecesDiv = document.createElement('div');
    piecesDiv.className = 'board-captured-pieces';
    captured.forEach((pKey) => {
      const pSrc = INLINE_PIECE_DATA_URLS[pKey] || `./pieces/${pKey}.svg`;
      const pImg = document.createElement('img');
      pImg.src = pSrc;
      pImg.className = 'captured-piece-img';
      pImg.alt = pKey;
      piecesDiv.appendChild(pImg);
    });

    right.appendChild(piecesDiv);

    if (diff > 0) {
      const diffBadge = document.createElement('span');
      diffBadge.className = 'material-diff-badge bg-body-secondary text-secondary';
      diffBadge.textContent = `+${diff}`;
      right.appendChild(diffBadge);
    }

    bar.appendChild(left);
    bar.appendChild(right);
    return bar;
  }

  render() {
    this.container.innerHTML = '';

    const board = this.parseFen(this.fen);
    const files = this.orientation === 'w' ? FILES : [...FILES].reverse();
    const ranks = this.orientation === 'w' ? RANKS : [...RANKS].reverse();
    const themeColors = THEMES[this.theme] || THEMES.green;
    const pendingAnimations = [];

    let checkSquare = null;
    try {
      if (Chess) {
        const c = new Chess(this.fen);
        if (typeof c.in_check === 'function' && c.in_check()) {
          const turn = c.turn();
          const kingChar = turn === 'w' ? 'K' : 'k';
          ranks.forEach((r) => {
            files.forEach((f) => {
              const origR = RANKS.indexOf(r);
              const origF = FILES.indexOf(f);
              if (board[origR] && board[origR][origF] === kingChar) {
                checkSquare = `${f}${r}`;
              }
            });
          });
        }
      }
    } catch {}

    const capturedData = getCapturedPiecesAndDiff(this.fen);

    const outerWrapper = document.createElement('div');
    outerWrapper.className = 'd-flex flex-column align-items-center w-100';

    const topColor = this.orientation === 'w' ? 'b' : 'w';
    const bottomColor = this.orientation === 'w' ? 'w' : 'b';

    if (this.showPlayerBars) {
      outerWrapper.appendChild(this.createPlayerBar(topColor, capturedData));
    }

    const boardWrapper = document.createElement('div');
    boardWrapper.className = 'board-container';

    const grid = document.createElement('div');
    grid.className = 'board-grid';

    ranks.forEach((rank, rIdx) => {
      files.forEach((file, fIdx) => {
        const square = `${file}${rank}`;
        const isDark = (rIdx + fIdx) % 2 === 1;
        const squareColor = isDark ? themeColors.dark : themeColors.light;

        const sqDiv = document.createElement('div');
        sqDiv.className = 'board-square';
        sqDiv.dataset.square = square;

        const isLastMove = this.lastMove && (this.lastMove.from === square || this.lastMove.to === square);
        const isSelected = this.selectedSquare === square;
        const isCheck = checkSquare === square;

        if (isCheck) {
          sqDiv.classList.add('in-check');
        } else if (isSelected) {
          sqDiv.classList.add('selected');
        } else if (isLastMove) {
          sqDiv.classList.add(isDark ? 'last-move-dark' : 'last-move-light');
        } else {
          sqDiv.style.backgroundColor = squareColor;
        }

        if (this.userHighlights.has(square)) {
          sqDiv.style.boxShadow = 'inset 0 0 0 4px rgba(245, 158, 11, 0.85)';
        }

        if (rIdx === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'square-coord-file';
          fileLabel.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)';
          fileLabel.textContent = file;
          sqDiv.appendChild(fileLabel);
        }
        if (fIdx === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'square-coord-rank';
          rankLabel.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)';
          rankLabel.textContent = rank;
          sqDiv.appendChild(rankLabel);
        }

        const origR = RANKS.indexOf(rank);
        const origF = FILES.indexOf(file);
        const pieceChar = board[origR] ? board[origR][origF] : null;

        if (pieceChar) {
          const colorCode = pieceChar === pieceChar.toUpperCase() ? 'w' : 'b';
          const typeCode = pieceChar.toUpperCase();
          const pieceKey = `${colorCode}${typeCode}`;
          const pieceSrc = INLINE_PIECE_DATA_URLS[pieceKey] || `./pieces/${pieceKey}.svg`;

          const img = document.createElement('img');
          img.src = pieceSrc;
          img.className = 'piece-img';
          img.alt = `${colorCode === 'w' ? 'White' : 'Black'} ${typeCode}`;

          if (this.interactive) {
            img.draggable = true;

            img.addEventListener('dragstart', (e) => {
              if (!this.interactive) {
                e.preventDefault();
                return;
              }
              this.selectedSquare = square;
              this.possibleDests = this.legalMovesFrom ? this.legalMovesFrom(square) : [];
              this.render();

              e.dataTransfer.setData('text/plain', square);
              e.dataTransfer.effectAllowed = 'move';
              img.classList.add('is-dragging');
            });

            img.addEventListener('dragend', () => {
              img.classList.remove('is-dragging');
              this.container.querySelectorAll('.board-square').forEach((s) => s.classList.remove('drag-over'));
            });
          } else {
            img.draggable = false;
          }

          if (this.lastMove && this.lastMove.to === square && this.lastMove.from) {
            const currentMoveKey = `${this.lastMove.from}-${this.lastMove.to}-${this.fen}`;
            if (this.lastAnimatedMoveKey !== currentMoveKey) {
              const fromF = this.lastMove.from[0];
              const fromR = this.lastMove.from[1];
              const fromX = files.indexOf(fromF);
              const fromY = ranks.indexOf(fromR);
              const toX = fIdx;
              const toY = rIdx;
              if (fromX !== -1 && fromY !== -1) {
                const deltaX = (fromX - toX) * 100;
                const deltaY = (fromY - toY) * 100;
                img.style.transform = `translate(${deltaX}%, ${deltaY}%)`;
                img.style.transition = 'none';
                img.style.zIndex = '20';
                this.lastAnimatedMoveKey = currentMoveKey;
                pendingAnimations.push(img);
              }
            }
          }

          sqDiv.appendChild(img);
        }

        if (this.possibleDests.includes(square)) {
          if (pieceChar) {
            sqDiv.classList.add('capture-target');
          } else {
            const dot = document.createElement('div');
            dot.className = 'move-dot';
            sqDiv.appendChild(dot);
          }
        }

        if (this.badge && this.badge.square === square) {
          const comic = getComicBadge(this.badge.classification, square);
          const badgeEl = document.createElement('div');
          badgeEl.className = 'comic-square-badge';
          badgeEl.style.backgroundColor = comic.bg;
          badgeEl.style.color = comic.text;
          badgeEl.title = `${comic.term} (${COMIC_DICTIONARY[this.badge.classification]?.standardLabel || ''})`;
          badgeEl.innerHTML = `<span>${comic.symbol}</span><span>${comic.term}</span>`;
          sqDiv.appendChild(badgeEl);
        }

        if (this.interactive) {
          sqDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!sqDiv.classList.contains('drag-over')) {
              sqDiv.classList.add('drag-over');
            }
          });

          sqDiv.addEventListener('dragleave', (e) => {
            if (e.relatedTarget && sqDiv.contains(e.relatedTarget)) return;
            sqDiv.classList.remove('drag-over');
          });

          sqDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            sqDiv.classList.remove('drag-over');
            const from = e.dataTransfer.getData('text/plain') || this.selectedSquare;
            const to = square;

            if (from && to && from !== to && this.possibleDests.includes(to)) {
              this.selectedSquare = null;
              this.possibleDests = [];
              if (this.onMove) {
                this.onMove(from, to);
              }
            } else if (from && from === to) {
              this.selectedSquare = null;
              this.possibleDests = [];
              this.render();
            }
          });
        }

        sqDiv.addEventListener('click', () => {
          this.handleSquareClick(square, pieceChar);
        });

        grid.appendChild(sqDiv);
      });
    });

    boardWrapper.appendChild(grid);

    const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttribute('class', 'position-absolute top-0 start-0 w-100 h-100 pointer-events-none');
    svgLayer.style.pointerEvents = 'none';
    svgLayer.style.zIndex = '15';

    if (this.secondBestMove && this.secondBestMove.from && this.secondBestMove.to) {
      this.drawArrow(svgLayer, this.secondBestMove.from, this.secondBestMove.to, '#10b981', false, 'second-best-move', 2.2);
    }
    if (this.bestMove && this.bestMove.from && this.bestMove.to) {
      this.drawArrow(svgLayer, this.bestMove.from, this.bestMove.to, '#10b981', false, 'best-move', 4.8);
    }
    if (this.threatMove && this.threatMove.from && this.threatMove.to) {
      this.drawArrow(svgLayer, this.threatMove.from, this.threatMove.to, '#ef4444', true, 'threat-move', 3.5);
    }
    this.userArrows.forEach((arr, idx) => {
      this.drawArrow(svgLayer, arr.from, arr.to, '#f59e0b', false, `user-${idx}`, 3.8);
    });

    boardWrapper.appendChild(svgLayer);

    boardWrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    boardWrapper.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (this.userArrows.length > 0 || this.userHighlights.size > 0) {
          this.userArrows = [];
          this.userHighlights.clear();
          this.render();
        }
      } else if (e.button === 2) {
        const sqEl = e.target.closest('[data-square]');
        this.rightClickStartSquare = sqEl ? sqEl.dataset.square : null;
      }
    });

    boardWrapper.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        const sqEl = e.target.closest('[data-square]');
        const endSq = sqEl ? sqEl.dataset.square : null;
        if (this.rightClickStartSquare && endSq) {
          if (this.rightClickStartSquare === endSq) {
            if (this.userHighlights.has(endSq)) {
              this.userHighlights.delete(endSq);
            } else {
              this.userHighlights.add(endSq);
            }
          } else {
            const existingIdx = this.userArrows.findIndex(
              (a) => a.from === this.rightClickStartSquare && a.to === endSq
            );
            if (existingIdx !== -1) {
              this.userArrows.splice(existingIdx, 1);
            } else {
              this.userArrows.push({ from: this.rightClickStartSquare, to: endSq });
            }
          }
          this.render();
        }
        this.rightClickStartSquare = null;
      }
    });

    outerWrapper.appendChild(boardWrapper);

    if (this.showPlayerBars) {
      outerWrapper.appendChild(this.createPlayerBar(bottomColor, capturedData));
    }

    this.container.appendChild(outerWrapper);

    if (pendingAnimations.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pendingAnimations.forEach((imgEl) => {
            imgEl.style.transition = 'transform 220ms cubic-bezier(0.25, 1, 0.5, 1)';
            imgEl.style.transform = 'translate(0, 0)';
            setTimeout(() => {
              imgEl.style.zIndex = '';
              imgEl.classList.add('piece-landing-pop');
              setTimeout(() => imgEl.classList.remove('piece-landing-pop'), 200);
            }, 220);
          });
        });
      });
    }
  }

  drawArrow(svg, fromSq, toSq, color, dashed = false, idPrefix = 'arrow', strokeWidth = 3.5) {
    const getCoords = (sq) => {
      if (!sq || sq.length < 2) return null;
      const f = sq[0];
      const r = sq[1];
      const files = this.orientation === 'w' ? FILES : [...FILES].reverse();
      const ranks = this.orientation === 'w' ? RANKS : [...RANKS].reverse();
      const x = files.indexOf(f);
      const y = ranks.indexOf(r);
      if (x === -1 || y === -1) return null;
      return { x, y };
    };

    const c1 = getCoords(fromSq);
    const c2 = getCoords(toSq);
    if (!c1 || !c2) return;

    const x1 = (c1.x + 0.5) * 12.5;
    const y1 = (c1.y + 0.5) * 12.5;
    const x2 = (c2.x + 0.5) * 12.5;
    const y2 = (c2.y + 0.5) * 12.5;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;

    const isThick = strokeWidth >= 4;
    const isThin = strokeWidth <= 2.5;
    const markerW = isThick ? 7 : (isThin ? 4.5 : 6);
    const markerH = isThick ? 7 : (isThin ? 4.5 : 6);
    const refX = markerW * 0.65;
    const refY = markerH * 0.5;

    const endX = x1 + Math.cos(angle) * (dist - (isThick ? 3.8 : 3.2));
    const endY = y1 + Math.sin(angle) * (dist - (isThick ? 3.8 : 3.2));

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', `marker-${idPrefix}`);
    marker.setAttribute('markerWidth', String(markerW));
    marker.setAttribute('markerHeight', String(markerH));
    marker.setAttribute('refX', String(refX));
    marker.setAttribute('refY', String(refY));
    marker.setAttribute('orient', 'auto');

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', `0 0, ${markerW} ${refY}, 0 ${markerH}`);
    polygon.setAttribute('fill', color);
    polygon.setAttribute('opacity', isThin ? '0.75' : '0.9');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', `${x1}%`);
    line.setAttribute('y1', `${y1}%`);
    line.setAttribute('x2', `${endX}%`);
    line.setAttribute('y2', `${endY}%`);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('opacity', isThin ? '0.75' : '0.9');
    if (dashed) {
      line.setAttribute('stroke-dasharray', '5,5');
    }
    line.setAttribute('marker-end', `url(#marker-${idPrefix})`);
    svg.appendChild(line);
  }
}

/* --- src/components/botGameOverModal.js --- */
function closeGameOverModal() {
  const existing = document.getElementById('bot-game-over-modal');
  if (existing) existing.remove();
}

function getBotRecords() {
  try {
    return JSON.parse(localStorage.getItem('chess_iq_bot_records') || '{}');
  } catch {
    return {};
  }
}

function recordBotResult(botId, result) {
  try {
    const records = getBotRecords();
    if (!records[botId]) records[botId] = { wins: 0, losses: 0, draws: 0 };
    if (result === 'win') records[botId].wins = (records[botId].wins || 0) + 1;
    else if (result === 'loss') records[botId].losses = (records[botId].losses || 0) + 1;
    else if (result === 'draw') records[botId].draws = (records[botId].draws || 0) + 1;
    localStorage.setItem('chess_iq_bot_records', JSON.stringify(records));
  } catch {}
}

function showGameOverModal(arena, reason = 'Game Completed') {
  closeGameOverModal();

  const isWin = arena.gameResult === 'win';
  const isLoss = arena.gameResult === 'loss';

  let resultBadgeClass = 'bg-secondary text-white';
  let resultTitle = 'DRAW';
  let resultIcon = '🤝';
  if (isWin) {
    resultBadgeClass = 'bg-success text-white border border-light';
    resultTitle = 'VICTORY!';
    resultIcon = '🏆';
  } else if (isLoss) {
    resultBadgeClass = 'bg-danger text-white border border-light';
    resultTitle = 'DEFEAT';
    resultIcon = '💀';
  }

  const durationSec = Math.max(1, Math.floor((Date.now() - arena.gameStartTime) / 1000));
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const moveCount = Math.ceil(arena.chess.history().length / 2);

  const modal = document.createElement('div');
  modal.className = 'game-over-modal-backdrop';
  modal.id = 'bot-game-over-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(5,7,12,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = `
    <div class="game-over-dialog comic-card p-4 text-center border-0 shadow-lg" style="max-width: 460px; width: 100%; border-radius: 1.5rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);">
      <div class="mb-3">
        <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-2" style="background: ${isWin ? 'rgba(16,185,129,0.15)' : (isLoss ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)')};">
          <span style="font-size: 3rem; line-height: 1;">${resultIcon}</span>
        </div>
        <h2 class="fw-black mb-1 tracking-tight ${isWin ? 'text-success' : (isLoss ? 'text-danger' : 'text-body')}">${resultTitle}</h2>
        <div class="text-secondary small fw-bold">Game Over · ${reason}</div>
      </div>

      <div class="d-flex align-items-center justify-content-center gap-3 p-3 rounded-3 mb-3" style="background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);">
        <span class="fs-1">${arena.selectedBot.avatar}</span>
        <div class="text-start">
          <div class="fw-black fs-5">${arena.selectedBot.name}</div>
          <div class="d-flex align-items-center gap-1.5 mt-0.5">
            <span class="badge bg-warning text-dark fw-bold">${arena.selectedBot.elo} Elo</span>
            <span class="badge bg-secondary">${arena.selectedBot.title}</span>
          </div>
        </div>
      </div>

      <div class="row g-2 mb-4 text-center">
        <div class="col-4">
          <div class="p-2.5 rounded-3" style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);">
            <div class="text-secondary small fw-bold">Moves</div>
            <div class="fw-black fs-5">${moveCount}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2.5 rounded-3" style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);">
            <div class="text-secondary small fw-bold">Time</div>
            <div class="fw-black fs-5">${durationStr}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="p-2.5 rounded-3" style="background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);">
            <div class="text-secondary small fw-bold">Side</div>
            <div class="fw-black fs-5">${arena.userColor === 'w' ? '⚪ White' : '⚫ Black'}</div>
          </div>
        </div>
      </div>

      <div class="d-flex flex-column gap-2">
        <button type="button" class="arcade-btn-primary py-2.5 fw-black fs-6 w-100 d-flex align-items-center justify-content-center gap-2" id="modal-btn-review">
          <i class="bi bi-lightning-charge-fill"></i> Review Game with Stockfish ⚡
        </button>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-light comic-btn flex-grow-1 py-2 fw-bold" id="modal-btn-rematch">
            <i class="bi bi-arrow-repeat me-1"></i> Rematch
          </button>
          <button type="button" class="btn btn-outline-secondary comic-btn flex-grow-1 py-2 fw-bold" id="modal-btn-close">
            <i class="bi bi-x-lg me-1"></i> Close
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#modal-btn-review')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (btn) {
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Preparing Review...`;
      btn.classList.add('disabled');
    }
    closeGameOverModal();
    if (arena.onAnalyzeGame) {
      arena.onAnalyzeGame(arena.getEnrichedPgn(), arena.userColor);
    }
  });

  modal.querySelector('#modal-btn-rematch')?.addEventListener('click', () => {
    closeGameOverModal();
    arena.startNewGame();
  });

  modal.querySelector('#modal-btn-close')?.addEventListener('click', () => {
    closeGameOverModal();
  });
}

/* --- src/components/botArena.js --- */
/**
 * Vanilla JS Bot Arena Component
 * Provides 33 tiered bots (400–2000 Elo in 50-point increments),
 * quick Elo slider, tier tabs, live gameplay, and dynamic personality speech bubbles.
 */



class BotArena {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onAnalyzeGame = options.onAnalyzeGame || null; // (pgn, userColor) => {}
    this.theme = options.theme || 'green';

    this.chess = new Chess();
    this.userColor = 'w';
    this.selectedBot = BOTS_33[0]; // 400 Elo Pawn Piper
    this.activeTier = 'rookie';
    this.speechText = this.selectedBot.speech.onStart[0];
    this.isSpeechVisible = false;
    this.speechTimeout = null;
    this.gameStartTime = Date.now();
    this.isBotThinking = false;
    this.gameResult = null; // 'win' | 'loss' | 'draw' | null
    this.board = null;
    this.lastSpeechPly = -10;

    this.render();
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    if (this.board) {
      this.board.setProps({ theme: newTheme });
    }
  }

  startNewGame(color = this.userColor) {
    this.userColor = color;
    this.chess.reset();
    this.gameResult = null;
    this.gameStartTime = Date.now();
    this.closeGameOverModal();
    this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onStart));

    this.updateBoard();
    this.updateControls();

    soundService.playSuccess();

    if (this.userColor === 'b') {
      setTimeout(() => this.triggerBotMove(), 600);
    }
  }

  selectBot(bot) {
    this.selectedBot = bot;
    this.activeTier = bot.tier;
    this.startNewGame();
    this.render();
  }

  getRandomQuote(arr) {
    if (!arr || arr.length === 0) return 'Let us play chess!';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  setBotSpeech(text) {
    if (!text) return;
    this.speechText = text;
    this.isSpeechVisible = true;
    this.lastSpeechPly = this.chess ? this.chess.history().length : 0;
    this.updateSpeechBubble();

    if (this.speechTimeout) clearTimeout(this.speechTimeout);
    this.speechTimeout = setTimeout(() => {
      this.isSpeechVisible = false;
      this.updateSpeechBubble();
    }, 3800);
  }

  handleUserMove(from, to) {
    if (this.isBotThinking || this.gameResult) return;

    // Evaluate position before move to detect quality
    const prevFen = this.chess.fen();
    const prevEval = evaluatePositionLocally(prevFen);

    try {
      const move = this.chess.move({ from, to, promotion: 'q' });
      if (!move) return;

      if (move.captured) {
        soundService.playCapture();
      } else {
        soundService.playMove();
      }

      // Check quality of user move
      const postEval = evaluatePositionLocally(this.chess.fen());
      const evalDiff = this.userColor === 'w' ? postEval.cp - prevEval.cp : prevEval.cp - postEval.cp;

      const plyCount = this.chess.history().length;
      const canSpeak = plyCount - this.lastSpeechPly >= 4;

      if (evalDiff <= -250) {
        soundService.playBlunder();
        if (canSpeak && Math.random() < 0.22) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserBlunder));
        }
      } else if (evalDiff >= 200) {
        soundService.playBrilliant();
        if (canSpeak && Math.random() < 0.20) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserGreat));
        }
      } else if (typeof this.chess.inCheck === 'function' ? this.chess.inCheck() : (typeof this.chess.in_check === 'function' ? this.chess.in_check() : false)) {
        soundService.playCheck();
        if (canSpeak && Math.random() < 0.15) {
          this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onUserGreat));
        }
      }

      this.updateBoard();
      this.checkGameOver();

      if (!this.gameResult) {
        this.triggerBotMove();
      }
    } catch {
      // Invalid move
    }
  }

  triggerBotMove() {
    this.isBotThinking = true;
    this.updateStatusText();

    const thinkTime = Math.min(1200, Math.max(350, 200 + (this.selectedBot.elo - 400) * 0.5));

    setTimeout(() => {
      const isOver = typeof this.chess.isGameOver === 'function'
        ? this.chess.isGameOver()
        : (typeof this.chess.game_over === 'function' ? this.chess.game_over() : false);
      if (isOver) return;

      const legalMoves = this.chess.moves({ verbose: true });
      if (legalMoves.length === 0) return;

      let chosenMove = null;
      const willMakeRandomMistake = Math.random() < this.selectedBot.randomness;

      if (willMakeRandomMistake && legalMoves.length > 1) {
        chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        const botSearchDepth = Math.max(1, Math.min(3, this.selectedBot.depth || 2));
        const searchResult = findBestMoveLocal(this.chess.fen(), botSearchDepth);
        if (searchResult && searchResult.bestMoveUci) {
          const from = searchResult.bestMoveUci.slice(0, 2);
          const to = searchResult.bestMoveUci.slice(2, 4);
          const promo = searchResult.bestMoveUci[4];
          const matched = legalMoves.find((m) => m.from === from && m.to === to && (!promo || m.promotion === promo));
          if (matched) chosenMove = matched;
        }
        if (!chosenMove) {
          chosenMove = legalMoves[0];
        }
      }

      const move = this.chess.move(chosenMove);
      this.isBotThinking = false;

      if (move) {
        if (move.captured) soundService.playCapture();
        else soundService.playMove();

        const isInCheck = typeof this.chess.inCheck === 'function'
          ? this.chess.inCheck()
          : (typeof this.chess.in_check === 'function' ? this.chess.in_check() : false);

        const plyCount = this.chess.history().length;
        const canSpeak = plyCount - this.lastSpeechPly >= 4;

        if (isInCheck) {
          soundService.playCheck();
          if (canSpeak && Math.random() < 0.18) {
            this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onBotCheck));
          }
        } else if (canSpeak && Math.random() < 0.04) {
          const generalQuotes = this.selectedBot.speech.onStart || [];
          if (generalQuotes.length > 0) {
            this.setBotSpeech(this.getRandomQuote(generalQuotes));
          }
        }
      }

      this.updateBoard();
      this.updateStatusText();
      this.checkGameOver();
    }, thinkTime);
  }

  getEnrichedPgn() {
    const isUserWhite = this.userColor === 'w';
    const userName = 'You';
    const botName = `${this.selectedBot.name} (${this.selectedBot.elo})`;
    let result = '*';
    if (this.gameResult === 'win') result = isUserWhite ? '1-0' : '0-1';
    else if (this.gameResult === 'loss') result = isUserWhite ? '0-1' : '1-0';
    else if (this.gameResult === 'draw') result = '1/2-1/2';

    try {
      this.chess.header('White', isUserWhite ? userName : botName);
      this.chess.header('Black', isUserWhite ? botName : userName);
      this.chess.header('WhiteElo', isUserWhite ? '1500' : String(this.selectedBot.elo));
      this.chess.header('BlackElo', isUserWhite ? String(this.selectedBot.elo) : '1500');
      this.chess.header('Result', result);
    } catch {}

    let pgn = '';
    try {
      pgn = this.chess.pgn();
    } catch {}

    if (!pgn || pgn.trim() === '') {
      const moves = this.chess.history();
      let moveStr = '';
      for (let i = 0; i < moves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        moveStr += `${moveNum}. ${moves[i]} ${moves[i + 1] || ''} `;
      }
      pgn = `[White "${isUserWhite ? userName : botName}"]\n[Black "${isUserWhite ? botName : userName}"]\n[WhiteElo "${isUserWhite ? '1500' : this.selectedBot.elo}"]\n[BlackElo "${isUserWhite ? this.selectedBot.elo : '1500'}"]\n[Result "${result}"]\n\n${moveStr.trim()} ${result}`;
    }
    return pgn;
  }

  closeGameOverModal() {
    closeGameOverModal();
  }

  showGameOverModal(reason = 'Game Completed') {
    showGameOverModal(this, reason);
  }

  getBotRecords() {
    return getBotRecords();
  }

  recordBotResult(botId, result) {
    recordBotResult(botId, result);
  }

  checkGameOver() {
    let reason = '';
    const isMate = typeof this.chess.isCheckmate === 'function'
      ? this.chess.isCheckmate()
      : (typeof this.chess.in_checkmate === 'function' ? this.chess.in_checkmate() : false);

    const isDraw = typeof this.chess.isDraw === 'function'
      ? this.chess.isDraw()
      : (typeof this.chess.in_draw === 'function' ? this.chess.in_draw() : false);

    if (isMate) {
      const winner = this.chess.turn() === 'w' ? 'b' : 'w';
      if (winner === this.userColor) {
        this.gameResult = 'win';
        reason = 'Checkmate';
        this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onBotLoss));
        soundService.playSuccess();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } else {
        this.gameResult = 'loss';
        reason = 'Checkmate';
        this.setBotSpeech(this.getRandomQuote(this.selectedBot.speech.onBotWin));
        soundService.playBlunder();
      }
    } else if (isDraw) {
      this.gameResult = 'draw';
      reason = 'Draw / Stalemate';
      this.setBotSpeech('A noble draw! Well fought!');
    }

    if (this.gameResult) {
      this.recordBotResult(this.selectedBot.id, this.gameResult);
      this.updateControls();
      this.updateStatusText();
      setTimeout(() => this.showGameOverModal(reason), 350);
    }
  }

  updateBoard() {
    if (!this.board) return;
    const history = this.chess.history({ verbose: true });
    const lastMove = history.length > 0 ? { from: history[history.length - 1].from, to: history[history.length - 1].to } : null;
    const isUserWhite = this.userColor === 'w';

    this.board.setProps({
      fen: this.chess.fen(),
      orientation: this.userColor,
      lastMove,
      whiteName: isUserWhite ? 'You' : this.selectedBot.name,
      blackName: isUserWhite ? this.selectedBot.name : 'You',
      showPlayerBars: true,
      interactive: !this.isBotThinking && !this.gameResult,
      legalMovesFrom: (sq) => {
        const moves = this.chess.moves({ square: sq, verbose: true });
        return moves.map((m) => m.to);
      },
      onMove: (from, to) => this.handleUserMove(from, to),
    });
  }

  updateSpeechBubble() {
    const bubbleEl = this.container.querySelector('.bot-speech-bubble-text');
    const bubbleContainer = this.container.querySelector('.comic-bubble');
    if (bubbleEl) {
      bubbleEl.textContent = this.speechText;
    }
    if (bubbleContainer) {
      if (this.isSpeechVisible) {
        bubbleContainer.style.opacity = '1';
        bubbleContainer.style.visibility = 'visible';
        bubbleContainer.style.transform = 'scale(1)';
        bubbleContainer.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      } else {
        bubbleContainer.style.opacity = '0';
        bubbleContainer.style.visibility = 'hidden';
        bubbleContainer.style.transform = 'scale(0.92)';
        bubbleContainer.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      }
    }
  }

  updateStatusText() {
    const statusEl = this.container.querySelector('.bot-status-text');
    if (statusEl) {
      if (this.isBotThinking) {
        statusEl.innerHTML = `<span class="spinner-border spinner-border-sm text-warning me-1.5"></span><span class="fw-bold">Thinking...</span>`;
      } else if (this.gameResult === 'win') {
        statusEl.innerHTML = `<span class="badge bg-success px-2.5 py-1.5"><i class="bi bi-trophy-fill me-1"></i>Victory!</span>`;
      } else if (this.gameResult === 'loss') {
        statusEl.innerHTML = `<span class="badge bg-danger px-2.5 py-1.5"><i class="bi bi-x-circle-fill me-1"></i>Defeat!</span>`;
      } else if (this.gameResult === 'draw') {
        statusEl.innerHTML = `<span class="badge bg-secondary px-2.5 py-1.5">Draw</span>`;
      } else {
        const isUserTurn = this.chess.turn() === this.userColor;
        if (isUserTurn) {
          statusEl.innerHTML = `<span class="pulse-dot me-1.5"></span><span class="text-body fw-black">Your Turn</span>`;
        } else {
          statusEl.innerHTML = `<span class="badge bg-body-secondary text-secondary fw-bold">${this.selectedBot.name}'s turn</span>`;
        }
      }
    }
  }

  updateControls() {
    const actionArea = this.container.querySelector('.bot-game-actions');
    if (!actionArea) return;

    if (this.gameResult && this.onAnalyzeGame) {
      actionArea.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="arcade-btn-primary px-4 py-2" id="bot-btn-review">
            <i class="bi bi-lightning-charge-fill me-1"></i> Review Game with Stockfish ⚡
          </button>
          <button type="button" class="btn btn-outline-secondary comic-btn px-3 py-2" id="bot-btn-rematch">
            <i class="bi bi-arrow-repeat me-1"></i> Rematch
          </button>
        </div>
      `;

      actionArea.querySelector('#bot-btn-review')?.addEventListener('click', () => {
        this.onAnalyzeGame(this.getEnrichedPgn(), this.userColor);
      });
      actionArea.querySelector('#bot-btn-rematch')?.addEventListener('click', () => {
        this.startNewGame();
      });
    } else {
      actionArea.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-light comic-btn px-3 py-1.5" id="bot-btn-new">
            <i class="bi bi-plus-circle me-1"></i> New Game
          </button>
          <button type="button" class="btn btn-light comic-btn px-3 py-1.5" id="bot-btn-flip">
            <i class="bi bi-arrow-left-right me-1"></i> Flip Sides
          </button>
          <button type="button" class="btn btn-outline-danger comic-btn px-3 py-1.5" id="bot-btn-resign">
            <i class="bi bi-flag me-1"></i> Resign
          </button>
        </div>
      `;

      actionArea.querySelector('#bot-btn-new')?.addEventListener('click', () => this.startNewGame());
      actionArea.querySelector('#bot-btn-flip')?.addEventListener('click', () => {
        this.startNewGame(this.userColor === 'w' ? 'b' : 'w');
      });
      actionArea.querySelector('#bot-btn-resign')?.addEventListener('click', () => {
        if (!this.gameResult && this.chess.history().length > 0) {
          this.gameResult = 'loss';
          this.setBotSpeech('GG! You resigned. Ready for another round?');
          this.updateControls();
          this.updateStatusText();
          setTimeout(() => this.showGameOverModal('Resignation'), 350);
        }
      });
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="d-flex flex-column gap-3 max-w-4xl mx-auto">
        <!-- Collectible Bot Selection Card -->
        <div class="comic-card p-3 p-sm-4">
          <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="fs-3">${this.selectedBot.avatar}</span>
                <h4 class="mb-0 fw-black">${this.selectedBot.name}</h4>
                <span class="badge bg-warning text-dark fw-bold border border-dark">${this.selectedBot.elo} Elo</span>
                <span class="badge bg-secondary fw-semibold">${this.selectedBot.title}</span>
              </div>
              <p class="text-secondary small mb-0 mt-1">${this.selectedBot.description}</p>
            </div>

            <!-- 4 Tier Selector Tabs -->
            <div class="d-flex align-items-center gap-1.5 flex-wrap" role="group">
              <button type="button" class="arcade-tier-tab ${this.activeTier === 'rookie' ? 'active' : ''}" data-tier="rookie">🌱 Rookies</button>
              <button type="button" class="arcade-tier-tab ${this.activeTier === 'challenger' ? 'active' : ''}" data-tier="challenger">⚡ Challengers</button>
              <button type="button" class="arcade-tier-tab ${this.activeTier === 'hero' ? 'active' : ''}" data-tier="hero">🦸 Heroes</button>
              <button type="button" class="arcade-tier-tab ${this.activeTier === 'titan' ? 'active' : ''}" data-tier="titan">👑 Titans</button>
            </div>
          </div>

          <!-- Elo Step Slider (400 to 2000 in 50 increments) -->
          <div class="d-flex align-items-center gap-3 bg-body-tertiary p-2.5 rounded-3 border mb-3">
            <span class="small fw-bold text-nowrap"><i class="bi bi-speedometer2 me-1 text-warning"></i>Elo Level:</span>
            <input type="range" class="form-range arcade-range" id="bot-elo-slider" min="400" max="2000" step="50" value="${this.selectedBot.elo}">
            <span class="badge bg-dark fw-bold text-nowrap px-2.5 py-1.5 fs-6 font-monospace">${this.selectedBot.elo}</span>
          </div>

          <!-- Tier Collectible Bots Carousel -->
          <div class="d-flex gap-2.5 overflow-x-auto py-2" id="tier-bots-row" style="scrollbar-width: thin;">
            ${(() => {
              const records = this.getBotRecords();
              return BOTS_33.filter((b) => b.tier === this.activeTier)
                .map(
                  (b) => `
                  <div class="arcade-bot-card flex-shrink-0 ${b.id === this.selectedBot.id ? 'active' : ''}" data-bot-id="${b.id}">
                    <span class="arcade-bot-avatar">${b.avatar}</span>
                    <span class="arcade-bot-name">${b.name}</span>
                    <span class="arcade-bot-elo d-flex align-items-center justify-content-center gap-1">
                      ${b.elo}
                      ${records[b.id]?.wins ? `<span class="badge bg-warning text-dark py-0 px-1" title="Defeated ${records[b.id].wins} time(s)">🏆 ${records[b.id].wins}</span>` : ''}
                    </span>
                  </div>
                `
                )
                .join('');
            })()}
          </div>
        </div>

        <!-- Live Match Banner & Personality Speech Bubble -->
        <div class="arcade-match-strip">
          <div class="d-flex align-items-center gap-2">
            <span class="fs-4">${this.selectedBot.avatar}</span>
            <div class="comic-bubble">
              <span class="bot-speech-bubble-text">${this.speechText}</span>
            </div>
          </div>
          <div class="bot-status-text small fw-bold text-secondary">
            <span class="pulse-dot me-1.5"></span>Your turn (White)
          </div>
        </div>

        <!-- Chessboard Container -->
        <div class="d-flex justify-content-center" id="bot-board-mount"></div>

        <!-- Controls Area -->
        <div class="d-flex justify-content-center bot-game-actions mt-1"></div>
      </div>
    `;

    // Mount Chessboard
    const boardMount = this.container.querySelector('#bot-board-mount');
    const isUserWhite = this.userColor === 'w';
    this.board = new Chessboard(boardMount, {
      fen: this.chess.fen(),
      orientation: this.userColor,
      theme: this.theme,
      whiteName: isUserWhite ? 'You' : this.selectedBot.name,
      blackName: isUserWhite ? this.selectedBot.name : 'You',
      showPlayerBars: true,
      interactive: true,
      legalMovesFrom: (sq) => {
        const moves = this.chess.moves({ square: sq, verbose: true });
        return moves.map((m) => m.to);
      },
      onMove: (from, to) => this.handleUserMove(from, to),
    });

    this.updateControls();

    // Bind Tier switcher buttons
    this.container.querySelectorAll('[data-tier]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tier = e.currentTarget.getAttribute('data-tier');
        this.activeTier = tier;
        const firstBotInTier = BOTS_33.find((b) => b.tier === tier);
        if (firstBotInTier) {
          this.selectBot(firstBotInTier);
        }
      });
    });

    // Bind Elo Range Slider
    const slider = this.container.querySelector('#bot-elo-slider');
    slider?.addEventListener('input', (e) => {
      const eloVal = parseInt(e.target.value, 10);
      const targetBot = BOTS_33.find((b) => b.elo === eloVal) || BOTS_33[0];
      this.selectBot(targetBot);
    });

    // Bind Bot character cards in carousel
    this.container.querySelectorAll('[data-bot-id]').forEach((card) => {
      card.addEventListener('click', (e) => {
        const botId = e.currentTarget.getAttribute('data-bot-id');
        const targetBot = BOTS_33.find((b) => b.id === botId);
        if (targetBot) {
          this.selectBot(targetBot);
        }
      });
    });
  }
}

/* --- src/components/reviewAdvantageChart.js --- */
function createCurvedPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

function updateAdvantageScrubber(dashboard) {
  if (!dashboard || !dashboard.game || !dashboard.advantagePoints || dashboard.advantagePoints.length === 0) return;
  const group = dashboard.container.querySelector('#advantage-scrubber-group');
  const line = dashboard.container.querySelector('#scrubber-line');
  const circle = dashboard.container.querySelector('#scrubber-circle');
  if (!group || !line || !circle) return;

  if (dashboard.currentPly > 0 && dashboard.currentPly <= dashboard.advantagePoints.length) {
    const pt = dashboard.advantagePoints[dashboard.currentPly - 1];
    group.style.display = 'inline';
    line.setAttribute('x1', pt.x);
    line.setAttribute('x2', pt.x);
    circle.setAttribute('cx', pt.x);
    circle.setAttribute('cy', pt.y);
  } else if (dashboard.currentPly === 0 && dashboard.advantagePoints.length > 0) {
    const pt = dashboard.advantagePoints[0];
    group.style.display = 'inline';
    line.setAttribute('x1', pt.x);
    line.setAttribute('x2', pt.x);
    circle.setAttribute('cx', pt.x);
    circle.setAttribute('cy', dashboard.advantageMidY || 42);
  } else {
    group.style.display = 'none';
  }
}

function renderAdvantageChart(dashboard) {
  const chartArea = dashboard.container.querySelector('#advantage-chart-area');
  if (!chartArea || !dashboard.game || !dashboard.game.plies || dashboard.game.plies.length === 0) {
    if (chartArea) chartArea.innerHTML = '';
    return;
  }

  const totalPlies = dashboard.game.plies.length;
  const width = 1000;
  const height = 84;
  const midY = height / 2;
  const padX = 12;
  const padY = 10;

  dashboard.advantageMidY = midY;
  dashboard.advantagePoints = dashboard.game.plies.map((ply, i) => {
    const x = padX + (i / (totalPlies - 1 || 1)) * (width - padX * 2);
    const prob = typeof ply.winProb === 'number' && !isNaN(ply.winProb) ? ply.winProb : 0.5;
    const y = padY + (1 - prob) * (height - padY * 2);
    return { x, y, ply };
  });

  const curveD = createCurvedPath(dashboard.advantagePoints);
  const firstX = dashboard.advantagePoints[0].x;
  const lastX = dashboard.advantagePoints[dashboard.advantagePoints.length - 1].x;
  const areaD = `${curveD} L ${lastX} ${midY} L ${firstX} ${midY} Z`;

  const selectedPoint = (dashboard.currentPly > 0 && dashboard.currentPly <= totalPlies)
    ? dashboard.advantagePoints[dashboard.currentPly - 1]
    : (dashboard.advantagePoints[0] || null);

  const mgPly = dashboard.game.middlegameStartPly;
  const egPly = dashboard.game.endgameStartPly;

  let phaseMarkersSvg = '';
  if (mgPly > 1 && mgPly <= totalPlies) {
    const mgPt = dashboard.advantagePoints[mgPly - 1];
    phaseMarkersSvg += `
      <line x1="${mgPt.x}" y1="6" x2="${mgPt.x}" y2="${height - 6}" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65" />
      <text x="${mgPt.x}" y="12" fill="#93c5fd" font-size="9" font-weight="700" font-family="JetBrains Mono, monospace" text-anchor="middle">Middle</text>
    `;
  }
  if (egPly > 1 && egPly <= totalPlies) {
    const egPt = dashboard.advantagePoints[egPly - 1];
    phaseMarkersSvg += `
      <line x1="${egPt.x}" y1="6" x2="${egPt.x}" y2="${height - 6}" stroke="#34d399" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.65" />
      <text x="${egPt.x}" y="12" fill="#6ee7b7" font-size="9" font-weight="700" font-family="JetBrains Mono, monospace" text-anchor="middle">Endgame</text>
    `;
  }

  chartArea.innerHTML = `
    <div class="d-flex align-items-center justify-content-between px-1 pb-1 mb-1 border-bottom border-secondary border-opacity-25">
      <div class="d-flex align-items-center gap-1.5">
        <i class="bi bi-graph-up text-primary small"></i>
        <span class="small fw-black" style="font-size: 11px;">Advantage Timeline</span>
      </div>
      <div class="d-flex align-items-center gap-2 font-monospace" style="font-size: 10px;">
        <span class="d-flex align-items-center gap-1 text-info"><span class="rounded-circle d-inline-block bg-info" style="width: 6px; height: 6px;"></span>White+</span>
        <span class="d-flex align-items-center gap-1 text-secondary"><span class="rounded-circle d-inline-block bg-secondary" style="width: 6px; height: 6px;"></span>Black+</span>
      </div>
    </div>
    <div class="advantage-chart-canvas position-relative" id="advantage-chart-canvas">
      <svg class="w-100 h-100" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="display: block;">
        <defs>
          <linearGradient id="advWhiteGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <!-- 50% Equality Line -->
        <line x1="0" y1="${midY}" x2="${width}" y2="${midY}" stroke="#475569" stroke-width="1" stroke-dasharray="4,4" opacity="0.5" />
        <!-- Gradient Area -->
        <path d="${areaD}" fill="url(#advWhiteGrad)" />
        <!-- Main Advantage Spline -->
        <path d="${curveD}" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Phase Markers -->
        ${phaseMarkersSvg}
        <!-- Active Move Scrubber -->
        <g id="advantage-scrubber-group" style="display: ${selectedPoint ? 'inline' : 'none'};">
          <line id="scrubber-line" x1="${selectedPoint?.x || 0}" y1="0" x2="${selectedPoint?.x || 0}" y2="${height}" stroke="#fbbf24" stroke-width="1.8" opacity="0.9" />
          <circle id="scrubber-circle" cx="${selectedPoint?.x || 0}" cy="${dashboard.currentPly === 0 ? midY : (selectedPoint?.y || midY)}" r="4" fill="#fbbf24" stroke="#0f172a" stroke-width="1.5" />
        </g>
      </svg>
      <div id="advantage-chart-tooltip" class="position-absolute d-none px-2 py-1 rounded bg-dark border border-secondary shadow text-white small" style="pointer-events: none; z-index: 10; font-size: 11px;"></div>
    </div>
  `;

  const canvas = chartArea.querySelector('#advantage-chart-canvas');
  const tooltip = chartArea.querySelector('#advantage-chart-tooltip');
  if (canvas) {
    const handleInteraction = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      const relX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, relX / rect.width));
      const targetPly = Math.max(1, Math.min(totalPlies, Math.round(ratio * (totalPlies - 1)) + 1));
      dashboard.goToPly(targetPly);
    };

    canvas.addEventListener('click', (e) => handleInteraction(e.clientX));

    let isDragging = false;
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      handleInteraction(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) handleInteraction(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!tooltip || !dashboard.game || !dashboard.game.plies.length) return;
      const rect = canvas.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, relX / rect.width));
      const idx = Math.max(0, Math.min(totalPlies - 1, Math.round(ratio * (totalPlies - 1))));
      const ply = dashboard.game.plies[idx];
      if (!ply) return;

      const dict = COMIC_DICTIONARY[ply.classification] || COMIC_DICTIONARY['good'];
      const evalStr = ply.mate !== null && typeof ply.mate !== 'undefined'
        ? `M${Math.abs(ply.mate)}`
        : (ply.scoreCp > 0 ? `+${(ply.scoreCp / 100).toFixed(1)}` : (ply.scoreCp / 100).toFixed(1));

      tooltip.innerHTML = `
        <div class="d-flex align-items-center gap-1.5 font-monospace">
          <span class="badge border border-dark rounded-circle" style="background:${dict.bg}; color:${dict.text}; width:16px; height:16px; padding:0; display:inline-flex; align-items:center; justify-content:center; font-size:9px;">
            ${dict.symbol}
          </span>
          <span class="fw-bold">${ply.ply}. ${ply.san}</span>
          <span class="text-info fw-bold">(${evalStr})</span>
        </div>
      `;
      tooltip.classList.remove('d-none');
      const tipWidth = tooltip.offsetWidth || 120;
      const leftPos = Math.max(8, Math.min(rect.width - tipWidth - 8, relX + 10));
      tooltip.style.left = `${leftPos}px`;
      tooltip.style.top = `6px`;
    });

    canvas.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.classList.add('d-none');
    });
  }
}

/* --- src/components/reviewRetryMistake.js --- */
function startRetryMistake(dashboard) {
  const cur = dashboard.getCurrentEval();
  if (!cur || !cur.bestMoveUci || !cur.fenBefore) return;

  dashboard.isRetryingMistake = true;
  dashboard.retryHintActive = false;
  dashboard.stopPvPlayback();

  const banner = dashboard.container.querySelector('#pv-banner-area');
  if (banner) {
    const turnName = cur.color === 'w' ? 'White' : 'Black';
    banner.classList.remove('d-none');
    banner.innerHTML = `
      <div class="alert alert-warning comic-card-sm d-flex align-items-center justify-content-between p-2.5 mb-2 rounded-3">
        <div class="d-flex align-items-center gap-2">
          <span class="spinner-grow spinner-grow-sm text-warning"></span>
          <span class="small fw-bold">Retry Mistake · <strong>${turnName}</strong> to find the best move</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-dark fw-bold comic-btn" id="retry-hint-btn">Hint</button>
          <button type="button" class="btn btn-sm btn-light fw-bold comic-btn" id="retry-exit-btn">Exit</button>
        </div>
      </div>
    `;

    banner.querySelector('#retry-hint-btn')?.addEventListener('click', () => {
      dashboard.retryHintActive = true;
      const fromSq = cur.bestMoveUci.slice(0, 2);
      const hintEl = banner.querySelector('strong');
      if (hintEl) hintEl.textContent = `Hint: piece starts on ${fromSq}`;
      if (dashboard.board) {
        dashboard.board.setProps({
          bestMove: { from: fromSq, to: fromSq }
        });
      }
    });

    banner.querySelector('#retry-exit-btn')?.addEventListener('click', () => {
      stopRetryMistake(dashboard);
    });
  }

  if (dashboard.board) {
    const testChess = new Chess(cur.fenBefore);
    dashboard.board.setProps({
      fen: cur.fenBefore,
      orientation: dashboard.orientation,
      interactive: true,
      lastMove: null,
      bestMove: null,
      secondBestMove: null,
      threatMove: null,
      badge: null,
      legalMovesFrom: (sq) => {
        const moves = testChess.moves({ square: sq, verbose: true });
        return moves.map((m) => m.to);
      },
      onMove: (from, to) => {
        const promo = (to.endsWith('8') || to.endsWith('1')) ? 'q' : undefined;
        const playedUci = `${from}${to}${promo || ''}`;
        const isCorrect = playedUci.startsWith(cur.bestMoveUci.slice(0, 4));

        if (isCorrect) {
          soundService.playSuccess();
          try {
            if (typeof window.confetti === 'function') {
              window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            }
          } catch {}

          const bannerAlert = banner?.querySelector('.alert');
          if (bannerAlert) {
            bannerAlert.className = 'alert alert-success comic-card-sm d-flex align-items-center justify-content-between p-2.5 mb-2 rounded-3';
            bannerAlert.innerHTML = `
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill text-success fs-5"></i>
                <span class="small fw-bold">Solved! That's the best move: <strong>${cur.bestMoveSan || cur.bestMoveUci}</strong></span>
              </div>
            `;
          }

          testChess.move({ from, to, promotion: promo });
          dashboard.board?.setProps({
            fen: testChess.fen(),
            interactive: false,
            lastMove: { from, to }
          });

          setTimeout(() => {
            stopRetryMistake(dashboard);
          }, 1800);
        } else {
          soundService.playBlunder();
          const bannerStrong = banner?.querySelector('strong');
          if (bannerStrong) {
            bannerStrong.textContent = `Not quite. Try another move!`;
          }
          dashboard.board?.setProps({ fen: cur.fenBefore, interactive: true });
        }
      }
    });
  }
}

function stopRetryMistake(dashboard) {
  dashboard.isRetryingMistake = false;
  dashboard.retryHintActive = false;
  const banner = dashboard.container.querySelector('#pv-banner-area');
  if (banner) {
    banner.innerHTML = '';
    banner.classList.add('d-none');
  }
  dashboard.updateBoardAndControls();
}

/* --- src/components/reviewWhyModal.js --- */
function closeWhyModal(dashboard) {
  if (dashboard.whyTimer) {
    clearInterval(dashboard.whyTimer);
    dashboard.whyTimer = null;
  }
  if (dashboard.whyKeyHandler) {
    window.removeEventListener('keydown', dashboard.whyKeyHandler);
    dashboard.whyKeyHandler = null;
  }
  const existing = document.getElementById('why-blunder-modal');
  if (existing) existing.remove();
  dashboard.whyBoard = null;
}

async function openWhyModal(dashboard, targetEval = null) {
  const cur = targetEval || dashboard.getCurrentEval();
  if (!cur) return;

  closeWhyModal(dashboard);

  const comic = getComicBadge(cur.classification, cur.san);
  const classificationName = cur.classification.replace('_', ' ');

  const winProbBeforePct = Math.round((cur.moverWinProbBefore ?? cur.winProbBefore ?? 0.5) * 100);
  const winProbAfterPct = Math.round((cur.moverWinProbAfter ?? cur.winProb ?? 0.5) * 100);
  const winLossPct = Math.max(0, winProbBeforePct - winProbAfterPct);

  const evalBefore = cur.scoreBefore !== undefined ? (cur.scoreBefore / 100).toFixed(1) : null;
  const evalAfter = cur.scoreAfter !== undefined ? (cur.scoreAfter / 100).toFixed(1) : null;

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'why-blunder-modal';
  modal.innerHTML = `
    <div class="why-dialog p-3 p-md-4 shadow-lg" style="max-width: 820px; width: 100%; max-height: 94vh; overflow-y: auto; border-radius: 1.25rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);">
      <div class="d-flex align-items-center justify-content-between pb-2.5 mb-3 border-bottom" style="border-color: var(--arcade-border) !important;">
        <div class="d-flex align-items-center gap-2.5">
          <span class="badge rounded-pill px-3 py-1.5" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 800; font-size: 12px;">
            ${comic.symbol} ${comic.term}
          </span>
          <div>
            <h5 class="mb-0 fw-black fs-6">Why was ${cur.san} a ${classificationName}?</h5>
            <div class="text-secondary small font-monospace" style="font-size: 11px;">Move ${Math.ceil((cur.ply || 1) / 2)}${cur.color === 'b' ? '... ' : '. '}${cur.san}</div>
          </div>
        </div>
        <button type="button" class="btn-close" id="why-btn-close" aria-label="Close"></button>
      </div>

      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div class="arcade-mode-pills" role="group">
          <button type="button" class="arcade-pill active" id="why-tab-punishment" disabled>
            <i class="bi bi-lightning-charge-fill me-1 text-danger"></i>Opponent's Punishment
          </button>
          <button type="button" class="arcade-pill" id="why-tab-best" disabled>
            <i class="bi bi-star-fill me-1 text-success"></i>Best Alternative (${cur.bestMoveSan || 'Top Move'})
          </button>
        </div>
        <span class="badge bg-body-secondary text-secondary font-monospace fw-bold px-2.5 py-1.5" id="why-step-counter">Move 0 / 0</span>
      </div>

      <div class="row g-3 align-items-stretch">
        <div class="col-12 col-md-7 d-flex justify-content-center">
          <div id="why-modal-board" style="width: 100%; max-width: 380px; aspect-ratio: 1/1;"></div>
        </div>
        <div class="col-12 col-md-5 d-flex flex-column justify-content-between">
          <div>
            <div class="card border-0 mb-2 p-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border) !important; border-radius: 0.75rem;">
              <div class="d-flex align-items-center justify-content-between mb-1.5">
                <span class="text-uppercase fw-bold text-secondary" style="font-size: 10px; letter-spacing: 0.5px;">Evaluation Impact</span>
                <span class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace" id="why-line-tag">Punishment</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <div>
                  <span class="text-secondary small d-block" style="font-size: 10px;">Win Chance</span>
                  <span class="fw-black font-monospace fs-6">${winProbBeforePct}% → ${winProbAfterPct}%</span>
                  <span class="badge bg-danger text-white font-monospace ms-1" style="font-size: 10px;">-${winLossPct}%</span>
                </div>
                ${evalBefore !== null && evalAfter !== null ? `
                <div class="vr opacity-25"></div>
                <div>
                  <span class="text-secondary small d-block" style="font-size: 10px;">Engine Score</span>
                  <span class="fw-black font-monospace fs-6">${Number(evalBefore) > 0 ? '+' + evalBefore : evalBefore} → ${Number(evalAfter) > 0 ? '+' + evalAfter : evalAfter}</span>
                </div>
                ` : ''}
              </div>
            </div>

            <div class="card border-0 mb-3 p-2.5" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border) !important; border-radius: 0.75rem;">
              <div class="d-flex align-items-start gap-2">
                <i class="bi bi-shield-exclamation text-danger fs-5 lh-1 mt-0.5"></i>
                <div>
                  <span class="fw-bold small d-block text-body" id="why-summary-text"><span class="spinner-border spinner-border-sm text-danger me-2" role="status"></span>Calculating what happens next...</span>
                </div>
              </div>
            </div>

            <div class="p-2 mb-3" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border); border-radius: 0.75rem; max-height: 140px; overflow-y: auto;">
              <div class="small fw-bold text-secondary mb-1.5" style="font-size: 11px;">Tactical Continuation (10 Plies):</div>
              <div class="d-flex flex-wrap gap-1.5" id="why-pills-container">
                <span class="text-secondary small"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading line...</span>
              </div>
            </div>
          </div>

          <div>
            <div class="d-flex align-items-center justify-content-center gap-2 py-1">
              <button type="button" class="btn btn-sm btn-outline-secondary px-2" id="why-btn-first" disabled title="Start">
                <i class="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="why-btn-prev" disabled title="Previous Move">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button type="button" class="btn btn-sm btn-primary px-3 fw-bold" id="why-btn-play" disabled title="Play / Pause">
                <i class="bi bi-play-fill" id="why-play-icon"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2.5" id="why-btn-next" disabled title="Next Move">
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary px-2" id="why-btn-last" disabled title="End">
                <i class="bi bi-chevron-bar-right"></i>
              </button>
            </div>
            <div class="text-center text-secondary small fw-semibold mt-1" style="font-size: 11px;">
              <i class="bi bi-keyboard me-1"></i>Arrow keys: <kbd class="bg-body-secondary text-body px-1">←</kbd> <kbd class="bg-body-secondary text-body px-1">→</kbd> | Space: Play
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const boardMount = modal.querySelector('#why-modal-board');
  dashboard.whyBoard = new Chessboard(boardMount, {
    fen: cur.fen,
    orientation: dashboard.orientation,
    theme: dashboard.theme,
    interactive: false,
  });

  modal.querySelector('#why-btn-close')?.addEventListener('click', () => closeWhyModal(dashboard));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeWhyModal(dashboard);
  });

  dashboard.whyKeyHandler = (e) => {
    if (e.key === 'Escape') {
      closeWhyModal(dashboard);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      modal.querySelector('#why-btn-prev')?.click();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      modal.querySelector('#why-btn-next')?.click();
    } else if (e.key === ' ') {
      e.preventDefault();
      modal.querySelector('#why-btn-play')?.click();
    }
  };
  window.addEventListener('keydown', dashboard.whyKeyHandler);

  if (!cur.explanation) {
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
    if (!document.body.contains(modal)) return;
  }

  let punishmentSteps = cur.explanation?.punishmentSteps;
  let punishmentSummary = cur.explanation?.punishmentSummary;
  let bestSteps = cur.explanation?.bestSteps;
  let bestSummary = cur.explanation?.bestSummary;

  if (!punishmentSteps || !bestSteps) {
    punishmentSteps = [
      { ply: 0, fen: cur.fen, from: cur.from, to: cur.to, san: cur.san }
    ];
    const deepPunish = await getDeepContinuation(cur.fen, 10);
    punishmentSteps.push(...deepPunish);
    const endFen = punishmentSteps[punishmentSteps.length - 1].fen;
    punishmentSummary = summarizePunishment(cur.fen, endFen, cur.color);

    bestSteps = [
      { ply: 0, fen: cur.fenBefore, from: null, to: null, san: 'Start' }
    ];
    bestSummary = 'Maintains a solid position and prevents opponent tactical counterplay.';

    try {
      const cBest = new Chess(cur.fenBefore);
      const bUci = cur.bestMoveUci;
      if (bUci && bUci.length >= 4) {
        const from = bUci.slice(0, 2);
        const to = bUci.slice(2, 4);
        const promotion = bUci.length > 4 ? bUci[4] : void 0;
        const m = cBest.move({ from, to, promotion });
        if (m) {
          bestSteps.push({
            ply: 1,
            san: m.san,
            uci: bUci,
            from: m.from,
            to: m.to,
            fen: cBest.fen(),
            color: m.color
          });
          const deepBest = await getDeepContinuation(cBest.fen(), 9);
          bestSteps.push(...deepBest);
          bestSummary = `Playing ${cur.bestMoveSan || m.san} retains full equality or advantage with no tactical loss.`;
        }
      }
    } catch {
    }

    cur.explanation = { punishmentSteps, punishmentSummary, bestSteps, bestSummary };
  }

  if (!document.body.contains(modal)) return;
  modal.querySelectorAll('button[disabled]').forEach((btn) => btn.removeAttribute('disabled'));

  let activeTab = 'punishment';
  let currentSteps = punishmentSteps;
  let stepIdx = 0;
  let isPlaying = false;

  const renderActiveStep = () => {
    const step = currentSteps[stepIdx];
    if (!step) return;

    dashboard.whyBoard?.setProps({
      fen: step.fen,
      lastMove: step.from ? { from: step.from, to: step.to } : null,
    });

    const counterEl = modal.querySelector('#why-step-counter');
    if (counterEl) {
      counterEl.textContent = `Move ${stepIdx} / ${currentSteps.length - 1}`;
    }

    const pills = modal.querySelectorAll('.why-move-pill');
    pills.forEach((p, idx) => {
      if (idx === stepIdx) {
        p.classList.remove('btn-outline-secondary');
        p.classList.add('btn-primary', 'text-white');
      } else {
        p.classList.remove('btn-primary', 'text-white');
        p.classList.add('btn-outline-secondary');
      }
    });
  };

  const updatePills = () => {
    const pillsContainer = modal.querySelector('#why-pills-container');
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';

    currentSteps.forEach((st, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn-sm py-0.5 px-2 font-monospace fw-bold rounded-pill why-move-pill ${idx === stepIdx ? 'btn-primary text-white' : 'btn-outline-secondary'}`;
      btn.style.fontSize = '11px';
      btn.textContent = idx === 0 ? (activeTab === 'punishment' ? `${st.san}` : 'Start') : `${st.ply}. ${st.san}`;
      btn.addEventListener('click', () => {
        stopAutoplay();
        stepIdx = idx;
        soundService.playMove();
        renderActiveStep();
      });
      pillsContainer.appendChild(btn);
    });
  };

  const setTab = (tab) => {
    stopAutoplay();
    activeTab = tab;
    stepIdx = 0;

    const btnPunish = modal.querySelector('#why-tab-punishment');
    const btnBest = modal.querySelector('#why-tab-best');
    const tagEl = modal.querySelector('#why-line-tag');
    const summaryEl = modal.querySelector('#why-summary-text');

    if (tab === 'punishment') {
      currentSteps = punishmentSteps;
      btnPunish?.classList.add('active');
      btnBest?.classList.remove('active');

      if (tagEl) {
        tagEl.className = 'badge bg-danger-subtle text-danger border border-danger-subtle font-monospace';
        tagEl.textContent = 'Punishment';
      }
      if (summaryEl) summaryEl.textContent = punishmentSummary;
    } else {
      currentSteps = bestSteps;
      btnBest?.classList.add('active');
      btnPunish?.classList.remove('active');

      if (tagEl) {
        tagEl.className = 'badge bg-success-subtle text-success border border-success-subtle font-monospace';
        tagEl.textContent = 'Best Line';
      }
      if (summaryEl) summaryEl.textContent = bestSummary;
    }

    updatePills();
    renderActiveStep();
  };

  const stopAutoplay = () => {
    if (dashboard.whyTimer) {
      clearInterval(dashboard.whyTimer);
      dashboard.whyTimer = null;
    }
    isPlaying = false;
    const icon = modal.querySelector('#why-play-icon');
    if (icon) {
      icon.className = 'bi bi-play-fill';
    }
  };

  const startAutoplay = () => {
    if (isPlaying) {
      stopAutoplay();
      return;
    }
    if (stepIdx >= currentSteps.length - 1) {
      stepIdx = 0;
    }
    isPlaying = true;
    const icon = modal.querySelector('#why-play-icon');
    if (icon) {
      icon.className = 'bi bi-pause-fill';
    }

    dashboard.whyTimer = setInterval(() => {
      if (stepIdx < currentSteps.length - 1) {
        stepIdx++;
        soundService.playMove();
        renderActiveStep();
      } else {
        stopAutoplay();
      }
    }, 750);
  };

  modal.querySelector('#why-tab-punishment')?.addEventListener('click', () => setTab('punishment'));
  modal.querySelector('#why-tab-best')?.addEventListener('click', () => setTab('best'));

  modal.querySelector('#why-btn-first')?.addEventListener('click', () => {
    stopAutoplay();
    stepIdx = 0;
    soundService.playMove();
    renderActiveStep();
  });

  modal.querySelector('#why-btn-prev')?.addEventListener('click', () => {
    stopAutoplay();
    if (stepIdx > 0) {
      stepIdx--;
      soundService.playMove();
      renderActiveStep();
    }
  });

  modal.querySelector('#why-btn-next')?.addEventListener('click', () => {
    stopAutoplay();
    if (stepIdx < currentSteps.length - 1) {
      stepIdx++;
      soundService.playMove();
      renderActiveStep();
    }
  });

  modal.querySelector('#why-btn-last')?.addEventListener('click', () => {
    stopAutoplay();
    stepIdx = currentSteps.length - 1;
    soundService.playMove();
    renderActiveStep();
  });

  modal.querySelector('#why-btn-play')?.addEventListener('click', () => {
    startAutoplay();
  });



  setTab('punishment');

  const needsLongerLines = punishmentSteps.length - 1 < MIN_CONTINUATION_PLIES || bestSteps.length - 1 < MIN_CONTINUATION_PLIES;
  if (needsLongerLines) {
    modal.querySelector('#why-pills-container')?.insertAdjacentHTML('beforeend', '<span class="spinner-border spinner-border-sm text-secondary align-self-center" role="status"></span>');
    const [punishTail, bestTail] = await Promise.all([
      extendContinuation(cur.fen, punishmentSteps.slice(1)),
      extendContinuation(cur.fenBefore, bestSteps.slice(1))
    ]);
    if (!document.body.contains(modal)) return;
    punishmentSteps.splice(1, punishmentSteps.length - 1, ...punishTail);
    bestSteps.splice(1, bestSteps.length - 1, ...bestTail);
    updatePills();
    renderActiveStep();
  }
}

/* --- src/components/insightsCharts.js --- */
const INS_COLORS = {
  win: '#10b981',
  draw: '#94a3b8',
  loss: '#f43f5e',
  accent: '#fbbf24',
  blue: '#3b82f6',
  purple: '#8b5cf6'
};

function insEscape(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function insScale(value, min, max, outMin, outMax) {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

function insLineChart(series, { height = 160, yFormat = (v) => Math.round(v), xLabels = [] } = {}) {
  const width = 400;
  const pad = { left: 38, right: 10, top: 10, bottom: 22 };
  const allValues = series.flatMap((s) => s.values).filter((v) => typeof v === 'number');
  if (allValues.length < 2) return '<div class="text-secondary small">Not enough data.</div>';

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const margin = Math.max((rawMax - rawMin) * 0.1, 1);
  const yMin = rawMin - margin;
  const yMax = rawMax + margin;
  const count = Math.max(...series.map((s) => s.values.length));
  const xAt = (i) => insScale(i, 0, count - 1, pad.left, width - pad.right);
  const yAt = (v) => insScale(v, yMin, yMax, height - pad.bottom, pad.top);

  const grid = [0, 0.5, 1].map((t) => {
    const value = yMin + (yMax - yMin) * t;
    const y = yAt(value);
    return `<line x1="${pad.left}" x2="${width - pad.right}" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity="0.12"/>
      <text x="${pad.left - 5}" y="${y + 3}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${yFormat(value)}</text>`;
  }).join('');

  const lines = series.map((s) => {
    const points = s.values.map((v, i) => (typeof v === 'number' ? `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}` : null)).filter(Boolean);
    return `<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  }).join('');

  const labels = xLabels.length === 2
    ? `<text x="${pad.left}" y="${height - 6}" font-size="9" fill="currentColor" fill-opacity="0.6">${insEscape(xLabels[0])}</text>
       <text x="${width - pad.right}" y="${height - 6}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${insEscape(xLabels[1])}</text>`
    : '';

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img">${grid}${lines}${labels}</svg>`;
}

function insBarChart(items, { height = 150, max = null, unit = '', color = INS_COLORS.accent } = {}) {
  if (items.length === 0) return '<div class="text-secondary small">Not enough data.</div>';
  const width = 400;
  const pad = { left: 10, right: 10, top: 18, bottom: 24 };
  const peak = max ?? Math.max(...items.map((i) => i.value ?? 0), 1);
  const slot = (width - pad.left - pad.right) / items.length;
  const barWidth = Math.min(46, slot * 0.6);

  const bars = items.map((item, idx) => {
    const value = item.value ?? 0;
    const barHeight = insScale(value, 0, peak, 0, height - pad.top - pad.bottom);
    const x = pad.left + slot * idx + (slot - barWidth) / 2;
    const y = height - pad.bottom - barHeight;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(barHeight, 1).toFixed(1)}" rx="4" fill="${item.color || color}"/>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">${item.value === null || item.value === undefined ? '—' : `${item.value}${unit}`}</text>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.7">${insEscape(item.label)}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img">${bars}</svg>`;
}

function insDonut(slices, centerLabel = '', centerSub = '') {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return '<div class="text-secondary small">Not enough data.</div>';
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const arcs = slices.filter((s) => s.value > 0).map((s) => {
    const length = (s.value / total) * circumference;
    const arc = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${s.color}" stroke-width="16"
      stroke-dasharray="${length.toFixed(2)} ${(circumference - length).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 60 60)"/>`;
    offset += length;
    return arc;
  }).join('');

  return `<svg viewBox="0 0 120 120" width="100%" style="max-width:150px" role="img">${arcs}
    <text x="60" y="60" text-anchor="middle" font-size="16" font-weight="800" fill="currentColor">${insEscape(centerLabel)}</text>
    <text x="60" y="74" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.65">${insEscape(centerSub)}</text></svg>`;
}

function insScatter(points, { height = 170, xLabel = '', yLabel = '' } = {}) {
  if (points.length < 2) return '<div class="text-secondary small">Not enough data.</div>';
  const width = 400;
  const pad = { left: 38, right: 10, top: 10, bottom: 26 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs) - 20;
  const xMax = Math.max(...xs) + 20;
  const yMin = Math.max(0, Math.min(...ys) - 5);
  const yMax = Math.min(100, Math.max(...ys) + 5);

  const dots = points.map((p) => {
    const cx = insScale(p.x, xMin, xMax, pad.left, width - pad.right);
    const cy = insScale(p.y, yMin, yMax, height - pad.bottom, pad.top);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="${p.color}" fill-opacity="0.8"/>`;
  }).join('');

  const axis = `<line x1="${pad.left}" x2="${width - pad.right}" y1="${height - pad.bottom}" y2="${height - pad.bottom}" stroke="currentColor" stroke-opacity="0.25"/>
    <line x1="${pad.left}" x2="${pad.left}" y1="${pad.top}" y2="${height - pad.bottom}" stroke="currentColor" stroke-opacity="0.25"/>
    <text x="${pad.left}" y="${height - 14}" font-size="9" fill="currentColor" fill-opacity="0.6">${Math.round(xMin)}</text>
    <text x="${width - pad.right}" y="${height - 14}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${Math.round(xMax)}</text>
    <text x="${(pad.left + width - pad.right) / 2}" y="${height - 3}" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.7">${insEscape(xLabel)}</text>
    <text x="${pad.left - 5}" y="${pad.top + 8}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${Math.round(yMax)}</text>
    <text x="${pad.left - 5}" y="${height - pad.bottom}" text-anchor="end" font-size="9" fill="currentColor" fill-opacity="0.6">${Math.round(yMin)}</text>
    <text x="4" y="${height / 2}" font-size="9" fill="currentColor" fill-opacity="0.7" transform="rotate(-90 4 ${height / 2})">${insEscape(yLabel)}</text>`;

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img">${axis}${dots}</svg>`;
}

function insStackedBar(record) {
  const total = record.w + record.d + record.l;
  if (total === 0) return '<div class="text-secondary small">—</div>';
  const part = (value, color) => (value > 0
    ? `<div style="width:${(value / total) * 100}%;background:${color}" title="${value}"></div>`
    : '');
  return `<div class="d-flex rounded-pill overflow-hidden" style="height:10px;background:rgba(128,128,128,0.15)">
    ${part(record.w, INS_COLORS.win)}${part(record.d, INS_COLORS.draw)}${part(record.l, INS_COLORS.loss)}</div>`;
}

/* --- src/components/insightsModal.js --- */
const INSIGHTS_MODAL_ID = 'insights-modal';
const INSIGHTS_MOVE_CLASSES = ['brilliant', 'great', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder', 'missed_win'];
const INSIGHTS_CARD_STYLE = 'background: var(--arcade-card-hover); border: 1px solid var(--arcade-border); border-radius: 0.75rem;';

function insFormatDuration(ms) {
  if (ms === null || ms === undefined) return 'estimating...';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'less than a minute';
  if (minutes < 90) return `~${minutes} min`;
  return `~${(minutes / 60).toFixed(1)} h`;
}

function insFormatValue(value, suffix = '') {
  return value === null || value === undefined ? '—' : `${value}${suffix}`;
}

function insKpi(label, value, sub = '') {
  return `<div class="col-6 col-md-3">
    <div class="p-2 h-100" style="${INSIGHTS_CARD_STYLE}">
      <div class="text-secondary text-uppercase fw-bold" style="font-size: 10px; letter-spacing: 0.5px;">${label}</div>
      <div class="fw-black fs-4 font-monospace lh-1 my-1">${value}</div>
      <div class="text-secondary" style="font-size: 11px;">${sub}</div>
    </div>
  </div>`;
}

function insCard(title, body, columns = 'col-12 col-md-6') {
  return `<div class="${columns}">
    <div class="p-3 h-100" style="${INSIGHTS_CARD_STYLE}">
      <div class="fw-black small mb-2">${title}</div>
      ${body}
    </div>
  </div>`;
}

function insRecordRow(label, stats) {
  return `<div class="mb-2">
    <div class="d-flex justify-content-between small mb-1">
      <span class="fw-bold">${label}</span>
      <span class="text-secondary font-monospace">${stats.record.w}W ${stats.record.d}D ${stats.record.l}L · ${insFormatValue(stats.score, '%')}</span>
    </div>
    ${insStackedBar(stats.record)}
  </div>`;
}

function insHighlightList(items, emptyText) {
  if (items.length === 0) return `<div class="text-secondary small">${emptyText}</div>`;
  return items.map((h, idx) => `
    <div class="d-flex align-items-center justify-content-between gap-2 py-1 border-bottom" style="border-color: var(--arcade-border) !important;">
      <div class="min-w-0">
        <div class="fw-bold small text-truncate">vs ${insEscape(h.oppName)} <span class="text-secondary font-monospace">(${h.oppElo})</span></div>
        <div class="text-secondary" style="font-size: 11px;">${insEscape(h.date)} · ${h.color === 'w' ? 'White' : 'Black'} · ${h.acc}% accuracy</div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-warning fw-bold py-0 px-2" data-highlight="${idx}">Review</button>
    </div>`).join('');
}

function insNotesList(notes, type, emptyText) {
  const items = notes.filter((n) => n.type === type);
  if (items.length === 0) return `<div class="text-secondary small">${emptyText}</div>`;
  const icon = type === 'strength' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger';
  return items.map((n) => `<div class="d-flex gap-2 small mb-2"><i class="bi ${icon} mt-1"></i><span>${insEscape(n.text)}</span></div>`).join('');
}

function insOpeningsTable(openings) {
  if (openings.length === 0) return '<div class="text-secondary small">Not enough data.</div>';
  const rows = openings.map((o) => `<tr>
    <td class="text-truncate" style="max-width: 190px;">${insEscape(o.name)}</td>
    <td class="text-end font-monospace">${o.games}</td>
    <td class="text-end font-monospace">${o.record.w}/${o.record.d}/${o.record.l}</td>
    <td class="text-end font-monospace">${insFormatValue(o.score, '%')}</td>
    <td class="text-end font-monospace">${insFormatValue(o.accuracy, '%')}</td>
  </tr>`).join('');
  return `<table class="table table-sm align-middle mb-0" style="font-size: 12px;">
    <thead><tr><th>Opening</th><th class="text-end">Games</th><th class="text-end">W/D/L</th><th class="text-end">Score</th><th class="text-end">Acc</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function insTimeControlTable(rows) {
  if (rows.length === 0) return '<div class="text-secondary small">Not enough data.</div>';
  return rows.map((t) => insRecordRow(`${t.label} · ${t.games} games · ${insFormatValue(t.accuracy, '% acc')}`, t)).join('');
}

function insMoveQualityChart(report) {
  const items = INSIGHTS_MOVE_CLASSES.map((cls) => ({
    label: COMIC_DICTIONARY[cls]?.words[0].split(' ')[0] || cls,
    value: report.moves.totals[cls] || 0,
    color: COMIC_DICTIONARY[cls]?.bg
  }));
  return insBarChart(items, { height: 170 });
}

function insReportHtml(entry, username, partial) {
  const r = entry.report;
  const eloDiff = r.avgOpponentElo - r.avgOwnElo;
  const eloTrend = r.currentElo - r.startElo;
  const range = [r.firstDate, r.lastDate];

  const kpis = [
    insKpi('Games', r.games, `${insEscape(r.firstDate)} → ${insEscape(r.lastDate)}`),
    insKpi('Record', `${r.record.w}-${r.record.d}-${r.record.l}`, `${r.winRate}% wins · ${r.score}% score`),
    insKpi('Accuracy', `${r.avgAccuracy}%`, `Opponents: ${insFormatValue(r.avgOpponentAccuracy, '%')}`),
    insKpi('Performance', r.avgPerformanceElo, 'Avg game performance Elo'),
    insKpi('Avg rating', r.avgOwnElo, `Now ${r.currentElo} (${eloTrend >= 0 ? '+' : ''}${eloTrend}) · Peak ${r.peakElo}`),
    insKpi('Avg opponent', r.avgOpponentElo, `${eloDiff >= 0 ? '+' : ''}${eloDiff} vs your average`),
    insKpi('Game length', `${r.avgGameLength}`, 'Average moves per game'),
    insKpi('Streaks', `${r.streaks.bestWin}W / ${r.streaks.worstLoss}L`, 'Best win / worst loss streak')
  ].join('');

  const resultSlices = [
    { label: 'Wins', value: r.record.w, color: INS_COLORS.win },
    { label: 'Draws', value: r.record.d, color: INS_COLORS.draw },
    { label: 'Losses', value: r.record.l, color: INS_COLORS.loss }
  ];

  const phaseItems = ['opening', 'middlegame', 'endgame'].map((p) => ({
    label: p[0].toUpperCase() + p.slice(1),
    value: r.phaseAccuracy[p],
    color: p === 'opening' ? INS_COLORS.blue : p === 'middlegame' ? INS_COLORS.accent : INS_COLORS.win
  }));
  const phaseErrorItems = ['opening', 'middlegame', 'endgame'].map((p) => ({
    label: p[0].toUpperCase() + p.slice(1),
    value: r.phaseErrorsPer100[p],
    color: INS_COLORS.loss
  }));

  const resultColor = { w: INS_COLORS.win, d: INS_COLORS.draw, l: INS_COLORS.loss };
  const scatterPoints = r.timeline.map((t) => ({ x: t.oppElo, y: t.acc, color: resultColor[t.result] }));

  const charts = [
    insCard('Rating over time', `${insLineChart([
      { values: r.timeline.map((t) => t.ownElo), color: INS_COLORS.accent },
      { values: r.timeline.map((t) => t.oppElo), color: INS_COLORS.draw },
      { values: r.timeline.map((t) => t.perf), color: INS_COLORS.purple }
    ], { xLabels: range })}
      <div class="small text-secondary mt-1"><span style="color:${INS_COLORS.accent}">■</span> You <span style="color:${INS_COLORS.draw}">■</span> Opponent <span style="color:${INS_COLORS.purple}">■</span> Performance</div>`),
    insCard('Accuracy over time', insLineChart([
      { values: r.timeline.map((t) => t.acc), color: INS_COLORS.win }
    ], { xLabels: range, yFormat: (v) => `${Math.round(v)}%` })),
    insCard('Results', `<div class="d-flex align-items-center gap-3">
        ${insDonut(resultSlices, `${r.winRate}%`, 'win rate')}
        <div class="flex-grow-1">
          ${insRecordRow('As White', r.byColor.w)}
          ${insRecordRow('As Black', r.byColor.b)}
        </div>
      </div>`),
    insCard('Results vs opponent strength', `
      ${insRecordRow(`Stronger opponents (+50) · ${r.byOpponentStrength.stronger.games} games`, r.byOpponentStrength.stronger)}
      ${insRecordRow(`Similar rating · ${r.byOpponentStrength.equal.games} games`, r.byOpponentStrength.equal)}
      ${insRecordRow(`Weaker opponents (-50) · ${r.byOpponentStrength.weaker.games} games`, r.byOpponentStrength.weaker)}`),
    insCard('Accuracy by phase', insBarChart(phaseItems, { max: 100, unit: '%' })),
    insCard('Mistakes + blunders per 100 moves, by phase', insBarChart(phaseErrorItems)),
    insCard('Move quality totals', `${insMoveQualityChart(r)}
      <div class="small text-secondary mt-1">${r.moves.brilliantPerGame} brilliant and ${r.moves.greatPerGame} great moves per game · ${r.moves.blunderRate}% blunders · ${r.moves.mistakeRate}% mistakes</div>`),
    insCard('Accuracy vs opponent rating', `${insScatter(scatterPoints, { xLabel: 'Opponent rating', yLabel: 'Accuracy %' })}
      <div class="small text-secondary mt-1"><span style="color:${INS_COLORS.win}">●</span> Win <span style="color:${INS_COLORS.draw}">●</span> Draw <span style="color:${INS_COLORS.loss}">●</span> Loss</div>`),
    insCard('Accuracy distribution (games)', insBarChart(r.accuracyHistogram, { color: INS_COLORS.blue })),
    insCard('Time controls', insTimeControlTable(r.byTimeControl)),
    insCard('Most played openings', insOpeningsTable(r.openings), 'col-12')
  ].join('');

  return `
    <div class="d-flex align-items-start justify-content-between gap-2 mb-3">
      <div>
        <h5 class="fw-black mb-0"><i class="bi bi-graph-up-arrow text-warning me-1"></i>In-depth Insights · ${insEscape(username)}</h5>
        <div class="text-secondary small">${partial ? 'Partial report (analysis stopped early)' : `Updated ${new Date(entry.generatedAt).toLocaleString()}`} · ${r.games} games analyzed at deep engine depth</div>
      </div>
      <div class="d-flex gap-2 flex-shrink-0">
        <button type="button" class="btn btn-sm btn-outline-warning fw-bold" id="insights-refresh"><i class="bi bi-arrow-repeat me-1"></i>${partial ? 'Continue' : 'Refresh'}</button>
        <button type="button" class="btn btn-sm btn-outline-danger fw-bold" id="insights-clear"><i class="bi bi-trash3 me-1"></i>Clear</button>
        <button type="button" class="btn-close" id="insights-close" aria-label="Close"></button>
      </div>
    </div>
    <div class="row g-2 mb-3">${kpis}</div>
    <div class="row g-3 mb-3">
      ${insCard('<i class="bi bi-check-circle-fill text-success me-1"></i>Strengths', insNotesList(r.notes, 'strength', 'Play more games to reveal strengths.'))}
      ${insCard('<i class="bi bi-exclamation-triangle-fill text-danger me-1"></i>Weaknesses', insNotesList(r.notes, 'weakness', 'No clear weaknesses found.'))}
    </div>
    <div class="row g-3 mb-3">${charts}</div>
    <div class="row g-3">
      ${insCard('<i class="bi bi-trophy-fill text-warning me-1"></i>Best wins (highest-rated opponents)', `<div data-list="wins">${insHighlightList(r.bestWins, 'No wins yet.')}</div>`)}
      ${insCard('<i class="bi bi-emoji-frown-fill text-danger me-1"></i>Worst losses (lowest-rated opponents)', `<div data-list="losses">${insHighlightList(r.worstLosses, 'No losses. Impressive!')}</div>`)}
      ${insCard('Most accurate game', `<div data-list="best">${insHighlightList([r.bestAccuracyGame], '')}</div>`)}
      ${insCard('Least accurate game', `<div data-list="worst">${insHighlightList([r.worstAccuracyGame], '')}</div>`)}
    </div>`;
}

function insProgressHtml(username, hasReport) {
  return `
    <div class="text-center py-5 px-3">
      <div class="spinner-border text-warning mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
      <h5 class="fw-black mb-1">Analyzing last 100 games for ${insEscape(username)}</h5>
      <p class="text-secondary small mb-3" id="insights-status">Fetching games...</p>
      <div class="progress mx-auto mb-2" style="max-width: 420px; height: 12px;">
        <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" id="insights-bar" style="width: 3%"></div>
      </div>
      <div class="small font-monospace text-secondary mb-3" id="insights-eta"></div>
      <p class="text-secondary small mx-auto" style="max-width: 440px;">Deep analysis takes a while. Finished games are saved as they complete, so you can stop and continue later.</p>
      <button type="button" class="btn btn-outline-secondary fw-bold" id="insights-stop">${hasReport ? 'Stop and view report' : 'Stop'}</button>
    </div>`;
}

function closeInsights() {
  document.getElementById(INSIGHTS_MODAL_ID)?.remove();
}

async function openInsights({ platform, username, onSelectGame }) {
  closeInsights();

  const overlay = document.createElement('div');
  overlay.className = 'why-modal-backdrop';
  overlay.id = INSIGHTS_MODAL_ID;
  overlay.innerHTML = '<div class="why-dialog p-3 p-md-4 shadow-lg" id="insights-dialog" style="max-width: 1040px; width: 100%; max-height: 94vh; overflow-y: auto; border-radius: 1.25rem; background: var(--arcade-card); border: 1px solid var(--arcade-border);"></div>';
  document.body.appendChild(overlay);
  const dialog = overlay.querySelector('#insights-dialog');

  let cancelRequested = false;
  let activeEntry = null;

  const bindReport = (entry, partial) => {
    activeEntry = entry;
    dialog.innerHTML = insReportHtml(entry, username, partial);
    dialog.querySelector('#insights-close')?.addEventListener('click', closeInsights);
    dialog.querySelector('#insights-refresh')?.addEventListener('click', () => startRun(true));
    dialog.querySelector('#insights-clear')?.addEventListener('click', () => {
      clearInsights(platform, username);
      closeInsights();
    });

    const groups = {
      wins: entry.report.bestWins,
      losses: entry.report.worstLosses,
      best: [entry.report.bestAccuracyGame],
      worst: [entry.report.worstAccuracyGame]
    };
    dialog.querySelectorAll('[data-list]').forEach((listEl) => {
      listEl.querySelectorAll('[data-highlight]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = groups[listEl.dataset.list][Number(btn.dataset.highlight)];
          closeInsights();
          if (item && onSelectGame) onSelectGame(item.pgn, item.color);
        });
      });
    });
  };

  const showMessage = (html) => {
    dialog.innerHTML = `<div class="text-center py-5">${html}
      <div class="mt-3"><button type="button" class="btn btn-outline-secondary fw-bold" id="insights-close">Close</button></div></div>`;
    dialog.querySelector('#insights-close')?.addEventListener('click', closeInsights);
  };

  const updateStatus = (status) => {
    const statusEl = dialog.querySelector('#insights-status');
    const barEl = dialog.querySelector('#insights-bar');
    const etaEl = dialog.querySelector('#insights-eta');
    if (!statusEl || status.stage === 'fetching') return;
    const done = status.done;
    const plyFraction = status.plyTotal ? status.ply / status.plyTotal : 0;
    const progress = status.total ? ((done + plyFraction) / status.total) * 100 : 0;
    statusEl.textContent = `Game ${done + 1} of ${status.total}: vs ${status.game.white.toLowerCase() === username.trim().toLowerCase() ? status.game.black : status.game.white}${status.plyTotal ? ` · move ${Math.ceil(status.ply / 2)}/${Math.ceil(status.plyTotal / 2)}` : ''}`;
    if (barEl) barEl.style.width = `${Math.max(3, progress)}%`;
    if (etaEl) etaEl.textContent = `Time remaining: ${insFormatDuration(status.etaMs)}`;
  };

  const startRun = async (force) => {
    cancelRequested = false;
    dialog.innerHTML = insProgressHtml(username, Boolean(activeEntry?.report));
    dialog.querySelector('#insights-stop')?.addEventListener('click', () => {
      cancelRequested = true;
      const stopBtn = dialog.querySelector('#insights-stop');
      if (stopBtn) stopBtn.disabled = true;
    });

    try {
      const { entry, cancelled } = await runInsights({
        platform,
        username,
        force,
        onStatus: updateStatus,
        shouldCancel: () => cancelRequested || !document.getElementById(INSIGHTS_MODAL_ID)
      });
      if (!document.getElementById(INSIGHTS_MODAL_ID)) return;
      if (entry.report) bindReport(entry, cancelled);
      else showMessage('<i class="bi bi-info-circle fs-1 text-secondary"></i><p class="mt-2 mb-0">No analyzable rated games were found for this player.</p>');
    } catch (err) {
      if (!document.getElementById(INSIGHTS_MODAL_ID)) return;
      showMessage(`<i class="bi bi-exclamation-octagon fs-1 text-danger"></i><p class="mt-2 mb-0">${insEscape(err.message || 'Failed to build insights.')}</p>`);
    }
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && !dialog.querySelector('#insights-stop')) closeInsights();
  });

  const cached = loadInsights(platform, username);
  if (isInsightsFresh(cached)) {
    bindReport(cached, false);
  } else {
    activeEntry = cached;
    startRun(false);
  }
}

/* --- src/components/importModal.js --- */
/**
 * Vanilla JS Import Modal Component
 * Bootstrap 5 modal supporting Chess.com, Lichess, and custom PGN imports.
 * Only analyzes user-imported games with live Stockfish progress.
 */






class ImportModal {
  constructor(modalEl, options = {}) {
    this.modalEl = modalEl;
    this.onSelectPgn = options.onSelectPgn || null; // (pgn, userColor) => {}

    this.activeTab = 'chesscom';
    this.username = '';
    this.isFetching = false;
    this.fetchedGames = [];
    this.fetchError = null;
    this.customPgn = '';
    this.customColor = 'w';

    this.isAnalyzing = false;
    this.analysisProgress = { current: 0, total: 0 };
    this.bsModal = null;

    window.addEventListener('chess_iq_game_analyzed', () => {
      if (this.fetchedGames.length > 0) this.renderTabContent();
    });
    window.addEventListener('chess_iq_cache_cleared', () => {
      if (this.fetchedGames.length > 0) this.renderTabContent();
    });
    window.addEventListener('chess_iq_cache_updated', () => {
      if (this.fetchedGames.length > 0) this.renderTabContent();
    });

    this.render();
  }

  formatOpeningBadge(eco) {
    if (!eco) {
      return `<span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">PGN</span>`;
    }
    if (typeof eco === 'string' && eco.startsWith('http')) {
      let label = 'Opening';
      try {
        const slug = eco.split('/openings/')[1] || eco.split('/').filter(Boolean).pop();
        if (slug) {
          const raw = slug.split(/-\d+\./)[0].replace(/-/g, ' ').trim();
          label = decodeURIComponent(raw) || 'Opening';
        }
      } catch {}
      return `<a href="${eco}" target="_blank" rel="noopener noreferrer"
        class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-inline-block text-truncate text-decoration-none"
        style="max-width: 130px; font-size: 11px; vertical-align: middle;"
        title="${label} (${eco})"
        onclick="event.stopPropagation();">
        <i class="bi bi-book me-1"></i>${label} <i class="bi bi-box-arrow-up-right ms-0.5" style="font-size: 9px;"></i>
      </a>`;
    }
    return `<span class="badge bg-body-secondary text-secondary font-monospace d-inline-block text-truncate" style="max-width: 110px; font-size: 10px; vertical-align: middle;">${eco}</span>`;
  }

  getBsModal() {
    if (this.bsModal) return this.bsModal;
    try {
      if (window.bootstrap?.Modal) {
        this.bsModal = window.bootstrap.Modal.getOrCreateInstance(this.modalEl);
      }
      return this.bsModal;
    } catch {
      return null;
    }
  }

  resetCardStates() {
    this.isAnalyzing = false;
    const container = this.modalEl.querySelector('#import-tab-body');
    if (!container) return;
    container.querySelectorAll('[data-game-id]').forEach((card) => {
      card.style.pointerEvents = 'auto';
      card.style.opacity = '1';
      card.classList.remove('border-warning');
      const btn = card.querySelector('.btn-analyze-card');
      if (btn) {
        btn.innerHTML = `Analyze <i class="bi bi-chevron-right ms-0.5"></i>`;
        btn.classList.remove('disabled');
      }
    });
    const customBtn = container.querySelector('#btn-analyze-custom-pgn');
    if (customBtn) {
      customBtn.innerHTML = `Analyze PGN with Stockfish ⚡`;
      customBtn.disabled = !this.customPgn.trim();
    }
  }

  show() {
    this.resetCardStates();
    const modal = this.getBsModal();
    if (modal) {
      modal.show();
    } else {
      this.modalEl.classList.add('show');
      this.modalEl.style.display = 'block';
      this.modalEl.removeAttribute('aria-hidden');
      this.modalEl.setAttribute('aria-modal', 'true');
      document.body.classList.add('modal-open');
      let backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', () => this.hide());
      }
    }
  }

  hide() {
    this.resetCardStates();
    const modal = this.getBsModal();
    if (modal) {
      try { modal.hide(); } catch {}
    }
    this.modalEl.classList.remove('show');
    this.modalEl.style.display = 'none';
    this.modalEl.setAttribute('aria-hidden', 'true');
    this.modalEl.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
  }

  setAnalyzing(isAnalyzing, current = 0, total = 0) {
    this.isAnalyzing = isAnalyzing;
    this.analysisProgress = { current, total };
    if (!isAnalyzing) {
      this.resetCardStates();
    }
    this.updateProgress();
  }

  async handleFetch() {
    if (!this.username.trim() || this.isFetching) return;
    this.isFetching = true;
    this.fetchError = null;
    this.fetchedGames = [];
    this.renderTabContent();

    try {
      if (this.activeTab === 'chesscom') {
        const games = await fetchChessComGames(this.username);
        this.fetchedGames = games;
        if (games.length === 0) this.fetchError = 'No recent games found for this player.';
        else backgroundAnalysisQueue.setQueue(games, this.username);
      } else if (this.activeTab === 'lichess') {
        const games = await fetchLichessGames(this.username);
        this.fetchedGames = games;
        if (games.length === 0) this.fetchError = 'No recent games found for this player.';
        else backgroundAnalysisQueue.setQueue(games, this.username);
      }
    } catch (err) {
      this.fetchError = err.message || 'Failed to fetch games.';
    } finally {
      this.isFetching = false;
      this.renderTabContent();
    }
  }

  updateProgress() {
    const progressContainer = this.modalEl.querySelector('#import-analysis-progress');
    const tabsContainer = this.modalEl.querySelector('#import-tabs-content');
    if (!progressContainer || !tabsContainer) return;

    if (this.isAnalyzing) {
      progressContainer.classList.remove('d-none');
      tabsContainer.classList.add('d-none');

      const pct = this.analysisProgress.total > 0
        ? (this.analysisProgress.current / this.analysisProgress.total) * 100
        : 0;

      progressContainer.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-warning mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
          <h5 class="fw-black mb-1">Analyzing Imported Game with Stockfish...</h5>
          <p class="text-secondary small font-medium mb-3">
            Evaluating ply ${this.analysisProgress.current} of ${this.analysisProgress.total} · Generating comic sound effect badges
          </p>
          <div class="progress mx-auto" style="width: 240px; height: 10px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    } else {
      progressContainer.classList.add('d-none');
      tabsContainer.classList.remove('d-none');
    }
  }

  renderTabContent() {
    const container = this.modalEl.querySelector('#import-tab-body');
    if (!container) return;

    if (this.activeTab === 'chesscom' || this.activeTab === 'lichess') {
      const platformName = this.activeTab === 'chesscom' ? 'Chess.com' : 'Lichess';
      container.innerHTML = `
        <div class="d-flex flex-column gap-3">
          <div class="input-group">
            <span class="input-group-text bg-body-secondary border-end-0 text-secondary"><i class="bi bi-person-fill"></i></span>
            <input type="text" class="form-control border-start-0 ps-1" id="platform-username-input"
              placeholder="Enter ${platformName} username..." value="${this.username}">
            <button type="button" class="btn btn-warning fw-black px-3 d-flex align-items-center" id="btn-fetch-platform" ${this.isFetching ? 'disabled' : ''}>
              ${this.isFetching ? '<span class="spinner-border spinner-border-sm me-1.5"></span>Fetching...' : '<i class="bi bi-search me-1.5"></i>Fetch'}
            </button>
          </div>

          ${this.isFetching ? `
            <div class="placeholder-wave d-flex flex-column gap-2 mt-2 w-100">
              <div class="comic-card-sm p-3 w-100 border border-secondary border-opacity-25">
                <div class="d-flex justify-content-between mb-2">
                  <span class="placeholder col-4 bg-warning rounded py-1"></span>
                  <span class="placeholder col-2 bg-secondary rounded py-1"></span>
                </div>
                <div class="d-flex flex-column gap-1.5">
                  <span class="placeholder col-7 bg-body-secondary rounded"></span>
                  <span class="placeholder col-5 bg-body-secondary rounded"></span>
                </div>
              </div>
              <div class="comic-card-sm p-3 w-100 border border-secondary border-opacity-25">
                <div class="d-flex justify-content-between mb-2">
                  <span class="placeholder col-3 bg-warning rounded py-1"></span>
                  <span class="placeholder col-2 bg-secondary rounded py-1"></span>
                </div>
                <div class="d-flex flex-column gap-1.5">
                  <span class="placeholder col-6 bg-body-secondary rounded"></span>
                  <span class="placeholder col-4 bg-body-secondary rounded"></span>
                </div>
              </div>
            </div>
          ` : ''}

          ${this.fetchError ? `
            <div class="alert alert-danger py-2 px-3 small font-medium mb-0">${this.fetchError}</div>
          ` : ''}

          ${this.fetchedGames.length > 0 ? `
            <div class="d-flex flex-column gap-2 mt-1 w-100">
              <div class="d-flex align-items-center justify-content-between">
                <span class="small fw-bold text-secondary">Select a recent game to analyze:</span>
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-warning btn-sm py-0.5 px-2 fw-bold comic-btn" id="btn-open-insights" style="font-size: 11px;">
                    <i class="bi bi-graph-up-arrow me-1"></i>In-depth Insights (100 games)
                  </button>
                  ${getCacheStats().count > 0 ? `
                    <button type="button" class="btn btn-outline-danger btn-sm py-0.5 px-2 fw-bold comic-btn" id="btn-clear-game-cache" style="font-size: 11px;">
                      <i class="bi bi-trash3 me-1"></i>Clear Cache (${getCacheStats().count})
                    </button>
                  ` : ''}
                </div>
              </div>
              <div class="d-flex flex-column gap-2 overflow-y-auto overflow-x-hidden pe-1 w-100" style="max-height: 280px; scrollbar-width: thin;">
                ${this.fetchedGames.map((g) => {
                  const isUserWhite = g.white.toLowerCase() === this.username.trim().toLowerCase();
                  const isUserBlack = g.black.toLowerCase() === this.username.trim().toLowerCase();
                  const userColor = isUserWhite ? 'w' : (isUserBlack ? 'b' : 'w');
                  const cacheInfo = getGameCacheInfo(g.id || g.pgn, userColor);
                  const isReviewed = Boolean(cacheInfo);

                  let userWon = false;
                  let userLost = false;
                  const isDraw = g.result === '1/2-1/2';

                  if (g.result === '1-0') {
                    if (isUserWhite) userWon = true;
                    else if (isUserBlack) userLost = true;
                  } else if (g.result === '0-1') {
                    if (isUserBlack) userWon = true;
                    else if (isUserWhite) userLost = true;
                  }

                  let resultBadge = '';
                  if (userWon) {
                    resultBadge = `<span class="badge bg-success text-white fw-bold px-2 py-1 flex-shrink-0"><i class="bi bi-trophy-fill me-1"></i>Win</span>`;
                  } else if (userLost) {
                    resultBadge = `<span class="badge bg-danger text-white fw-bold px-2 py-1 flex-shrink-0"><i class="bi bi-x-circle-fill me-1"></i>Loss</span>`;
                  } else if (isDraw) {
                    resultBadge = `<span class="badge bg-secondary text-white fw-bold px-2 py-1 flex-shrink-0">Draw</span>`;
                  } else {
                    resultBadge = `<span class="badge bg-body-secondary text-dark fw-bold px-2 py-1 flex-shrink-0">${g.result}</span>`;
                  }

                  let tcIcon = 'bi-stopwatch';
                  if (g.timeControl && (g.timeControl.includes('+') || !isNaN(Number(g.timeControl)))) {
                    tcIcon = 'bi-lightning-charge-fill';
                  }

                  const cardStatusClass = userWon ? 'card-win' : (userLost ? 'card-loss' : (isDraw ? 'card-draw' : ''));

                  return `
                    <div class="imported-game-card ${cardStatusClass} p-3 cursor-pointer w-100 mb-1" data-game-id="${g.id}">
                      <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-light-subtle gap-2 flex-nowrap">
                        <div class="d-flex align-items-center gap-2 overflow-hidden me-auto" style="min-width: 0;">
                          <span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-bold flex-shrink-0" style="font-size: 11px;">
                            <i class="bi ${tcIcon} me-1"></i>${g.timeControl}
                          </span>
                          ${this.formatOpeningBadge(g.eco)}
                        </div>
                        <div class="d-flex align-items-center gap-2 flex-shrink-0">
                          ${isReviewed ? `
                            <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold font-monospace" style="font-size: 10px;">
                              <i class="bi bi-lightning-charge-fill me-0.5"></i>Reviewed
                            </span>
                          ` : ''}
                          <span class="text-secondary small font-monospace text-nowrap" style="font-size: 11px;">${g.date}</span>
                          ${resultBadge}
                        </div>
                      </div>

                      <div class="d-flex align-items-center justify-content-between gap-3" style="min-width: 0;">
                        <div class="d-flex flex-column gap-1 flex-grow-1" style="min-width: 0; overflow: hidden;">
                          <div class="d-flex align-items-center gap-2 ${isUserWhite ? 'fw-black text-warning' : 'fw-medium text-body'}" style="min-width: 0;">
                            <span class="fs-6 lh-1">⚪</span>
                            <span class="text-truncate" style="max-width: 170px;">${g.white}</span>
                            <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">${g.whiteElo}</span>
                            ${isUserWhite ? '<span class="badge bg-warning text-dark fw-bold px-1.5 py-0.5" style="font-size: 9px;">YOU</span>' : ''}
                          </div>

                          <div class="d-flex align-items-center gap-2 ${isUserBlack ? 'fw-black text-warning' : 'fw-medium text-body'}" style="min-width: 0;">
                            <span class="fs-6 lh-1">⚫</span>
                            <span class="text-truncate" style="max-width: 170px;">${g.black}</span>
                            <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 10px;">${g.blackElo}</span>
                            ${isUserBlack ? '<span class="badge bg-warning text-dark fw-bold px-1.5 py-0.5" style="font-size: 9px;">YOU</span>' : ''}
                          </div>

                          ${isReviewed ? `
                            <div class="d-flex align-items-center gap-1.5 mt-0.5">
                              <span class="badge bg-success-subtle text-success font-monospace fw-bold" style="font-size: 10px;">🎯 ${cacheInfo.accuracy}% acc</span>
                              <span class="badge bg-primary-subtle text-primary font-monospace fw-bold" style="font-size: 10px;">⭐ ${cacheInfo.elo} Elo</span>
                            </div>
                          ` : ''}
                        </div>

                        <div class="flex-shrink-0">
                          <button type="button" class="arcade-btn-primary px-3 py-1.5 text-nowrap btn-analyze-card d-flex align-items-center gap-1.5 ${isReviewed ? 'bg-success border-success' : ''}" style="border-radius: 0.65rem; font-size: 13px !important;">
                            <span>${isReviewed ? 'View Review' : 'Analyze'}</span> <i class="bi ${isReviewed ? 'bi-lightning-charge-fill' : 'bi-chevron-right'}" style="font-size: 11px;"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      const input = container.querySelector('#platform-username-input');
      input?.addEventListener('input', (e) => { this.username = e.target.value; });
      input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleFetch(); });
      container.querySelector('#btn-fetch-platform')?.addEventListener('click', () => this.handleFetch());

      container.querySelector('#btn-open-insights')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openInsights({
          platform: this.activeTab,
          username: this.username,
          onSelectGame: (pgn, userColor) => this.onSelectPgn && this.onSelectPgn(pgn, userColor)
        });
      });

      container.querySelector('#btn-clear-game-cache')?.addEventListener('click', (e) => {
        e.stopPropagation();
        clearGameCache();
        this.renderTabContent();
      });

      container.querySelectorAll('[data-game-id]').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (this.isAnalyzing) return;
          const gameId = e.currentTarget.getAttribute('data-game-id');
          const game = this.fetchedGames.find((g) => g.id === gameId);
          if (game && this.onSelectPgn) {
            const isWhite = game.white.toLowerCase() === this.username.trim().toLowerCase();
            const userColor = isWhite ? 'w' : 'b';
            const cacheInfo = getGameCacheInfo(game.id || game.pgn, userColor);

            if (cacheInfo) {
              this.onSelectPgn(game.pgn, userColor);
              return;
            }

            this.isAnalyzing = true;
            const btn = card.querySelector('.btn-analyze-card');
            if (btn) {
              btn.innerHTML = `<span class="spinner-border spinner-border-sm text-warning me-1"></span>Analyzing...`;
              btn.classList.add('disabled');
            }
            container.querySelectorAll('[data-game-id]').forEach((c) => {
              c.style.pointerEvents = 'none';
              c.style.opacity = '0.65';
            });
            card.style.opacity = '1';
            card.classList.add('border-warning');
            setTimeout(() => {
              this.onSelectPgn(game.pgn, userColor);
            }, 40);
          }
        });
      });
    } else {
      // Paste PGN Tab
      container.innerHTML = `
        <div class="d-flex flex-column gap-3">
          <div>
            <label class="form-label small fw-bold mb-1">Paste standard PGN notation below:</label>
            <textarea class="form-control font-monospace" id="custom-pgn-textarea" rows="6"
              placeholder="[Event &quot;Live Chess&quot;]&#10;1. e4 e5 2. Nf3 Nc6 3. Bc4...">${this.customPgn}</textarea>
          </div>

          <div class="d-flex align-items-center justify-content-between">
            <span class="small fw-bold text-secondary">Analyze perspective:</span>
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-sm ${this.customColor === 'w' ? 'btn-dark' : 'btn-outline-dark'} fw-bold" id="btn-color-white">White</button>
              <button type="button" class="btn btn-sm ${this.customColor === 'b' ? 'btn-dark' : 'btn-outline-dark'} fw-bold" id="btn-color-black">Black</button>
            </div>
          </div>

          <button type="button" class="arcade-btn-primary py-2.5 w-100 fw-black" id="btn-analyze-custom-pgn" ${!this.customPgn.trim() ? 'disabled' : ''}>
            Analyze PGN with Stockfish ⚡
          </button>
        </div>
      `;

      const textarea = container.querySelector('#custom-pgn-textarea');
      const submitBtn = container.querySelector('#btn-analyze-custom-pgn');

      textarea?.addEventListener('input', (e) => {
        this.customPgn = e.target.value;
        if (submitBtn) {
          submitBtn.disabled = !this.customPgn.trim();
        }
      });

      container.querySelector('#btn-color-white')?.addEventListener('click', () => {
        this.customColor = 'w';
        this.renderTabContent();
      });

      container.querySelector('#btn-color-black')?.addEventListener('click', () => {
        this.customColor = 'b';
        this.renderTabContent();
      });

      submitBtn?.addEventListener('click', () => {
        if (this.customPgn.trim() && this.onSelectPgn) {
          submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Starting Review...`;
          submitBtn.disabled = true;
          this.onSelectPgn(this.customPgn.trim(), this.customColor);
        }
      });
    }
  }

  render() {
    this.modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content comic-card overflow-hidden">
          <div class="modal-header border-bottom bg-body-tertiary px-3 px-sm-4 py-3 d-flex align-items-center justify-content-between">
            <h5 class="modal-title fw-black fs-5 mb-0 d-flex align-items-center">
              <i class="bi bi-cloud-arrow-up-fill me-2 fg-warning"></i>Import Game for Review
            </h5>
            <button type="button" class="btn-close" id="btn-modal-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <!-- Progress overlay when analyzing -->
          <div id="import-analysis-progress" class="d-none px-4"></div>

          <!-- Tab Selector -->
          <div id="import-tabs-content">
            <div class="px-3 pt-3 pb-0 bg-body-tertiary border-bottom">
              <ul class="nav nav-pills nav-fill bg-body-secondary p-1 rounded-3 gap-1 mb-2.5" role="tablist">
                <li class="nav-item">
                  <button class="nav-link py-1.5 px-2 rounded-2 ${this.activeTab === 'chesscom' ? 'active fw-black bg-warning text-dark shadow-sm' : 'fw-bold text-secondary'}" data-import-tab="chesscom" style="font-size: 13px;">
                    <i class="bi bi-check-circle-fill me-1 text-success"></i>Chess.com
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link py-1.5 px-2 rounded-2 ${this.activeTab === 'lichess' ? 'active fw-black bg-warning text-dark shadow-sm' : 'fw-bold text-secondary'}" data-import-tab="lichess" style="font-size: 13px;">
                    <i class="bi bi-globe me-1 text-info"></i>Lichess
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link py-1.5 px-2 rounded-2 ${this.activeTab === 'pgn' ? 'active fw-black bg-warning text-dark shadow-sm' : 'fw-bold text-secondary'}" data-import-tab="pgn" style="font-size: 13px;">
                    <i class="bi bi-file-text-fill me-1 text-primary"></i>Paste PGN
                  </button>
                </li>
              </ul>
            </div>

            <div class="modal-body p-3 p-sm-4 overflow-x-hidden" id="import-tab-body"></div>
          </div>
        </div>
      </div>
    `;

    // Explicit close button click
    this.modalEl.querySelector('#btn-modal-close')?.addEventListener('click', () => this.hide());

    // Backdrop click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.hide();
      }
    });

    // Bind tab clicks
    this.modalEl.querySelectorAll('[data-import-tab]').forEach((tabBtn) => {
      tabBtn.addEventListener('click', (e) => {
        this.activeTab = e.currentTarget.getAttribute('data-import-tab');
        this.fetchError = null;
        this.render();
      });
    });

    this.renderTabContent();
  }
}

/* --- src/components/reviewDashboard.js --- */
/**
 * Vanilla JS Game Review Dashboard Component
 * Displays Stockfish tournament analysis, interactive move history,
 * eval bar, phase ratings, comic sound effect badges, and tactical refutations.
 */


class ReviewDashboard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onOpenImport = options.onOpenImport || null;
    this.onSwitchToBots = options.onSwitchToBots || null;
    this.theme = options.theme || 'green';

    this.game = null; // AnalyzedGame object
    this.isAnalyzing = false;
    this.analysisProgress = { current: 0, total: 0 };
    this.currentPly = 0;
    this.orientation = 'w';
    this.isThreatActive = false;
    this.isPlayingPv = false;
    this.pvTimer = null;
    this.board = null;
    this.analysisStartTime = null;
    this.advantagePoints = [];
    this.advantageMidY = 42;
    this.isRetryingMistake = false;
    this.retryHintActive = false;

    this.initKeyboardNavigation();
    this.render();
  }

  initKeyboardNavigation() {
    this.handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!this.game || this.isRetryingMistake) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.goToPly(this.currentPly - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.goToPly(this.currentPly + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'Home') {
        e.preventDefault();
        this.goToPly(0);
      } else if (e.key === 'ArrowDown' || e.key === 'End') {
        e.preventDefault();
        this.goToPly(this.game.plies.length);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.nextKeyMoment();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.orientation = this.orientation === 'w' ? 'b' : 'w';
        this.updateBoardAndControls();
      }
    };
    window.addEventListener('keydown', this.handleKeyDown);
  }

  showLoading(current = 0, total = 0) {
    if (!this.isAnalyzing || current === 0) {
      this.analysisStartTime = Date.now();
    }
    this.isAnalyzing = true;
    this.analysisProgress = { current, total };

    const card = this.container.querySelector('#review-analysis-card');
    if (card) {
      this.updateLoadingCard(current, total);
    } else {
      this.render();
    }
  }

  updateLoadingCard(current, total) {
    const subtitleEl = this.container.querySelector('#review-analysis-subtitle');
    const barEl = this.container.querySelector('#review-analysis-bar');
    const stepEl = this.container.querySelector('#review-analysis-step');
    const pctEl = this.container.querySelector('#review-analysis-pct');
    const etaEl = this.container.querySelector('#review-analysis-eta');

    const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 10;

    let etaText = 'Estimating time...';
    if (this.analysisStartTime && current > 2 && total > current) {
      const elapsedSec = (Date.now() - this.analysisStartTime) / 1000;
      const secPerPly = elapsedSec / current;
      const remainingSec = Math.max(1, Math.round(secPerPly * (total - current)));
      etaText = `~${remainingSec}s remaining`;
    } else if (current >= total && total > 0) {
      etaText = 'Finalizing report...';
    }

    if (subtitleEl) {
      subtitleEl.textContent = total > 0
        ? `Evaluating ply ${current} of ${total}...`
        : 'Starting rapid engine analysis...';
    }
    if (barEl) {
      barEl.style.width = `${pct}%`;
    }
    if (stepEl) {
      stepEl.textContent = total > 0 ? `${current} / ${total} plies` : 'Initializing...';
    }
    if (pctEl) {
      pctEl.textContent = `${pct}%`;
    }
    if (etaEl) {
      etaEl.textContent = etaText;
    }
  }

  hideLoading() {
    this.isAnalyzing = false;
    this.analysisStartTime = null;
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    if (this.board) {
      this.board.setProps({ theme: newTheme });
    }
  }

  setGame(analyzedGame) {
    this.isAnalyzing = false;
    this.game = analyzedGame;
    this.currentPly = analyzedGame && analyzedGame.plies.length > 0 ? 1 : 0;
    this.orientation = analyzedGame ? analyzedGame.userColor : 'w';
    this.isThreatActive = false;
    this.stopPvPlayback();
    this.render();
  }

  goToPly(ply) {
    if (!this.game) return;
    if (this.isRetryingMistake) {
      this.stopRetryMistake();
    }
    this.currentPly = Math.max(0, Math.min(this.game.plies.length, ply));
    this.stopPvPlayback();

    // Play move sound
    if (this.currentPly > 0 && this.game.plies[this.currentPly - 1]) {
      const p = this.game.plies[this.currentPly - 1];
      if (p.captured) soundService.playCapture();
      else soundService.playMove();

      if (p.classification === 'blunder') soundService.playBlunder();
      else if (p.classification === 'brilliant') soundService.playBrilliant();
    }

    this.updateBoardAndControls();
  }

  startRetryMistake() {
    startRetryMistake(this);
  }

  stopRetryMistake() {
    stopRetryMistake(this);
  }

  nextKeyMoment() {
    if (!this.game) return;
    const keyTypes = ['blunder', 'mistake', 'brilliant', 'great', 'missed_win'];
    for (let i = this.currentPly; i < this.game.plies.length; i++) {
      if (keyTypes.includes(this.game.plies[i].classification)) {
        this.goToPly(i + 1);
        return;
      }
    }
    // Loop to first key moment if none ahead
    for (let i = 0; i < this.currentPly; i++) {
      if (keyTypes.includes(this.game.plies[i].classification)) {
        this.goToPly(i + 1);
        return;
      }
    }
  }

  toggleThreat() {
    this.isThreatActive = !this.isThreatActive;
    this.updateBoardAndControls();
  }

  startShowWhy() {
    this.openWhyModal();
  }

  closeWhyModal() {
    closeWhyModal(this);
  }

  openWhyModal(targetEval = null) {
    return openWhyModal(this, targetEval);
  }

  stopPvPlayback() {
    if (this.pvTimer) {
      clearInterval(this.pvTimer);
      this.pvTimer = null;
    }
    this.isPlayingPv = false;
    this.updatePvBanner(null);
  }

  getCurrentEval() {
    if (!this.game || this.currentPly === 0 || this.currentPly > this.game.plies.length) return null;
    return this.game.plies[this.currentPly - 1];
  }

  updatePvBanner(steps, currentStep = 0) {
    const banner = this.container.querySelector('#pv-banner-area');
    if (!banner) return;

    if (!steps) {
      banner.innerHTML = '';
      banner.classList.add('d-none');
      return;
    }

    banner.classList.remove('d-none');
    banner.innerHTML = `
      <div class="alert alert-primary comic-card-sm d-flex align-items-center justify-content-between p-2.5 mb-2">
        <div class="d-flex align-items-center gap-2">
          <span class="spinner-grow spinner-grow-sm text-primary"></span>
          <span class="small fw-bold">Tactical Continuation (${currentStep + 1}/${steps.length}):</span>
          <span class="badge bg-primary font-monospace">${steps[currentStep]?.san || ''}</span>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary fw-bold" id="btn-exit-pv">Exit Line</button>
      </div>
    `;

    banner.querySelector('#btn-exit-pv')?.addEventListener('click', () => {
      this.stopPvPlayback();
      this.updateBoardAndControls();
    });
  }

  getTopMovesForFen(fen) {
    if (!fen) return { best: null, second: null };
    try {
      const fastKey = typeof normalizeFenKey === 'function' ? `${normalizeFenKey(fen)}_fast` : fen;
      const deepKey = typeof normalizeFenKey === 'function' ? `${normalizeFenKey(fen)}_deep` : fen;
      const cached = typeof FEN_EVAL_CACHE !== 'undefined'
        ? (FEN_EVAL_CACHE.get(deepKey) || FEN_EVAL_CACHE.get(fastKey) || FEN_EVAL_CACHE.get(fen))
        : null;
      let bestUci = cached?.bestMoveUci;
      let secondUci = cached?.secondBestMoveUci;

      if (!bestUci && typeof findBestMoveLocal === 'function') {
        const local = findBestMoveLocal(fen, 2);
        bestUci = local.bestMoveUci;
        secondUci = local.secondBestMoveUci;
      }

      const best = bestUci && bestUci.length >= 4
        ? { from: bestUci.slice(0, 2), to: bestUci.slice(2, 4) }
        : null;

      const second = secondUci && secondUci.length >= 4 && (secondUci.slice(0, 2) !== best?.from || secondUci.slice(2, 4) !== best?.to)
        ? { from: secondUci.slice(0, 2), to: secondUci.slice(2, 4) }
        : null;

      return { best, second };
    } catch {
      return { best: null, second: null };
    }
  }

  updateBoardAndControls() {
    const cur = this.getCurrentEval();
    const fen = cur ? cur.fen : (this.game ? this.game.initialFen : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const lastMove = cur ? { from: cur.from, to: cur.to } : null;

    let bestMove = null;
    let secondBestMove = null;

    if (cur) {
      const isOptimal = ['best', 'brilliant', 'great', 'book'].includes(cur.classification);
      let bestUci = cur.bestMoveUci;
      let secondUci = cur.secondBestMoveUci;

      if (!bestUci || !secondUci) {
        const top = this.getTopMovesForFen(cur.fenBefore);
        if (!bestUci && top.best) bestUci = `${top.best.from}${top.best.to}`;
        if (!secondUci && top.second) secondUci = `${top.second.from}${top.second.to}`;
      }

      if (isOptimal) {
        bestMove = { from: cur.from, to: cur.to };
        secondBestMove = null;
      } else {
        bestMove = bestUci && bestUci.length >= 4
          ? { from: bestUci.slice(0, 2), to: bestUci.slice(2, 4) }
          : null;

        secondBestMove = secondUci && secondUci.length >= 4 && (secondUci.slice(0, 2) !== bestMove?.from || secondUci.slice(2, 4) !== bestMove?.to)
          ? { from: secondUci.slice(0, 2), to: secondUci.slice(2, 4) }
          : null;
      }
    } else {
      const top = this.getTopMovesForFen(fen);
      bestMove = top.best;
      secondBestMove = top.second;
    }

    const threatMove = this.isThreatActive && cur?.threat?.uci && cur.threat.uci.length >= 4
      ? { from: cur.threat.uci.slice(0, 2), to: cur.threat.uci.slice(2, 4) }
      : null;

    const badge = cur ? { square: cur.to, classification: cur.classification } : null;

    this.board?.setProps({
      fen,
      orientation: this.orientation,
      lastMove,
      bestMove,
      secondBestMove,
      threatMove,
      badge,
      whiteName: this.game?.white || 'White',
      blackName: this.game?.black || 'Black',
      showPlayerBars: true,
    });

    // Update Eval Bar
    this.updateEvalBar(cur);
    this.updateAdvantageScrubber();

    // Update Move Strip Badge & Notation
    const stripEl = this.container.querySelector('#review-move-strip');
    if (stripEl) {
      if (cur) {
        const comic = getComicBadge(cur.classification, cur.san);
        const evalStr = cur.mate !== null
          ? `M${Math.abs(cur.mate)}`
          : (cur.scoreCp > 0 ? `+${(cur.scoreCp / 100).toFixed(1)}` : (cur.scoreCp / 100).toFixed(1));

        const isOptimal = ['best', 'brilliant', 'great', 'book'].includes(cur.classification);
        const isSuboptimal = !isOptimal;
        const bestSan = cur.bestMoveSan || (bestMove ? `${bestMove.from}-${bestMove.to}` : '');
        const secondSan = cur.secondBestMoveSan;

        stripEl.innerHTML = `
          <div class="d-flex align-items-center flex-wrap gap-2">
            <span class="badge border border-dark rounded-pill px-2.5 py-1" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 900; font-size: 11px;">
              ${comic.symbol} ${comic.term}
            </span>
            <span class="font-monospace fw-black fs-5">${cur.san}</span>
            <span class="badge bg-body-tertiary text-secondary font-monospace fw-bold">${evalStr}</span>

            ${isSuboptimal && bestSan && bestSan !== cur.san ? `
              <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace fw-bold px-2 py-1" title="Top Engine Move (Thick Arrow)">
                ★ Best: ${bestSan}
              </span>
            ` : ''}

            ${isSuboptimal && secondSan && secondSan !== cur.san && secondSan !== bestSan ? `
              <span class="badge bg-body-secondary text-secondary font-monospace fw-semibold px-2 py-1" title="2nd Best Option (Thin Arrow)">
                2nd: ${secondSan}
              </span>
            ` : ''}
          </div>
          <div class="d-flex align-items-center gap-2">
            ${['inaccuracy', 'mistake', 'blunder'].includes(cur.classification) ? `
              <button type="button" class="btn btn-sm btn-warning fw-bold comic-btn" id="btn-retry-mistake" title="Practice finding the best move">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Retry
              </button>
            ` : ''}
            ${['inaccuracy', 'mistake', 'blunder'].includes(cur.classification) ? `
              <button type="button" class="btn btn-sm btn-outline-danger fw-bold comic-btn" id="btn-show-why" title="Explore what happens in the next 10 moves">
                <i class="bi bi-question-circle me-1"></i>Why ${cur.classification === 'blunder' ? 'Blunder' : (cur.classification === 'mistake' ? 'Mistake' : 'Inaccuracy')}?
              </button>
            ` : ''}
          </div>
        `;
        stripEl.querySelector('#btn-retry-mistake')?.addEventListener('click', () => this.startRetryMistake());
        stripEl.querySelector('#btn-show-why')?.addEventListener('click', () => this.startShowWhy());
      } else {
        stripEl.innerHTML = `
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-secondary rounded-pill px-2.5 py-1">🏁 Start</span>
            <span class="small fw-bold text-secondary">Starting Position</span>
          </div>
        `;
      }
    }

    // Update Step Counter
    const counterEl = this.container.querySelector('#ply-counter');
    if (counterEl) {
      counterEl.textContent = `${this.currentPly} / ${this.game?.plies.length || 0}`;
    }

    // Update Active Row in Move Table (scroll container only, never whole window)
    const scrollContainer = this.container.querySelector('.move-history-container');
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      const plyNum = parseInt(row.dataset.ply, 10);
      if (plyNum === this.currentPly) {
        row.classList.add('bg-warning-subtle', 'fw-black', 'border', 'border-warning');
        if (scrollContainer) {
          const rowTop = row.offsetTop;
          const rowHeight = row.offsetHeight;
          const containerTop = scrollContainer.scrollTop;
          const containerHeight = scrollContainer.clientHeight;
          if (rowTop < containerTop) {
            scrollContainer.scrollTop = rowTop;
          } else if (rowTop + rowHeight > containerTop + containerHeight) {
            scrollContainer.scrollTop = rowTop + rowHeight - containerHeight;
          }
        }
      } else {
        row.classList.remove('bg-warning-subtle', 'fw-black', 'border', 'border-warning');
      }
    });

    // Threat active toggle visual
    const threatBtn = this.container.querySelector('#btn-toggle-threat');
    if (threatBtn) {
      if (this.isThreatActive) {
        threatBtn.classList.replace('btn-outline-danger', 'btn-danger');
      } else {
        threatBtn.classList.replace('btn-danger', 'btn-outline-danger');
      }
    }
  }

  updateEvalBar(cur) {
    const fillEl = this.container.querySelector('.eval-white-fill');
    const badgeEl = this.container.querySelector('.eval-score-badge');
    if (!fillEl || !badgeEl) return;

    let winProb = cur ? cur.winProb : 0.5;
    if (typeof winProb !== 'number' || isNaN(winProb)) winProb = 0.5;
    let whitePercent = Math.min(97, Math.max(3, winProb * 100));

    if (this.orientation === 'b') {
      fillEl.style.top = '0';
      fillEl.style.bottom = 'auto';
    } else {
      fillEl.style.bottom = '0';
      fillEl.style.top = 'auto';
    }
    fillEl.style.height = `${whitePercent}%`;

    let evalStr = '0.0';
    if (cur) {
      if (cur.mate !== null && typeof cur.mate !== 'undefined') {
        evalStr = `M${Math.abs(cur.mate)}`;
      } else {
        const cpVal = (cur.scoreCp || 0) / 100;
        evalStr = cpVal > 0 ? `+${cpVal.toFixed(1)}` : cpVal.toFixed(1);
      }
    }
    badgeEl.textContent = evalStr;

    const isWhiteDominant = whitePercent >= 50;
    const placeAtBottom = (this.orientation === 'w') ? isWhiteDominant : !isWhiteDominant;
    if (placeAtBottom) {
      badgeEl.style.bottom = '6px';
      badgeEl.style.top = 'auto';
    } else {
      badgeEl.style.top = '6px';
      badgeEl.style.bottom = 'auto';
    }
    badgeEl.style.color = isWhiteDominant ? '#0f172a' : '#f8fafc';
  }

  updateAdvantageScrubber() {
    updateAdvantageScrubber(this);
  }

  renderAdvantageChart() {
    renderAdvantageChart(this);
  }

  render() {
    if (this.isAnalyzing) {
      const pct = this.analysisProgress.total > 0
        ? Math.round((this.analysisProgress.current / this.analysisProgress.total) * 100)
        : 10;
      this.container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-4 sm:p-5 text-center comic-card max-w-xl mx-auto my-5 shadow-lg" id="review-analysis-card">
          <div class="spinner-border text-warning mb-3" style="width: 3.5rem; height: 3.5rem;" role="status"></div>
          <h4 class="fw-black mb-1">Analyzing Game with Stockfish...</h4>
          <p class="fg-secondary small mb-3 fw-bold" id="review-analysis-subtitle">
            ${this.analysisProgress.total > 0 ? `Evaluating ply ${this.analysisProgress.current} of ${this.analysisProgress.total}...` : 'Starting rapid engine analysis...'}
          </p>
          <div class="progress w-100 max-w-md mx-auto mb-2" style="height: 14px; border: 2px solid #000000; border-radius: 999px; background: rgba(0,0,0,0.08);">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" id="review-analysis-bar" style="width: ${pct}%; transition: width 0.15s ease;"></div>
          </div>
          <div class="d-flex align-items-center justify-content-between w-100 max-w-md fg-secondary small font-monospace fw-bold px-1">
            <span id="review-analysis-step">${this.analysisProgress.total > 0 ? `${this.analysisProgress.current} / ${this.analysisProgress.total} plies` : 'Initializing...'}</span>
            <span class="badge bg-warning text-dark font-monospace" id="review-analysis-eta">Estimating time...</span>
            <span id="review-analysis-pct">${pct}%</span>
          </div>
        </div>
      `;
      return;
    }

    if (!this.game) {
      // Zero State (No game active)
      this.container.innerHTML = `
        <div class="d-flex flex-column align-items-center justify-content-center p-4 sm:p-5 text-center comic-card max-w-2xl mx-auto my-4">
          <div class="badge bg-warning text-dark border border-dark rounded-4 p-3 fs-1 mb-3 shadow-sm d-inline-flex align-items-center justify-content-center" style="width: 72px; height: 72px;">
            <span class="lh-1" style="font-size: 2.25rem;">♟</span>
          </div>
          <h3 class="fw-black mb-2">No Game Currently in Review</h3>
          <p class="fg-secondary small max-w-md mx-auto mb-4 font-medium leading-relaxed">
            Import a game from Chess.com, Lichess, or paste any PGN to run deep Stockfish engine diagnostics
            with move quality classifications, phase ratings, and key moment analysis, or challenge our 33-bot arena!
          </p>
          <div class="d-flex align-items-center gap-3">
            <button type="button" class="btn-solid theme-warning comic-btn px-4 py-2.5" id="zero-btn-import" data-bs-toggle="modal" data-bs-target="#import-modal">
              <i class="bi bi-cloud-arrow-up-fill me-1.5"></i> Import Game
            </button>
            <button type="button" class="btn btn-light comic-btn px-4 py-2.5" id="zero-btn-bots">
              <i class="bi bi-robot me-1.5"></i> Play 33 Bots
            </button>
          </div>
        </div>
      `;

      this.container.querySelector('#zero-btn-import')?.addEventListener('click', () => {
        if (this.onOpenImport) this.onOpenImport();
      });
      this.container.querySelector('#zero-btn-bots')?.addEventListener('click', () => {
        if (this.onSwitchToBots) this.onSwitchToBots();
      });
      return;
    }

    const userColor = this.game.userColor || 'w';
    const isWhiteUser = userColor === 'w';

    const whiteName = this.game.white || 'White';
    const blackName = this.game.black || 'Black';
    const whiteElo = this.game.whiteElo || 1500;
    const blackElo = this.game.blackElo || 1500;

    const userAcc = Number(this.game.userAccuracy ?? this.game.accuracy ?? this.game.overallAccuracy ?? 85).toFixed(1);
    const oppAcc = Number(this.game.opponentAccuracy ?? 85).toFixed(1);

    const whiteAcc = isWhiteUser ? userAcc : oppAcc;
    const blackAcc = isWhiteUser ? oppAcc : userAcc;

    const userGameElo = this.game.userGameElo || this.game.overallGameElo || (isWhiteUser ? whiteElo : blackElo);
    const oppGameElo = this.game.oppGameElo || this.game.opponentGameElo || (isWhiteUser ? blackElo : whiteElo);

    const whiteGameElo = isWhiteUser ? userGameElo : oppGameElo;
    const blackGameElo = isWhiteUser ? oppGameElo : userGameElo;

    const userPhases = this.game.userPhaseElos || this.game.phaseElos || {};
    const oppPhases = this.game.opponentPhaseElos || {};

    const userPhaseAcc = this.game.userPhaseAccuracy || {};
    const oppPhaseAcc = this.game.opponentPhaseAccuracy || {};

    const userOpeningAcc = userPhaseAcc.opening !== null && userPhaseAcc.opening !== undefined ? `${userPhaseAcc.opening}%` : '—';
    const userMiddleAcc = userPhaseAcc.middlegame !== null && userPhaseAcc.middlegame !== undefined ? `${userPhaseAcc.middlegame}%` : '—';
    const userEndAcc = userPhaseAcc.endgame !== null && userPhaseAcc.endgame !== undefined ? `${userPhaseAcc.endgame}%` : '—';

    const oppOpeningAcc = oppPhaseAcc.opening !== null && oppPhaseAcc.opening !== undefined ? `${oppPhaseAcc.opening}%` : '—';
    const oppMiddleAcc = oppPhaseAcc.middlegame !== null && oppPhaseAcc.middlegame !== undefined ? `${oppPhaseAcc.middlegame}%` : '—';
    const oppEndAcc = oppPhaseAcc.endgame !== null && oppPhaseAcc.endgame !== undefined ? `${oppPhaseAcc.endgame}%` : '—';

    const userOpeningElo = userPhases.opening ?? 1500;
    const userMiddlegameElo = userPhases.middlegame ?? 1500;
    const userEndgameElo = userPhases.endgame ?? 1500;

    const oppOpeningElo = oppPhases.opening ?? 1500;
    const oppMiddlegameElo = oppPhases.middlegame ?? 1500;
    const oppEndgameElo = oppPhases.endgame ?? 1500;

    // Active Review Dashboard
    this.container.innerHTML = `
      <div class="row g-3 g-lg-4">
        <!-- Left: Board Column -->
        <div class="col-12 col-lg-6 col-xl-5 mobile-sticky-top">
          <!-- PV Banner (Tactical line playback) -->
          <div id="pv-banner-area" class="d-none"></div>

          <div class="d-flex align-items-stretch justify-content-center gap-2 gap-sm-3 mb-2">
            <!-- Vertical Animated Eval Bar -->
            <div class="eval-bar-wrapper flex-shrink-0" id="eval-bar">
              <div class="eval-white-fill"></div>
              <div class="eval-score-badge text-white">0.0</div>
            </div>

            <!-- Chessboard Mount -->
            <div class="flex-grow-1 d-flex justify-content-center" id="review-board-mount"></div>
          </div>

          <!-- Move Notation & Comic Sound Effect Strip -->
          <div class="comic-card-sm p-2.5 mb-2 d-flex align-items-center justify-content-between" id="review-move-strip"></div>

          <!-- Step Navigation Bar -->
          <div class="comic-card-sm p-2 d-flex flex-column gap-2 mb-2">
            <!-- Row 1: Big Thumb-Friendly Step Controls -->
            <div class="d-flex align-items-center justify-content-between gap-1.5">
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-first" title="First Move">
                <i class="bi bi-chevron-bar-left fs-6"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-prev" title="Previous Move">
                <i class="bi bi-chevron-left fs-5 fw-black me-1"></i><span class="small fw-black d-none sm:inline">Prev</span>
              </button>

              <span class="badge bg-secondary font-monospace px-2.5 sm:px-3 py-2 fs-6 fw-bold flex-shrink-0" id="ply-counter">0 / 0</span>

              <button type="button" class="btn btn-light arcade-step-btn-lg flex-grow-1" id="btn-next" title="Next Move">
                <span class="small fw-black d-none sm:inline me-1">Next</span><i class="bi bi-chevron-right fs-5 fw-black"></i>
              </button>
              <button type="button" class="btn btn-light arcade-step-btn-sm" id="btn-last" title="Last Move">
                <i class="bi bi-chevron-bar-right fs-6"></i>
              </button>
            </div>

            <!-- Row 2: Actions (Key Moment, Threat, Flip) -->
            <div class="d-flex align-items-center justify-content-between gap-2">
              <button type="button" class="btn btn-warning comic-btn flex-grow-1 py-1.5 fw-black" id="btn-key-moment" title="Next Key Moment">
                <i class="bi bi-lightning-charge-fill me-1"></i>Key Moment
              </button>
              <button type="button" class="btn btn-outline-danger comic-btn px-2.5 py-1.5" id="btn-toggle-threat" title="Toggle Threat Arrow">
                <i class="bi bi-shield-slash me-1"></i>Threat
              </button>
              <button type="button" class="btn btn-light comic-btn px-2.5 py-1.5" id="btn-flip" title="Flip Board">
                <i class="bi bi-arrow-left-right me-1"></i>Flip
              </button>
            </div>
          </div>

          <!-- Advantage Timeline Line Graph -->
          <div class="comic-card-sm p-2 mb-2" id="advantage-chart-area"></div>
        </div>

        <!-- Right: Move List & Performance Stats in Columns on Desktop -->
        <div class="col-12 col-lg-6 col-xl-7 d-flex flex-column gap-3">
          <!-- Match Overview & Player VS Player Header Card -->
          <div class="comic-card p-3">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--arcade-border) !important;">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-warning text-dark font-monospace fw-black px-2 py-1">${this.game.ecoCode || 'PGN'}</span>
                <span class="fw-bold small text-truncate" style="max-width: 260px;">${this.game.ecoName || 'Chess Match'}</span>
                <span class="text-secondary small font-monospace d-none sm:inline">· ${this.game.date || ''}</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-2 py-1" id="btn-share-review" title="Copy Review Summary to Clipboard">
                  <i class="bi bi-share me-1"></i>Share
                </button>
              </div>
            </div>

            <!-- Player VS Player Cards Row -->
            <div class="row g-2 align-items-center">
              <!-- White Player -->
              <div class="col-5">
                <div class="p-2 rounded d-flex flex-column gap-1" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
                  <div class="d-flex align-items-center gap-1.5 min-w-0">
                    <span class="fs-6 lh-1">⚪</span>
                    <span class="fw-black small text-truncate ${isWhiteUser ? 'text-warning' : 'text-body'}">${whiteName}</span>
                    ${isWhiteUser ? '<span class="badge bg-warning text-dark fw-bold px-1 py-0.5" style="font-size: 8px;">YOU</span>' : ''}
                  </div>
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 font-monospace" style="font-size: 11px;">
                    <span class="text-secondary">${whiteElo} Elo</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">⭐ ${whiteGameElo}</span>
                    <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold">🎯 ${whiteAcc}%</span>
                  </div>
                </div>
              </div>

              <!-- Center VS & Result -->
              <div class="col-2 text-center">
                <div class="d-flex flex-column align-items-center justify-content-center">
                  <span class="badge ${this.game.result === '1-0' ? 'bg-success' : this.game.result === '0-1' ? 'bg-danger' : 'bg-secondary'} font-monospace px-2 py-1 mb-1 fw-black" style="font-size: 13px;">
                    ${this.game.result}
                  </span>
                  <span class="badge bg-body-secondary text-secondary font-monospace" style="font-size: 9px;">RESULT</span>
                </div>
              </div>

              <!-- Black Player -->
              <div class="col-5">
                <div class="p-2 rounded d-flex flex-column gap-1" style="background: var(--arcade-card-hover, rgba(0,0,0,0.03)); border: 1px solid var(--arcade-border);">
                  <div class="d-flex align-items-center justify-content-between min-w-0">
                    <div class="d-flex align-items-center gap-1.5 min-w-0">
                      <span class="fs-6 lh-1">⚫</span>
                      <span class="fw-black small text-truncate ${!isWhiteUser ? 'text-warning' : 'text-body'}">${blackName}</span>
                      ${!isWhiteUser ? '<span class="badge bg-warning text-dark fw-bold px-1 py-0.5" style="font-size: 8px;">YOU</span>' : ''}
                    </div>
                  </div>
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-1 font-monospace" style="font-size: 11px;">
                    <span class="text-secondary">${blackElo} Elo</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">⭐ ${blackGameElo}</span>
                    <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold">🎯 ${blackAcc}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Columns: Move History & Performance Cards Side-by-Side -->
          <div class="row g-3">
            <!-- Column 1: Move History List -->
            <div class="col-12 col-md-6">
              <div class="comic-card p-3 h-100 d-flex flex-column">
                <div class="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                  <h6 class="mb-0 fw-black"><i class="bi bi-list-ol me-1.5 text-warning"></i>Move History</h6>
                  <span class="badge bg-body-secondary text-dark fw-bold font-monospace">${this.game.plies.length} Plies</span>
                </div>
                <div class="move-history-container flex-grow-1" style="max-height: 480px;">
                  <table class="table table-sm table-hover align-middle mb-0" style="font-size: 13px;">
                    <tbody>
                      ${this.buildMoveTableRows()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Column 2: Phase Accuracy & Elo Card + Quality Breakdown -->
            <div class="col-12 col-md-6">
              <div class="comic-card p-3 h-100 d-flex flex-column gap-3">
                <div class="d-flex align-items-center justify-content-between border-bottom pb-2">
                  <h6 class="mb-0 fw-black"><i class="bi bi-trophy-fill me-1.5 text-warning"></i>Game Performance</h6>
                  <span class="badge bg-body-secondary text-secondary font-monospace fw-bold" style="font-size: 11px;">You vs Opponent</span>
                </div>

                <!-- Dual Accuracy Comparison -->
                <div class="row g-2">
                  <div class="col-6">
                    <div class="arcade-stat-chip p-2 text-start">
                      <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="small fw-bold text-truncate">${isWhiteUser ? '⚪ White' : '⚫ Black'} (You)</span>
                        <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill font-monospace" style="font-size: 10px;">YOU</span>
                      </div>
                      <div class="d-flex align-items-baseline gap-1">
                        <span class="fw-black fs-4 text-success font-monospace">${userAcc}%</span>
                        <span class="text-secondary small">accuracy</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="arcade-stat-chip p-2 text-start">
                      <div class="d-flex align-items-center justify-content-between mb-1">
                        <span class="small fw-bold text-truncate">${isWhiteUser ? '⚫ Black' : '⚪ White'}</span>
                        <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill font-monospace" style="font-size: 10px;">OPP</span>
                      </div>
                      <div class="d-flex align-items-baseline gap-1">
                        <span class="fw-black fs-4 text-secondary font-monospace">${oppAcc}%</span>
                        <span class="text-secondary small">accuracy</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Phase Rating & Accuracy Comparison (Opening, Middle, Endgame) -->
                <div class="row g-2 text-center">
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1"><i class="bi bi-compass me-1 text-primary"></i>Opening</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-primary font-monospace">${userOpeningAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${userOpeningElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 28px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppOpeningAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${oppOpeningElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1"><i class="bi bi-shield-shaded me-1 text-warning"></i>Middle</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-warning font-monospace">${userMiddleAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${userMiddlegameElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 28px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppMiddleAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${oppMiddlegameElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1"><i class="bi bi-flag-fill me-1 text-success"></i>Endgame</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-success font-monospace">${userEndAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${userEndgameElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 28px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppEndAcc}</span>
                          <span class="d-block text-secondary font-monospace" style="font-size: 9px;">${oppEndgameElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Move Classification Breakdown (Player vs Opponent) -->
                <div class="border-top pt-2">
                  <div class="d-flex align-items-center justify-content-between px-2 pb-1.5 text-secondary" style="font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
                    <span style="width: 38px;" class="text-end">YOU</span>
                    <span>MOVE QUALITY</span>
                    <span style="width: 38px;" class="text-start">OPP</span>
                  </div>
                  <div class="d-flex flex-column gap-1">
                    ${this.buildBadgesSummary()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mount Board
    const mount = this.container.querySelector('#review-board-mount');
    this.board = new Chessboard(mount, {
      fen: this.game.initialFen,
      orientation: this.orientation,
      theme: this.theme,
      interactive: false,
      showPlayerBars: true,
      whiteName: this.game.white || 'White',
      blackName: this.game.black || 'Black',
    });

    // Bind Navigation Buttons
    this.container.querySelector('#btn-first')?.addEventListener('click', () => this.goToPly(0));
    this.container.querySelector('#btn-prev')?.addEventListener('click', () => this.goToPly(this.currentPly - 1));
    this.container.querySelector('#btn-next')?.addEventListener('click', () => this.goToPly(this.currentPly + 1));
    this.container.querySelector('#btn-last')?.addEventListener('click', () => this.goToPly(this.game.plies.length));
    this.container.querySelector('#btn-key-moment')?.addEventListener('click', () => this.nextKeyMoment());
    this.container.querySelector('#btn-toggle-threat')?.addEventListener('click', () => this.toggleThreat());
    this.container.querySelector('#btn-flip')?.addEventListener('click', () => {
      this.orientation = this.orientation === 'w' ? 'b' : 'w';
      this.updateBoardAndControls();
    });

    this.container.querySelector('#btn-share-review')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const text = `⚡ Chess IQ Game Review
${this.game.white} (${userAcc}%) vs ${this.game.black} (${oppAcc}%)
Opening: ${this.game.ecoName || this.game.ecoCode || 'Standard'}
Total Moves: ${Math.ceil((this.game.plies?.length || 0) / 2)} moves
Result: ${this.game.result || '*'}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = `<i class="bi bi-check2 me-1"></i>Copied!`;
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
          }
        });
      }
    });

    // Bind Move rows click
    this.container.querySelectorAll('.move-list-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        const ply = parseInt(e.currentTarget.dataset.ply, 10);
        this.goToPly(ply);
      });
    });

    this.renderAdvantageChart();
    this.updateBoardAndControls();
  }

  buildMoveTableRows() {
    if (!this.game) return '';
    const plies = this.game.plies;
    let html = '';

    for (let i = 0; i < plies.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whitePly = plies[i];
      const blackPly = plies[i + 1] || null;

      html += `
        <tr>
          <td class="text-secondary fw-bold text-end" style="width: 38px;">${moveNum}.</td>
          <td class="move-list-row cursor-pointer rounded px-2 py-1" data-ply="${whitePly.ply}">
            <div class="d-flex align-items-center justify-content-between">
              <span class="font-monospace">${whitePly.san}</span>
              ${this.renderMiniBadge(whitePly.classification)}
            </div>
          </td>
          ${blackPly ? `
            <td class="move-list-row cursor-pointer rounded px-2 py-1" data-ply="${blackPly.ply}">
              <div class="d-flex align-items-center justify-content-between">
                <span class="font-monospace">${blackPly.san}</span>
                ${this.renderMiniBadge(blackPly.classification)}
              </div>
            </td>
          ` : '<td></td>'}
        </tr>
      `;
    }

    return html;
  }

  renderMiniBadge(cls) {
    if (!cls || cls === 'good') return '';
    const dict = COMIC_DICTIONARY[cls];
    if (!dict) return '';
    return `
      <span class="badge border border-dark rounded-circle d-inline-flex align-items-center justify-content-center"
        title="${dict.words[0]} (${dict.standardLabel})"
        style="width: 20px; height: 20px; font-size: 10px; background-color: ${dict.bg}; color: ${dict.text};">
        ${dict.symbol}
      </span>
    `;
  }

  buildBadgesSummary() {
    if (!this.game) return '';
    const userColor = this.game.userColor || 'w';
    let userCounts = this.game.userCounts;
    let oppCounts = this.game.opponentCounts;

    if (!userCounts || !oppCounts) {
      userCounts = {};
      oppCounts = {};
      (this.game.plies || []).forEach((p) => {
        if (!p) return;
        const isUser = p.color ? (p.color === userColor) : (p.ply % 2 === (userColor === 'w' ? 1 : 0));
        const target = isUser ? userCounts : oppCounts;
        target[p.classification] = (target[p.classification] || 0) + 1;
      });
    }

    const classifications = [
      'brilliant',
      'great',
      'best',
      'excellent',
      'good',
      'book',
      'inaccuracy',
      'mistake',
      'blunder',
      'missed_win'
    ];

    return classifications
      .map((cls) => {
        const dict = COMIC_DICTIONARY[cls];
        if (!dict) return '';
        const userCnt = userCounts[cls] || 0;
        const oppCnt = oppCounts[cls] || 0;
        const hasAny = userCnt > 0 || oppCnt > 0;

        return `
          <div class="d-flex align-items-center justify-content-between py-1 px-2 rounded ${hasAny ? 'bg-body-tertiary bg-opacity-25' : 'opacity-50'}" style="font-size: 12px;">
            <span class="font-monospace fw-black text-end ${userCnt > 0 ? 'text-primary' : 'text-body-tertiary'}" style="width: 38px;">
              ${userCnt}
            </span>
            <span class="badge rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
              style="background-color: ${dict.bg}; color: ${dict.text}; font-size: 11px; font-weight: 800; min-width: 125px; justify-content: center;">
              <span>${dict.symbol}</span>
              <span>${dict.words[0]}</span>
            </span>
            <span class="font-monospace fw-black text-start ${oppCnt > 0 ? 'text-secondary' : 'text-body-tertiary'}" style="width: 38px;">
              ${oppCnt}
            </span>
          </div>
        `;
      })
      .join('');
  }
}

if (typeof window !== 'undefined') {
  if (typeof Chessboard !== 'undefined') window.Chessboard = Chessboard;
  if (typeof BotArena !== 'undefined') window.BotArena = BotArena;
  if (typeof ReviewDashboard !== 'undefined') window.ReviewDashboard = ReviewDashboard;
  if (typeof ImportModal !== 'undefined') window.ImportModal = ImportModal;
  if (typeof StockfishPool !== 'undefined') window.StockfishPool = StockfishPool;
  if (typeof BackgroundAnalysisQueue !== 'undefined') window.BackgroundAnalysisQueue = BackgroundAnalysisQueue;
  if (typeof SoundService !== 'undefined') window.SoundService = SoundService;
}
