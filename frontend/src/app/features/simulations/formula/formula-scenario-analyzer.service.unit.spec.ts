import { TestBed } from '@angular/core/testing';

import { FormulaScenarioAnalyzerService } from './formula-scenario-analyzer.service';

describe('FormulaScenarioAnalyzerService', () => {
  let service: FormulaScenarioAnalyzerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaScenarioAnalyzerService],
    });

    service = TestBed.inject(FormulaScenarioAnalyzerService);
  });

  it('detects parameters for uniform motion formulas', () => {
    const analysis = service.analyze('x = x0 + v*t');

    expect(analysis.target).toBe('x');
    expect(analysis.evaluationMode).toBe('position');
    expect(analysis.particleStrategy).toBe('single');
    expect(analysis.classification.domain).toBe('kinematics');
    expect(analysis.classification.solverStrategy).toBe('direct-expression');
    expect(analysis.usesTime).toBeTrue();
    expect(analysis.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'x0',
      'v',
    ]);
  });

  it('detects generic velocity and acceleration formulas without exposing state variables', () => {
    const velocity = service.analyze('vx = v0 - g*t');
    const acceleration = service.analyze('ax = -k*x/m');

    expect(velocity.target).toBe('vx');
    expect(velocity.evaluationMode).toBe('velocity');
    expect(velocity.classification.domain).toBe('kinematics');
    expect(velocity.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'v0',
      'g',
    ]);

    expect(acceleration.target).toBe('ax');
    expect(acceleration.evaluationMode).toBe('acceleration');
    expect(acceleration.classification.domain).toBe('oscillation');
    expect(acceleration.usesState).toBeTrue();
    expect(acceleration.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'k',
      'm',
    ]);
  });

  it('accepts delta notation for constant velocity formulas', () => {
    const analysis = service.analyze('v = Δs/Δt');

    expect(analysis.target).toBe('vx');
    expect(analysis.evaluationMode).toBe('velocity');
    expect(analysis.classification.domain).toBe('kinematics');
    expect(analysis.classification.family).toBe('constant-velocity');
    expect(analysis.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'deltaS',
      'deltaT',
    ]);
  });

  it('detects free scalar formulas and pair interactions from force laws', () => {
    const scalar = service.analyze('s = v*t');
    const analysis = service.analyze('F = G * (m1 * m2) / r^2');

    expect(scalar.target).toBe('scalar');
    expect(scalar.evaluationMode).toBe('scalar');
    expect(scalar.classification.domain).toBe('kinematics');
    expect(scalar.parameterDefinitions.map((parameter) => parameter.key)).toEqual(['v']);

    expect(analysis.target).toBe('force');
    expect(analysis.evaluationMode).toBe('force');
    expect(analysis.particleStrategy).toBe('pair');
    expect(analysis.classification.domain).toBe('gravitation');
    expect(analysis.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'G',
      'm1',
      'm2',
    ]);
  });

  it('classifies traveling wave formulas as waves and keeps only real parameters', () => {
    const analysis = service.analyze('y = A*sin(k*x - w*t)');

    expect(analysis.target).toBe('y');
    expect(analysis.classification.domain).toBe('waves');
    expect(analysis.classification.solverStrategy).toBe('wave-sampling');
    expect(analysis.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'A',
      'k',
      'w',
    ]);
  });

  it('extracts guided optical parameters without exposing a free formula surface', () => {
    const analysis = service.analyze('optics_refraction = 0');

    expect(analysis.classification.domain).toBe('optics');
    expect(analysis.classification.family).toBe('refraction');
    expect(analysis.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'angleDeg',
      'n1',
      'n2',
      'sourceX',
      'sourceY',
    ]);
  });

  it('extracts the guided dynamics parameters for the inclined plane scene', () => {
    const analysis = service.analyze('dynamics_incline = 0');

    expect(analysis.classification.domain).toBe('dynamics');
    expect(analysis.classification.family).toBe('inclined-plane');
    expect(analysis.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'mass',
      'angleDeg',
      'g',
    ]);
  });

  it('extracts electromagnetism parameters for Coulomb formulas and guided field presets', () => {
    const coulomb = service.analyze('F = k*(q1*q2)/r^2');
    const field = service.analyze('electro_field = 0');

    expect(coulomb.classification.domain).toBe('electromagnetism');
    expect(coulomb.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'q1',
      'q2',
      'k',
      'x1',
      'y1',
      'x2',
      'y2',
    ]);

    expect(field.classification.family).toBe('field-guided');
    expect(field.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'q1',
      'q2',
      'k',
      'x1',
      'y1',
      'x2',
      'y2',
    ]);
  });

  it('extracts guided thermodynamics parameters as sliders for gas and compression presets', () => {
    const gas = service.analyze('thermo_gas = 0');
    const compression = service.analyze('thermo_compression = 0');

    expect(gas.classification.domain).toBe('thermodynamics');
    expect(gas.classification.family).toBe('gas');
    expect(gas.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'temperature',
      'volume',
      'particleCount',
    ]);
    expect(gas.parameterDefinitions.every((parameter) => parameter.inputMode === 'range')).toBeTrue();

    expect(compression.classification.family).toBe('compression');
    expect(compression.parameterDefinitions.find((parameter) => parameter.key === 'volume')?.label)
      .toBe('Volume alvo');
  });

  it('throws a friendly error for invalid formulas', () => {
    expect(() => service.analyze('x + y')).toThrowError(
      'Use o formato variavel = expressao.',
    );
  });
});
