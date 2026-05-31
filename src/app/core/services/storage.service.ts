import { Injectable } from '@angular/core';

/**
 * Thin abstraction over a key/value store.
 *
 * Today: backed by `localStorage`. Tomorrow: swap for a remote API by
 * providing a different implementation of `StorageService` via DI.
 *
 * All values are JSON-serialised and namespaced under `hbg.` to avoid
 * collisions with other apps on the same origin.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly namespace = 'hbg.';

  get<T>(key: string, fallback: T): T {
    if (!this.isAvailable()) return fallback;
    try {
      const raw = localStorage.getItem(this.namespace + key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(this.namespace + key, JSON.stringify(value));
    } catch {
      /* quota or serialization error — silently skip */
    }
  }

  remove(key: string): void {
    if (!this.isAvailable()) return;
    localStorage.removeItem(this.namespace + key);
  }

  private isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
      return false;
    }
  }
}
