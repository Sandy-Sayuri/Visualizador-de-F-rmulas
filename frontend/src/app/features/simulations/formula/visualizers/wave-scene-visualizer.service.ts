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
export class WaveSceneVisualizerService implements FormulaSceneVisualizerModel {
  readonly id = 'wave-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.visualStrategy === 'wave';
  }

  buildScene(
    _analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const sortedBodies = [...state.bodies].sort(
      (left, right) => left.position.x - right.position.x,
    );
    const amplitude = Math.max(
      60,
      ...sortedBodies.map((body) => Math.abs(body.position.y)),
    );
    const leftmostPoint = sortedBodies[0]?.position;
    const rightmostPoint = sortedBodies[sortedBodies.length - 1]?.position;
    const decorations: CanvasDecorationModel[] = [
      {
        kind: 'path',
        points: sortedBodies.map((body) => body.position),
        color: '#7ce6ff',
        width: 2.4,
        opacity: 0.95,
      },
    ];
    const legendItems: CanvasLegendItemModel[] = [
      { key: 'wave', tone: 'pattern', label: 'Onda' },
      { key: 'amplitude', tone: 'pattern', label: 'Amplitude' },
    ];

    if (leftmostPoint && rightmostPoint) {
      decorations.push(
        {
          kind: 'line',
          from: { x: leftmostPoint.x, y: 0 },
          to: { x: rightmostPoint.x, y: 0 },
          color: '#9dc7ff',
          width: 1,
          opacity: 0.2,
          dashed: true,
        },
        {
          kind: 'line',
          from: { x: 0, y: -amplitude },
          to: { x: 0, y: amplitude },
          color: '#f4c66a',
          width: 1,
          opacity: 0.22,
          dashed: true,
        },
      );
    }

    return {
      bodies: sortedBodies,
      decorations,
      legendItems,
      decision: {
        mode: 'wave-field',
        particleCount: sortedBodies.length,
        showVectors: false,
        showTrails: false,
        showPatterns: true,
      },
    };
  }
}
