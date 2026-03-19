import { Injectable } from '@angular/core';

import {
  FormulaSceneDecisionModel,
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../models/formula-scenario.model';
import { CanvasDecorationModel, CanvasLegendItemModel } from '../models/canvas-decoration.model';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioVisualizationService {
  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const decision = this.decide(analysis, state);
    const decorations: CanvasDecorationModel[] = [];
    const legendItems: CanvasLegendItemModel[] = [];

    if (decision.showTrails) {
      legendItems.push({ key: 'trail', tone: 'trail' });
    }

    if (decision.showVectors) {
      legendItems.push({ key: 'velocity', tone: 'velocity' });
      legendItems.push({ key: 'force', tone: 'force' });
    }

    if (analysis.category === 'harmonic-oscillation') {
      decorations.push(...this.createOscillationGuides(state));
      legendItems.push({ key: 'pattern', tone: 'pattern' });
    }

    if (analysis.category === 'vertical-launch') {
      decorations.push({
        kind: 'line',
        from: { x: -220, y: 0 },
        to: { x: 220, y: 0 },
        color: '#9dc7ff',
        width: 1,
        opacity: 0.18,
        dashed: true,
      });
    }

    if (analysis.category === 'two-body-gravity' && state.bodies.length >= 2) {
      const [primaryBody, secondaryBody] = state.bodies;
      const barycenter = {
        x:
          (primaryBody.position.x * primaryBody.mass +
            secondaryBody.position.x * secondaryBody.mass) /
          (primaryBody.mass + secondaryBody.mass),
        y:
          (primaryBody.position.y * primaryBody.mass +
            secondaryBody.position.y * secondaryBody.mass) /
          (primaryBody.mass + secondaryBody.mass),
      };

      decorations.push(
        {
          kind: 'line',
          from: primaryBody.position,
          to: secondaryBody.position,
          color: '#f4c66a',
          width: 1.1,
          opacity: 0.22,
        },
        {
          kind: 'dot',
          position: barycenter,
          radius: 4,
          color: '#f4c66a',
          opacity: 0.9,
        },
        {
          kind: 'ring',
          center: barycenter,
          radius: 18,
          color: '#f4c66a',
          opacity: 0.16,
          width: 1,
          dashed: true,
        },
      );

      legendItems.push({ key: 'interaction', tone: 'interaction' });
    }

    return {
      bodies: state.bodies,
      decorations,
      legendItems: this.deduplicateLegend(legendItems),
      decision,
    };
  }

  private decide(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaSceneDecisionModel {
    switch (analysis.category) {
      case 'uniform-motion':
        return {
          mode: 'single-particle',
          particleCount: state.bodies.length,
          showVectors: false,
          showTrails: false,
          showPatterns: false,
        };
      case 'uniform-acceleration':
      case 'vertical-launch':
        return {
          mode: 'single-trajectory',
          particleCount: state.bodies.length,
          showVectors: false,
          showTrails: true,
          showPatterns: false,
        };
      case 'harmonic-oscillation':
        return {
          mode: 'oscillation',
          particleCount: state.bodies.length,
          showVectors: false,
          showTrails: true,
          showPatterns: true,
        };
      case 'two-body-gravity':
        return {
          mode: 'pair-interaction',
          particleCount: state.bodies.length,
          showVectors: true,
          showTrails: true,
          showPatterns: false,
        };
    }
  }

  private createOscillationGuides(
    state: FormulaScenarioStateModel,
  ): CanvasDecorationModel[] {
    const position = state.bodies[0]?.position ?? { x: 0, y: 0 };
    const amplitude = Math.max(80, Math.abs(position.x) + 40);

    return [
      {
        kind: 'line',
        from: { x: -amplitude, y: 0 },
        to: { x: amplitude, y: 0 },
        color: '#d6f0ff',
        width: 1,
        opacity: 0.24,
      },
      {
        kind: 'ring',
        center: { x: 0, y: 0 },
        radius: 16,
        color: '#d6f0ff',
        opacity: 0.18,
        width: 1,
      },
    ];
  }

  private deduplicateLegend(items: CanvasLegendItemModel[]): CanvasLegendItemModel[] {
    const seen = new Set<string>();

    return items.filter((item) => {
      if (seen.has(item.key)) {
        return false;
      }

      seen.add(item.key);
      return true;
    });
  }
}
