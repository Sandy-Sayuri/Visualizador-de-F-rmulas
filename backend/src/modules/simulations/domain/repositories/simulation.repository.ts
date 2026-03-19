import { Simulation } from '../entities/simulation.entity';

export const SIMULATION_REPOSITORY = Symbol('SIMULATION_REPOSITORY');

export interface SimulationRepository {
  save(simulation: Simulation): Promise<void>;
  findAll(): Promise<Simulation[]>;
  findById(id: string): Promise<Simulation | null>;
  delete(id: string): Promise<void>;
}
