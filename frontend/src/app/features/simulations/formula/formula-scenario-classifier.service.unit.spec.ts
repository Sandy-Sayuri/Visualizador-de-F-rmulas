import { TestBed } from '@angular/core/testing';

import { FormulaScenarioClassifierService } from './formula-scenario-classifier.service';
import { FormulaScenarioParserService } from './formula-scenario-parser.service';

describe('FormulaScenarioClassifierService', () => {
  let parser: FormulaScenarioParserService;
  let service: FormulaScenarioClassifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaScenarioParserService, FormulaScenarioClassifierService],
    });

    parser = TestBed.inject(FormulaScenarioParserService);
    service = TestBed.inject(FormulaScenarioClassifierService);
  });

  it('classifies formulas into the implemented physics domains', () => {
    const kinematics = service.classify(parser.parseFormula('x = x0 + v*t'));
    const oscillation = service.classify(parser.parseFormula('x = A*cos(w*t)'));
    const wave = service.classify(parser.parseFormula('y = A*sin(k*x - w*t)'));
    const optics = service.classify(parser.parseFormula('optics_reflection = 0'));
    const electromagnetism = service.classify(
      parser.parseFormula('F = k*(q1*q2)/r^2'),
    );
    const gravitation = service.classify(
      parser.parseFormula('F = G * (m1 * m2) / r^2'),
    );
    const plannedDomainFallback = service.classify(parser.parseFormula('P = n*R*T/V'));

    expect(kinematics.classification.domain).toBe('kinematics');
    expect(kinematics.classification.visualStrategy).toBe('particle');
    expect(oscillation.classification.domain).toBe('oscillation');
    expect(oscillation.classification.visualStrategy).toBe('oscillation-pattern');
    expect(wave.classification.domain).toBe('waves');
    expect(wave.classification.solverStrategy).toBe('wave-sampling');
    expect(optics.classification.domain).toBe('optics');
    expect(optics.classification.solverStrategy).toBe('optical-guided');
    expect(electromagnetism.classification.domain).toBe('electromagnetism');
    expect(electromagnetism.classification.solverStrategy).toBe(
      'electromagnetic-interaction',
    );
    expect(gravitation.classification.domain).toBe('gravitation');
    expect(gravitation.classification.solverStrategy).toBe('pair-force-integration');
    expect(plannedDomainFallback.classification.domain).toBe('generic');
  });
});
