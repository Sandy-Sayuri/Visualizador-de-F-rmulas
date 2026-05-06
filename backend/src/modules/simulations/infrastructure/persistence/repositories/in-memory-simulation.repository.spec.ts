import { Simulation } from '../../../domain/entities/simulation.entity';
import { InMemorySimulationRepository } from './in-memory-simulation.repository';

describe('InMemorySimulationRepository', () => {
  it('returns simulations ordered by most recently updated first', async () => {
    const repository = new InMemorySimulationRepository();
    const olderSimulation = Simulation.create({
      name: 'Older orbit',
      createdAt: new Date('2026-03-19T10:00:00.000Z'),
      updatedAt: new Date('2026-03-19T10:00:00.000Z'),
    });
    const newerSimulation = Simulation.create({
      name: 'Newer orbit',
      createdAt: new Date('2026-03-19T11:00:00.000Z'),
      updatedAt: new Date('2026-03-19T12:30:00.000Z'),
    });

    await repository.save(olderSimulation);
    await repository.save(newerSimulation);

    const simulations = await repository.findAll();

    expect(simulations.map((simulation) => simulation.name)).toEqual([
      'Newer orbit',
      'Older orbit',
    ]);
  });
});
