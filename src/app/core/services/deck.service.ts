import { Injectable, signal, computed } from '@angular/core';
import { Tile } from '../models/tile.model';
import { shuffle } from '../utils/shuffle.util';
import { buildDeck } from '../utils/deck-builder.util';

/**
 * Owns the *physical* state of the deck during a game:
 *  - the `drawPile` you draw from
 *  - the `discardPile` of played tiles
 *  - the `reshuffleCount` of how many times the draw pile has been refilled
 *
 * Reshuffle policy (from the spec): when the draw pile runs out, a fresh deck
 * is added in along with the existing discard pile, the combined stack is
 * shuffled, and that becomes the new draw pile.
 */
@Injectable({ providedIn: 'root' })
export class DeckService {
  private readonly drawPile = signal<readonly Tile[]>([]);
  private readonly discardPile = signal<readonly Tile[]>([]);
  private readonly reshuffles = signal(0);

  readonly drawCount = computed(() => this.drawPile().length);
  readonly discardCount = computed(() => this.discardPile().length);
  readonly reshuffleCount = computed(() => this.reshuffles());

  /** Inject a custom RNG for tests; defaults to Math.random. */
  private rng: () => number = Math.random;

  /** Begin a brand-new game state. */
  initialize(rng: () => number = Math.random): void {
    this.rng = rng;
    this.drawPile.set(shuffle(buildDeck(), this.rng));
    this.discardPile.set([]);
    this.reshuffles.set(0);
  }

  /**
   * Draw `count` tiles from the top of the draw pile, reshuffling on the fly
   * if it depletes mid-draw. Returns either the drawn tiles, or `null` if a
   * reshuffle was *needed* but the reshuffle cap has been reached.
   */
  draw(count: number, maxReshuffles: number): readonly Tile[] | null {
    const drawn: Tile[] = [];

    while (drawn.length < count) {
      if (this.drawPile().length === 0) {
        const canReshuffle = this.reshuffles() < maxReshuffles;
        if (!canReshuffle) return null;
        this.performReshuffle();
        // Safety: if even after reshuffle we have nothing, abort.
        if (this.drawPile().length === 0) return null;
      }
      const pile = [...this.drawPile()];
      drawn.push(pile.pop()!);
      this.drawPile.set(pile);
    }

    return drawn;
  }

  /** Move a set of tiles to the discard pile. */
  discard(tiles: readonly Tile[]): void {
    this.discardPile.set([...this.discardPile(), ...tiles]);
  }

  /**
   * Combine the discard pile + a fresh deck, shuffle, and make it the new
   * draw pile. Increments the reshuffle counter.
   */
  private performReshuffle(): void {
    const combined = [...this.discardPile(), ...buildDeck()];
    this.drawPile.set(shuffle(combined, this.rng));
    this.discardPile.set([]);
    this.reshuffles.update((n) => n + 1);
  }
}
