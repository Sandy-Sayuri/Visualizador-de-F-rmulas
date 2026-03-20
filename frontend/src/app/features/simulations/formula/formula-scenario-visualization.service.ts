import { inject, Injectable } from '@angular/core';

import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioConfigModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../models/formula-scenario.model';
import { RuntimeBodyModel } from '../models/runtime-body.model';
import { Vector2Model } from '../models/vector2.model';
import { FormulaScenarioRendererRegistryService } from './formula-scenario-renderer-registry.service';

const DEFAULT_VISUAL_PARTICLE_COUNT = 8;
const MIN_VISUAL_PARTICLE_COUNT = 1;
const MAX_VISUAL_PARTICLE_COUNT = 24;
const ELIGIBLE_VISUAL_PARTICLE_MODES = new Set([
  'single-particle',
  'single-trajectory',
  'oscillation',
]);

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioVisualizationService {
  private readonly rendererRegistry = inject(FormulaScenarioRendererRegistryService);

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
  ): FormulaScenarioVisualSceneModel {
    const visualizer = this.rendererRegistry.resolve(analysis);

    if (!visualizer) {
      return this.applyVisualParticleCount(
        {
          bodies: state.bodies,
          decorations: [],
          legendItems: [],
          decision: {
            mode: 'single-particle',
            particleCount: state.bodies.length,
            showVectors: false,
            showTrails: false,
            showPatterns: false,
          },
        },
        state,
        config,
      );
    }

    return this.applyVisualParticleCount(
      visualizer.buildScene(analysis, state),
      state,
      config,
    );
  }

  private applyVisualParticleCount(
    scene: FormulaScenarioVisualSceneModel,
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
  ): FormulaScenarioVisualSceneModel {
    if (!ELIGIBLE_VISUAL_PARTICLE_MODES.has(scene.decision.mode)) {
      return scene;
    }

    const baseBodies = scene.bodies.filter((body) => !body.visualOnly);
    const primaryBody = baseBodies[0];

    if (!primaryBody || baseBodies.length !== 1) {
      return scene;
    }

    const targetCount = this.resolveVisualParticleCount(config.visualParticleCount);

    if (targetCount <= baseBodies.length) {
      return {
        ...scene,
        decision: {
          ...scene.decision,
          particleCount: baseBodies.length,
        },
      };
    }

    const visualBodies = this.createVisualBodies(
      primaryBody,
      targetCount - baseBodies.length,
      state.time,
      scene.decision.showTrails,
    );

    return {
      ...scene,
      bodies: [...scene.bodies, ...visualBodies],
      decision: {
        ...scene.decision,
        particleCount: scene.bodies.length + visualBodies.length,
      },
    };
  }

  private createVisualBodies(
    primaryBody: RuntimeBodyModel,
    extraCount: number,
    time: number,
    showTrails: boolean,
  ): RuntimeBodyModel[] {
    const trailSamples = this.sampleTrailPoints(primaryBody, extraCount);

    return Array.from({ length: extraCount }, (_, index) => {
      const placement = this.createVisualPlacement(
        primaryBody,
        trailSamples[index] ?? primaryBody.position,
        index,
        extraCount,
        time,
        showTrails,
      );

      return {
        ...primaryBody,
        id: `${primaryBody.id}-visual-${index + 1}`,
        name: '',
        position: placement,
        velocity: { ...primaryBody.velocity },
        force: { ...primaryBody.force },
        radius: Math.max(3, primaryBody.radius * 0.72),
        trail: [],
        visualOnly: true,
      };
    });
  }

  private sampleTrailPoints(
    body: RuntimeBodyModel,
    count: number,
  ): Vector2Model[] {
    const samples = body.trail.length ? body.trail : [body.position];
    const lastIndex = Math.max(0, samples.length - 1);

    return Array.from({ length: count }, (_, index) => {
      const sampleIndex = Math.floor(((index + 1) / (count + 1)) * lastIndex);
      const sample = samples[sampleIndex] ?? body.position;

      return { ...sample };
    });
  }

  private createVisualPlacement(
    body: RuntimeBodyModel,
    anchor: Vector2Model,
    index: number,
    extraCount: number,
    time: number,
    showTrails: boolean,
  ): Vector2Model {
    const hasMeaningfulTrail = showTrails && body.trail.length > 3;
    const orbitAngle = time * 1.45 + index * 0.88;
    const orbitRadius = hasMeaningfulTrail
      ? Math.max(2, body.radius * 0.28)
      : Math.max(12, body.radius * 1.4) + (index % 3) * 3;
    const spreadAngle = (Math.PI * 2 * index) / Math.max(1, extraCount);

    return {
      x: anchor.x + Math.cos(orbitAngle + spreadAngle) * orbitRadius,
      y: anchor.y + Math.sin(orbitAngle + spreadAngle) * orbitRadius,
    };
  }

  private resolveVisualParticleCount(value: number | undefined): number {
    if (!Number.isFinite(value)) {
      return DEFAULT_VISUAL_PARTICLE_COUNT;
    }

    const safeValue = value ?? DEFAULT_VISUAL_PARTICLE_COUNT;

    return Math.min(
      MAX_VISUAL_PARTICLE_COUNT,
      Math.max(MIN_VISUAL_PARTICLE_COUNT, Math.round(safeValue)),
    );
  }
}
