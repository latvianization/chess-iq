# Vanilla JavaScript & Bootstrap 5 Refactor Plan

Refactor the Chess Review & 33-Bot Arena application from React and Tailwind CSS to **Vanilla JavaScript (modular ES6+)** with **Bootstrap 5.3**, strictly honoring the **KISS (Keep It Simple, Stupid)** philosophy, mobile-first iOS ergonomics, and zero-friction GitHub Pages deployment.

---

### Core Objectives & Architecture Shift

1. **Remove React & Tailwind Overhead**:
   - Replace React component tree with clean, decoupled Vanilla JavaScript ES modules.
   - Replace Tailwind CSS utilities with **Bootstrap 5.3** components (`card`, `modal`, `btn`, `badge`, `progress`, `nav-pills`, grid system) complemented by lightweight comic book CSS variables and tokens.
   - Retain all core functionality: Stockfish tournament analysis, 33 tiered bots (400–2000 Elo in 50-point increments), reactive speech bubbles, comic move badges (KABOOM!, POW!, ZAP!, SPLAT!), and Chess.com/Lichess/PGN importing.

2. **Zero-Friction GitHub Pages Compatibility**:
   - Vanilla JS with standard ES modules runs directly in modern browsers.
   - Relative asset and script paths ensure 100% immediate loading on any GitHub Pages root or subpath (`https://username.github.io/` or `https://username.github.io/repo/`).
   - Retain the Vite build configuration (`base: './'`) for optional automated minification/bundling or direct static serving.

---

## 1. Modular Architecture (KISS Principle)

Instead of complex virtual DOM hierarchies, each module is a focused, self-contained JavaScript file:

```
src/
├── main.js                  # Application orchestrator, mode switcher (Review vs Bot), state store
├── components/
│   ├── board.js             # 8x8 Chessboard DOM renderer (drag & drop, tap to move, comic stickers)
│   ├── botArena.js          # 33-bot selection slider, tier filters, reactive comic speech bubbles
│   ├── reviewDashboard.js   # Sticky eval bar, move list table, key moment navigation, game statistics
│   ├── importModal.js       # Bootstrap 5 modal for Chess.com, Lichess, and Paste PGN
│   └── showWhyRunner.js     # Step-through tactical continuation viewer
├── services/
│   ├── engine.js            # Stockfish Web Worker wrapper + hybrid local fallback evaluator
│   ├── sound.js             # Web Audio API sound effects (moves, captures, comic sfx)
│   ├── comicBadges.js       # Comic terms dictionary (KABOOM!, POW!, etc.) & badge generator
│   └── importApi.js         # Chess.com and Lichess public API fetchers
├── data/
│   └── botsData.js          # 33 calibrated bots (400–2000 Elo) with unique dialogue scripts
└── styles/
    └── comic-bootstrap.css  # Bootstrap 5 theme overrides, comic borders, speech bubble styling
```

---

## 2. Bootstrap 5 UI/UX Design System

- **Default Light Theme**:
  - Warm comic background (`#faf8f5`), crisp borders (`border-2 border-dark`), and tactile shadows (`box-shadow: 2px 2px 0px #000`).
  - Dark mode toggle utilizing Bootstrap 5's native `data-bs-theme="dark"` attribute.
- **Bootstrap 5 Component Mapping**:
  - **Top Bar**: Bootstrap `.navbar` with brand mark, mode switcher buttons, and theme toggle.
  - **Mode Switcher**: Bootstrap `.nav-pills` for quick toggle between **Game Review** and **33-Bot Arena**.
  - **Bot Selector**: Bootstrap `.range` slider for 50-Elo increments (400–2000) and `.btn-group` for tiers (*Rookies*, *Challengers*, *Heroes*, *Titans*).
  - **Interactive Speech Bubbles**: Clean CSS-styled speech bubble with bottom arrow pointer anchored above bot avatar.
  - **Import Modal**: Standard Bootstrap 5 `.modal` with `.nav-tabs` for Chess.com, Lichess, and Paste PGN.
  - **Game Stats**: Bootstrap `.card`, `.badge`, and `.progress-bar` for phase performance and accuracy.

---

## 3. Implementation Steps

### Step 1: Dependencies & Environment Setup
- Update `index.html` to load Bootstrap 5.3 CSS/JS and Bootstrap Icons (or Lucide).
- Remove Tailwind plugin and dependencies from `package.json` and `vite.config.ts`.
- Update `vite.config.ts` for vanilla JS entry (`index.html` -> `src/main.js`).

### Step 2: Styling (`src/styles/comic-bootstrap.css`)
- Configure comic book styling on top of Bootstrap 5:
  - `.comic-card`: Rounded cards with 2px borders and comic drop-shadow.
  - `.comic-badge`: Tilted comic burst sticker badges for move squares.
  - `.comic-bubble`: Speech bubble with directional arrow pointer.
  - Board grid styling ensuring sticky mobile viewport persistence.

### Step 3: Chessboard Engine & Board Renderer (`src/components/board.js`)
- Render the 8x8 chessboard using pure DOM elements with the embedded SVG vector pieces.
- Handle click-to-move, legal move highlights, last-move indicators, and engine arrow overlays using SVG.
- Overlay dynamic comic badges (e.g. `💥 KABOOM!`, `⚡ POW!`, `🩹 OUCH!`).

### Step 4: 33-Bot Arena (`src/components/botArena.js` & `src/data/botsData.js`)
- Migrate the 33 bot profiles (400 to 2000 Elo in 50-Elo steps).
- Implement the 50-point slider and tier tabs.
- Hook into move outcomes to display dynamic speech bubble banter on blunders, checks, and brilliant moves.

### Step 5: Game Review Dashboard & Import Modal
- Build the review panel with move navigation buttons, evaluation bar, and move list.
- Implement the Bootstrap modal with tabs for Chess.com user games, Lichess user games, and direct PGN text input.
- Connect Stockfish Web Worker for deep analysis with live progress bar.

### Step 6: Verification & Testing
- Test app build with `npm run build`.
- Test local preview on port 3000.
- Verify zero-error console output and seamless responsiveness on mobile and desktop viewports.
