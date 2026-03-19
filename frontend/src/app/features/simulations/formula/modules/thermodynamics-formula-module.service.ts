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
export class ThermodynamicsFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'thermodynamics';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'thermodynamics',
    label: 'Termodinamica',
    status: 'implemented',
    notes: 'Gas ideal simples e compressao visual com particulas em recipiente.',
  };

  classify(
    parsed: ParsedFormulaModel,
    _features: FormulaScenarioFeatureModel,
  ) {
    const target = parsed.targetInfo.targetName.toLowerCase();

    if (target === 'thermo_gas') {
      return this.buildClassification({
        family: 'gas',
        solverStrategy: 'thermodynamics-particles',
        visualStrategy: 'thermodynamics-box',
        confidence: 1,
        reasons: ['Cenario guiado de gas ideal em recipiente.'],
      });
    }

    if (target === 'thermo_compression') {
      return this.buildClassification({
        family: 'compression',
        solverStrategy: 'thermodynamics-particles',
        visualStrategy: 'thermodynamics-box',
        confidence: 1,
        reasons: ['Cenario guiado de expansao e compressao em recipiente.'],
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

    if (target === 'thermo_gas') {
      return [
        {
          key: 'temperature',
          label: 'Temperatura',
          defaultValue: 420,
          min: 180,
          max: 900,
          step: 10,
          inputMode: 'range',
        },
        {
          key: 'volume',
          label: 'Volume',
          defaultValue: 82,
          min: 40,
          max: 100,
          step: 1,
          inputMode: 'range',
        },
        {
          key: 'particleCount',
          label: 'Particulas',
          defaultValue: 24,
          min: 8,
          max: 40,
          step: 1,
          inputMode: 'range',
        },
      ];
    }

    if (target === 'thermo_compression') {
      return [
        {
          key: 'temperature',
          label: 'Temperatura',
          defaultValue: 520,
          min: 180,
          max: 900,
          step: 10,
          inputMode: 'range',
        },
        {
          key: 'volume',
          label: 'Volume alvo',
          defaultValue: 52,
          min: 40,
          max: 100,
          step: 1,
          inputMode: 'range',
        },
        {
          key: 'particleCount',
          label: 'Particulas',
          defaultValue: 30,
          min: 8,
          max: 40,
          step: 1,
          inputMode: 'range',
        },
      ];
    }

    return fallbackDefinitions;
  }
}
