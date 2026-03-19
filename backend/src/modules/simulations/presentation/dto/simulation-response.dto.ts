import { ApiProperty } from '@nestjs/swagger';

export class Vector2ResponseDto {
  @ApiProperty({
    description: 'Componente horizontal.',
    example: 384400,
  })
  x!: number;

  @ApiProperty({
    description: 'Componente vertical.',
    example: 0,
  })
  y!: number;
}

export class SimulationBodyResponseDto {
  @ApiProperty({
    description: 'Identificador do corpo.',
    example: '31d1626f-bf8f-4ebb-85f6-b831fa717f0f',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do corpo.',
    example: 'Lua',
  })
  name!: string;

  @ApiProperty({
    description: 'Massa do corpo.',
    example: 7.347e22,
  })
  mass!: number;

  @ApiProperty({
    description: 'Raio do corpo.',
    example: 1737,
  })
  radius!: number;

  @ApiProperty({
    description: 'Cor associada ao corpo.',
    example: '#dddddd',
  })
  color!: string;

  @ApiProperty({
    description: 'Posicao atual do corpo.',
    type: () => Vector2ResponseDto,
  })
  position!: Vector2ResponseDto;

  @ApiProperty({
    description: 'Velocidade atual do corpo.',
    type: () => Vector2ResponseDto,
  })
  velocity!: Vector2ResponseDto;
}

export class SimulationResponseDto {
  @ApiProperty({
    description: 'Identificador da simulacao.',
    example: '0c54f53d-b6f0-4df6-84b5-b576aa7bece1',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome da simulacao.',
    example: 'Terra e Lua',
  })
  name!: string;

  @ApiProperty({
    description: 'Descricao da simulacao.',
    example: 'Cena inicial com dois corpos.',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Colecao de corpos associados.',
    type: () => SimulationBodyResponseDto,
    isArray: true,
  })
  bodies!: SimulationBodyResponseDto[];

  @ApiProperty({
    description: 'Data de criacao em ISO 8601.',
    example: '2026-03-19T12:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Data da ultima atualizacao em ISO 8601.',
    example: '2026-03-19T12:00:00.000Z',
  })
  updatedAt!: string;
}
