import { Injectable, inject, signal, effect } from '@angular/core';
import { StorageService } from './storage.service';

export type SfxName = 'tile' | 'win' | 'loss' | 'gameOver' | 'click';

/**
 * Synthesised sound effects via the Web Audio API.
 *
 * Why not mp3 files? Zero asset weight, no licensing concerns, and the
 * sounds are short percussive cues that synthesis handles perfectly. The
 * trade-off is some boilerplate — acceptable for the polish payoff.
 *
 * Each effect is a small envelope of oscillators with no external deps.
 */
@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly storage = inject(StorageService);
  private readonly key = 'soundEnabled';

  readonly enabled = signal<boolean>(this.storage.get<boolean>(this.key, true));

  private ctx: AudioContext | null = null;

  constructor() {
    effect(() => this.storage.set(this.key, this.enabled()));
  }

  toggle(): void {
    this.enabled.update((e) => !e);
  }

  play(name: SfxName): void {
    if (!this.enabled()) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    switch (name) {
      case 'tile':
        this.tone(ctx, { freq: 320, duration: 0.08, type: 'triangle', gain: 0.18 });
        break;
      case 'click':
        this.tone(ctx, { freq: 600, duration: 0.05, type: 'square', gain: 0.1 });
        break;
      case 'win':
        this.chord(ctx, [523.25, 659.25, 783.99], 0.25, 0.18); // C maj
        break;
      case 'loss':
        this.tone(ctx, { freq: 220, duration: 0.25, type: 'sawtooth', gain: 0.18 });
        this.tone(ctx, { freq: 180, duration: 0.25, type: 'sawtooth', gain: 0.18, delay: 0.05 });
        break;
      case 'gameOver':
        this.chord(ctx, [392, 311.13, 233.08], 0.55, 0.22); // descending minor
        break;
    }
  }

  private tone(
    ctx: AudioContext,
    opts: { freq: number; duration: number; type: OscillatorType; gain: number; delay?: number },
  ): void {
    const start = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type;
    osc.frequency.value = opts.freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(opts.gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + opts.duration + 0.02);
  }

  private chord(ctx: AudioContext, freqs: number[], duration: number, gain: number): void {
    freqs.forEach((f, i) =>
      this.tone(ctx, { freq: f, duration, type: 'triangle', gain, delay: i * 0.04 }),
    );
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
}
