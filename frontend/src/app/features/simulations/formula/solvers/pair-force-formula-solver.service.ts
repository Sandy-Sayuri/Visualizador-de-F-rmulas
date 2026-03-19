import { Injectable, inject } from '@angular/core';

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
import { FormulaScenarioSolverSupportService } from './formula-scenario-solver-support.service';

@Injectable({
  providedIn: 'root',
})
export class PairForceFormulaSolverService
  implements FormulaScenarioSolverModel
{
  private readonly support = inject(FormulaScenarioSolverSupportService);

  readonly id = 'pair-force-solver';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.solverStrategy === 'pair-force-integration';
  }

  createValidationScope(
    _analysis: FormulaScenarioAnalysisModel,
    config: FormulaScenarioConfigModel,
    context: FormulaScenarioSolverContextModel,
  ): Record<string, number> {
    return this.support.createPairValidationScope(
      config.parameterValues,
      context.validationDeltaTime,
    );
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const m1 = Math.max(0.0000001, config.parameterValues['m1'] ?? 36);
    const m2 = Math.max(0.0000001, config.parameterValues['m2'] ?? 12);
    const separation = 220;
    const radius1 = (separation * m2) / (m1 + m2);
    const radius2 = (separation * m1) / (m1 + m2);
    const seedBody1 = this.support.createRuntimeBody({
      id: 'formula-primary',
      name: config.primaryLabel,
      color: config.primaryColor,
      mass: m1,
      radius: config.particleRadius,
      position: { x: -radius1, y: 0 },
      velocity: { x: 0, y: 0 },
      force: { x: 0, y: 0 },
      trail: [],
    });
    const seedBody2 = this.support.createRuntimeBody({
      id: 'formula-secondary',
      name: config.secondaryLabel,
      color: config.secondaryColor,
      mass: m2,
      radius: Math.max(4, config.particleRadius * 0.82),
      position: { x: radius2, y: 0 },
      velocity: { x: 0, y: 0 },
      force: { x: 0, y: 0 },
      trail: [],
    });
    const initialForceMagnitude = Math.abs(
      this.evaluatePairForce(
        seedBody1,
        seedBody2,
        0,
        context.validationDeltaTime,
        config,
        program,
      ),
    );
    const orbitSpeed1 = Math.min(
      80,
      Math.sqrt(Math.max(0, (initialForceMagnitude / m1) * radius1)),
    );
    const orbitSpeed2 = Math.min(
      80,
      Math.sqrt(Math.max(0, (initialForceMagnitude / m2) * radius2)),
    );
    const body1 = this.support.createRuntimeBody({
      ...seedBody1,
      velocity: { x: 0, y: -orbitSpeed1 },
      trail: [{ ...seedBody1.position }],
    });
    const body2 = this.support.createRuntimeBody({
      ...seedBody2,
      velocity: { x: 0, y: orbitSpeed2 },
      trail: [{ ...seedBody2.position }],
    });

    return this.step(
      {
        time: 0,
        bodies: [body1, body2],
      },
      config,
      program,
      0,
      context,
    );
  }

  step(
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const nextTime = state.time + deltaTime;
    const [body1, body2] = state.bodies;

    if (!body1 || !body2) {
      return state;
    }

    const directionData = this.support.computeDirection(
      body1.position,
      body2.position,
    );
    const forceMagnitude = this.evaluatePairForce(
      body1,
      body2,
      nextTime,
      deltaTime,
      config,
      program,
    );
    const forceOnBody1 = {
      x: directionData.direction.x * forceMagnitude,
      y: directionData.direction.y * forceMagnitude,
    };
    const forceOnBody2 = {
      x: -forceOnBody1.x,
      y: -forceOnBody1.y,
    };
    const stepTime = deltaTime === 0 ? context.validationDeltaTime : deltaTime;

    return {
      time: nextTime,
      bodies: [
        this.advancePairBody(body1, forceOnBody1, stepTime, context),
        this.advancePairBody(body2, forceOnBody2, stepTime, context),
      ],
    };
  }

  private advancePairBody(
    body: RuntimeBodyModel,
    force: { x: number; y: number },
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
  ): RuntimeBodyModel {
    const acceleration = {
      x: force.x / body.mass,
      y: force.y / body.mass,
    };
    const velocity = {
      x: body.velocity.x + acceleration.x * deltaTime,
      y: body.velocity.y + acceleration.y * deltaTime,
    };
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

  private evaluatePairForce(
    body1: RuntimeBodyModel,
    body2: RuntimeBodyModel,
    time: number,
    deltaTime: number,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
  ): number {
    const dx = body2.position.x - body1.position.x;
    const dy = body2.position.y - body1.position.y;
    const distance = Math.max(0.0001, Math.hypot(dx, dy));

    return program.evaluateScalar({
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
      ax1: body1.force.x / body1.mass,
      ay1: body1.force.y / body1.mass,
      ax2: body2.force.x / body2.mass,
      ay2: body2.force.y / body2.mass,
      dx,
      dy,
      r: distance,
      distance,
      m1: body1.mass,
      m2: body2.mass,
      pi: Math.PI,
      e: Math.E,
    });
  }
}
