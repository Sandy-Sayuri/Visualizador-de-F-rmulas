import { Injectable } from '@angular/core';

import { CreateSimulationPayload } from '../models/create-simulation.model';
import { FormulaSimulationConfigModel } from '../models/formula-simulation-config.model';
import { SimulationModel } from '../models/simulation.model';

interface SerializedFormulaMetadata {
  version: 1;
  config: FormulaSimulationConfigModel;
}

const FORMULA_MARKER = '[OrbitLab:Formula]';

@Injectable({
  providedIn: 'root',
})
export class FormulaMetadataService {
  extractConfig(description: string | null): {
    cleanDescription: string | null;
    config: FormulaSimulationConfigModel | null;
  } {
    if (!description || !description.includes(FORMULA_MARKER)) {
      return {
        cleanDescription: description,
        config: null,
      };
    }

    const [plainDescription, metadataChunk] = description.split(FORMULA_MARKER);

    try {
      const metadata = JSON.parse(metadataChunk.trim()) as SerializedFormulaMetadata;

      return {
        cleanDescription: plainDescription.trim() || null,
        config: metadata.config,
      };
    } catch {
      return {
        cleanDescription: description,
        config: null,
      };
    }
  }

  embedConfig(
    description: string | null,
    config: FormulaSimulationConfigModel,
  ): string {
    const cleanDescription = this.extractConfig(description).cleanDescription;
    const metadata: SerializedFormulaMetadata = {
      version: 1,
      config,
    };
    const baseDescription = cleanDescription?.trim() || 'Simulacao gerada no Formula Lab.';

    return `${baseDescription}\n\n${FORMULA_MARKER} ${JSON.stringify(metadata)}`;
  }

  createDefaultConfig(simulation: SimulationModel): FormulaSimulationConfigModel {
    const firstBody = simulation.bodies[0];

    if (firstBody) {
      return {
        objectName: `${firstBody.name} Formula`,
        color: firstBody.color,
        mass: firstBody.mass,
        radius: firstBody.radius,
        initialPosition: { ...firstBody.position },
        initialVelocity: { ...firstBody.velocity },
        accelerationXFormula: '-0.08 * x - 0.12 * vx',
        accelerationYFormula: '-0.08 * y - 0.12 * vy',
      };
    }

    return {
      objectName: `${simulation.name} Probe`,
      color: '#7ce6ff',
      mass: 12,
      radius: 8,
      initialPosition: { x: 140, y: 0 },
      initialVelocity: { x: 0, y: 18 },
      accelerationXFormula: '-0.08 * x - 0.12 * vx',
      accelerationYFormula: '-0.08 * y - 0.12 * vy',
    };
  }

  toCreateSimulationPayload(
    sourceSimulation: SimulationModel,
    config: FormulaSimulationConfigModel,
  ): CreateSimulationPayload {
    const { cleanDescription } = this.extractConfig(sourceSimulation.description);

    return {
      name: `${sourceSimulation.name} | Formula ${config.objectName}`,
      description: this.embedConfig(cleanDescription, config),
      bodies: [
        {
          name: config.objectName,
          mass: config.mass,
          radius: config.radius,
          color: config.color,
          position: { ...config.initialPosition },
          velocity: { ...config.initialVelocity },
        },
      ],
    };
  }
}
