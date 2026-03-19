import { Injectable, inject } from '@angular/core';

import { CreateSimulationPayload } from '../models/create-simulation.model';
import { FormulaScenarioDraftModel } from '../models/formula-scenario.model';
import { SimulationModel } from '../models/simulation.model';
import { FormulaScenarioEngineService } from './formula-scenario-engine.service';
import { FormulaScenarioMetadataService } from './formula-scenario-metadata.service';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioPersistenceService {
  private readonly engine = inject(FormulaScenarioEngineService);
  private readonly metadata = inject(FormulaScenarioMetadataService);

  toDraft(simulation: SimulationModel): FormulaScenarioDraftModel | null {
    const extracted = this.metadata.extractConfig(simulation.description);

    if (!extracted.config) {
      return null;
    }

    return {
      simulationName: simulation.name,
      description: extracted.cleanDescription,
      config: extracted.config,
    };
  }

  toCreateSimulationPayload(draft: FormulaScenarioDraftModel): CreateSimulationPayload {
    const program = this.engine.compileProgram(draft.config);
    const initialState = this.engine.createInitialState(draft.config, program);

    return {
      name: draft.simulationName.trim(),
      description: this.metadata.embedConfig(draft.description, draft.config),
      bodies: initialState.bodies.map((body) => ({
        name: body.name,
        mass: body.mass,
        radius: body.radius,
        color: body.color,
        position: { ...body.position },
        velocity: { ...body.velocity },
      })),
    };
  }
}
