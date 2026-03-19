import { TestBed } from '@angular/core/testing';

import { FormulaInterpreterService } from './formula-interpreter.service';

describe('FormulaInterpreterService', () => {
  let service: FormulaInterpreterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaInterpreterService],
    });

    service = TestBed.inject(FormulaInterpreterService);
  });

  it('compiles formulas and evaluates acceleration with scope variables', () => {
    const program = service.compileProgram({
      accelerationXFormula: '-0.5 * x - 0.1 * vx',
      accelerationYFormula: 'sin(t)',
    });

    const result = program.evaluate({
      t: Math.PI / 2,
      dt: 0.016,
      x: 10,
      y: 0,
      vx: 2,
      vy: 0,
      mass: 12,
      speed: 2,
      pi: Math.PI,
      e: Math.E,
    });

    expect(result.x).toBeCloseTo(-5.2, 5);
    expect(result.y).toBeCloseTo(1, 5);
  });
});
