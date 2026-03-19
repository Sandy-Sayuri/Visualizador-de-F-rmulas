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
export class OscillationFormulaModuleService
  implements FormulaDomainModuleModel
{
  readonly id = 'oscillation';

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel | null {
    const hasRestoringPattern =
      features.usesState &&
      ['acceleration', 'force'].includes(parsed.targetInfo.evaluationMode) &&
      parsed.symbols.some((symbol) => ['k', 'w', 'omega'].includes(symbol.toLowerCase()));

    if (!features.usesTrig && !hasRestoringPattern) {
      return null;
    }

    return {
      moduleId: this.id,
      domain: 'oscillation',
      family: 'periodic-motion',
      displayLabel: 'Oscilacao',
      solverStrategy:
        parsed.targetInfo.evaluationMode === 'position' ||
        parsed.targetInfo.evaluationMode === 'scalar'
          ? 'direct-expression'
          : 'single-state-integration',
      visualStrategy: 'oscillation-pattern',
      supportStatus: 'implemented',
      confidence: features.usesTrig ? 0.96 : 0.92,
      reasons: [
        features.usesTrig
          ? 'A expressao usa funcao trigonometrica.'
          : 'A formula indica forca restauradora em torno de um estado.',
      ],
    };
  }
}
