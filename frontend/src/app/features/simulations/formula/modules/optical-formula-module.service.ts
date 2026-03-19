import { Injectable } from '@angular/core';

import {
  FormulaScenarioFeatureModel,
  ParsedFormulaModel,
  PhysicsDomainDescriptorModel,
} from '../../models/formula-engine.model';
import { FormulaParameterDefinitionModel } from '../../models/formula-scenario.model';
import { BasePhysicsDomainService } from './base-physics-domain.service';

@Injectable({
  providedIn: 'root',
})
export class OpticalFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'optics';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'optics',
    label: 'Optica',
    status: 'implemented',
    notes: 'Reflexao, refracao e lente convergente simples em cenarios guiados.',
  };

  classify(
    parsed: ParsedFormulaModel,
    _features: FormulaScenarioFeatureModel,
  ) {
    const target = parsed.targetInfo.targetName.toLowerCase();

    if (target === 'optics_reflection') {
      return this.buildClassification({
        family: 'reflection',
        solverStrategy: 'optical-guided',
        visualStrategy: 'optical-rays',
        confidence: 1,
        reasons: ['Cenario guiado de reflexao em superficie plana.'],
      });
    }

    if (target === 'optics_refraction') {
      return this.buildClassification({
        family: 'refraction',
        solverStrategy: 'optical-guided',
        visualStrategy: 'optical-rays',
        confidence: 1,
        reasons: ['Cenario guiado de refracao com lei de Snell simplificada.'],
      });
    }

    if (target === 'optics_lens') {
      return this.buildClassification({
        family: 'lens',
        solverStrategy: 'optical-guided',
        visualStrategy: 'optical-rays',
        confidence: 1,
        reasons: ['Cenario guiado de lente convergente simples.'],
      });
    }

    return null;
  }

  override extractParameters(
    parsed: ParsedFormulaModel,
    _features: FormulaScenarioFeatureModel,
    fallbackDefinitions: FormulaParameterDefinitionModel[],
  ): FormulaParameterDefinitionModel[] {
    const target = parsed.targetInfo.targetName.toLowerCase();

    if (target === 'optics_reflection') {
      return [
        { key: 'angleDeg', label: 'Angulo', defaultValue: 34, min: 5, step: 1 },
        { key: 'sourceX', label: 'Fonte X', defaultValue: -210, step: 10 },
        { key: 'sourceY', label: 'Fonte Y', defaultValue: 170, step: 10 },
      ];
    }

    if (target === 'optics_refraction') {
      return [
        { key: 'angleDeg', label: 'Angulo', defaultValue: 30, min: 5, step: 1 },
        { key: 'n1', label: 'n1', defaultValue: 1, min: 1, step: 0.01 },
        { key: 'n2', label: 'n2', defaultValue: 1.33, min: 1, step: 0.01 },
        { key: 'sourceX', label: 'Fonte X', defaultValue: -210, step: 10 },
        { key: 'sourceY', label: 'Fonte Y', defaultValue: 170, step: 10 },
      ];
    }

    if (target === 'optics_lens') {
      return [
        {
          key: 'focalLength',
          label: 'Foco',
          defaultValue: 120,
          min: 40,
          step: 5,
        },
        { key: 'sourceX', label: 'Fonte X', defaultValue: -240, step: 10 },
        { key: 'sourceY', label: 'Fonte Y', defaultValue: 70, step: 10 },
      ];
    }

    return fallbackDefinitions;
  }
}
