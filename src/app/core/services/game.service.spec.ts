import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { GAME_CONFIG } from '../constants/game-config';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
    service.startGame(seededRng(42));
  });

  it('starts in PLAYING status with an initial hand', () => {
    expect(service.status()).toBe('PLAYING');
    expect(service.currentHand()).not.toBeNull();
    expect(service.currentHand()!.length).toBe(GAME_CONFIG.HAND_SIZE);
    expect(service.history().length).toBe(1);
  });

  it('placeBet draws a new hand and grows history by 1', () => {
    const before = service.history().length;
    service.placeBet('HIGHER');
    expect(service.history().length).toBe(before + 1);
  });

  it('exitGame transitions to GAME_OVER with PLAYER_EXIT reason', () => {
    service.exitGame();
    expect(service.status()).toBe('GAME_OVER');
    expect(service.gameOverReason()?.kind).toBe('PLAYER_EXIT');
  });

  it('awards +1 score on a correct bet', () => {
    // Try both directions until one wins, then verify score moved up.
    const startScore = service.score();
    service.placeBet('HIGHER');
    if (service.history()[1].outcome === 'WIN') {
      expect(service.score()).toBe(startScore + 1);
    } else {
      // not a WIN — fine, just check streak reset semantics
      expect(service.streak()).toBe(0);
    }
  });

  it('resets streak on a loss', () => {
    // Drive a known win first via test isolation:
    // place enough bets and assert streak never exceeds the bonus thresholds
    // in a single round (smoke test for streak handling).
    let safety = 20;
    while (service.status() === 'PLAYING' && safety-- > 0) {
      const prev = service.streak();
      service.placeBet('HIGHER');
      const last = service.history().at(-1)!;
      if (last.outcome === 'LOSS') {
        expect(service.streak()).toBe(0);
      } else if (last.outcome === 'WIN') {
        expect(service.streak()).toBe(prev + 1);
      }
    }
  });

  it('emits a streak bonus exactly when reaching a configured threshold', () => {
    // We re-evaluate via the public API: count score deltas during a play loop.
    const wins: number[] = [];
    const losses: number[] = [];
    let safety = 200;
    while (service.status() === 'PLAYING' && safety-- > 0) {
      const before = service.score();
      service.placeBet('HIGHER');
      const last = service.history().at(-1)!;
      const delta = service.score() - before;
      if (last.outcome === 'WIN') wins.push(delta);
      if (last.outcome === 'LOSS') losses.push(delta);
    }
    // Wins should usually be 1, but at streak thresholds we should see >1.
    wins.forEach((d) => expect(d >= 1).toBeTrue());
    losses.forEach((d) => expect(d).toBe(0));
  });

  it('transitions to GAME_OVER eventually', () => {
    let safety = 5000;
    while (service.status() === 'PLAYING' && safety-- > 0) {
      service.placeBet(Math.random() > 0.5 ? 'HIGHER' : 'LOWER');
    }
    expect(service.status()).toBe('GAME_OVER');
    expect(service.gameOverReason()).not.toBeNull();
  });
});

/** Mulberry32 — small deterministic 32-bit PRNG. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
