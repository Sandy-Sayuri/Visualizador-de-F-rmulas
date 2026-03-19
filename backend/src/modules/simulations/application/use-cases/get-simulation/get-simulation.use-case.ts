import { Inject, Injectable } from '@nestjs/common';

import { Simulation } from '../../../domain/entities/simulation.entity';
import { SimulationNotFoundError } from '../../../domain/errors/simulation-not-found.error';
import {
  SIMULATION_REPOSITORY,
  SimulationRepository,
} from '../../../domain/repositories/simulation.repository';

@Injectable()
export class GetSimulationUseCase {
  constructor(
    @Inject(SIMULATION_REPOSITORY)
    private readonly simulationRepository: SimulationRepository,
  ) {}

  async execute(id: string): Promise<Simulation> {
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new SimulationNotFoundError(id);
    }

    return simulation;
  }
}
