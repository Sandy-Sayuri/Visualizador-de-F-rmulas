import { Injectable } from '@angular/core';

import {
  FormulaDomainModuleModel,
  FormulaScenarioClassificationModel,
  FormulaScenarioFeatureModel,
  ParsedFormulaModel,
} from '../../models/formula-engine.model';

@Injectable({
  providedIn: 'root',
})
export class KinematicsFormulaModuleService
  implements FormulaDomainModuleModel
{
  readonly id = 'kinematics';

  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel | null {
    if (features.particleStrategy === 'pair') {
      return null;
    }

    const isKinematicsTarget =
      parsed.targetInfo.evaluationMode === 'position' ||
      parsed.targetInfo.evaluationMode === 'velocity' ||
      parsed.targetInfo.evaluationMode === 'scalar';

    if (!isKinematicsTarget || !features.usesTime) {
      return null;
    }

    const directExpression =
      parsed.targetInfo.evaluationMode === 'position' ||
      parsed.targetInfo.evaluationMode === 'scalar';

    return {
      moduleId: this.id,
      domain: 'kinematics',
      family: directExpression ? 'direct-trajectory' : 'time-driven-velocity',
      displayLabel: 'Cinematica',
      solverStrategy: directExpression
        ? 'direct-expression'
        : 'single-state-integration',
      visualStrategy:
        directExpression && !features.usesState ? 'particle' : 'trajectory',
      supportStatus: 'implemented',
      confidence: features.usesState ? 0.72 : 0.9,
      reasons: ['A formula relaciona tempo e movimento sem interacao entre corpos.'],
    };
  }
}
