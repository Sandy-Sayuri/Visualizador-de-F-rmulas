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
import { ElectromagnetismSceneService } from '../electromagnetism/electromagnetism-scene.service';

@Injectable({
  providedIn: 'root',
})
export class ElectromagnetismFormulaSolverService
  implements FormulaScenarioSolverModel
{
  private readonly scene = inject(ElectromagnetismSceneService);

  readonly id = 'electromagnetism-interaction-solver';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.solverStrategy === 'electromagnetic-interaction';
  }

  createValidationScope(
    _analysis: FormulaScenarioAnalysisModel,
    config: FormulaScenarioConfigModel,
    context: FormulaScenarioSolverContextModel,
  ): Record<string, number> {
    return {
      ...config.parameterValues,
      t: 0,
      dt: context.validationDeltaTime,
      q1: config.parameterValues['q1'] ?? 1.6,
      q2: config.parameterValues['q2'] ?? -1.2,
      k: config.parameterValues['k'] ?? 42000,
      x1: config.parameterValues['x1'] ?? -140,
      y1: config.parameterValues['y1'] ?? 0,
      x2: config.parameterValues['x2'] ?? 140,
      y2: config.parameterValues['y2'] ?? 0,
      vx1: 0,
      vy1: 0,
      vx2: 0,
      vy2: 0,
      ax1: 0,
      ay1: 0,
      ax2: 0,
      ay2: 0,
      dx: (config.parameterValues['x2'] ?? 140) - (config.parameterValues['x1'] ?? -140),
      dy: (config.parameterValues['y2'] ?? 0) - (config.parameterValues['y1'] ?? 0),
      r: Math.max(
        14,
        Math.hypot(
          (config.parameterValues['x2'] ?? 140) - (config.parameterValues['x1'] ?? -140),
          (config.parameterValues['y2'] ?? 0) - (config.parameterValues['y1'] ?? 0),
        ),
      ),
      distance: Math.max(
        14,
        Math.hypot(
          (config.parameterValues['x2'] ?? 140) - (config.parameterValues['x1'] ?? -140),
          (config.parameterValues['y2'] ?? 0) - (config.parameterValues['y1'] ?? 0),
        ),
      ),
    };
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    return this.scene.createInitialState(
      program.analysis.classification.family as
        | 'coulomb-force'
        | 'coulomb-guided'
        | 'field-guided',
      config,
      context,
      this.createForceEvaluator(program),
    );
  }

  step(
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    return this.scene.stepState(
      program.analysis.classification.family as
        | 'coulomb-force'
        | 'coulomb-guided'
        | 'field-guided',
      state,
      config,
      deltaTime,
      context,
      this.createForceEvaluator(program),
    );
  }

  private createForceEvaluator(
    program: FormulaScenarioProgramContract,
  ): (scope: Record<string, number>) => number {
    if (program.analysis.classification.family === 'coulomb-force') {
      return (scope) => program.evaluateScalar(scope);
    }

    return (scope) =>
      (scope['k'] ?? 42000) *
      ((scope['q1'] ?? 1) * (scope['q2'] ?? -1)) /
      Math.max(14, (scope['r'] ?? scope['distance'] ?? 140)) ** 2;
  }
}
