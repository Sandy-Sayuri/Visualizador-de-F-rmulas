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

  it('loads a free acceleration formula and exposes a single dynamic scene', () => {
    service.loadConfig({
      formula: 'ax = -k*x/m',
      parameterValues: {
        k: 0.4,
        m: 10,
        x0: 100,
      },
      primaryLabel: 'Particula',
      secondaryLabel: 'Corpo 2',
      primaryColor: '#7ce6ff',
      secondaryColor: '#f4c66a',
      particleRadius: 8,
    });

    expect(service.bodies()).toHaveSize(1);
    expect(service.visualScene().decision.mode).toBe('oscillation');
    expect(service.errorMessage()).toBeNull();
  });

  it('allows changing the simulation speed safely', () => {
    service.setTimeScale(4);
    expect(service.timeScale()).toBe(4);

    service.setTimeScale(20);
    expect(service.timeScale()).toBe(8);

    service.setTimeScale(0.1);
    expect(service.timeScale()).toBe(0.25);
  });

  it('loads a wave formula and exposes a wave scene', () => {
    service.loadConfig({
      formula: 'y = A*sin(k*x - w*t)',
      parameterValues: {
        A: 60,
        k: 0.03,
        w: 1.4,
      },
      primaryLabel: 'Frente de onda',
      secondaryLabel: 'Eixo',
      primaryColor: '#7ce6ff',
      secondaryColor: '#f4c66a',
      particleRadius: 8,
    });

    expect(service.bodies().length).toBeGreaterThan(10);
    expect(service.visualScene().decision.mode).toBe('wave-field');
    expect(service.visualScene().decision.showPatterns).toBeTrue();
    expect(service.errorMessage()).toBeNull();
  });
});
