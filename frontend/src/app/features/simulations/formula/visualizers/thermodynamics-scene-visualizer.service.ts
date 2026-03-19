import { Injectable } from '@angular/core';

import { FormulaSceneVisualizerModel } from '../../models/formula-engine.model';
import { CanvasDecorationModel, CanvasLegendItemModel } from '../../models/canvas-decoration.model';
import { ThermodynamicsSceneSnapshotModel } from '../../models/thermodynamics-scene.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../../models/formula-scenario.model';

@Injectable({
  providedIn: 'root',
})
export class ThermodynamicsSceneVisualizerService
  implements FormulaSceneVisualizerModel
{
  readonly id = 'thermodynamics-box-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.domain === 'thermodynamics';
  }

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const thermo = state.sceneData?.thermodynamics;

    if (!thermo) {
      return {
        bodies: state.bodies,
        decorations: [],
        legendItems: [],
        decision: {
          mode: 'thermo-chamber',
          particleCount: state.bodies.length,
          showVectors: false,
          showTrails: false,
          showPatterns: true,
        },
      };
    }

    return {
      bodies: state.bodies,
      decorations: this.buildDecorations(thermo),
      legendItems: this.buildLegend(analysis, thermo),
      decision: {
        mode: 'thermo-chamber',
        particleCount: state.bodies.length,
        showVectors: false,
        showTrails: false,
        showPatterns: true,
      },
    };
  }

  private buildDecorations(
    thermo: ThermodynamicsSceneSnapshotModel,
  ): CanvasDecorationModel[] {
    const { bounds } = thermo;
    const container: CanvasDecorationModel[] = [
      {
        kind: 'line',
        from: { x: bounds.minX, y: bounds.minY },
        to: { x: bounds.maxX, y: bounds.minY },
        color: '#f5f1e6',
        width: 2,
        opacity: 0.52,
      },
      {
        kind: 'line',
        from: { x: bounds.minX, y: bounds.maxY },
        to: { x: bounds.maxX, y: bounds.maxY },
        color: '#f5f1e6',
        width: 2,
        opacity: 0.52,
      },
      {
        kind: 'line',
        from: { x: bounds.minX, y: bounds.minY },
        to: { x: bounds.minX, y: bounds.maxY },
        color: '#f5f1e6',
        width: 2.2,
        opacity: 0.62,
      },
      {
        kind: 'line',
        from: { x: bounds.maxX, y: bounds.minY },
        to: { x: bounds.maxX, y: bounds.maxY },
        color:
          thermo.scenario === 'compression'
            ? '#f4c66a'
            : '#9dc7ff',
        width: thermo.scenario === 'compression' ? 3 : 2.2,
        opacity: 0.76,
      },
      {
        kind: 'path',
        points: thermo.gaugePoints,
        color: '#ff9d5c',
        width: 4,
        opacity: 0.85,
      },
      {
        kind: 'dot',
        position: thermo.gaugePoints[1],
        radius: 4.5,
        color: '#ff9d5c',
        opacity: 0.92,
      },
    ];

    if (thermo.scenario === 'compression') {
      container.push({
        kind: 'line',
        from: { x: bounds.maxX + 10, y: bounds.minY - 16 },
        to: { x: bounds.maxX + 10, y: bounds.maxY + 16 },
        color: '#f4c66a',
        width: 1,
        opacity: 0.22,
        dashed: true,
      });
    }

    return container;
  }

  private buildLegend(
    analysis: FormulaScenarioAnalysisModel,
    thermo: ThermodynamicsSceneSnapshotModel,
  ): CanvasLegendItemModel[] {
    const legend: CanvasLegendItemModel[] = [
      { key: 'particles', tone: 'pulse', label: 'Particulas' },
      { key: 'container', tone: 'interaction', label: 'Recipiente' },
      { key: 'temperature', tone: 'velocity', label: 'Temperatura' },
    ];

    if (analysis.classification.family === 'compression' || thermo.scenario === 'compression') {
      legend.push({ key: 'volume', tone: 'pattern', label: 'Pistao' });
    }

    return legend;
  }
}
