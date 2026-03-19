import { randomUUID } from 'crypto';

import { DomainValidationError } from '../errors/domain-validation.error';
import { Vector2 } from '../value-objects/vector2.vo';

export interface CreateBodyProps {
  id?: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
  position: Vector2;
  velocity: Vector2;
}

export interface BodyPrimitives {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
  position: {
    x: number;
    y: number;
  };
  velocity: {
    x: number;
    y: number;
  };
}

export class Body {
  private constructor(
    private readonly idValue: string,
    private readonly nameValue: string,
    private readonly massValue: number,
    private readonly radiusValue: number,
    private readonly colorValue: string,
    private readonly positionValue: Vector2,
    private readonly velocityValue: Vector2,
  ) {}

  static create(props: CreateBodyProps): Body {
    const normalizedName = props.name.trim();
    const normalizedColor = props.color.trim();

    if (!normalizedName) {
      throw new DomainValidationError('Body name is required.');
    }

    if (props.mass <= 0) {
      throw new DomainValidationError('Body mass must be greater than zero.');
    }

    if (props.radius <= 0) {
      throw new DomainValidationError('Body radius must be greater than zero.');
    }

    if (!normalizedColor) {
      throw new DomainValidationError('Body color is required.');
    }

    return new Body(
      props.id ?? randomUUID(),
      normalizedName,
      props.mass,
      props.radius,
      normalizedColor,
      props.position,
      props.velocity,
    );
  }

  get id(): string {
    return this.idValue;
  }

  get name(): string {
    return this.nameValue;
  }

  get mass(): number {
    return this.massValue;
  }

  get radius(): number {
    return this.radiusValue;
  }

  get color(): string {
    return this.colorValue;
  }

  get position(): Vector2 {
    return this.positionValue;
  }

  get velocity(): Vector2 {
    return this.velocityValue;
  }

  toPrimitives(): BodyPrimitives {
    return {
      id: this.id,
      name: this.name,
      mass: this.mass,
      radius: this.radius,
      color: this.color,
      position: this.position.toPlain(),
      velocity: this.velocity.toPlain(),
    };
  }
}
