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

  it('samples a traveling wave into multiple bodies across the field', () => {
    const config = {
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
    };
    const program = service.compileProgram(config);
    const initialState = service.createInitialState(config, program);
    const nextState = service.step(initialState, config, program, 0.2);

    expect(program.analysis.classification.domain).toBe('waves');
    expect(initialState.bodies.length).toBeGreaterThan(10);
    expect(
      nextState.bodies.some(
        (body, index) =>
          Math.abs(body.position.y - initialState.bodies[index].position.y) > 0.1,
      ),
    ).toBeTrue();
  });

  it('builds a guided optics reflection scene with animated ray bodies', () => {
    const config = {
      formula: 'optics_reflection = 0',
      parameterValues: {
        angleDeg: 34,
        sourceX: -210,
        sourceY: 170,
      },
      primaryLabel: 'Fonte',
      secondaryLabel: 'Espelho',
      primaryColor: '#ffd166',
      secondaryColor: '#7ce6ff',
      particleRadius: 8,
    };
    const program = service.compileProgram(config);
    const initialState = service.createInitialState(config, program);
    const nextState = service.step(initialState, config, program, 0.3);

    expect(program.analysis.classification.domain).toBe('optics');
    expect(initialState.bodies.length).toBeGreaterThanOrEqual(2);
    expect(initialState.sceneData?.optical?.scenario).toBe('reflection');
    expect(nextState.bodies[0].position.x).not.toBe(initialState.bodies[0].position.x);
  });

  it('simulates Coulomb interaction as an electromagnetism pair scene', () => {
    const config = {
      formula: 'F = k*(q1*q2)/r^2',
      parameterValues: {
        k: 42000,
        q1: 1.6,
        q2: -1.2,
        x1: -140,
        y1: 0,
        x2: 140,
        y2: 0,
      },
      primaryLabel: 'Carga 1',
      secondaryLabel: 'Carga 2',
      primaryColor: '#ffb36c',
      secondaryColor: '#7ce6ff',
      particleRadius: 8,
    };
    const program = service.compileProgram(config);
    const initialState = service.createInitialState(config, program);
    const nextState = service.step(initialState, config, program, 0.2);

    expect(program.analysis.classification.domain).toBe('electromagnetism');
    expect(initialState.bodies).toHaveSize(2);
    expect(initialState.sceneData?.electromagnetism?.scenario).toBe('coulomb');
    expect(nextState.bodies[0].position.x).toBeGreaterThan(initialState.bodies[0].position.x);
    expect(nextState.bodies[1].position.x).toBeLessThan(initialState.bodies[1].position.x);
  });
});
