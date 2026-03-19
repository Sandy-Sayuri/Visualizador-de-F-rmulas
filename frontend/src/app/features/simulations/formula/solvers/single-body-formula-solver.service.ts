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
export class SingleBodyFormulaSolverService
  implements FormulaScenarioSolverModel
{
  private readonly support = inject(FormulaScenarioSolverSupportService);

  readonly id = 'single-body-solver';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.solverStrategy !== 'pair-force-integration';
  }

  createValidationScope(
    _analysis: FormulaScenarioAnalysisModel,
    config: FormulaScenarioConfigModel,
    context: FormulaScenarioSolverContextModel,
  ): Record<string, number> {
    return this.support.createSingleValidationScope(
      config.parameterValues,
      context.validationDeltaTime,
    );
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const baseBody = this.support.createBaseSingleBody(config, program.analysis);
    const initialBody = this.advanceSingleBody(
      baseBody,
      0,
      0,
      config,
      program,
      context,
    );

    return {
      time: 0,
      bodies: [initialBody],
    };
  }

  step(
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const nextTime = state.time + deltaTime;
    const currentBody =
      state.bodies[0] ??
      this.support.createBaseSingleBody(config, program.analysis);

    return {
      time: nextTime,
      bodies: [
        this.advanceSingleBody(
          currentBody,
          nextTime,
          deltaTime,
          config,
          program,
          context,
        ),
      ],
    };
  }

  private advanceSingleBody(
    currentBody: RuntimeBodyModel,
    nextTime: number,
    deltaTime: number,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): RuntimeBodyModel {
    const stepTime = deltaTime === 0 ? context.validationDeltaTime : deltaTime;
    const mass = Math.max(
      0.0000001,
      config.parameterValues['mass'] ??
        config.parameterValues['m'] ??
        currentBody.mass ??
        10,
    );
    const scope = this.support.createSingleScope(
      currentBody,
      nextTime,
      stepTime,
      mass,
      config.parameterValues,
    );
    const axis = program.analysis.axis;
    const currentPositionAxis =
      axis === 'x' ? currentBody.position.x : currentBody.position.y;
    const currentVelocityAxis =
      axis === 'x' ? currentBody.velocity.x : currentBody.velocity.y;
    const currentAccelerationAxis =
      axis === 'x'
        ? currentBody.force.x / currentBody.mass
        : currentBody.force.y / currentBody.mass;

    let nextPositionAxis = currentPositionAxis;
    let nextVelocityAxis = currentVelocityAxis;
    let nextAccelerationAxis = currentAccelerationAxis;

    switch (program.analysis.evaluationMode) {
      case 'position':
      case 'scalar': {
        nextPositionAxis = program.evaluateScalar(scope);

        if (deltaTime === 0) {
          const sampleVelocity = this.sampleFutureValue(
            program,
            currentBody,
            nextTime,
            mass,
            config.parameterValues,
            context.validationDeltaTime,
            'position',
          );
          const sampleAcceleration = this.sampleFutureValue(
            program,
            currentBody,
            nextTime,
            mass,
            config.parameterValues,
            context.validationDeltaTime,
            'velocity',
          );

          nextVelocityAxis = sampleVelocity;
          nextAccelerationAxis = sampleAcceleration;
        } else {
          nextVelocityAxis = (nextPositionAxis - currentPositionAxis) / stepTime;
          nextAccelerationAxis =
            (nextVelocityAxis - currentVelocityAxis) / stepTime;
        }

        break;
      }
      case 'velocity': {
        nextVelocityAxis = program.evaluateScalar(scope);

        if (deltaTime === 0) {
          nextAccelerationAxis = this.sampleFutureValue(
            program,
            currentBody,
            nextTime,
            mass,
            config.parameterValues,
            context.validationDeltaTime,
            'velocity',
          );
          nextPositionAxis = currentPositionAxis;
        } else {
          nextAccelerationAxis =
            (nextVelocityAxis - currentVelocityAxis) / stepTime;
          nextPositionAxis = currentPositionAxis + nextVelocityAxis * stepTime;
        }
        break;
      }
      case 'acceleration': {
        nextAccelerationAxis = program.evaluateScalar(scope);
        nextVelocityAxis = currentVelocityAxis + nextAccelerationAxis * stepTime;
        nextPositionAxis = currentPositionAxis + nextVelocityAxis * stepTime;
        break;
      }
      case 'force': {
        const nextForceAxis = program.evaluateScalar(scope);
        nextAccelerationAxis = nextForceAxis / mass;
        nextVelocityAxis = currentVelocityAxis + nextAccelerationAxis * stepTime;
        nextPositionAxis = currentPositionAxis + nextVelocityAxis * stepTime;
        break;
      }
    }

    const nextPosition = this.support.setAxisValue(
      currentBody.position,
      axis,
      nextPositionAxis,
    );
    const nextVelocity = this.support.setAxisValue(
      currentBody.velocity,
      axis,
      nextVelocityAxis,
    );
    const nextForce = this.support.setAxisValue(
      { x: 0, y: 0 },
      axis,
      nextAccelerationAxis * mass,
    );

    this.support.ensureFiniteVector(nextPosition, context.maxAbsoluteCoordinate);
    this.support.ensureFiniteVector(nextVelocity, context.maxAbsoluteCoordinate);
    this.support.ensureFiniteVector(nextForce, context.maxAbsoluteCoordinate);

    return this.support.createRuntimeBody({
      id: currentBody.id,
      name: currentBody.name,
      color: currentBody.color,
      mass,
      radius: currentBody.radius,
      position: nextPosition,
      velocity: nextVelocity,
      force: nextForce,
      trail: this.support.appendTrailPoint(
        currentBody.trail,
        nextPosition,
        context.maxTrailPoints,
      ),
    });
  }

  private sampleFutureValue(
    program: FormulaScenarioProgramContract,
    body: RuntimeBodyModel,
    time: number,
    mass: number,
    parameterValues: Record<string, number>,
    validationDeltaTime: number,
    mode: 'position' | 'velocity',
  ): number {
    const firstSample = program.evaluateScalar(
      this.support.createSingleScope(
        body,
        time,
        validationDeltaTime,
        mass,
        parameterValues,
      ),
    );
    const futureScope = this.support.createSingleScope(
      body,
      time + validationDeltaTime,
      validationDeltaTime,
      mass,
      parameterValues,
    );
    const secondSample = program.evaluateScalar(futureScope);

    if (mode === 'position') {
      return (secondSample - firstSample) / validationDeltaTime;
    }

    const thirdScope = this.support.createSingleScope(
      body,
      time + validationDeltaTime * 2,
      validationDeltaTime,
      mass,
      parameterValues,
    );
    const thirdSample = program.evaluateScalar(thirdScope);

    return (thirdSample - 2 * secondSample + firstSample) /
      (validationDeltaTime * validationDeltaTime);
  }
}
