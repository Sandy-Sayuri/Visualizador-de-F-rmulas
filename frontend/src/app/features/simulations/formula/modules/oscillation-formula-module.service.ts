import { Injectable } from '@angular/core';

import {
  FormulaScenarioFeatureModel,
  PhysicsDomainDescriptorModel,
  ParsedFormulaModel,
} from '../../models/formula-engine.model';
import { BasePhysicsDomainService } from './base-physics-domain.service';

@Injectable({
  providedIn: 'root',
})
export class OscillationFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'oscillation';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'oscillation',
    label: 'Oscilacao',
    status: 'implemented',
    notes: 'Movimentos periodicos e sistemas com padrao oscilatorio.',
  };

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ) {
    const hasRestoringPattern =
      features.usesState &&
      ['acceleration', 'force'].includes(parsed.targetInfo.evaluationMode) &&
      parsed.symbols.some((symbol) => ['k', 'w', 'omega'].includes(symbol.toLowerCase()));

    if (!features.usesTrig && !hasRestoringPattern) {
      return null;
    }

    return this.buildClassification({
      family: 'periodic-motion',
      solverStrategy:
        parsed.targetInfo.evaluationMode === 'position' ||
        parsed.targetInfo.evaluationMode === 'scalar'
          ? 'direct-expression'
          : 'single-state-integration',
      visualStrategy: 'oscillation-pattern',
      confidence: features.usesTrig ? 0.96 : 0.92,
      reasons: [
        features.usesTrig
          ? 'A expressao usa funcao trigonometrica.'
          : 'A formula indica forca restauradora em torno de um estado.',
      ],
    });
  }
}
