import { inject, Injectable } from '@angular/core';

import {
  FormulaScenarioProgramContract,
  FormulaScenarioSolverContextModel,
  FormulaScenarioSolverModel,
} from '../../models/formula-engine.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioConfigModel,
  FormulaScenarioStateModel,
} from '../../models/formula-scenario.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';
import { Vector2Model } from '../../models/vector2.model';
import { FormulaScenarioSolverSupportService } from './formula-scenario-solver-support.service';

interface InclinedPlaneSnapshot {
  angleDeg: number;
  gravity: number;
  mass: number;
  acceleration: number;
  planeLength: number;
  topPoint: Vector2Model;
  bottomPoint: Vector2Model;
  tangent: Vector2Model;
  outwardNormal: Vector2Model;
  weightMagnitude: number;
  parallelMagnitude: number;
  perpendicularMagnitude: number;
}

@Injectable({
  providedIn: 'root',
})
export class InclinedPlaneFormulaSolverService implements FormulaScenarioSolverModel {
  private readonly support = inject(FormulaScenarioSolverSupportService);
  private readonly planeLength = 320;
  private readonly blockClearance = 24;

  readonly id = 'inclined-plane-solver';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.solverStrategy === 'guided-dynamics';
  }

  createValidationScope(
    _analysis: FormulaScenarioAnalysisModel,
    config: FormulaScenarioConfigModel,
    _context: FormulaScenarioSolverContextModel,
  ): Record<string, number> {
    return {
      ...config.parameterValues,
      t: 0,
      dt: 0,
      pi: Math.PI,
      e: Math.E,
    };
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    _program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const scene = this.resolveScene(config);
    const body = this.createBody(
      {
        displacement: 0,
        velocity: 0,
      },
      config,
      scene,
      [],
      context,
    );

    return {
      time: 0,
      bodies: [body],
      sceneData: {
        inclinedPlane: scene,
      },
    };
  }

  step(
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    _program: FormulaScenarioProgramContract,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const scene = this.resolveScene(config);
    const currentBody = state.bodies[0];
    const currentDisplacement = currentBody?.position.x ?? 0;
    const currentVelocity = currentBody?.velocity.x ?? 0;
    const maxDisplacement = Math.max(0, scene.planeLength - this.blockClearance);

    let nextDisplacement =
      currentDisplacement +
      currentVelocity * deltaTime +
      0.5 * scene.acceleration * deltaTime * deltaTime;
    let nextVelocity = currentVelocity + scene.acceleration * deltaTime;

    if (nextDisplacement >= maxDisplacement) {
      nextDisplacement = maxDisplacement;
      nextVelocity = 0;
    }

    const nextBody = this.createBody(
      {
        displacement: nextDisplacement,
        velocity: nextVelocity,
      },
      config,
      scene,
      currentBody?.trail ?? [],
      context,
    );

    return {
      time: state.time + deltaTime,
      bodies: [nextBody],
      sceneData: {
        inclinedPlane: scene,
      },
    };
  }

  private createBody(
    state: {
      displacement: number;
      velocity: number;
    },
    config: FormulaScenarioConfigModel,
    scene: InclinedPlaneSnapshot,
    currentTrail: Vector2Model[],
    context: FormulaScenarioSolverContextModel,
  ): RuntimeBodyModel {
    const remainingDistance = Math.max(
      0,
      scene.planeLength - this.blockClearance - state.displacement,
    );
    const remainingHeight = remainingDistance * Math.sin(this.toRadians(scene.angleDeg));
    const trail = this.support.appendTrailPoint(
      currentTrail,
      { x: state.displacement, y: 0 },
      context.maxTrailPoints,
    );
    const body = this.support.createRuntimeBody({
      id: 'inclined-plane-block',
      name: config.primaryLabel || 'Bloco',
      color: config.primaryColor,
      mass: scene.mass,
      radius: config.particleRadius + 2,
      position: {
        x: state.displacement,
        y: 0,
      },
      velocity: {
        x: state.velocity,
        y: 0,
      },
      force: {
        x: scene.parallelMagnitude,
        y: 0,
      },
      potentialEnergy: scene.mass * scene.gravity * remainingHeight,
      trail,
    });

    this.support.ensureFiniteVector(body.position, context.maxAbsoluteCoordinate);
    this.support.ensureFiniteVector(body.velocity, context.maxAbsoluteCoordinate);
    this.support.ensureFiniteVector(body.force, context.maxAbsoluteCoordinate);

    return body;
  }

  private resolveScene(config: FormulaScenarioConfigModel): InclinedPlaneSnapshot {
    const angleDeg = this.clamp(config.parameterValues['angleDeg'] ?? 28, 5, 60);
    const gravity = this.clamp(config.parameterValues['g'] ?? 9.81, 1, 20);
    const mass = this.clamp(config.parameterValues['mass'] ?? 12, 0.1, 1000);
    const angleRad = this.toRadians(angleDeg);
    const tangent = {
      x: Math.cos(angleRad),
      y: -Math.sin(angleRad),
    };
    const outwardNormal = {
      x: Math.sin(angleRad),
      y: Math.cos(angleRad),
    };
    const topPoint = { x: -150, y: 130 };
    const bottomPoint = {
      x: topPoint.x + tangent.x * this.planeLength,
      y: topPoint.y + tangent.y * this.planeLength,
    };
    const weightMagnitude = mass * gravity;
    const parallelMagnitude = weightMagnitude * Math.sin(angleRad);
    const perpendicularMagnitude = weightMagnitude * Math.cos(angleRad);

    return {
      angleDeg,
      gravity,
      mass,
      acceleration: gravity * Math.sin(angleRad),
      planeLength: this.planeLength,
      topPoint,
      bottomPoint,
      tangent,
      outwardNormal,
      weightMagnitude,
      parallelMagnitude,
      perpendicularMagnitude,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
