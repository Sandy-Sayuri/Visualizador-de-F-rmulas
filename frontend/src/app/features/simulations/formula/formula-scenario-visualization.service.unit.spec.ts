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
});
