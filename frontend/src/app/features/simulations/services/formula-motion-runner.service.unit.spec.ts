import { TestBed } from '@angular/core/testing';

import { FormulaMotionRunnerService } from './formula-motion-runner.service';

describe('FormulaMotionRunnerService', () => {
  let service: FormulaMotionRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaMotionRunnerService],
    });

    service = TestBed.inject(FormulaMotionRunnerService);
  });

  afterEach(() => {
    service.destroy();
  });

  it('loads a formula config and exposes a runtime body for canvas rendering', () => {
    service.loadConfig({
      objectName: 'Probe',
      color: '#7ce6ff',
      mass: 10,
      radius: 6,
      initialPosition: { x: 30, y: 0 },
      initialVelocity: { x: 0, y: 4 },
      accelerationXFormula: '-0.2 * x',
      accelerationYFormula: '0',
    });

    expect(service.config()?.objectName).toBe('Probe');
    expect(service.bodies()).toHaveSize(1);
    expect(service.selectedBody()?.force.x).toBeLessThan(0);
    expect(service.visualScene().legendItems.map((item) => item.key)).toContain('anchor');
    expect(service.errorMessage()).toBeNull();
  });

  it('expands the preview into a comparison scene when the formula uses mass', () => {
    service.loadConfig({
      objectName: 'Mass Probe',
      color: '#7ce6ff',
      mass: 10,
      radius: 6,
      initialPosition: { x: 30, y: 0 },
      initialVelocity: { x: 0, y: 4 },
      accelerationXFormula: '-0.05 * x / mass',
      accelerationYFormula: '0',
    });

    expect(service.visualScene().decision.mode).toBe('mass-comparison');
    expect(service.bodies()).toHaveSize(3);
  });
});
