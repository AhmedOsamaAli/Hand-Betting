import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideTrophy, LucideRotateCcw, LucideHouse, LucideSave } from '@lucide/angular';
import { TileComponent } from '../tile/tile.component';
import { GameOverReason, LeaderboardEntry } from '../../../../core/models/game-state.model';
import { tileLabel } from '../../../../core/models/tile.model';

/**
 * End-of-game modal — explains why the game ended, shows the final stats,
 * and lets the player save to the leaderboard.
 */
@Component({
  selector: 'app-game-over-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideTrophy, LucideRotateCcw, LucideHouse, LucideSave, TileComponent],
  templateUrl: './game-over-dialog.component.html',
  styleUrl: './game-over-dialog.component.scss',
})
export class GameOverDialogComponent {
  @Input({ required: true }) reason!: GameOverReason;
  @Input({ required: true }) score = 0;
  @Input({ required: true }) handsPlayed = 0;
  @Input({ required: true }) longestStreak = 0;
  @Input() qualifies = false;
  @Input() alreadySaved = false;

  @Output() save = new EventEmitter<LeaderboardEntry>();
  @Output() playAgain = new EventEmitter<void>();
  @Output() backToLanding = new EventEmitter<void>();

  readonly playerName = signal('');

  readonly canSave = computed(() => this.playerName().trim().length > 0 && !this.alreadySaved);

  readonly headline = computed(() => {
    switch (this.reason.kind) {
      case 'TILE_VALUE_LIMIT':
        return this.reason.bound === 'MAX'
          ? 'Tile value maxed out'
          : 'Tile value bottomed out';
      case 'RESHUFFLE_LIMIT':
        return 'The deck is exhausted';
      case 'PLAYER_EXIT':
        return 'You ended the game';
    }
  });

  readonly subline = computed(() => {
    switch (this.reason.kind) {
      case 'TILE_VALUE_LIMIT':
        return `${tileLabel(this.reason.tile)} reached ${this.reason.value}.`;
      case 'RESHUFFLE_LIMIT':
        return `The draw pile has been reshuffled ${this.reason.reshuffles} times — game over.`;
      case 'PLAYER_EXIT':
        return 'Thanks for playing!';
    }
  });

  submit(): void {
    if (!this.canSave()) return;
    this.save.emit({
      name: this.playerName().trim().slice(0, 20),
      score: this.score,
      handsPlayed: this.handsPlayed,
      longestStreak: this.longestStreak,
      playedAt: Date.now(),
    });
  }
}
