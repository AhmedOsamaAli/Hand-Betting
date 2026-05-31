/**
 * Tile domain model.
 *
 * Mahjong tile taxonomy used in this game:
 *  - Number tiles: three suits (bamboo, circle, character) × 9 values × 4 copies
 *  - Wind tiles: 4 winds × 4 copies (non-number, dynamic value)
 *  - Dragon tiles: 3 dragons × 4 copies (non-number, dynamic value)
 *
 * Each physical tile (a single copy) is represented by a unique `Tile` with a
 * stable `id`. The `id` is what `TileValueService` uses to track the dynamic
 * value of non-number tiles across hands.
 */

/** Top-level tile category. */
export type TileKind = 'NUMBER' | 'WIND' | 'DRAGON';

/** Number-suit identifier. */
export type NumberSuit = 'BAMBOO' | 'CIRCLE' | 'CHARACTER';

/** Wind identifier. */
export type Wind = 'EAST' | 'SOUTH' | 'WEST' | 'NORTH';

/** Dragon identifier. */
export type Dragon = 'RED' | 'GREEN' | 'WHITE';

/** Discriminated union of the three tile shapes. */
export type Tile = NumberTile | WindTile | DragonTile;

export interface BaseTile {
  /** Globally unique id across the deck instance (e.g. "BAMBOO-5#2"). */
  readonly id: string;
  readonly kind: TileKind;
}

export interface NumberTile extends BaseTile {
  readonly kind: 'NUMBER';
  readonly suit: NumberSuit;
  /** 1..9 */
  readonly number: number;
}

export interface WindTile extends BaseTile {
  readonly kind: 'WIND';
  readonly wind: Wind;
}

export interface DragonTile extends BaseTile {
  readonly kind: 'DRAGON';
  readonly dragon: Dragon;
}

/** Convenience type-guards. */
export const isNumberTile = (t: Tile): t is NumberTile => t.kind === 'NUMBER';
export const isNonNumberTile = (t: Tile): t is WindTile | DragonTile =>
  t.kind === 'WIND' || t.kind === 'DRAGON';

/**
 * Stable identity key for a tile *kind* (ignores copy index). Used by
 * `TileValueService` to share value across all copies of the same wind/dragon.
 *
 * Example: "WIND:EAST", "DRAGON:RED", "NUMBER:BAMBOO:5"
 */
export function tileKey(tile: Tile): string {
  switch (tile.kind) {
    case 'NUMBER':
      return `NUMBER:${tile.suit}:${tile.number}`;
    case 'WIND':
      return `WIND:${tile.wind}`;
    case 'DRAGON':
      return `DRAGON:${tile.dragon}`;
  }
}

/** Human-readable label, useful for accessibility & history view. */
export function tileLabel(tile: Tile): string {
  switch (tile.kind) {
    case 'NUMBER':
      return `${tile.number} of ${tile.suit.toLowerCase()}`;
    case 'WIND':
      return `${capitalize(tile.wind)} Wind`;
    case 'DRAGON':
      return `${capitalize(tile.dragon)} Dragon`;
  }
}

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
