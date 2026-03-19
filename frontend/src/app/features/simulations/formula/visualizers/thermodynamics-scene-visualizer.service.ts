import { Injectable } from '@angular/core';

import { FormulaSceneVisualizerModel } from '../../models/formula-engine.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../../models/formula-scenario.model';

@Injectable({
  providedIn: 'root',
})
export class ThermodynamicsSceneVisualizerService
  implements FormulaSceneVisualizerModel
{
  readonly id = 'thermodynamics-placeholder-visualizer';

  supports(_analysis: FormulaScenarioAnalysisModel): boolean {
    return false;
  }

  buildScene(
    _analysis: FormulaScenarioAnalysisModel,
    _state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    throw new Error('Renderer de termodinamica ainda nao implementado.');
  }
}
