import { Simulation } from '../../domain/entities/simulation.entity';

export interface SimulationResponse {
  id: string;
  name: string;
  description: string | null;
  bodies: Array<{
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
  }>;
  createdAt: string;
  updatedAt: string;
}

export class SimulationPresenter {
  static toHttp(simulation: Simulation): SimulationResponse {
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

  static toHttpCollection(simulations: Simulation[]): SimulationResponse[] {
    return simulations.map((simulation) => this.toHttp(simulation));
  }
}
