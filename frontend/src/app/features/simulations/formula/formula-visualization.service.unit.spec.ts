import { TestBed } from '@angular/core/testing';

import { FormulaInterpreterService } from './formula-interpreter.service';
import { FormulaMotionService } from './formula-motion.service';
import { FormulaVisualizationService } from './formula-visualization.service';

describe('FormulaVisualizationService', () => {
  let interpreter: FormulaInterpreterService;
  let motion: FormulaMotionService;
  let service: FormulaVisualizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FormulaInterpreterService,
        FormulaMotionService,
        FormulaVisualizationService,
      ],
    });

    interpreter = TestBed.inject(FormulaInterpreterService);
    motion = TestBed.inject(FormulaMotionService);
    service = TestBed.inject(FormulaVisualizationService);
  });

  it('keeps a simple position formula visually simple', () => {
    const config = {
      objectName: 'Anchor Probe',
      color: '#7ce6ff',
      mass: 10,
      radius: 6,
      initialPosition: { x: 60, y: 0 },
      initialVelocity: { x: 0, y: 0 },
      accelerationXFormula: '-0.2 * x',
      accelerationYFormula: '0',
    };
    const program = interpreter.compileProgram(config);
    const state = motion.createInitialState(config, program);

    const scene = service.buildScene(config, state, program);

    expect(scene.decision.mode).toBe('single-particle');
    expect(scene.bodies).toHaveSize(1);
    expect(scene.decision.showVectors).toBeFalse();
    expect(scene.decision.showTrails).toBeFalse();
    expect(scene.legendItems.map((item) => item.key)).toContain('anchor');
    expect(scene.legendItems.map((item) => item.key)).not.toContain('pulse');
    expect(scene.legendItems.map((item) => item.key)).not.toContain('prediction');
    expect(scene.decorations.some((decoration) => decoration.kind === 'ring')).toBeTrue();
  });

  it('creates a comparison scene when the formula depends on mass', () => {
    const config = {
      objectName: 'Mass Probe',
      color: '#7ce6ff',
      mass: 10,
      radius: 6,
      initialPosition: { x: 30, y: 0 },
      initialVelocity: { x: 0, y: 4 },
      accelerationXFormula: '-0.05 * x / mass',
      accelerationYFormula: '0',
    };
    const program = interpreter.compileProgram(config);
    const state = motion.createInitialState(config, program);

    const scene = service.buildScene(config, state, program);

    expect(scene.decision.mode).toBe('mass-comparison');
    expect(scene.bodies).toHaveSize(3);
    expect(scene.legendItems.map((item) => item.key)).toContain('comparison');
    expect(scene.decision.showVectors).toBeTrue();
    expect(scene.decision.showTrails).toBeTrue();
  });

  it('creates multiple bodies for radial interaction formulas', () => {
    const config = {
      objectName: 'Gravity Probe',
      color: '#7ce6ff',
      mass: 10,
      radius: 6,
      initialPosition: { x: 120, y: 40 },
      initialVelocity: { x: -4, y: 12 },
      accelerationXFormula: '-180 * x / ((x^2 + y^2) ^ 1.5)',
      accelerationYFormula: '-180 * y / ((x^2 + y^2) ^ 1.5)',
    };
    const program = interpreter.compileProgram(config);
    const state = motion.createInitialState(config, program);

    const scene = service.buildScene(config, state, program);
    const keys = scene.legendItems.map((item) => item.key);

    expect(scene.decision.mode).toBe('interaction-field');
    expect(scene.bodies.length).toBeGreaterThan(2);
    expect(keys).toContain('interaction');
    expect(keys).toContain('prediction');
    expect(scene.bodies.some((body) => body.id === 'formula-source')).toBeTrue();
  });

  it('adds richer pattern guides for time-based and coupled formulas', () => {
    const config = {
      objectName: 'Wave Probe',
      color: '#ff8f70',
      mass: 10,
      radius: 6,
      initialPosition: { x: 30, y: 20 },
      initialVelocity: { x: 5, y: 0 },
      accelerationXFormula: '-0.2 * x - 0.05 * vx + 0.02 * y',
      accelerationYFormula: '0.2 * sin(t) - 0.04 * vy',
    };
    const program = interpreter.compileProgram(config);
    const state = motion.createInitialState(config, program);

    const scene = service.buildScene(config, state, program);
    const keys = scene.legendItems.map((item) => item.key);

    expect(scene.decision.mode).toBe('pattern');
    expect(scene.bodies).toHaveSize(1);
    expect(keys).toContain('anchor');
    expect(keys).toContain('wake');
    expect(keys).toContain('pulse');
    expect(keys).toContain('prediction');
    expect(keys).toContain('pattern');
    expect(scene.decorations.some((decoration) => decoration.kind === 'path')).toBeTrue();
  });
});
