(function() {
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

/* --- src/components/pieceSvgs.js --- */
/**
 * Embedded SVG Data URLs for Tournament Vector Pieces.
 * Ensures 100% offline availability and zero 404 errors on GitHub Pages subpaths.
 */
const INLINE_PIECE_DATA_URLS = {
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

const COMIC_DICTIONARY = {
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

/* --- src/services/sound.js --- */
class SoundService {
  constructor() {
    this.ctx = null;
    this.isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('chess_iq_muted') === 'true' : false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('chess_iq_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    try {
      localStorage.setItem('chess_iq_muted', String(this.isMuted));
    } catch {}
  }

  getContext() {
    if (typeof window === 'undefined' || this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playMove() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      if (osc.frequency?.setValueAtTime) {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
      }

      if (gain.gain?.setValueAtTime) {
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);

      this.triggerHaptic('light');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playCapture() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      if (osc1.frequency?.setValueAtTime) {
        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      }
      if (gain1.gain?.setValueAtTime) {
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      }
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      if (osc2.frequency?.setValueAtTime) {
        osc2.frequency.setValueAtTime(420, now + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      }
      if (gain2.gain?.setValueAtTime) {
        gain2.gain.setValueAtTime(0.2, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      }
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.02);
      osc2.stop(now + 0.13);

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playCheck() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (osc.frequency?.setValueAtTime) {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
      }

      if (gain.gain?.setValueAtTime) {
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playBlunder() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      [164.81, 155.56, 110.0].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, now + i * 0.03);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.35);
        }

        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.2, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + 0.42);
      });

      this.triggerHaptic('heavy');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playBrilliant() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, noteTime);
        }

        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.18, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.36);
      });

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      [440, 554.37, 659.25].forEach((freq, i) => {
        const noteTime = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, noteTime);
        }
        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.2, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.26);
      });
      this.triggerHaptic('light');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  triggerHaptic(type) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(12);
        else if (type === 'medium') navigator.vibrate(35);
        else if (type === 'heavy') navigator.vibrate([60, 30, 80]);
      } catch {
        // Ignore vibration errors if blocked by browser
      }
    }
  }
}

const soundService = new SoundService();

/* --- src/services/ecoDictionary.js --- */
const ECO_DATABASE = [
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
const TIER_CONFIG = {
  rookie: {
    name: 'Rookies',
    range: '400 - 750 Elo',
    color: '#0284c7', // Sky Blue
    bg: '#f0f9ff',
    border: '#bae6fd',
    icon: '🌱',
  },
  challenger: {
    name: 'Challengers',
    range: '800 - 1150 Elo',
    color: '#16a34a', // Hero Green
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: '⚡',
  },
  hero: {
    name: 'Heroes',
    range: '1200 - 1550 Elo',
    color: '#ea580c', // Comic Orange
    bg: '#fff7ed',
    border: '#fed7aa',
    icon: '🦸',
  },
  titan: {
    name: 'Grand Titans',
    range: '1600 - 2000 Elo',
    color: '#9333ea', // Cosmic Purple
    bg: '#faf5ff',
    border: '#e9d5ff',
    icon: '👑',
  },
};

const BOTS_33 = [
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

/* --- src/services/stockfishWorker.js --- */
class StockfishWorkerService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.isAvailable = true;
    this.queue = [];
    this.isProcessing = false;
    this.pendingResolve = null;
    this.currentBestMove = "";
    this.currentScoreCp = 0;
    this.currentMate = null;
    this.currentPv = [];
    this.currentDepth = 0;
    this.secondBestCp = void 0;
    this.evaluationTimeoutId = null;
    this.initWorker();
  }
  initWorker() {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      this.isAvailable = false;
      return;
    }
    try {
      const base = (typeof window !== "undefined" && window.__BASE_URL__) || "./";
      const workerUrl = `${base.endsWith("/") ? base : `${base}/`}stockfish.js`;
      this.worker = new Worker(workerUrl);
      this.worker.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      this.worker.onerror = () => {
        this.isAvailable = false;
        this.drainQueue();
      };
      this.worker.postMessage("uci");
    } catch {
      this.isAvailable = false;
    }
  }
  drainQueue() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item && item.resolve) item.resolve(null);
    }
    this.isProcessing = false;
  }
  handleMessage(line) {
    if (typeof line !== "string") return;
    if (line === "uciok") {
      this.isInitialized = true;
      if (this.worker) {
        this.worker.postMessage("isready");
      }
      return;
    }
    if (line.startsWith("info depth")) {
      const depthMatch = line.match(/depth\s+(\d+)/);
      if (depthMatch) {
        this.currentDepth = parseInt(depthMatch[1], 10);
      }
      const multiPvMatch = line.match(/multipv\s+(\d+)/);
      const isMultiPv2 = multiPvMatch && multiPvMatch[1] === "2";
      const scoreCpMatch = line.match(/score\s+cp\s+(-?\d+)/);
      if (scoreCpMatch) {
        const cp = parseInt(scoreCpMatch[1], 10);
        if (isMultiPv2) {
          this.secondBestCp = cp;
        } else {
          this.currentScoreCp = cp;
          this.currentMate = null;
        }
      }
      const scoreMateMatch = line.match(/score\s+mate\s+(-?\d+)/);
      if (scoreMateMatch) {
        const m = parseInt(scoreMateMatch[1], 10);
        if (!isMultiPv2) {
          this.currentMate = m;
          this.currentScoreCp = m > 0 ? 3e3 : -3e3;
        }
      }
      const pvMatch = line.match(/pv\s+(.+)$/);
      if (pvMatch && !isMultiPv2) {
        this.currentPv = pvMatch[1].trim().split(/\s+/);
        if (this.currentPv.length > 0) {
          this.currentBestMove = this.currentPv[0];
        }
      }
    }
    if (line.startsWith("bestmove")) {
      if (this.evaluationTimeoutId) {
        clearTimeout(this.evaluationTimeoutId);
        this.evaluationTimeoutId = null;
      }
      const parts = line.split(/\s+/);
      const bestMove = parts[1] && parts[1] !== "(none)" ? parts[1] : this.currentBestMove;
      const result = {
        bestMoveUci: bestMove,
        scoreCp: this.currentScoreCp,
        mate: this.currentMate,
        pv: this.currentPv.length > 0 ? this.currentPv : [bestMove],
        depth: this.currentDepth,
        multiPv2ScoreCp: this.secondBestCp
      };
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      this.isProcessing = false;
      if (resolve) resolve(result);
      this.processQueue();
    }
  }
  processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !this.worker || !this.isAvailable) {
      return;
    }
    const item = this.queue.shift();
    if (!item) return;

    this.isProcessing = true;
    this.currentBestMove = "";
    this.currentScoreCp = 0;
    this.currentMate = null;
    this.currentPv = [];
    this.currentDepth = 0;
    this.secondBestCp = void 0;
    this.pendingResolve = item.resolve;

    this.evaluationTimeoutId = setTimeout(() => {
      if (this.pendingResolve) {
        try {
          this.worker.postMessage("stop");
        } catch {}
      }
    }, item.maxWaitMs || 1200);

    try {
      this.worker.postMessage(`position fen ${item.fen}`);
      this.worker.postMessage(`go depth ${item.depth}`);
    } catch {
      if (this.evaluationTimeoutId) clearTimeout(this.evaluationTimeoutId);
      this.isProcessing = false;
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      if (resolve) resolve(null);
      this.processQueue();
    }
  }
  evaluate(fen, depth = 14, maxWaitMs = 1000) {
    if (!this.isAvailable || !this.worker) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      this.queue.push({ fen, depth, maxWaitMs, resolve });
      this.processQueue();
    });
  }
  isEngineReady() {
    return this.isAvailable && this.isInitialized;
  }
}
const stockfishService = new StockfishWorkerService();

/* --- src/services/engineEvaluationTables.js --- */
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 2e4
};

const PST_MG_PAWN = [
  0, 0, 0, 0, 0, 0, 0, 0,
  98, 134, 61, 95, 68, 126, 34, -11,
  -6, 7, 26, 31, 65, 56, 25, -20,
  -14, 13, 6, 21, 23, 12, 17, -23,
  -27, -2, -5, 12, 17, 6, 10, -25,
  -26, -4, -4, -10, 3, 3, 33, -12,
  -35, -1, -20, -23, -15, 24, 38, -22,
  0, 0, 0, 0, 0, 0, 0, 0
];

const PST_MG_KNIGHT = [
  -167, -89, -34, -49, 61, -97, -15, -107,
  -73, -41, 72, 36, 23, 62, 7, -17,
  -47, 60, 37, 65, 84, 129, 73, 44,
  -9, 17, 19, 53, 37, 69, 18, 22,
  -13, 4, 16, 13, 28, 19, 21, -8,
  -23, -9, 12, 10, 19, 17, 25, -16,
  -29, -53, -12, -3, -1, 18, -14, -19,
  -105, -21, -58, -33, -17, -28, -19, -23
];

const PST_MG_BISHOP = [
  -29, 4, -82, -37, -25, -42, 7, -8,
  -26, 16, -18, -13, 30, 59, 18, -47,
  -16, 37, 43, 40, 35, 50, 37, -2,
  -4, 5, 19, 50, 37, 37, 7, -2,
  -6, 13, 13, 26, 34, 12, 10, 4,
  0, 15, 15, 15, 14, 27, 18, 10,
  4, 15, 16, 0, 7, 21, 33, 1,
  -33, -3, -14, -21, -13, -12, -39, -21
];

const PST_MG_ROOK = [
  32, 42, 32, 51, 63, 9, 31, 43,
  27, 32, 58, 62, 80, 67, 26, 44,
  -5, 19, 26, 36, 17, 45, 61, 16,
  -24, -11, 7, 26, 24, 35, -8, -20,
  -36, -26, -12, -1, 9, -7, 6, -23,
  -45, -25, -16, -17, 3, 0, -5, -33,
  -44, -16, -20, -9, -1, 11, -6, -71,
  -19, -13, 1, 17, 16, 7, -37, -26
];

const PST_MG_QUEEN = [
  -28, 0, 29, 12, 59, 44, 43, 45,
  -24, -39, -5, 1, -16, 57, 28, 54,
  -18, -15, -7, 14, 4, 45, 13, 28,
  -15, -5, -4, 8, 18, 34, 36, 19,
  -7, 6, 10, 15, 24, 19, 16, -2,
  -9, -7, 8, -8, -2, 2, -8, -10,
  -14, -13, -11, -10, -9, -9, -4, -18,
  -18, -9, 7, -3, 3, -18, -15, -22
];

const PST_MG_KING = [
  -65, 23, 16, -15, -56, -34, 2, 13,
  29, -1, -20, -7, -8, -4, -38, -29,
  -9, 24, 2, -16, -20, 6, 22, -22,
  -17, -20, -12, -27, -30, -25, -14, -36,
  -49, -1, -27, -39, -46, -44, -33, -51,
  -14, -14, -22, -46, -44, -30, -15, -27,
  1, 7, -8, -64, -43, -16, 9, 8,
  -15, 36, 12, -54, 8, -28, 24, 14
];

/* --- src/services/engine.js --- */
const FEN_EVAL_CACHE = /* @__PURE__ */ new Map();
function cpToWinProb(cp, mate) {
  if (mate !== void 0 && mate !== null) {
    if (mate > 0) return 1;
    if (mate < 0) return 0;
    return 0.5;
  }
  return 1 / (1 + Math.pow(10, -cp / 400));
}
function calculateMoveAccuracy(winProbLoss) {
  const acc = 103.1668 * Math.exp(-4.354 * winProbLoss) - 3.1669;
  return Math.min(100, Math.max(0, Math.round(acc * 10) / 10));
}
function countTotalPieces(chess) {
  let count = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]) count++;
    }
  }
  return count;
}
function countMajorMinorPieces(chess) {
  const board = chess.board();
  let total = 0;
  let whiteBackRank = 0;
  let blackBackRank = 0;
  let whiteQueens = 0;
  let blackQueens = 0;
  let whiteRooks = 0;
  let blackRooks = 0;
  let whiteMinors = 0;
  let blackMinors = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.type !== "p" && p.type !== "k") {
        total++;
        if (p.color === "w") {
          if (p.type === "q") whiteQueens++;
          if (p.type === "r") whiteRooks++;
          if (p.type === "b" || p.type === "n") whiteMinors++;
          if (r === 7) whiteBackRank++;
        } else {
          if (p.type === "q") blackQueens++;
          if (p.type === "r") blackRooks++;
          if (p.type === "b" || p.type === "n") blackMinors++;
          if (r === 0) blackBackRank++;
        }
      }
    }
  }
  return { total, whiteBackRank, blackBackRank, whiteQueens, blackQueens, whiteRooks, blackRooks, whiteMinors, blackMinors };
}
function detectPhase(ply, chess, moveSans, middlegameStartPly, endgameStartPly) {
  if (endgameStartPly !== null && ply >= endgameStartPly) {
    return { phase: "endgame", newMiddlegameStart: middlegameStartPly, newEndgameStart: endgameStartPly };
  }
  const mm = countMajorMinorPieces(chess);
  const isEndgame = mm.total <= 6 || mm.whiteQueens === 0 && mm.blackQueens === 0 && mm.whiteRooks <= 1 && mm.blackRooks <= 1 && mm.whiteMinors <= 1 && mm.blackMinors <= 1;
  if (isEndgame) {
    return {
      phase: "endgame",
      newMiddlegameStart: middlegameStartPly ?? ply,
      newEndgameStart: endgameStartPly ?? ply
    };
  }
  if (middlegameStartPly !== null && ply >= middlegameStartPly) {
    return { phase: "middlegame", newMiddlegameStart: middlegameStartPly, newEndgameStart: null };
  }
  const inBook = isBookMove(moveSans, ply - 1);
  const fullMoves = Math.floor((ply - 1) / 2) + 1;
  const isMiddlegame = !inBook && fullMoves > 10 || mm.total < 10 || mm.whiteBackRank + mm.blackBackRank < 4;
  if (isMiddlegame) {
    return { phase: "middlegame", newMiddlegameStart: ply, newEndgameStart: null };
  }
  return { phase: "opening", newMiddlegameStart: null, newEndgameStart: null };
}
function isChessGameOver(c) {
  return typeof c.isGameOver === 'function' ? c.isGameOver() : (typeof c.game_over === 'function' ? c.game_over() : false);
}
function isChessCheckmate(c) {
  return typeof c.isCheckmate === 'function' ? c.isCheckmate() : (typeof c.in_checkmate === 'function' ? c.in_checkmate() : false);
}
function isChessInCheck(c) {
  return typeof c.inCheck === 'function' ? c.inCheck() : (typeof c.in_check === 'function' ? c.in_check() : false);
}

function evaluatePositionLocally(fen) {
  const chess = new Chess(fen);
  if (isChessGameOver(chess)) {
    if (isChessCheckmate(chess)) {
      return { cp: 0, mate: chess.turn() === "w" ? -1 : 1 };
    }
    return { cp: 0, mate: null };
  }
  let material = 0;
  let positional = 0;
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const baseVal = PIECE_VALUES[piece.type];
      const squareIdx = r * 8 + c;
      const flippedIdx = (7 - r) * 8 + c;
      let pstVal = 0;
      switch (piece.type) {
        case "p":
          pstVal = piece.color === "w" ? PST_MG_PAWN[squareIdx] : PST_MG_PAWN[flippedIdx];
          break;
        case "n":
          pstVal = piece.color === "w" ? PST_MG_KNIGHT[squareIdx] : PST_MG_KNIGHT[flippedIdx];
          break;
        case "b":
          pstVal = piece.color === "w" ? PST_MG_BISHOP[squareIdx] : PST_MG_BISHOP[flippedIdx];
          break;
        case "r":
          pstVal = piece.color === "w" ? PST_MG_ROOK[squareIdx] : PST_MG_ROOK[flippedIdx];
          break;
        case "q":
          pstVal = piece.color === "w" ? PST_MG_QUEEN[squareIdx] : PST_MG_QUEEN[flippedIdx];
          break;
        case "k":
          pstVal = piece.color === "w" ? PST_MG_KING[squareIdx] : PST_MG_KING[flippedIdx];
          break;
      }
      if (piece.color === "w") {
        material += baseVal;
        positional += pstVal;
      } else {
        material -= baseVal;
        positional -= pstVal;
      }
    }
  }
  const currentTurn = chess.turn();
  const mobility = (currentTurn === "w" ? 1 : -1) * (chess.moves().length * 2.5);
  return { cp: material + positional + Math.round(mobility), mate: null };
}
function scoreMoveForOrdering(move) {
  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured] || 100;
    const attackerVal = PIECE_VALUES[move.piece] || 100;
    return 1e4 + victimVal * 10 - attackerVal;
  }
  if (move.promotion) {
    return 9e3;
  }
  if (move.san.includes("+")) {
    return 5e3;
  }
  return 0;
}
function quiescence(chess, alpha, beta, qDepth = 0) {
  const standPat = evaluatePositionLocally(chess.fen()).cp;
  const isWhite = chess.turn() === "w";
  if (qDepth >= 4) return standPat;
  if (isWhite) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }
  const captures = chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion || m.san.includes("+"));
  captures.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  for (const cap of captures) {
    chess.move(cap);
    const score = quiescence(chess, alpha, beta, qDepth + 1);
    chess.undo();
    if (isWhite) {
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    } else {
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
  }
  return isWhite ? alpha : beta;
}
function alphaBeta(chess, depth, alpha, beta, pvArray) {
  if (depth === 0 || isChessGameOver(chess)) {
    return quiescence(chess, alpha, beta);
  }
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    if (isChessCheckmate(chess)) {
      return chess.turn() === "w" ? -3e4 : 3e4;
    }
    return 0;
  }
  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  const isWhite = chess.turn() === "w";
  let bestScore = isWhite ? -Infinity : Infinity;
  let childPv = [];
  for (const move of moves) {
    chess.move(move);
    const localChildPv = [];
    const score = alphaBeta(chess, depth - 1, alpha, beta, localChildPv);
    chess.undo();
    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        const uci = `${move.from}${move.to}${move.promotion || ""}`;
        pvArray.length = 0;
        pvArray.push(uci, ...localChildPv);
      }
      if (bestScore > alpha) alpha = bestScore;
      if (beta <= alpha) break;
    } else {
      if (score < bestScore) {
        bestScore = score;
        const uci = `${move.from}${move.to}${move.promotion || ""}`;
        pvArray.length = 0;
        pvArray.push(uci, ...localChildPv);
      }
      if (bestScore < beta) beta = bestScore;
      if (beta <= alpha) break;
    }
  }
  return bestScore;
}
function findBestMoveLocal(fen, depth = 3) {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    return { bestMoveUci: "", bestMoveSan: "", secondBestMoveUci: "", secondBestMoveSan: "", evalCp: 0, pv: [] };
  }
  moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  const isWhite = chess.turn() === "w";
  let bestScore = isWhite ? -Infinity : Infinity;
  let secondBestScore = isWhite ? -Infinity : Infinity;
  let bestMove = moves[0];
  let secondBestMove = moves.length > 1 ? moves[1] : null;
  let finalPv = [];
  let alpha = -Infinity;
  let beta = Infinity;
  for (const move of moves) {
    chess.move(move);
    const childPv = [];
    const score = alphaBeta(chess, depth - 1, alpha, beta, childPv);
    chess.undo();
    const moveUci = `${move.from}${move.to}${move.promotion || ""}`;
    if (isWhite) {
      if (score > bestScore) {
        secondBestScore = bestScore;
        secondBestMove = bestMove;
        bestScore = score;
        bestMove = move;
        finalPv = [moveUci, ...childPv];
        alpha = Math.max(alpha, bestScore);
      } else if (score > secondBestScore) {
        secondBestScore = score;
        secondBestMove = move;
      }
    } else {
      if (score < bestScore) {
        secondBestScore = bestScore;
        secondBestMove = bestMove;
        bestScore = score;
        bestMove = move;
        finalPv = [moveUci, ...childPv];
        beta = Math.min(beta, bestScore);
      } else if (score < secondBestScore) {
        secondBestScore = score;
        secondBestMove = move;
      }
    }
  }

  const bestMoveUci = `${bestMove.from}${bestMove.to}${bestMove.promotion || ""}`;
  let secondBestMoveUci = "";
  let secondBestMoveSan = "";
  if (secondBestMove && (secondBestMove.from !== bestMove.from || secondBestMove.to !== bestMove.to)) {
    secondBestMoveUci = `${secondBestMove.from}${secondBestMove.to}${secondBestMove.promotion || ""}`;
    secondBestMoveSan = secondBestMove.san || "";
  } else if (moves.length > 1) {
    const fallbackMove = moves.find((m) => m.from !== bestMove.from || m.to !== bestMove.to);
    if (fallbackMove) {
      secondBestMoveUci = `${fallbackMove.from}${fallbackMove.to}${fallbackMove.promotion || ""}`;
      secondBestMoveSan = fallbackMove.san || "";
    }
  }

  return {
    bestMoveUci,
    bestMoveSan: bestMove.san,
    secondBestMoveUci,
    secondBestMoveSan,
    evalCp: bestScore,
    multiPv2Cp: secondBestScore !== (isWhite ? -Infinity : Infinity) ? secondBestScore : void 0,
    pv: finalPv.length > 0 ? finalPv : [bestMoveUci]
  };
}
async function fetchLichessCloudEval(fen) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e3);
    const encodedFen = encodeURIComponent(fen);
    const res = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodedFen}&multiPv=2`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.pvs && data.pvs.length > 0) {
        const top = data.pvs[0];
        const second = data.pvs[1];
        const pvStr = top.moves ? top.moves.split(" ") : [];
        return {
          scoreCp: top.cp ?? (top.mate ? top.mate > 0 ? 3e3 : -3e3 : 0),
          mate: top.mate ?? null,
          pv: pvStr,
          multiPv2ScoreCp: second ? second.cp ?? void 0 : void 0,
          source: "cloud"
        };
      }
    }
  } catch {
  }
  return null;
}
async function fetchSyzygyTablebase(fen) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const encodedFen = encodeURIComponent(fen);
    const res = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodedFen}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.category) {
        let cp = 0;
        let mate = null;
        if (data.category === "win") {
          cp = 3e3;
          mate = data.dtm ? Math.ceil(Math.abs(data.dtm) / 2) : 10;
        } else if (data.category === "loss") {
          cp = -3e3;
          mate = data.dtm ? -Math.ceil(Math.abs(data.dtm) / 2) : -10;
        }
        const topMove = data.moves && data.moves[0] ? data.moves[0].uci : "";
        return {
          scoreCp: cp,
          mate,
          pv: topMove ? [topMove] : [],
          source: "tablebase"
        };
      }
    }
  } catch {
  }
  return null;
}
function normalizeFenKey(fen) {
  if (!fen) return "";
  const parts = fen.trim().split(/\s+/);
  return parts.slice(0, 4).join(" ");
}

async function evaluateFenHybrid(fen, isDeep = false) {
  const cacheKey = `${normalizeFenKey(fen)}_${isDeep ? "deep" : "fast"}`;
  const cached = FEN_EVAL_CACHE.get(cacheKey);
  if (cached) return cached;

  if (!isDeep) {
    const localSearch = findBestMoveLocal(fen, 1);
    const localResult = {
      scoreCp: localSearch.evalCp,
      mate: null,
      pv: localSearch.pv,
      bestMoveUci: localSearch.bestMoveUci,
      secondBestMoveUci: localSearch.secondBestMoveUci,
      multiPv2ScoreCp: localSearch.multiPv2Cp,
      source: "local"
    };
    FEN_EVAL_CACHE.set(cacheKey, localResult);
    return localResult;
  }

  const chess = new Chess(fen);
  const totalPieces = countTotalPieces(chess);
  if (totalPieces <= 7) {
    const tablebase = await fetchSyzygyTablebase(fen);
    if (tablebase) {
      if (!tablebase.bestMoveUci && tablebase.pv && tablebase.pv[0]) {
        tablebase.bestMoveUci = tablebase.pv[0];
      }
      if (!tablebase.secondBestMoveUci) {
        const fallback = findBestMoveLocal(fen, 1);
        tablebase.secondBestMoveUci = fallback.secondBestMoveUci;
      }
      FEN_EVAL_CACHE.set(cacheKey, tablebase);
      return tablebase;
    }
  }

  const targetDepth = 14;
  const sfEval = await stockfishService.evaluate(fen, targetDepth, 800);
  if (sfEval && sfEval.bestMoveUci) {
    const fallback = findBestMoveLocal(fen, 1);
    const sfResult = {
      scoreCp: sfEval.scoreCp,
      mate: sfEval.mate,
      pv: sfEval.pv,
      bestMoveUci: sfEval.bestMoveUci,
      secondBestMoveUci: fallback.secondBestMoveUci,
      multiPv2ScoreCp: sfEval.multiPv2ScoreCp,
      source: "stockfish"
    };
    FEN_EVAL_CACHE.set(cacheKey, sfResult);
    return sfResult;
  }

  const localSearch = findBestMoveLocal(fen, 3);
  const localResult = {
    scoreCp: localSearch.evalCp,
    mate: null,
    pv: localSearch.pv,
    bestMoveUci: localSearch.bestMoveUci,
    secondBestMoveUci: localSearch.secondBestMoveUci,
    multiPv2ScoreCp: localSearch.multiPv2Cp,
    source: "local"
  };
  FEN_EVAL_CACHE.set(cacheKey, localResult);
  return localResult;
}

function isMaterialSacrifice(fenBefore, fenAfter, moverColor) {
  const cBefore = new Chess(fenBefore);
  const cAfter = new Chess(fenAfter);
  let moverValBefore = 0;
  let moverValAfter = 0;
  cBefore.board().flat().forEach((p) => {
    if (p && p.color === moverColor && p.type !== "k") {
      moverValBefore += PIECE_VALUES[p.type];
    }
  });
  cAfter.board().flat().forEach((p) => {
    if (p && p.color === moverColor && p.type !== "k") {
      moverValAfter += PIECE_VALUES[p.type];
    }
  });
  return moverValAfter <= moverValBefore - 200;
}
function classifyMove(playedUci, bestMoveUci, winProbBefore, winProbAfter, winProbLoss, isBook, multiPv1WinProb, multiPv2WinProb, fenBefore, fenAfter, moverColor) {
  if (isBook) return "book";
  const isExactBest = Boolean(bestMoveUci && playedUci && playedUci.toLowerCase() === bestMoveUci.toLowerCase());

  if (isExactBest) {
    if (winProbAfter >= 0.48 && winProbBefore < 0.9) {
      if (isMaterialSacrifice(fenBefore, fenAfter, moverColor)) {
        return "brilliant";
      }
    }
    if (multiPv2WinProb !== void 0 && multiPv1WinProb - multiPv2WinProb >= 0.15) {
      return "great";
    }
    return "best";
  }

  if (winProbBefore >= 0.75 && winProbAfter <= 0.55) {
    return "missed_win";
  }
  if (winProbLoss > 0.2) return "blunder";
  if (winProbLoss > 0.1) return "mistake";
  if (winProbLoss > 0.05) return "inaccuracy";
  if (winProbLoss <= 0.02) return "excellent";
  return "good";
}
function calculatePhaseElo(baseElo, acpl, movesCount, isOverall = false, result = "*", userColor = "w") {
  if (movesCount < 3) return null;
  const expectedAcpl = Math.max(18, 135 - baseElo * 0.05);
  const eloDelta = (expectedAcpl - acpl) * 4.5;
  const maxClamp = isOverall ? 320 : 220;
  const clampedDelta = Math.min(maxClamp, Math.max(-maxClamp, eloDelta));
  let resultBonus = 0;
  if (isOverall) {
    if (result === "1-0" && userColor === "w" || result === "0-1" && userColor === "b") {
      resultBonus = 25;
    } else if (result === "1/2-1/2") {
      resultBonus = 0;
    } else if (result !== "*") {
      resultBonus = -25;
    }
  }
  const estimated = Math.round(baseElo + clampedDelta + resultBonus);
  return Math.min(3000, Math.max(400, estimated));
}

/* --- src/services/engineRefutations.js --- */
async function detectThreat(fen) {
  try {
    const chess = new Chess(fen);
    if (isChessGameOver(chess)) return null;
    const parts = fen.split(" ");
    const opponentColor = parts[1] === "w" ? "b" : "w";
    parts[1] = opponentColor;
    parts[3] = "-";
    const invertedFen = parts.join(" ");
    const opponentChess = new Chess(invertedFen);
    const engineResult = await evaluateFenHybrid(invertedFen, false);
    if (engineResult.pv && engineResult.pv.length > 0) {
      const threatUci = engineResult.pv[0];
      const from = threatUci.slice(0, 2);
      const to = threatUci.slice(2, 4);
      const promotion = threatUci.length > 4 ? threatUci[4] : void 0;
      const move = opponentChess.move({ from, to, promotion });
      if (!move) return null;
      const pieceNameMap = {
        p: "Pawn",
        n: "Knight",
        b: "Bishop",
        r: "Rook",
        q: "Queen",
        k: "King"
      };
      if (isChessCheckmate(opponentChess)) {
        return {
          uci: threatUci,
          san: move.san,
          description: `Immediate Checkmate on ${move.to}!`
        };
      }
      if (move.captured) {
        const victimName = pieceNameMap[move.captured.toLowerCase()] || "Piece";
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens to capture ${victimName} on ${move.to}`
        };
      }
      if (isChessInCheck(opponentChess)) {
        const attackerName = pieceNameMap[move.piece.toLowerCase()] || "Piece";
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens forcing check with ${attackerName} on ${move.to}`
        };
      }
      const attackedSquares = opponentChess.moves({ verbose: true });
      const attackedValuable = attackedSquares.filter(
        (m) => m.captured && ["q", "r", "b", "n"].includes(m.captured)
      );
      if (attackedValuable.length >= 2) {
        return {
          uci: threatUci,
          san: move.san,
          description: `Threatens tactical fork on ${move.to}`
        };
      }
    }
  } catch {
  }
  return null;
}

async function getDeepContinuation(fen, maxPlies = 10) {
  const steps = [];
  try {
    const chess = new Chess(fen);
    let pvMoves = [];

    if (stockfishService && stockfishService.isAvailable) {
      try {
        const sf = await stockfishService.evaluate(fen, 12, 500);
        if (sf && sf.pv && sf.pv.length > 0) {
          pvMoves = sf.pv;
        }
      } catch {
      }
    }

    if (pvMoves.length === 0) {
      const local = findBestMoveLocal(fen, 2);
      if (local && local.pv && local.pv.length > 0) {
        pvMoves = local.pv;
      }
    }

    let currentFen = fen;
    for (let i = 0; i < maxPlies; i++) {
      if (isChessGameOver(chess)) break;

      let nextUci = pvMoves[i];
      if (!nextUci) {
        const local = findBestMoveLocal(currentFen, 2);
        nextUci = local.bestMoveUci;
      }
      if (!nextUci || nextUci.length < 4) break;

      const from = nextUci.slice(0, 2);
      const to = nextUci.slice(2, 4);
      const promotion = nextUci.length > 4 ? nextUci[4] : void 0;
      const m = chess.move({ from, to, promotion });
      if (!m) break;

      currentFen = chess.fen();
      steps.push({
        ply: i + 1,
        san: m.san,
        uci: `${m.from}${m.to}${m.promotion || ''}`,
        from: m.from,
        to: m.to,
        fen: currentFen,
        color: m.color,
        piece: m.piece,
        captured: m.captured || null,
        isCheck: isChessInCheck(chess),
        isCheckmate: isChessCheckmate(chess)
      });
    }
  } catch {
  }
  return steps;
}

function summarizePunishment(fenStart, fenEnd, moverColor) {
  try {
    const cEnd = new Chess(fenEnd);
    if (isChessCheckmate(cEnd)) {
      return "Forces checkmate against you";
    }

    const cStart = new Chess(fenStart);
    const pieceVal = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let moverStart = 0;
    let oppStart = 0;
    cStart.board().flat().forEach((p) => {
      if (p) {
        if (p.color === moverColor) moverStart += (pieceVal[p.type] || 0);
        else oppStart += (pieceVal[p.type] || 0);
      }
    });

    let moverEnd = 0;
    let oppEnd = 0;
    cEnd.board().flat().forEach((p) => {
      if (p) {
        if (p.color === moverColor) moverEnd += (pieceVal[p.type] || 0);
        else oppEnd += (pieceVal[p.type] || 0);
      }
    });

    const netLoss = (moverStart - oppStart) - (moverEnd - oppEnd);
    if (netLoss >= 9) return `Opponent wins your Queen (+${netLoss})`;
    if (netLoss >= 5) return `Opponent wins a Rook (+${netLoss})`;
    if (netLoss >= 3) return `Opponent wins a minor piece (+${netLoss})`;
    if (netLoss >= 1) return `Opponent wins material (+${netLoss} pawn${netLoss > 1 ? 's' : ''})`;
    return "Opponent converts into a winning positional advantage";
  } catch {
    return "Opponent gains a decisive tactical advantage";
  }
}

/* --- src/services/importApi.js --- */
function parseClockToSeconds(clockStr) {
  const match = clockStr.match(/(\d+):(\d+):?(\d+)?(\.\d+)?/);
  if (!match) return null;
  if (match[3] !== void 0) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseFloat(`${match[3]}${match[4] || ""}`);
    return h * 3600 + m * 60 + s;
  } else {
    const m = parseInt(match[1], 10);
    const s = parseFloat(`${match[2]}${match[4] || ""}`);
    return m * 60 + s;
  }
}
function extractMovesAndClocks(pgn) {
  const moveText = pgn.replace(/\[[^\]]*\]/g, " ").trim();
  const moves = [];
  const clocks = [];
  const tokens = moveText.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    if (/^\d+\.+$/.test(token) || ["1-0", "0-1", "1/2-1/2", "*"].includes(token)) {
      continue;
    }
    if (token.includes("[%clk")) {
      let comment = token;
      while (!comment.includes("]") && i + 1 < tokens.length) {
        i++;
        comment += " " + tokens[i];
      }
      const clkMatch = comment.match(/\[%clk\s+([^\]]+)\]/);
      if (clkMatch) {
        const clk = parseClockToSeconds(clkMatch[1]);
        if (clocks.length > 0 && clocks[clocks.length - 1] === null) {
          clocks[clocks.length - 1] = clk;
        }
      }
      continue;
    }
    if (/^[a-hKQRBNPOo0-9+#=x-]+$/.test(token)) {
      moves.push(token);
      clocks.push(null);
    }
  }
  return { moves, clocks };
}
async function analyzeFullPgn(pgn, userColorTarget, isDeep = false, onProgress) {
  const chess = new Chess();
  try {
    if (typeof chess.loadPgn === "function") {
      chess.loadPgn(pgn);
    } else if (typeof chess.load_pgn === "function") {
      chess.load_pgn(pgn);
    }
  } catch {
  }
  const header = chess.header();
  const white = header["White"] || "White";
  const black = header["Black"] || "Black";
  const whiteElo = parseInt(header["WhiteElo"] || "1500", 10) || 1500;
  const blackElo = parseInt(header["BlackElo"] || "1500", 10) || 1500;
  const resultRaw = header["Result"] || "*";
  const result = ["1-0", "0-1", "1/2-1/2"].includes(resultRaw) ? resultRaw : "*";
  const date = header["Date"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const timeControl = header["TimeControl"] || "300+0";
  const { moves: parsedMoves, clocks } = extractMovesAndClocks(pgn);
  let moveHistory = chess.history({ verbose: true });
  if (moveHistory.length === 0 && parsedMoves.length > 0) {
    const fallbackChess = new Chess();
    for (const san of parsedMoves) {
      try {
        fallbackChess.move(san);
      } catch {}
    }
    moveHistory = fallbackChess.history({ verbose: true });
  }
  const moveSans = moveHistory.length > 0 ? moveHistory.map((m) => m.san) : parsedMoves;
  const userColor = userColorTarget || "w";
  const userBaseElo = userColor === "w" ? whiteElo : blackElo;
  const ecoMatch = findMatchingEco(moveSans);
  const ecoCode = header["ECO"] || ecoMatch.eco;
  const ecoName = ecoMatch.name;
  const replayChess = new Chess();
  const precomputed = [];
  let middlegameStartPly = null;
  let endgameStartPly = null;
  let lastWhiteClock = null;
  let lastBlackClock = null;
  for (let i = 0; i < moveHistory.length; i++) {
    const moveObj = moveHistory[i];
    const fenBefore = replayChess.fen();
    const side = replayChess.turn();
    const plyNum = i + 1;
    const phaseInfo = detectPhase(plyNum, replayChess, moveSans, middlegameStartPly, endgameStartPly);
    if (phaseInfo.newMiddlegameStart && !middlegameStartPly) middlegameStartPly = phaseInfo.newMiddlegameStart;
    if (phaseInfo.newEndgameStart && !endgameStartPly) endgameStartPly = phaseInfo.newEndgameStart;
    const rawClock = clocks[i] ?? null;
    let timeSpent = null;
    if (rawClock !== null) {
      if (side === "w") {
        if (lastWhiteClock !== null) timeSpent = Math.max(0.1, lastWhiteClock - rawClock);
        lastWhiteClock = rawClock;
      } else {
        if (lastBlackClock !== null) timeSpent = Math.max(0.1, lastBlackClock - rawClock);
        lastBlackClock = rawClock;
      }
    }
    const isTimeTrouble = rawClock !== null && rawClock < 20;
    const isBook = isBookMove(moveSans, i);
    replayChess.move(moveObj);
    const fenAfter = replayChess.fen();
    precomputed.push({
      plyNum,
      moveObj,
      fenBefore,
      fenAfter,
      side,
      isBook,
      rawClock,
      timeSpent,
      isTimeTrouble,
      phase: phaseInfo.phase
    });
  }
  const totalPlies = precomputed.length;
  const plies = new Array(totalPlies);

  if (onProgress) {
    onProgress(0, totalPlies);
    await new Promise((resolve) => setTimeout(resolve, 35));
  }

  let prevEngine = precomputed.length > 0
    ? await evaluateFenHybrid(precomputed[0].fenBefore, isDeep)
    : { scoreCp: 20, mate: null, pv: [] };

  for (let i = 0; i < totalPlies; i++) {
    const item = precomputed[i];
    if (item.isBook) {
      const playedUci2 = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const isImpulsive2 = item.timeSpent !== null && item.timeSpent < 2 && !item.isTimeTrouble;
      plies[i] = {
        ply: item.plyNum,
        san: item.moveObj.san,
        uci: playedUci2,
        from: item.moveObj.from,
        to: item.moveObj.to,
        piece: item.moveObj.piece,
        captured: item.moveObj.captured,
        color: item.side,
        fen: item.fenAfter,
        fenBefore: item.fenBefore,
        clock: item.rawClock,
        timeSpent: item.timeSpent,
        isTimeTrouble: item.isTimeTrouble,
        isImpulsive: isImpulsive2,
        scoreCp: 20,
        mate: null,
        winProb: 0.52,
        winProbBefore: 0.5,
        winProbLoss: 0,
        accuracy: 100,
        classification: "book",
        bestMoveUci: playedUci2,
        bestMoveSan: item.moveObj.san,
        secondBestMoveUci: "",
        secondBestMoveSan: "",
        pv: [playedUci2],
        threat: null,
        phase: item.phase
      };
      prevEngine = { scoreCp: 20, mate: null, pv: [playedUci2] };
    } else {
      let engineBefore = prevEngine;
      if (!engineBefore || !engineBefore.bestMoveUci || (i > 0 && precomputed[i - 1].isBook)) {
        engineBefore = await evaluateFenHybrid(item.fenBefore, isDeep);
      }
      const engineAfter = await evaluateFenHybrid(item.fenAfter, isDeep);
      prevEngine = engineAfter;

      const whiteScoreBefore = engineBefore.scoreCp;
      const whiteWinProbBefore = cpToWinProb(whiteScoreBefore, engineBefore.mate);
      const whiteScoreAfter = engineAfter.scoreCp;
      const whiteWinProbAfter = cpToWinProb(whiteScoreAfter, engineAfter.mate);
      const moverWinProbBefore = item.side === "w" ? whiteWinProbBefore : 1 - whiteWinProbBefore;
      const moverWinProbAfter = item.side === "w" ? whiteWinProbAfter : 1 - whiteWinProbAfter;
      const winProbLoss = Math.max(0, moverWinProbBefore - moverWinProbAfter);
      const accuracy = calculateMoveAccuracy(winProbLoss);
      const bestMoveUci = (engineBefore.pv && engineBefore.pv[0]) || engineBefore.bestMoveUci || "";
      let bestMoveSan = "";
      if (bestMoveUci) {
        try {
          const testChess = new Chess(item.fenBefore);
          const from = bestMoveUci.slice(0, 2);
          const to = bestMoveUci.slice(2, 4);
          const promotion = bestMoveUci.length > 4 ? bestMoveUci[4] : void 0;
          const m = testChess.move({ from, to, promotion });
          if (m) bestMoveSan = m.san;
        } catch {
          bestMoveSan = bestMoveUci;
        }
      }
      const secondBestMoveUci = engineBefore.secondBestMoveUci || "";
      let secondBestMoveSan = "";
      if (secondBestMoveUci && secondBestMoveUci !== bestMoveUci) {
        try {
          const testChess2 = new Chess(item.fenBefore);
          const from = secondBestMoveUci.slice(0, 2);
          const to = secondBestMoveUci.slice(2, 4);
          const promotion = secondBestMoveUci.length > 4 ? secondBestMoveUci[4] : void 0;
          const m2 = testChess2.move({ from, to, promotion });
          if (m2) secondBestMoveSan = m2.san;
        } catch {
          secondBestMoveSan = secondBestMoveUci;
        }
      }
      const playedUci = `${item.moveObj.from}${item.moveObj.to}${item.moveObj.promotion || ""}`;
      const multiPv2WinProb = engineBefore.multiPv2ScoreCp !== void 0 ? cpToWinProb(engineBefore.multiPv2ScoreCp) : void 0;
      const classification = classifyMove(
        playedUci,
        bestMoveUci,
        moverWinProbBefore,
        moverWinProbAfter,
        winProbLoss,
        false,
        moverWinProbBefore,
        multiPv2WinProb,
        item.fenBefore,
        item.fenAfter,
        item.side
      );
      const isImpulsive = item.timeSpent !== null && item.timeSpent < 2 && (classification === "blunder" || classification === "mistake") && !item.isTimeTrouble;
      let threat = null;
      if (classification === "blunder" || winProbLoss > 0.15) {
        threat = await detectThreat(item.fenAfter);
      }
      plies[i] = {
        ply: item.plyNum,
        san: item.moveObj.san,
        uci: playedUci,
        from: item.moveObj.from,
        to: item.moveObj.to,
        piece: item.moveObj.piece,
        captured: item.moveObj.captured,
        color: item.side,
        fen: item.fenAfter,
        fenBefore: item.fenBefore,
        clock: item.rawClock,
        timeSpent: item.timeSpent,
        isTimeTrouble: item.isTimeTrouble,
        isImpulsive,
        scoreCp: whiteScoreAfter,
        mate: engineAfter.mate,
        winProb: whiteWinProbAfter,
        winProbBefore: whiteWinProbBefore,
        winProbLoss,
        accuracy,
        classification,
        bestMoveUci,
        bestMoveSan: bestMoveSan || item.moveObj.san,
        secondBestMoveUci,
        secondBestMoveSan,
        pv: engineBefore.pv,
        threat,
        phase: item.phase
      };
    }
    if (onProgress && (i % 6 === 0 || i === totalPlies - 1)) {
      onProgress(i + 1, totalPlies);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  const createEmptyCounts = () => ({
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missed_win: 0
  });
  const userCounts = createEmptyCounts();
  const opponentCounts = createEmptyCounts();
  let userAccuracySum = 0;
  let userMovesCount = 0;
  let oppAccuracySum = 0;
  let oppMovesCount = 0;
  let impulsiveBlunders = 0;
  let timeTroubleBlunders = 0;
  const userPhaseLosses = {
    opening: [],
    middlegame: [],
    endgame: [],
    overall: []
  };
  const oppPhaseLosses = {
    opening: [],
    middlegame: [],
    endgame: [],
    overall: []
  };
  plies.forEach((p) => {
    if (!p) return;
    const cpLoss = (p.classification === 'best' || p.classification === 'book')
      ? 0
      : Math.min(350, Math.round((p.winProbLoss || 0) * 500));
    if (p.color === userColor) {
      userCounts[p.classification] = (userCounts[p.classification] || 0) + 1;
      userAccuracySum += p.accuracy;
      userMovesCount++;
      if (p.isImpulsive) impulsiveBlunders++;
      if (p.isTimeTrouble && (p.classification === "blunder" || p.classification === "mistake")) {
        timeTroubleBlunders++;
      }
      userPhaseLosses[p.phase].push(cpLoss);
      userPhaseLosses.overall.push(cpLoss);
    } else {
      opponentCounts[p.classification] = (opponentCounts[p.classification] || 0) + 1;
      oppAccuracySum += p.accuracy;
      oppMovesCount++;
      oppPhaseLosses[p.phase].push(cpLoss);
      oppPhaseLosses.overall.push(cpLoss);
    }
  });
  const userAccuracy = userMovesCount > 0 ? Math.round(userAccuracySum / userMovesCount * 10) / 10 : 85;
  const opponentAccuracy = oppMovesCount > 0 ? Math.round(oppAccuracySum / oppMovesCount * 10) / 10 : 85;
  const overallAccuracy = Math.round((userAccuracy + opponentAccuracy) / 2 * 10) / 10;
  const calcAcpl = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 25;

  const oppColor = userColor === "w" ? "b" : "w";
  const oppBaseElo = userColor === "w" ? blackElo : whiteElo;

  const userPhaseAcpl = {
    opening: calcAcpl(userPhaseLosses.opening),
    middlegame: calcAcpl(userPhaseLosses.middlegame),
    endgame: calcAcpl(userPhaseLosses.endgame),
    overall: calcAcpl(userPhaseLosses.overall)
  };
  const oppPhaseAcpl = {
    opening: calcAcpl(oppPhaseLosses.opening),
    middlegame: calcAcpl(oppPhaseLosses.middlegame),
    endgame: calcAcpl(oppPhaseLosses.endgame),
    overall: calcAcpl(oppPhaseLosses.overall)
  };

  const overallGameElo = calculatePhaseElo(userBaseElo, userPhaseAcpl.overall, userMovesCount, true, result, userColor) ?? userBaseElo;
  const openingElo = calculatePhaseElo(userBaseElo, userPhaseAcpl.opening, userPhaseLosses.opening.length) ?? userBaseElo;
  const middlegameElo = calculatePhaseElo(userBaseElo, userPhaseAcpl.middlegame, userPhaseLosses.middlegame.length) ?? userBaseElo;
  const endgameElo = calculatePhaseElo(userBaseElo, userPhaseAcpl.endgame, userPhaseLosses.endgame.length) ?? userBaseElo;

  const oppOpeningElo = calculatePhaseElo(oppBaseElo, oppPhaseAcpl.opening, oppPhaseLosses.opening.length) ?? oppBaseElo;
  const oppMiddlegameElo = calculatePhaseElo(oppBaseElo, oppPhaseAcpl.middlegame, oppPhaseLosses.middlegame.length) ?? oppBaseElo;
  const oppEndgameElo = calculatePhaseElo(oppBaseElo, oppPhaseAcpl.endgame, oppPhaseLosses.endgame.length) ?? oppBaseElo;

  return {
    id: `game_${Date.now()}`,
    platform: "pgn",
    white,
    black,
    whiteElo,
    blackElo,
    userColor,
    result,
    date,
    timeControl,
    ecoCode,
    ecoName,
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    plies,
    accuracy: userAccuracy,
    overallAccuracy,
    userAccuracy,
    opponentAccuracy,
    overallGameElo,
    openingElo,
    middlegameElo,
    endgameElo,
    phaseElos: {
      opening: openingElo,
      middlegame: middlegameElo,
      endgame: endgameElo
    },
    userPhaseElos: {
      opening: openingElo,
      middlegame: middlegameElo,
      endgame: endgameElo
    },
    opponentPhaseElos: {
      opening: oppOpeningElo,
      middlegame: oppMiddlegameElo,
      endgame: oppEndgameElo
    },
    middlegameStartPly: middlegameStartPly ?? 20,
    endgameStartPly: endgameStartPly ?? 50,
    counts: userCounts,
    userCounts,
    opponentCounts,
    impulsiveBlunders,
    timeTroubleBlunders,
    phaseAcpl: userPhaseAcpl
  };
}
async function fetchChessComGames(username) {
  const cleanUsername = username.trim().toLowerCase();
  const archivesUrl = `https://api.chess.com/pub/player/${cleanUsername}/games/archives`;
  const headers = {
    "User-Agent": "ChessAnalyzerFlutterApp/1.0 (contact@example.com)"
  };
  const archRes = await fetch(archivesUrl, { headers });
  if (!archRes.ok) {
    throw new Error(`Chess.com user '${username}' not found or profile is private.`);
  }
  const archData = await archRes.json();
  const archives = archData.archives || [];
  if (archives.length === 0) return [];
  const latestMonthUrl = archives[archives.length - 1];
  const gamesRes = await fetch(latestMonthUrl, { headers });
  if (!gamesRes.ok) throw new Error("Failed to fetch monthly games from Chess.com");
  const monthData = await gamesRes.json();
  const games = monthData.games || [];
  return games.slice(-15).reverse().map((g, idx) => {
    const whiteName = g.white?.username || "White";
    const blackName = g.black?.username || "Black";
    let res = "*";
    if (g.white?.result === "win") res = "1-0";
    else if (g.black?.result === "win") res = "0-1";
    else if (g.white?.result === "agreed" || g.white?.result === "repetition" || g.white?.result === "stalemate") res = "1/2-1/2";
    return {
      id: `chesscom_${g.url ? g.url.split("/").pop() : idx}`,
      platform: "chesscom",
      white: whiteName,
      black: blackName,
      whiteElo: g.white?.rating || 1500,
      blackElo: g.black?.rating || 1500,
      result: res,
      date: g.end_time ? new Date(g.end_time * 1e3).toISOString().split("T")[0] : "Recent",
      timeControl: g.time_control || "Rapid",
      eco: g.eco || "C50",
      pgn: g.pgn || ""
    };
  });
}
async function fetchLichessGames(username) {
  const cleanUsername = username.trim().toLowerCase();
  const url = `https://lichess.org/api/games/user/${cleanUsername}?max=15&clocks=true&evals=true&opening=true`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/x-ndjson",
      "User-Agent": "ChessAnalyzerFlutterApp/1.0 (contact@example.com)"
    }
  });
  if (!res.ok) throw new Error(`Lichess user '${username}' not found.`);
  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  return lines.map((line, idx) => {
    try {
      const g = JSON.parse(line);
      const whiteName = g.players?.white?.user?.name || "White";
      const blackName = g.players?.black?.user?.name || "Black";
      let res2 = "*";
      if (g.winner === "white") res2 = "1-0";
      else if (g.winner === "black") res2 = "0-1";
      else if (g.status === "draw" || g.status === "stalemate") res2 = "1/2-1/2";
      return {
        id: `lichess_${g.id || idx}`,
        platform: "lichess",
        white: whiteName,
        black: blackName,
        whiteElo: g.players?.white?.rating || 1500,
        blackElo: g.players?.black?.rating || 1500,
        result: res2,
        date: g.createdAt ? new Date(g.createdAt).toISOString().split("T")[0] : "Recent",
        timeControl: `${g.clock?.initial || 180}+${g.clock?.increment || 0}`,
        eco: g.opening?.eco || "B00",
        pgn: g.pgn || ""
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/* --- src/components/board.js --- */
/**
 * Vanilla JS Chessboard Component
 * Renders an interactive 8x8 chessboard with SVG piece rendering,
 * move highlights, arrows, and comic sound effect badges.
 */




const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const THEMES = {
  green: { light: '#ebecd0', dark: '#739552' },
  wood: { light: '#f0d9b5', dark: '#b58863' },
  icy: { light: '#dee3e6', dark: '#587a9f' },
};

class Chessboard {
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
    this.userArrows = [];
    this.userHighlights = new Set();
    this.rightClickStartSquare = null;

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
    const pendingAnimations = [];

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

        if (this.userHighlights.has(square)) {
          sqDiv.style.boxShadow = 'inset 0 0 0 4px rgba(245, 158, 11, 0.85)';
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
                img.style.zIndex = '20';
                this.lastAnimatedMoveKey = currentMoveKey;
                pendingAnimations.push(img);
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
    // User custom arrows (drawn via right-click drag)
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

    this.container.appendChild(boardWrapper);

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

    this.board.setProps({
      fen: this.chess.fen(),
      orientation: this.userColor,
      lastMove,
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
    this.board = new Chessboard(boardMount, {
      fen: this.chess.fen(),
      orientation: this.userColor,
      theme: this.theme,
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

  const modal = document.createElement('div');
  modal.className = 'why-modal-backdrop';
  modal.id = 'why-blunder-modal';
  modal.innerHTML = `
    <div class="why-dialog comic-card p-3 p-md-4 border border-3 border-dark shadow-lg" style="max-width: 780px; width: 100%; max-height: 94vh; overflow-y: auto; border-radius: 1.25rem; background: var(--bs-body-bg, #fff);">
      <div class="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom border-2 border-dark">
        <div class="d-flex align-items-center gap-2">
          <span class="badge border border-dark rounded-pill px-2.5 py-1" style="background-color: ${comic.bg}; color: ${comic.text}; font-weight: 900; font-size: 11px;">
            ${comic.symbol} ${comic.term}
          </span>
          <h5 class="mb-0 fw-black font-monospace fs-6">Why was ${cur.san} a ${classificationName}?</h5>
        </div>
        <button type="button" class="btn btn-sm btn-outline-dark comic-btn rounded-circle px-2 py-1" id="why-btn-close" aria-label="Close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn btn-danger active fw-bold comic-btn" id="why-tab-punishment">
            <i class="bi bi-lightning-charge-fill me-1"></i>Opponent's Punishment
          </button>
          <button type="button" class="btn btn-outline-success fw-bold comic-btn" id="why-tab-best">
            <i class="bi bi-star-fill me-1"></i>Best Alternative (${cur.bestMoveSan || 'Top Move'})
          </button>
        </div>
        <span class="badge bg-body-secondary text-secondary font-monospace fw-bold px-2 py-1" id="why-step-counter">Move 0 / 0</span>
      </div>

      <div class="row g-3 align-items-stretch">
        <div class="col-12 col-md-7 d-flex justify-content-center">
          <div id="why-modal-board" style="width: 100%; max-width: 380px; aspect-ratio: 1/1;"></div>
        </div>
        <div class="col-12 col-md-5 d-flex flex-column justify-content-between">
          <div>
            <div class="card border border-2 border-dark mb-2 shadow-sm">
              <div class="card-body p-2.5">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <span class="text-uppercase fw-black small text-secondary" style="font-size: 11px;">Tactical Consequence</span>
                  <span class="badge bg-danger-subtle text-danger border border-danger-subtle font-monospace" id="why-line-tag">Punishment</span>
                </div>
                <div class="fw-bold small text-body" id="why-summary-text">
                  <span class="spinner-border spinner-border-sm me-1 text-danger"></span>Calculating continuation...
                </div>
              </div>
            </div>

            <div class="border border-2 border-dark rounded p-2 bg-body-tertiary mb-3" style="max-height: 140px; overflow-y: auto;">
              <div class="small fw-black text-secondary mb-1" style="font-size: 11px;">Continuation Line (Next 10 Moves):</div>
              <div class="d-flex flex-wrap gap-1" id="why-pills-container">
                <span class="text-secondary small fst-italic">Loading line...</span>
              </div>
            </div>
          </div>

          <div>
            <div class="d-flex align-items-center justify-content-center gap-1.5 py-1">
              <button type="button" class="btn btn-outline-dark btn-sm comic-btn px-2" id="why-btn-first" title="Start">
                <i class="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" class="btn btn-outline-dark btn-sm comic-btn px-2.5" id="why-btn-prev" title="Previous Move">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button type="button" class="btn btn-primary btn-sm comic-btn px-3" id="why-btn-play" title="Play / Pause">
                <i class="bi bi-play-fill" id="why-play-icon"></i>
              </button>
              <button type="button" class="btn btn-outline-dark btn-sm comic-btn px-2.5" id="why-btn-next" title="Next Move">
                <i class="bi bi-chevron-right"></i>
              </button>
              <button type="button" class="btn btn-outline-dark btn-sm comic-btn px-2" id="why-btn-last" title="End">
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

  const punishmentSteps = [
    { ply: 0, fen: cur.fen, from: cur.from, to: cur.to, san: cur.san }
  ];

  const deepPunish = await getDeepContinuation(cur.fen, 10);
  punishmentSteps.push(...deepPunish);

  const endFen = punishmentSteps[punishmentSteps.length - 1].fen;
  const punishmentSummary = summarizePunishment(cur.fen, endFen, cur.color);

  const bestSteps = [
    { ply: 0, fen: cur.fenBefore, from: null, to: null, san: 'Start' }
  ];
  let bestSummary = 'Maintains a solid position and prevents opponent tactical counterplay.';

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
        p.classList.remove('btn-outline-dark', 'btn-outline-secondary');
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
      btn.className = `btn btn-sm py-0.5 px-1.5 font-monospace fw-bold rounded-pill why-move-pill ${idx === stepIdx ? 'btn-primary text-white' : 'btn-outline-secondary'}`;
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
      btnPunish?.classList.add('active', 'btn-danger');
      btnPunish?.classList.remove('btn-outline-danger');
      btnBest?.classList.remove('active', 'btn-success');
      btnBest?.classList.add('btn-outline-success');

      if (tagEl) {
        tagEl.className = 'badge bg-danger-subtle text-danger border border-danger-subtle font-monospace';
        tagEl.textContent = 'Punishment';
      }
      if (summaryEl) summaryEl.textContent = punishmentSummary;
    } else {
      currentSteps = bestSteps;
      btnBest?.classList.add('active', 'btn-success');
      btnBest?.classList.remove('btn-outline-success');
      btnPunish?.classList.remove('active', 'btn-danger');
      btnPunish?.classList.add('btn-outline-danger');

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

  setTab('punishment');
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
    const userAcc = Number(this.game.userAccuracy ?? this.game.accuracy ?? this.game.overallAccuracy ?? 85).toFixed(1);
    const oppAcc = Number(this.game.opponentAccuracy ?? 85).toFixed(1);

    const userPhases = this.game.userPhaseElos || this.game.phaseElos || {};
    const oppPhases = this.game.opponentPhaseElos || {};

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
          <!-- Match Overview Header Card -->
          <div class="comic-card p-3">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <div class="fw-black fs-6 text-truncate" style="max-width: 280px;">
                  ${this.game.white} vs ${this.game.black}
                </div>
                <div class="text-secondary small" style="font-size: 11px;">
                  ${this.game.ecoName || this.game.ecoCode || 'Chess Match'} · ${this.game.date || ''}
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-outline-warning comic-btn fw-bold px-2 py-1" id="btn-share-review" title="Copy Review Summary to Clipboard">
                  <i class="bi bi-share me-1"></i>Share
                </button>
                <span class="badge ${this.game.result === '1-0' ? 'bg-success' : this.game.result === '0-1' ? 'bg-danger' : 'bg-secondary'} font-monospace px-2.5 py-1.5 fs-6">
                  ${this.game.result}
                </span>
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

                <!-- Phase Rating Comparison (Opening, Middle, Endgame) -->
                <div class="row g-2 text-center">
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1.5"><i class="bi bi-compass me-1 text-primary"></i>Opening</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-primary font-monospace">${userOpeningElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 22px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppOpeningElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1.5"><i class="bi bi-shield-shaded me-1 text-warning"></i>Middle</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-warning font-monospace">${userMiddlegameElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 22px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppMiddlegameElo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="arcade-stat-chip p-2">
                      <span class="text-secondary small d-block fw-bold mb-1.5"><i class="bi bi-flag-fill me-1 text-success"></i>Endgame</span>
                      <div class="d-flex justify-content-around align-items-baseline">
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">YOU</span>
                          <span class="fw-black fs-6 text-success font-monospace">${userEndgameElo}</span>
                        </div>
                        <div class="vr opacity-25 my-auto" style="height: 22px;"></div>
                        <div class="text-center">
                          <span class="d-block text-secondary" style="font-size: 10px; font-weight: 700;">OPP</span>
                          <span class="fw-black fs-6 text-secondary font-monospace">${oppEndgameElo}</span>
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
          <div class="d-flex align-items-center justify-content-between py-1 px-2 rounded ${hasAny ? 'bg-body-tertiary bg-opacity-25' : 'opacity-60'}" style="font-size: 12px;">
            <span class="font-monospace fw-black text-end ${userCnt > 0 ? 'text-primary' : 'text-body-tertiary'}" style="width: 38px;">
              ${userCnt}
            </span>
            <span class="badge border border-dark rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
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
      } else if (this.activeTab === 'lichess') {
        const games = await fetchLichessGames(this.username);
        this.fetchedGames = games;
        if (games.length === 0) this.fetchError = 'No recent games found for this player.';
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
              <span class="small fw-bold text-secondary">Select a recent game to analyze:</span>
              <div class="d-flex flex-column gap-2 overflow-y-auto overflow-x-hidden pe-1 w-100" style="max-height: 280px; scrollbar-width: thin;">
                ${this.fetchedGames.map((g) => {
                  const isUserWhite = g.white.toLowerCase() === this.username.trim().toLowerCase();
                  const isUserBlack = g.black.toLowerCase() === this.username.trim().toLowerCase();
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
                          <span class="text-secondary small font-monospace text-nowrap" style="font-size: 11px;">${g.date}</span>
                          ${resultBadge}
                        </div>
                      </div>

                      <div class="d-flex align-items-center justify-content-between gap-3" style="min-width: 0;">
                        <div class="d-flex flex-column gap-1.5 flex-grow-1" style="min-width: 0; overflow: hidden;">
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
                        </div>

                        <div class="flex-shrink-0">
                          <button type="button" class="arcade-btn-primary px-3 py-1.5 text-nowrap btn-analyze-card d-flex align-items-center gap-1.5" style="border-radius: 0.65rem; font-size: 13px !important;">
                            <span>Analyze</span> <i class="bi bi-chevron-right" style="font-size: 11px;"></i>
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

      container.querySelectorAll('[data-game-id]').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (this.isAnalyzing) return;
          const gameId = e.currentTarget.getAttribute('data-game-id');
          const game = this.fetchedGames.find((g) => g.id === gameId);
          if (game && this.onSelectPgn) {
            this.isAnalyzing = true;
            const isWhite = game.white.toLowerCase() === this.username.trim().toLowerCase();
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
              this.onSelectPgn(game.pgn, isWhite ? 'w' : 'b');
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

/* --- src/main.js --- */
/**
 * Vanilla JS Application Entry Point
 * Orchestrates Mode switching (Game Review vs 33-Bot Arena),
 * Bootstrap 5 Light/Dark theming, and Stockfish analysis pipeline.
 */


function ensureChessCompat() {
  if (typeof window === 'undefined' || !window.Chess) return;
  const proto = window.Chess.prototype;
  if (!proto) return;
  if (!proto.loadPgn && typeof proto.load_pgn === 'function') {
    proto.loadPgn = function(pgn, options) { return this.load_pgn(pgn, options); };
  }
  if (!proto.isGameOver && typeof proto.game_over === 'function') {
    proto.isGameOver = function() { return this.game_over(); };
  }
  if (!proto.isCheckmate && typeof proto.in_checkmate === 'function') {
    proto.isCheckmate = function() { return this.in_checkmate(); };
  }
  if (!proto.isDraw && typeof proto.in_draw === 'function') {
    proto.isDraw = function() { return this.in_draw(); };
  }
  if (!proto.inCheck && typeof proto.in_check === 'function') {
    proto.inCheck = function() { return this.in_check(); };
  }
  if (!proto.isStalemate && typeof proto.in_stalemate === 'function') {
    proto.isStalemate = function() { return this.in_stalemate(); };
  }
  if (!proto.isThreefoldRepetition && typeof proto.in_threefold_repetition === 'function') {
    proto.isThreefoldRepetition = function() { return this.in_threefold_repetition(); };
  }
  if (!proto.isInsufficientMaterial && typeof proto.insufficient_material === 'function') {
    proto.isInsufficientMaterial = function() { return this.insufficient_material(); };
  }
}
ensureChessCompat();

class App {
  constructor() {
    this.appMode = 'review'; // 'review' | 'bot'
    this.isDarkMode = false;
    this.boardTheme = 'green';
    this.isDeepReview = false;

    this.reviewDashboard = null;
    this.botArena = null;
    this.importModal = null;

    this.init();
  }

  init() {
    this.setupTheme();
    this.bindHeader();

    // Mount Review Dashboard
    const reviewMount = document.getElementById('review-view');
    if (reviewMount) {
      this.reviewDashboard = new ReviewDashboard(reviewMount, {
        theme: this.boardTheme,
        onOpenImport: () => this.importModal?.show(),
        onSwitchToBots: () => this.switchMode('bot'),
      });
    }

    // Mount Bot Arena
    const botMount = document.getElementById('bot-view');
    if (botMount) {
      this.botArena = new BotArena(botMount, {
        theme: this.boardTheme,
        onAnalyzeGame: (pgn, userColor) => this.runAnalysis(pgn, userColor),
      });
    }

    // Mount Import Modal
    const modalEl = document.getElementById('import-modal');
    if (modalEl) {
      this.importModal = new ImportModal(modalEl, {
        onSelectPgn: (pgn, userColor) => this.runAnalysis(pgn, userColor),
      });
    }

    // Default start view
    this.switchMode('review');
  }

  setupTheme() {
    const saved = localStorage.getItem('chess_toon_theme');
    this.isDarkMode = saved === 'dark';
    document.documentElement.setAttribute('data-bs-theme', this.isDarkMode ? 'dark' : 'light');
    this.updateThemeIcon();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.setAttribute('data-bs-theme', this.isDarkMode ? 'dark' : 'light');
    localStorage.setItem('chess_toon_theme', this.isDarkMode ? 'dark' : 'light');
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.className = this.isDarkMode ? 'bi bi-moon-stars-fill text-warning' : 'bi bi-sun-fill text-warning';
    }
  }

  updateSoundIcon() {
    const icon = document.getElementById('sound-toggle-icon');
    if (icon) {
      icon.className = soundService.isMuted ? 'bi bi-volume-mute-fill text-danger' : 'bi bi-volume-up-fill';
    }
  }

  switchMode(mode) {
    this.appMode = mode;

    const reviewView = document.getElementById('review-view');
    const botView = document.getElementById('bot-view');
    const btnReview = document.getElementById('nav-mode-review');
    const btnBot = document.getElementById('nav-mode-bot');

    if (mode === 'review') {
      reviewView?.classList.remove('d-none');
      botView?.classList.add('d-none');
      btnReview?.classList.add('active');
      btnBot?.classList.remove('active');
    } else {
      reviewView?.classList.add('d-none');
      botView?.classList.remove('d-none');
      btnBot?.classList.add('active');
      btnReview?.classList.remove('active');
    }
  }

  bindHeader() {
    this.updateSoundIcon();
    document.getElementById('nav-mode-review')?.addEventListener('click', () => this.switchMode('review'));
    document.getElementById('nav-mode-bot')?.addEventListener('click', () => this.switchMode('bot'));
    document.getElementById('nav-btn-import')?.addEventListener('click', () => this.importModal?.show());
    document.getElementById('nav-btn-theme')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('nav-btn-sound')?.addEventListener('click', () => {
      soundService.toggleMute();
      this.updateSoundIcon();
    });

    // Theme selector dropdown/menu
    const menuToggle = document.querySelector('[data-bs-toggle="menu"], [data-bs-toggle="dropdown"]');
    const menuEl = document.querySelector('.menu, .dropdown-menu');
    if (menuToggle && menuEl) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menuEl.classList.toggle('show');
      });
      document.addEventListener('click', (e) => {
        if (!menuEl.contains(e.target) && e.target !== menuToggle) {
          menuEl.classList.remove('show');
        }
      });
    }

    document.querySelectorAll('[data-board-theme]').forEach((item) => {
      item.addEventListener('click', (e) => {
        this.boardTheme = e.currentTarget.getAttribute('data-board-theme');
        this.reviewDashboard?.setTheme(this.boardTheme);
        this.botArena?.setTheme(this.boardTheme);
        menuEl?.classList.remove('show');
      });
    });
  }

  async runAnalysis(pgn, userColor) {
    this.switchMode('review');
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.reviewDashboard?.showLoading(0, 0);
    this.importModal?.hide();

    // Clean up any lingering backdrops
    document.querySelectorAll('.modal-backdrop').forEach((b) => b.remove());
    document.body.classList.remove('modal-open');

    // Allow modal hide and review loading view to paint before computation begins
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));

    try {
      const analyzedGame = await analyzeFullPgn(
        pgn,
        userColor,
        this.isDeepReview,
        (current, total) => {
          this.reviewDashboard?.showLoading(current, total);
        }
      );

      this.reviewDashboard?.setGame(analyzedGame);
      soundService.playSuccess();
    } catch (err) {
      console.error('Analysis failed:', err);
      this.reviewDashboard?.hideLoading();
      this.reviewDashboard?.render();
    } finally {
      this.importModal?.setAnalyzing(false, 0, 0);
    }
  }
}

window.App = App;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chessApp = new App();
  });
} else {
  window.chessApp = new App();
}

})();
