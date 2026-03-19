import { TestBed } from '@angular/core/testing';

import { FormulaScenarioEvaluatorService } from './formula-scenario-evaluator.service';

describe('FormulaScenarioEvaluatorService', () => {
  let service: FormulaScenarioEvaluatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaScenarioEvaluatorService],
    });

    service = TestBed.inject(FormulaScenarioEvaluatorService);
  });

  it('evaluates mathjs expressions with a runtime scope', () => {
    const compiled = service.compileExpression('v0 * t - (g * t^2) / 2');
    const value = service.evaluateScalar(compiled, {
      v0: 12,
      g: 9.81,
      t: 2,
      pi: Math.PI,
      e: Math.E,
    });

    expect(value).toBeCloseTo(4.38, 2);
  });

  it('throws a friendly error when the expression returns an invalid number', () => {
    const compiled = service.compileExpression('1 / 0');

    expect(() =>
      service.evaluateScalar(compiled, {
        pi: Math.PI,
        e: Math.E,
      }),
    ).toThrowError('A formula retornou um valor invalido.');
  });
});
