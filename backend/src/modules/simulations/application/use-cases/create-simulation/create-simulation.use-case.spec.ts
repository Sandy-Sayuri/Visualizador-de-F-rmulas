import { InMemorySimulationRepository } from '../../../infrastructure/persistence/repositories/in-memory-simulation.repository';
import { CreateSimulationUseCase } from './create-simulation.use-case';

describe('CreateSimulationUseCase', () => {
  it('creates and persists a simulation', async () => {
    const repository = new InMemorySimulationRepository();
    const useCase = new CreateSimulationUseCase(repository);

    const simulation = await useCase.execute({
      name: 'Binary Orbit',
      description: 'Two-body test',
      bodies: [
        {
          name: 'Body A',
          mass: 10,
          radius: 5,
          color: 'red',
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 1 },
        },
      ],
    });

    const persisted = await repository.findById(simulation.id);

    expect(simulation.id).toBeDefined();
    expect(persisted?.name).toBe('Binary Orbit');
    expect(persisted?.bodies).toHaveLength(1);
    expect(persisted?.bodies[0]?.name).toBe('Body A');
  });

  it('rejects duplicate body names in the same simulation', async () => {
    const repository = new InMemorySimulationRepository();
    const useCase = new CreateSimulationUseCase(repository);

    await expect(
      useCase.execute({
        name: 'Duplicated bodies',
        description: null,
        bodies: [
          {
            name: 'Earth',
            mass: 10,
            radius: 5,
            color: 'blue',
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 1 },
          },
          {
            name: ' earth ',
            mass: 12,
            radius: 6,
            color: 'green',
            position: { x: 1, y: 1 },
            velocity: { x: 0, y: -1 },
          },
        ],
      }),
    ).rejects.toThrow('Body names must be unique within a simulation.');
  });
});
