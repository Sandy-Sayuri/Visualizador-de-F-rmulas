import { Module } from '@nestjs/common';

import { CreateSimulationUseCase } from './application/use-cases/create-simulation/create-simulation.use-case';
import { DeleteSimulationUseCase } from './application/use-cases/delete-simulation/delete-simulation.use-case';
import { GetSimulationUseCase } from './application/use-cases/get-simulation/get-simulation.use-case';
import { ListSimulationsUseCase } from './application/use-cases/list-simulations/list-simulations.use-case';
import { SIMULATION_REPOSITORY } from './domain/repositories/simulation.repository';
import { InMemorySimulationRepository } from './infrastructure/persistence/repositories/in-memory-simulation.repository';
import { SimulationsController } from './presentation/controllers/simulations.controller';

@Module({
  controllers: [SimulationsController],
  providers: [
    CreateSimulationUseCase,
    ListSimulationsUseCase,
    GetSimulationUseCase,
    DeleteSimulationUseCase,
    InMemorySimulationRepository,
    {
      provide: SIMULATION_REPOSITORY,
      useExisting: InMemorySimulationRepository,
    },
  ],
})
export class SimulationsModule {}
