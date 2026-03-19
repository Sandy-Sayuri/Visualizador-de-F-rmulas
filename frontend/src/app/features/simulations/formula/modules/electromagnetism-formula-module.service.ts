import { Injectable } from '@angular/core';

import { FormulaScenarioFeatureModel, PhysicsDomainDescriptorModel, ParsedFormulaModel } from '../../models/formula-engine.model';
import { BasePhysicsDomainService } from './base-physics-domain.service';

@Injectable({
  providedIn: 'root',
})
export class ElectromagnetismFormulaModuleService extends BasePhysicsDomainService {
  readonly id = 'electromagnetism';
  readonly descriptor: PhysicsDomainDescriptorModel = {
    domain: 'electromagnetism',
    label: 'Eletromagnetismo',
    status: 'planned',
    notes: 'Preparado para lei de Coulomb, campo eletrico e linhas de campo.',
  };

  classify(
    _parsed: ParsedFormulaModel,
    _features: FormulaScenarioFeatureModel,
  ) {
    return null;
  }
}
