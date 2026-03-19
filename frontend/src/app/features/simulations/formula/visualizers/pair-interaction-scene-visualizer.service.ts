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
export class PairInteractionSceneVisualizerService
  implements FormulaSceneVisualizerModel
{
  readonly id = 'pair-interaction-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.visualStrategy === 'pair-interaction';
  }

  buildScene(
    _analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const [primaryBody, secondaryBody] = state.bodies;
    const decorations: CanvasDecorationModel[] = [];
    const legendItems: CanvasLegendItemModel[] = [
      { key: 'trail', tone: 'trail' },
      { key: 'velocity', tone: 'velocity' },
      { key: 'force', tone: 'force' },
      { key: 'interaction', tone: 'interaction' },
    ];

    if (primaryBody && secondaryBody) {
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
    }

    return {
      bodies: state.bodies,
      decorations,
      legendItems,
      decision: {
        mode: 'pair-interaction',
        particleCount: state.bodies.length,
        showVectors: true,
        showTrails: true,
        showPatterns: false,
      },
    };
  }
}
