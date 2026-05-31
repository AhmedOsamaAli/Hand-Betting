# Hand Betting Game

> A Mahjong-tile betting game for the Penny Software front-end technical assessment.

![Angular 18](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-45%20passing-2EA043)
![Bundle](https://img.shields.io/badge/initial-97%20kB%20gzip-blue)

Three tiles, one question — **will the next hand be higher or lower?** Build a streak,
mind the deck, and don't let any tile hit `0` or `10`.

---

## Quick start

```bash
npm install
npm start          # dev server at http://localhost:4200
npm test           # interactive Karma
npm run test:ci    # one-shot headless run (CI)
npm run build      # production build → dist/hand-betting-game/browser
```

Requires **Node 22** and **npm 10+**.

---

## Game rules

| # | Rule                                                                                                                                      |
|---|-------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | A **hand** is **3 tiles** drawn from a 136-tile Mahjong deck (108 numbers + 16 winds + 12 dragons).                                       |
| 2 | A tile's **starting value** is its number (1–9 for suit tiles) or **5** for winds/dragons.                                                 |
| 3 | The hand's **total** is the sum of all three tile values.                                                                                  |
| 4 | Place a bet: **Higher** or **Lower** — relative to the *current* total. (Same total = **Push**, no change.)                                 |
| 5 | On reveal: every **non-number** tile in the hand has its value adjusted by ±1 (win: it moves *toward* the bet; loss: *away*).               |
| 6 | A **specific tile's value** sticks to that physical tile — even after it returns to the deck and reappears later.                          |
| 7 | **Game over** when *any* tile in the current hand reaches **0** or **10**, **or** the deck is reshuffled for the **3rd** time.              |
| 8 | **Score**: +1 per win. **Streak bonuses**: +2 at 3-win, +5 at 5-win, +15 at 10-win.                                                        |
| 9 | Top **5** scores persist locally; player is prompted to save a name on a qualifying run.                                                   |

All constants live in [`src/app/core/constants/game-config.ts`](src/app/core/constants/game-config.ts) — tune freely.

---

## Architecture

```
src/
├── app/
│   ├── core/                       Pure logic, framework-light.
│   │   ├── constants/              GAME_CONFIG (single source of truth).
│   │   ├── models/                 Tile, Hand, Bet, GameState — types only.
│   │   ├── utils/                  buildDeck(), shuffle() — pure functions.
│   │   └── services/
│   │       ├── storage.service.ts     Namespaced localStorage wrapper.
│   │       ├── tile-value.service.ts  Per-tile value tracking (Map keyed by tile.id).
│   │       ├── deck.service.ts        Draw/discard/reshuffle state machine.
│   │       ├── leaderboard.service.ts Top-5 persistence.
│   │       ├── theme.service.ts       Light/dark, persisted, prefers-color-scheme aware.
│   │       ├── sound.service.ts       Web Audio API — no asset weight.
│   │       └── game.service.ts        Orchestrator. The brain.
│   ├── features/
│   │   ├── landing/                Hero + leaderboard.
│   │   └── game/                   The play screen.
│   │       └── components/         Tile, Hand, BettingControls, DeckStatus,
│   │                               HistoryPanel, GameOverDialog.
│   ├── shared/                     Cross-feature UI (theme/sound toggle).
│   ├── app.config.ts               Router + animations providers.
│   └── app.routes.ts               Two lazy routes.
└── styles/                         Design-token system in SCSS.
```

### Key design decisions

| Decision                          | Rationale                                                                                                |
|-----------------------------------|----------------------------------------------------------------------------------------------------------|
| **Angular 18, standalone**        | Matches Penny's stack. No NgModules — flatter mental model, smaller bundles.                              |
| **Signals over RxJS**             | All state is reactive but synchronous. Easier to reason about, no subscriptions to leak.                  |
| **No UI framework**               | A bespoke design language (Mahjong ivory + jade/crimson palette) doesn't fit Material/Tailwind.           |
| **`@lucide/angular` per-icon**    | Tree-shaken icon components — only the ~10 icons we use ship to the client.                               |
| **SVG tiles, not images**         | Sharp at any resolution, themeable via CSS, zero asset bytes (deck is generated programmatically).        |
| **Web Audio API for SFX**         | Synthesised notes — no MP3s to license, host, or wait on.                                                 |
| **Strategy pattern for bets**     | `evaluateBet` is a pure function; adding "equal" or "exact" bets is a one-liner.                          |
| **Predicate array for game-over** | `gameOverRules: GameOverRule[]` — new end conditions add without touching existing code (OCP).            |
| **Injectable RNG**                | `GameService.startGame(rng?)` accepts a seedable RNG; tests use **Mulberry32** for full determinism.       |
| **Per-instance tile values**      | A `Map<tileId, number>` enforces "a specific tile's value sticks to *that* tile" — even across reshuffles. |
| **Lazy routes**                   | Landing ships **2.6 kB**, game route **13.9 kB**, how-to-play **6.6 kB** (gzipped). Initial paint stays under 100 kB.             |
| **Strict TS + no `any`**          | Discriminated unions everywhere (`Tile`, `GameOverReason`, `BetOutcome`).                                  |

### State flow

```
            ┌──────────────────────────────────────────────┐
            │              GameService                     │
            │  signals: status, currentHand, score, …      │
            │  methods: startGame(), placeBet(), exitGame()│
            └─────┬─────────────────────────┬──────────────┘
                  │ uses                    │ uses
        ┌─────────▼─────────┐    ┌──────────▼──────────┐
        │   DeckService     │    │ TileValueService    │
        │ draw/discard/     │    │ Map<tileId, value>  │
        │ reshuffle state   │    │ applyOutcome(±1)    │
        └───────────────────┘    └─────────────────────┘
                  │                         │
                  └───────────┬─────────────┘
                              │ writes via
                ┌─────────────▼─────────────┐
                │      StorageService       │
                │ localStorage  (hbg.*)     │
                └───────────────────────────┘
```

Components are **dumb consumers** — they read signals and emit events. The
`GameComponent` is a thin orchestrator (~80 lines) that wires `GameService`
into the templates and plays sound effects in response to state transitions.

---

## Testing

**45 unit tests** cover the pure-logic core (deck, tile-value, leaderboard, game
service end-to-end with a seeded RNG, shuffle invariants).

```bash
npm run test:ci    # headless, fails on first error
```

The `game.service.spec.ts` uses **Mulberry32** seeded RNG so a full game can be
replayed deterministically — covering the full win/loss/push, streak-bonus, and
both game-over paths.

---

## Deployment

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
which builds with `--base-href "/<repo-name>/"`, copies `index.html` to `404.html`
(for SPA deep-link support on GitHub Pages), and publishes.

To enable: **Settings → Pages → Source: GitHub Actions**.

---

## How this was built — collaboration & review

The brief asked us to be transparent about AI involvement, so here's an
honest account of the workflow.

This project was built **iteratively, with AI assistance used throughout**
as a pair-programming collaborator. The day-to-day loop looked like:

1. **Specify** — articulate the intent (a rule, a component contract, an
   edge case, a UX issue) in plain English.
2. **Draft** — work with the assistant to produce a first cut: types,
   tests, markup, styles, or a refactor.
3. **Review & adjust** — read every diff, run the tests, exercise the
   feature in the browser, and tighten or rewrite anything that didn't
   feel right (naming, error handling, accessibility, bundle impact).
4. **Re-verify** — `npm run test:ci` + a production build before moving on.

What was decided up front (and re-checked at every step):

- **Game rules** — the "±1 to non-number tiles only / value sticks to the
  specific physical tile" reading is a deliberate interpretation, not a
  default.
- **Architecture** — standalone components + signals (no NgModules, no
  RxJS), framework-light `core/` for pure logic, lazy routes, predicate
  array for game-over rules, strategy pattern for bets, injectable RNG
  for deterministic tests.
- **Design language** — Mahjong ivory + jade/crimson/gold palette,
  SVG-only tiles, Web Audio synthesis (no MP3 assets), full dark/light
  theme via CSS custom properties.
- **Quality bar** — strict TypeScript, no `any`, OWASP-aware (sanitised
  storage, no `innerHTML`), accessible (ARIA labels, keyboard nav,
  focus-visible), gzip budget under 100 kB initial.

Every file in `src/` was read, run, and reviewed before it landed. Where
the assistant's first suggestion didn't fit the codebase, it was rewritten
or thrown away. The result is one cohesive style — names, structure, and
patterns are consistent because they were checked, not because any one
hand wrote every line.

---

## License

MIT — see [LICENSE](LICENSE).
