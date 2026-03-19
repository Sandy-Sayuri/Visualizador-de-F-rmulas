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
    expect(analysis.category).toBe('uniform-motion');
    expect(analysis.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'x0',
      'v',
    ]);
  });

  it('classifies vertical launch and harmonic formulas', () => {
    const vertical = service.analyze('y = v0*t - (g*t^2)/2');
    const harmonic = service.analyze('x = A*cos(w*t)');

    expect(vertical.category).toBe('vertical-launch');
    expect(harmonic.category).toBe('harmonic-oscillation');
  });

  it('detects two-body gravity from a force formula', () => {
    const analysis = service.analyze('F = G * (m1 * m2) / r^2');

    expect(analysis.target).toBe('force');
    expect(analysis.category).toBe('two-body-gravity');
    expect(analysis.parameterDefinitions.map((parameter) => parameter.key)).toEqual([
      'G',
      'm1',
      'm2',
    ]);
  });
});
