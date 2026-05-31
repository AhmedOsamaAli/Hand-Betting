import { Injectable, inject, signal, computed } from '@angular/core';
import { DeckService } from './deck.service';
import { TileValueService } from './tile-value.service';
import { GAME_CONFIG } from '../constants/game-config';
import { Tile } from '../models/tile.model';
import { Bet, BetOutcome, Hand, HandRecord } from '../models/hand.model';
import { GameStatus, GameOverReason } from '../models/game-state.model';

/**
 * Orchestrates a single game session.
 *
 * Acts as the **single source of truth** for the UI: components read its
 * signals and call its action methods (`startGame`, `placeBet`, `exitGame`).
 * No game rule lives in the components.
 *
 * Architecture notes:
 *  - Bet evaluation is split out (`evaluateBet`) so additional bet types
 *    (e.g. "BET_EQUAL", "BET_EXACT") become one-line additions.
 *  - Game-over checks are a list of predicates (`gameOverRules`) so adding a
 *    new game-over rule is a one-line append — open/closed principle.
 *  - All randomness flows through one injectable RNG to keep tests
 *    deterministic.
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly deck = inject(DeckService);
  private readonly tileValues = inject(TileValueService);

  // ===== Reactive state ====================================================
  private readonly _status = signal<GameStatus>('IDLE');
  private readonly _currentHand = signal<Hand | null>(null);
  private readonly _history = signal<HandRecord[]>([]);
  private readonly _score = signal(0);
  private readonly _streak = signal(0);
  private readonly _longestStreak = signal(0);
  private readonly _gameOverReason = signal<GameOverReason | null>(null);

  /** Public read-only signals. */
  readonly status = this._status.asReadonly();
  readonly currentHand = this._currentHand.asReadonly();
  readonly history = this._history.asReadonly();
  readonly score = this._score.asReadonly();
  readonly streak = this._streak.asReadonly();
  readonly longestStreak = this._longestStreak.asReadonly();
  readonly gameOverReason = this._gameOverReason.asReadonly();

  /** Total of the currently-revealed hand (or null if no hand). */
  readonly currentTotal = computed(() => {
    const hand = this._currentHand();
    return hand ? this.tileValues.totalOf(hand) : null;
  });

  /** Convenience pass-throughs from `DeckService` for top-bar display. */
  readonly drawCount = this.deck.drawCount;
  readonly discardCount = this.deck.discardCount;
  readonly reshuffleCount = this.deck.reshuffleCount;
  readonly handsPlayed = computed(() => this._history().length);

  // ===== Lifecycle =========================================================

  /** Start (or restart) a game session and reveal the first hand. */
  startGame(rng: () => number = Math.random): void {
    this.deck.initialize(rng);
    this.tileValues.reset();
    this._currentHand.set(null);
    this._history.set([]);
    this._score.set(0);
    this._streak.set(0);
    this._longestStreak.set(0);
    this._gameOverReason.set(null);
    this._status.set('PLAYING');

    const opening = this.deck.draw(GAME_CONFIG.HAND_SIZE, GAME_CONFIG.MAX_RESHUFFLES);
    if (!opening) {
      this.endGame({ kind: 'RESHUFFLE_LIMIT', reshuffles: this.deck.reshuffleCount() });
      return;
    }

    this._currentHand.set(opening);
    this._history.set([
      {
        hand: opening,
        total: this.tileValues.totalOf(opening),
        bet: null,
        outcome: null,
        timestamp: Date.now(),
      },
    ]);
  }

  /** Player exits voluntarily — game ends without a leaderboard prompt. */
  exitGame(): void {
    if (this._status() !== 'PLAYING') return;
    this.endGame({ kind: 'PLAYER_EXIT' });
  }

  // ===== Player actions ====================================================

  /**
   * Place a bet, reveal the next hand, evaluate the outcome, update tile
   * values, score, streak, and check for game over.
   */
  placeBet(bet: Bet): void {
    if (this._status() !== 'PLAYING') return;
    const current = this._currentHand();
    if (!current) return;

    // 1. Draw the next hand (may trigger reshuffle).
    const next = this.deck.draw(GAME_CONFIG.HAND_SIZE, GAME_CONFIG.MAX_RESHUFFLES);
    if (!next) {
      this.endGame({ kind: 'RESHUFFLE_LIMIT', reshuffles: this.deck.reshuffleCount() });
      return;
    }

    // 2. Evaluate the bet.
    const currentTotal = this.tileValues.totalOf(current);
    const nextTotal = this.tileValues.totalOf(next);
    const outcome = this.evaluateBet(bet, currentTotal, nextTotal);

    // 3. Apply value scaling to non-number tiles in the NEW hand
    //    (per spec: tile values shift based on whether THAT hand won/lost).
    const limitHits = this.tileValues.applyOutcome(next, outcome);

    // 4. Discard the previous hand, advance to the new one.
    this.deck.discard(current);
    this._currentHand.set(next);

    // 5. Update score & streak.
    this.applyOutcomeToScore(outcome);

    // 6. Append to history (use the post-scaling total for accuracy).
    const finalTotal = this.tileValues.totalOf(next);
    this._history.update((h) => [
      ...h,
      {
        hand: next,
        total: finalTotal,
        bet,
        outcome,
        timestamp: Date.now(),
      },
    ]);

    // 7. Check game-over conditions.
    for (const rule of this.gameOverRules) {
      const reason = rule(limitHits);
      if (reason) {
        this.endGame(reason);
        return;
      }
    }
  }

  // ===== Rule extension points ============================================
  //
  // ↓ To add a new bet type: extend the `Bet` union, then add a branch here.
  /**
   * Pure function (no state mutation) — given a bet and the two totals,
   * return WIN / LOSS / PUSH.
   */
  private evaluateBet(bet: Bet, currentTotal: number, nextTotal: number): BetOutcome {
    if (nextTotal === currentTotal) return 'PUSH';
    const higher = nextTotal > currentTotal;
    switch (bet) {
      case 'HIGHER':
        return higher ? 'WIN' : 'LOSS';
      case 'LOWER':
        return higher ? 'LOSS' : 'WIN';
    }
  }

  // ↓ To add a new game-over rule: push another predicate into this array.
  private readonly gameOverRules: Array<
    (limitHits: { tile: Tile; value: number; bound: 'MIN' | 'MAX' }[]) => GameOverReason | null
  > = [
    // Rule 1: any non-number tile value reaches 0 or 10.
    (limitHits) => {
      if (limitHits.length === 0) return null;
      const hit = limitHits[0];
      return { kind: 'TILE_VALUE_LIMIT', tile: hit.tile, value: hit.value, bound: hit.bound };
    },
    // Rule 2: reshuffle cap reached. (Triggered by draw() returning null,
    // handled in startGame/placeBet, but kept here for explicit symmetry.)
    () => null,
  ];

  // ===== Helpers ==========================================================

  private applyOutcomeToScore(outcome: BetOutcome): void {
    if (outcome === 'WIN') {
      this._score.update((s) => s + 1);
      this._streak.update((s) => s + 1);
      this._longestStreak.update((l) => Math.max(l, this._streak()));
      this.awardStreakBonus(this._streak());
    } else if (outcome === 'LOSS') {
      this._streak.set(0);
    }
    // PUSH → no change.
  }

  /** Awards a bonus *exactly when* the streak length matches a threshold. */
  private awardStreakBonus(streakLength: number): void {
    const bonus = GAME_CONFIG.STREAK_BONUSES.find((b) => b.length === streakLength);
    if (bonus) this._score.update((s) => s + bonus.bonus);
  }

  private endGame(reason: GameOverReason): void {
    this._gameOverReason.set(reason);
    this._status.set('GAME_OVER');
  }
}
