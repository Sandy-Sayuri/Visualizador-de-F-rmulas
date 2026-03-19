import { Injectable } from '@angular/core';

import { FormulaSceneVisualizerModel } from '../../models/formula-engine.model';
import { CanvasDecorationModel, CanvasLegendItemModel } from '../../models/canvas-decoration.model';
import { OpticalSceneSnapshotModel } from '../../models/optical-scene.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../../models/formula-scenario.model';

@Injectable({
  providedIn: 'root',
})
export class OpticalSceneVisualizerService implements FormulaSceneVisualizerModel {
  readonly id = 'optical-rays-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.visualStrategy === 'optical-rays';
  }

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const optical = state.sceneData?.optical;

    if (!optical) {
      return {
        bodies: state.bodies,
        decorations: [],
        legendItems: [],
        decision: {
          mode: 'optical-rays',
          particleCount: state.bodies.length,
          showVectors: false,
          showTrails: false,
          showPatterns: true,
        },
      };
    }

    return {
      bodies: state.bodies,
      decorations: this.buildDecorations(optical),
      legendItems: this.buildLegend(optical),
      decision: {
        mode: 'optical-rays',
        particleCount: state.bodies.length,
        showVectors: false,
        showTrails: false,
        showPatterns: analysis.classification.family !== 'reflection',
      },
    };
  }

  private buildDecorations(optical: OpticalSceneSnapshotModel): CanvasDecorationModel[] {
    const lineDecorations: CanvasDecorationModel[] = optical.lines.map((line) => ({
      kind: 'line',
      ...line,
    }));
    const arcDecorations: CanvasDecorationModel[] = optical.arcs.map((arc) => ({
      kind: 'arc',
      ...arc,
    }));
    const pointDecorations: CanvasDecorationModel[] = optical.points.flatMap((point) => {
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
          opacity: point.opacity * 0.7,
          width: 1.2,
          dashed: true,
        });
      }

      return decorations;
    });

    return [...lineDecorations, ...arcDecorations, ...pointDecorations];
  }

  private buildLegend(optical: OpticalSceneSnapshotModel): CanvasLegendItemModel[] {
    const legend: CanvasLegendItemModel[] = [
      { key: 'ray', tone: 'ray', label: 'Raios' },
      { key: 'angle', tone: 'pattern', label: 'Angulos' },
    ];

    if (optical.scenario === 'refraction') {
      legend.push({ key: 'interface', tone: 'interaction', label: 'Interface' });
    }

    if (optical.scenario === 'lens') {
      legend.push({ key: 'focus', tone: 'anchor', label: 'Foco' });
    }

    return legend;
  }
}
