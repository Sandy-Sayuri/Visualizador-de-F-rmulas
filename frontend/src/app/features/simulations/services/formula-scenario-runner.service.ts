import { computed, inject, Injectable, signal } from '@angular/core';

import { FormulaScenarioEngineService, FormulaScenarioProgram } from '../formula/formula-scenario-engine.service';
import { FormulaScenarioVisualizationService } from '../formula/formula-scenario-visualization.service';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioConfigModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../models/formula-scenario.model';
import { RuntimeBodyModel } from '../models/runtime-body.model';

@Injectable()
export class FormulaScenarioRunnerService {
  private readonly engine = inject(FormulaScenarioEngineService);
  private readonly visualization = inject(FormulaScenarioVisualizationService);

  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private initialState: FormulaScenarioStateModel | null = null;
  private program: FormulaScenarioProgram | null = null;

  readonly config = signal<FormulaScenarioConfigModel | null>(null);
  readonly analysis = signal<FormulaScenarioAnalysisModel | null>(null);
  readonly state = signal<FormulaScenarioStateModel | null>(null);
  readonly isRunning = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedBodyId = signal<string | null>(null);
  readonly timeScale = signal(1);

  readonly visualScene = computed<FormulaScenarioVisualSceneModel>(() => {
    const currentAnalysis = this.analysis();
    const currentState = this.state();

    if (!currentAnalysis || !currentState) {
      return {
        bodies: [],
        decorations: [],
        legendItems: [],
        decision: {
          mode: 'single-particle',
          particleCount: 0,
          showVectors: false,
          showTrails: false,
          showPatterns: false,
        },
      };
    }

    return this.visualization.buildScene(currentAnalysis, currentState);
  });

  readonly bodies = computed<RuntimeBodyModel[]>(() => this.visualScene().bodies);
  readonly selectedBody = computed<RuntimeBodyModel | null>(() => {
    const selectedId = this.selectedBodyId();
    const bodies = this.bodies();

    return bodies.find((body) => body.id === selectedId) ?? bodies[0] ?? null;
  });
  readonly elapsedSeconds = computed(() => this.state()?.time ?? 0);

  loadConfig(config: FormulaScenarioConfigModel): void {
    this.pause();

    try {
      const program = this.engine.compileProgram(config);
      const initialState = this.engine.createInitialState(config, program);

      this.program = program;
      this.initialState = this.cloneState(initialState);
      this.config.set({ ...config, parameterValues: { ...config.parameterValues } });
      this.analysis.set(program.analysis);
      this.state.set(initialState);
      this.selectedBodyId.set(initialState.bodies[0]?.id ?? null);
      this.errorMessage.set(null);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Nao foi possivel aplicar a formula.',
      );
    }
  }

  selectBody(bodyId: string): void {
    this.selectedBodyId.set(bodyId);
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
      const nextState = this.cloneState(this.initialState);
      this.state.set(nextState);
      this.selectedBodyId.set(nextState.bodies[0]?.id ?? null);
      this.errorMessage.set(null);
    }
  }

  destroy(): void {
    this.pause();
  }

  setTimeScale(nextScale: number): void {
    const safeScale = Number.isFinite(nextScale)
      ? Math.min(8, Math.max(0.25, nextScale))
      : 1;

    this.timeScale.set(safeScale);
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
        Math.min(0.03, (timestamp - this.lastTimestamp) / 1000) * this.timeScale();
      this.lastTimestamp = timestamp;
      this.state.set(this.engine.step(currentState, currentConfig, this.program, deltaTime));
      this.animationFrameId = requestAnimationFrame((frame) => this.tick(frame));
    } catch (error) {
      this.pause();
      this.errorMessage.set(
        error instanceof Error ? error.message : 'A formula falhou durante a animacao.',
      );
    }
  }

  private cloneState(state: FormulaScenarioStateModel): FormulaScenarioStateModel {
    return {
      time: state.time,
      bodies: state.bodies.map((body) => ({
        ...body,
        position: { ...body.position },
        velocity: { ...body.velocity },
        force: { ...body.force },
        trail: body.trail.map((point) => ({ ...point })),
      })),
      sceneData: state.sceneData ? structuredClone(state.sceneData) : undefined,
    };
  }
}
