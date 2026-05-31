import { Routes } from '@angular/router';

/**
 * Top-level routes. Both feature pages are loaded lazily so the initial JS
 * bundle stays lean — important for first-paint on the landing screen.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
    title: 'Hand Betting — Play',
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
    title: 'Hand Betting — In Game',
  },
  { path: '**', redirectTo: '' },
];

