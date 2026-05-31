import { Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HowToPlayDialogComponent } from './shared/how-to-play-dialog/how-to-play-dialog.component';
import { HelpService } from './core/services/help.service';

/**
 * Root shell.
 *
 *  - Hosts the router outlet (lazy-loads landing/game).
 *  - Hosts the global "How to play" dialog so it can be opened from any route.
 *  - Pops the guide for first-time visitors via `HelpService.maybeShowIntro`.
 *  - Wires the global `?` keyboard shortcut for opening the guide.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HowToPlayDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly help = inject(HelpService);

  ngOnInit(): void {
    this.help.maybeShowIntro();
  }

  /**
   * Open the guide on `?`. Ignored when the user is typing in a form field —
   * otherwise typing "What?" in the name input would trigger the dialog.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== '?') return;
    if (this.isEditableTarget(event.target)) return;
    event.preventDefault();
    this.help.toggle();
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }
}
