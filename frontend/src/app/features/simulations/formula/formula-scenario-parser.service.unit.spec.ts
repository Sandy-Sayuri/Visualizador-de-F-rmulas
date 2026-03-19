import { TestBed } from '@angular/core/testing';

import { FormulaScenarioParserService } from './formula-scenario-parser.service';

describe('FormulaScenarioParserService', () => {
  let service: FormulaScenarioParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaScenarioParserService],
    });

    service = TestBed.inject(FormulaScenarioParserService);
  });

  it('extracts target, symbols and functions from a free formula', () => {
    const parsed = service.parseFormula('x(t) = A*cos(w*t)');

    expect(parsed.targetInfo.target).toBe('x');
    expect(parsed.targetInfo.evaluationMode).toBe('position');
    expect(parsed.symbols).toEqual(['A', 'w', 't']);
    expect(parsed.functionNames).toEqual(['cos']);
    expect(parsed.expression.replace(/\s+/g, '')).toBe('A*cos(w*t)');
    expect(parsed.dependentVariables).toEqual(['x']);
  });

  it('normalizes delta notation and accepts v as a velocity target', () => {
    const parsed = service.parseFormula('v = Δs/Δt');

    expect(parsed.targetInfo.target).toBe('vx');
    expect(parsed.targetInfo.evaluationMode).toBe('velocity');
    expect(parsed.normalizedFormula).toBe('v = deltaS/deltaT');
    expect(parsed.expression.replace(/\s+/g, '')).toBe('deltaS/deltaT');
    expect(parsed.symbols).toEqual(['deltaS', 'deltaT']);
  });

  it('parses multiple equations and resolves them to a simulable target', () => {
    const parsed = service.parseFormula('F = m*a\na = g*sin(theta)');

    expect(parsed.targetInfo.target).toBe('ax');
    expect(parsed.targetInfo.evaluationMode).toBe('acceleration');
    expect(parsed.equationCount).toBe(2);
    expect(parsed.resolvedFormula.replace(/\s+/g, '')).toBe('ax=g*sin(theta)');
    expect(parsed.symbols).toEqual(['g', 'theta']);
  });

  it('throws a friendly error for malformed formulas', () => {
    expect(() => service.parseFormula('x + y')).toThrowError(
      'Use o formato variavel = expressao.',
    );
  });
});
