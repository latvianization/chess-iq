/**
 * Vanilla JS Chessboard Component
 * Renders an interactive 8x8 chessboard with SVG piece rendering,
 * move highlights, arrows, and comic sound effect badges.
 */

import { INLINE_PIECE_DATA_URLS } from './pieceSvgs.js';
import { getComicBadge, COMIC_DICTIONARY } from '../services/comicBadges.js';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const THEMES = {
  green: { light: '#ebecd0', dark: '#739552' },
  wood: { light: '#f0d9b5', dark: '#b58863' },
  icy: { light: '#dee3e6', dark: '#587a9f' },
};

export class Chessboard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.fen = options.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    this.orientation = options.orientation || 'w';
    this.theme = options.theme || 'green';
    this.interactive = options.interactive || false;
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

    this.render();
  }

  setProps(newProps) {
    let shouldRerender = false;
    ['fen', 'orientation', 'theme', 'interactive', 'onMove', 'legalMovesFrom', 'lastMove', 'bestMove', 'secondBestMove', 'threatMove', 'badge'].forEach((k) => {
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
    const rows = fen.split(' ')[0].split('/');
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
        // Deselect
        this.selectedSquare = null;
        this.possibleDests = [];
        this.render();
        return;
      }

      // Check if clicking a destination
      if (this.possibleDests.includes(square)) {
        const from = this.selectedSquare;
        this.selectedSquare = null;
        this.possibleDests = [];
        this.render();
        if (this.onMove) {
          this.onMove(from, square);
        }
        return;
      }
    }

    // Try selecting piece
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

  render() {
    this.container.innerHTML = '';

    const boardWrapper = document.createElement('div');
    boardWrapper.className = 'board-container';

    const grid = document.createElement('div');
    grid.className = 'board-grid';

    const board = this.parseFen(this.fen);
    const files = this.orientation === 'w' ? FILES : [...FILES].reverse();
    const ranks = this.orientation === 'w' ? RANKS : [...RANKS].reverse();
    const themeColors = THEMES[this.theme] || THEMES.green;

    ranks.forEach((rank, rIdx) => {
      files.forEach((file, fIdx) => {
        const square = `${file}${rank}`;
        const isDark = (rIdx + fIdx) % 2 === 1;
        const squareColor = isDark ? themeColors.dark : themeColors.light;

        const sqDiv = document.createElement('div');
        sqDiv.className = 'board-square';
        sqDiv.dataset.square = square;

        // Last move highlight
        const isLastMove = this.lastMove && (this.lastMove.from === square || this.lastMove.to === square);
        const isSelected = this.selectedSquare === square;

        if (isSelected) {
          sqDiv.classList.add('selected');
        } else if (isLastMove) {
          sqDiv.classList.add(isDark ? 'last-move-dark' : 'last-move-light');
        } else {
          sqDiv.style.backgroundColor = squareColor;
        }

        // Square coordinates on edges
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

        // Piece
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
          img.draggable = false;

          // Animate piece movement from previous square
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
                img.style.zIndex = '10';
                this.lastAnimatedMoveKey = currentMoveKey;
                const raf = typeof window !== 'undefined' && window.requestAnimationFrame ? window.requestAnimationFrame : (cb) => setTimeout(cb, 16);
                raf(() => {
                  raf(() => {
                    img.style.transition = 'transform 180ms cubic-bezier(0.2, 0, 0.2, 1)';
                    img.style.transform = 'translate(0, 0)';
                  });
                });
              }
            }
          }

          sqDiv.appendChild(img);
        }

        // Possible destination dot or capture target border
        if (this.possibleDests.includes(square)) {
          if (pieceChar) {
            sqDiv.classList.add('capture-target');
          } else {
            const dot = document.createElement('div');
            dot.className = 'move-dot';
            sqDiv.appendChild(dot);
          }
        }

        // Comic Badge
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

        sqDiv.addEventListener('click', () => {
          this.handleSquareClick(square, pieceChar);
        });

        grid.appendChild(sqDiv);
      });
    });

    boardWrapper.appendChild(grid);

    // SVG Arrows Layer (Best move, second best move, threat arrow)
    const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttribute('class', 'position-absolute top-0 start-0 w-100 h-100 pointer-events-none');
    svgLayer.style.pointerEvents = 'none';
    svgLayer.style.zIndex = '15';

    // Thin green arrow for second best move (rendered underneath if overlapping)
    if (this.secondBestMove && this.secondBestMove.from && this.secondBestMove.to) {
      this.drawArrow(svgLayer, this.secondBestMove.from, this.secondBestMove.to, '#10b981', false, 'second-best-move', 2.2);
    }
    // Thick green arrow for best move
    if (this.bestMove && this.bestMove.from && this.bestMove.to) {
      this.drawArrow(svgLayer, this.bestMove.from, this.bestMove.to, '#10b981', false, 'best-move', 4.8);
    }
    // Red dashed arrow for threat
    if (this.threatMove && this.threatMove.from && this.threatMove.to) {
      this.drawArrow(svgLayer, this.threatMove.from, this.threatMove.to, '#ef4444', true, 'threat-move', 3.5);
    }

    boardWrapper.appendChild(svgLayer);
    this.container.appendChild(boardWrapper);
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
