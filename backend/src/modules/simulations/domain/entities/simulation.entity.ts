import { randomUUID } from 'crypto';

import { DomainValidationError } from '../errors/domain-validation.error';
import { Body, BodyPrimitives } from './body.entity';

export interface CreateSimulationProps {
  id?: string;
  name: string;
  description?: string | null;
  bodies?: Body[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SimulationPrimitives {
  id: string;
  name: string;
  description: string | null;
  bodies: BodyPrimitives[];
  createdAt: Date;
  updatedAt: Date;
}

export class Simulation {
  private constructor(
    private readonly idValue: string,
    private readonly nameValue: string,
    private readonly descriptionValue: string | null,
    private readonly bodiesValue: Body[],
    private readonly createdAtValue: Date,
    private readonly updatedAtValue: Date,
  ) {}

  static create(props: CreateSimulationProps): Simulation {
    const normalizedName = props.name.trim();
    const normalizedDescription = props.description?.trim() || null;
    const bodies = props.bodies ?? [];
    const createdAt = props.createdAt ?? new Date();
    const updatedAt = props.updatedAt ?? new Date();

    if (!normalizedName) {
      throw new DomainValidationError('Simulation name is required.');
    }

    if (bodies.length > 0) {
      const uniqueBodyNames = new Set(bodies.map((body) => body.name.toLowerCase()));
      if (uniqueBodyNames.size !== bodies.length) {
        throw new DomainValidationError(
          'Body names must be unique within a simulation.',
        );
      }
    }

    return new Simulation(
      props.id ?? randomUUID(),
      normalizedName,
      normalizedDescription,
      bodies,
      createdAt,
      updatedAt,
    );
  }

  get id(): string {
    return this.idValue;
  }

  get name(): string {
    return this.nameValue;
  }

  get description(): string | null {
    return this.descriptionValue;
  }

  get bodies(): Body[] {
    return [...this.bodiesValue];
  }

  get createdAt(): Date {
    return new Date(this.createdAtValue);
  }

  get updatedAt(): Date {
    return new Date(this.updatedAtValue);
  }

  toPrimitives(): SimulationPrimitives {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      bodies: this.bodies.map((body) => body.toPrimitives()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
