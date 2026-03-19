import { inject, Injectable } from '@angular/core';

import { FormulaSceneVisualizerModel } from '../models/formula-engine.model';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioStateModel,
  FormulaScenarioVisualSceneModel,
} from '../models/formula-scenario.model';
import { PairInteractionSceneVisualizerService } from './visualizers/pair-interaction-scene-visualizer.service';
import { OscillationSceneVisualizerService } from './visualizers/oscillation-scene-visualizer.service';
import { ParticleSceneVisualizerService } from './visualizers/particle-scene-visualizer.service';
import { TrajectorySceneVisualizerService } from './visualizers/trajectory-scene-visualizer.service';
import { WaveSceneVisualizerService } from './visualizers/wave-scene-visualizer.service';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioVisualizationService {
  private readonly visualizers: FormulaSceneVisualizerModel[] = [
    inject(PairInteractionSceneVisualizerService),
    inject(WaveSceneVisualizerService),
    inject(OscillationSceneVisualizerService),
    inject(TrajectorySceneVisualizerService),
    inject(ParticleSceneVisualizerService),
  ];

  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel {
    const visualizer = this.visualizers.find((candidate) =>
      candidate.supports(analysis),
    );

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
