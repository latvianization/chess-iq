# ⚡ Chess IQ — Game Review & Bot Arena

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_Chess_IQ_Now-fbbf24?style=for-the-badge&logo=googlechrome&logoColor=black)](https://latvianization.github.io/chess-iq/)
[![Engine](https://img.shields.io/badge/Engine-Stockfish_Web_Worker-10b981?style=for-the-badge&logo=cpu&logoColor=white)](https://latvianization.github.io/chess-iq/)
[![Architecture](https://img.shields.io/badge/Architecture-Zero--Build_/_Pure_Web-8b5cf6?style=for-the-badge&logo=html5&logoColor=white)](https://latvianization.github.io/chess-iq/)
[![License](https://img.shields.io/badge/License-MIT-06b6d4?style=for-the-badge)](./LICENSE)

<br />

**A modern, client-side chess game analysis suite and 33-bot sparring arena.**  
Powered by an in-browser Stockfish engine pool, instant tactical blunder diagnostics, phase-based Elo calculation, spaced-repetition training, and responsive neo-arcade aesthetics.

[🎮 **Launch Live Application**](https://latvianization.github.io/chess-iq/) • [✨ Features](#-features) • [🤖 33-Bot Arena](#-the-33-bot-arena) • [🔍 Analysis Metrics](#-in-depth-analysis--engine-metrics) • [🚀 Quick Start](#-zero-build-quick-start)

---

</div>

## 🌐 Try It Right in Your Browser

You don't need to install, compile, or configure anything. Click the link below to run Chess IQ instantly in any modern browser:

### 👉 [https://latvianization.github.io/chess-iq/](https://latvianization.github.io/chess-iq/)

> **Tip:** You can analyze any game from **Chess.com** just by entering your username, paste any PGN or FEN string, or hop straight into the arena to battle 33 custom AI bots!

---

## ✨ Features

### 🔍 1. Grandmaster-Level Game Review
- **Stockfish Engine Evaluation:** Runs entirely in client-side Web Workers for real-time centipawn evaluations and multi-Pv tactical depth without server lag.
- **Move-by-Move Classifications:** Every move is categorized with distinct badges:
  - 💎 **Brilliant (`!!`)** — Sound, decisive material sacrifice leading to an advantage
  - ⚡ **Great (`!`)** — The sole winning continuation in a complex position
  - ⭐ **Best (`★`)** — Exact engine top choice
  - ✓ **Excellent** & 👍 **Good** — Sound positional moves maintaining game tempo
  - 📖 **Book** — Opening book theory matched via the built-in ECO catalog
  - ⚠️ **Inaccuracy (`?!`)** — Minor slip softening your position
  - ❓ **Mistake (`?`)** — Significant drop in evaluation
  - ❌ **Blunder (`??`)** — Severe game-altering mistake (>20% win-probability loss)
  - 🎯 **Missed Win** — Letting an outright winning position slip through your fingers
- **Smooth Animated Eval Bar & Advantage Timeline:** Real-time centipawn and win-percentage visualizer. Click anywhere on the interactive timeline chart to jump immediately to that move.
- **ECO Opening Identification:** Automatic recognition of hundreds of openings and variations (e.g., *Ruy Lopez Closed*, *Sicilian Najdorf*, *Fried Liver Attack*, *King's Indian Defense*).

### ❓ 2. Tactical "Why?" Blunder Diagnostics
- **Immediate Tactical Refutations:** Wondering why a move was marked as a blunder? Click the **"Why?"** button on any mistake.
- **5-Move Continuation Lines:** Stockfish calculates and showcases the exact tactical punishment line.
- **Identified Tactical Motifs:** Instant detection of tactical themes including forks, pins, skewers, discovered attacks, hanging pieces, and mate threats.
- **Interactive Mini-Board Replay:** Step through the refutation line right inside the modal to visualize the opponent's winning counter-play.

### 🧠 3. Automated Blunder Bank (Spaced-Repetition Trainer)
- **Turn Mistakes Into Mastery:** Every inaccuracy, mistake, and blunder made across your analyzed games is automatically saved to your browser's persistent local bank.
- **Active Drill Flashcards:** Practice finding the exact engine-approved move from your own past positions.
- **Stats Tracking:** Track how many mistakes you've successfully solved and conquered over time.

### 🎓 4. Coach's Study Plan & "Guess the Move"
- **Priority Coaching Diagnostic:** Post-game breakdown highlighting your most critical area for improvement (e.g., *Pattern Alert: Hanging Pieces*, *Clock Discipline: 2+ Impulsive Blunders*, or *Endgame Precision Deficit*).
- **Guess the Move Mode:** Step through any reviewed master or user game blind and test your calculation by trying to guess the best move on each ply.
- **Phase Elo Ratings:** Independent performance Elo ratings estimated for your **Opening**, **Middlegame**, and **Endgame** play.

### 🤖 5. 33-Bot Sparring Arena
- 33 unique bot personalities spread across 4 distinct Elo tiers (400 to 2000 Elo).
- **Dynamic In-Game Banter:** Bots react with speech bubbles to game starts, blunders, checks, great moves, wins, and losses.
- **Customized Playstyles:** Realistically calibrated search depths, evaluation jitter, and tactical blindness designed to mimic real human players at each rating level.
- **One-Click Post-Game Review:** Finished a game against a bot? Click **"Analyze Game"** in the game-over dialog to jump straight into a comprehensive move-by-move breakdown!

### 🔊 6. Algorithmic Web Audio Synthesizer
- **Zero Audio Assets Required:** All sound effects (moves, captures, checks, blunders, brilliant moves, and victory fanfare) are synthesized live using the **Web Audio API**.
- Crisp, low-latency tactile audio feedback with an instant mute toggle.

### ⚡ 7. Zero-Build Architecture
- **No Node.js, Webpack, Vite, or npm build step required.**
- Runs natively in any browser via ES modules and standard `<script>` tags.
- Fully compatible with local `file:///` execution on Windows, macOS, and Linux with zero CORS errors.

---

## 🤖 The 33-Bot Arena

Choose your opponent across four difficulty tiers, each with tailored Elo calculations, depths, and banter:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CHESS IQ BOT TIERS                            │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Tier               │ Elo Range          │ Personalities & Archetypes   │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 🐶 Tier 1: Rookies │ 400 - 750 Elo      │ Pip the Pup, Chomper (Dino), │
│                    │                    │ Barnaby Bear, Sir Clueless   │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ ⚔️ Tier 2: Rival   │ 800 - 1150 Elo     │ Rusty Knight, Pixel Pawn,    │
│    Challengers     │                    │ Tempo Tim, Castle Carl       │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 🛡️ Tier 3: Tactical│ 1200 - 1550 Elo    │ Gambit Grace, Tactica,       │
│    Heroes          │                    │ Bishop Bob, Iron Wall Ivan   │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 👑 Tier 4: Grand   │ 1600 - 2000 Elo    │ Valkyrie, Deep Pawn,         │
│    Titans          │                    │ Master Chen, GM Nova         │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 🔍 In-Depth Analysis & Engine Metrics

### Win Probability Sigmoid Model
Centipawn evaluation ($cp$) and forced mate scores ($M$) are converted into expected win probabilities ($P$) using the modern chess mathematical model:

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

## ⌨️ Keyboard Shortcuts

Navigate through games seamlessly with built-in hotkeys:

| Key | Action |
| :--- | :--- |
| <kbd>←</kbd> / <kbd>↑</kbd> | Previous move |
| <kbd>→</kbd> / <kbd>↓</kbd> | Next move |
| <kbd>Home</kbd> or <kbd>Ctrl</kbd> + <kbd>←</kbd> | Jump to start of game |
| <kbd>End</kbd> or <kbd>Ctrl</kbd> + <kbd>→</kbd> | Jump to final move |
| <kbd>Esc</kbd> | Close any open modal or refutation inspector |

---

## 🚀 Zero-Build Quick Start

### Option 1: Live Web Version (Easiest)
Visit the live deployment directly:  
🔗 **[https://latvianization.github.io/chess-iq/](https://latvianization.github.io/chess-iq/)**

---

### Option 2: Run Locally (Zero Installation)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/latvianization/chess-iq.git
   cd chess-iq
   ```

2. **Open directly in your browser:**
   - On Windows: Double-click `index.html` or open via browser:
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

3. *(Optional)* Serve using any quick local HTTP server:
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
├── package.json                 # Project metadata (no build dependencies)
├── public/
│   └── stockfish.js             # Stockfish engine Web Worker & WASM build
└── src/
    ├── main.js                  # Application coordinator & mode switcher
    ├── components/
    │   ├── board.js             # Interactive SVG chessboard & drag-and-drop
    │   ├── botArena.js          # 33-bot sparring arena UI & AI move dispatch
    │   ├── botGameOverModal.js  # End-of-game dialog with instant "Analyze" bridge
    │   ├── importModal.js       # Chess.com username & PGN/FEN import interface
    │   ├── pieceSvgs.js         # Scalable vector graphics piece set
    │   ├── reviewAdvantageChart # Interactive evaluation advantage timeline graph
    │   ├── reviewDashboard.js   # Main game review view, phase ratings & coach plan
    │   └── reviewWhyModal.js    # Interactive blunder refutation & tactical lines
    ├── data/
    │   └── botsData.js          # 33 bot profiles, Elo ratings, depths & banter
    ├── services/
    │   ├── blunderBankService.js# Spaced-repetition blunder trainer & storage
    │   ├── comicBadges.js       # Move classification badges and stylings
    │   ├── ecoDictionary.js     # Opening book dictionary and ECO code matcher
    │   ├── engine.js            # Win probability, accuracy & Elo evaluation logic
    │   ├── engineRefutations.js # Tactical threats & continuation calculator
    │   ├── gameCacheService.js  # LocalStorage caching for analyzed games
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
- **[Tailwind CSS](https://tailwindcss.com/) & [Bootstrap 5](https://getbootstrap.com/)** — Responsive layout, modal architecture, and modern utility styling.
- **Web Audio API** — Real-time synthesized acoustic feedback with zero asset load time.
- **HTML5 Web Workers** — Multithreaded evaluation keeping the board and UI responsive at 60 FPS.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE). Feel free to explore, learn, customize, and share!

<div align="center">
  <sub>Built with ⚡ for chess lovers, improvers, and sparring champions everywhere.</sub>
</div>
