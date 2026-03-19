import { BodyModel } from './body.model';

export interface SimulationModel {
  id: string;
  name: string;
  description: string | null;
  bodies: BodyModel[];
  createdAt: string;
  updatedAt: string;
}
