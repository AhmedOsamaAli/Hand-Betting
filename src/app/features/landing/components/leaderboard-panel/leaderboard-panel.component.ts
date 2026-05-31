import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideTrophy } from '@lucide/angular';
import { LeaderboardEntry } from '../../../../core/models/game-state.model';

/**
 * Pure UI: shows the top scores.
 */
@Component({
  selector: 'app-leaderboard-panel',
  standalone: true,
  imports: [CommonModule, DatePipe, LucideTrophy],
  templateUrl: './leaderboard-panel.component.html',
  styleUrl: './leaderboard-panel.component.scss',
})
export class LeaderboardPanelComponent {
  @Input() entries: readonly LeaderboardEntry[] = [];

  rankClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return '';
  }
}
