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
export class GravitationFormulaModuleService
  implements FormulaDomainModuleModel
{
  readonly id = 'gravitation';

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel | null {
    if (
      parsed.targetInfo.evaluationMode !== 'force' ||
      features.particleStrategy !== 'pair'
    ) {
      return null;
    }

    return {
      moduleId: this.id,
      domain: 'gravitation',
      family: 'two-body-force',
      displayLabel: 'Gravitacao',
      solverStrategy: 'pair-force-integration',
      visualStrategy: 'pair-interaction',
      supportStatus: 'implemented',
      confidence: 0.98,
      reasons: [
        'A formula define uma forca com interacao entre corpos.',
        'Ha pistas de massa e distancia compativeis com gravitacao simples.',
      ],
    };
  }
}
