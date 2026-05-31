import { TestBed } from '@angular/core/testing';
import { DeckService } from './deck.service';
import { DECK_SIZE } from '../utils/deck-builder.util';

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
    expect(service.reshuffleCount()).toBe(0);
  });

  it('draw() removes tiles from the draw pile', () => {
    const before = service.drawCount();
    const tiles = service.draw(3, 3);
    expect(tiles).not.toBeNull();
    expect(tiles!.length).toBe(3);
    expect(service.drawCount()).toBe(before - 3);
  });

  it('discard() pushes tiles into the discard pile', () => {
    const tiles = service.draw(3, 3)!;
    service.discard(tiles);
    expect(service.discardCount()).toBe(3);
  });

  it('triggers a reshuffle when the draw pile is empty', () => {
    // Drain the deck.
    while (service.drawCount() > 0) {
      const t = service.draw(1, 3);
      service.discard(t!);
    }
    expect(service.drawCount()).toBe(0);
    // Next draw triggers reshuffle (discard + fresh deck → new draw pile).
    const next = service.draw(1, 3);
    expect(next).not.toBeNull();
    expect(service.reshuffleCount()).toBe(1);
    expect(service.drawCount()).toBeGreaterThan(0);
  });

  it('returns null when reshuffle cap is reached', () => {
    // Force 3 reshuffles, then try a 4th.
    for (let i = 0; i < 3; i++) {
      while (service.drawCount() > 0) {
        const t = service.draw(1, 3);
        if (t) service.discard(t);
      }
      const t = service.draw(1, 3);
      if (t) service.discard(t);
    }
    // Drain again after the 3rd reshuffle.
    while (service.drawCount() > 0) {
      const t = service.draw(1, 3);
      if (t) service.discard(t);
    }
    // Now any draw needing reshuffle #4 must return null.
    const next = service.draw(1, 3);
    expect(next).toBeNull();
  });
});

function sequentialRng(): () => number {
  let i = 0;
  return () => {
    i = (i + 1) % 1000;
    return i / 1000;
  };
}
