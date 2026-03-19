import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { CreateSimulationUseCase } from '../../application/use-cases/create-simulation/create-simulation.use-case';
import { DeleteSimulationUseCase } from '../../application/use-cases/delete-simulation/delete-simulation.use-case';
import { GetSimulationUseCase } from '../../application/use-cases/get-simulation/get-simulation.use-case';
import { ListSimulationsUseCase } from '../../application/use-cases/list-simulations/list-simulations.use-case';
import { CreateSimulationDto } from '../dto/create-simulation.dto';
import { CreateSimulationRequestMapper } from '../mappers/create-simulation-request.mapper';
import {
  SimulationPresenter,
  SimulationResponse,
} from '../presenters/simulation.presenter';

@Controller('simulations')
export class SimulationsController {
  constructor(
    private readonly createSimulationUseCase: CreateSimulationUseCase,
    private readonly listSimulationsUseCase: ListSimulationsUseCase,
    private readonly getSimulationUseCase: GetSimulationUseCase,
    private readonly deleteSimulationUseCase: DeleteSimulationUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateSimulationDto): Promise<SimulationResponse> {
    const command = CreateSimulationRequestMapper.toCommand(body);
    const simulation = await this.createSimulationUseCase.execute(command);

    return SimulationPresenter.toHttp(simulation);
  }

  @Get()
  async findAll(): Promise<SimulationResponse[]> {
    const simulations = await this.listSimulationsUseCase.execute();
    return SimulationPresenter.toHttpCollection(simulations);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<SimulationResponse> {
    const simulation = await this.getSimulationUseCase.execute(id);
    return SimulationPresenter.toHttp(simulation);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteSimulationUseCase.execute(id);
  }
}
