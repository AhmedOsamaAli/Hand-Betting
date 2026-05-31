import { Tile, NumberSuit, Wind, Dragon } from '../models/tile.model';

/** Mahjong deck factory — produces a fresh standard 136-tile set. */
export const NUMBER_SUITS: readonly NumberSuit[] = ['BAMBOO', 'CIRCLE', 'CHARACTER'];
export const WINDS: readonly Wind[] = ['EAST', 'SOUTH', 'WEST', 'NORTH'];
export const DRAGONS: readonly Dragon[] = ['RED', 'GREEN', 'WHITE'];
export const COPIES_PER_TILE = 4;
export const NUMBER_RANGE = { min: 1, max: 9 } as const;

/**
 * Build a fresh deck (no shuffling). Each tile gets a deterministic id of the
 * form `{KEY}#{copyIndex}` so the same physical tile is identifiable across
 * reshuffles within a single game session.
 */
export function buildDeck(): Tile[] {
  const tiles: Tile[] = [];

  for (const suit of NUMBER_SUITS) {
    for (let n = NUMBER_RANGE.min; n <= NUMBER_RANGE.max; n++) {
      for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
        tiles.push({
          id: `NUMBER:${suit}:${n}#${copy}`,
          kind: 'NUMBER',
          suit,
          number: n,
        });
      }
    }
  }

  for (const wind of WINDS) {
    for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
      tiles.push({
        id: `WIND:${wind}#${copy}`,
        kind: 'WIND',
        wind,
      });
    }
  }

  for (const dragon of DRAGONS) {
    for (let copy = 0; copy < COPIES_PER_TILE; copy++) {
      tiles.push({
        id: `DRAGON:${dragon}#${copy}`,
        kind: 'DRAGON',
        dragon,
      });
    }
  }

  return tiles;
}

/** Total tile count of a standard fresh deck. */
export const DECK_SIZE: number =
  NUMBER_SUITS.length * (NUMBER_RANGE.max - NUMBER_RANGE.min + 1) * COPIES_PER_TILE +
  WINDS.length * COPIES_PER_TILE +
  DRAGONS.length * COPIES_PER_TILE;
