import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Vector2Dto } from './vector2.dto';

export class CreateBodyDto {
  @ApiProperty({
    description: 'Nome do corpo celeste.',
    example: 'Terra',
    maxLength: 80,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiProperty({
    description: 'Massa do corpo.',
    example: 5.972e24,
    minimum: 0.0000001,
  })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.0000001)
  mass!: number;

  @ApiProperty({
    description: 'Raio do corpo.',
    example: 6371,
    minimum: 0.0000001,
  })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.0000001)
  radius!: number;

  @ApiProperty({
    description: 'Cor usada na visualizacao do corpo.',
    example: '#4f83ff',
    maxLength: 40,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  color!: string;

  @ApiProperty({
    description: 'Posicao inicial no plano 2D.',
    type: () => Vector2Dto,
  })
  @ValidateNested()
  @Type(() => Vector2Dto)
  position!: Vector2Dto;

  @ApiProperty({
    description: 'Velocidade inicial no plano 2D.',
    type: () => Vector2Dto,
  })
  @ValidateNested()
  @Type(() => Vector2Dto)
  velocity!: Vector2Dto;
}
