import { inject, Injectable } from '@angular/core';

import { FormulaSceneVisualizerModel } from '../models/formula-engine.model';
import { FormulaScenarioAnalysisModel } from '../models/formula-scenario.model';
import { ElectromagnetismSceneVisualizerService } from './visualizers/electromagnetism-scene-visualizer.service';
import { InclinedPlaneSceneVisualizerService } from './visualizers/inclined-plane-scene-visualizer.service';
import { OpticalSceneVisualizerService } from './visualizers/optical-scene-visualizer.service';
import { OscillationSceneVisualizerService } from './visualizers/oscillation-scene-visualizer.service';
import { PairInteractionSceneVisualizerService } from './visualizers/pair-interaction-scene-visualizer.service';
import { ParticleSceneVisualizerService } from './visualizers/particle-scene-visualizer.service';
import { ThermodynamicsSceneVisualizerService } from './visualizers/thermodynamics-scene-visualizer.service';
import { TrajectorySceneVisualizerService } from './visualizers/trajectory-scene-visualizer.service';
import { WaveSceneVisualizerService } from './visualizers/wave-scene-visualizer.service';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioRendererRegistryService {
  private readonly visualizers: FormulaSceneVisualizerModel[] = [
    inject(PairInteractionSceneVisualizerService),
    inject(WaveSceneVisualizerService),
    inject(InclinedPlaneSceneVisualizerService),
    inject(OpticalSceneVisualizerService),
    inject(ElectromagnetismSceneVisualizerService),
    inject(ThermodynamicsSceneVisualizerService),
    inject(OscillationSceneVisualizerService),
    inject(TrajectorySceneVisualizerService),
    inject(ParticleSceneVisualizerService),
  ];

  resolve(
    analysis: FormulaScenarioAnalysisModel,
  ): FormulaSceneVisualizerModel | null {
    return this.visualizers.find((candidate) => candidate.supports(analysis)) ?? null;
  }
}
