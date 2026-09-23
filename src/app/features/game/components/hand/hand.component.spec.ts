import { TestBed } from '@angular/core/testing';
import { HandComponent } from './hand.component';
import { TileValueService } from '../../../../core/services/tile-value.service';
import { Tile } from '../../../../core/models/tile.model';

describe('HandComponent', () => {
  it('renders historical tile values instead of newer live values', async () => {
    await TestBed.configureTestingModule({
      imports: [HandComponent],
    }).compileComponents();

    const tile: Tile = {
      id: 'DECK:0:WIND:EAST#0',
      kind: 'WIND',
      wind: 'EAST',
    };
    TestBed.inject(TileValueService).applyOutcome([tile], 'WIN');

    const fixture = TestBed.createComponent(HandComponent);
    fixture.componentRef.setInput('hand', [tile]);
    fixture.componentRef.setInput('values', [5]);
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.tile__badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('5');
  });
});
