import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideArrowUp, LucideArrowDown } from '@lucide/angular';
import { HandComponent } from '../hand/hand.component';
import { HandRecord, BetOutcome } from '../../../../core/models/hand.model';

/**
 * Reverse-chronological list of past rounds with mini-tile thumbnails.
 *
 * Receives the full history; renders only the {@link MAX_VISIBLE} most-recent
 * rounds so the panel stays compact and never crowds the play area.
 */
@Component({
  selector: 'app-history-panel',
  standalone: true,
  imports: [CommonModule, LucideArrowUp, LucideArrowDown, HandComponent],
  templateUrl: './history-panel.component.html',
  styleUrl: './history-panel.component.scss',
})
export class HistoryPanelComponent {
  @Input({ required: true }) history: readonly HandRecord[] = [];

  /** Cap on how many recent rounds are rendered. */
  readonly MAX_VISIBLE = 3;

  /** Most-recent first, capped at {@link MAX_VISIBLE} rounds. */
  recent(): HandRecord[] {
    return [...this.history].reverse().slice(0, this.MAX_VISIBLE);
  }

  outcomeClass(outcome: BetOutcome | null): string {
    if (!outcome) return 'opening';
    return outcome.toLowerCase();
  }

  outcomeLabel(outcome: BetOutcome | null): string {
    switch (outcome) {
      case 'WIN': return 'Won';
      case 'LOSS': return 'Lost';
      case 'PUSH': return 'Push';
      default: return 'Opening';
    }
  }
}
