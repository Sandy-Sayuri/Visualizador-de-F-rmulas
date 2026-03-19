import { inject, Injectable } from '@angular/core';

import {
  FormulaScenarioProgramContract,
  FormulaScenarioSolverContextModel,
  FormulaScenarioSolverModel,
} from '../models/formula-engine.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioConfigModel,
  FormulaScenarioStateModel,
} from '../models/formula-scenario.model';
import { FormulaScenarioAnalyzerService } from './formula-scenario-analyzer.service';
import { FormulaScenarioEvaluatorService } from './formula-scenario-evaluator.service';
import { PairForceFormulaSolverService } from './solvers/pair-force-formula-solver.service';
import { SingleBodyFormulaSolverService } from './solvers/single-body-formula-solver.service';

export interface FormulaScenarioProgram extends FormulaScenarioProgramContract {
  solver: FormulaScenarioSolverModel;
}

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioEngineService {
  private readonly analyzer = inject(FormulaScenarioAnalyzerService);
  private readonly evaluator = inject(FormulaScenarioEvaluatorService);
  private readonly solvers = [
    inject(PairForceFormulaSolverService),
    inject(SingleBodyFormulaSolverService),
  ];

  private readonly context: FormulaScenarioSolverContextModel = {
    validationDeltaTime: 0.016,
    maxTrailPoints: 220,
    maxAbsoluteCoordinate: 5000,
  };

  compileProgram(
    config: FormulaScenarioConfigModel,
    analysis?: FormulaScenarioAnalysisModel,
  ): FormulaScenarioProgram {
    const resolvedAnalysis = analysis ?? this.analyzer.analyze(config.formula);
    const compiledExpression = this.evaluator.compileExpression(
      resolvedAnalysis.expression,
    );
    const solver = this.resolveSolver(resolvedAnalysis);

    this.evaluator.evaluateScalar(
      compiledExpression,
      solver.createValidationScope(resolvedAnalysis, config, this.context),
    );

    return {
      analysis: resolvedAnalysis,
      solver,
      evaluateScalar: (scope) =>
        this.evaluator.evaluateScalar(compiledExpression, scope),
    };
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgram,
  ): FormulaScenarioStateModel {
    return program.solver.createInitialState(config, program, this.context);
  }

  step(
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgram,
    deltaTime: number,
  ): FormulaScenarioStateModel {
    return program.solver.step(state, config, program, deltaTime, this.context);
  }

  private resolveSolver(
    analysis: FormulaScenarioAnalysisModel,
  ): FormulaScenarioSolverModel {
    const solver = this.solvers.find((candidate) => candidate.supports(analysis));

    if (!solver) {
      throw new Error('Nao ha solver disponivel para essa formula nesta etapa.');
    }

    return solver;
  }
}
