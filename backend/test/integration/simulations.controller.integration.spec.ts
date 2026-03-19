import { Test, TestingModule } from '@nestjs/testing';

import { SimulationsController } from '../../src/modules/simulations/presentation/controllers/simulations.controller';
import { CreateSimulationDto } from '../../src/modules/simulations/presentation/dto/create-simulation.dto';
import { SimulationsModule } from '../../src/modules/simulations/simulations.module';

describe('SimulationsController integration', () => {
  let moduleRef: TestingModule;
  let controller: SimulationsController;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [SimulationsModule],
    }).compile();

    controller = moduleRef.get(SimulationsController);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('creates, lists, gets and deletes simulations through the module stack', async () => {
    const payload: CreateSimulationDto = {
      name: 'Orbital demo',
      description: 'Module integration',
      bodies: [
        {
          name: 'Planet',
          mass: 50,
          radius: 10,
          color: 'cyan',
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 2 },
        },
      ],
    };

    const created = await controller.create(payload);
    const all = await controller.findAll();
    const found = await controller.findById(created.id);

    expect(created.id).toBeDefined();
    expect(all).toHaveLength(1);
    expect(found.name).toBe('Orbital demo');

    await controller.delete(created.id);

    const afterDelete = await controller.findAll();
    expect(afterDelete).toHaveLength(0);
  });
});
