import { Body } from '../../../domain/entities/body.entity';
import { Simulation } from '../../../domain/entities/simulation.entity';
import { Vector2 } from '../../../domain/value-objects/vector2.vo';
import { SimulationRecord } from '../models/simulation.record';

export class SimulationPersistenceMapper {
  static toRecord(simulation: Simulation): SimulationRecord {
    const primitives = simulation.toPrimitives();

    return {
      id: primitives.id,
      name: primitives.name,
      description: primitives.description,
      bodies: primitives.bodies.map((body) => ({
        id: body.id,
        name: body.name,
        mass: body.mass,
        radius: body.radius,
        color: body.color,
        position: { ...body.position },
        velocity: { ...body.velocity },
      })),
      createdAt: primitives.createdAt.toISOString(),
      updatedAt: primitives.updatedAt.toISOString(),
    };
  }

  static toDomain(record: SimulationRecord): Simulation {
    const bodies = record.bodies.map((body) =>
      Body.create({
        id: body.id,
        name: body.name,
        mass: body.mass,
        radius: body.radius,
        color: body.color,
        position: Vector2.create(body.position),
        velocity: Vector2.create(body.velocity),
      }),
    );

    return Simulation.create({
      id: record.id,
      name: record.name,
      description: record.description,
      bodies,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
  }
}
