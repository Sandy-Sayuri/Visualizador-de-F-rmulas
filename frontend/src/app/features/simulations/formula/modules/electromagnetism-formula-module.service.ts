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
export class ElectromagnetismFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'electromagnetism';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'electromagnetism',
    label: 'Eletromagnetismo',
    status: 'implemented',
    notes: 'Lei de Coulomb, campo eletrico simples, vetores e linhas de campo.',
  };

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ) {
    const target = parsed.targetInfo.targetName.toLowerCase();
    const symbols = new Set(features.symbols.map((symbol) => symbol.toLowerCase()));
    const hasChargePair = symbols.has('q1') && symbols.has('q2');
    const hasDistance =
      symbols.has('r') ||
      symbols.has('distance') ||
      (symbols.has('x1') && symbols.has('x2')) ||
      (symbols.has('dx') && symbols.has('dy'));

    if (target === 'electro_coulomb') {
      return this.buildClassification({
        family: 'coulomb-guided',
        solverStrategy: 'electromagnetic-interaction',
        visualStrategy: 'field',
        confidence: 1,
        reasons: ['Cenario guiado de interacao entre duas cargas.'],
      });
    }

    if (target === 'electro_field') {
      return this.buildClassification({
        family: 'field-guided',
        solverStrategy: 'electromagnetic-interaction',
        visualStrategy: 'field',
        confidence: 1,
        reasons: ['Cenario guiado de campo eletrico simples com linhas de campo.'],
      });
    }

    if (
      parsed.targetInfo.evaluationMode === 'force' &&
      features.particleStrategy === 'pair' &&
      hasChargePair &&
      hasDistance
    ) {
      return this.buildClassification({
        family: 'coulomb-force',
        solverStrategy: 'electromagnetic-interaction',
        visualStrategy: 'field',
        confidence: 0.99,
        reasons: [
          'A formula usa cargas eletricas em uma lei de forca.',
          'Ha interacao a distancia compativel com a lei de Coulomb.',
        ],
      });
    }

    return null;
  }

  override extractParameters(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
    fallbackDefinitions: FormulaParameterDefinitionModel[],
  ): FormulaParameterDefinitionModel[] {
    const target = parsed.targetInfo.targetName.toLowerCase();
    const symbols = new Set(features.symbols.map((symbol) => symbol.toLowerCase()));

    if (target === 'electro_coulomb') {
      return this.createCoulombDefinitions();
    }

    if (target === 'electro_field') {
      return [
        { key: 'q1', label: 'q1', defaultValue: 1.8, step: 0.1 },
        { key: 'q2', label: 'q2', defaultValue: 0.4, step: 0.1 },
        { key: 'k', label: 'k', defaultValue: 42000, min: 1, step: 100 },
        { key: 'x1', label: 'Fonte X', defaultValue: 0, step: 10 },
        { key: 'y1', label: 'Fonte Y', defaultValue: 0, step: 10 },
        { key: 'x2', label: 'Sonda X', defaultValue: 180, step: 10 },
        { key: 'y2', label: 'Sonda Y', defaultValue: 20, step: 10 },
      ];
    }

    if (symbols.has('q1') && symbols.has('q2')) {
      return this.createCoulombDefinitions();
    }

    return fallbackDefinitions;
  }

  private createCoulombDefinitions(): FormulaParameterDefinitionModel[] {
    return [
      { key: 'q1', label: 'q1', defaultValue: 1.6, step: 0.1 },
      { key: 'q2', label: 'q2', defaultValue: -1.2, step: 0.1 },
      { key: 'k', label: 'k', defaultValue: 42000, min: 1, step: 100 },
      { key: 'x1', label: 'Carga 1 X', defaultValue: -140, step: 10 },
      { key: 'y1', label: 'Carga 1 Y', defaultValue: 0, step: 10 },
      { key: 'x2', label: 'Carga 2 X', defaultValue: 140, step: 10 },
      { key: 'y2', label: 'Carga 2 Y', defaultValue: 0, step: 10 },
    ];
  }
}
