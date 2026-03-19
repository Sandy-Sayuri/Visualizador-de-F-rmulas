import { inject, Injectable } from '@angular/core';

import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../models/formula-scenario.model';
import { FormulaScenarioRendererRegistryService } from './formula-scenario-renderer-registry.service';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioVisualizationService {
  private readonly rendererRegistry = inject(FormulaScenarioRendererRegistryService);

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const visualizer = this.rendererRegistry.resolve(analysis);

    if (!visualizer) {
      return {
        bodies: state.bodies,
        decorations: [],
        legendItems: [],
        decision: {
          mode: 'single-particle',
          particleCount: state.bodies.length,
          showVectors: false,
          showTrails: false,
          showPatterns: false,
        },
      };
    }

    return visualizer.buildScene(analysis, state);
  }
}
