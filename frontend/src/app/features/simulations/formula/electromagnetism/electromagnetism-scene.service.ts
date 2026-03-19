import { Injectable } from '@angular/core';

import { ElectromagnetismSceneSnapshotModel } from '../../models/electromagnetism-scene.model';
import {
  FormulaScenarioConfigModel,
  FormulaScenarioStateModel,
} from '../../models/formula-scenario.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';
import { Vector2Model } from '../../models/vector2.model';
import { FormulaScenarioSolverSupportService } from '../solvers/formula-scenario-solver-support.service';
import { FormulaScenarioSolverContextModel } from '../../models/formula-engine.model';

export type ElectromagnetismFamily =
  | 'coulomb-force'
  | 'coulomb-guided'
  | 'field-guided';

interface ChargeBodyState {
  body: RuntimeBodyModel;
  charge: number;
}

@Injectable({
  providedIn: 'root',
})
export class ElectromagnetismSceneService {
  private readonly fieldBounds = 460;
  private readonly fieldLineStep = 18;
  private readonly maxFieldLinePoints = 24;
  private readonly pairTrailSeedLength = 1;
  private readonly fieldSeedAngles = [
    0,
    Math.PI / 4,
    Math.PI / 2,
    (3 * Math.PI) / 4,
    Math.PI,
    (5 * Math.PI) / 4,
    (3 * Math.PI) / 2,
    (7 * Math.PI) / 4,
  ];

  constructor(private readonly support: FormulaScenarioSolverSupportService) {}

  createInitialState(
    family: ElectromagnetismFamily,
    config: FormulaScenarioConfigModel,
    context: FormulaScenarioSolverContextModel,
    evaluateSignedForce: (scope: Record<string, number>) => number,
  ): FormulaScenarioStateModel {
    const [body1, body2] = this.createBodies(config, family);
    const nextBodies = this.applyForces(
      family,
      [body1, body2],
      config,
      0,
      0,
      context,
      evaluateSignedForce,
    );

    return {
      time: 0,
      bodies: nextBodies,
      sceneData: {
        electromagnetism: this.buildSceneSnapshot(family, nextBodies, config),
      },
    };
  }

  stepState(
    family: ElectromagnetismFamily,
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
    evaluateSignedForce: (scope: Record<string, number>) => number,
  ): FormulaScenarioStateModel {
    const nextTime = state.time + deltaTime;
    const currentBodies: [RuntimeBodyModel, RuntimeBodyModel] =
      state.bodies.length >= 2
        ? [state.bodies[0]!, state.bodies[1]!]
        : this.createBodies(config, family);
    const nextBodies = this.applyForces(
      family,
      currentBodies,
      config,
      nextTime,
      deltaTime,
      context,
      evaluateSignedForce,
    );

    return {
      time: nextTime,
      bodies: nextBodies,
      sceneData: {
        electromagnetism: this.buildSceneSnapshot(family, nextBodies, config),
      },
    };
  }

  private createBodies(
    config: FormulaScenarioConfigModel,
    family: ElectromagnetismFamily,
  ): [RuntimeBodyModel, RuntimeBodyModel] {
    const q1 = this.resolveCharge(config.parameterValues['q1'], 1.6);
    const q2 = this.resolveCharge(
      config.parameterValues['q2'],
      family === 'field-guided' ? 0.5 : -1.2,
    );
    const x1 = config.parameterValues['x1'] ?? (family === 'field-guided' ? 0 : -140);
    const y1 = config.parameterValues['y1'] ?? 0;
    const x2 = config.parameterValues['x2'] ?? (family === 'field-guided' ? 180 : 140);
    const y2 = config.parameterValues['y2'] ?? (family === 'field-guided' ? 20 : 0);

    const primary = this.createChargeBody({
      id: 'formula-primary',
      label: config.primaryLabel,
      color: config.primaryColor,
      charge: q1,
      position: { x: x1, y: y1 },
      velocity: { x: 0, y: 0 },
      radius: config.particleRadius,
    });
    const secondary = this.createChargeBody({
      id: 'formula-secondary',
      label: config.secondaryLabel,
      color: config.secondaryColor,
      charge: q2,
      position: { x: x2, y: y2 },
      velocity: { x: 0, y: 0 },
      radius: family === 'field-guided'
        ? Math.max(4, config.particleRadius * 0.82)
        : Math.max(5, config.particleRadius * 0.9),
    });

    return [primary, secondary];
  }

  private createChargeBody(input: {
    id: string;
    label: string;
    color: string;
    charge: number;
    position: Vector2Model;
    velocity: Vector2Model;
    radius: number;
  }): RuntimeBodyModel {
    return this.support.createRuntimeBody({
      id: input.id,
      name: input.label,
      color: input.color,
      mass: this.resolveInertialMass(input.charge),
      radius: input.radius,
      position: input.position,
      velocity: input.velocity,
      force: { x: 0, y: 0 },
      trail: [{ ...input.position }],
    });
  }

  private applyForces(
    family: ElectromagnetismFamily,
    bodies: [RuntimeBodyModel, RuntimeBodyModel],
    config: FormulaScenarioConfigModel,
    time: number,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
    evaluateSignedForce: (scope: Record<string, number>) => number,
  ): [RuntimeBodyModel, RuntimeBodyModel] {
    const [body1, body2] = bodies;
    const q1 = this.resolveCharge(config.parameterValues['q1'], 1.6);
    const q2 = this.resolveCharge(
      config.parameterValues['q2'],
      family === 'field-guided' ? 0.5 : -1.2,
    );
    const stepTime = deltaTime === 0 ? context.validationDeltaTime : deltaTime;
    const pairForce = this.computePairForce(
      body1,
      body2,
      q1,
      q2,
      config,
      time,
      stepTime,
      evaluateSignedForce,
    );

    const nextPrimary =
      family === 'field-guided'
        ? this.support.createRuntimeBody({
            id: body1.id,
            name: body1.name,
            color: body1.color,
            mass: body1.mass,
            radius: body1.radius,
            position: { ...body1.position },
            velocity: { x: 0, y: 0 },
            force: pairForce.forceOnBody1,
            trail: body1.trail.slice(0, this.pairTrailSeedLength),
          })
        : this.advanceBody(body1, pairForce.forceOnBody1, stepTime, context);
    const nextSecondary = this.advanceBody(
      body2,
      pairForce.forceOnBody2,
      stepTime,
      context,
    );

    return [nextPrimary, nextSecondary];
  }

  private computePairForce(
    body1: RuntimeBodyModel,
    body2: RuntimeBodyModel,
    q1: number,
    q2: number,
    config: FormulaScenarioConfigModel,
    time: number,
    deltaTime: number,
    evaluateSignedForce: (scope: Record<string, number>) => number,
  ): {
    forceOnBody1: Vector2Model;
    forceOnBody2: Vector2Model;
    signedMagnitude: number;
  } {
    const dx = body2.position.x - body1.position.x;
    const dy = body2.position.y - body1.position.y;
    const distance = Math.max(14, Math.hypot(dx, dy));
    const direction = {
      x: dx / distance,
      y: dy / distance,
    };
    const signedMagnitude = evaluateSignedForce({
      ...config.parameterValues,
      t: time,
      dt: deltaTime,
      x1: body1.position.x,
      y1: body1.position.y,
      x2: body2.position.x,
      y2: body2.position.y,
      vx1: body1.velocity.x,
      vy1: body1.velocity.y,
      vx2: body2.velocity.x,
      vy2: body2.velocity.y,
      ax1: body1.force.x / Math.max(0.0001, body1.mass),
      ay1: body1.force.y / Math.max(0.0001, body1.mass),
      ax2: body2.force.x / Math.max(0.0001, body2.mass),
      ay2: body2.force.y / Math.max(0.0001, body2.mass),
      dx,
      dy,
      q1,
      q2,
      r: distance,
      distance,
      k: config.parameterValues['k'] ?? 9000,
      pi: Math.PI,
      e: Math.E,
    });
    const forceOnBody1 = {
      x: -direction.x * signedMagnitude,
      y: -direction.y * signedMagnitude,
    };

    return {
      forceOnBody1,
      forceOnBody2: {
        x: -forceOnBody1.x,
        y: -forceOnBody1.y,
      },
      signedMagnitude,
    };
  }

  private advanceBody(
    body: RuntimeBodyModel,
    force: Vector2Model,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
  ): RuntimeBodyModel {
    const acceleration = {
      x: force.x / body.mass,
      y: force.y / body.mass,
    };
    const velocity = this.limitVector({
      x: body.velocity.x + acceleration.x * deltaTime,
      y: body.velocity.y + acceleration.y * deltaTime,
    }, 220);
    const position = {
      x: body.position.x + velocity.x * deltaTime,
      y: body.position.y + velocity.y * deltaTime,
    };

    this.support.ensureFiniteVector(position, context.maxAbsoluteCoordinate);
    this.support.ensureFiniteVector(velocity, context.maxAbsoluteCoordinate);

    return this.support.createRuntimeBody({
      id: body.id,
      name: body.name,
      color: body.color,
      mass: body.mass,
      radius: body.radius,
      position,
      velocity,
      force,
      trail: this.support.appendTrailPoint(
        body.trail,
        position,
        context.maxTrailPoints,
      ),
    });
  }

  private buildSceneSnapshot(
    family: ElectromagnetismFamily,
    bodies: [RuntimeBodyModel, RuntimeBodyModel],
    config: FormulaScenarioConfigModel,
  ): ElectromagnetismSceneSnapshotModel {
    const charges: ChargeBodyState[] = [
      {
        body: bodies[0],
        charge: this.resolveCharge(config.parameterValues['q1'], 1.6),
      },
      {
        body: bodies[1],
        charge: this.resolveCharge(
          config.parameterValues['q2'],
          family === 'field-guided' ? 0.5 : -1.2,
        ),
      },
    ];

    return {
      scenario: family === 'field-guided' ? 'field' : 'coulomb',
      lines: [
        {
          from: bodies[0].position,
          to: bodies[1].position,
          color: '#f5f1e6',
          width: 1,
          opacity: 0.16,
          dashed: true,
        },
      ],
      paths: this.buildFieldLines(charges, family),
      arrows: this.buildForceArrows(bodies),
      points: charges.map(({ body, charge }) => ({
        position: body.position,
        color: this.chargeTone(charge),
        radius: 4.2,
        opacity: 0.9,
        ringRadius: body.radius + 10,
      })),
      repulsive: charges[0].charge * charges[1].charge > 0,
    };
  }

  private buildForceArrows(
    bodies: [RuntimeBodyModel, RuntimeBodyModel],
  ): ElectromagnetismSceneSnapshotModel['arrows'] {
    return bodies
      .filter((body) => Math.hypot(body.force.x, body.force.y) > 0.01)
      .map((body) => {
        const forceMagnitude = Math.hypot(body.force.x, body.force.y);
        const direction = this.normalize(body.force);
        const length = this.clamp(26 + Math.log10(forceMagnitude + 1) * 18, 24, 88);

        return {
          from: body.position,
          to: {
            x: body.position.x + direction.x * length,
            y: body.position.y + direction.y * length,
          },
          color: '#f4c66a',
          width: 2.1,
          opacity: 0.95,
        };
      });
  }

  private buildFieldLines(
    charges: ChargeBodyState[],
    family: ElectromagnetismFamily,
  ): ElectromagnetismSceneSnapshotModel['paths'] {
    const positiveCharges = charges.filter((charge) => charge.charge > 0);
    const seeds =
      family === 'field-guided'
        ? [charges[0]]
        : positiveCharges.length > 0
          ? positiveCharges
          : charges;

    return seeds.flatMap((chargeState) =>
      this.fieldSeedAngles
        .map((angle) =>
          this.traceFieldLine(
            chargeState,
            charges,
            angle,
            chargeState.charge >= 0 ? 1 : -1,
          ),
        )
        .filter((points): points is Vector2Model[] => points.length > 2)
        .map((points) => ({
          points,
          color: this.chargeTone(chargeState.charge),
          width: family === 'field-guided' ? 1.6 : 1.3,
          opacity: family === 'field-guided' ? 0.54 : 0.34,
        })),
    );
  }

  private traceFieldLine(
    seedCharge: ChargeBodyState,
    charges: ChargeBodyState[],
    angle: number,
    directionSign: number,
  ): Vector2Model[] {
    const offsetRadius = Math.max(seedCharge.body.radius + 16, 20);
    const start = {
      x: seedCharge.body.position.x + Math.cos(angle) * offsetRadius,
      y: seedCharge.body.position.y + Math.sin(angle) * offsetRadius,
    };
    const points = [start];
    let current = start;

    for (let step = 0; step < this.maxFieldLinePoints; step += 1) {
      const fieldVector = this.computeFieldVector(current, charges);
      const strength = Math.hypot(fieldVector.x, fieldVector.y);

      if (strength < 0.00001) {
        break;
      }

      const unit = this.normalize(fieldVector);
      const next = {
        x: current.x + unit.x * this.fieldLineStep * directionSign,
        y: current.y + unit.y * this.fieldLineStep * directionSign,
      };

      points.push(next);

      if (Math.abs(next.x) > this.fieldBounds || Math.abs(next.y) > this.fieldBounds) {
        break;
      }

      const reachedCharge = charges.some(({ body }) =>
        Math.hypot(next.x - body.position.x, next.y - body.position.y) < body.radius + 8,
      );

      if (reachedCharge && step > 1) {
        break;
      }

      current = next;
    }

    return points;
  }

  private computeFieldVector(
    point: Vector2Model,
    charges: ChargeBodyState[],
  ): Vector2Model {
    return charges.reduce<Vector2Model>(
      (field, chargeState) => {
        const dx = point.x - chargeState.body.position.x;
        const dy = point.y - chargeState.body.position.y;
        const distance = Math.max(16, Math.hypot(dx, dy));
        const factor = chargeState.charge / (distance * distance * distance);

        return {
          x: field.x + dx * factor,
          y: field.y + dy * factor,
        };
      },
      { x: 0, y: 0 },
    );
  }

  private resolveCharge(value: number | undefined, fallback: number): number {
    const nextValue = value ?? fallback;

    if (Math.abs(nextValue) < 0.05) {
      return nextValue >= 0 ? 0.05 : -0.05;
    }

    return nextValue;
  }

  private resolveInertialMass(charge: number): number {
    return Math.max(3.2, Math.abs(charge) * 4.2);
  }

  private normalize(vector: Vector2Model): Vector2Model {
    const length = Math.max(0.0001, Math.hypot(vector.x, vector.y));

    return {
      x: vector.x / length,
      y: vector.y / length,
    };
  }

  private limitVector(vector: Vector2Model, maxMagnitude: number): Vector2Model {
    const magnitude = Math.hypot(vector.x, vector.y);

    if (magnitude <= maxMagnitude) {
      return vector;
    }

    const scale = maxMagnitude / magnitude;

    return {
      x: vector.x * scale,
      y: vector.y * scale,
    };
  }

  private chargeTone(charge: number): string {
    return charge >= 0 ? '#ffb36c' : '#7ce6ff';
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
