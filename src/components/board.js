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
    this.visionOverlay = options.visionOverlay || 'none'; // 'none' | 'hanging' | 'heatmap'

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
    ['fen', 'orientation', 'theme', 'interactive', 'showPlayerBars', 'whiteName', 'blackName', 'onMove', 'legalMovesFrom', 'lastMove', 'bestMove', 'secondBestMove', 'threatMove', 'badge', 'visionOverlay'].forEach((k) => {
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
    this.container.innerHTML = '';

    const board = this.parseFen(this.fen);
    const isWhiteOrientation = this.orientation === 'w';
    const files = isWhiteOrientation ? FILES : FILES_REV;
    const ranks = isWhiteOrientation ? RANKS : RANKS_REV;
    const themeColors = THEMES[this.theme] || THEMES.green;
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
    const visionData = (this.visionOverlay && this.visionOverlay !== 'none' && typeof analyzeBoardVision === 'function')
      ? analyzeBoardVision(this.fen)
      : null;

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

        const origR = isWhiteOrientation ? rIdx : 7 - rIdx;
        const origF = isWhiteOrientation ? fIdx : 7 - fIdx;
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

        if (visionData) {
          if (this.visionOverlay === 'hanging') {
            const pStatus = visionData.pieceStatus[square];
            if (pStatus) {
              const isHanging = pStatus.status === 'hanging';
              const ringEl = document.createElement('div');
              ringEl.className = isHanging ? 'xray-hanging-ring' : 'xray-loose-ring';
              ringEl.title = pStatus.label;
              const tagEl = document.createElement('span');
              tagEl.className = isHanging ? 'xray-hanging-tag' : 'xray-loose-tag';
              tagEl.textContent = isHanging ? '🎯 HANGING' : '⚠️ LOOSE';
              ringEl.appendChild(tagEl);
              sqDiv.appendChild(ringEl);
            }
          } else if (this.visionOverlay === 'heatmap') {
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
