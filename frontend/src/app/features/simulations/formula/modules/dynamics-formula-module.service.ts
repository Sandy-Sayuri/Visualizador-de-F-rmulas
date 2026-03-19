import { Injectable } from '@angular/core';

import {
  FormulaScenarioFeatureModel,
  PhysicsDomainDescriptorModel,
  ParsedFormulaModel,
} from '../../models/formula-engine.model';
import { FormulaParameterDefinitionModel } from '../../models/formula-scenario.model';
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
    if (parsed.targetInfo.targetName.toLowerCase() === 'dynamics_incline') {
      return this.buildClassification({
        family: 'inclined-plane',
        solverStrategy: 'guided-dynamics',
        visualStrategy: 'inclined-plane',
        confidence: 1,
        reasons: [
          'Cenario guiado de decomposicao do peso em um plano inclinado.',
        ],
      });
    }

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

  override extractParameters(
    parsed: ParsedFormulaModel,
    _features: FormulaScenarioFeatureModel,
    fallbackDefinitions: FormulaParameterDefinitionModel[],
  ): FormulaParameterDefinitionModel[] {
    if (parsed.targetInfo.targetName.toLowerCase() === 'dynamics_incline') {
      return [
        {
          key: 'mass',
          label: 'Massa',
          defaultValue: 12,
          min: 1,
          max: 60,
          step: 0.5,
          inputMode: 'range',
        },
        {
          key: 'angleDeg',
          label: 'Angulo do plano',
          defaultValue: 28,
          min: 5,
          max: 60,
          step: 1,
          inputMode: 'range',
        },
        {
          key: 'g',
          label: 'Gravidade',
          defaultValue: 9.81,
          min: 1,
          max: 20,
          step: 0.1,
        },
      ];
    }

    return fallbackDefinitions;
  }
}
