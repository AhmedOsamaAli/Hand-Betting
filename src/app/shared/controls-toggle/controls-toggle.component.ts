import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideSun, LucideMoon, LucideVolume2, LucideVolumeX, LucideCircleHelp } from '@lucide/angular';
import { ThemeService } from '../../core/services/theme.service';
import { SoundService } from '../../core/services/sound.service';
import { HelpService } from '../../core/services/help.service';

/**
 * Compact pair of toggles (theme + sound + help) shown in the top-right of every page.
 * Purely cosmetic state — toggles persist via their respective services.
 */
@Component({
  selector: 'app-controls-toggle',
  standalone: true,
  imports: [CommonModule, LucideSun, LucideMoon, LucideVolume2, LucideVolumeX, LucideCircleHelp],
  templateUrl: './controls-toggle.component.html',
  styleUrl: './controls-toggle.component.scss',
})
export class ControlsToggleComponent {
  readonly theme = inject(ThemeService);
  readonly sound = inject(SoundService);
  readonly help = inject(HelpService);
}
