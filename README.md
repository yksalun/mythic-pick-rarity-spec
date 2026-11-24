# Mythic Pick Rarity Scoring & Share Grid Specification

Open specification and zero-dependency JavaScript reference implementation for the smoothed live crowd-rarity scoring model and spoiler-free emoji share grid used in **[Mythic Pick](https://mythicpick.com)** — a free browser-based daily video game rarity trivia game.

## Why Smoothed Live Crowd Scoring?

In daily rarity trivia games, players are given open-ended prompts with dozens or hundreds of valid answers: the fewer other players who pick your answer, the deeper your dungeon dive goes.

Hard-coded static rarity tables break as soon as a "secret" answer gets shared online. **[Mythic Pick](https://mythicpick.com)** blends an audited popularity prior (`p0`) with real-time daily player counts using Bayesian/Laplace smoothing:

```text
Live Share = (Actual Picks + K * Prior Popularity) / (Total Daily Players + K)
```

- **Cold-start fairness (`K ≈ 300`):** Early players in UTC+14 still get stable, meaningful tiers before thousands of runs arrive.
- **Anti-cheat-sheet convergence:** As real runs accumulate, viral "clever" picks naturally rise in share and fall into Common or **Meta Pick** (`> 5x prior` and `> 3% share`).
- **Lock-in integrity:** Your tier and floor payout lock the instant you submit.

## Six Rarity Tiers (Max 800 Floors)

Questions 1–6 pay standard floors; **Question 7 is the Boss Round (2×)**, giving a theoretical maximum of **800 floors** per daily dive.

| Rarity Tier | Daily Pick Share | Standard (Q1–Q6) | Boss Round (Q7 ×2) | Share Grid |
| :--- | :--- | :--- | :--- | :--- |
| **Common** | Above 8% | 10 floors | 20 floors | ⬜ |
| **Uncommon** | 3% – 8% | 25 floors | 50 floors | 🟩 |
| **Rare** | 1% – 3% | 45 floors | 90 floors | 🟦 |
| **Epic** | 0.3% – 1% | 65 floors | 130 floors | 🟪 |
| **Legendary** | 0.05% – 0.3% | 85 floors | 170 floors | 🟨 |
| **Mythic** | Below 0.05% | 100 floors | 200 floors | 🟥 |
| **Miss / Timeout** | — | 0 floors | 0 floors | ⬛ |

## Quick Usage

Requires Node.js 18+ (zero external dependencies):

```js
import { scoreDailyRun, formatShareText } from './src/rarity-scoring.mjs';

const run = scoreDailyRun([
  { valid: true, actualPicks: 42, totalPlayers: 500, priorPopularity: 0.12 },
  { valid: true, actualPicks: 15, totalPlayers: 500, priorPopularity: 0.04 },
  { valid: true, actualPicks: 6, totalPlayers: 500, priorPopularity: 0.015 },
  { valid: true, actualPicks: 2, totalPlayers: 500, priorPopularity: 0.005 },
  { valid: true, actualPicks: 1, totalPlayers: 500, priorPopularity: 0.001 },
  { valid: true, actualPicks: 0, totalPlayers: 500, priorPopularity: 0.0002 },
  { valid: true, actualPicks: 0, totalPlayers: 500, priorPopularity: 0.0002 }, // Q7 Boss 2x
]);

console.log(formatShareText({ puzzleNumber: 37, ...run }));
```

Run the test suite:

```bash
npm test
```

## Links

- Play today's daily video game rarity trivia: **[Mythic Pick](https://mythicpick.com)**
- Full rules & scoring formula: [How Mythic Pick Rarity Score Works](https://mythicpick.com/rarity-score)
- How to play & modes (Pokémon, Minecraft, Roblox channels): [How to Play Mythic Pick](https://mythicpick.com/how-to-play)
- Hand-checked list of 50 daily browser games: [50 Daily Browser Games Like Wordle & Krillion](https://mythicpick.com/dle-games)

## License

MIT
