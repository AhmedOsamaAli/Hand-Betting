import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

/**
 * Coordinates the "How to play" guide across the app.
 *
 * Single source of truth for:
 *  - whether the dialog is currently visible (`isOpen`)
 *  - whether the user has already seen it (`hasSeenIntro` — persisted)
 *
 * Centralising this in a service means:
 *  - any page can open the guide without prop-drilling
 *  - the help button and the dialog can never get out of sync
 *  - first-visit auto-open lives in one place
 */
@Injectable({ providedIn: 'root' })
export class HelpService {
  private readonly storage = inject(StorageService);
  private readonly INTRO_KEY = 'seenIntro';

  readonly isOpen = signal(false);
  readonly hasSeenIntro = signal(this.storage.get(this.INTRO_KEY, false));

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    if (!this.hasSeenIntro()) {
      this.hasSeenIntro.set(true);
      this.storage.set(this.INTRO_KEY, true);
    }
  }

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  /**
   * Called once on app boot. Pops the guide for first-time visitors after a
   * brief delay so the rest of the UI has painted first.
   */
  maybeShowIntro(): void {
    if (this.hasSeenIntro()) return;
    setTimeout(() => this.open(), 700);
  }
}
