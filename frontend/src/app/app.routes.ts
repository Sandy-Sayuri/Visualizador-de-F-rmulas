import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'simulations',
  },
  {
    path: 'simulations',
    loadComponent: () =>
      import('./features/simulations/pages/simulation-home-page/simulation-home-page.component').then(
        (m) => m.SimulationHomePageComponent,
      ),
  },
  {
    path: 'simulations/new',
    redirectTo: 'simulations',
  },
  {
    path: 'simulations/library',
    loadComponent: () =>
      import('./features/simulations/pages/simulation-list-page/simulation-list-page.component').then(
        (m) => m.SimulationListPageComponent,
      ),
  },
  {
    path: 'simulations/manual',
    redirectTo: 'simulations',
  },
  {
    path: 'simulations/:id',
    loadComponent: () =>
      import('./features/simulations/pages/simulation-detail-page/simulation-detail-page.component').then(
        (m) => m.SimulationDetailPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'simulations',
  },
];
