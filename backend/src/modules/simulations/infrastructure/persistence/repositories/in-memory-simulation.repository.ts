import { Injectable } from '@nestjs/common';

import { Simulation } from '../../../domain/entities/simulation.entity';
import { SimulationRepository } from '../../../domain/repositories/simulation.repository';
import { SimulationPersistenceMapper } from '../mappers/simulation-persistence.mapper';
import { SimulationRecord } from '../models/simulation.record';

@Injectable()
export class InMemorySimulationRepository implements SimulationRepository {
  private readonly simulations = new Map<string, SimulationRecord>();

  async save(simulation: Simulation): Promise<void> {
    const record = SimulationPersistenceMapper.toRecord(simulation);
    this.simulations.set(record.id, record);
  }

  async findAll(): Promise<Simulation[]> {
    return Array.from(this.simulations.values()).map((record) =>
      SimulationPersistenceMapper.toDomain(record),
    );
  }

  async findById(id: string): Promise<Simulation | null> {
    const record = this.simulations.get(id);
    return record ? SimulationPersistenceMapper.toDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    this.simulations.delete(id);
  }
}
