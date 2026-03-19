import { TestBed } from '@angular/core/testing';

import { SimulationPhysicsService } from './simulation-physics.service';

describe('SimulationPhysicsService', () => {
  let service: SimulationPhysicsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SimulationPhysicsService],
    });

    service = TestBed.inject(SimulationPhysicsService);
  });

  it('computes force and energy for interacting bodies', () => {
    const bodies = service.initializeBodies([
      {
        id: 'a',
        name: 'Helios',
        mass: 1200,
        radius: 24,
        color: '#f4c66a',
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
      },
      {
        id: 'b',
        name: 'Orbiter',
        mass: 20,
        radius: 8,
        color: '#7ce6ff',
        position: { x: 150, y: 0 },
        velocity: { x: 0, y: 16 },
      },
    ]);

    expect(Math.abs(bodies[0].force.x)).toBeGreaterThan(0);
    expect(Math.abs(bodies[1].force.x)).toBeGreaterThan(0);
    expect(bodies[1].potentialEnergy).toBeLessThan(0);
  });

  it('advances the simulation and appends trail points', () => {
    const bodies = service.initializeBodies([
      {
        id: 'solo',
        name: 'Probe',
        mass: 10,
        radius: 6,
        color: '#7ce6ff',
        position: { x: 0, y: 0 },
        velocity: { x: 2, y: 0 },
      },
    ]);

    const nextBodies = service.step(bodies, 0.5);

    expect(nextBodies[0].position.x).toBeGreaterThan(0);
    expect(nextBodies[0].trail.length).toBeGreaterThan(1);
  });
});
