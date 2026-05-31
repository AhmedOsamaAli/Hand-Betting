import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideX,
  LucideCheck,
  LucideArrowLeft,
  LucideArrowRight,
  LucideLayers,
  LucideFlame,
  LucideRepeat,
  LucideLogOut,
  LucideTrash2,
} from '@lucide/angular';
import { TileComponent } from '../../features/game/components/tile/tile.component';
import { HelpService } from '../../core/services/help.service';
import { Tile } from '../../core/models/tile.model';
import { GAME_CONFIG } from '../../core/constants/game-config';

/**
 * "How to play" guide — a paged walkthrough that introduces the tiles, the
 * bet, the scoring system and the game over rules to a complete beginner.
 *
 * Behaviour:
 *  - Rendered globally in the app shell; only paints when `help.isOpen()`.
 *  - Slides through {@link totalPages} pages with Back / Next controls.
 *  - Resets to page 0 every time the dialog is opened.
 *  - Arrow keys navigate; Escape closes; "Got it" (last page) closes & marks seen.
 *  - Auto-opens for first-time visitors (handled by `HelpService.maybeShowIntro`).
 *
 * Accessibility:
 *  - `role="dialog"` + `aria-modal="true"` so screen readers know it's modal.
 *  - `aria-labelledby` points at the slide title so context updates each page.
 *  - Page indicator dots are buttons with `aria-label` and `aria-current`.
 */
@Component({
  selector: 'app-how-to-play-dialog',
  standalone: true,
  imports: [
    CommonModule,
    LucideX,
    LucideCheck,
    LucideArrowLeft,
    LucideArrowRight,
    LucideLayers,
    LucideFlame,
    LucideRepeat,
    LucideLogOut,
    LucideTrash2,
    TileComponent,
  ],
  templateUrl: './how-to-play-dialog.component.html',
  styleUrl: './how-to-play-dialog.component.scss',
})
export class HowToPlayDialogComponent {
  readonly help = inject(HelpService);
  readonly maxReshuffles = GAME_CONFIG.MAX_RESHUFFLES;
  readonly handSize = GAME_CONFIG.HAND_SIZE;
  readonly baseHonorValue = GAME_CONFIG.BASE_NON_NUMBER_VALUE;
  readonly tileMin = GAME_CONFIG.TILE_VALUE_MIN;
  readonly tileMax = GAME_CONFIG.TILE_VALUE_MAX;
  readonly streakBonuses = GAME_CONFIG.STREAK_BONUSES;

  /** Total number of slides in the walkthrough. */
  readonly totalPages = 8;

  readonly currentPage = signal(0);
  readonly canGoPrev = computed(() => this.currentPage() > 0);
  readonly canGoNext = computed(() => this.currentPage() < this.totalPages - 1);
  readonly isLastPage = computed(() => this.currentPage() === this.totalPages - 1);

  /** Pre-computed [0..totalPages-1] for the dot indicator. */
  readonly pageIndices: readonly number[] = Array.from({ length: this.totalPages }, (_, i) => i);

  /**
   * All sample tiles use `GUIDE-*` ids so they never collide with real deck
   * instances. `TileValueService` falls back to the base value for any id it
   * does not know about, so Winds/Dragons in the guide always display 5.
   */
  readonly numberTiles: readonly { tile: Tile; label: string }[] = [
    { tile: { id: 'GUIDE-CIRCLE-3', kind: 'NUMBER', suit: 'CIRCLE', number: 3 }, label: 'Circles' },
    { tile: { id: 'GUIDE-BAMBOO-5', kind: 'NUMBER', suit: 'BAMBOO', number: 5 }, label: 'Bamboo' },
    { tile: { id: 'GUIDE-CHARACTER-7', kind: 'NUMBER', suit: 'CHARACTER', number: 7 }, label: 'Characters' },
  ];

  readonly windTiles: readonly { tile: Tile; label: string }[] = [
    { tile: { id: 'GUIDE-WIND-EAST', kind: 'WIND', wind: 'EAST' }, label: 'East' },
    { tile: { id: 'GUIDE-WIND-SOUTH', kind: 'WIND', wind: 'SOUTH' }, label: 'South' },
    { tile: { id: 'GUIDE-WIND-WEST', kind: 'WIND', wind: 'WEST' }, label: 'West' },
    { tile: { id: 'GUIDE-WIND-NORTH', kind: 'WIND', wind: 'NORTH' }, label: 'North' },
  ];

  readonly dragonTiles: readonly { tile: Tile; label: string }[] = [
    { tile: { id: 'GUIDE-DRAGON-RED', kind: 'DRAGON', dragon: 'RED' }, label: 'Red' },
    { tile: { id: 'GUIDE-DRAGON-GREEN', kind: 'DRAGON', dragon: 'GREEN' }, label: 'Green' },
    { tile: { id: 'GUIDE-DRAGON-WHITE', kind: 'DRAGON', dragon: 'WHITE' }, label: 'White' },
  ];

  /** Hand used to demo "Read your hand" and "Place a bet". */
  readonly exampleHand: readonly Tile[] = [
    { id: 'GUIDE-CIRCLE-7', kind: 'NUMBER', suit: 'CIRCLE', number: 7 },
    { id: 'GUIDE-BAMBOO-5', kind: 'NUMBER', suit: 'BAMBOO', number: 5 },
    { id: 'GUIDE-WIND-EAST', kind: 'WIND', wind: 'EAST' },
  ];

  /** A larger sample hand for the "higher" bet illustration. */
  readonly biggerHand: readonly Tile[] = [
    { id: 'GUIDE-CHARACTER-9', kind: 'NUMBER', suit: 'CHARACTER', number: 9 },
    { id: 'GUIDE-CIRCLE-4', kind: 'NUMBER', suit: 'CIRCLE', number: 4 },
    { id: 'GUIDE-DRAGON-RED', kind: 'DRAGON', dragon: 'RED' },
  ];

  readonly exampleHandTotal = 7 + 5 + this.baseHonorValue;
  readonly biggerHandTotal = 9 + 4 + this.baseHonorValue;

  constructor() {
    // Restart the walkthrough every time the dialog opens. Without this the
    // user could close on slide 5, reopen, and land mid-tour with no context.
    // `allowSignalWrites` is required because we react to one signal
    // (`help.isOpen`) by writing another (`currentPage`).
    effect(
      () => {
        if (this.help.isOpen()) {
          this.currentPage.set(0);
        }
      },
      { allowSignalWrites: true },
    );
  }

  next(): void {
    if (this.canGoNext()) {
      this.currentPage.update((n) => n + 1);
    } else {
      this.help.close();
    }
  }

  prev(): void {
    if (this.canGoPrev()) {
      this.currentPage.update((n) => n - 1);
    }
  }

  goTo(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage.set(page);
    }
  }

  /** Closes on Escape — only when the dialog is actually open. */
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (!this.help.isOpen()) return;
    event.stopPropagation();
    this.help.close();
  }

  /** ArrowRight → next slide (no wrap; stops at last page). */
  @HostListener('document:keydown.arrowRight', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    if (!this.help.isOpen() || !this.canGoNext()) return;
    event.preventDefault();
    this.next();
  }

  /** ArrowLeft → previous slide. */
  @HostListener('document:keydown.arrowLeft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    if (!this.help.isOpen() || !this.canGoPrev()) return;
    event.preventDefault();
    this.prev();
  }

  /** Backdrop click closes; clicks inside the modal panel do not. */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.help.close();
    }
  }
}
