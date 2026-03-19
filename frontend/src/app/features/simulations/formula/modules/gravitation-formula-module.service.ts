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
export class GravitationFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'gravitation';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'gravitation',
    label: 'Gravitacao',
    status: 'implemented',
    notes: 'Interacao simples entre dois corpos com lei de forca.',
  };

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ) {
    if (
      parsed.targetInfo.evaluationMode !== 'force' ||
      features.particleStrategy !== 'pair'
    ) {
      return null;
    }

    return this.buildClassification({
      family: 'two-body-force',
      solverStrategy: 'pair-force-integration',
      visualStrategy: 'pair-interaction',
      confidence: 0.98,
      reasons: [
        'A formula define uma forca com interacao entre corpos.',
        'Ha pistas de massa e distancia compativeis com gravitacao simples.',
      ],
    });
  }
}
