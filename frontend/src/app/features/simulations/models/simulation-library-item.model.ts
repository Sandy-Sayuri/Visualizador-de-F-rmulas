import { PhysicsDomainModel } from './formula-engine.model';
import { SimulationModel } from './simulation.model';

export interface SimulationLibraryItemModel {
  simulation: SimulationModel;
  id: string;
  name: string;
  description: string | null;
  source: 'formula' | 'manual';
  sourceLabel: string;
  formula: string | null;
  formulaPreview: string | null;
  domain: PhysicsDomainModel | null;
  domainLabel: string;
  familyLabel: string | null;
  parameterCount: number;
  isGuided: boolean;
  searchText: string;
}
