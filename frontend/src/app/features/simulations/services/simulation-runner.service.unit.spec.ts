import { TestBed } from '@angular/core/testing';

import { SimulationRunnerService } from './simulation-runner.service';

describe('SimulationRunnerService', () => {
  let service: SimulationRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SimulationRunnerService],
    });

    service = TestBed.inject(SimulationRunnerService);
  });

  afterEach(() => {
    service.destroy();
  });

  it('loads a simulation and selects the first body', () => {
    service.loadSimulation({
      id: 'sim-1',
      name: 'Test orbit',
      description: 'runtime',
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:00:00.000Z',
      bodies: [
        {
          id: 'body-1',
          name: 'Planet A',
          mass: 20,
          radius: 8,
          color: '#7ce6ff',
          position: { x: 120, y: 0 },
          velocity: { x: 0, y: 12 },
        },
      ],
    });

    expect(service.runtimeBodies()).toHaveSize(1);
    expect(service.selectedBody()?.name).toBe('Planet A');
  });

  it('updates mass, adds bodies and removes the selected body', () => {
    service.loadSimulation({
      id: 'sim-1',
      name: 'Test orbit',
      description: 'runtime',
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:00:00.000Z',
      bodies: [
        {
          id: 'body-1',
          name: 'Planet A',
          mass: 20,
          radius: 8,
          color: '#7ce6ff',
          position: { x: 120, y: 0 },
          velocity: { x: 0, y: 12 },
        },
      ],
    });

    service.updateMass('body-1', 42);
    expect(service.selectedBody()?.mass).toBe(42);

    service.addBody({
      name: 'Planet B',
      mass: 12,
      radius: 6,
      color: '#ff8f70',
      position: { x: -80, y: 0 },
      velocity: { x: 0, y: -10 },
    });

    expect(service.runtimeBodies()).toHaveSize(2);

    const selectedId = service.selectedBody()?.id;
    expect(selectedId).toBeTruthy();

    if (selectedId) {
      service.removeBody(selectedId);
    }

    expect(service.runtimeBodies()).toHaveSize(1);
  });
});
