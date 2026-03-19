import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SimulationCardComponent } from '../../components/simulation-card/simulation-card.component';
import { SimulationsFacade } from '../../services/simulations.facade';

@Component({
  selector: 'app-simulation-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SimulationCardComponent],
  templateUrl: './simulation-list-page.component.html',
  styleUrl: './simulation-list-page.component.scss',
})
export class SimulationListPageComponent implements OnInit {
  readonly facade = inject(SimulationsFacade);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.facade.loadSimulations();
  }

  openDetails(id: string): void {
    void this.router.navigate(['/simulations', id]);
  }

  removeSimulation(id: string): void {
    const shouldDelete = window.confirm(
      'Deseja remover este experimento do OrbitLab?',
    );

    if (!shouldDelete) {
      return;
    }

    this.facade.deleteSimulation(id).subscribe();
  }
}
