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
export class WaveFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'waves';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'waves',
    label: 'Ondas',
    status: 'implemented',
    notes: 'Ondas viajantes simples com propagacao, amplitude e frequencia.',
  };

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ) {
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

    return this.buildClassification({
      family: 'traveling-wave',
      solverStrategy: 'wave-sampling',
      visualStrategy: 'wave',
      confidence: hasWaveHints ? 0.99 : 0.93,
      reasons: [
        'A formula descreve um deslocamento vertical dependente de x e t.',
        'A presenca de seno ou cosseno indica propagacao periodica no espaco.',
      ],
    });
  }
}
