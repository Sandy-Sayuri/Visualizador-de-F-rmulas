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
    const gravitation = service.classify(
      parser.parseFormula('F = G * (m1 * m2) / r^2'),
    );

    expect(kinematics.classification.domain).toBe('kinematics');
    expect(kinematics.classification.visualStrategy).toBe('particle');
    expect(oscillation.classification.domain).toBe('oscillation');
    expect(oscillation.classification.visualStrategy).toBe('oscillation-pattern');
    expect(gravitation.classification.domain).toBe('gravitation');
    expect(gravitation.classification.solverStrategy).toBe('pair-force-integration');
  });
});
