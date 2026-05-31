import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { LeaderboardEntry } from '../models/game-state.model';
import { GAME_CONFIG } from '../constants/game-config';

/**
 * Persists and queries top scores.
 *
 * Backed today by `StorageService` (LocalStorage), but the rest of the app
 * only depends on this interface — moving to an API would only touch this
 * file plus the storage abstraction.
 */
@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly storage = inject(StorageService);
  private readonly key = 'leaderboard';

  /** Returns top entries sorted by score desc, then most-recent first. */
  topEntries(limit: number = GAME_CONFIG.LEADERBOARD_SIZE): LeaderboardEntry[] {
    return this.allEntries()
      .sort((a, b) => b.score - a.score || b.playedAt - a.playedAt)
      .slice(0, limit);
  }

  /** Persist a new entry; older overflow beyond top N is trimmed. */
  save(entry: LeaderboardEntry): void {
    const next = [...this.allEntries(), entry]
      .sort((a, b) => b.score - a.score || b.playedAt - a.playedAt)
      .slice(0, GAME_CONFIG.LEADERBOARD_SIZE);
    this.storage.set(this.key, next);
  }

  /** Returns true iff the score qualifies for the leaderboard. */
  qualifies(score: number): boolean {
    const entries = this.topEntries();
    if (entries.length < GAME_CONFIG.LEADERBOARD_SIZE) return true;
    return score > entries[entries.length - 1].score;
  }

  /** Wipe all entries (used by a "clear leaderboard" feature, if added). */
  clear(): void {
    this.storage.remove(this.key);
  }

  private allEntries(): LeaderboardEntry[] {
    return this.storage.get<LeaderboardEntry[]>(this.key, []);
  }
}
