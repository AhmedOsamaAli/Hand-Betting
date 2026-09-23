import { TestBed } from '@angular/core/testing';
import { HistoryPanelComponent } from './history-panel.component';
import { HandRecord } from '../../../../core/models/hand.model';

describe('HistoryPanelComponent', () => {
  it('shows the comparison and post-drift totals when they differ', async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryPanelComponent],
    }).compileComponents();

    const record: HandRecord = {
      hand: [
        { id: 'TEST:9', kind: 'NUMBER', suit: 'BAMBOO', number: 9 },
        { id: 'TEST:1', kind: 'NUMBER', suit: 'BAMBOO', number: 1 },
        { id: 'TEST:WIND', kind: 'WIND', wind: 'EAST' },
      ],
      values: [9, 1, 4],
      comparisonTotal: 15,
      total: 14,
      bet: 'LOWER',
      outcome: 'LOSS',
      timestamp: 1,
    };

    const fixture = TestBed.createComponent(HistoryPanelComponent);
    fixture.componentRef.setInput('history', [record]);
    fixture.detectChanges();

    const total = fixture.nativeElement.querySelector('.history__total') as HTMLElement;
    expect(total.textContent?.replace(/\s+/g, '')).toBe('15→14');
    expect(total.getAttribute('aria-label')).toContain('Bet evaluated at 15');
  });
});
