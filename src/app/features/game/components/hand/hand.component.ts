import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TileComponent, TileSize } from '../tile/tile.component';
import { Hand } from '../../../../core/models/hand.model';

/**
 * Displays a row of tiles plus its total.
 *
 * Dumb / presentational: receives `hand` and `total`, emits nothing. All
 * orchestration lives in `GameComponent`.
 */
@Component({
  selector: 'app-hand',
  standalone: true,
  imports: [CommonModule, TileComponent],
  templateUrl: './hand.component.html',
  styleUrl: './hand.component.scss',
})
export class HandComponent {
  @Input({ required: true }) hand!: Hand;
  @Input() total: number | null = null;
  @Input() size: TileSize = 'lg';
  @Input() animateReveal = true;
}
