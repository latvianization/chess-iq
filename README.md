# ⚡ Chess IQ — Game Review & Bot Arena

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_Chess_IQ_Now-fbbf24?style=for-the-badge&logo=googlechrome&logoColor=black)](https://latvianization.github.io/chess-iq/)
[![Engine](https://img.shields.io/badge/Engine-Stockfish_Web_Worker-10b981?style=for-the-badge&logo=cpu&logoColor=white)](https://latvianization.github.io/chess-iq/)
[![Architecture](https://img.shields.io/badge/Architecture-Zero--Build_/_Pure_Web-8b5cf6?style=for-the-badge&logo=html5&logoColor=white)](https://latvianization.github.io/chess-iq/)
[![License](https://img.shields.io/badge/License-MIT-06b6d4?style=for-the-badge)](./LICENSE)

<br />

**A modern, client-side chess game analysis suite and 33-bot sparring arena.**  
Powered by an in-browser Stockfish engine pool, instant tactical blunder & brilliant move diagnostics, interactive "What-If" sandbox, 4-pillar positional X-ray, phase-based Elo ratings, clock discipline audits, opening departure explorer, and responsive neo-arcade aesthetics.

[🎮 **Launch Live Application**](https://latvianization.github.io/chess-iq/) • [✨ Features](#-features) • [🤖 33-Bot Arena](#-the-33-bot-arena) • [🔍 Analysis Metrics](#-in-depth-analysis--engine-metrics) • [⌨️ Controls](#️-keyboard-shortcuts--board-controls) • [🚀 Quick Start](#-zero-build-quick-start)

---

</div>

<a id="live-demo"></a>
## 🌐 Try It Right in Your Browser

You don't need to install, compile, or configure anything. Run Chess IQ instantly in any modern browser:

### 👉 [https://latvianization.github.io/chess-iq/](https://latvianization.github.io/chess-iq/)

> **Tip:** Analyze games directly from **Chess.com** by entering your username, review previously analyzed games from your persistent local cache, load shareable review links, or battle 33 custom AI bots!

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
  - 🔒 **Forced (`□`)** — The only legal move available
  - ⚠️ **Inaccuracy (`?!`)** — Minor slip softening your position
  - ❓ **Mistake (`?`)** — Significant drop in evaluation
  - ❌ **Blunder (`??`)** — Severe game-altering mistake (>28% win-probability swing; dampened when already winning or hopelessly lost)
  - 🎯 **Missed Win (`✖`)** — Letting an outright winning position slip through your fingers
- **🏆 "Show Winning Path" Engine Continuation Generator:** Wondering how to finish off a winning position? Click **"Show Winning Path"** at any moment to generate moves until checkmate, forced mate, or an unstoppable advantage (+900cp). Includes an in-modal game-move navigation bar, autoplay step-through, and a one-click button to jump directly to the next decisive winning move in the game.
- **🔗 Shareable Game Review Links:** Click **"Share Review Link"** to copy a direct review URL with embedded sanitized PGN data (`#pgn=...&color=...`). Using URL hash fragments ensures zero server-side URI length errors (bypassing HTTP 414), while stripping clock annotations and unneeded metadata. Anyone opening the link gets an instant automated game review with zero manual import required!
- **Smooth Animated Eval Bar & Advantage Timeline:** Real-time centipawn and win-percentage visualizer dynamically sized to match the exact height of the chessboard on desktop and mobile. Interactive curved SVG advantage chart with a tracking scrubber lets you jump immediately to any ply.
- **Coach's Plain-English Explanation Strip:** Contextual commentary rendered directly beneath the move strip explaining why each move succeeded or failed, tactical motifs involved, and the engine's recommended continuation.
- **Persistent Local Cache & Saved Games Dashboard:** All analyzed matches are automatically stored in `localStorage`. Browse saved games with instant filtering (**All**, **vs Players**, **vs Bots**), re-open analyzed games with zero re-calculation delay, remove individual games with confirmation, or clear the cache on demand.
- **💾 Export & Utility Suite:**
  - **Annotated PGN Download (`.pgn`):** Export games annotated with standard numeric annotation glyphs (NAGs like `$1`, `$2`, `$4`, `$6`) and Stockfish evaluation comments embedded directly.
  - **One-Click FEN Copy:** Copy the current board position's FEN string to the clipboard with one click.
  - **Move Table Filters:** Filter moves by **All**, **Key Moments**, or **Errors** for focused study.
  - **Re-Analyze Game:** One-click option to trigger a fresh, deep Stockfish re-analysis.

---

### ❓ 2. Tactical "Why?" Diagnostics (Blunders & Brilliant Sacrifices)
- **Immediate Tactical Refutations:** Wondering why a move was marked as a blunder, mistake, inaccuracy, or missed win? Click the **"Why?"** button on any mistake.
- **Brilliant Move Sacrifices:** Click **"Why?"** on Brilliant (`!!`) moves to inspect why the material sacrifice works, comparing the **Winning Follow-up** line against the engine's **Quiet Alternative**.
- **Dual Analytical Tabs:**
  - **Opponent's Punishment:** Shows how the opponent can punish the mistake with Stockfish's calculated continuation line.
  - **Best Alternative:** Plays out the engine's recommended top move on the board with highlighted squares and directional arrows.
- **Step Controls Right Under the Board:** Navigation buttons (`|◀`, `◀`, `▶/❚❚` Autoplay, `▶`, `▶|`) with keyboard shortcuts (<kbd>Space</kbd> for play/pause, <kbd>←</kbd>/<kbd>→</kbd> arrows).
- **Identified Tactical Motifs:** Instant detection of tactical themes including forks, pins, skewers, discovered attacks, hanging pieces, back-rank mates, queen traps, and mate threats.
- **Coach's Pattern Tips:** Contextual coaching insights displayed directly inside the diagnostic dialog.

---

### 🧭 3. Interactive "What-If" Candidate Move Sandbox & Sparring
- **Freeform "What-If" Sandbox:** Click and move any piece on the board during review to explore alternate candidate moves. The sandbox automatically spins up Stockfish to evaluate the custom branch in real time, displaying centipawn and mate evaluations, candidate move breadcrumbs, and a quick **"Return to Game"** button.
- **Interactive Variation Breadcrumbs:** Click any intermediate sandbox step (`Start → e4 → e5...`) to review alternate hypothetical branches without losing your place.
- **Spar from Current Position ("Play vs Bot from Position"):** Want to see if you can hold or win from a specific board state? Click **"Play vs Bot from Position"** at any ply or opening deviation to instantly launch a live match against an AI bot calibrated to your opponent's Elo from that exact position!

---

### 🏛️ 4. 4-Pillar Positional X-Ray & Board Vision Suite
- **4-Pillar Positional Breakdown:** Evaluates every position across four strategic dimensions:
  - ⚖️ **Material Balance:** Compares non-king piece values with bishop pair bonuses.
  - ⚡ **Piece Activity & Territory:** Measures square influence with a 1.5× center dominance multiplier (c3–f6).
  - 🛡️ **King Safety & Shelter:** Evaluates castled position (+12 bonus), fortress baseline, and penalizes enemy pieces targeting the 3×3 King Ring (-9 pts per attacker).
  - ♟️ **Pawn Structure:** Detects doubled, isolated, and backward pawn weaknesses.
- **Interactive Positional Guide Modal:** Click **"How it works"** or any pillar card to view full mathematical formulas, balance ratios, and tactical advice.
- **Tactical Vision & Visual Overlays:**
  - **Control Heatmap:** Visualizes square dominance and control across the board.
  - **Loose Pieces (LPDO):** Dotted warning rings highlighting unprotected and hanging pieces.
  - **Opponent Threat Arrows:** Highlights immediate opponent tactical threats.
  - **Best Move Arrow:** Displays Stockfish's recommended continuation arrow.
  - **User Right-Click Drawing:** Right-click and drag to draw custom planning arrows; right-click any square to toggle colored square highlights (matching Chess.com and Lichess conventions).

---

### 📊 5. Full Game Performance & Executive Report Modal
- **Executive Head-to-Head Overview:** Side-by-side performance comparison between White and Black, including move accuracies, performance Elos, and accuracy tier ratings (Grandmaster Precision, Master Execution, Solid Tactical Play, Fighting Game, Volatile Battle).
- **Phase-by-Phase Mastery:** Independent accuracy percentages and estimated performance Elos for **Opening**, **Middlegame**, and **Endgame** for both players.
- **Move Quality Matrix:** Visual comparison tracks showing the exact count and percentage distribution of Brilliant, Great, Best, Excellent, Good, Book, Forced, Inaccuracy, Mistake, Blunder, and Missed Win moves.
- **Critical Turning Points & Tactical Highlights:** Highlights the single move that caused the greatest win-probability swing, accompanied by the Stockfish recommended alternative and direct jump button.
- **Key Blunders & Missed Wins List:** Quick-access list of top mistakes sorted by evaluation swing with one-click board navigation.
- **Time Management & Clock Discipline:** Compares White and Black average move times, rushed moves played in under 2 seconds, and moves played in critical time trouble (<20s).
- **One-Click Report Copy:** Click **"Copy Summary"** to copy a formatted text executive debrief to the clipboard.

---

### 📖 6. ECO Opening Book Explorer & Theory Deviation
- **Automatic Recognition:** Detects opening names and ECO codes across hundreds of openings and variations (e.g., *Ruy Lopez Closed*, *Sicilian Najdorf*, *Fried Liver Attack*, *King's Indian Defense*).
- **Opening Strategic Theme:** Displays volume, category, strategic principles, and canonical starting moves.
- **Theory Departure Detection:** Flags the exact move and ply where the game branched from established master theory, with a one-click button to jump directly to the book departure on the board.

---

### 🎓 7. Coach's Insights, Clock Discipline & Key Moments
- **Clock Discipline Diagnostic:** Extracts move timestamps from PGN clock data (`[%clk ...]`), auditing move pace, impulsive blunders, and time trouble.
- **Key Moments Navigation:** Cycle directly between critical turning points, lead changes, and blunders with one click or by pressing <kbd>Space</kbd>.
- **Phase Elo Ratings:** Independent performance Elo ratings estimated for your Opening, Middlegame, and Endgame play.

---

### 🤖 8. 33-Bot Sparring Arena
- 33 unique bot personalities spread across 4 distinct Elo tiers (400 to 2000 Elo in 50-point increments).
- **Search & Tier Filtering:** Search bots instantly by name, title, or tier (**Rookies**, **Challengers**, **Heroes**, **Titans**).
- **Persistent Head-to-Head Records:** Automatically tracks your lifetime match record (Wins, Losses, Draws) against every bot in `localStorage`.
- **Dynamic In-Game Banter:** Bots react with speech bubbles to game starts, user blunders, checks, great moves, wins, and losses.
- **In-Game "Undo Move" Support:** Made a slip during friendly practice? Take back moves seamlessly.
- **Customized Playstyles:** Realistically calibrated search depths, evaluation jitter, and tactical blindness designed to mimic human play at each rating level.
- **One-Click Post-Game Review:** Finished a game against a bot? Click **"Analyze Game"** in the game-over dialog to jump straight into a comprehensive move-by-move breakdown!

---

### 📱 9. Mobile Gestures, Controls & Responsive Neo-Arcade UX
- **Mouse Wheel Board Navigation:** Hover over the chessboard and scroll up or down to step backward and forward through moves smoothly.
- **Swipe-to-Close Modals:** Swipe horizontally on any modal to dismiss it naturally on touchscreens.
- **OS Back-Gesture Interception:** Edge-swiping back on mobile devices closes the active modal or returns to the game list instead of leaving the application.
- **Dynamic Eval Bar Alignment:** The vertical eval bar stays 100% synchronized with the physical height of the chessboard via ResizeObserver.
- **Day & Cyber Dark Themes:** Seamless switching between high-contrast light mode and neo-arcade dark mode.
- **Interactive Tooltip Glossary:** Built-in contextual tooltips ("What & Why") explaining every metric, phase, and classification badge.

---

### 🔊 10. Algorithmic Web Audio Synthesizer
- **Zero Audio Assets Required:** All sound effects (moves, captures, checks, blunders, brilliant moves, and victory fanfare) are synthesized live using the **Web Audio API**.
- Crisp, low-latency acoustic feedback with an instant mute toggle and automatic AudioContext resume on user interaction.

---

### ⚡ 11. Zero-Build Architecture & Pure Web Runtime
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
| **Mouse Wheel (Scroll on Board)** | Step forward (scroll down) or backward (scroll up) |
| <kbd>Home</kbd> or <kbd>Ctrl</kbd> + <kbd>←</kbd> | Jump to start of game |
| <kbd>End</kbd> or <kbd>Ctrl</kbd> + <kbd>→</kbd> | Jump to final move |
| <kbd>Space</kbd> | Jump to next **Key Moment** *(or Play/Pause in modals)* |
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
