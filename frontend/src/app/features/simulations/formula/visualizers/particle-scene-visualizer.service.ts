import { Injectable } from '@angular/core';

import { FormulaSceneVisualizerModel } from '../../models/formula-engine.model';
import {
  FormulaSceneDecisionModel,
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../../models/formula-scenario.model';
import { CanvasDecorationModel } from '../../models/canvas-decoration.model';

@Injectable({
  providedIn: 'root',
})
export class ParticleSceneVisualizerService
  implements FormulaSceneVisualizerModel
{
  readonly id = 'particle-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.visualStrategy === 'particle';
  }

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const decorations: CanvasDecorationModel[] = [];

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
      legendItems: [],
      decision: {
        mode: 'single-particle',
        particleCount: state.bodies.length,
        showVectors: false,
        showTrails: false,
        showPatterns: false,
      },
    };
  }
}
