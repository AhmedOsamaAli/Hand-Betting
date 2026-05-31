import { Component, OnInit, OnDestroy, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideX, LucideFlame } from '@lucide/angular';
import { GameService } from '../../core/services/game.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { SoundService } from '../../core/services/sound.service';
import { HandComponent } from './components/hand/hand.component';
import { BettingControlsComponent } from './components/betting-controls/betting-controls.component';
import { DeckStatusComponent } from './components/deck-status/deck-status.component';
import { HistoryPanelComponent } from './components/history-panel/history-panel.component';
import { GameOverDialogComponent } from './components/game-over-dialog/game-over-dialog.component';
import { ControlsToggleComponent } from '../../shared/controls-toggle/controls-toggle.component';
import { Bet } from '../../core/models/hand.model';
import { LeaderboardEntry } from '../../core/models/game-state.model';

/**
 * Game screen.
 *
 * Acts as a thin orchestrator:
 *  - Subscribes to `GameService` signals for read state.
 *  - Forwards user actions (bet / exit / play again) to `GameService`.
 *  - Plays sound effects in response to state changes via an `effect()`.
 *  - Hands leaderboard saves to `LeaderboardService`.
 */
@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    LucideX,
    LucideFlame,
    HandComponent,
    BettingControlsComponent,
    DeckStatusComponent,
    HistoryPanelComponent,
    GameOverDialogComponent,
    ControlsToggleComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  readonly game = inject(GameService);
  private readonly leaderboard = inject(LeaderboardService);
  private readonly sound = inject(SoundService);
  private readonly router = inject(Router);

  readonly savedToLeaderboard = signal(false);

  /** Snapshot of the last outcome — drives the win/loss flash overlay. */
  readonly lastOutcome = computed(() => this.game.history().at(-1)?.outcome ?? null);

  /** Does this run qualify for the leaderboard? */
  readonly qualifies = computed(() => this.leaderboard.qualifies(this.game.score()));

  /** Latest leaderboard data, refreshed when the player saves. */
  readonly latestLeaderboard = signal(this.leaderboard.topEntries());

  constructor() {
    // Play sounds in response to state transitions.
    let prevHistoryLength = 0;
    let prevStatus = this.game.status();

    effect(() => {
      const history = this.game.history();
      const len = history.length;

      // A new hand was added → tile sound + outcome sound.
      if (len > prevHistoryLength) {
        this.sound.play('tile');
        const outcome = history.at(-1)?.outcome;
        if (outcome === 'WIN') this.sound.play('win');
        else if (outcome === 'LOSS') this.sound.play('loss');
      }
      prevHistoryLength = len;
    });

    effect(() => {
      const status = this.game.status();
      if (status === 'GAME_OVER' && prevStatus !== 'GAME_OVER') {
        this.sound.play('gameOver');
      }
      prevStatus = status;
    });
  }

  ngOnInit(): void {
    // Auto-start on page entry — players don't need an extra click.
    if (this.game.status() !== 'PLAYING') {
      this.startNewGame();
    }
  }

  ngOnDestroy(): void {
    if (this.game.status() === 'PLAYING') {
      this.game.exitGame();
    }
  }

  startNewGame(): void {
    this.savedToLeaderboard.set(false);
    this.game.startGame();
  }

  onBet(bet: Bet): void {
    this.game.placeBet(bet);
  }

  exitToLanding(): void {
    this.sound.play('click');
    this.game.exitGame();
    this.router.navigate(['/']);
  }

  onSave(entry: LeaderboardEntry): void {
    this.leaderboard.save(entry);
    this.savedToLeaderboard.set(true);
    this.latestLeaderboard.set(this.leaderboard.topEntries());
  }

  onPlayAgain(): void {
    this.startNewGame();
  }

  onBackToLanding(): void {
    this.router.navigate(['/']);
  }
}
