import { inject, Injectable } from '@angular/core';

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
import { OpticalGuidedSceneService } from '../optics/optical-guided-scene.service';

@Injectable({
  providedIn: 'root',
})
export class OpticalFormulaSolverService implements FormulaScenarioSolverModel {
  private readonly optics = inject(OpticalGuidedSceneService);

  readonly id = 'optical-placeholder-solver';

  supports(analysis: FormulaScenarioAnalysisModel): boolean {
    return analysis.classification.solverStrategy === 'optical-guided';
  }

  createValidationScope(
    _analysis: FormulaScenarioAnalysisModel,
    config: FormulaScenarioConfigModel,
    _context: FormulaScenarioSolverContextModel,
  ): Record<string, number> {
    return {
      ...config.parameterValues,
      t: 0,
    };
  }

  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    _context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const scene = this.optics.buildState(
      program.analysis.classification.family as 'reflection' | 'refraction' | 'lens',
      config,
      0,
    );

    return {
      time: 0,
      bodies: scene.bodies,
      sceneData: scene.sceneData,
    };
  }

  step(
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    deltaTime: number,
    _context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const nextTime = state.time + deltaTime;
    const scene = this.optics.buildState(
      program.analysis.classification.family as 'reflection' | 'refraction' | 'lens',
      config,
      nextTime,
    );

    return {
      time: nextTime,
      bodies: scene.bodies,
      sceneData: scene.sceneData,
    };
  }
}
