import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CreateBodyDto } from './create-body.dto';

export class CreateSimulationDto {
  @ApiProperty({
    description: 'Nome da simulacao.',
    example: 'Terra e Lua',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descricao livre da simulacao.',
    example: 'Cena inicial com dois corpos em orbita.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Corpos celestes pertencentes a simulacao.',
    type: () => CreateBodyDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBodyDto)
  bodies!: CreateBodyDto[];
}
