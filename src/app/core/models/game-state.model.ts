import { Tile } from './tile.model';

/** Top-level lifecycle status of a game session. */
export type GameStatus = 'IDLE' | 'PLAYING' | 'GAME_OVER';

/** Reason the game ended — explains the cause to the player. */
export type GameOverReason =
  | { kind: 'TILE_VALUE_LIMIT'; tile: Tile; value: number; bound: 'MIN' | 'MAX' }
  | { kind: 'RESHUFFLE_LIMIT'; reshuffles: number }
  | { kind: 'PLAYER_EXIT' };

/** A single leaderboard entry persisted across sessions. */
export interface LeaderboardEntry {
  readonly name: string;
  readonly score: number;
  readonly handsPlayed: number;
  readonly longestStreak: number;
  readonly playedAt: number;
}
