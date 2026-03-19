import { Injectable } from '@angular/core';

import { CanvasDecorationModel, CanvasLegendItemModel } from '../../models/canvas-decoration.model';
import { InclinedPlaneSceneSnapshotModel } from '../../models/inclined-plane-scene.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';
import { Vector2Model } from '../../models/vector2.model';
import { FormulaSceneVisualizerModel } from '../../models/formula-engine.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../../models/formula-scenario.model';

@Injectable({
  providedIn: 'root',
})
export class InclinedPlaneSceneVisualizerService implements FormulaSceneVisualizerModel {
  private readonly blockLift = 18;

  readonly id = 'inclined-plane-visualizer';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.visualStrategy === 'inclined-plane';
  }

  buildScene(
    _analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const incline = state.sceneData?.inclinedPlane;

    if (!incline) {
      return {
        bodies: state.bodies,
        decorations: [],
        legendItems: [],
        decision: {
          mode: 'inclined-plane',
          particleCount: state.bodies.length,
          showVectors: true,
          showTrails: true,
          showPatterns: true,
        },
      };
    }

    const bodies = state.bodies.map((body) => this.projectBody(body, incline));
    const block = bodies[0];
    const origin = block?.position ?? this.projectPoint(0, incline);

    return {
      bodies,
      decorations: this.buildDecorations(origin, incline),
      legendItems: this.buildLegend(),
      decision: {
        mode: 'inclined-plane',
        particleCount: bodies.length,
        showVectors: true,
        showTrails: true,
        showPatterns: true,
      },
    };
  }

  private buildDecorations(
    origin: Vector2Model,
    incline: InclinedPlaneSceneSnapshotModel,
  ): CanvasDecorationModel[] {
    const baseStart = {
      x: incline.bottomPoint.x - 96,
      y: incline.bottomPoint.y,
    };
    const weightDirection = { x: 0, y: -1 };
    const parallelDirection = incline.tangent;
    const intoPlaneDirection = {
      x: -incline.outwardNormal.x,
      y: -incline.outwardNormal.y,
    };

    return [
      {
        kind: 'line',
        from: incline.topPoint,
        to: incline.bottomPoint,
        color: '#f5f1e6',
        width: 3,
        opacity: 0.9,
      },
      {
        kind: 'line',
        from: baseStart,
        to: incline.bottomPoint,
        color: '#9dc7ff',
        width: 1.2,
        opacity: 0.28,
        dashed: true,
      },
      {
        kind: 'arrow',
        from: origin,
        to: this.translate(origin, weightDirection, this.toArrowLength(incline.weightMagnitude, 110)),
        color: '#ff7b72',
        width: 2.6,
        opacity: 0.95,
      },
      {
        kind: 'arrow',
        from: origin,
        to: this.translate(
          origin,
          parallelDirection,
          this.toArrowLength(incline.parallelMagnitude, 92),
        ),
        color: '#f4c66a',
        width: 2.4,
        opacity: 0.96,
      },
      {
        kind: 'arrow',
        from: origin,
        to: this.translate(
          origin,
          intoPlaneDirection,
          this.toArrowLength(incline.perpendicularMagnitude, 84),
        ),
        color: '#7ce6ff',
        width: 2.4,
        opacity: 0.92,
      },
      {
        kind: 'arc',
        center: incline.bottomPoint,
        radius: 42,
        startAngle: Math.PI,
        endAngle: Math.PI - this.toRadians(incline.angleDeg),
        color: '#f4c66a',
        width: 1.6,
        opacity: 0.72,
      },
    ];
  }

  private buildLegend(): CanvasLegendItemModel[] {
    return [
      { key: 'weight', tone: 'force', label: 'Peso total (mg)' },
      { key: 'parallel', tone: 'comparison', label: 'Componente paralela' },
      { key: 'perpendicular', tone: 'comparison', label: 'Componente perpendicular' },
      { key: 'trail', tone: 'trail', label: 'Deslocamento' },
    ];
  }

  private projectBody(
    body: RuntimeBodyModel,
    incline: InclinedPlaneSceneSnapshotModel,
  ): RuntimeBodyModel {
    return {
      ...body,
      position: this.projectPoint(body.position.x, incline),
      velocity: this.projectVector(body.velocity.x, incline.tangent),
      force: this.projectVector(body.force.x, incline.tangent),
      trail: body.trail.map((point) => this.projectPoint(point.x, incline)),
    };
  }

  private projectPoint(
    displacement: number,
    incline: InclinedPlaneSceneSnapshotModel,
  ): Vector2Model {
    const planePoint = {
      x: incline.topPoint.x + incline.tangent.x * displacement,
      y: incline.topPoint.y + incline.tangent.y * displacement,
    };

    return {
      x: planePoint.x + incline.outwardNormal.x * this.blockLift,
      y: planePoint.y + incline.outwardNormal.y * this.blockLift,
    };
  }

  private projectVector(magnitude: number, direction: Vector2Model): Vector2Model {
    return {
      x: direction.x * magnitude,
      y: direction.y * magnitude,
    };
  }

  private translate(
    origin: Vector2Model,
    direction: Vector2Model,
    length: number,
  ): Vector2Model {
    return {
      x: origin.x + direction.x * length,
      y: origin.y + direction.y * length,
    };
  }

  private toArrowLength(magnitude: number, maxLength: number): number {
    return Math.min(maxLength, Math.max(28, 18 + magnitude * 0.24));
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
