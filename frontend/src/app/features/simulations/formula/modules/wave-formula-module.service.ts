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
export class WaveFormulaModuleService implements FormulaDomainModuleModel {
  readonly id = 'waves';

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel | null {
    const symbolSet = new Set(parsed.symbols.map((symbol) => symbol.toLowerCase()));
    const isWaveTarget = parsed.targetInfo.target === 'y';
    const hasSpatialAxis = symbolSet.has('x');
    const hasWaveHints =
      symbolSet.has('k') ||
      symbolSet.has('w') ||
      symbolSet.has('omega') ||
      symbolSet.has('lambda');

    if (
      !isWaveTarget ||
      !features.usesTime ||
      !features.usesTrig ||
      !hasSpatialAxis ||
      features.particleStrategy === 'pair'
    ) {
      return null;
    }

    return {
      moduleId: this.id,
      domain: 'waves',
      family: 'traveling-wave',
      displayLabel: 'Ondas',
      solverStrategy: 'wave-sampling',
      visualStrategy: 'wave',
      supportStatus: 'implemented',
      confidence: hasWaveHints ? 0.99 : 0.93,
      reasons: [
        'A formula descreve um deslocamento vertical dependente de x e t.',
        'A presenca de seno ou cosseno indica propagacao periodica no espaco.',
      ],
    };
  }
}
