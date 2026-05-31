import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile, isNumberTile, tileLabel } from '../../../../core/models/tile.model';
import { TileValueService } from '../../../../core/services/tile-value.service';

export type TileSize = 'sm' | 'md' | 'lg';

/**
 * Mahjong tile renderer.
 *
 * - 100% programmatic SVG (zero asset weight, crisp at any size).
 * - Pure presentation: derives its displayed value from `TileValueService`
 *   so dynamic scaling on non-number tiles is reflected automatically.
 * - Three sizes: `sm` (history thumbnails), `md` (default), `lg` (current hand).
 *
 * Faces are split into small, named templates inside this file so that adding
 * a new suit/wind/dragon is a single template + a switch-case in the SVG.
 */
@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.scss',
})
export class TileComponent {
  @Input({ required: true }) tile!: Tile;
  @Input() size: TileSize = 'md';
  /** When false, the value badge is hidden (used for shuffle animations etc.) */
  @Input() showBadge = true;
  /** When true, plays a subtle reveal/flip animation. */
  @Input() reveal = false;

  private readonly tileValues = inject(TileValueService);

  readonly value = computed(() => this.tileValues.getValue(this.tile));
  readonly isNonNumber = computed(() => !isNumberTile(this.tile));

  readonly suitClass = computed(() => {
    switch (this.tile.kind) {
      case 'NUMBER':
        return `suit-${this.tile.suit.toLowerCase()}`;
      case 'WIND':
        return 'suit-wind';
      case 'DRAGON':
        return `suit-dragon-${this.tile.dragon.toLowerCase()}`;
    }
  });

  readonly ariaLabel = computed(() => `${tileLabel(this.tile)} (value ${this.value()})`);

  /** Dot positions for the Circle suit (Pinzi) — 100×130 face viewport. */
  readonly circlePositions = computed<{ x: number; y: number }[]>(() => {
    if (this.tile.kind !== 'NUMBER' || this.tile.suit !== 'CIRCLE') return [];
    return CIRCLE_LAYOUTS[this.tile.number] ?? [];
  });

  /** Stick positions for the Bamboo suit (Souzi) — 100×130 face viewport. */
  readonly bambooPositions = computed<{ x: number; y: number }[]>(() => {
    if (this.tile.kind !== 'NUMBER' || this.tile.suit !== 'BAMBOO') return [];
    return BAMBOO_LAYOUTS[this.tile.number] ?? [];
  });

  /** Top numeric glyph for Character (Manzu) tiles — e.g. 5 → "五". */
  readonly characterTop = computed(() => {
    if (this.tile.kind !== 'NUMBER' || this.tile.suit !== 'CHARACTER') return '';
    return CHINESE_NUMERALS[this.tile.number] ?? '';
  });

  /** Glyph for wind tiles. */
  readonly windGlyph = computed(() => {
    if (this.tile.kind !== 'WIND') return '';
    return WIND_GLYPHS[this.tile.wind];
  });

  /** Glyph for dragon tiles. */
  readonly dragonGlyph = computed(() => {
    if (this.tile.kind !== 'DRAGON') return '';
    return DRAGON_GLYPHS[this.tile.dragon];
  });
}

// === Static layout data =====================================================

const CHINESE_NUMERALS: Record<number, string> = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
  6: '六', 7: '七', 8: '八', 9: '九',
};

const WIND_GLYPHS: Record<string, string> = {
  EAST: '東', SOUTH: '南', WEST: '西', NORTH: '北',
};

const DRAGON_GLYPHS: Record<string, string> = {
  RED: '中', GREEN: '發', WHITE: '☐',
};

// Layout coordinates within a 100 × 130 face area.
type Pt = { x: number; y: number };

const CIRCLE_LAYOUTS: Record<number, Pt[]> = {
  1: [{ x: 50, y: 65 }],
  2: [{ x: 50, y: 35 }, { x: 50, y: 95 }],
  3: [{ x: 30, y: 35 }, { x: 50, y: 65 }, { x: 70, y: 95 }],
  4: [
    { x: 30, y: 35 }, { x: 70, y: 35 },
    { x: 30, y: 95 }, { x: 70, y: 95 },
  ],
  5: [
    { x: 30, y: 35 }, { x: 70, y: 35 },
    { x: 50, y: 65 },
    { x: 30, y: 95 }, { x: 70, y: 95 },
  ],
  6: [
    { x: 30, y: 30 }, { x: 70, y: 30 },
    { x: 30, y: 65 }, { x: 70, y: 65 },
    { x: 30, y: 100 }, { x: 70, y: 100 },
  ],
  7: [
    { x: 30, y: 25 }, { x: 70, y: 25 },
    { x: 30, y: 55 }, { x: 50, y: 65 }, { x: 70, y: 75 },
    { x: 30, y: 105 }, { x: 70, y: 105 },
  ],
  8: [
    { x: 30, y: 22 }, { x: 70, y: 22 },
    { x: 30, y: 50 }, { x: 70, y: 50 },
    { x: 30, y: 80 }, { x: 70, y: 80 },
    { x: 30, y: 108 }, { x: 70, y: 108 },
  ],
  9: [
    { x: 28, y: 25 }, { x: 50, y: 25 }, { x: 72, y: 25 },
    { x: 28, y: 65 }, { x: 50, y: 65 }, { x: 72, y: 65 },
    { x: 28, y: 105 }, { x: 50, y: 105 }, { x: 72, y: 105 },
  ],
};

const BAMBOO_LAYOUTS: Record<number, Pt[]> = {
  1: [{ x: 50, y: 65 }],
  2: [{ x: 35, y: 65 }, { x: 65, y: 65 }],
  3: [{ x: 50, y: 30 }, { x: 35, y: 95 }, { x: 65, y: 95 }],
  4: [
    { x: 32, y: 35 }, { x: 68, y: 35 },
    { x: 32, y: 95 }, { x: 68, y: 95 },
  ],
  5: [
    { x: 30, y: 30 }, { x: 70, y: 30 },
    { x: 50, y: 65 },
    { x: 30, y: 100 }, { x: 70, y: 100 },
  ],
  6: [
    { x: 28, y: 30 }, { x: 50, y: 30 }, { x: 72, y: 30 },
    { x: 28, y: 100 }, { x: 50, y: 100 }, { x: 72, y: 100 },
  ],
  7: [
    { x: 50, y: 22 },
    { x: 28, y: 65 }, { x: 50, y: 65 }, { x: 72, y: 65 },
    { x: 28, y: 108 }, { x: 50, y: 108 }, { x: 72, y: 108 },
  ],
  8: [
    { x: 28, y: 22 }, { x: 50, y: 22 }, { x: 72, y: 22 },
    { x: 28, y: 65 }, { x: 72, y: 65 },
    { x: 28, y: 108 }, { x: 50, y: 108 }, { x: 72, y: 108 },
  ],
  9: [
    { x: 28, y: 25 }, { x: 50, y: 25 }, { x: 72, y: 25 },
    { x: 28, y: 65 }, { x: 50, y: 65 }, { x: 72, y: 65 },
    { x: 28, y: 105 }, { x: 50, y: 105 }, { x: 72, y: 105 },
  ],
};
