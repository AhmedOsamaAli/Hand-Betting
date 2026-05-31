import { TestBed } from '@angular/core/testing';
import { LeaderboardService } from './leaderboard.service';
import { StorageService } from './storage.service';
import { LeaderboardEntry } from '../models/game-state.model';
import { GAME_CONFIG } from '../constants/game-config';

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaderboardService);
    TestBed.inject(StorageService);
    service.clear();
  });

  afterEach(() => service.clear());

  it('returns empty array initially', () => {
    expect(service.topEntries()).toEqual([]);
  });

  it('save() persists entries', () => {
    service.save(entry('Alice', 10));
    expect(service.topEntries().length).toBe(1);
    expect(service.topEntries()[0].name).toBe('Alice');
  });

  it('sorts entries by score desc', () => {
    service.save(entry('Alice', 10));
    service.save(entry('Bob', 20));
    service.save(entry('Cara', 5));
    const top = service.topEntries();
    expect(top.map((e) => e.name)).toEqual(['Bob', 'Alice', 'Cara']);
  });

  it('trims to LEADERBOARD_SIZE', () => {
    for (let i = 0; i < GAME_CONFIG.LEADERBOARD_SIZE + 3; i++) {
      service.save(entry(`P${i}`, i));
    }
    expect(service.topEntries().length).toBe(GAME_CONFIG.LEADERBOARD_SIZE);
  });

  it('qualifies() is true while board has free slots', () => {
    expect(service.qualifies(1)).toBeTrue();
  });

  it('qualifies() is true only for scores beating the lowest entry on a full board', () => {
    for (let i = 1; i <= GAME_CONFIG.LEADERBOARD_SIZE; i++) {
      service.save(entry(`P${i}`, i * 10));
    }
    expect(service.qualifies(5)).toBeFalse(); // 5 < lowest (10)
    expect(service.qualifies(15)).toBeTrue(); // beats lowest (10)
  });
});

function entry(name: string, score: number): LeaderboardEntry {
  return { name, score, handsPlayed: 1, longestStreak: 1, playedAt: Date.now() };
}
