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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CreateSimulationUseCase } from '../../application/use-cases/create-simulation/create-simulation.use-case';
import { DeleteSimulationUseCase } from '../../application/use-cases/delete-simulation/delete-simulation.use-case';
import { GetSimulationUseCase } from '../../application/use-cases/get-simulation/get-simulation.use-case';
import { ListSimulationsUseCase } from '../../application/use-cases/list-simulations/list-simulations.use-case';
import { CreateSimulationDto } from '../dto/create-simulation.dto';
import { SimulationResponseDto } from '../dto/simulation-response.dto';
import { CreateSimulationRequestMapper } from '../mappers/create-simulation-request.mapper';
import {
  SimulationPresenter,
  SimulationResponse,
} from '../presenters/simulation.presenter';

@ApiTags('Simulations')
@Controller('simulations')
export class SimulationsController {
  constructor(
    private readonly createSimulationUseCase: CreateSimulationUseCase,
    private readonly listSimulationsUseCase: ListSimulationsUseCase,
    private readonly getSimulationUseCase: GetSimulationUseCase,
    private readonly deleteSimulationUseCase: DeleteSimulationUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova simulacao' })
  @ApiCreatedResponse({
    description: 'Simulacao criada com sucesso.',
    type: SimulationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payload invalido.' })
  async create(@Body() body: CreateSimulationDto): Promise<SimulationResponse> {
    const command = CreateSimulationRequestMapper.toCommand(body);
    const simulation = await this.createSimulationUseCase.execute(command);

    return SimulationPresenter.toHttp(simulation);
  }

  @Get()
  @ApiOperation({ summary: 'Listar simulacoes salvas' })
  @ApiOkResponse({
    description: 'Colecao de simulacoes.',
    type: SimulationResponseDto,
    isArray: true,
  })
  async findAll(): Promise<SimulationResponse[]> {
    const simulations = await this.listSimulationsUseCase.execute();
    return SimulationPresenter.toHttpCollection(simulations);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar simulacao por id' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da simulacao.',
    example: '0c54f53d-b6f0-4df6-84b5-b576aa7bece1',
  })
  @ApiOkResponse({
    description: 'Simulacao encontrada.',
    type: SimulationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Simulacao nao encontrada.' })
  async findById(@Param('id') id: string): Promise<SimulationResponse> {
    const simulation = await this.getSimulationUseCase.execute(id);
    return SimulationPresenter.toHttp(simulation);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover simulacao por id' })
  @ApiParam({
    name: 'id',
    description: 'Identificador da simulacao.',
    example: '0c54f53d-b6f0-4df6-84b5-b576aa7bece1',
  })
  @ApiNoContentResponse({ description: 'Simulacao removida com sucesso.' })
  @ApiNotFoundResponse({ description: 'Simulacao nao encontrada.' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteSimulationUseCase.execute(id);
  }
}
