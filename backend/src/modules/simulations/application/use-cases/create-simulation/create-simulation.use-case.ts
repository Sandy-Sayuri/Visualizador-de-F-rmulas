import { Inject, Injectable } from '@nestjs/common';

import { Body } from '../../../domain/entities/body.entity';
import { Simulation } from '../../../domain/entities/simulation.entity';
import {
  SIMULATION_REPOSITORY,
  SimulationRepository,
} from '../../../domain/repositories/simulation.repository';
import { Vector2 } from '../../../domain/value-objects/vector2.vo';
import { CreateSimulationCommand } from '../../commands/create-simulation.command';

@Injectable()
export class CreateSimulationUseCase {
  constructor(
    @Inject(SIMULATION_REPOSITORY)
    private readonly simulationRepository: SimulationRepository,
  ) {}

  async execute(command: CreateSimulationCommand): Promise<Simulation> {
    const bodies = command.bodies.map((body) =>
      Body.create({
        name: body.name,
        mass: body.mass,
        radius: body.radius,
        color: body.color,
        position: Vector2.create(body.position),
        velocity: Vector2.create(body.velocity),
      }),
    );

    const simulation = Simulation.create({
      name: command.name,
      description: command.description,
      bodies,
    });

    await this.simulationRepository.save(simulation);

    return simulation;
  }
}
