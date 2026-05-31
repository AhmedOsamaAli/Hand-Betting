import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideArrowUp, LucideArrowDown } from '@lucide/angular';
import { Bet } from '../../../../core/models/hand.model';

/**
 * The two primary action buttons. Pure UI: emits a `Bet` upward.
 *
 * Extending: to add a new bet type, append it to the template and emit it.
 */
@Component({
  selector: 'app-betting-controls',
  standalone: true,
  imports: [CommonModule, LucideArrowUp, LucideArrowDown],
  templateUrl: './betting-controls.component.html',
  styleUrl: './betting-controls.component.scss',
})
export class BettingControlsComponent {
  @Input() disabled = false;
  @Output() bet = new EventEmitter<Bet>();

  place(bet: Bet): void {
    if (this.disabled) return;
    this.bet.emit(bet);
  }
}
