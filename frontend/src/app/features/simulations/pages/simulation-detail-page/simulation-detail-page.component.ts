import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { FormulaScenarioBuilderComponent } from '../../components/formula-scenario-builder/formula-scenario-builder.component';
import { SimulationCanvasComponent } from '../../components/simulation-canvas/simulation-canvas.component';
import { SimulationControlPanelComponent } from '../../components/simulation-control-panel/simulation-control-panel.component';
import { CreateSimulationPayload } from '../../models/create-simulation.model';
import { FormulaScenarioDraftModel } from '../../models/formula-scenario.model';
import { Vector2Model } from '../../models/vector2.model';
import { FormulaScenarioPersistenceService } from '../../formula/formula-scenario-persistence.service';
import { SimulationsFacade } from '../../services/simulations.facade';
import { SimulationRunnerService } from '../../services/simulation-runner.service';

@Component({
  selector: 'app-simulation-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    FormulaScenarioBuilderComponent,
    SimulationCanvasComponent,
    SimulationControlPanelComponent,
  ],
  templateUrl: './simulation-detail-page.component.html',
  styleUrl: './simulation-detail-page.component.scss',
})
export class SimulationDetailPageComponent implements OnInit, OnDestroy {
  readonly facade = inject(SimulationsFacade);
  readonly runner = inject(SimulationRunnerService);
  readonly formulaDraft = signal<FormulaScenarioDraftModel | null>(null);
  readonly localError = signal<string | null>(null);

  private readonly persistence = inject(FormulaScenarioPersistenceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const simulation = this.facade.selectedSimulation();

      if (simulation) {
        const nextDraft = this.persistence.toDraft(simulation);
        this.formulaDraft.set(nextDraft);

        if (!nextDraft) {
          this.runner.loadSimulation(simulation);
        }
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.facade.loadSimulation(id);
    }
  }

  ngOnDestroy(): void {
    this.runner.destroy();
  }

  toggleSimulation(): void {
    if (this.runner.isRunning()) {
      this.runner.pause();
      return;
    }

    this.runner.play();
  }

  resetSimulation(): void {
    this.runner.reset();
  }

  generateRandomSystem(): void {
    this.runner.generateRandomSystem();
  }

  selectBody(bodyId: string): void {
    this.runner.selectBody(bodyId);
  }

  updateMass(event: { bodyId: string; mass: number }): void {
    this.runner.updateMass(event.bodyId, event.mass);
  }

  updateVelocity(event: { bodyId: string; velocity: Vector2Model }): void {
    this.runner.updateVelocity(event.bodyId, event.velocity);
  }

  addBody(body: CreateSimulationPayload['bodies'][number]): void {
    this.runner.addBody(body);
  }

  removeRuntimeBody(bodyId: string): void {
    this.runner.removeBody(bodyId);
  }

  saveFormulaCopy(draft: FormulaScenarioDraftModel): void {
    this.localError.set(null);

    let payload;

    try {
      payload = this.persistence.toCreateSimulationPayload(draft);
    } catch (error) {
      this.localError.set(
        error instanceof Error ? error.message : 'Nao foi possivel salvar a copia.',
      );
      return;
    }

    this.facade.createSimulation(payload).subscribe({
      next: (createdSimulation) =>
        void this.router.navigate(['/simulations', createdSimulation.id]),
    });
  }

  forceMagnitude(force: Vector2Model): number {
    return Math.hypot(force.x, force.y);
  }

  removeSimulation(): void {
    const simulation = this.facade.selectedSimulation();
    if (!simulation) {
      return;
    }

    const shouldDelete = window.confirm(
      `Deseja remover a simulacao "${simulation.name}"?`,
    );

    if (!shouldDelete) {
      return;
    }

    this.facade.deleteSimulation(simulation.id).subscribe({
      next: () => void this.router.navigate(['/simulations']),
    });
  }
}
