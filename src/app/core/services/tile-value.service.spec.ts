import { TestBed } from '@angular/core/testing';
import { TileValueService } from './tile-value.service';
import { Tile } from '../models/tile.model';
import { GAME_CONFIG } from '../constants/game-config';

describe('TileValueService', () => {
  let service: TileValueService;

  const num: Tile = { id: 'NUMBER:BAMBOO:5#0', kind: 'NUMBER', suit: 'BAMBOO', number: 5 };
  const wind: Tile = { id: 'WIND:EAST#0', kind: 'WIND', wind: 'EAST' };
  const dragon: Tile = { id: 'DRAGON:RED#0', kind: 'DRAGON', dragon: 'RED' };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TileValueService);
    service.reset();
  });

  it('returns face value for number tiles', () => {
    expect(service.getValue(num)).toBe(5);
  });

  it('returns the base value for non-number tiles initially', () => {
    expect(service.getValue(wind)).toBe(GAME_CONFIG.BASE_NON_NUMBER_VALUE);
    expect(service.getValue(dragon)).toBe(GAME_CONFIG.BASE_NON_NUMBER_VALUE);
  });

  it('totalOf sums tile values correctly', () => {
    expect(service.totalOf([num, wind, dragon])).toBe(5 + 5 + 5);
  });

  it('increments non-number tile values on WIN', () => {
    service.applyOutcome([wind, dragon], 'WIN');
    expect(service.getValue(wind)).toBe(6);
    expect(service.getValue(dragon)).toBe(6);
  });

  it('decrements non-number tile values on LOSS', () => {
    service.applyOutcome([wind], 'LOSS');
    expect(service.getValue(wind)).toBe(4);
  });

  it('does not change tile values on PUSH', () => {
    service.applyOutcome([wind, dragon], 'PUSH');
    expect(service.getValue(wind)).toBe(5);
    expect(service.getValue(dragon)).toBe(5);
  });

  it('does not change number tile face values when applying outcomes', () => {
    service.applyOutcome([num], 'WIN');
    expect(service.getValue(num)).toBe(5);
  });

  it('tracks scaling per individual tile instance', () => {
    const wind2: Tile = { id: 'WIND:EAST#1', kind: 'WIND', wind: 'EAST' };
    service.applyOutcome([wind], 'WIN');
    expect(service.getValue(wind)).toBe(6);
    expect(service.getValue(wind2)).toBe(5);
  });

  it('reports MAX limit hit when value reaches TILE_VALUE_MAX', () => {
    for (let i = 0; i < 4; i++) service.applyOutcome([wind], 'WIN'); // 5→9
    const hits = service.applyOutcome([wind], 'WIN'); // 9→10
    expect(hits.length).toBe(1);
    expect(hits[0].bound).toBe('MAX');
    expect(hits[0].value).toBe(10);
  });

  it('reports MIN limit hit when value reaches TILE_VALUE_MIN', () => {
    for (let i = 0; i < 4; i++) service.applyOutcome([dragon], 'LOSS'); // 5→1
    const hits = service.applyOutcome([dragon], 'LOSS'); // 1→0
    expect(hits.length).toBe(1);
    expect(hits[0].bound).toBe('MIN');
    expect(hits[0].value).toBe(0);
  });

  it('reset() clears all tracked values', () => {
    service.applyOutcome([wind], 'WIN');
    service.reset();
    expect(service.getValue(wind)).toBe(GAME_CONFIG.BASE_NON_NUMBER_VALUE);
  });
});
