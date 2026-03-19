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
export class WaveFormulaSolverService implements FormulaScenarioSolverModel {
  private readonly support = inject(FormulaScenarioSolverSupportService);
  private readonly sampleCount = 33;
  private readonly halfWidth = 280;

  readonly id = 'wave-solver';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.solverStrategy === 'wave-sampling';
  }

  createValidationScope(
    _analysis: FormulaScenarioAnalysisModel,
    config: FormulaScenarioConfigModel,
    context: FormulaScenarioSolverContextModel,
  ): Record<string, number> {
    return {
      ...this.support.createSingleValidationScope(
        config.parameterValues,
        context.validationDeltaTime,
      ),
      x: 0,
      y: 0,
    };
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    return {
      time: 0,
      bodies: this.createWaveBodies(0, config, program, context),
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

    return {
      time: nextTime,
      bodies: this.createWaveBodies(nextTime, config, program, context),
    };
  }

  private createWaveBodies(
    time: number,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): RuntimeBodyModel[] {
    const samples = this.generateSamplePositions();
    const centeredSampleIndex = Math.floor(samples.length / 2);
    const bodies = samples.map((xPosition, index) =>
      this.createWaveBody(
        xPosition,
        time,
        index === centeredSampleIndex,
        config,
        program,
        context,
      ),
    );

    const centerBody = bodies[centeredSampleIndex];

    if (!centerBody) {
      return bodies;
    }

    return [
      centerBody,
      ...bodies.filter((body) => body.id !== centerBody.id),
    ];
  }

  private createWaveBody(
    xPosition: number,
    time: number,
    isProbe: boolean,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): RuntimeBodyModel {
    const evaluationDelta = context.validationDeltaTime;
    const radius = isProbe
      ? Math.max(4, config.particleRadius * 0.78)
      : Math.max(2, config.particleRadius * 0.34);
    const yPosition = program.evaluateScalar(
      this.createWaveScope(xPosition, time, evaluationDelta, config.parameterValues),
    );
    const nextYPosition = program.evaluateScalar(
      this.createWaveScope(
        xPosition,
        time + evaluationDelta,
        evaluationDelta,
        config.parameterValues,
      ),
    );
    const velocityY = (nextYPosition - yPosition) / evaluationDelta;
    const position = { x: xPosition, y: yPosition };
    const velocity = { x: 0, y: velocityY };

    this.support.ensureFiniteVector(position, context.maxAbsoluteCoordinate);
    this.support.ensureFiniteVector(velocity, context.maxAbsoluteCoordinate);

    return this.support.createRuntimeBody({
      id: `wave-sample-${xPosition.toFixed(2)}`,
      name: isProbe ? config.primaryLabel : '',
      color: config.primaryColor,
      mass: 1,
      radius,
      position,
      velocity,
      force: { x: 0, y: 0 },
      trail: [],
    });
  }

  private createWaveScope(
    xPosition: number,
    time: number,
    deltaTime: number,
    parameterValues: Record<string, number>,
  ): Record<string, number> {
    return {
      ...parameterValues,
      x: xPosition,
      y: 0,
      t: time,
      dt: deltaTime,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      speed: 0,
      force: 0,
      mass: 1,
      m: 1,
      pi: Math.PI,
      e: Math.E,
    };
  }

  private generateSamplePositions(): number[] {
    const positions: number[] = [];
    const step = (this.halfWidth * 2) / (this.sampleCount - 1);

    for (let index = 0; index < this.sampleCount; index += 1) {
      positions.push(-this.halfWidth + step * index);
    }

    return positions;
  }
}
