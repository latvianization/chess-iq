# ⚡ Chess IQ — Game Review & Bot Arena

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_Chess_IQ_Now-fbbf24?style=for-the-badge&logo=googlechrome&logoColor=black)](https://latvianization.github.io/chess-iq/)
[![Engine](https://img.shields.io/badge/Engine-Stockfish_Web_Worker-10b981?style=for-the-badge&logo=cpu&logoColor=white)](https://latvianization.github.io/chess-iq/)
[![Architecture](https://img.shields.io/badge/Architecture-Zero--Build_/_Pure_Web-8b5cf6?style=for-the-badge&logo=html5&logoColor=white)](https://latvianization.github.io/chess-iq/)
[![License](https://img.shields.io/badge/License-MIT-06b6d4?style=for-the-badge)](./LICENSE)

<br />

**A modern, client-side chess game analysis suite and 33-bot sparring arena.**  
Powered by an in-browser Stockfish engine pool, instant tactical blunder & brilliant move diagnostics, interactive "What-If" sandbox, 4-pillar positional X-ray, phase-based Elo ratings, spaced-repetition trainer, and responsive neo-arcade aesthetics.

[🎮 **Launch Live Application**](https://latvianization.github.io/chess-iq/) • [✨ Features](#-features) • [🤖 33-Bot Arena](#-the-33-bot-arena) • [🔍 Analysis Metrics](#-in-depth-analysis--engine-metrics) • [⌨️ Controls](#️-keyboard-shortcuts--board-controls) • [🚀 Quick Start](#-zero-build-quick-start)

---

</div>

<a id="live-demo"></a>
## 🌐 Try It Right in Your Browser

You don't need to install, compile, or configure anything. Click the link below to run Chess IQ instantly in any modern browser:

### 👉 [https://latvianization.github.io/chess-iq/](https://latvianization.github.io/chess-iq/)

> **Tip:** Analyze games directly from **Chess.com** by entering your username, review previously analyzed games from your persistent local cache, paste PGN or FEN notation, or battle 33 custom AI bots!

---

<a id="features"></a>
## ✨ Features

### 🔍 1. Grandmaster-Level Game Review
- **Stockfish Engine Evaluation:** Runs entirely in client-side Web Workers for real-time centipawn evaluations and multi-Pv tactical depth without server lag.
- **Calibrated Move Classifications (Chess.com Aligned):** Every move is categorized with distinct badges:
  - 💎 **Brilliant (`!!`)** — Sound, decisive material sacrifice leading to an advantage
  - ⚡ **Great (`!`)** — The sole winning continuation in a complex position
  - ⭐ **Best (`★`)** — Exact engine top choice
  - ✓ **Excellent** & 👍 **Good** — Sound positional moves maintaining game tempo
  - 📖 **Book** — Opening book theory matched via the built-in ECO catalog
  - ⚠️ **Inaccuracy (`?!`)** — Minor slip softening your position
  - ❓ **Mistake (`?`)** — Significant drop in evaluation
  - ❌ **Blunder (`??`)** — Severe game-altering mistake (>28% win-probability swing; dampened when already winning or hopelessly lost)
  - 🎯 **Missed Win (`✖`)** — Letting an outright winning position slip through your fingers
- **🏆 "Show Win" Engine Continuation Generator:** Wondering how to finish off a winning position? Click **"Show Win"** at any moment to generate moves until checkmate, forced mate, or an unstoppable advantage (+900cp) with interactive board step-through and quick jumps to decisive winning moves.
- **🔗 Shareable Game Review Links:** Click **"Share Link"** to copy a direct review URL with embedded sanitized PGN data (`#pgn=...&color=...`). Using URL hash fragments ensures zero server-side URI length errors (bypassing HTTP 414), while stripping clock annotations and unneeded metadata. Anyone opening the link gets an instant automated game review with zero manual import required!
- **Smooth Animated Eval Bar & Advantage Timeline:** Real-time centipawn and win-percentage visualizer dynamically sized to match the exact height of the chessboard on desktop and mobile. Click anywhere on the interactive timeline chart to jump immediately to that move.
- **ECO Opening Identification:** Automatic recognition of hundreds of openings and variations (e.g., *Ruy Lopez Closed*, *Sicilian Najdorf*, *Fried Liver Attack*, *King's Indian Defense*), complete with opening deviation alerts showing the exact ply the game left master theory.
- **💾 Export & Utility Suite:**
  - **Annotated PGN Download (`.pgn`):** Export games annotated with standard numeric annotation glyphs (NAGs like `$1`, `$2`, `$4`, `$6`) and Stockfish evaluation comments embedded directly.
  - **One-Click FEN Copy:** Copy the current board position's FEN string to the clipboard with one click.
  - **Full Game Report Modal:** Printable and copyable post-game debrief with phase accuracies, move quality breakdown, critical moments, and time discipline metrics.
  - **Detailed Performance Modal:** Side-by-side performance comparison breakdown between White and Black.
  - **Move Table Filters:** Filter moves by **All**, **Key Moments**, or **Mistakes & Blunders** for focused study.
  - **Re-Analyze Game:** One-click option to trigger a fresh, deep Stockfish re-analysis.

---

### ❓ 2. Tactical "Why?" Diagnostics (Blunders & Brilliant Sacrifices)
- **Immediate Tactical Refutations:** Wondering why a move was marked as a blunder? Click the **"Why?"** button on any mistake.
- **Brilliant Move Sacrifices:** Click **"Why?"** on Brilliant (`!!`) moves to inspect why the material sacrifice works, comparing the **Winning Follow-up** line against the engine's **Quiet Alternative**.
- **Step Controls Right Under the Board:** Navigation buttons (`|◀`, `◀`, `▶/❚❚`, `▶`, `▶|`) are positioned directly beneath the board for seamless stepping on desktop and mobile, with keyboard shortcuts for auto-play and step navigation.
- **Interactive "Best Alternative" Line:** Switch to the **Best Alternative** tab to instantly watch the recommended engine move played out on the board with highlighted squares and directional arrows.
- **5-Move Continuation Lines:** Stockfish calculates and showcases the exact tactical punishment line.
- **Identified Tactical Motifs:** Instant detection of tactical themes including forks, pins, skewers, discovered attacks, hanging pieces, back-rank mates, queen traps, and mate threats.
- **Coach's Pattern Tips:** Contextual tactical coaching insights displayed directly inside the diagnostic dialog.

---

### 🧭 3. Interactive "What-If" Sandbox & Sparring
- **Freeform "What-If" Sandbox:** Click and move any piece on the board during review to explore alternate candidate moves. The sandbox automatically spins up Stockfish to evaluate the custom branch in real time, displaying centipawn and mate evaluations, candidate move breadcrumbs, and a quick **"Return to Game"** button.
- **Spar from Current Position ("Play vs Bot from Here"):** Want to see if you can hold or win from a specific board state? Click **"Play vs Bot"** at any ply or opening deviation to instantly launch a live match against an AI bot calibrated to your opponent's Elo from that exact position!

---

### 🏛️ 4. 4-Pillar Positional X-Ray & Board Vision Suite
- **4-Pillar Positional Breakdown:** Evaluates every position across four strategic dimensions:
  - ⚖️ **Material Balance:** Compares non-king piece values with bishop pair bonuses.
  - ⚡ **Piece Activity & Territory:** Measures square influence with a 1.5× center dominance multiplier (c3–f6).
  - 🛡️ **King Safety & Shelter:** Evaluates castled position (+12 bonus), fortress baseline, and penalizes enemy pieces targeting the 3×3 King Ring (-9 pts per attacker).
  - ♟️ **Pawn Structure:** Detects doubled, isolated, and backward pawn weaknesses.
- **Interactive Positional Guide Modal:** Click **"How it works"** or any pillar card to view full mathematical formulas, balance ratios, and tactical advice.
- **Tactical Vision & Visual Overlays:**
  - **Loose & Undefended Pieces X-Ray:** Dotted warning rings highlighting unprotected and hanging pieces.
  - **Territory Control Heatmap:** Visualizes square dominance and control across the board.
  - **Threat Arrows:** Highlights immediate opponent tactical threats.
  - **User Right-Click Drawing:** Right-click and drag to draw custom planning arrows; right-click any square to toggle colored square highlights (matching Chess.com and Lichess conventions).

---

### 🎓 5. Coach's Study Plan, Clock Discipline & Workouts
- **Priority Coaching Diagnostic:** Post-game breakdown highlighting your most critical area for improvement (e.g., *Pattern Alert: Hanging Pieces*, *Clock Discipline: 2+ Impulsive Blunders*, or *Endgame Precision Deficit*).
- **Clock Discipline & Impulsive Blunder Detection:** Extracts move timestamps from PGN clock data (`[%clk ...]`), flagging impulsive moves played in under 1.5 seconds during high-stakes tactical moments.
- **Key Moments Navigation:** Cycle directly between critical turning points, lead changes, and blunders with one click or by pressing <kbd>Space</kbd>.
- **Phase Elo Ratings:** Independent performance Elo ratings estimated for your **Opening**, **Middlegame**, and **Endgame** play.

---

### 🤖 6. 33-Bot Sparring Arena
- 33 unique bot personalities spread across 4 distinct Elo tiers (400 to 2000 Elo).
- **Search & Tier Filtering:** Search bots instantly by name, title, or tier.
- **Persistent Head-to-Head Records:** Automatically tracks your lifetime match record (Wins, Losses, Draws) against every bot in localStorage.
- **Dynamic In-Game Banter:** Bots react with speech bubbles to game starts, user blunders, checks, great moves, wins, and losses.
- **In-Game "Undo Move" Support:** Made a slip during friendly practice? Take back moves seamlessly.
- **Customized Playstyles:** Realistically calibrated search depths, evaluation jitter, and tactical blindness designed to mimic human play at each rating level.
- **One-Click Post-Game Review:** Finished a game against a bot? Click **"Analyze Game"** in the game-over dialog to jump straight into a comprehensive move-by-move breakdown!

---

### 📱 8. Mobile Gestures, Haptics & Responsive Neo-Arcade UX
- **Swipe-to-Close Modals:** Swipe horizontally on any modal to dismiss it naturally on touchscreens.
- **OS Back-Gesture Interception:** Edge-swiping back on mobile devices closes the active modal instead of leaving the application.
- **Haptic Feedback:** Tactile vibrations (`navigator.vibrate`) on supported mobile devices for moves, captures, checks, and blunders.
- **Dynamic Eval Bar Alignment:** The vertical eval bar stays 100% synchronized with the physical height of the chessboard via ResizeObserver.
- **Edge Badge Protection:** Move badges on rank 8 and boundary files stay safely within the board area without clipping.
- **Day & Cyber Dark Themes:** Seamless switching between high-contrast light mode and neo-arcade dark mode.
- **Chess IQ Guide & Feature Glossary:** Built-in searchable glossary and contextual tooltips explaining every metric and badge.

---

### 🔊 9. Algorithmic Web Audio Synthesizer
- **Zero Audio Assets Required:** All sound effects (moves, captures, checks, blunders, brilliant moves, and victory fanfare) are synthesized live using the **Web Audio API**.
- Crisp, low-latency acoustic feedback with an instant mute toggle and automatic AudioContext resume on user interaction.

---

### ⚡ 10. Zero-Build Architecture & Pure Web Runtime
- **No Node.js, Webpack, Vite, or npm build step required.**
- Runs natively in any browser via ES modules and standard `<script>` tags.
- Fully compatible with local `file:///` execution on Windows, macOS, and Linux with zero CORS errors.
- **Zero External CSS Compilers:** Powered by native Bootstrap 5.3 and custom Cyber-Toon styling without Tailwind or PostCSS dependencies.

---

<a id="bot-arena"></a>
## 🤖 The 33-Bot Arena

Spar against 33 custom AI bots across four difficulty tiers, each featuring unique personalities, search depths, and dynamic banter:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CHESS IQ BOT TIERS                            │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Tier               │ Elo Range          │ Personalities & Archetypes   │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 🐶 Tier 1: Rookies │ 400 - 750 Elo      │ Pip the Pup (400), Chomper   │
│                    │                    │ (450), Barnaby Bear (500),   │
│                    │                    │ Capt. Clueless (550), Gizmo  │
│                    │                    │ (600), Daisy Duckling (650), │
│                    │                    │ Snack Pack (700), Pawn       │
│                    │                    │ Pirate (750)                 │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ ⚔️ Tier 2: Rival   │ 800 - 1150 Elo     │ Sparky 2.0 (800), Foxy Fiona │
│    Challengers     │                    │ (850), Rocky Boulder (900),  │
│                    │                    │ Chester Sprint (950), Sgt.   │
│                    │                    │ Pawn (1000), Mystic Maya     │
│                    │                    │ (1050), Val the Viking       │
│                    │                    │ (1100), Sora Samurai (1150)  │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 🛡️ Tier 3: Tactical│ 1200 - 1550 Elo    │ Professor Elena (1200), Neon │
│    Heroes          │                    │ Rider (1250), Luna Shadow    │
│                    │                    │ (1300), Unit 7-Alpha (1350), │
│                    │                    │ Vara Valkyrie (1400), Sir    │
│                    │                    │ Hector (1450), Aurora the    │
│                    │                    │ Sage (1500), Phoenix Blaze   │
│                    │                    │ (1550)                       │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 👑 Tier 4: Grand   │ 1600 - 2000 Elo    │ Magnus-X (1600), Misha Flame │
│    Titans          │                    │ (1650), Cortex-9 (1700),     │
│                    │                    │ GM Boris (1750), Zephyr the  │
│                    │                    │ Tempest (1800), Chronos      │
│                    │                    │ (1850), Quantum Nova (1900), │
│                    │                    │ Jarl Ragnar (1950), Grand    │
│                    │                    │ Titan Rex (2000)             │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

<a id="analysis-metrics"></a>
## 🔍 In-Depth Analysis & Engine Metrics

### Win Probability Sigmoid Model
Centipawn evaluation ($cp$) and forced mate scores ($M$) are converted into expected win probabilities ($P$) using the standard modern chess mathematical model:

$$P(\text{win}) = \frac{1}{1 + e^{-0.00368208 \cdot cp}}$$

### Move Accuracy Model
Accuracy for every ply is calculated using an exponential decay curve mapped from win probability loss ($\Delta P$):

$$\text{Accuracy} = \min\left(100, \max\left(0, 103.1668 \cdot e^{-4.354 \cdot \Delta P} - 3.1669\right)\right)$$

### Phase & Performance Elo Estimation
- Evaluates your average accuracy per game phase:
  - **Opening:** Plies 1 to 20 (or until major pieces leave home squares)
  - **Middlegame:** Main piece clashes and tactical trades
  - **Endgame:** Reduced board material ($\le 13$ non-king material points)
- Computes estimated Elo performance based on player baseline rating, accuracy deviation, and final game outcome.

---

<a id="keyboard-shortcuts"></a>
## ⌨️ Keyboard Shortcuts & Board Controls

Navigate through games and interact with the chessboard seamlessly:

| Key / Control | Action |
| :--- | :--- |
| <kbd>←</kbd> / <kbd>↑</kbd> | Previous move |
| <kbd>→</kbd> / <kbd>↓</kbd> | Next move |
| <kbd>Home</kbd> or <kbd>Ctrl</kbd> + <kbd>←</kbd> | Jump to start of game |
| <kbd>End</kbd> or <kbd>Ctrl</kbd> + <kbd>→</kbd> | Jump to final move |
| <kbd>Space</kbd> | Jump to next **Key Moment** / turning point *(or Play/Pause in modals)* |
| <kbd>F</kbd> | Flip board orientation (White vs Black) |
| <kbd>Esc</kbd> | Close any open modal, sandbox, or refutation inspector |
| **Right-Click + Drag** | Draw custom arrows on the board |
| **Right-Click Square** | Toggle square highlight on the board |
| **Left-Click Piece** | Start "What-If" alternate move sandbox |

---

<a id="quick-start"></a>
## 🚀 Zero-Build Quick Start

### Option 1: Live Web Version (Easiest)
Visit the live deployment directly in any browser:  
🔗 **[https://latvianization.github.io/chess-iq/](https://latvianization.github.io/chess-iq/)**

---

### Option 2: Run Locally (Zero Installation)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/latvianization/chess-iq.git
   cd chess-iq
   ```

2. **Open directly in your browser:**
   - On Windows: Double-click `index.html` or run:
     ```bash
     start index.html
     ```
   - On macOS:
     ```bash
     open index.html
     ```
   - On Linux:
     ```bash
     xdg-open index.html
     ```

3. *(Optional)* Serve using any lightweight local HTTP server:
   ```bash
   # Using Python 3
   python -m http.server 8080

   # Or using Node/npx
   npx serve .
   ```
   Then open `http://localhost:8080` in your browser.

---

## 📁 Repository Structure

```text
chess-iq/
├── index.html                   # Core single-page web app entrypoint
├── package.json                 # Project metadata (zero build dependencies)
├── LICENSE                      # MIT License
├── README.md                    # Documentation & feature guide
├── AGENTS.md                    # Architecture notes for AI coding agents
├── public/
│   ├── favicon.ico              # Multi-resolution app icon
│   ├── favicon.svg              # Scalable vector favicon
│   ├── favicon-32x32.png        # Standard browser favicon
│   ├── apple-touch-icon.png     # iOS home screen icon
│   └── stockfish.js             # Stockfish engine Web Worker & WASM build
└── src/
    ├── main.js                  # Application coordinator & mode switcher
    ├── components/
    │   ├── board.js             # Interactive SVG chessboard, drag-and-drop & arrows
    │   ├── botArena.js          # 33-bot sparring arena UI & AI move dispatch
    │   ├── botGameOverModal.js  # End-of-game dialog with instant "Analyze" bridge
    │   ├── importModal.js       # Chess.com username & PGN/FEN import interface
    │   ├── pieceSvgs.js         # Scalable vector graphics piece set & captured bars
    │   ├── reviewAdvantageChart.js # Interactive evaluation advantage timeline graph
    │   ├── reviewDashboard.js   # Main game review view, phase ratings & coach plan
    │   ├── reviewWhyModal.js    # Interactive blunder & brilliant sacrifice refutations
    │   └── reviewWinningPathModal.js # Engine "Show Win" forced continuation modal
    ├── data/
    │   └── botsData.js          # 33 bot profiles, Elo ratings, depths & banter
    ├── services/
    │   ├── comicBadges.js       # Move classification badges and stylings
    │   ├── ecoDictionary.js     # Opening book dictionary and ECO code matcher
    │   ├── engine.js            # Win probability, accuracy & Elo evaluation logic
    │   ├── engineEvaluationTables.js # PST positional evaluation & material scoring tables
    │   ├── engineRefutations.js # Tactical threats & continuation calculator
    │   ├── gameCacheService.js  # LocalStorage caching for analyzed games
    │   ├── importApi.js         # Chess.com public API client, clocks & PGN sanitization
    │   ├── modalHelper.js       # Mobile swipe gestures & browser back navigation
    │   ├── sound.js             # Algorithmic Web Audio API sound synthesizer
    │   ├── stockfishWorker.js   # Stockfish Web Worker pool manager
    │   └── tooltipService.js    # Contextual UI explanations & metric glossary
    └── styles/
        └── comic-bootstrap.css  # Neo-arcade UI styling, glassmorphism & dark theme
```

---

## 🛠️ Built With

- **[Stockfish.js](https://github.com/nmrugg/stockfish.js)** — Powerful chess engine compiled to WebAssembly / Web Workers.
- **[Chess.js](https://github.com/jhlywa/chess.js)** — Chess rules, move validation, PGN parsing, and board state generation.
- **[Bootstrap 5.3](https://getbootstrap.com/) & Native Cyber-Toon CSS** — Responsive layout, modal architecture, and zero-build utility styling with light/dark themes and zero runtime CSS compilation overhead.
- **Web Audio API** — Real-time synthesized acoustic feedback with zero asset load time.
- **HTML5 Web Workers** — Multithreaded evaluation keeping the board and UI responsive at 60 FPS.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE). Feel free to explore, learn, customize, and share!

<div align="center">
  <sub>Built with ⚡ for chess lovers, improvers, and sparring champions everywhere.</sub>
</div>
