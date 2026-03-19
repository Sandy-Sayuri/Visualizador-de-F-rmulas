import { TestBed } from '@angular/core/testing';

import { FormulaScenarioAnalyzerService } from './formula-scenario-analyzer.service';
import { FormulaScenarioEngineService } from './formula-scenario-engine.service';
import { FormulaScenarioVisualizationService } from './formula-scenario-visualization.service';

describe('FormulaScenarioVisualizationService', () => {
  let analyzer: FormulaScenarioAnalyzerService;
  let engine: FormulaScenarioEngineService;
  let service: FormulaScenarioVisualizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FormulaScenarioAnalyzerService,
        FormulaScenarioEngineService,
        FormulaScenarioVisualizationService,
      ],
    });

    analyzer = TestBed.inject(FormulaScenarioAnalyzerService);
    engine = TestBed.inject(FormulaScenarioEngineService);
    service = TestBed.inject(FormulaScenarioVisualizationService);
  });

  it('builds a dedicated wave scene from a traveling wave formula', () => {
    const config = {
      formula: 'y = A*sin(k*x - w*t)',
      parameterValues: {
        A: 60,
        k: 0.03,
        w: 1.4,
      },
      primaryLabel: 'Frente de onda',
      secondaryLabel: 'Eixo',
      primaryColor: '#7ce6ff',
      secondaryColor: '#f4c66a',
      particleRadius: 8,
    };
    const analysis = analyzer.analyze(config.formula);
    const program = engine.compileProgram(config, analysis);
    const state = engine.createInitialState(config, program);
    const scene = service.buildScene(analysis, state);

    expect(scene.decision.mode).toBe('wave-field');
    expect(scene.decision.showPatterns).toBeTrue();
    expect(scene.decorations.some((decoration) => decoration.kind === 'path')).toBeTrue();
    expect(scene.legendItems.some((item) => item.label === 'Onda')).toBeTrue();
  });

  it('builds optical ray decorations for guided optics scenarios', () => {
    const config = {
      formula: 'optics_reflection = 0',
      parameterValues: {
        angleDeg: 34,
        sourceX: -210,
        sourceY: 170,
      },
      primaryLabel: 'Fonte',
      secondaryLabel: 'Espelho',
      primaryColor: '#ffd166',
      secondaryColor: '#7ce6ff',
      particleRadius: 8,
    };
    const analysis = analyzer.analyze(config.formula);
    const program = engine.compileProgram(config, analysis);
    const state = engine.createInitialState(config, program);
    const scene = service.buildScene(analysis, state);

    expect(scene.decision.mode).toBe('optical-rays');
    expect(scene.decorations.some((decoration) => decoration.kind === 'line')).toBeTrue();
    expect(scene.decorations.some((decoration) => decoration.kind === 'arc')).toBeTrue();
    expect(scene.legendItems.some((item) => item.tone === 'ray')).toBeTrue();
  });

  it('builds field lines and arrows for electromagnetism scenes', () => {
    const config = {
      formula: 'F = k*(q1*q2)/r^2',
      parameterValues: {
        k: 42000,
        q1: 1.6,
        q2: -1.2,
        x1: -140,
        y1: 0,
        x2: 140,
        y2: 0,
      },
      primaryLabel: 'Carga 1',
      secondaryLabel: 'Carga 2',
      primaryColor: '#ffb36c',
      secondaryColor: '#7ce6ff',
      particleRadius: 8,
    };
    const analysis = analyzer.analyze(config.formula);
    const program = engine.compileProgram(config, analysis);
    const state = engine.createInitialState(config, program);
    const scene = service.buildScene(analysis, state);

    expect(scene.decision.mode).toBe('electric-field');
    expect(scene.decorations.some((decoration) => decoration.kind === 'path')).toBeTrue();
    expect(scene.decorations.some((decoration) => decoration.kind === 'arrow')).toBeTrue();
    expect(scene.legendItems.some((item) => item.tone === 'field')).toBeTrue();
  });
});
