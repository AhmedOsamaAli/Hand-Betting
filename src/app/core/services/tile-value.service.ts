import { Injectable, signal, computed } from '@angular/core';
import { Tile, isNumberTile } from '../models/tile.model';
import { Hand, BetOutcome } from '../models/hand.model';
import { GAME_CONFIG } from '../constants/game-config';

/**
 * Owns the *dynamic value* of every tile in the current game session.
 *
 * Number tiles: value === face number (static).
 *
 * Non-number tiles (winds & dragons): start at `BASE_NON_NUMBER_VALUE` and
 * shift ±1 each time the tile participates in a winning / losing hand.
 *
 * Scaling is tracked **per individual tile instance** (by `tile.id`), so two
 * copies of the same Red Dragon can independently drift to different values.
 * This matches the requirement: "specific to that tile".
 *
 * The service exposes a signal so the UI re-renders when values change.
 */
@Injectable({ providedIn: 'root' })
export class TileValueService {
  /** Map of tile id → current value (only non-number tiles are tracked). */
  private readonly values = signal<ReadonlyMap<string, number>>(new Map());

  /** Reactive snapshot consumed by tile components for live badges. */
  readonly valuesSignal = computed(() => this.values());

  /** Reset all dynamic values — call at the start of a new game. */
  reset(): void {
    this.values.set(new Map());
  }

  /**
   * Returns the current value of any tile (number → face value;
   * non-number → tracked or base value).
   */
  getValue(tile: Tile): number {
    if (isNumberTile(tile)) return tile.number;
    return this.values().get(tile.id) ?? GAME_CONFIG.BASE_NON_NUMBER_VALUE;
  }

  /** Sum the values of every tile in a hand. */
  totalOf(hand: Hand): number {
    return hand.reduce((sum, t) => sum + this.getValue(t), 0);
  }

  /**
   * Apply an outcome to every non-number tile in the hand. Returns the list of
   * tiles whose new value crossed `TILE_VALUE_MIN`/`MAX` — the game layer uses
   * this to detect game-over.
   */
  applyOutcome(hand: Hand, outcome: BetOutcome): { tile: Tile; value: number; bound: 'MIN' | 'MAX' }[] {
    if (outcome === 'PUSH') return [];

    const delta = outcome === 'WIN' ? +1 : -1;
    const next = new Map(this.values());
    const limitHits: { tile: Tile; value: number; bound: 'MIN' | 'MAX' }[] = [];

    for (const tile of hand) {
      if (isNumberTile(tile)) continue;
      const current = next.get(tile.id) ?? GAME_CONFIG.BASE_NON_NUMBER_VALUE;
      const updated = current + delta;
      next.set(tile.id, updated);

      if (updated <= GAME_CONFIG.TILE_VALUE_MIN) {
        limitHits.push({ tile, value: updated, bound: 'MIN' });
      } else if (updated >= GAME_CONFIG.TILE_VALUE_MAX) {
        limitHits.push({ tile, value: updated, bound: 'MAX' });
      }
    }

    this.values.set(next);
    return limitHits;
  }
}
