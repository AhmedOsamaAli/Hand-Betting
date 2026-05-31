import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideLayers, LucideTrash2, LucideRepeat } from '@lucide/angular';
import { GAME_CONFIG } from '../../../../core/constants/game-config';

/**
 * Read-only status strip showing deck health.
 */
@Component({
  selector: 'app-deck-status',
  standalone: true,
  imports: [CommonModule, LucideLayers, LucideTrash2, LucideRepeat],
  templateUrl: './deck-status.component.html',
  styleUrl: './deck-status.component.scss',
})
export class DeckStatusComponent {
  @Input({ required: true }) drawCount = 0;
  @Input({ required: true }) discardCount = 0;
  @Input({ required: true }) reshuffleCount = 0;

  readonly maxReshuffles = GAME_CONFIG.MAX_RESHUFFLES;
}
