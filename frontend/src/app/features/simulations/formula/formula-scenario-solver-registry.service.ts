import { inject, Injectable } from '@angular/core';

import {
  FormulaScenarioSolverModel,
} from '../models/formula-engine.model';
import { FormulaScenarioAnalysisModel } from '../models/formula-scenario.model';
import { ElectromagnetismFormulaSolverService } from './solvers/electromagnetism-formula-solver.service';
import { OpticalFormulaSolverService } from './solvers/optical-formula-solver.service';
import { PairForceFormulaSolverService } from './solvers/pair-force-formula-solver.service';
import { SingleBodyFormulaSolverService } from './solvers/single-body-formula-solver.service';
import { ThermodynamicsFormulaSolverService } from './solvers/thermodynamics-formula-solver.service';
import { WaveFormulaSolverService } from './solvers/wave-formula-solver.service';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioSolverRegistryService {
  private readonly solvers: FormulaScenarioSolverModel[] = [
    inject(PairForceFormulaSolverService),
    inject(WaveFormulaSolverService),
    inject(OpticalFormulaSolverService),
    inject(ElectromagnetismFormulaSolverService),
    inject(ThermodynamicsFormulaSolverService),
    inject(SingleBodyFormulaSolverService),
  ];

  resolve(analysis: FormulaScenarioAnalysisModel): FormulaScenarioSolverModel {
    const solver = this.solvers.find((candidate) => candidate.supports(analysis));

    if (!solver) {
      throw new Error('Nao ha solver disponivel para essa formula nesta etapa.');
    }

    return solver;
  }
}
