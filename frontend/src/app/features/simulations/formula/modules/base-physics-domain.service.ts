import {
  FormulaScenarioClassificationModel,
  FormulaScenarioFeatureModel,
  ParsedFormulaModel,
  PhysicsDomainDescriptorModel,
  PhysicsDomainModuleModel,
} from '../../models/formula-engine.model';
import { FormulaParameterDefinitionModel } from '../../models/formula-scenario.model';

export abstract class BasePhysicsDomainService
  implements PhysicsDomainModuleModel
{
  abstract readonly id: string;
  abstract readonly descriptor: PhysicsDomainDescriptorModel;
  abstract classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel | null;

  canHandle(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): boolean {
    return !!this.classify(parsed, features);
  }

  extractParameters(
    _parsed: ParsedFormulaModel,
    _features: FormulaScenarioFeatureModel,
    fallbackDefinitions: FormulaParameterDefinitionModel[],
  ): FormulaParameterDefinitionModel[] {
    return fallbackDefinitions;
  }

  protected buildClassification(
    match: Omit<
      FormulaScenarioClassificationModel,
      'moduleId' | 'domain' | 'displayLabel' | 'supportStatus'
    >,
  ): FormulaScenarioClassificationModel {
    return {
      moduleId: this.id,
      domain: this.descriptor.domain,
      displayLabel: this.descriptor.label,
      supportStatus: this.descriptor.status,
      ...match,
    };
  }
}
