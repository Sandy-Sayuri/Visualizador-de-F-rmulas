import { DomainValidationError } from '../errors/domain-validation.error';

export interface Vector2Props {
  x: number;
  y: number;
}

export class Vector2 {
  private constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  static create(props: Vector2Props): Vector2 {
    if (!Number.isFinite(props.x) || !Number.isFinite(props.y)) {
      throw new DomainValidationError('Vector coordinates must be finite numbers.');
    }

    return new Vector2(props.x, props.y);
  }

  toPlain(): Vector2Props {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
