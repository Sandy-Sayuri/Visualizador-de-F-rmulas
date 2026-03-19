import { Injectable } from '@angular/core';

import { FormulaScenarioConfigModel } from '../models/formula-scenario.model';

interface SerializedFormulaScenarioMetadata {
  version: 1;
  config: FormulaScenarioConfigModel;
}

const FORMULA_SCENARIO_MARKER = '[OrbitLab:FormulaScenario]';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioMetadataService {
  extractConfig(description: string | null): {
    cleanDescription: string | null;
    config: FormulaScenarioConfigModel | null;
  } {
    if (!description || !description.includes(FORMULA_SCENARIO_MARKER)) {
      return {
        cleanDescription: description,
        config: null,
      };
    }

    const [plainDescription, metadataChunk] = description.split(FORMULA_SCENARIO_MARKER);

    try {
      const metadata = JSON.parse(metadataChunk.trim()) as SerializedFormulaScenarioMetadata;

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
    config: FormulaScenarioConfigModel,
  ): string {
    const cleanDescription = this.extractConfig(description).cleanDescription;
    const metadata: SerializedFormulaScenarioMetadata = {
      version: 1,
      config,
    };
    const baseDescription = cleanDescription?.trim() || 'Simulacao gerada por formula.';

    return `${baseDescription}\n\n${FORMULA_SCENARIO_MARKER} ${JSON.stringify(metadata)}`;
  }
}
