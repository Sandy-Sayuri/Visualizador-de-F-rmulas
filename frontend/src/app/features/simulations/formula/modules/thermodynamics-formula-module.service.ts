import { Injectable } from '@angular/core';

import { FormulaScenarioFeatureModel, PhysicsDomainDescriptorModel, ParsedFormulaModel } from '../../models/formula-engine.model';
import { BasePhysicsDomainService } from './base-physics-domain.service';

@Injectable({
  providedIn: 'root',
})
export class ThermodynamicsFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'thermodynamics';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'thermodynamics',
    label: 'Termodinamica',
    status: 'planned',
    notes: 'Preparado para gas ideal, pressao, volume e temperatura.',
  };

  classify(
    _parsed: ParsedFormulaModel,
    _features: FormulaScenarioFeatureModel,
  ) {
    return null;
  }
}
