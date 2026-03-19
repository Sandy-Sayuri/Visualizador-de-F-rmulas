import { TestBed } from '@angular/core/testing';

import { FormulaScenarioRunnerService } from './formula-scenario-runner.service';

describe('FormulaScenarioRunnerService', () => {
  let service: FormulaScenarioRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaScenarioRunnerService],
    });

    service = TestBed.inject(FormulaScenarioRunnerService);
  });

  afterEach(() => {
    service.destroy();
  });

  it('loads a gravity formula and exposes a two-body scene', () => {
    service.loadConfig({
      formula: 'F = G * (m1 * m2) / r^2',
      parameterValues: {
        G: 1000,
        m1: 36,
        m2: 12,
      },
      primaryLabel: 'Corpo 1',
      secondaryLabel: 'Corpo 2',
      primaryColor: '#7ce6ff',
      secondaryColor: '#f4c66a',
      particleRadius: 8,
    });

    expect(service.bodies()).toHaveSize(2);
    expect(service.visualScene().decision.mode).toBe('pair-interaction');
    expect(service.visualScene().decision.showVectors).toBeTrue();
    expect(service.errorMessage()).toBeNull();
  });
});
