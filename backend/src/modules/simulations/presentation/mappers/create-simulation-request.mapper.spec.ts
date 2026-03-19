import { CreateSimulationDto } from '../dto/create-simulation.dto';
import { CreateSimulationRequestMapper } from './create-simulation-request.mapper';

describe('CreateSimulationRequestMapper', () => {
  it('maps DTO data into a trimmed command', () => {
    const dto: CreateSimulationDto = {
      name: '  Solar System  ',
      description: '  Demo simulation  ',
      bodies: [
        {
          name: '  Earth  ',
          mass: 5.97,
          radius: 6371,
          color: '  blue  ',
          position: { x: 0, y: 0 },
          velocity: { x: 1, y: 2 },
        },
      ],
    };

    const command = CreateSimulationRequestMapper.toCommand(dto);

    expect(command).toEqual({
      name: 'Solar System',
      description: 'Demo simulation',
      bodies: [
        {
          name: 'Earth',
          mass: 5.97,
          radius: 6371,
          color: 'blue',
          position: { x: 0, y: 0 },
          velocity: { x: 1, y: 2 },
        },
      ],
    });
  });
});
