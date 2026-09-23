import { Injectable, signal, computed } from '@angular/core';
import { Tile } from '../models/tile.model';
import { shuffle } from '../utils/shuffle.util';
import { buildDeck } from '../utils/deck-builder.util';

/**
 * Owns the *physical* state of the deck during a game:
 *  - the `drawPile` you draw from
 *  - the `discardPile` of played tiles
 *  - the number of times the draw pile has become empty
 *
 * Reshuffle policy (from the spec): when the draw pile runs out, a fresh deck
 * is added to the discard pile and the combined stack is shuffled. The
 * configured terminal exhaustion ends the game before another deck is added.
 */
@Injectable({ providedIn: 'root' })
export class DeckService {
  private readonly drawPile = signal<readonly Tile[]>([]);
  private readonly discardPile = signal<readonly Tile[]>([]);
  private readonly drawPileExhaustions = signal(0);

  readonly drawCount = computed(() => this.drawPile().length);
  readonly discardCount = computed(() => this.discardPile().length);
  readonly drawPileExhaustionCount = computed(() => this.drawPileExhaustions());

  /** Inject a custom RNG for tests; defaults to Math.random. */
  private rng: () => number = Math.random;

  /** Begin a brand-new game state. */
  initialize(rng: () => number = Math.random): void {
    this.rng = rng;
    this.drawPile.set(shuffle(buildDeck(0), this.rng));
    this.discardPile.set([]);
    this.drawPileExhaustions.set(0);
  }

  /**
   * Draw `count` tiles from the top of the draw pile, refilling on the fly if
   * it depletes mid-draw. Returns `null` when the configured exhaustion limit
   * is reached; that terminal exhaustion does not add another fresh deck.
   */
  draw(count: number, maxExhaustions: number): readonly Tile[] | null {
    const drawn: Tile[] = [];

    while (drawn.length < count) {
      if (this.drawPile().length === 0 && !this.handleExhaustion(maxExhaustions)) return null;

      const pile = [...this.drawPile()];
      drawn.push(pile.pop()!);
      this.drawPile.set(pile);

      if (pile.length === 0 && !this.handleExhaustion(maxExhaustions)) return null;
    }

    return drawn;
  }

  /** Move a set of tiles to the discard pile. */
  discard(tiles: readonly Tile[]): void {
    this.discardPile.set([...this.discardPile(), ...tiles]);
  }

  /**
   * Combine the discard pile + a fresh deck, shuffle, and make it the new
   * draw pile. The deck generation gives every newly-created tile a unique id.
   */
  private performReshuffle(deckGeneration: number): void {
    const combined = [...this.discardPile(), ...buildDeck(deckGeneration)];
    this.drawPile.set(shuffle(combined, this.rng));
    this.discardPile.set([]);
  }

  /** Record a runout, then refill unless this is the terminal exhaustion. */
  private handleExhaustion(maxExhaustions: number): boolean {
    if (this.drawPileExhaustions() >= maxExhaustions) return false;

    const exhaustionCount = this.drawPileExhaustions() + 1;
    this.drawPileExhaustions.set(exhaustionCount);
    if (exhaustionCount >= maxExhaustions) return false;

    this.performReshuffle(exhaustionCount);
    return this.drawPile().length > 0;
  }
}
