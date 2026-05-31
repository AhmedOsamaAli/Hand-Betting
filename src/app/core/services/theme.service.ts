import { Injectable, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { StorageService } from './storage.service';

export type Theme = 'dark' | 'light';

/**
 * Owns the active theme and persists it across sessions. Theme is applied
 * via `data-theme` on `<html>`, which our SCSS variables key off.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly doc = inject(DOCUMENT);
  private readonly key = 'theme';

  readonly theme = signal<Theme>(this.storage.get<Theme>(this.key, 'dark'));

  constructor() {
    effect(() => {
      const t = this.theme();
      this.doc.documentElement.setAttribute('data-theme', t);
      this.storage.set(this.key, t);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
