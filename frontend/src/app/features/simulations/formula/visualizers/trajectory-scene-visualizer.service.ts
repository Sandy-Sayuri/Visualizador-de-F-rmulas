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
export class TrajectorySceneVisualizerService
  implements FormulaSceneVisualizerModel
{
  readonly id = 'trajectory-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.visualStrategy === 'trajectory';
  }

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const decorations: CanvasDecorationModel[] = [];
    const legendItems: CanvasLegendItemModel[] = [{ key: 'trail', tone: 'trail' }];
    const showVectors =
      analysis.evaluationMode === 'acceleration' ||
      analysis.evaluationMode === 'force';

    if (showVectors) {
      legendItems.push({ key: 'velocity', tone: 'velocity' });
      legendItems.push({ key: 'force', tone: 'force' });
    }

    if (analysis.axis === 'y') {
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

    return {
      bodies: state.bodies,
      decorations,
      legendItems,
      decision: {
        mode: 'single-trajectory',
        particleCount: state.bodies.length,
        showVectors,
        showTrails: true,
        showPatterns: false,
      },
    };
  }
}
