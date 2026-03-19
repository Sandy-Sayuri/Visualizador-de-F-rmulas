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
export class KinematicsFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'kinematics';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'kinematics',
    label: 'Cinematica',
    status: 'implemented',
    notes: 'Formulas diretas de posicao, velocidade e trajetorias simples.',
  };

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ) {
    if (features.particleStrategy === 'pair') {
      return null;
    }

    const isKinematicsTarget =
      parsed.targetInfo.evaluationMode === 'position' ||
      parsed.targetInfo.evaluationMode === 'velocity' ||
      parsed.targetInfo.evaluationMode === 'scalar';

    if (!isKinematicsTarget) {
      return null;
    }

    if (!features.usesTime && parsed.targetInfo.evaluationMode !== 'velocity') {
      return null;
    }

    const directExpression =
      parsed.targetInfo.evaluationMode === 'position' ||
      parsed.targetInfo.evaluationMode === 'scalar';
    const reasons =
      parsed.targetInfo.evaluationMode === 'velocity' && !features.usesTime
        ? ['A formula define uma velocidade constante que pode ser integrada no eixo x.']
        : ['A formula relaciona tempo e movimento sem interacao entre corpos.'];

    return this.buildClassification({
      family: directExpression
        ? 'direct-trajectory'
        : features.usesTime
          ? 'time-driven-velocity'
          : 'constant-velocity',
      solverStrategy: directExpression
        ? 'direct-expression'
        : 'single-state-integration',
      visualStrategy:
        directExpression && !features.usesState ? 'particle' : 'trajectory',
      confidence:
        parsed.targetInfo.evaluationMode === 'velocity' && !features.usesTime
          ? 0.84
          : features.usesState
            ? 0.72
            : 0.9,
      reasons,
    });
  }
}
