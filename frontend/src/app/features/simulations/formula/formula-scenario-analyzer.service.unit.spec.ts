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

  it('throws a friendly error for invalid formulas', () => {
    expect(() => service.analyze('x + y')).toThrowError(
      'Use o formato variavel = expressao.',
    );
  });
});
