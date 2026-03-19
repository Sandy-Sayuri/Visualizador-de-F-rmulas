import { BodyRecord } from './body.record';

export interface SimulationRecord {
  id: string;
  name: string;
  description: string | null;
  bodies: BodyRecord[];
  createdAt: string;
  updatedAt: string;
}
