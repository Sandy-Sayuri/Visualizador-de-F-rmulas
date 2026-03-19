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
export class GenericFormulaModuleService implements FormulaDomainModuleModel {
  readonly id = 'generic';

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel | null {
    const solverStrategy =
      parsed.targetInfo.evaluationMode === 'position' ||
      parsed.targetInfo.evaluationMode === 'scalar'
        ? 'direct-expression'
        : 'single-state-integration';

    return {
      moduleId: this.id,
      domain: 'generic',
      family: 'free-expression',
      displayLabel: 'Expressao generica',
      solverStrategy,
      visualStrategy: features.usesTrig
        ? 'oscillation-pattern'
        : features.usesState || parsed.targetInfo.evaluationMode !== 'position'
          ? 'trajectory'
          : 'particle',
      supportStatus: 'implemented',
      confidence: 0.3,
      reasons: ['A formula nao entrou em um dominio especializado e usa o fallback seguro.'],
    };
  }
}
