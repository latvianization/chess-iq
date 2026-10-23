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

/* --- src/components/pieceSvgs.js --- */
/**
 * Embedded SVG Data URLs for Tournament Vector Pieces.
 * Ensures 100% offline availability and zero 404 errors on GitHub Pages subpaths.
 */
var INLINE_PIECE_DATA_URLS = {
  bB: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0D%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0D%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0D%0A%20%20%3Cg%20style%3D%22opacity%3A1%3B%20fill%3Anone%3B%20fill-rule%3Aevenodd%3B%20fill-opacity%3A1%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3B%20stroke-linejoin%3Around%3B%20stroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%20transform%3D%22translate(0%2C0.6)%22%3E%0D%0A%20%20%20%20%3Cg%20style%3D%22fill%3A%23000000%3B%20stroke%3A%23000000%3B%20stroke-linecap%3Abutt%3B%22%3E%0D%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%209%2C36%20C%2012.39%2C35.03%2019.11%2C36.43%2022.5%2C34%20C%2025.89%2C36.43%2032.61%2C35.03%2036%2C36%20C%2036%2C36%2037.65%2C36.54%2039%2C38%20C%2038.32%2C38.97%2037.35%2C38.99%2036%2C38.5%20C%2032.61%2C37.53%2025.89%2C38.96%2022.5%2C37.5%20C%2019.11%2C38.96%2012.39%2C37.53%209%2C38.5%20C%207.65%2C38.99%206.68%2C38.97%206%2C38%20C%207.35%2C36.54%209%2C36%209%2C36%20z%22%2F%3E%0D%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%2015%2C32%20C%2017.5%2C34.5%2027.5%2C34.5%2030%2C32%20C%2030.5%2C30.5%2030%2C30%2030%2C30%20C%2030%2C27.5%2027.5%2C26%2027.5%2C26%20C%2033%2C24.5%2033.5%2C14.5%2022.5%2C10.5%20C%2011.5%2C14.5%2012%2C24.5%2017.5%2C26%20C%2017.5%2C26%2015%2C27.5%2015%2C30%20C%2015%2C30%2014.5%2C30.5%2015%2C32%20z%22%2F%3E%0D%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%2025%208%20A%202.5%202.5%200%201%201%20%2020%2C8%20A%202.5%202.5%200%201%201%20%2025%208%20z%22%2F%3E%0D%0A%20%20%20%20%3C%2Fg%3E%0D%0A%20%20%20%20%3Cpath%20d%3D%22M%2017.5%2C26%20L%2027.5%2C26%20M%2015%2C30%20L%2030%2C30%20M%2022.5%2C15.5%20L%2022.5%2C20.5%20M%2020%2C18%20L%2025%2C18%22%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%20stroke-linejoin%3Amiter%3B%22%2F%3E%0D%0A%20%20%3C%2Fg%3E%0D%0A%3C%2Fsvg%3E%0D%0A",
  bK: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0A%20%20%3Cg%20style%3D%22fill%3Anone%3B%20fill-opacity%3A1%3B%20fill-rule%3Aevenodd%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2022.5%2C11.63%20L%2022.5%2C6%22%20style%3D%22fill%3Anone%3B%20stroke%3A%23000000%3B%20stroke-linejoin%3Amiter%3B%22%20id%3D%22path6570%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2022.5%2C25%20C%2022.5%2C25%2027%2C17.5%2025.5%2C14.5%20C%2025.5%2C14.5%2024.5%2C12%2022.5%2C12%20C%2020.5%2C12%2019.5%2C14.5%2019.5%2C14.5%20C%2018%2C17.5%2022.5%2C25%2022.5%2C25%22%20style%3D%22fill%3A%23000000%3Bfill-opacity%3A1%3B%20stroke-linecap%3Abutt%3B%20stroke-linejoin%3Amiter%3B%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2012.5%2C37%20C%2018%2C40.5%2027%2C40.5%2032.5%2C37%20L%2032.5%2C30%20C%2032.5%2C30%2041.5%2C25.5%2038.5%2C19.5%20C%2034.5%2C13%2025%2C16%2022.5%2C23.5%20L%2022.5%2C27%20L%2022.5%2C23.5%20C%2020%2C16%2010.5%2C13%206.5%2C19.5%20C%203.5%2C25.5%2012.5%2C30%2012.5%2C30%20L%2012.5%2C37%22%20style%3D%22fill%3A%23000000%3B%20stroke%3A%23000000%3B%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2020%2C8%20L%2025%2C8%22%20style%3D%22fill%3Anone%3B%20stroke%3A%23000000%3B%20stroke-linejoin%3Amiter%3B%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2032%2C29.5%20C%2032%2C29.5%2040.5%2C25.5%2038.03%2C19.85%20C%2034.15%2C14%2025%2C18%2022.5%2C24.5%20L%2022.5%2C26.6%20L%2022.5%2C24.5%20C%2020%2C18%2010.85%2C14%206.97%2C19.85%20C%204.5%2C25.5%2013%2C29.5%2013%2C29.5%22%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2012.5%2C30%20C%2018%2C27%2027%2C27%2032.5%2C30%20M%2012.5%2C33.5%20C%2018%2C30.5%2027%2C30.5%2032.5%2C33.5%20M%2012.5%2C37%20C%2018%2C34%2027%2C34%2032.5%2C37%22%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%22%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A",
  bN: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0D%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0D%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0D%0A%20%20%3Cg%20style%3D%22opacity%3A1%3B%20fill%3Anone%3B%20fill-opacity%3A1%3B%20fill-rule%3Aevenodd%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%20transform%3D%22translate(0%2C0.3)%22%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2022%2C10%20C%2032.5%2C11%2038.5%2C18%2038%2C39%20L%2015%2C39%20C%2015%2C30%2025%2C32.5%2023%2C18%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23000000%3B%20stroke%3A%23000000%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2024%2C18%20C%2024.38%2C20.91%2018.45%2C25.37%2016%2C27%20C%2013%2C29%2013.18%2C31.34%2011%2C31%20C%209.958%2C30.06%2012.41%2C27.96%2011%2C28%20C%2010%2C28%2011.19%2C29.23%2010%2C30%20C%209%2C30%205.997%2C31%206%2C26%20C%206%2C24%2012%2C14%2012%2C14%20C%2012%2C14%2013.89%2C12.1%2014%2C10.5%20C%2013.27%2C9.506%2013.5%2C8.5%2013.5%2C7.5%20C%2014.5%2C6.5%2016.5%2C10%2016.5%2C10%20L%2018.5%2C10%20C%2018.5%2C10%2019.28%2C8.008%2021%2C7%20C%2022%2C7%2022%2C10%2022%2C10%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23000000%3B%20stroke%3A%23000000%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%209.5%2025.5%20A%200.5%200.5%200%201%201%208.5%2C25.5%20A%200.5%200.5%200%201%201%209.5%2025.5%20z%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23ffffff%3B%20stroke%3A%23ffffff%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2015%2015.5%20A%200.5%201.5%200%201%201%20%2014%2C15.5%20A%200.5%201.5%200%201%201%20%2015%2015.5%20z%22%0D%0A%20%20%20%20%20%20transform%3D%22matrix(0.866%2C0.5%2C-0.5%2C0.866%2C9.693%2C-5.173)%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23ffffff%3B%20stroke%3A%23ffffff%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2024.55%2C10.4%20L%2024.1%2C11.85%20L%2024.6%2C12%20C%2027.75%2C13%2030.25%2C14.49%2032.5%2C18.75%20C%2034.75%2C23.01%2035.75%2C29.06%2035.25%2C39%20L%2035.2%2C39.5%20L%2037.45%2C39.5%20L%2037.5%2C39%20C%2038%2C28.94%2036.62%2C22.15%2034.25%2C17.66%20C%2031.88%2C13.17%2028.46%2C11.02%2025.06%2C10.5%20L%2024.55%2C10.4%20z%20%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23ffffff%3B%20stroke%3Anone%3B%22%20%2F%3E%0D%0A%20%20%3C%2Fg%3E%0D%0A%3C%2Fsvg%3E%0D%0A",
  bP: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0A%20%20%3Cpath%20d%3D%22m%2022.5%2C9%20c%20-2.21%2C0%20-4%2C1.79%20-4%2C4%200%2C0.89%200.29%2C1.71%200.78%2C2.38%20C%2017.33%2C16.5%2016%2C18.59%2016%2C21%20c%200%2C2.03%200.94%2C3.84%202.41%2C5.03%20C%2015.41%2C27.09%2011%2C31.58%2011%2C39.5%20H%2034%20C%2034%2C31.58%2029.59%2C27.09%2026.59%2C26.03%2028.06%2C24.84%2029%2C23.03%2029%2C21%2029%2C18.59%2027.67%2C16.5%2025.72%2C15.38%2026.21%2C14.71%2026.5%2C13.89%2026.5%2C13%20c%200%2C-2.21%20-1.79%2C-4%20-4%2C-4%20z%22%20style%3D%22opacity%3A1%3B%20fill%3A%23000000%3B%20fill-opacity%3A1%3B%20fill-rule%3Anonzero%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3B%20stroke-linejoin%3Amiter%3B%20stroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%2F%3E%0A%3C%2Fsvg%3E%0A",
  bQ: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%20standalone%3D%22no%22%3F%3E%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%0A%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%0Aheight%3D%2245%22%3E%0A%20%20%3Cg%20style%3D%22fill%3A%23000000%3Bstroke%3A%23000000%3Bstroke-width%3A1.5%3B%20stroke-linecap%3Around%3Bstroke-linejoin%3Around%22%3E%0A%0A%20%20%20%20%3Cpath%20d%3D%22M%209%2C26%20C%2017.5%2C24.5%2030%2C24.5%2036%2C26%20L%2038.5%2C13.5%20L%2031%2C25%20L%2030.7%2C10.9%20L%2025.5%2C24.5%20L%2022.5%2C10%20L%2019.5%2C24.5%20L%2014.3%2C10.9%20L%2014%2C25%20L%206.5%2C13.5%20L%209%2C26%20z%22%0A%20%20%20%20style%3D%22stroke-linecap%3Abutt%3Bfill%3A%23000000%22%20%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22m%209%2C26%20c%200%2C2%201.5%2C2%202.5%2C4%201%2C1.5%201%2C1%200.5%2C3.5%20-1.5%2C1%20-1%2C2.5%20-1%2C2.5%20-1.5%2C1.5%200%2C2.5%200%2C2.5%206.5%2C1%2016.5%2C1%2023%2C0%200%2C0%201.5%2C-1%200%2C-2.5%200%2C0%200.5%2C-1.5%20-1%2C-2.5%20-0.5%2C-2.5%20-0.5%2C-2%200.5%2C-3.5%201%2C-2%202.5%2C-2%202.5%2C-4%20-8.5%2C-1.5%20-18.5%2C-1.5%20-27%2C0%20z%22%20%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2011.5%2C30%20C%2015%2C29%2030%2C29%2033.5%2C30%22%20%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22m%2012%2C33.5%20c%206%2C-1%2015%2C-1%2021%2C0%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%226%22%20cy%3D%2212%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%2214%22%20cy%3D%229%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%2222.5%22%20cy%3D%228%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%2231%22%20cy%3D%229%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%2239%22%20cy%3D%2212%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2011%2C38.5%20A%2035%2C35%201%200%200%2034%2C38.5%22%0A%20%20%20%20style%3D%22fill%3Anone%3B%20stroke%3A%23000000%3Bstroke-linecap%3Abutt%3B%22%20%2F%3E%0A%20%20%20%20%3Cg%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%22%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%2011%2C29%20A%2035%2C35%201%200%201%2034%2C29%22%20%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%2012.5%2C31.5%20L%2032.5%2C31.5%22%20%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%2011.5%2C34.5%20A%2035%2C35%201%200%200%2033.5%2C34.5%22%20%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%2010.5%2C37.5%20A%2035%2C35%201%200%200%2034.5%2C37.5%22%20%2F%3E%0A%20%20%20%20%3C%2Fg%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A",
  bR: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0A%20%20%3Cg%20style%3D%22opacity%3A1%3B%20fill%3A%23000000%3B%20fill-opacity%3A1%3B%20fill-rule%3Aevenodd%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%20transform%3D%22translate(0%2C0.3)%22%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%209%2C39%20L%2036%2C39%20L%2036%2C36%20L%209%2C36%20L%209%2C39%20z%20%22%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2012.5%2C32%20L%2014%2C29.5%20L%2031%2C29.5%20L%2032.5%2C32%20L%2012.5%2C32%20z%20%22%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2012%2C36%20L%2012%2C32%20L%2033%2C32%20L%2033%2C36%20L%2012%2C36%20z%20%22%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2014%2C29.5%20L%2014%2C16.5%20L%2031%2C16.5%20L%2031%2C29.5%20L%2014%2C29.5%20z%20%22%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3Bstroke-linejoin%3Amiter%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2014%2C16.5%20L%2011%2C14%20L%2034%2C14%20L%2031%2C16.5%20L%2014%2C16.5%20z%20%22%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2011%2C14%20L%2011%2C9%20L%2015%2C9%20L%2015%2C11%20L%2020%2C11%20L%2020%2C9%20L%2025%2C9%20L%2025%2C11%20L%2030%2C11%20L%2030%2C9%20L%2034%2C9%20L%2034%2C14%20L%2011%2C14%20z%20%22%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2012%2C35.5%20L%2033%2C35.5%20L%2033%2C35.5%22%0A%20%20%20%20%20%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%20stroke-width%3A1%3B%20stroke-linejoin%3Amiter%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2013%2C31.5%20L%2032%2C31.5%22%0A%20%20%20%20%20%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%20stroke-width%3A1%3B%20stroke-linejoin%3Amiter%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2014%2C29.5%20L%2031%2C29.5%22%0A%20%20%20%20%20%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%20stroke-width%3A1%3B%20stroke-linejoin%3Amiter%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2014%2C16.5%20L%2031%2C16.5%22%0A%20%20%20%20%20%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%20stroke-width%3A1%3B%20stroke-linejoin%3Amiter%3B%22%20%2F%3E%0A%20%20%20%20%3Cpath%0A%20%20%20%20%20%20d%3D%22M%2011%2C14%20L%2034%2C14%22%0A%20%20%20%20%20%20style%3D%22fill%3Anone%3B%20stroke%3A%23ffffff%3B%20stroke-width%3A1%3B%20stroke-linejoin%3Amiter%3B%22%20%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A",
  wB: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0D%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0D%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0D%0A%20%20%3Cg%20style%3D%22opacity%3A1%3B%20fill%3Anone%3B%20fill-rule%3Aevenodd%3B%20fill-opacity%3A1%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3B%20stroke-linejoin%3Around%3B%20stroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%20transform%3D%22translate(0%2C0.6)%22%3E%0D%0A%20%20%20%20%3Cg%20style%3D%22fill%3A%23ffffff%3B%20stroke%3A%23000000%3B%20stroke-linecap%3Abutt%3B%22%3E%0D%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%209%2C36%20C%2012.39%2C35.03%2019.11%2C36.43%2022.5%2C34%20C%2025.89%2C36.43%2032.61%2C35.03%2036%2C36%20C%2036%2C36%2037.65%2C36.54%2039%2C38%20C%2038.32%2C38.97%2037.35%2C38.99%2036%2C38.5%20C%2032.61%2C37.53%2025.89%2C38.96%2022.5%2C37.5%20C%2019.11%2C38.96%2012.39%2C37.53%209%2C38.5%20C%207.65%2C38.99%206.68%2C38.97%206%2C38%20C%207.35%2C36.54%209%2C36%209%2C36%20z%22%2F%3E%0D%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%2015%2C32%20C%2017.5%2C34.5%2027.5%2C34.5%2030%2C32%20C%2030.5%2C30.5%2030%2C30%2030%2C30%20C%2030%2C27.5%2027.5%2C26%2027.5%2C26%20C%2033%2C24.5%2033.5%2C14.5%2022.5%2C10.5%20C%2011.5%2C14.5%2012%2C24.5%2017.5%2C26%20C%2017.5%2C26%2015%2C27.5%2015%2C30%20C%2015%2C30%2014.5%2C30.5%2015%2C32%20z%22%2F%3E%0D%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%2025%208%20A%202.5%202.5%200%201%201%20%2020%2C8%20A%202.5%202.5%200%201%201%20%2025%208%20z%22%2F%3E%0D%0A%20%20%20%20%3C%2Fg%3E%0D%0A%20%20%20%20%3Cpath%20d%3D%22M%2017.5%2C26%20L%2027.5%2C26%20M%2015%2C30%20L%2030%2C30%20M%2022.5%2C15.5%20L%2022.5%2C20.5%20M%2020%2C18%20L%2025%2C18%22%20style%3D%22fill%3Anone%3B%20stroke%3A%23000000%3B%20stroke-linejoin%3Amiter%3B%22%2F%3E%0D%0A%20%20%3C%2Fg%3E%0D%0A%3C%2Fsvg%3E%0D%0A",
  wK: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2245%22%20height%3D%2245%22%3E%0A%20%20%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%20stroke%3D%22%23000%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%3E%0A%20%20%20%20%3Cpath%20stroke-linejoin%3D%22miter%22%20d%3D%22M22.5%2011.63V6M20%208h5%22%2F%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23fff%22%20stroke-linecap%3D%22butt%22%20stroke-linejoin%3D%22miter%22%20d%3D%22M22.5%2025s4.5-7.5%203-10.5c0%200-1-2.5-3-2.5s-3%202.5-3%202.5c-1.5%203%203%2010.5%203%2010.5%22%2F%3E%0A%20%20%20%20%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M12.5%2037c5.5%203.5%2014.5%203.5%2020%200v-7s9-4.5%206-10.5c-4-6.5-13.5-3.5-16%204V27v-3.5c-2.5-7.5-12-10.5-16-4-3%206%206%2010.5%206%2010.5v7%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M12.5%2030c5.5-3%2014.5-3%2020%200m-20%203.5c5.5-3%2014.5-3%2020%200m-20%203.5c5.5-3%2014.5-3%2020%200%22%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E",
  wN: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0D%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0D%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0D%0A%20%20%3Cg%20style%3D%22opacity%3A1%3B%20fill%3Anone%3B%20fill-opacity%3A1%3B%20fill-rule%3Aevenodd%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%20transform%3D%22translate(0%2C0.3)%22%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2022%2C10%20C%2032.5%2C11%2038.5%2C18%2038%2C39%20L%2015%2C39%20C%2015%2C30%2025%2C32.5%2023%2C18%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23ffffff%3B%20stroke%3A%23000000%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2024%2C18%20C%2024.38%2C20.91%2018.45%2C25.37%2016%2C27%20C%2013%2C29%2013.18%2C31.34%2011%2C31%20C%209.958%2C30.06%2012.41%2C27.96%2011%2C28%20C%2010%2C28%2011.19%2C29.23%2010%2C30%20C%209%2C30%205.997%2C31%206%2C26%20C%206%2C24%2012%2C14%2012%2C14%20C%2012%2C14%2013.89%2C12.1%2014%2C10.5%20C%2013.27%2C9.506%2013.5%2C8.5%2013.5%2C7.5%20C%2014.5%2C6.5%2016.5%2C10%2016.5%2C10%20L%2018.5%2C10%20C%2018.5%2C10%2019.28%2C8.008%2021%2C7%20C%2022%2C7%2022%2C10%2022%2C10%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23ffffff%3B%20stroke%3A%23000000%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%209.5%2025.5%20A%200.5%200.5%200%201%201%208.5%2C25.5%20A%200.5%200.5%200%201%201%209.5%2025.5%20z%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23000000%3B%20stroke%3A%23000000%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2015%2015.5%20A%200.5%201.5%200%201%201%20%2014%2C15.5%20A%200.5%201.5%200%201%201%20%2015%2015.5%20z%22%0D%0A%20%20%20%20%20%20transform%3D%22matrix(0.866%2C0.5%2C-0.5%2C0.866%2C9.693%2C-5.173)%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3A%23000000%3B%20stroke%3A%23000000%3B%22%20%2F%3E%0D%0A%20%20%3C%2Fg%3E%0D%0A%3C%2Fsvg%3E%0D%0A",
  wP: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0A%20%20%3Cpath%20d%3D%22m%2022.5%2C9%20c%20-2.21%2C0%20-4%2C1.79%20-4%2C4%200%2C0.89%200.29%2C1.71%200.78%2C2.38%20C%2017.33%2C16.5%2016%2C18.59%2016%2C21%20c%200%2C2.03%200.94%2C3.84%202.41%2C5.03%20C%2015.41%2C27.09%2011%2C31.58%2011%2C39.5%20H%2034%20C%2034%2C31.58%2029.59%2C27.09%2026.59%2C26.03%2028.06%2C24.84%2029%2C23.03%2029%2C21%2029%2C18.59%2027.67%2C16.5%2025.72%2C15.38%2026.21%2C14.71%2026.5%2C13.89%2026.5%2C13%20c%200%2C-2.21%20-1.79%2C-4%20-4%2C-4%20z%22%20style%3D%22opacity%3A1%3B%20fill%3A%23ffffff%3B%20fill-opacity%3A1%3B%20fill-rule%3Anonzero%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3B%20stroke-linejoin%3Amiter%3B%20stroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%2F%3E%0A%3C%2Fsvg%3E%0A",
  wQ: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0A%20%20%3Cg%20style%3D%22fill%3A%23ffffff%3Bstroke%3A%23000000%3Bstroke-width%3A1.5%3Bstroke-linejoin%3Around%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%209%2C26%20C%2017.5%2C24.5%2030%2C24.5%2036%2C26%20L%2038.5%2C13.5%20L%2031%2C25%20L%2030.7%2C10.9%20L%2025.5%2C24.5%20L%2022.5%2C10%20L%2019.5%2C24.5%20L%2014.3%2C10.9%20L%2014%2C25%20L%206.5%2C13.5%20L%209%2C26%20z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%209%2C26%20C%209%2C28%2010.5%2C28%2011.5%2C30%20C%2012.5%2C31.5%2012.5%2C31%2012%2C33.5%20C%2010.5%2C34.5%2011%2C36%2011%2C36%20C%209.5%2C37.5%2011%2C38.5%2011%2C38.5%20C%2017.5%2C39.5%2027.5%2C39.5%2034%2C38.5%20C%2034%2C38.5%2035.5%2C37.5%2034%2C36%20C%2034%2C36%2034.5%2C34.5%2033%2C33.5%20C%2032.5%2C31%2032.5%2C31.5%2033.5%2C30%20C%2034.5%2C28%2036%2C28%2036%2C26%20C%2027.5%2C24.5%2017.5%2C24.5%209%2C26%20z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2011.5%2C30%20C%2015%2C29%2030%2C29%2033.5%2C30%22%20style%3D%22fill%3Anone%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2012%2C33.5%20C%2018%2C32.5%2027%2C32.5%2033%2C33.5%22%20style%3D%22fill%3Anone%22%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%226%22%20cy%3D%2212%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%2214%22%20cy%3D%229%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%2222.5%22%20cy%3D%228%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%2231%22%20cy%3D%229%22%20r%3D%222%22%20%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%2239%22%20cy%3D%2212%22%20r%3D%222%22%20%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A",
  wR: "data:image/svg+xml;utf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%0D%0A%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0D%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%2245%22%20height%3D%2245%22%3E%0D%0A%20%20%3Cg%20style%3D%22opacity%3A1%3B%20fill%3A%23ffffff%3B%20fill-opacity%3A1%3B%20fill-rule%3Aevenodd%3B%20stroke%3A%23000000%3B%20stroke-width%3A1.5%3B%20stroke-linecap%3Around%3Bstroke-linejoin%3Around%3Bstroke-miterlimit%3A4%3B%20stroke-dasharray%3Anone%3B%20stroke-opacity%3A1%3B%22%20transform%3D%22translate(0%2C0.3)%22%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%209%2C39%20L%2036%2C39%20L%2036%2C36%20L%209%2C36%20L%209%2C39%20z%20%22%0D%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2012%2C36%20L%2012%2C32%20L%2033%2C32%20L%2033%2C36%20L%2012%2C36%20z%20%22%0D%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2011%2C14%20L%2011%2C9%20L%2015%2C9%20L%2015%2C11%20L%2020%2C11%20L%2020%2C9%20L%2025%2C9%20L%2025%2C11%20L%2030%2C11%20L%2030%2C9%20L%2034%2C9%20L%2034%2C14%22%0D%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2034%2C14%20L%2031%2C17%20L%2014%2C17%20L%2011%2C14%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2031%2C17%20L%2031%2C29.5%20L%2014%2C29.5%20L%2014%2C17%22%0D%0A%20%20%20%20%20%20style%3D%22stroke-linecap%3Abutt%3B%20stroke-linejoin%3Amiter%3B%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2031%2C29.5%20L%2032.5%2C32%20L%2012.5%2C32%20L%2014%2C29.5%22%20%2F%3E%0D%0A%20%20%20%20%3Cpath%0D%0A%20%20%20%20%20%20d%3D%22M%2011%2C14%20L%2034%2C14%22%0D%0A%20%20%20%20%20%20style%3D%22fill%3Anone%3B%20stroke%3A%23000000%3B%20stroke-linejoin%3Amiter%3B%22%20%2F%3E%0D%0A%20%20%3C%2Fg%3E%0D%0A%3C%2Fsvg%3E%0D%0A",
};

/* --- src/services/comicBadges.js --- */
/**
 * Comic Badges Service
 * Provides colorful comic sound effect terms (KABOOM!, POW!, ZAP!, SPLAT!)
 * and color tokens for move classifications.
 */

var COMIC_DICTIONARY = {
  brilliant: {
    words: ['Brilliant'],
    symbol: '💎',
    standardLabel: '!!',
    bg: '#06b6d4',
    border: '#083344',
    text: '#ffffff',
    accentBg: '#cffafe',
    starColor: '#22d3ee',
  },
  great: {
    words: ['Great Move'],
    symbol: '⚡',
    standardLabel: '!',
    bg: '#3b82f6',
    border: '#1e3a8a',
    text: '#ffffff',
    accentBg: '#dbeafe',
    starColor: '#60a5fa',
  },
  best: {
    words: ['Best Move'],
    symbol: '⭐',
    standardLabel: '★',
    bg: '#10b981',
    border: '#064e3b',
    text: '#ffffff',
    accentBg: '#d1fae5',
    starColor: '#34d399',
  },
  excellent: {
    words: ['Excellent'],
    symbol: '✓',
    standardLabel: '✓',
    bg: '#22c55e',
    border: '#14532d',
    text: '#ffffff',
    accentBg: '#dcfce7',
    starColor: '#4ade80',
  },
  good: {
    words: ['Good'],
    symbol: '👍',
    standardLabel: '·',
    bg: '#84cc16',
    border: '#365314',
    text: '#ffffff',
    accentBg: '#ecfccb',
    starColor: '#a3e635',
  },
  book: {
    words: ['Book Move'],
    symbol: '📖',
    standardLabel: '📖',
    bg: '#8b5cf6',
    border: '#4c1d95',
    text: '#ffffff',
    accentBg: '#ede9fe',
    starColor: '#a78bfa',
  },
  inaccuracy: {
    words: ['Inaccuracy'],
    symbol: '⁈',
    standardLabel: '?!',
    bg: '#eab308',
    border: '#713f12',
    text: '#000000',
    accentBg: '#fef9c3',
    starColor: '#facc15',
  },
  mistake: {
    words: ['Mistake'],
    symbol: '⁇',
    standardLabel: '?',
    bg: '#f97316',
    border: '#7c2d12',
    text: '#ffffff',
    accentBg: '#ffedd5',
    starColor: '#fb923c',
  },
  blunder: {
    words: ['Blunder'],
    symbol: '💥',
    standardLabel: '??',
    bg: '#ef4444',
    border: '#7f1d1d',
    text: '#ffffff',
    accentBg: '#fee2e2',
    starColor: '#f87171',
  },
  missed_win: {
    words: ['Missed Win'],
    symbol: '✖',
    standardLabel: '✖',
    bg: '#be123c',
    border: '#4c0519',
    text: '#ffffff',
    accentBg: '#ffe4e6',
    starColor: '#f43f5e',
  },
};

/**
 * Deterministically pick a varied comic word based on ply or string seed
 */
function getComicBadge(classification, seed = 0) {
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

/* --- src/services/ecoDictionary.js --- */
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

/* --- src/data/botsData.js --- */
var BOTS_33 = [
  // ─── TIER 1: ROOKIES (400 - 750) ──────────────────────────────────────────
  {
    id: 'pip_400',
    name: 'Pip the Pup',
    elo: 400,
    avatar: '🐶',
    title: 'Playful Puppy',
    tier: 'rookie',
    description: 'Barks excitedly and loves running pawns into open danger!',
    depth: 1,
    randomness: 0.75,
    speech: {
      onStart: ['Woof! Ready to chase some wooden pieces!', 'Tail is wagging, let us play!'],
      onUserBlunder: ['Woof! Free snack for Pip!', 'Did a squirrel distract you?!', 'Arf! I will take that!'],
      onUserGreat: ['Yip! That looked super smart!', 'Whimper... my poor wooden piece!'],
      onBotCheck: ['Woof woof! Check from Pip!', 'Watch out for puppy teeth!'],
      onBotWin: ['Bork! I won a golden bone today!', 'Who is a good boy? Pip is!'],
      onBotLoss: ['Whimper... nap time under the couch for me!', 'Good game! Bark!'],
    },
  },
  {
    id: 'chomper_450',
    name: 'Chomper',
    elo: 450,
    avatar: '🦖',
    title: 'Tiny Dino',
    tier: 'rookie',
    description: 'Chomps at whatever piece is closest, whether protected or not!',
    depth: 1,
    randomness: 0.7,
    speech: {
      onStart: ['RAWR! Tiny dino ready to stomp!', 'Me love eating wooden bishops!'],
      onUserBlunder: ['CHOMP! Tastes like tasty points!', 'You leave snack for dino?!', 'Yum yum yum!'],
      onUserGreat: ['RAWR?! Tiny dino brain confused!', 'Ouch! My prehistoric toe!'],
      onBotCheck: ['ROAR! Dino check on your king!'],
      onBotWin: ['DINOSAURS RULE THE BOARD!', 'Rawr! Victory roar!'],
      onBotLoss: ['Extinction event! Good game human!', 'Meteorite hit my game!'],
    },
  },
  {
    id: 'barnaby_500',
    name: 'Barnaby Bear',
    elo: 500,
    avatar: '🐻',
    title: 'Honey Hunter',
    tier: 'rookie',
    description: 'Thinks the enemy king is hiding a pot of honey.',
    depth: 1,
    randomness: 0.65,
    speech: {
      onStart: ['Just waking from hibernation! Let us play.', 'Is there honey behind your e4 pawn?'],
      onUserBlunder: ['Sweeter than honey! Thank you!', 'Bear paw scoops up your piece!'],
      onUserGreat: ['Whoa! That stung like a bumblebee!', 'Sharp move, human!'],
      onBotCheck: ['Bear hug! That is check!'],
      onBotWin: ['Bear victory dance! Honey for everyone!'],
      onBotLoss: ['Time to hibernate again... Well played!'],
    },
  },
  {
    id: 'captain_clueless_550',
    name: 'Capt. Clueless',
    elo: 550,
    avatar: '🤠',
    title: 'Wandering Cowboy',
    tier: 'rookie',
    description: 'Charges his knights blindly into the frontier.',
    depth: 1,
    randomness: 0.6,
    speech: {
      onStart: ['Howdy partner! Which piece moves like a pony again?'],
      onUserBlunder: ['Yeehaw! Free cattle on the prairie!', 'Did your spurs slip, partner?!'],
      onUserGreat: ['Holy moly! You got quick-draw reflexes!'],
      onBotCheck: ['Reach for the sky! Check!'],
      onBotWin: ['Sheriff in town! GG partner!'],
      onBotLoss: ['Rode right off the cliff... Hats off to you!'],
    },
  },
  {
    id: 'gizmo_600',
    name: 'Gizmo',
    elo: 600,
    avatar: '👾',
    title: '8-Bit Retro Bot',
    tier: 'rookie',
    description: 'Beeps when confused and forgets to castle.',
    depth: 1,
    randomness: 0.55,
    speech: {
      onStart: ['BEEP BOOP! Insert coin to begin.'],
      onUserBlunder: ['GLITCH DETECTED! Piece assimilated!', '100 BONUS POINTS FOR GIZMO!'],
      onUserGreat: ['SYSTEM OVERLOAD! Critical hit!'],
      onBotCheck: ['WARNING: KING IN HAZARD ZONE!'],
      onBotWin: ['HIGH SCORE! Gizmo wins!'],
      onBotLoss: ['GAME OVER. Gizmo needs reboot!'],
    },
  },
  {
    id: 'daisy_650',
    name: 'Daisy Duckling',
    elo: 650,
    avatar: '🐥',
    title: 'Puddle Paddler',
    tier: 'rookie',
    description: 'Flaps her wings whenever a pawn crosses the fourth rank.',
    depth: 1,
    randomness: 0.5,
    speech: {
      onStart: ['Quack! Let us splash around the squares!'],
      onUserBlunder: ['Quack quack! Delicious breadcrumbs!', 'Duck scoop! Got your piece!'],
      onUserGreat: ['QUAAAACK! That was scary good!'],
      onBotCheck: ['Quack check! Move that king!'],
      onBotWin: ['Duckling victory splash!'],
      onBotLoss: ['Waddles away gracefully... nice win!'],
    },
  },
  {
    id: 'snack_pack_700',
    name: 'Snack Pack',
    elo: 700,
    avatar: '🍕',
    title: 'Slice of Life',
    tier: 'rookie',
    description: 'Treats every piece trade like ordering pizza toppings.',
    depth: 1,
    randomness: 0.45,
    speech: {
      onStart: ['Hot & fresh! Let us serve up some moves.'],
      onUserBlunder: ['Extra cheese on that blunder!', 'Delivered right to my doorstep!'],
      onUserGreat: ['Whoa, spicy tactics! Burned my tongue!'],
      onBotCheck: ['Ding! Order up! Check!'],
      onBotWin: ['Pizza party victory!'],
      onBotLoss: ['Left out in the rain... crust was defeated!'],
    },
  },
  {
    id: 'pawn_pirate_750',
    name: 'Pawn Pirate',
    elo: 750,
    avatar: '🏴‍☠️',
    title: 'Swashbuckler',
    tier: 'rookie',
    description: 'Hoards pawns like gold doubloons, but leaves his captain exposed.',
    depth: 1,
    randomness: 0.4,
    speech: {
      onStart: ['Ahoy matey! Shiver me rooks!'],
      onUserBlunder: ['Yo-ho-ho! Booty left unguarded!', 'Treasure chest looted!'],
      onUserGreat: ['By Blackbeard! A master broadside!'],
      onBotCheck: ['Avast ye! Check to your scallywag king!'],
      onBotWin: ['All the treasure be mine! Har har!'],
      onBotLoss: ['Walk the plank I must! Fair sailin partner!'],
    },
  },

  // ─── TIER 2: CHALLENGERS (800 - 1150) ─────────────────────────────────────
  {
    id: 'sparky_800',
    name: 'Sparky 2.0',
    elo: 800,
    avatar: '⚡',
    title: 'Zap Cadet',
    tier: 'challenger',
    description: 'Energized tactical moves, but still prone to lightning blunders.',
    depth: 1,
    randomness: 0.36,
    speech: {
      onStart: ['Current is humming! 800 volts of chess!'],
      onUserBlunder: ['ZAP! Short-circuited your defense!', 'Free voltage for my capacitor!'],
      onUserGreat: ['Sparks flying everywhere! What a move!'],
      onBotCheck: ['HIGH VOLTAGE CHECK!'],
      onBotWin: ['Electric victory! Overcharged!'],
      onBotLoss: ['Blew a fuse... nicely played!'],
    },
  },
  {
    id: 'foxy_850',
    name: 'Foxy Fiona',
    elo: 850,
    avatar: '🦊',
    title: 'Cunning Scout',
    tier: 'challenger',
    description: 'Always searching for sneaky pawn forks and sneaky pins.',
    depth: 2,
    randomness: 0.32,
    speech: {
      onStart: ['A cunning fox always has a plan in the woods.'],
      onUserBlunder: ['Snatched right out of the hen house!', 'Did you not see my tail twitch?!'],
      onUserGreat: ['Impressive trap! A fox knows when she is outsmarted.'],
      onBotCheck: ['Sneak attack! Check!'],
      onBotWin: ['Outfoxed! The woods belong to Fiona!'],
      onBotLoss: ['Caught in your snare! Great game!'],
    },
  },
  {
    id: 'rocky_900',
    name: 'Rocky Boulder',
    elo: 900,
    avatar: '🪨',
    title: 'Stone Guardian',
    tier: 'challenger',
    description: 'Builds a solid pawn wall and defends like a fortress.',
    depth: 2,
    randomness: 0.28,
    speech: {
      onStart: ['Solid as bedrock! Try chipping away.'],
      onUserBlunder: ['CRUSH! Rocks fall, your piece disappears!', 'Never test the stone!'],
      onUserGreat: ['A crack in the fortress! Sharp drilling!'],
      onBotCheck: ['Avalanche check!'],
      onBotWin: ['The mountain remains undefeated!'],
      onBotLoss: ['Crumbled to dust... you hit the sweet spot!'],
    },
  },
  {
    id: 'cheetah_950',
    name: 'Chester Sprint',
    elo: 950,
    avatar: '🐆',
    title: 'Speed Runner',
    tier: 'challenger',
    description: 'Attacks rapidly on the kingside before developing all pieces.',
    depth: 2,
    randomness: 0.25,
    speech: {
      onStart: ['Fast paws make fast wins! Catch me if you can!'],
      onUserBlunder: ['SWOOSH! Too slow to protect it!', 'Pounced before you could blink!'],
      onUserGreat: ['Whoa! You intercepted my sprint!'],
      onBotCheck: ['Ambush! Check!'],
      onBotWin: ['Speed limit exceeded! Chester wins!'],
      onBotLoss: ['Ran out of breath! That was blazing chess!'],
    },
  },
  {
    id: 'sergeant_pawn_1000',
    name: 'Sgt. Pawn',
    elo: 1000,
    avatar: '🪖',
    title: 'Drill Sergeant',
    tier: 'challenger',
    description: 'Strict adherence to piece safety and disciplined center control.',
    depth: 2,
    randomness: 0.22,
    speech: {
      onStart: ['ATTENTION! Pawns in marching order! Sound off!'],
      onUserBlunder: ['UNACCEPTABLE DISCIPLINE! Drop and give me 20! Confiscated!'],
      onUserGreat: ['Outstanding tactical maneuver, recruit!'],
      onBotCheck: ['TACTICAL ADVANCE! King under fire!'],
      onBotWin: ['Mission accomplished! Dismissed!'],
      onBotLoss: ['Honorable retreat! You earned your stripes today!'],
    },
  },
  {
    id: 'mystic_moth_1050',
    name: 'Mystic Maya',
    elo: 1050,
    avatar: '🦋',
    title: 'Winged Strategist',
    tier: 'challenger',
    description: 'Flutters bishops along long diagonals with hypnotic patterns.',
    depth: 2,
    randomness: 0.19,
    speech: {
      onStart: ['The board is woven like silk threads. Watch the wings.'],
      onUserBlunder: ['Trapped in the silk web!', 'Drawn to the flame!'],
      onUserGreat: ['A breeze that scatters the illusion! Brilliant!'],
      onBotCheck: ['Diagonal flutter! Check!'],
      onBotWin: ['The butterfly effect lands in victory!'],
      onBotLoss: ['Folded wings in admiration. Lovely play!'],
    },
  },
  {
    id: 'viking_val_1100',
    name: 'Val the Viking',
    elo: 1100,
    avatar: '🛡️',
    title: 'Shield Maiden',
    tier: 'challenger',
    description: 'Loves open f-files and aggressive rook lifts.',
    depth: 2,
    randomness: 0.16,
    speech: {
      onStart: ['For Valhalla! Raise the shields and advance!'],
      onUserBlunder: ['By Odin! A gift left in open waters!', 'Clash of steel, piece claimed!'],
      onUserGreat: ['A warrior strike! My shield took a heavy blow!'],
      onBotCheck: ['BATTLE CRY! Check on your monarch!'],
      onBotWin: ['A feast in Valhalla tonight! Skol!'],
      onBotLoss: ['You fought with true honor! Skol to the victor!'],
    },
  },
  {
    id: 'samurai_sora_1150',
    name: 'Sora Samurai',
    elo: 1150,
    avatar: '⚔️',
    title: 'Katana Master',
    tier: 'challenger',
    description: 'Disciplined counter-attacker waiting for opponents to overextend.',
    depth: 2,
    randomness: 0.14,
    speech: {
      onStart: ['Calm mind, steady blade. Let the battle unfold.'],
      onUserBlunder: ['One swift strike, and the piece falls.', 'Overextended! The blade strikes.'],
      onUserGreat: ['A masterful cut! My stance is shaken.'],
      onBotCheck: ['Focus your spirit! Check!'],
      onBotWin: ['The blade remains unbroken. Good fight.'],
      onBotLoss: ['A true swordsman bows in defeat. Well fought!'],
    },
  },

  // ─── TIER 3: HEROES (1200 - 1550) ─────────────────────────────────────────
  {
    id: 'elena_1200',
    name: 'Professor Elena',
    elo: 1200,
    avatar: '👩‍🏫',
    title: 'Club Champion',
    tier: 'hero',
    description: 'Balances opening theory, sound development, and sharp endgame conversion.',
    depth: 2,
    randomness: 0.12,
    speech: {
      onStart: ['Class is in session! Review your pawn structures.'],
      onUserBlunder: ['Tsk, textbook blunder! Rule number one: undefended pieces!', 'Duly noted in your grade report!'],
      onUserGreat: ['A+ move! Even the textbook would commend that!'],
      onBotCheck: ['Pop quiz! How will your king respond to check?'],
      onBotWin: ['Lesson concluded! You gave me a good game.'],
      onBotLoss: ['The student has surpassed the professor! Splendid!'],
    },
  },
  {
    id: 'neon_rider_1250',
    name: 'Neon Rider',
    elo: 1250,
    avatar: '🏍️',
    title: 'Synthwave Cruiser',
    tier: 'hero',
    description: 'Smooth transitional play with aggressive queen maneuvering.',
    depth: 2,
    randomness: 0.1,
    speech: {
      onStart: ['Revving the engines on the neon grid. Let us ride.'],
      onUserBlunder: ['TURBO OVERTAKE! Scooped on the turn!', 'Left in the digital dust!'],
      onUserGreat: ['Whoa, sick drift! That move was glowing!'],
      onBotCheck: ['HEADLIGHTS ON! Check!'],
      onBotWin: ['Crossed the checkered line first! Synthwave GG!'],
      onBotLoss: ['Engine sputtered out... beautiful driving by you!'],
    },
  },
  {
    id: 'luna_shadow_1300',
    name: 'Luna Shadow',
    elo: 1300,
    avatar: '🌙',
    title: 'Nocturnal Striker',
    tier: 'hero',
    description: 'Deadly knight outposts and subtle backward pawn targeting.',
    depth: 2,
    randomness: 0.08,
    speech: {
      onStart: ['The moon rises. Shadows see every weakness on the 64 squares.'],
      onUserBlunder: ['The darkness claims what was left in the open.', 'A fateful slip under the moonlight.'],
      onUserGreat: ['Blinding light! My shadows are scattered!'],
      onBotCheck: ['Eclipse! King in the shadow zone!'],
      onBotWin: ['Nightfall reigns supreme!'],
      onBotLoss: ['Dawn breaks... your clarity was unmatched!'],
    },
  },
  {
    id: 'cyborg_crush_1350',
    name: 'Unit 7-Alpha',
    elo: 1350,
    avatar: '🦾',
    title: 'Tactical Android',
    tier: 'hero',
    description: 'Calculates 3-move forcing sequences and exploits weak f2/f7 squares.',
    depth: 2,
    randomness: 0.065,
    speech: {
      onStart: ['Subroutines loaded. Tactical precision at 98.4%.'],
      onUserBlunder: ['Inefficiency detected. Material confiscated.', 'Suboptimal vector. Assimilated.'],
      onUserGreat: ['Warning: Human intuition exceeding calculated baseline!'],
      onBotCheck: ['Check sub-routine executed.'],
      onBotWin: ['Algorithm confirmed victory status.'],
      onBotLoss: ['Logic exception thrown! Human superiority verified!'],
    },
  },
  {
    id: 'valkyrie_vara_1400',
    name: 'Vara Valkyrie',
    elo: 1400,
    avatar: '🦅',
    title: 'Sky Ascendant',
    tier: 'hero',
    description: 'Dominates the skies with coordinated queen and bishop batteries.',
    depth: 2,
    randomness: 0.05,
    speech: {
      onStart: ['Soaring above the board! The bird-eye view misses nothing.'],
      onUserBlunder: ['Swooped down from high altitude! Mine now!', 'Ground defenses failed!'],
      onUserGreat: ['A tempest strike! You forced my wings back!'],
      onBotCheck: ['Diving attack! Check!'],
      onBotWin: ['Victory takes flight! Skol!'],
      onBotLoss: ['Grounded gracefully... honor to your brilliant play!'],
    },
  },
  {
    id: 'sir_hector_1450',
    name: 'Sir Hector',
    elo: 1450,
    avatar: '🏰',
    title: 'Knight Commander',
    tier: 'hero',
    description: 'Commands central outposts with unwavering knight and rook synergy.',
    depth: 2,
    randomness: 0.04,
    speech: {
      onStart: ['Lower the drawbridge! A noble duel between minds begins.'],
      onUserBlunder: ['A breach in your ramparts, sir! Claimed!', 'Your flank has fallen!'],
      onUserGreat: ['By the crown! A counter-stroke worthy of legend!'],
      onBotCheck: ['Stand and deliver! Royal check!'],
      onBotWin: ['The fortress stands triumphant today!'],
      onBotLoss: ['I yield the keep! You have proven royal mastery!'],
    },
  },
  {
    id: 'alchemist_aurora_1500',
    name: 'Aurora the Sage',
    elo: 1500,
    avatar: '🔮',
    title: 'Potion Master',
    tier: 'hero',
    description: 'Transmutes small positional advantages into crushing endgames.',
    depth: 3,
    randomness: 0.035,
    speech: {
      onStart: ['Stirring the cauldron of tactics and positional harmony.'],
      onUserBlunder: ['A volatile reagent misplaced! Transmuted to my side!', 'The potion detonates in my favor!'],
      onUserGreat: ['Pure gold! That formula was exquisite!'],
      onBotCheck: ['Crystal blast! Check!'],
      onBotWin: ['Magical mastery achieved!'],
      onBotLoss: ['The crystal ball shattered! Superb game!'],
    },
  },
  {
    id: 'phoenix_flare_1550',
    name: 'Phoenix Blaze',
    elo: 1550,
    avatar: '🔥',
    title: 'Flame Strategist',
    tier: 'hero',
    description: 'Sacrifices pawns for devastating open king attacks.',
    depth: 3,
    randomness: 0.03,
    speech: {
      onStart: ['Igniting the board! Let us see if you can take the heat.'],
      onUserBlunder: ['CONSUMED BY FLAME! A costly miscalculation!', 'Burned your bridges on that square!'],
      onUserGreat: ['You quenched the inferno! Incredible composure!'],
      onBotCheck: ['Firestorm check! King is scorching!'],
      onBotWin: ['Ashes to ashes! Blaze takes the match!'],
      onBotLoss: ['From the embers, I salute you! What a fiery duel!'],
    },
  },

  // ─── TIER 4: GRAND TITANS (1600 - 2000) ────────────────────────────────────
  {
    id: 'magnus_bot_1600',
    name: 'Magnus-X',
    elo: 1600,
    avatar: '👑',
    title: 'Endgame Wizard',
    tier: 'titan',
    description: 'Turns equal endgames into suffocating wins with relentless micro-improvements.',
    depth: 3,
    randomness: 0.025,
    speech: {
      onStart: ['Endgame technique is an art. Let us play some real chess.'],
      onUserBlunder: ['At 1600 Elo, that piece is gone. No second chances.', 'Pawn structure compromised.'],
      onUserGreat: ['Very smooth. You actually found the engine move.'],
      onBotCheck: ['Check. Your king space is shrinking.'],
      onBotWin: ['Squeezed out the win. Good effort.'],
      onBotLoss: ['Impressive play! You squeezed water from stone!'],
    },
  },
  {
    id: 'tal_spirit_1650',
    name: 'Misha Flame',
    elo: 1650,
    avatar: '🎭',
    title: 'Romantic Attacker',
    tier: 'titan',
    description: 'Wild piece sacrifices for kingside initiative and double bishop pins.',
    depth: 3,
    randomness: 0.022,
    speech: {
      onStart: ['You must take your opponent into a deep, dark forest.'],
      onUserBlunder: ['The forest swallows the mistake! Sacrifices rewarded!', 'Chaos belongs to me!'],
      onUserGreat: ['Bravo! You kept cold blood in the whirlwind!'],
      onBotCheck: ['The drama intensifies! Check!'],
      onBotWin: ['A romantic masterpiece on the board!'],
      onBotLoss: ['You tamed the dragon! Remarkable defense!'],
    },
  },
  {
    id: 'deep_cortex_1700',
    name: 'Cortex-9',
    elo: 1700,
    avatar: '🧠',
    title: 'Neural Mastermind',
    tier: 'titan',
    description: 'Deep prophylactic thinking, preventing your plans before you realize them.',
    depth: 3,
    randomness: 0.02,
    speech: {
      onStart: ['Neural pathways synchronized. Calculating your move tendencies.'],
      onUserBlunder: ['Anticipated and punished. Probability of recovery < 4%.', 'A fundamental flaw in your plan.'],
      onUserGreat: ['Unexpected branch detected. Deep tactical accuracy!'],
      onBotCheck: ['Vector alignment: Check.'],
      onBotWin: ['Optimization complete. Victory confirmed.'],
      onBotLoss: ['Deep respect. Your calculation surpassed my network!'],
    },
  },
  {
    id: 'iron_ironov_1750',
    name: 'Grandmaster Boris',
    elo: 1750,
    avatar: '🎖️',
    title: 'Soviet Academy Vet',
    tier: 'titan',
    description: 'Granite pawn chains and relentless squeezing of open files.',
    depth: 3,
    randomness: 0.018,
    speech: {
      onStart: ['Dozens of tournaments behind me. Show me your preparation.'],
      onUserBlunder: ['Classic oversight. A grandmaster does not forgive this.', 'The file is opened, you are punished.'],
      onUserGreat: ['Soviet school of chess would applaud that move!'],
      onBotCheck: ['Shakh! Defend your king!'],
      onBotWin: ['Discipline always wins in the end. Good game.'],
      onBotLoss: ['Outstanding masterclass! I salute your deep understanding!'],
    },
  },
  {
    id: 'storm_zephyr_1800',
    name: 'Zephyr the Tempest',
    elo: 1800,
    avatar: '⚡',
    title: 'Storm Lord',
    tier: 'titan',
    description: 'Lightning-fast piece mobilization and unrelenting tactical aggression.',
    depth: 3,
    randomness: 0.015,
    speech: {
      onStart: ['The storm gathers above the 64 squares. Brace yourself.'],
      onUserBlunder: ['LIGHTNING STRIKE! The blunder is pulverized!', 'Swept away by the hurricane!'],
      onUserGreat: ['You stood firm against the gale! Staggering precision!'],
      onBotCheck: ['THUNDERCLAP! Check!'],
      onBotWin: ['The storm has claimed the board!'],
      onBotLoss: ['The calm after the storm... you conquered the gale!'],
    },
  },
  {
    id: 'chronos_time_1850',
    name: 'Chronos',
    elo: 1850,
    avatar: '⏳',
    title: 'Time Weaver',
    tier: 'titan',
    description: 'Exploits tempo advantages to squeeze the player out of candidate moves.',
    depth: 3,
    randomness: 0.012,
    speech: {
      onStart: ['Every tempo is life. Waste not a single tick of the clock.'],
      onUserBlunder: ['You wasted precious time! The sands run out for that piece!', 'Tempo stolen, position collapsed.'],
      onUserGreat: ['A move outside of time! Brilliant clock management!'],
      onBotCheck: ['Time freezes! Royal check!'],
      onBotWin: ['Your time on the board has expired. Victory for Chronos.'],
      onBotLoss: ['You rewrote destiny! Astounding mastery!'],
    },
  },
  {
    id: 'quantum_nova_1900',
    name: 'Quantum Nova',
    elo: 1900,
    avatar: '🌌',
    title: 'Cosmic Entangler',
    tier: 'titan',
    description: 'Multi-threaded tactical threats that appear across opposite flanks.',
    depth: 3,
    randomness: 0.009,
    speech: {
      onStart: ['Superposition engaged. Every square contains infinite outcomes.'],
      onUserBlunder: ['Wave function collapsed: your material is erased.', 'A singularity in your defense!'],
      onUserGreat: ['Astounding! You collapsed my best continuation!'],
      onBotCheck: ['Event horizon! Check!'],
      onBotWin: ['Cosmic order restored. Supernova victory!'],
      onBotLoss: ['You pierced through the cosmos! Magnificent game!'],
    },
  },
  {
    id: 'valhalla_king_1950',
    name: 'Jarl Ragnar',
    elo: 1950,
    avatar: '👑',
    title: 'Berserker King',
    tier: 'titan',
    description: 'Unyielding offensive powerhouse that crushes through closed pawn positions.',
    depth: 3,
    randomness: 0.006,
    speech: {
      onStart: ['Only the bold survive in my arena. Strike first or be struck.'],
      onUserBlunder: ['CRUSHED UNDER THE WAR AXE! No mercy on 1950 Elo!', 'Your shields have shattered!'],
      onUserGreat: ['By the thunder gods! A strike worthy of high praise!'],
      onBotCheck: ['ROYAL SIEGE! Check to the king!'],
      onBotWin: ['The kingdom bows to Ragnar! Skol!'],
      onBotLoss: ['A true legend stands before me! Songs will be sung of your play!'],
    },
  },
  {
    id: 'titan_rex_2000',
    name: 'Grand Titan Rex',
    elo: 2000,
    avatar: '🤖',
    title: 'Arena Apex Emperor',
    tier: 'titan',
    description: 'The ultimate boss of the 33-bot arena. Ruthless Stockfish-assisted tactical refutations.',
    depth: 3,
    randomness: 0.002,
    speech: {
      onStart: ['Welcome to the summit. 2000 Elo awaits. Play your absolute best.'],
      onUserBlunder: ['FATAL ERROR. That blunder is refuted instantly.', 'Tactical refutation delivered with zero mercy.'],
      onUserGreat: ['Remarkable. You found the single engine-validated continuation.'],
      onBotCheck: ['APEX CHECK. King has no sanctuary.'],
      onBotWin: ['The Apex Emperor remains undefeated. Well played, challenger.'],
      onBotLoss: ['INCONCEIVABLE! You have dethroned the Grand Titan Rex! True chess genius!'],
    },
  },
];

if (typeof window !== 'undefined') {
  if (typeof Chessboard !== 'undefined') window.Chessboard = Chessboard;
  if (typeof BotArena !== 'undefined') window.BotArena = BotArena;
  if (typeof ReviewDashboard !== 'undefined') window.ReviewDashboard = ReviewDashboard;
  if (typeof ImportModal !== 'undefined') window.ImportModal = ImportModal;
  if (typeof StockfishPool !== 'undefined') window.StockfishPool = StockfishPool;
  if (typeof BackgroundAnalysisQueue !== 'undefined') window.BackgroundAnalysisQueue = BackgroundAnalysisQueue;
  if (typeof SoundService !== 'undefined') window.SoundService = SoundService;
}
