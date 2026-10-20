# Comic Book Chess Review & 33-Bot Arena

A fun, vibrant, colorful chess review and bot arena app styled like a comic book. Features a **default light theme**, **comic sound effect badges** with varied expressive terms (KABOOM!, POW!, ZAP!, OUCH!, SPLAT!), **33 tiered bots in 50-Elo increments (400–2000 Elo)**, and **interactive speech bubbles** where bots react dynamically with unique personalities when the player makes brilliant moves or blunders.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The app shifts from the previous muted dark theme to a bright, colorful, playful comic-book aesthetic as default, while retaining the high-performance Stockfish engine and mobile sticky board layout.

- **Visual Direction**: Default **Light Mode** — creamy off-white canvas (`#faf8f5`), crisp comic borders, punchy saturated pastel accents (superhero yellow, sky cyan, pop magenta, hero green), and bold comic badge bursts.
- **Comic Sound Effect Move Badges (with Rich Variety)**:
  - **Brilliant (!!)**: `KABOOM!`, `BOOM!`, `EPIC!`, `GENIUS!`
  - **Great (!)**: `POW!`, `WHAM!`, `SUPER!`, `SMASH!`
  - **Best (★)**: `ZAP!`, `SWOOSH!`, `BULLSEYE!`, `BAM!`
  - **Excellent (✓)**: `NICE!`, `SHARP!`, `CLEAN!`, `SWEET!`
  - **Inaccuracy (?!)**: `HMM?`, `MEH!`, `WHOOPS!`, `UH-OH!`
  - **Mistake (?)**: `OUCH!`, `YIKES!`, `CLUNK!`, `DOH!`
  - **Blunder (??)**: `SPLAT!`, `CRASH!`, `KABLOOEY!`, `FACEPALM!`
  - **Missed Win (✖)**: `NOOO!`, `MISSED!`, `WIPEOUT!`, `HEIST!`
- **33 Tiered Bots (400 to 2000 Elo in 50-Elo Increments)**:
  - Roster categorized into 4 comic tiers: *Rookies (400–750)*, *Challengers (800–1150)*, *Heroes (1200–1550)*, and *Grand Titans (1600–2000)*.
  - Interactive bot selector carousel / quick-jump slider to rapidly pick any 50-Elo level.
- **Interactive Bot Personality Speech Bubbles**:
  - Live animated comic speech bubbles appearing over the bot avatar reacting to:
    1. Player's brilliant moves (`"Wait, who taught you that?!"`, `"My circuits! That hurt!"`)
    2. Player's mistakes & blunders (`"Nom nom nom, free piece!"`, `"Did your finger slip?!"`)
    3. Checks, captures, and checkmate conclusions.

---

## 1. Overview & Core Concept

- **What It Does**: Combines two core pillars:
  1. **Game Review**: Analyze imported PGNs/games with Stockfish, displaying colorful comic burst badges and smooth advantage curves.
  2. **Play vs Bots**: Challenge 33 bots calibrated at exact 50-Elo increments from 400 to 2000, each with unique banter and animated speech bubbles.
- **Target Audience**: Casual and competitive chess players who want an engaging, lighthearted, and expressive gaming experience rather than a clinical dashboard.
- **Key Value**: Turns mistakes into fun "OUCH!" moments and great moves into exhilarating "KABOOM!" triumphs, while offering granular 50-Elo training progression.

---

## 2. User Experience & Visual Design

- **Vibrant Comic Book Styling**:
  - **Default Light Theme**: Clean ivory canvas (`#fbf9f4`), crisp black framing borders (`border-2 border-black/80` or `border-[#2c2825]`), bright pop-color badges, and halftone dot patterns.
  - **Comic Action Badges**: Jagged comic burst star stickers for moves with energetic gradients and bold comic typography.
  - **Comic Speech Bubbles**: Animated white speech bubbles with comic tail pointer, floating over bot avatars with pop-in bounce animations.
- **Ergonomics & Mobile Discipline**:
  - Maintains the sticky board and persistent step navigation bar pinned at top on mobile.
  - Large $44\text{px}+$ touch-friendly buttons with tactile press animations (`active:translate-y-0.5`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Bot Selection UI for 33 Bots**
  - *Chosen Approach*: Tiered category cards with a smooth 50-Elo step slider and horizontal character carousel.
  - *Why*: Allows users to either scroll through all 33 bots or instantly drag the slider to their exact target Elo (e.g. 750 or 1450).
- **Decision 2: Comic Sound Terms Randomization vs Consistency**
  - *Chosen Approach*: Deterministic move-hash randomizer so a specific move consistently displays a fun word (e.g., `KABOOM!` on ply 17), with a diverse pool of 4–5 comic terms per classification.
- **Decision 3: Default Light Theme with Dark Option**
  - *Chosen Approach*: Set light comic theme as the default primary theme, keeping a 1-click toggle for users who want dark comic styling.

---

## 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar                              │
│   - Comic Logo "CHESS TOON" • Mode Switcher • Theme Toggle • Import    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│      Mode 1: Game Review          │ │     Mode 2: Play vs 33 Bots      │
│ - Sticky Board & EvalBar          │ │ - 50-Elo Increment Roster        │
│ - Comic Burst Badges (KABOOM!)    │ │ - Live Reactive Speech Bubbles   │
│ - Stockfish PV Tactical Lines     │ │ - Real-time Bot Engine AI        │
│ - Internal-scroll Move List       │ │ - 1-Click "Review Game" Transfer │
└───────────────────────────────────┘ └──────────────────────────────────┘
```

- **File Modifications Planned**:
  - `src/types/chess.ts`: Add comic badge types and expanded bot profile definition.
  - `src/components/Chessboard.tsx`: Render comic starburst badges with varied comic phrases.
  - `src/components/PlayVsBot.tsx`: 33 distinct bots in 50-Elo steps (400–2000), comic speech bubbles, and avatar reactions.
  - `src/components/TopBar.tsx` & `src/App.tsx`: Light theme default styling and comic color tokens.
