import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Vector2Dto } from './vector2.dto';

export class CreateBodyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.0000001)
  mass!: number;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.0000001)
  radius!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  color!: string;

  @ValidateNested()
  @Type(() => Vector2Dto)
  position!: Vector2Dto;

  @ValidateNested()
  @Type(() => Vector2Dto)
  velocity!: Vector2Dto;
}
