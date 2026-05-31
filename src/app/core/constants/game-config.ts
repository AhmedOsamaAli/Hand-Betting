/**
 * Game configuration — all tunable rules live here.
 *
 * Changing these constants is the only thing required to rebalance the game.
 * Every service consumes these via injection; never hard-code these elsewhere.
 */

export const GAME_CONFIG = {
  /** Number of tiles revealed in each round. */
  HAND_SIZE: 3,

  /** Starting value of every non-number tile (winds & dragons). */
  BASE_NON_NUMBER_VALUE: 5,

  /** Lower exclusive bound — reaching this ends the game. */
  TILE_VALUE_MIN: 0,

  /** Upper exclusive bound — reaching this ends the game. */
  TILE_VALUE_MAX: 10,

  /** Player loses after the draw pile is reshuffled this many times. */
  MAX_RESHUFFLES: 3,

  /** Streak length thresholds → score bonus. Keep sorted ascending by length. */
  STREAK_BONUSES: [
    { length: 3, bonus: 2 },
    { length: 5, bonus: 5 },
    { length: 10, bonus: 15 },
  ] as readonly { length: number; bonus: number }[],

  /** How many leaderboard entries to keep / display. */
  LEADERBOARD_SIZE: 5,
} as const;

export type GameConfig = typeof GAME_CONFIG;
