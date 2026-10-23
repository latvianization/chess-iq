# AI Agent Guidelines

## Architecture & Source of Truth
- The source of truth is the **`src/`** directory. Always edit files in `src/`.
- Do not edit `app-*.js` files directly; they are compiled distribution bundles created by `build.js`.

### Directory Layout
- **`src/data/`**: Static dictionaries and bot definitions (`botsData.js`).
- **`src/services/`**:
  - `stockfishWorker.js`: Stockfish Web Worker pool (`StockfishPool`).
  - `engine.js`: Hybrid PST and Stockfish evaluations, move classification, win probabilities, phase detection.
  - `engineRefutations.js`: Tactical threats, continuation lines (min 6 plies), blunder refutations.
  - `importApi.js`: Game fetching (Chess.com, Lichess) and PGN parsing/analysis.
  - `insightsAggregate.js` & `insightsService.js`: 100-game in-depth analytics, metrics, charts data, and 24h caching.
  - `gameCacheService.js`: Per-game analysis cache in localStorage.
  - `sound.js`: Web Audio synthesized sound effects.
  - `backgroundAnalysisQueue.js`: Idle background evaluation queue.
- **`src/components/`**:
  - `board.js`: Interactive SVG chessboard, captured piece bars, drag-and-drop, check highlight.
  - `botArena.js`: 33-bot gameplay arena and bot AI logic.
  - `reviewDashboard.js`: Game review dashboard, eval bar, move classification, phase ratings.
  - `reviewWhyModal.js`: "Why?" blunder explanation modal with immediate loading state.
  - `reviewAdvantageChart.js`: Interactive evaluation timeline chart.
  - `insightsModal.js` & `insightsCharts.js`: Player 100-game in-depth review modal and native SVG charts.
  - `importModal.js`: Game import dialog and user games list.
- **`src/main.js`**: App coordinator, theme switching, and mode toggling.

## Build & Validation
After modifying files in `src/`:
1. Run `node build.js` to compile the 4 modular bundles:
   - `app-data.js`: SVG pieces, ECO database, comic badges, bot definitions.
   - `app-services.js`: Sound, engine, refutations, cache, API, insights.
   - `app-components.js`: UI boards, bots, modals, charts, dashboards.
   - `app-main.js`: Entry point, coordinator, theme, mode switcher.
2. Run `npm run lint` (`node -c app-*.js src/**/*.js`) to verify syntax.
