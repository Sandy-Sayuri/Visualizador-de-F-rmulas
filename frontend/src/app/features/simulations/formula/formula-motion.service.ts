import { Injectable } from '@angular/core';

import { RuntimeBodyModel } from '../models/runtime-body.model';
import {
  FormulaEvaluationScopeModel,
  FormulaSimulationConfigModel,
  FormulaSimulationStateModel,
} from '../models/formula-simulation-config.model';
import { Vector2Model } from '../models/vector2.model';
import { FormulaProgram } from './formula-interpreter.service';

@Injectable({
  providedIn: 'root',
})
export class FormulaMotionService {
  private readonly maxTrailPoints = 240;

  createInitialState(
    config: FormulaSimulationConfigModel,
    program: FormulaProgram,
  ): FormulaSimulationStateModel {
    const scope = this.createScope(
      config,
      0,
      config.initialPosition,
      config.initialVelocity,
      0,
    );
    const acceleration = program.evaluate(scope);

    return {
      time: 0,
      acceleration,
      body: this.buildRuntimeBody(
        config,
        config.initialPosition,
        config.initialVelocity,
        acceleration,
        [{ ...config.initialPosition }],
      ),
    };
  }

  step(
    state: FormulaSimulationStateModel,
    config: FormulaSimulationConfigModel,
    program: FormulaProgram,
    deltaTime: number,
  ): FormulaSimulationStateModel {
    const currentScope = this.createScope(
      config,
      state.time,
      state.body.position,
      state.body.velocity,
      deltaTime,
    );
    const acceleration = program.evaluate(currentScope);
    const velocity = {
      x: state.body.velocity.x + acceleration.x * deltaTime,
      y: state.body.velocity.y + acceleration.y * deltaTime,
    };
    const position = {
      x: state.body.position.x + velocity.x * deltaTime,
      y: state.body.position.y + velocity.y * deltaTime,
    };
    const time = state.time + deltaTime;

    return {
      time,
      acceleration,
      body: this.buildRuntimeBody(
        config,
        position,
        velocity,
        acceleration,
        this.appendTrailPoint(state.body.trail, position),
      ),
    };
  }

  private buildRuntimeBody(
    config: FormulaSimulationConfigModel,
    position: Vector2Model,
    velocity: Vector2Model,
    acceleration: Vector2Model,
    trail: Vector2Model[],
  ): RuntimeBodyModel {
    const speed = Math.hypot(velocity.x, velocity.y);
    const kineticEnergy = 0.5 * config.mass * speed * speed;

    return {
      id: 'formula-object',
      name: config.objectName,
      color: config.color,
      mass: config.mass,
      radius: config.radius,
      position,
      velocity,
      force: {
        x: acceleration.x * config.mass,
        y: acceleration.y * config.mass,
      },
      speed,
      kineticEnergy,
      potentialEnergy: 0,
      totalEnergy: kineticEnergy,
      trail,
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

  private createScope(
    config: FormulaSimulationConfigModel,
    time: number,
    position: Vector2Model,
    velocity: Vector2Model,
    deltaTime: number,
  ): FormulaEvaluationScopeModel {
    return {
      t: time,
      dt: deltaTime,
      x: position.x,
      y: position.y,
      vx: velocity.x,
      vy: velocity.y,
      mass: config.mass,
      speed: Math.hypot(velocity.x, velocity.y),
      pi: Math.PI,
      e: Math.E,
    };
  }
}
