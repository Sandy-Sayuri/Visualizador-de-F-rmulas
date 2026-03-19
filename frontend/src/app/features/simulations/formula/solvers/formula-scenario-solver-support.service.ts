import { Injectable } from '@angular/core';

import { FormulaScenarioAnalysisModel, FormulaScenarioConfigModel } from '../../models/formula-scenario.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';
import { Vector2Model } from '../../models/vector2.model';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioSolverSupportService {
  createRuntimeBody(input: {
    id: string;
    name: string;
    color: string;
    mass: number;
    radius: number;
    position: Vector2Model;
    velocity: Vector2Model;
    force: Vector2Model;
    trail: Vector2Model[];
  }): RuntimeBodyModel {
    const speed = Math.hypot(input.velocity.x, input.velocity.y);
    const kineticEnergy = 0.5 * input.mass * speed * speed;

    return {
      id: input.id,
      name: input.name,
      color: input.color,
      mass: input.mass,
      radius: input.radius,
      position: input.position,
      velocity: input.velocity,
      force: input.force,
      speed,
      kineticEnergy,
      potentialEnergy: 0,
      totalEnergy: kineticEnergy,
      trail: input.trail,
    };
  }

  appendTrailPoint(
    trail: Vector2Model[],
    position: Vector2Model,
    maxTrailPoints: number,
  ): Vector2Model[] {
    const nextTrail = [...trail, { ...position }];

    if (nextTrail.length <= maxTrailPoints) {
      return nextTrail;
    }

    return nextTrail.slice(nextTrail.length - maxTrailPoints);
  }

  ensureFiniteVector(
    vector: Vector2Model,
    maxAbsoluteCoordinate: number,
  ): void {
    if (
      !Number.isFinite(vector.x) ||
      !Number.isFinite(vector.y) ||
      Math.abs(vector.x) > maxAbsoluteCoordinate ||
      Math.abs(vector.y) > maxAbsoluteCoordinate
    ) {
      throw new Error('A formula saiu da faixa segura de simulacao.');
    }
  }

  setAxisValue(
    vector: Vector2Model,
    axis: 'x' | 'y',
    value: number,
  ): Vector2Model {
    return axis === 'x'
      ? { x: value, y: vector.y }
      : { x: vector.x, y: value };
  }

  createBaseSingleBody(
    config: FormulaScenarioConfigModel,
    analysis: FormulaScenarioAnalysisModel,
  ): RuntimeBodyModel {
    const mass = Math.max(
      0.0000001,
      config.parameterValues['mass'] ?? config.parameterValues['m'] ?? 10,
    );
    const x0 = config.parameterValues['x0'] ?? 0;
    const y0 = config.parameterValues['y0'] ?? 0;
    const v0 = config.parameterValues['v0'] ?? 0;
    const velocity = {
      x: config.parameterValues['vx0'] ?? (analysis.axis === 'x' ? v0 : 0),
      y: config.parameterValues['vy0'] ?? (analysis.axis === 'y' ? v0 : 0),
    };

    return this.createRuntimeBody({
      id: 'formula-primary',
      name: config.primaryLabel,
      color: config.primaryColor,
      mass,
      radius: config.particleRadius,
      position: { x: x0, y: y0 },
      velocity,
      force: { x: 0, y: 0 },
      trail: [],
    });
  }

  createSingleScope(
    body: RuntimeBodyModel,
    time: number,
    deltaTime: number,
    mass: number,
    parameterValues: Record<string, number>,
  ): Record<string, number> {
    return {
      ...parameterValues,
      t: time,
      dt: deltaTime,
      x: body.position.x,
      y: body.position.y,
      vx: body.velocity.x,
      vy: body.velocity.y,
      ax: body.force.x / body.mass,
      ay: body.force.y / body.mass,
      force: Math.hypot(body.force.x, body.force.y),
      speed: body.speed,
      mass,
      m: mass,
      pi: Math.PI,
      e: Math.E,
    };
  }

  createSingleValidationScope(
    parameterValues: Record<string, number>,
    validationDeltaTime: number,
  ): Record<string, number> {
    const mass = Math.max(
      0.0000001,
      parameterValues['mass'] ?? parameterValues['m'] ?? 10,
    );

    return {
      ...parameterValues,
      t: 0,
      dt: validationDeltaTime,
      x: parameterValues['x0'] ?? 0,
      y: parameterValues['y0'] ?? 0,
      vx: parameterValues['vx0'] ?? parameterValues['v0'] ?? 0,
      vy: parameterValues['vy0'] ?? 0,
      ax: parameterValues['ax0'] ?? 0,
      ay: parameterValues['ay0'] ?? 0,
      speed: 0,
      force: 0,
      mass,
      m: mass,
      pi: Math.PI,
      e: Math.E,
    };
  }

  createPairValidationScope(
    parameterValues: Record<string, number>,
    validationDeltaTime: number,
  ): Record<string, number> {
    return {
      ...this.createSingleValidationScope(parameterValues, validationDeltaTime),
      x1: -110,
      y1: 0,
      x2: 110,
      y2: 0,
      vx1: 0,
      vy1: -12,
      vx2: 0,
      vy2: 12,
      ax1: 0,
      ay1: 0,
      ax2: 0,
      ay2: 0,
      dx: 220,
      dy: 0,
      r: 220,
      distance: 220,
      m1: Math.max(0.0000001, parameterValues['m1'] ?? 36),
      m2: Math.max(0.0000001, parameterValues['m2'] ?? 12),
    };
  }

  computeDirection(
    source: Vector2Model,
    target: Vector2Model,
  ): {
    distance: number;
    direction: Vector2Model;
  } {
    const delta = {
      x: target.x - source.x,
      y: target.y - source.y,
    };
    const distance = Math.max(0.0001, Math.hypot(delta.x, delta.y));

    return {
      distance,
      direction: {
        x: delta.x / distance,
        y: delta.y / distance,
      },
    };
  }
}
