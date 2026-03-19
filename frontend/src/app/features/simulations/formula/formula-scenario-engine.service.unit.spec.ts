import { TestBed } from '@angular/core/testing';

import { FormulaScenarioEngineService } from './formula-scenario-engine.service';

describe('FormulaScenarioEngineService', () => {
  let service: FormulaScenarioEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaScenarioEngineService],
    });

    service = TestBed.inject(FormulaScenarioEngineService);
  });

  it('evaluates a uniform motion formula into a single moving particle', () => {
    const config = {
      formula: 'x = x0 + v*t',
      parameterValues: {
        x0: -10,
        v: 5,
      },
      primaryLabel: 'Particula',
      secondaryLabel: 'Secundaria',
      primaryColor: '#7ce6ff',
      secondaryColor: '#f4c66a',
      particleRadius: 8,
    };
    const program = service.compileProgram(config);
    const initialState = service.createInitialState(config, program);
    const nextState = service.step(initialState, config, program, 1);

    expect(initialState.bodies).toHaveSize(1);
    expect(nextState.bodies[0].position.x).toBeCloseTo(-5, 2);
  });

  it('supports generic acceleration formulas using state variables', () => {
    const config = {
      formula: 'ax = -k*x/m',
      parameterValues: {
        k: 0.6,
        m: 10,
        x0: 120,
      },
      primaryLabel: 'Particula',
      secondaryLabel: 'Secundaria',
      primaryColor: '#7ce6ff',
      secondaryColor: '#f4c66a',
      particleRadius: 8,
    };
    const program = service.compileProgram(config);
    const initialState = service.createInitialState(config, program);
    const nextState = service.step(initialState, config, program, 0.1);

    expect(initialState.bodies).toHaveSize(1);
    expect(nextState.bodies[0].position.x).not.toBe(initialState.bodies[0].position.x);
    expect(Math.abs(nextState.bodies[0].force.x)).toBeGreaterThan(0);
  });

  it('creates two interacting bodies for gravity formulas', () => {
    const config = {
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
    };
    const program = service.compileProgram(config);
    const initialState = service.createInitialState(config, program);
    const nextState = service.step(initialState, config, program, 0.1);

    expect(initialState.bodies).toHaveSize(2);
    expect(nextState.bodies[0].position.x).not.toBe(initialState.bodies[0].position.x);
    expect(Math.abs(nextState.bodies[0].force.x)).toBeGreaterThan(0);
  });

  it('treats free scalar outputs as a single x-axis motion', () => {
    const config = {
      formula: 's = v*t',
      parameterValues: {
        v: 10,
      },
      primaryLabel: 'Particula',
      secondaryLabel: 'Secundaria',
      primaryColor: '#7ce6ff',
      secondaryColor: '#f4c66a',
      particleRadius: 8,
    };
    const program = service.compileProgram(config);
    const initialState = service.createInitialState(config, program);
    const nextState = service.step(initialState, config, program, 2);

    expect(program.analysis.target).toBe('scalar');
    expect(nextState.bodies[0].position.x).toBeCloseTo(20, 2);
  });
});
