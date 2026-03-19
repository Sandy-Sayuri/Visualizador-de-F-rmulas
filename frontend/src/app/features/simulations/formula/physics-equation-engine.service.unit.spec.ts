import { TestBed } from '@angular/core/testing';

import { PhysicsEquationEngineService } from './physics-equation-engine.service';

describe('PhysicsEquationEngineService', () => {
  let service: PhysicsEquationEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PhysicsEquationEngineService],
    });

    service = TestBed.inject(PhysicsEquationEngineService);
  });

  it('combines multiple equations into an executable acceleration formula', () => {
    const resolved = service.resolveFormula('F = m*a\na = g*sin(theta)');

    expect(resolved.equationCount).toBe(2);
    expect(resolved.resolvedFormula.replace(/\s+/g, '')).toBe('ax=g*sin(theta)');
  });

  it('isolates acceleration from a conceptual force equation', () => {
    const resolved = service.resolveFormula('F = m*a');

    expect(resolved.resolvedFormula.replace(/\s+/g, '')).toBe('ax=F/m');
    expect(resolved.resolutionSteps.length).toBeGreaterThan(0);
  });

  it('recognizes dependent variables written as x(t), v(t) and a(t)', () => {
    const resolved = service.resolveFormula(
      'x(t) = x0 + v(t)*t\nv(t) = v0 + a(t)*t\na(t) = g*sin(theta)',
    );
    const compactFormula = resolved.resolvedFormula.replace(/\s+/g, '');

    expect(compactFormula.startsWith('x=')).toBeTrue();
    expect(compactFormula).toContain('x0');
    expect(compactFormula).toContain('v0');
    expect(compactFormula).toContain('g*sin(theta)');
    expect(resolved.dependentVariables).toEqual(['x', 'v', 'a']);
  });
});
