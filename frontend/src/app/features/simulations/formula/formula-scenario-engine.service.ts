import { Injectable, inject } from '@angular/core';
import { EvalFunction, compile } from 'mathjs';

import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioConfigModel,
  FormulaScenarioStateModel,
} from '../models/formula-scenario.model';
import { RuntimeBodyModel } from '../models/runtime-body.model';
import { Vector2Model } from '../models/vector2.model';
import { FormulaScenarioAnalyzerService } from './formula-scenario-analyzer.service';

export interface FormulaScenarioProgram {
  analysis: FormulaScenarioAnalysisModel;
  evaluateScalar(scope: Record<string, number>): number;
}

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioEngineService {
  private readonly analyzer = inject(FormulaScenarioAnalyzerService);
  private readonly maxTrailPoints = 220;

  compileProgram(
    config: FormulaScenarioConfigModel,
    analysis?: FormulaScenarioAnalysisModel,
  ): FormulaScenarioProgram {
    const resolvedAnalysis = analysis ?? this.analyzer.analyze(config.formula);
    const compiledExpression = this.compileExpression(resolvedAnalysis.expression);
    this.evaluateExpression(
      compiledExpression,
      this.createValidationScope(resolvedAnalysis, config.parameterValues),
    );

    return {
      analysis: resolvedAnalysis,
      evaluateScalar: (scope) => this.evaluateExpression(compiledExpression, scope),
    };
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgram,
  ): FormulaScenarioStateModel {
    if (program.analysis.category === 'two-body-gravity') {
      return this.createGravityStateAtTime(0, config, program);
    }

    return this.createSingleBodyStateAtTime(0, config, program, []);
  }

  step(
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgram,
    deltaTime: number,
  ): FormulaScenarioStateModel {
    const nextTime = state.time + deltaTime;

    if (program.analysis.category === 'two-body-gravity') {
      return this.stepGravityState(state, nextTime, deltaTime, config, program);
    }

    const currentTrail = state.bodies[0]?.trail ?? [];
    return this.createSingleBodyStateAtTime(nextTime, config, program, currentTrail);
  }

  private createSingleBodyStateAtTime(
    time: number,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgram,
    existingTrail: Vector2Model[],
  ): FormulaScenarioStateModel {
    const positionValue = this.evaluateKinematicValue(program, time, config.parameterValues);
    const velocityValue = this.estimateDerivative(program, time, config.parameterValues);
    const accelerationValue = this.estimateSecondDerivative(
      program,
      time,
      config.parameterValues,
    );
    const mass = config.parameterValues['mass'] ?? config.parameterValues['m'] ?? 1;
    const position =
      program.analysis.target === 'x'
        ? { x: positionValue, y: 0 }
        : { x: 0, y: positionValue };
    const velocity =
      program.analysis.target === 'x'
        ? { x: velocityValue, y: 0 }
        : { x: 0, y: velocityValue };
    const acceleration =
      program.analysis.target === 'x'
        ? { x: accelerationValue, y: 0 }
        : { x: 0, y: accelerationValue };

    return {
      time,
      bodies: [
        this.createRuntimeBody({
          id: 'formula-primary',
          name: config.primaryLabel,
          color: config.primaryColor,
          mass,
          radius: config.particleRadius,
          position,
          velocity,
          force: {
            x: acceleration.x * mass,
            y: acceleration.y * mass,
          },
          trail: this.appendTrailPoint(existingTrail, position),
        }),
      ],
    };
  }

  private createGravityStateAtTime(
    time: number,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgram,
  ): FormulaScenarioStateModel {
    const m1 = Math.max(0.0000001, config.parameterValues['m1'] ?? 24);
    const m2 = Math.max(0.0000001, config.parameterValues['m2'] ?? 12);
    const separation = 220;
    const radius1 = (separation * m2) / (m1 + m2);
    const radius2 = (separation * m1) / (m1 + m2);
    const forceMagnitude = Math.abs(
      program.evaluateScalar({
        ...config.parameterValues,
        r: separation,
        pi: Math.PI,
        e: Math.E,
      }),
    );
    const speed1 = Math.sqrt(Math.max(0, (forceMagnitude / m1) * radius1));
    const speed2 = Math.sqrt(Math.max(0, (forceMagnitude / m2) * radius2));

    const body1 = this.createRuntimeBody({
      id: 'formula-primary',
      name: config.primaryLabel,
      color: config.primaryColor,
      mass: m1,
      radius: config.particleRadius,
      position: { x: -radius1, y: 0 },
      velocity: { x: 0, y: -speed1 },
      force: { x: 0, y: 0 },
      trail: [{ x: -radius1, y: 0 }],
    });
    const body2 = this.createRuntimeBody({
      id: 'formula-secondary',
      name: config.secondaryLabel,
      color: config.secondaryColor,
      mass: m2,
      radius: Math.max(4, config.particleRadius * 0.82),
      position: { x: radius2, y: 0 },
      velocity: { x: 0, y: speed2 },
      force: { x: 0, y: 0 },
      trail: [{ x: radius2, y: 0 }],
    });

    return this.stepGravityState(
      {
        time,
        bodies: [body1, body2],
      },
      time,
      0,
      config,
      program,
    );
  }

  private stepGravityState(
    state: FormulaScenarioStateModel,
    nextTime: number,
    deltaTime: number,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgram,
  ): FormulaScenarioStateModel {
    const [body1, body2] = state.bodies;

    if (!body1 || !body2) {
      return state;
    }

    const delta = {
      x: body2.position.x - body1.position.x,
      y: body2.position.y - body1.position.y,
    };
    const distance = Math.max(0.0001, Math.hypot(delta.x, delta.y));
    const direction = {
      x: delta.x / distance,
      y: delta.y / distance,
    };
    const forceMagnitude = program.evaluateScalar({
      ...config.parameterValues,
      r: distance,
      pi: Math.PI,
      e: Math.E,
    });
    const forceOnBody1 = {
      x: direction.x * forceMagnitude,
      y: direction.y * forceMagnitude,
    };
    const forceOnBody2 = {
      x: -forceOnBody1.x,
      y: -forceOnBody1.y,
    };
    const stepTime = deltaTime === 0 ? 0.016 : deltaTime;

    return {
      time: nextTime,
      bodies: [
        this.advanceGravityBody(body1, forceOnBody1, stepTime),
        this.advanceGravityBody(body2, forceOnBody2, stepTime),
      ],
    };
  }

  private advanceGravityBody(
    body: RuntimeBodyModel,
    force: Vector2Model,
    deltaTime: number,
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

    return this.createRuntimeBody({
      id: body.id,
      name: body.name,
      color: body.color,
      mass: body.mass,
      radius: body.radius,
      position,
      velocity,
      force,
      trail: this.appendTrailPoint(body.trail, position),
    });
  }

  private evaluateKinematicValue(
    program: FormulaScenarioProgram,
    time: number,
    parameterValues: Record<string, number>,
  ): number {
    return program.evaluateScalar({
      ...parameterValues,
      t: time,
      pi: Math.PI,
      e: Math.E,
    });
  }

  private estimateDerivative(
    program: FormulaScenarioProgram,
    time: number,
    parameterValues: Record<string, number>,
  ): number {
    const epsilon = 0.02;
    const forward = this.evaluateKinematicValue(program, time + epsilon, parameterValues);
    const backward = this.evaluateKinematicValue(
      program,
      Math.max(0, time - epsilon),
      parameterValues,
    );
    const divisor = time > epsilon ? epsilon * 2 : epsilon;

    return (forward - backward) / divisor;
  }

  private estimateSecondDerivative(
    program: FormulaScenarioProgram,
    time: number,
    parameterValues: Record<string, number>,
  ): number {
    const epsilon = 0.02;
    const center = this.evaluateKinematicValue(program, time, parameterValues);
    const forward = this.evaluateKinematicValue(program, time + epsilon, parameterValues);
    const backward = this.evaluateKinematicValue(
      program,
      Math.max(0, time - epsilon),
      parameterValues,
    );

    return (forward - 2 * center + backward) / (epsilon * epsilon);
  }

  private createRuntimeBody(input: {
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

  private appendTrailPoint(
    trail: Vector2Model[],
    position: Vector2Model,
  ): Vector2Model[] {
    const nextTrail = [...trail, { ...position }];

    if (nextTrail.length <= this.maxTrailPoints) {
      return nextTrail;
    }

    return nextTrail.slice(nextTrail.length - this.maxTrailPoints);
  }

  private compileExpression(expression: string): EvalFunction {
    try {
      return compile(expression);
    } catch {
      throw new Error('Nao foi possivel interpretar a formula.');
    }
  }

  private evaluateExpression(
    compiledExpression: EvalFunction,
    scope: Record<string, number>,
  ): number {
    const result = Number(compiledExpression.evaluate(scope));

    if (!Number.isFinite(result)) {
      throw new Error('A formula retornou um valor invalido.');
    }

    return result;
  }

  private createValidationScope(
    analysis: FormulaScenarioAnalysisModel,
    parameterValues: Record<string, number>,
  ): Record<string, number> {
    if (analysis.target === 'force') {
      return {
        ...parameterValues,
        r: 220,
        pi: Math.PI,
        e: Math.E,
      };
    }

    return {
      ...parameterValues,
      t: 0,
      pi: Math.PI,
      e: Math.E,
    };
  }
}
