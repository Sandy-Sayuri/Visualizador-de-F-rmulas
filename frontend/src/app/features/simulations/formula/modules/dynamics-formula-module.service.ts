import { Injectable } from '@angular/core';

import {
  FormulaDomainModuleModel,
  FormulaScenarioClassificationModel,
  FormulaScenarioFeatureModel,
  ParsedFormulaModel,
} from '../../models/formula-engine.model';

@Injectable({
  providedIn: 'root',
})
export class DynamicsFormulaModuleService implements FormulaDomainModuleModel {
  readonly id = 'dynamics';

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel | null {
    if (features.particleStrategy === 'pair') {
      return null;
    }

    if (
      parsed.targetInfo.evaluationMode !== 'acceleration' &&
      parsed.targetInfo.evaluationMode !== 'force'
    ) {
      return null;
    }

    return {
      moduleId: this.id,
      domain: 'dynamics',
      family: 'state-driven-motion',
      displayLabel: 'Dinamica',
      solverStrategy: 'single-state-integration',
      visualStrategy: 'trajectory',
      supportStatus: 'implemented',
      confidence: features.usesState ? 0.88 : 0.75,
      reasons: [
        'A formula descreve aceleracao ou forca aplicada a um corpo.',
      ],
    };
  }
}
