import { CreateSimulationCommand } from '../../application/commands/create-simulation.command';
import { CreateSimulationDto } from '../dto/create-simulation.dto';

export class CreateSimulationRequestMapper {
  static toCommand(dto: CreateSimulationDto): CreateSimulationCommand {
    return {
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      bodies: dto.bodies.map((body) => ({
        name: body.name.trim(),
        mass: body.mass,
        radius: body.radius,
        color: body.color.trim(),
        position: {
          x: body.position.x,
          y: body.position.y,
        },
        velocity: {
          x: body.velocity.x,
          y: body.velocity.y,
        },
      })),
    };
  }
}
