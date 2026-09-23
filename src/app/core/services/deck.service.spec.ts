import { TestBed } from '@angular/core/testing';
import { DeckService } from './deck.service';
import { DECK_SIZE } from '../utils/deck-builder.util';
import { GAME_CONFIG } from '../constants/game-config';

describe('DeckService', () => {
  let service: DeckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeckService);
    service.initialize(sequentialRng());
  });

  it('initializes with a full deck in the draw pile', () => {
    expect(service.drawCount()).toBe(DECK_SIZE);
    expect(service.discardCount()).toBe(0);
    expect(service.drawPileExhaustionCount()).toBe(0);
  });

  it('draw() removes tiles from the draw pile', () => {
    const before = service.drawCount();
    const tiles = service.draw(3, GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS);
    expect(tiles).not.toBeNull();
    expect(tiles!.length).toBe(3);
    expect(service.drawCount()).toBe(before - 3);
  });

  it('discard() pushes tiles into the discard pile', () => {
    const tiles = service.draw(3, GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS)!;
    service.discard(tiles);
    expect(service.discardCount()).toBe(3);
  });

  it('records an exhaustion and refills as soon as the last tile is drawn', () => {
    const tiles = service.draw(DECK_SIZE, GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS);

    expect(tiles?.length).toBe(DECK_SIZE);
    expect(service.drawPileExhaustionCount()).toBe(1);
    expect(service.drawCount()).toBe(DECK_SIZE);
  });

  it('keeps physical tile ids unique when a fresh deck is added', () => {
    const discarded = service.draw(3, GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS)!;
    service.discard(discarded);
    service.draw(DECK_SIZE - 3, GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS);

    const combinedDeck = service.draw(
      DECK_SIZE + discarded.length,
      GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS,
    );

    expect(combinedDeck).not.toBeNull();
    expect(new Set(combinedDeck!.map((tile) => tile.id)).size).toBe(
      DECK_SIZE + discarded.length,
    );
  });

  it('returns null immediately when drawing the last tile causes the third exhaustion', () => {
    for (let expectedExhaustions = 1; expectedExhaustions < 3; expectedExhaustions++) {
      const tiles = service.draw(
        service.drawCount(),
        GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS,
      );

      expect(tiles).not.toBeNull();
      service.discard(tiles!);
      expect(service.drawPileExhaustionCount()).toBe(expectedExhaustions);
    }

    const discardCount = service.discardCount();
    const next = service.draw(
      service.drawCount(),
      GAME_CONFIG.MAX_DRAW_PILE_EXHAUSTIONS,
    );

    expect(next).toBeNull();
    expect(service.drawPileExhaustionCount()).toBe(3);
    expect(service.drawCount()).toBe(0);
    expect(service.discardCount()).toBe(discardCount);
  });
});

function sequentialRng(): () => number {
  let i = 0;
  return () => {
    i = (i + 1) % 1000;
    return i / 1000;
  };
}
