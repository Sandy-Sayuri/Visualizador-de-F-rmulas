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
export class GenericFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'generic';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'generic',
    label: 'Expressoes genericas',
    status: 'implemented',
    notes: 'Fallback seguro para formulas fora dos dominios especializados.',
  };

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ) {
    const solverStrategy =
      parsed.targetInfo.evaluationMode === 'position' ||
      parsed.targetInfo.evaluationMode === 'scalar'
        ? 'direct-expression'
        : 'single-state-integration';

    return this.buildClassification({
      family: 'free-expression',
      solverStrategy,
      visualStrategy: features.usesTrig
        ? 'oscillation-pattern'
        : features.usesState || parsed.targetInfo.evaluationMode !== 'position'
          ? 'trajectory'
          : 'particle',
      confidence: 0.3,
      reasons: ['A formula nao entrou em um dominio especializado e usa o fallback seguro.'],
    });
  }
}
