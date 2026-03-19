import { Body } from './body.entity';
import { Vector2 } from '../value-objects/vector2.vo';

describe('Body', () => {
  it('creates a body with normalized values', () => {
    const body = Body.create({
      name: '  Earth  ',
      mass: 5.97,
      radius: 6371,
      color: '  blue  ',
      position: Vector2.create({ x: 0, y: 0 }),
      velocity: Vector2.create({ x: 1, y: -1 }),
    });

    expect(body.id).toBeDefined();
    expect(body.name).toBe('Earth');
    expect(body.color).toBe('blue');
    expect(body.position.toPlain()).toEqual({ x: 0, y: 0 });
    expect(body.velocity.toPlain()).toEqual({ x: 1, y: -1 });
  });

  it('throws when mass is invalid', () => {
    expect(() =>
      Body.create({
        name: 'Earth',
        mass: 0,
        radius: 6371,
        color: 'blue',
        position: Vector2.create({ x: 0, y: 0 }),
        velocity: Vector2.create({ x: 1, y: -1 }),
      }),
    ).toThrow('Body mass must be greater than zero.');
  });
});
