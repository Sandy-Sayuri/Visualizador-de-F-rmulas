import { Injectable } from '@angular/core';

import { FormulaSceneVisualizerModel } from '../../models/formula-engine.model';
import {
  CanvasDecorationModel,
  CanvasLegendItemModel,
} from '../../models/canvas-decoration.model';
import { ElectromagnetismSceneSnapshotModel } from '../../models/electromagnetism-scene.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../../models/formula-scenario.model';

@Injectable({
  providedIn: 'root',
})
export class ElectromagnetismSceneVisualizerService
  implements FormulaSceneVisualizerModel
{
  readonly id = 'electromagnetism-field-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.domain === 'electromagnetism';
  }

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const scene = state.sceneData?.electromagnetism;

    if (!scene) {
      return {
        bodies: state.bodies,
        decorations: [],
        legendItems: [],
        decision: {
          mode: 'electric-field',
          particleCount: state.bodies.length,
          showVectors: false,
          showTrails: true,
          showPatterns: true,
        },
      };
    }

    return {
      bodies: state.bodies,
      decorations: this.buildDecorations(scene),
      legendItems: this.buildLegend(scene),
      decision: {
        mode: 'electric-field',
        particleCount: state.bodies.length,
        showVectors: false,
        showTrails: analysis.classification.family !== 'field-guided',
        showPatterns: true,
      },
    };
  }

  private buildDecorations(
    scene: ElectromagnetismSceneSnapshotModel,
  ): CanvasDecorationModel[] {
    const lineDecorations: CanvasDecorationModel[] = scene.lines.map((line) => ({
      kind: 'line',
      ...line,
    }));
    const pathDecorations: CanvasDecorationModel[] = scene.paths.map((path) => ({
      kind: 'path',
      ...path,
    }));
    const arrowDecorations: CanvasDecorationModel[] = scene.arrows.map((arrow) => ({
      kind: 'arrow',
      ...arrow,
    }));
    const pointDecorations: CanvasDecorationModel[] = scene.points.flatMap((point) => {
      const decorations: CanvasDecorationModel[] = [
        {
          kind: 'dot',
          position: point.position,
          radius: point.radius,
          color: point.color,
          opacity: point.opacity,
        },
      ];

      if (point.ringRadius) {
        decorations.push({
          kind: 'ring',
          center: point.position,
          radius: point.ringRadius,
          color: point.color,
          opacity: point.opacity * 0.62,
          width: 1.2,
          dashed: true,
        });
      }

      return decorations;
    });

    return [
      ...lineDecorations,
      ...pathDecorations,
      ...arrowDecorations,
      ...pointDecorations,
    ];
  }

  private buildLegend(
    scene: ElectromagnetismSceneSnapshotModel,
  ): CanvasLegendItemModel[] {
    const legend: CanvasLegendItemModel[] = [
      { key: 'field', tone: 'field', label: 'Campo' },
      { key: 'force', tone: 'force', label: 'Forca' },
      { key: 'interaction', tone: 'interaction', label: 'Cargas' },
    ];

    if (scene.scenario === 'coulomb') {
      legend.push({ key: 'trail', tone: 'trail', label: 'Rastro' });
    }

    return legend;
  }
}
