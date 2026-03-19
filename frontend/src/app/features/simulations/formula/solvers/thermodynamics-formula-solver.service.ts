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
import { ThermodynamicsParticleSceneService } from '../thermodynamics/thermodynamics-particle-scene.service';

@Injectable({
  providedIn: 'root',
})
export class ThermodynamicsFormulaSolverService
  implements FormulaScenarioSolverModel
{
  private readonly scene = inject(ThermodynamicsParticleSceneService);

  readonly id = 'thermodynamics-particles-solver';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.solverStrategy === 'thermodynamics-particles';
  }

  createValidationScope(
    _analysis: FormulaScenarioAnalysisModel,
    config: FormulaScenarioConfigModel,
    _context: FormulaScenarioSolverContextModel,
  ): Record<string, number> {
    return {
      ...config.parameterValues,
      t: 0,
      temperature: config.parameterValues['temperature'] ?? 420,
      volume: config.parameterValues['volume'] ?? 82,
      particleCount: config.parameterValues['particleCount'] ?? 24,
    };
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    _context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    return this.scene.createInitialState(
      program.analysis.classification.family as 'gas' | 'compression',
      config,
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
      program.analysis.classification.family as 'gas' | 'compression',
      state,
      config,
      deltaTime,
      context,
    );
  }
}
