# AI Agent Guidelines

## Architecture & Zero-Build Runtime
- The application runs directly in the browser via standard `<script>` tags without bundlers.
- **Works everywhere, including direct local `file:///` opening on Windows with ZERO CORS errors.**
- **No Node.js, compilation, or build step is required.** Any changes saved in `src/` are immediately live upon browser refresh.
- The single source of truth is the **`src/`** directory.

### Directory Layout
- **`src/data/`**: Static dictionaries and bot definitions (`botsData.js`).
- **`src/services/`**:
  - `stockfishWorker.js`: Stockfish Web Worker pool (`StockfishPool`).
  - `engine.js`: Hybrid PST and Stockfish evaluations, move classification, win probabilities, phase detection.
  - `engineRefutations.js`: Tactical threats, continuation lines (5 moves), blunder refutations.
  - `importApi.js`: Game fetching (Chess.com) and PGN parsing/analysis.
  - `gameCacheService.js`: Per-game analysis cache in localStorage.
  - `sound.js`: Web Audio synthesized sound effects.
- **`src/components/`**:
  - `board.js`: Interactive SVG chessboard, captured piece bars, drag-and-drop, check highlight.
  - `botArena.js`: 33-bot gameplay arena and bot AI logic.
  - `reviewDashboard.js`: Game review dashboard, eval bar, move classification, phase ratings.
  - `reviewWhyModal.js`: "Why?" blunder explanation modal with immediate loading state.
  - `reviewAdvantageChart.js`: Interactive evaluation timeline chart.
  - `importModal.js`: Game import dialog and user games list.
- **`src/main.js`**: App coordinator, theme switching, and mode toggling.
