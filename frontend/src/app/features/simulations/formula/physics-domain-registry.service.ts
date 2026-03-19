import { inject, Injectable } from '@angular/core';

import {
  FormulaScenarioClassificationModel,
  FormulaScenarioFeatureModel,
  ParsedFormulaModel,
  PhysicsDomainModuleModel,
  PhysicsDomainRegistryModel,
} from '../models/formula-engine.model';
import { FormulaParameterDefinitionModel } from '../models/formula-scenario.model';
import { DynamicsFormulaModuleService } from './modules/dynamics-formula-module.service';
import { ElectromagnetismFormulaModuleService } from './modules/electromagnetism-formula-module.service';
import { GenericFormulaModuleService } from './modules/generic-formula-module.service';
import { GravitationFormulaModuleService } from './modules/gravitation-formula-module.service';
import { KinematicsFormulaModuleService } from './modules/kinematics-formula-module.service';
import { OpticalFormulaModuleService } from './modules/optical-formula-module.service';
import { OscillationFormulaModuleService } from './modules/oscillation-formula-module.service';
import { ThermodynamicsFormulaModuleService } from './modules/thermodynamics-formula-module.service';
import { WaveFormulaModuleService } from './modules/wave-formula-module.service';

@Injectable({
  providedIn: 'root',
})
export class PhysicsDomainRegistryService implements PhysicsDomainRegistryModel {
  private readonly domains: PhysicsDomainModuleModel[] = [
    inject(GravitationFormulaModuleService),
    inject(WaveFormulaModuleService),
    inject(OscillationFormulaModuleService),
    inject(DynamicsFormulaModuleService),
    inject(KinematicsFormulaModuleService),
    inject(OpticalFormulaModuleService),
    inject(ElectromagnetismFormulaModuleService),
    inject(ThermodynamicsFormulaModuleService),
    inject(GenericFormulaModuleService),
  ];

  getDomains() {
    return this.domains.map((domain) => domain.descriptor);
  }

  resolveClassification(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel {
    const matchingDomains = this.domains
      .filter((domain) => domain.canHandle(parsed, features))
      .map((domain) => domain.classify(parsed, features))
      .filter((match): match is FormulaScenarioClassificationModel => !!match)
      .sort((left, right) => right.confidence - left.confidence);

    const classification = matchingDomains[0];

    if (classification) {
      return classification;
    }

    const fallbackDomain = this.domains[this.domains.length - 1];
    const fallbackClassification = fallbackDomain.classify(parsed, features);

    if (!fallbackClassification) {
      throw new Error('Nao ha dominio fisico registrado para essa formula.');
    }

    return fallbackClassification;
  }

  extractParameters(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
    classification: FormulaScenarioClassificationModel,
    fallbackDefinitions: FormulaParameterDefinitionModel[],
  ): FormulaParameterDefinitionModel[] {
    const domain = this.domains.find((candidate) => candidate.id === classification.moduleId);

    if (!domain) {
      return fallbackDefinitions;
    }

    return domain.extractParameters(parsed, features, fallbackDefinitions);
  }
}
