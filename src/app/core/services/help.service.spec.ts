import { TestBed } from '@angular/core/testing';
import { HelpService } from './help.service';
import { StorageService } from './storage.service';

describe('HelpService', () => {
  let service: HelpService;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(HelpService);
    storage = TestBed.inject(StorageService);
  });

  it('starts closed', () => {
    expect(service.isOpen()).toBe(false);
  });

  it('opens and closes via methods', () => {
    service.open();
    expect(service.isOpen()).toBe(true);
    service.close();
    expect(service.isOpen()).toBe(false);
  });

  it('toggle flips state', () => {
    expect(service.isOpen()).toBe(false);
    service.toggle();
    expect(service.isOpen()).toBe(true);
    service.toggle();
    expect(service.isOpen()).toBe(false);
  });

  it('persists "seen intro" flag the first time the dialog is closed', () => {
    expect(service.hasSeenIntro()).toBe(false);
    service.open();
    service.close();
    expect(service.hasSeenIntro()).toBe(true);
    expect(storage.get('seenIntro', false)).toBe(true);
  });

  it('reads existing "seen intro" flag from storage on init', () => {
    storage.set('seenIntro', true);
    // Reset the TestBed so HelpService is re-instantiated and reads storage.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(HelpService);
    expect(fresh.hasSeenIntro()).toBe(true);
  });

  it('maybeShowIntro auto-opens for first-time visitors', (done) => {
    service.maybeShowIntro();
    // The delay is intentional — give the UI time to paint.
    setTimeout(() => {
      expect(service.isOpen()).toBe(true);
      done();
    }, 800);
  });

  it('maybeShowIntro does NOT open for returning visitors', (done) => {
    storage.set('seenIntro', true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(HelpService);
    fresh.maybeShowIntro();
    setTimeout(() => {
      expect(fresh.isOpen()).toBe(false);
      done();
    }, 800);
  });
});
