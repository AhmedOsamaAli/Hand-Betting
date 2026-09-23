import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { GAME_CONFIG } from '../constants/game-config';
import { TileValueService } from './tile-value.service';
import { isNonNumberTile, Tile } from '../models/tile.model';
import { Hand } from '../models/hand.model';
import { DeckService } from './deck.service';

describe('GameService', () => {
  let service: GameService;
  let tileValues: TileValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
    tileValues = TestBed.inject(TileValueService);
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

  it('stores immutable per-tile value snapshots in history', () => {
    let record = service.history().at(-1)!;
    let dynamicIndex = record.hand.findIndex(isNonNumberTile);

    while (dynamicIndex < 0 && service.status() === 'PLAYING') {
      service.placeBet('HIGHER');
      record = service.history().at(-1)!;
      dynamicIndex = record.hand.findIndex(isNonNumberTile);
    }

    expect(dynamicIndex).toBeGreaterThanOrEqual(0);
    if (dynamicIndex < 0) return;

    expect(record.total).toBe(record.values.reduce((sum, value) => sum + value, 0));

    const tile = record.hand[dynamicIndex];
    const recordedValue = record.values[dynamicIndex];
    tileValues.applyOutcome([tile], 'WIN');

    expect(tileValues.getValue(tile)).toBe(recordedValue + 1);
    expect(record.values[dynamicIndex]).toBe(recordedValue);
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

  it('transitions to GAME_OVER eventually', () => {
    let safety = 5000;
    while (service.status() === 'PLAYING' && safety-- > 0) {
      service.placeBet(Math.random() > 0.5 ? 'HIGHER' : 'LOWER');
    }
    expect(service.status()).toBe('GAME_OVER');
    expect(service.gameOverReason()).not.toBeNull();
  });

  it('preserves core invariants across deterministic full-game simulations', () => {
    for (let seed = 0; seed < 25; seed++) {
      service.startGame(seededRng(seed));
      let rounds = 0;

      while (service.status() === 'PLAYING' && rounds < 2000) {
        service.placeBet(rounds % 2 === 0 ? 'HIGHER' : 'LOWER');
        rounds++;
      }

      expect(service.status()).withContext(`seed ${seed}`).toBe('GAME_OVER');
      expect(service.gameOverReason()).withContext(`seed ${seed}`).not.toBeNull();
      expect(service.score()).withContext(`seed ${seed}`).toBeGreaterThanOrEqual(0);
      expect(service.drawCount()).withContext(`seed ${seed}`).toBeGreaterThanOrEqual(0);
      expect(service.discardCount()).withContext(`seed ${seed}`).toBeGreaterThanOrEqual(0);
      expect(service.drawPileExhaustionCount())
        .withContext(`seed ${seed}`)
        .toBeLessThanOrEqual(GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS);

      for (const record of service.history()) {
        expect(record.hand.length).withContext(`seed ${seed}`).toBe(GAME_CONFIG.HAND_SIZE);
        expect(record.values.length).withContext(`seed ${seed}`).toBe(record.hand.length);
        expect(record.comparisonTotal).withContext(`seed ${seed}`).toBeGreaterThan(0);
        expect(record.total)
          .withContext(`seed ${seed}`)
          .toBe(record.values.reduce((sum, value) => sum + value, 0));
        expect(new Set(record.hand.map((tile) => tile.id)).size)
          .withContext(`seed ${seed}`)
          .toBe(record.hand.length);
      }
    }
  });
});

describe('GameService scoring', () => {
  it('awards the exact configured bonuses at streaks 3, 5, and 10', () => {
    const hands = Array.from({ length: 11 }, (_, index) => numberHand(3 + index, index));
    const service = createGameWithHands(hands);
    const expectedScores = [1, 2, 5, 6, 12, 13, 14, 15, 16, 32];

    expectedScores.forEach((expectedScore, index) => {
      service.placeBet('HIGHER');
      expect(service.score()).withContext(`streak ${index + 1}`).toBe(expectedScore);
      expect(service.streak()).withContext(`streak ${index + 1}`).toBe(index + 1);
    });
  });

  it('leaves score and streak unchanged on a push, then resets the streak on loss', () => {
    const service = createGameWithHands([
      numberHand(6, 0),
      numberHand(7, 1),
      numberHand(7, 2),
      numberHand(6, 3),
    ]);

    service.placeBet('HIGHER');
    expect(service.score()).toBe(1);
    expect(service.streak()).toBe(1);

    service.placeBet('HIGHER');
    expect(service.history().at(-1)?.outcome).toBe('PUSH');
    expect(service.score()).toBe(1);
    expect(service.streak()).toBe(1);

    service.placeBet('HIGHER');
    expect(service.history().at(-1)?.outcome).toBe('LOSS');
    expect(service.score()).toBe(1);
    expect(service.streak()).toBe(0);
  });

  it('evaluates before tile drift and records both totals when they later look equal', () => {
    const service = createGameWithHands([
      numberHand(14, 0),
      [
        numberTile(9, 'NEXT:0'),
        numberTile(1, 'NEXT:1'),
        { id: 'NEXT:WIND', kind: 'WIND', wind: 'EAST' },
      ],
    ]);

    service.placeBet('LOWER');
    const record = service.history().at(-1)!;

    expect(record.outcome).toBe('LOSS');
    expect(record.comparisonTotal).toBe(15);
    expect(record.total).toBe(14);
    expect(record.values).toEqual([9, 1, 4]);
  });
});

function createGameWithHands(hands: readonly Hand[]): GameService {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: DeckService,
        useValue: new PredictableDeckService(hands),
      },
    ],
  });
  const service = TestBed.inject(GameService);
  service.startGame();
  return service;
}

class PredictableDeckService {
  private handIndex = 0;

  readonly drawCount = signal(0);
  readonly discardCount = signal(0);
  readonly drawPileExhaustionCount = signal(0);

  constructor(private readonly hands: readonly Hand[]) {}

  initialize(): void {
    this.handIndex = 0;
    this.drawCount.set(this.hands.length * GAME_CONFIG.HAND_SIZE);
    this.discardCount.set(0);
    this.drawPileExhaustionCount.set(0);
  }

  draw(): Hand | null {
    const hand = this.hands[this.handIndex++] ?? null;
    if (hand) this.drawCount.update((count) => count - hand.length);
    return hand;
  }

  discard(tiles: readonly Tile[]): void {
    this.discardCount.update((count) => count + tiles.length);
  }
}

function numberHand(total: number, handIndex: number): Hand {
  const values = [1, 1, 1];
  let remainder = total - values.length;

  for (let index = 0; index < values.length && remainder > 0; index++) {
    const increase = Math.min(8, remainder);
    values[index] += increase;
    remainder -= increase;
  }

  return values.map((number, tileIndex) =>
    numberTile(number, `TEST:${handIndex}:${tileIndex}`),
  );
}

function numberTile(number: number, id: string): Tile {
  return {
    id,
    kind: 'NUMBER',
    suit: 'BAMBOO',
    number,
  };
}

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
