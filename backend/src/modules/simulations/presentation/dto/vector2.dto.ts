import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Vector2Dto {
  @ApiProperty({
    description: 'Componente horizontal.',
    example: 0,
  })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  x!: number;

  @ApiProperty({
    description: 'Componente vertical.',
    example: 0,
  })
  @IsNumber({ allowInfinity: false, allowNaN: false })
  y!: number;
}
