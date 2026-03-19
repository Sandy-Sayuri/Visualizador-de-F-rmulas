import { IsNumber } from 'class-validator';

export class Vector2Dto {
  @IsNumber({ allowInfinity: false, allowNaN: false })
  x!: number;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  y!: number;
}
