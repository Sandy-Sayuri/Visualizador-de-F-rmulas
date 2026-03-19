import { Inject, Injectable } from '@nestjs/common';

import { SimulationNotFoundError } from '../../../domain/errors/simulation-not-found.error';
import {
  SIMULATION_REPOSITORY,
  SimulationRepository,
} from '../../../domain/repositories/simulation.repository';

@Injectable()
export class DeleteSimulationUseCase {
  constructor(
    @Inject(SIMULATION_REPOSITORY)
    private readonly simulationRepository: SimulationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new SimulationNotFoundError(id);
    }

    await this.simulationRepository.delete(id);
  }
}
