import { Injectable } from '@angular/core';

import { FormulaSceneVisualizerModel } from '../../models/formula-engine.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../../models/formula-scenario.model';
import { CanvasDecorationModel, CanvasLegendItemModel } from '../../models/canvas-decoration.model';

@Injectable({
  providedIn: 'root',
})
export class OscillationSceneVisualizerService
  implements FormulaSceneVisualizerModel
{
  readonly id = 'oscillation-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.visualStrategy === 'oscillation-pattern';
  }

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const decorations = this.createOscillationGuides(state, analysis.axis);
    const legendItems: CanvasLegendItemModel[] = [
      { key: 'trail', tone: 'trail' },
      { key: 'pattern', tone: 'pattern' },
    ];
    const showVectors =
      analysis.evaluationMode === 'acceleration' ||
      analysis.evaluationMode === 'force';

    if (showVectors) {
      legendItems.unshift({ key: 'force', tone: 'force' });
      legendItems.unshift({ key: 'velocity', tone: 'velocity' });
    }

    return {
      bodies: state.bodies,
      decorations,
      legendItems,
      decision: {
        mode: 'oscillation',
        particleCount: state.bodies.length,
        showVectors,
        showTrails: true,
        showPatterns: true,
      },
    };
  }

  private createOscillationGuides(
    state: FormulaScenarioStateModel,
    axis: 'x' | 'y',
  ): CanvasDecorationModel[] {
    const position = state.bodies[0]?.position ?? { x: 0, y: 0 };
    const amplitude = Math.max(
      80,
      axis === 'x' ? Math.abs(position.x) + 40 : Math.abs(position.y) + 40,
    );

    return axis === 'x'
      ? [
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
        ]
      : [
          {
            kind: 'line',
            from: { x: 0, y: -amplitude },
            to: { x: 0, y: amplitude },
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
}
