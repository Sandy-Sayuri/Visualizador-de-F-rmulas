import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root',
})
export class ElectromagnetismFormulaSolverService
  implements FormulaScenarioSolverModel
{
  readonly id = 'electromagnetism-placeholder-solver';

  supports(_analysis: FormulaScenarioAnalysisModel): boolean {
    return false;
  }

  createValidationScope(
    _analysis: FormulaScenarioAnalysisModel,
    _config: FormulaScenarioConfigModel,
    _context: FormulaScenarioSolverContextModel,
  ): Record<string, number> {
    throw new Error('Solver de eletromagnetismo ainda nao implementado.');
  }

  createInitialState(
    _config: FormulaScenarioConfigModel,
    _program: FormulaScenarioProgramContract,
    _context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    throw new Error('Solver de eletromagnetismo ainda nao implementado.');
  }

  step(
    _state: FormulaScenarioStateModel,
    _config: FormulaScenarioConfigModel,
    _program: FormulaScenarioProgramContract,
    _deltaTime: number,
    _context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    throw new Error('Solver de eletromagnetismo ainda nao implementado.');
  }
}
