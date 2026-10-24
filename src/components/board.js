/**
 * Vanilla JS Chessboard Component
 * Renders an interactive 8x8 chessboard with SVG piece rendering,
 * move highlights, arrows, comic sound effect badges, captured pieces,
 * in-check King highlight, and drag-and-drop move interaction.
 */


const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const FILES_REV = [...FILES].reverse();
const RANKS_REV = [...RANKS].reverse();

const THEMES = {
  green: { light: '#ebecd0', dark: '#739552' },
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
    this.theme = 'green';
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
    this.visionOverlay = options.visionOverlay || 'none'; // 'none' | 'hanging' | 'heatmap'
    this.showBestMove = options.showBestMove !== undefined ? options.showBestMove : false;
    this.showLoosePieces = options.showLoosePieces !== undefined ? options.showLoosePieces : false;

    this.selectedSquare = null;
    this.possibleDests = [];
    this.lastAnimatedMoveKey = null;
    this.userArrows = [];
    this.userHighlights = new Set();
    this.rightClickStartSquare = null;

    this.dragState = null;
    this.skipNextMoveAnimation = false;
    this.activePointerMoveHandler = null;
    this.activePointerUpHandler = null;
    this.activeKeyDownHandler = null;

    this.render();
  }

  cleanupDrag() {
    if (this.dragState) {
      if (this.dragState.dragEl && this.dragState.dragEl.parentNode) {
        this.dragState.dragEl.parentNode.removeChild(this.dragState.dragEl);
      }
      if (this.dragState.sourceImg) {
        this.dragState.sourceImg.classList.remove('is-dragging');
      }
      if (this.dragState.hoverSquare && this.container) {
        const curEl = this.container.querySelector(`.board-square[data-square="${this.dragState.hoverSquare}"]`);
        if (curEl) curEl.classList.remove('drag-over');
      }
      this.dragState = null;
    }
    document.body.classList.remove('board-is-dragging');
    if (this.activePointerMoveHandler) {
      window.removeEventListener('pointermove', this.activePointerMoveHandler);
      this.activePointerMoveHandler = null;
    }
    if (this.activePointerUpHandler) {
      window.removeEventListener('pointerup', this.activePointerUpHandler);
      window.removeEventListener('pointercancel', this.activePointerUpHandler);
      this.activePointerUpHandler = null;
    }
    if (this.activeKeyDownHandler) {
      window.removeEventListener('keydown', this.activeKeyDownHandler);
      this.activeKeyDownHandler = null;
    }
  }

  getSquareFromCoords(clientX, clientY) {
    if (!this.grid) return null;
    const rect = this.grid.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const x = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;

    const isWhiteOrientation = this.orientation === 'w';
    const files = isWhiteOrientation ? FILES : FILES_REV;
    const ranks = isWhiteOrientation ? RANKS : RANKS_REV;

    return `${files[x]}${ranks[y]}`;
  }

  updateSelectionHighlights() {
    if (!this.container) return;
    const squares = this.container.querySelectorAll('.board-square');
    squares.forEach((sq) => {
      sq.classList.remove('selected', 'capture-target', 'drag-over');
      const dot = sq.querySelector('.move-dot');
      if (dot) dot.remove();
    });

    if (this.selectedSquare) {
      const selectedEl = this.container.querySelector(`.board-square[data-square="${this.selectedSquare}"]`);
      if (selectedEl && !selectedEl.classList.contains('in-check')) {
        selectedEl.classList.add('selected');
      }
    }

    if (this.possibleDests && this.possibleDests.length > 0) {
      this.possibleDests.forEach((destSq) => {
        const destEl = this.container.querySelector(`.board-square[data-square="${destSq}"]`);
        if (!destEl) return;
        const hasPiece = destEl.querySelector('.piece-img');
        if (hasPiece) {
          destEl.classList.add('capture-target');
        } else {
          const dot = document.createElement('div');
          dot.className = 'move-dot';
          destEl.appendChild(dot);
        }
      });
    }
  }

  setProps(newProps) {
    let shouldRerender = false;
    ['fen', 'orientation', 'theme', 'interactive', 'showPlayerBars', 'whiteName', 'blackName', 'onMove', 'legalMovesFrom', 'lastMove', 'bestMove', 'secondBestMove', 'threatMove', 'badge', 'visionOverlay', 'showBestMove', 'showLoosePieces'].forEach((k) => {
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
        this.updateSelectionHighlights();
        return;
      }

      if (this.possibleDests.includes(square)) {
        const from = this.selectedSquare;
        this.selectedSquare = null;
        this.possibleDests = [];
        this.updateSelectionHighlights();
        if (this.onMove) {
          this.onMove(from, square);
        }
        return;
      }
    }

    if (piece) {
      const turn = (this.fen || '').split(' ')[1] || 'w';
      const pieceColor = piece === piece.toUpperCase() ? 'w' : 'b';
      const dests = this.legalMovesFrom ? this.legalMovesFrom(square) : [];

      if (dests.length > 0 || pieceColor === turn || !this.legalMovesFrom) {
        this.selectedSquare = square;
        this.possibleDests = dests;
        this.updateSelectionHighlights();
      } else {
        this.selectedSquare = null;
        this.possibleDests = [];
        this.updateSelectionHighlights();
      }
    } else {
      this.selectedSquare = null;
      this.possibleDests = [];
      this.updateSelectionHighlights();
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
    const dotSpan = document.createElement('span');
    dotSpan.style.cssText = 'font-size: 13px; line-height: 1;';
    dotSpan.textContent = isWhite ? '⚪' : '⚫';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'text-truncate fw-bold';
    nameSpan.style.maxWidth = '160px';
    nameSpan.textContent = name;
    left.appendChild(dotSpan);
    left.appendChild(nameSpan);

    const right = document.createElement('div');
    right.className = 'd-flex align-items-center gap-1.5';

    if (captured.length > 0) {
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
    }

    if (diff > 0) {
      const diffBadge = document.createElement('span');
      diffBadge.className = 'material-diff-badge';
      diffBadge.textContent = `+${diff}`;
      right.appendChild(diffBadge);
    }

    bar.appendChild(left);
    bar.appendChild(right);
    return bar;
  }

  render() {
    this.cleanupDrag();
    this.container.innerHTML = '';

    const board = this.parseFen(this.fen);
    const turn = (this.fen || '').split(' ')[1] || 'w';
    const isWhiteOrientation = this.orientation === 'w';
    const files = isWhiteOrientation ? FILES : FILES_REV;
    const ranks = isWhiteOrientation ? RANKS : RANKS_REV;
    const themeColors = THEMES.green;
    const pendingAnimations = [];

    let checkSquare = null;
    try {
      if (Chess) {
        const c = new Chess(this.fen);
        if (isChessInCheck(c)) {
          const kingChar = c.turn() === 'w' ? 'K' : 'k';
          for (let r = 0; r < 8 && !checkSquare; r++) {
            for (let f = 0; f < 8; f++) {
              if (board[r] && board[r][f] === kingChar) {
                checkSquare = `${FILES[f]}${RANKS[r]}`;
                break;
              }
            }
          }
        }
      }
    } catch {}

    const capturedData = getCapturedPiecesAndDiff(this.fen);
    const needVision = (this.showLoosePieces || (this.visionOverlay && this.visionOverlay !== 'none')) && typeof analyzeBoardVision === 'function';
    const visionData = needVision ? analyzeBoardVision(this.fen) : null;

    const outerWrapper = document.createElement('div');
    outerWrapper.className = 'd-flex flex-column align-items-center w-100';

    const topColor = this.orientation === 'w' ? 'b' : 'w';
    const bottomColor = this.orientation === 'w' ? 'w' : 'b';

    if (this.showPlayerBars) {
      outerWrapper.appendChild(this.createPlayerBar(topColor, capturedData));
    }

    const boardWrapper = document.createElement('div');
    boardWrapper.className = `board-container${this.interactive ? ' is-interactive' : ''}`;
    this.boardWrapper = boardWrapper;

    const grid = document.createElement('div');
    grid.className = 'board-grid';
    this.grid = grid;

    ranks.forEach((rank, rIdx) => {
      files.forEach((file, fIdx) => {
        const square = `${file}${rank}`;
        const isDark = (rIdx + fIdx) % 2 === 1;
        const squareColor = isDark ? themeColors.dark : themeColors.light;

        const sqDiv = document.createElement('div');
        sqDiv.className = 'board-square';
        sqDiv.dataset.square = square;

        const origR = isWhiteOrientation ? rIdx : 7 - rIdx;
        const origF = isWhiteOrientation ? fIdx : 7 - fIdx;
        const pieceChar = board[origR] ? board[origR][origF] : null;
        sqDiv.dataset.piece = pieceChar || '';

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

        if (pieceChar) {
          const colorCode = pieceChar === pieceChar.toUpperCase() ? 'w' : 'b';
          const typeCode = pieceChar.toUpperCase();
          const pieceKey = `${colorCode}${typeCode}`;
          const pieceSrc = INLINE_PIECE_DATA_URLS[pieceKey] || `./pieces/${pieceKey}.svg`;

          const isCurrentTurn = colorCode === turn;
          const isMovable = this.interactive && (isCurrentTurn || !this.legalMovesFrom);
          if (isMovable) {
            sqDiv.classList.add('has-movable-piece');
          }

          const img = document.createElement('img');
          img.src = pieceSrc;
          img.className = 'piece-img';
          img.alt = `${colorCode === 'w' ? 'White' : 'Black'} ${typeCode}`;
          img.draggable = false;
          img.addEventListener('dragstart', (e) => e.preventDefault());

          if (this.lastMove && this.lastMove.to === square && this.lastMove.from) {
            const currentMoveKey = `${this.lastMove.from}-${this.lastMove.to}-${this.fen}`;
            if (this.lastAnimatedMoveKey !== currentMoveKey) {
              this.lastAnimatedMoveKey = currentMoveKey;
              if (this.skipNextMoveAnimation) {
                this.skipNextMoveAnimation = false;
                img.classList.add('piece-landing-pop');
                setTimeout(() => img.classList.remove('piece-landing-pop'), 200);
              } else {
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
                  pendingAnimations.push(img);
                }
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
          badgeEl.style.zIndex = '40';
          badgeEl.title = `${comic.term} (${COMIC_DICTIONARY[this.badge.classification]?.standardLabel || ''})`;
          badgeEl.innerHTML = `<span>${comic.symbol}</span><span>${comic.term}</span>`;
          sqDiv.appendChild(badgeEl);
        }

        if (visionData) {
          if (this.showLoosePieces || this.visionOverlay === 'hanging') {
            const pStatus = visionData.pieceStatus[square];
            if (pStatus) {
              const isHanging = pStatus.status === 'hanging';
              const ringEl = document.createElement('div');
              ringEl.className = isHanging ? 'xray-hanging-ring' : 'xray-loose-ring';
              const pieceName = (typeof PIECE_NAME_MAP !== 'undefined' && PIECE_NAME_MAP[pStatus.type]) ? PIECE_NAME_MAP[pStatus.type] : 'Piece';
              ringEl.setAttribute('data-iq-tip', isHanging ? 'board_piece_hanging' : 'board_piece_loose');
              ringEl.setAttribute('data-iq-title', isHanging ? `🎯 Hanging ${pieceName} (${square.toUpperCase()})` : `⚠️ Loose ${pieceName} (${square.toUpperCase()})`);

              const tagEl = document.createElement('span');
              tagEl.className = isHanging ? 'xray-hanging-tag' : 'xray-loose-tag';
              tagEl.textContent = isHanging ? '🎯 HANGING' : '⚠️ LOOSE';
              tagEl.setAttribute('data-iq-tip', isHanging ? 'board_piece_hanging' : 'board_piece_loose');
              tagEl.setAttribute('data-iq-title', isHanging ? `🎯 Hanging ${pieceName} (${square.toUpperCase()})` : `⚠️ Loose ${pieceName} (${square.toUpperCase()})`);

              ringEl.appendChild(tagEl);
              sqDiv.appendChild(ringEl);
            }
          }
          if (this.visionOverlay === 'heatmap') {
            const ctrl = visionData.squareControl[square];
            if (ctrl && (ctrl.whiteAttackers > 0 || ctrl.blackAttackers > 0)) {
              const heatEl = document.createElement('div');
              heatEl.className = 'xray-heatmap-cell';
              const net = ctrl.net;
              if (net > 0) {
                const alpha = Math.min(0.58, 0.20 + net * 0.12);
                heatEl.style.backgroundColor = `rgba(6, 182, 212, ${alpha})`;
              } else if (net < 0) {
                const alpha = Math.min(0.58, 0.20 + Math.abs(net) * 0.12);
                heatEl.style.backgroundColor = `rgba(244, 63, 94, ${alpha})`;
              } else {
                heatEl.style.backgroundColor = 'rgba(245, 158, 11, 0.28)';
              }
              heatEl.title = `White attackers: ${ctrl.whiteAttackers} | Black attackers: ${ctrl.blackAttackers}`;
              sqDiv.appendChild(heatEl);
            }
          }
        }

        grid.appendChild(sqDiv);
      });
    });

    boardWrapper.appendChild(grid);

    const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttribute('viewBox', '0 0 100 100');
    svgLayer.setAttribute('class', 'position-absolute top-0 start-0 w-100 h-100 pointer-events-none');
    svgLayer.style.pointerEvents = 'none';
    svgLayer.style.zIndex = '35';

    if (this.showBestMove !== false) {
      if (this.secondBestMove && this.secondBestMove.from && this.secondBestMove.to) {
        this.drawArrow(svgLayer, this.secondBestMove.from, this.secondBestMove.to, '#10b981', false, 'second-best-move', 1.4);
      }
      if (this.bestMove && this.bestMove.from && this.bestMove.to) {
        this.drawArrow(svgLayer, this.bestMove.from, this.bestMove.to, '#10b981', false, 'best-move', 2.4);
      }
    }
    if (this.threatMove && this.threatMove.from && this.threatMove.to) {
      this.drawArrow(svgLayer, this.threatMove.from, this.threatMove.to, '#ef4444', true, 'threat-move', 1.8);
    }
    this.userArrows.forEach((arr, idx) => {
      this.drawArrow(svgLayer, arr.from, arr.to, '#f59e0b', false, `user-${idx}`, 2.0);
    });

    boardWrapper.appendChild(svgLayer);

    boardWrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    if (this.interactive) {
      boardWrapper.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;

        if (this.userArrows.length > 0 || this.userHighlights.size > 0) {
          this.userArrows = [];
          this.userHighlights.clear();
          this.render();
          return;
        }

        const sqEl = e.target.closest('[data-square]');
        if (!sqEl) return;
        const square = sqEl.dataset.square;
        const pieceChar = sqEl.dataset.piece || null;

        // Destination square click for currently selected piece
        if (this.selectedSquare && this.possibleDests.includes(square)) {
          const from = this.selectedSquare;
          this.selectedSquare = null;
          this.possibleDests = [];
          this.updateSelectionHighlights();
          if (this.onMove) {
            this.onMove(from, square);
          }
          return;
        }

        const wasAlreadySelected = this.selectedSquare === square;

        const currentTurn = (this.fen || '').split(' ')[1] || 'w';
        const pieceColor = pieceChar ? (pieceChar === pieceChar.toUpperCase() ? 'w' : 'b') : null;
        const dests = this.legalMovesFrom ? this.legalMovesFrom(square) : [];
        const isMovablePiece = pieceChar && (dests.length > 0 || pieceColor === currentTurn || !this.legalMovesFrom);

        if (isMovablePiece) {
          this.selectedSquare = square;
          this.possibleDests = dests;
          this.updateSelectionHighlights();

          this.cleanupDrag();
          this.dragState = {
            startX: e.clientX,
            startY: e.clientY,
            fromSquare: square,
            piece: pieceChar,
            wasAlreadySelected,
            isDragging: false,
            dragEl: null,
            sourceImg: sqEl.querySelector('.piece-img'),
            hoverSquare: square
          };

          const onPointerMove = (moveEvt) => {
            if (!this.dragState) return;
            const dx = moveEvt.clientX - this.dragState.startX;
            const dy = moveEvt.clientY - this.dragState.startY;
            const dist = Math.hypot(dx, dy);

            if (!this.dragState.isDragging && dist > 4) {
              this.dragState.isDragging = true;
              document.body.classList.add('board-is-dragging');
              if (this.dragState.sourceImg) {
                this.dragState.sourceImg.classList.add('is-dragging');
              }

              const rect = this.grid ? this.grid.getBoundingClientRect() : this.boardWrapper.getBoundingClientRect();
              const squareSize = rect.width / 8;
              const pieceSize = squareSize * 0.95;

              const dragEl = document.createElement('div');
              dragEl.className = 'board-floating-piece';
              dragEl.style.width = `${pieceSize}px`;
              dragEl.style.height = `${pieceSize}px`;
              dragEl.style.transform = `translate(${moveEvt.clientX - pieceSize / 2}px, ${moveEvt.clientY - pieceSize / 2}px)`;

              const cCode = this.dragState.piece === this.dragState.piece.toUpperCase() ? 'w' : 'b';
              const tCode = this.dragState.piece.toUpperCase();
              const pKey = `${cCode}${tCode}`;
              const pSrc = INLINE_PIECE_DATA_URLS[pKey] || `./pieces/${pKey}.svg`;

              const img = document.createElement('img');
              img.src = pSrc;
              img.alt = '';
              dragEl.appendChild(img);

              document.body.appendChild(dragEl);
              this.dragState.dragEl = dragEl;
              this.dragState.pieceSize = pieceSize;
            }

            if (this.dragState.isDragging && this.dragState.dragEl) {
              const pieceSize = this.dragState.pieceSize;
              this.dragState.dragEl.style.transform = `translate(${moveEvt.clientX - pieceSize / 2}px, ${moveEvt.clientY - pieceSize / 2}px)`;

              const currentSquare = this.getSquareFromCoords(moveEvt.clientX, moveEvt.clientY);
              if (currentSquare !== this.dragState.hoverSquare) {
                if (this.dragState.hoverSquare) {
                  const prevEl = this.container.querySelector(`.board-square[data-square="${this.dragState.hoverSquare}"]`);
                  if (prevEl) prevEl.classList.remove('drag-over');
                }
                if (currentSquare) {
                  const curEl = this.container.querySelector(`.board-square[data-square="${currentSquare}"]`);
                  if (curEl) curEl.classList.add('drag-over');
                }
                this.dragState.hoverSquare = currentSquare;
              }
            }
          };

          const onPointerUp = (upEvt) => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('keydown', onKeyDown);
            this.activePointerMoveHandler = null;
            this.activePointerUpHandler = null;
            this.activeKeyDownHandler = null;

            if (!this.dragState) return;

            const { fromSquare, wasAlreadySelected, isDragging, dragEl, sourceImg, hoverSquare } = this.dragState;

            if (dragEl && dragEl.parentNode) {
              dragEl.parentNode.removeChild(dragEl);
            }
            if (sourceImg) {
              sourceImg.classList.remove('is-dragging');
            }
            if (hoverSquare && this.container) {
              const curEl = this.container.querySelector(`.board-square[data-square="${hoverSquare}"]`);
              if (curEl) curEl.classList.remove('drag-over');
            }
            document.body.classList.remove('board-is-dragging');

            this.dragState = null;

            if (isDragging) {
              const targetSquare = this.getSquareFromCoords(upEvt.clientX, upEvt.clientY);
              if (targetSquare && this.possibleDests.includes(targetSquare)) {
                const from = fromSquare;
                this.selectedSquare = null;
                this.possibleDests = [];
                this.skipNextMoveAnimation = true;
                this.updateSelectionHighlights();
                if (this.onMove) {
                  this.onMove(from, targetSquare);
                }
              } else if (targetSquare === fromSquare) {
                this.selectedSquare = fromSquare;
                this.possibleDests = this.legalMovesFrom ? this.legalMovesFrom(fromSquare) : [];
                this.updateSelectionHighlights();
              } else {
                this.selectedSquare = null;
                this.possibleDests = [];
                this.updateSelectionHighlights();
              }
            } else if (wasAlreadySelected) {
              this.selectedSquare = null;
              this.possibleDests = [];
              this.updateSelectionHighlights();
            }
          };

          const onKeyDown = (keyEvt) => {
            if (keyEvt.key === 'Escape') {
              onPointerUp({ clientX: -9999, clientY: -9999 });
            }
          };

          this.activePointerMoveHandler = onPointerMove;
          this.activePointerUpHandler = onPointerUp;
          this.activeKeyDownHandler = onKeyDown;

          window.addEventListener('pointermove', onPointerMove);
          window.addEventListener('pointerup', onPointerUp);
          window.addEventListener('pointercancel', onPointerUp);
          window.addEventListener('keydown', onKeyDown);
        } else {
          this.selectedSquare = null;
          this.possibleDests = [];
          this.updateSelectionHighlights();
        }
      });
    }

    boardWrapper.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
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

  drawArrow(svg, fromSq, toSq, color, dashed = false, idPrefix = 'arrow', strokeWidth = 2.4) {
    const files = this.orientation === 'w' ? FILES : FILES_REV;
    const ranks = this.orientation === 'w' ? RANKS : RANKS_REV;
    const getCoords = (sq) => {
      if (!sq || sq.length < 2) return null;
      const x = files.indexOf(sq[0]);
      const y = ranks.indexOf(sq[1]);
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
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return;

    const angle = Math.atan2(dy, dx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const isThick = strokeWidth >= 2.2;
    const isThin = strokeWidth <= 1.5;

    // Arrowhead dimensions - sharp, pointy triangular head
    const headLength = isThick ? 4.8 : (isThin ? 3.4 : 4.0);
    const headWidth = isThick ? 4.6 : (isThin ? 3.2 : 3.8);
    const targetOffset = isThick ? 2.0 : 1.5;

    // Crisp pointy arrowhead tip (directed toward destination square)
    const tipX = x2 - cos * targetOffset;
    const tipY = y2 - sin * targetOffset;

    // Base center of arrowhead triangle
    const baseX = tipX - cos * headLength;
    const baseY = tipY - sin * headLength;

    // Perpendicular wings to create sharp arrowhead
    const perpX = -sin * (headWidth / 2);
    const perpY = cos * (headWidth / 2);

    const leftX = baseX + perpX;
    const leftY = baseY + perpY;
    const rightX = baseX - perpX;
    const rightY = baseY - perpY;

    // Shaft line coordinates:
    // Starts neatly near departure square center with a smooth round cap,
    // and ends slightly overlapping the base of the arrowhead so there is zero gap,
    // while never penetrating near the pointy tip.
    const startOffset = isThick ? 1.6 : 1.2;
    const startX = x1 + cos * startOffset;
    const startY = y1 + sin * startOffset;

    const overlap = 0.5;
    const shaftEndX = baseX + cos * overlap;
    const shaftEndY = baseY + sin * overlap;

    // Group wrapper to composite stroke & fill with uniform opacity (no overlap seams)
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', `board-arrow ${idPrefix}`);
    group.setAttribute('opacity', isThin ? '0.78' : '0.92');

    // Shaft line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(startX));
    line.setAttribute('y1', String(startY));
    line.setAttribute('x2', String(shaftEndX));
    line.setAttribute('y2', String(shaftEndY));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    if (dashed) {
      line.setAttribute('stroke-dasharray', '2.5,2.0');
    }
    group.appendChild(line);

    // Sharp pointy arrowhead polygon
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`);
    polygon.setAttribute('fill', color);
    group.appendChild(polygon);

    svg.appendChild(group);
  }
}
