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
export class DynamicsFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'dynamics';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'dynamics',
    label: 'Dinamica',
    status: 'implemented',
    notes: 'Aceleracao, forca e integracao numerica de um corpo.',
  };

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ) {
    if (features.particleStrategy === 'pair') {
      return null;
    }

    if (
      parsed.targetInfo.evaluationMode !== 'acceleration' &&
      parsed.targetInfo.evaluationMode !== 'force'
    ) {
      return null;
    }

    return this.buildClassification({
      family: 'state-driven-motion',
      solverStrategy: 'single-state-integration',
      visualStrategy: 'trajectory',
      confidence: features.usesState ? 0.88 : 0.75,
      reasons: [
        'A formula descreve aceleracao ou forca aplicada a um corpo.',
      ],
    });
  }
}
