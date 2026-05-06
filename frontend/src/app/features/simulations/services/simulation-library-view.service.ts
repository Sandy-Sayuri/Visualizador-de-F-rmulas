import { Injectable, inject } from '@angular/core';

import {
  FORMULA_ENGINE_DOMAIN_CATALOG,
  PhysicsDomainModel,
} from '../models/formula-engine.model';
import { SimulationLibraryItemModel } from '../models/simulation-library-item.model';
import { SimulationModel } from '../models/simulation.model';
import { FormulaScenarioAnalyzerService } from '../formula/formula-scenario-analyzer.service';
import { FormulaScenarioMetadataService } from '../formula/formula-scenario-metadata.service';
import { FORMULA_SCENARIO_PRESETS } from '../formula/formula-scenario-presets';

@Injectable({
  providedIn: 'root',
})
export class SimulationLibraryViewService {
  private readonly analyzer = inject(FormulaScenarioAnalyzerService);
  private readonly metadata = inject(FormulaScenarioMetadataService);
  private readonly domainLabels = new Map(
    FORMULA_ENGINE_DOMAIN_CATALOG.map((domain) => [domain.domain, domain.label]),
  );
  private readonly presetByFormula = new Map(
    FORMULA_SCENARIO_PRESETS.map((preset) => [preset.formula, preset]),
  );

  buildItems(simulations: SimulationModel[]): SimulationLibraryItemModel[] {
    return simulations.map((simulation) => this.buildItem(simulation));
  }

  private buildItem(simulation: SimulationModel): SimulationLibraryItemModel {
    const extracted = this.metadata.extractConfig(simulation.description);
    const config = extracted.config;

    if (!config) {
      return {
        simulation,
        id: simulation.id,
        name: simulation.name,
        description: extracted.cleanDescription,
        source: 'manual',
        sourceLabel: 'Manual',
        formula: null,
        formulaPreview: null,
        domain: null,
        domainLabel: 'Manual',
        familyLabel: null,
        parameterCount: 0,
        isGuided: false,
        searchText: this.toSearchText([
          simulation.name,
          extracted.cleanDescription,
          'manual',
        ]),
      };
    }

    const preset = this.presetByFormula.get(config.formula);
    const fallbackDomain = this.resolveDomainLabel('generic');
    let domain: PhysicsDomainModel | null = null;
    let domainLabel = fallbackDomain;
    let familyLabel: string | null = null;

    try {
      const analysis = this.analyzer.analyze(config.formula);
      domain = analysis.classification.domain;
      domainLabel = this.resolveDomainLabel(domain);
      familyLabel = analysis.classification.displayLabel;
    } catch {
      familyLabel = preset?.heroText ?? 'Formula fisica';
    }

    return {
      simulation,
      id: simulation.id,
      name: simulation.name,
      description: extracted.cleanDescription,
      source: 'formula',
      sourceLabel: preset?.guided ? 'Guiado' : 'Formula',
      formula: config.formula,
      formulaPreview: this.normalizeFormulaPreview(config.formula),
      domain,
      domainLabel,
      familyLabel,
      parameterCount: Object.keys(config.parameterValues).length,
      isGuided: !!preset?.guided,
      searchText: this.toSearchText([
        simulation.name,
        extracted.cleanDescription,
        config.formula,
        domainLabel,
        familyLabel,
        preset?.label,
      ]),
    };
  }

  private resolveDomainLabel(domain: PhysicsDomainModel): string {
    return this.domainLabels.get(domain) ?? 'Formula';
  }

  private normalizeFormulaPreview(formula: string): string {
    return formula.replace(/\s+/g, ' ').trim();
  }

  private toSearchText(values: Array<string | null | undefined>): string {
    return values
      .filter((value): value is string => !!value)
      .join(' ')
      .toLocaleLowerCase();
  }
}
