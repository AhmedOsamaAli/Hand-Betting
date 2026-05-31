import { buildDeck, DECK_SIZE, COPIES_PER_TILE } from './deck-builder.util';
import { isNumberTile } from '../models/tile.model';

describe('buildDeck', () => {
  it('produces a deck of the expected size (136 tiles)', () => {
    expect(DECK_SIZE).toBe(136);
    expect(buildDeck().length).toBe(136);
  });

  it('produces exactly 4 copies of every tile face', () => {
    const deck = buildDeck();
    const counts = new Map<string, number>();
    for (const tile of deck) {
      const key = tile.id.split('#')[0];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const [, count] of counts) {
      expect(count).toBe(COPIES_PER_TILE);
    }
  });

  it('gives every tile a unique id', () => {
    const deck = buildDeck();
    const ids = new Set(deck.map((t) => t.id));
    expect(ids.size).toBe(deck.length);
  });

  it('includes 108 number tiles, 16 winds, 12 dragons', () => {
    const deck = buildDeck();
    const numbers = deck.filter(isNumberTile);
    const winds = deck.filter((t) => t.kind === 'WIND');
    const dragons = deck.filter((t) => t.kind === 'DRAGON');
    expect(numbers.length).toBe(108);
    expect(winds.length).toBe(16);
    expect(dragons.length).toBe(12);
  });
});
