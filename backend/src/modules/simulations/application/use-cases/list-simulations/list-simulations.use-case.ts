import { Inject, Injectable } from '@nestjs/common';

import { Simulation } from '../../../domain/entities/simulation.entity';
import {
  SIMULATION_REPOSITORY,
  SimulationRepository,
} from '../../../domain/repositories/simulation.repository';

@Injectable()
export class ListSimulationsUseCase {
  constructor(
    @Inject(SIMULATION_REPOSITORY)
    private readonly simulationRepository: SimulationRepository,
  ) {}

  execute(): Promise<Simulation[]> {
    return this.simulationRepository.findAll();
  }
}
