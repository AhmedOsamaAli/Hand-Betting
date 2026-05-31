import { Tile } from './tile.model';

/** A hand is a fixed-size ordered list of tiles drawn together. */
export type Hand = readonly Tile[];

/** Direction of a bet placed by the player. */
export type Bet = 'HIGHER' | 'LOWER';

/** Outcome of evaluating a bet against the next hand. */
export type BetOutcome = 'WIN' | 'LOSS' | 'PUSH';

/**
 * Snapshot of a single completed round, kept for the history view and for
 * end-of-game analytics.
 */
export interface HandRecord {
  readonly hand: Hand;
  readonly total: number;
  /** Bet placed BEFORE this hand was revealed; null for the very first hand. */
  readonly bet: Bet | null;
  /** Outcome of `bet` against this hand vs. the previous one. */
  readonly outcome: BetOutcome | null;
  readonly timestamp: number;
}
