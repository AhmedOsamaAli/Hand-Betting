import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucidePlay, LucideSparkles } from '@lucide/angular';
import { LeaderboardPanelComponent } from './components/leaderboard-panel/leaderboard-panel.component';
import { ControlsToggleComponent } from '../../shared/controls-toggle/controls-toggle.component';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { SoundService } from '../../core/services/sound.service';

/**
 * Landing page — entry point of the app.
 *  - "New Game" button → /game
 *  - Top-5 leaderboard panel
 *  - Subtle decorative background
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucidePlay,
    LucideSparkles,
    LeaderboardPanelComponent,
    ControlsToggleComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private readonly leaderboard = inject(LeaderboardService);
  private readonly sound = inject(SoundService);
  private readonly router = inject(Router);

  readonly entries = signal(this.leaderboard.topEntries());

  startGame(): void {
    this.sound.play('click');
    this.router.navigate(['/game']);
  }
}
