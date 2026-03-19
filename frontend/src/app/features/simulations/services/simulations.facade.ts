import { inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';

import { CreateSimulationPayload } from '../models/create-simulation.model';
import { SimulationModel } from '../models/simulation.model';
import { SimulationsApiService } from './simulations-api.service';

@Injectable({
  providedIn: 'root',
})
export class SimulationsFacade {
  private readonly simulationsApiService = inject(SimulationsApiService);

  readonly simulations = signal<SimulationModel[]>([]);
  readonly selectedSimulation = signal<SimulationModel | null>(null);
  readonly loadingList = signal(false);
  readonly loadingDetails = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  loadSimulations(): void {
    this.loadingList.set(true);
    this.errorMessage.set(null);

    this.simulationsApiService
      .list()
      .pipe(finalize(() => this.loadingList.set(false)))
      .subscribe({
        next: (simulations) => this.simulations.set(simulations),
        error: () => this.errorMessage.set('Nao foi possivel carregar as simulacoes.'),
      });
  }

  loadSimulation(id: string): void {
    this.loadingDetails.set(true);
    this.errorMessage.set(null);
    this.selectedSimulation.set(null);

    this.simulationsApiService
      .getById(id)
      .pipe(finalize(() => this.loadingDetails.set(false)))
      .subscribe({
        next: (simulation) => this.selectedSimulation.set(simulation),
        error: () =>
          this.errorMessage.set('Nao foi possivel carregar os detalhes da simulacao.'),
      });
  }

  createSimulation(payload: CreateSimulationPayload): Observable<SimulationModel> {
    this.submitting.set(true);
    this.errorMessage.set(null);

    return this.simulationsApiService.create(payload).pipe(
      tap((simulation) => {
        this.simulations.update((current) => [simulation, ...current]);
        this.selectedSimulation.set(simulation);
      }),
      catchError((error) => {
        this.errorMessage.set('Nao foi possivel criar a simulacao.');
        return throwError(() => error);
      }),
      finalize(() => this.submitting.set(false)),
    );
  }

  deleteSimulation(id: string): Observable<void> {
    this.errorMessage.set(null);

    return this.simulationsApiService.delete(id).pipe(
      tap(() => {
        this.simulations.update((current) =>
          current.filter((simulation) => simulation.id !== id),
        );

        if (this.selectedSimulation()?.id === id) {
          this.selectedSimulation.set(null);
        }
      }),
      catchError((error) => {
        this.errorMessage.set('Nao foi possivel remover a simulacao.');
        return throwError(() => error);
      }),
    );
  }
}
