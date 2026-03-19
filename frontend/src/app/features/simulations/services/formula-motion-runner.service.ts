import { computed, inject, Injectable, signal } from '@angular/core';

import { FormulaInterpreterService, FormulaProgram } from '../formula/formula-interpreter.service';
import { FormulaMetadataService } from '../formula/formula-metadata.service';
import { FormulaMotionService } from '../formula/formula-motion.service';
import { FormulaVisualizationService } from '../formula/formula-visualization.service';
import {
  FormulaSimulationConfigModel,
  FormulaSimulationStateModel,
} from '../models/formula-simulation-config.model';
import { FormulaVisualSceneModel } from '../models/formula-visualization.model';
import { RuntimeBodyModel } from '../models/runtime-body.model';
import { SimulationModel } from '../models/simulation.model';

@Injectable({
  providedIn: 'root',
})
export class FormulaMotionRunnerService {
  private readonly interpreter = inject(FormulaInterpreterService);
  private readonly motion = inject(FormulaMotionService);
  private readonly metadata = inject(FormulaMetadataService);
  private readonly visualization = inject(FormulaVisualizationService);

  private readonly timeScale = 1;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private initialState: FormulaSimulationStateModel | null = null;
  private program: FormulaProgram | null = null;

  readonly config = signal<FormulaSimulationConfigModel | null>(null);
  readonly state = signal<FormulaSimulationStateModel | null>(null);
  readonly isRunning = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly bodies = computed<RuntimeBodyModel[]>(() => this.visualScene().bodies);

  readonly selectedBody = computed<RuntimeBodyModel | null>(() => this.state()?.body ?? null);
  readonly selectedBodyId = computed<string | null>(() => this.state()?.body.id ?? null);
  readonly elapsedSeconds = computed(() => this.state()?.time ?? 0);
  readonly visualScene = computed<FormulaVisualSceneModel>(() => {
    const currentState = this.state();
    const currentConfig = this.config();

    if (!currentState || !currentConfig || !this.program) {
      return {
        bodies: [],
        decorations: [],
        legendItems: [],
        decision: {
          mode: 'single-particle',
          showVectors: false,
          showTrails: false,
          showAnchor: false,
          showWake: false,
          showPulse: false,
          showPrediction: false,
          showPattern: false,
          showComparison: false,
          showInteractionBodies: false,
        },
      };
    }

    return this.visualization.buildScene(currentConfig, currentState, this.program);
  });

  hydrateFromSimulation(simulation: SimulationModel): void {
    const extracted = this.metadata.extractConfig(simulation.description);
    this.loadConfig(extracted.config ?? this.metadata.createDefaultConfig(simulation));
  }

  loadConfig(config: FormulaSimulationConfigModel): void {
    this.pause();

    try {
      const program = this.interpreter.compileProgram(config);
      const initialState = this.motion.createInitialState(config, program);

      this.program = program;
      this.initialState = this.cloneState(initialState);
      this.config.set({ ...config });
      this.state.set(initialState);
      this.errorMessage.set(null);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Nao foi possivel aplicar a formula.',
      );
    }
  }

  play(): void {
    if (this.isRunning() || !this.state() || !this.program || !this.config()) {
      return;
    }

    this.isRunning.set(true);
    this.lastTimestamp = null;
    this.animationFrameId = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  pause(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.lastTimestamp = null;
    this.isRunning.set(false);
  }

  reset(): void {
    this.pause();

    if (this.initialState) {
      this.state.set(this.cloneState(this.initialState));
      this.errorMessage.set(null);
    }
  }

  destroy(): void {
    this.pause();
  }

  private tick(timestamp: number): void {
    const currentState = this.state();
    const currentConfig = this.config();

    if (!this.isRunning() || !currentState || !this.program || !currentConfig) {
      return;
    }

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      this.animationFrameId = requestAnimationFrame((frame) => this.tick(frame));
      return;
    }

    try {
      const deltaTime =
        Math.min(0.03, (timestamp - this.lastTimestamp) / 1000) * this.timeScale;
      this.lastTimestamp = timestamp;
      this.state.set(this.motion.step(currentState, currentConfig, this.program, deltaTime));
      this.animationFrameId = requestAnimationFrame((frame) => this.tick(frame));
    } catch (error) {
      this.pause();
      this.errorMessage.set(
        error instanceof Error ? error.message : 'A formula falhou durante a animacao.',
      );
    }
  }

  private cloneState(state: FormulaSimulationStateModel): FormulaSimulationStateModel {
    return {
      time: state.time,
      acceleration: { ...state.acceleration },
      body: {
        ...state.body,
        position: { ...state.body.position },
        velocity: { ...state.body.velocity },
        force: { ...state.body.force },
        trail: state.body.trail.map((point) => ({ ...point })),
      },
    };
  }
}
