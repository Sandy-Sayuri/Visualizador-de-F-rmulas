import { TestBed } from '@angular/core/testing';

import { FormulaScenarioPersistenceService } from './formula-scenario-persistence.service';

describe('FormulaScenarioPersistenceService', () => {
  let service: FormulaScenarioPersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaScenarioPersistenceService],
    });

    service = TestBed.inject(FormulaScenarioPersistenceService);
  });

  it('serializes a formula draft into a create payload with metadata', () => {
    const payload = service.toCreateSimulationPayload({
      simulationName: 'Formula Demo',
      description: 'Preview de formula',
      config: {
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
      },
    });

    expect(payload.name).toBe('Formula Demo');
    expect(payload.description).toContain('[OrbitLab:FormulaScenario]');
    expect(payload.bodies).toHaveSize(2);
  });
});
