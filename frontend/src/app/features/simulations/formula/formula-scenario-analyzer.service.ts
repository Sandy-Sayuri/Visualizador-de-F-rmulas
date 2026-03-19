import { Injectable, inject } from '@angular/core';

import { FormulaScenarioClassifierService } from './formula-scenario-classifier.service';
import { FormulaScenarioParserService } from './formula-scenario-parser.service';
import { PhysicsDomainRegistryService } from './physics-domain-registry.service';
import {
  FormulaParameterDefinitionModel,
  FormulaScenarioAnalysisModel,
  FormulaScenarioParticleStrategyModel,
} from '../models/formula-scenario.model';

const GLOBAL_RESERVED_SYMBOLS = new Set(['t', 'dt', 'pi', 'e']);

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioAnalyzerService {
  private readonly parser = inject(FormulaScenarioParserService);
  private readonly classifier = inject(FormulaScenarioClassifierService);
  private readonly domainRegistry = inject(PhysicsDomainRegistryService);

  analyze(formula: string): FormulaScenarioAnalysisModel {
    const parsed = this.parser.parseFormula(formula);
    const { classification, features } = this.classifier.classify(parsed);
    const stateSymbols = this.classifier.resolveStateSymbols(features.particleStrategy);
    const fallbackParameterDefinitions = parsed.symbols
      .filter((symbol) => !GLOBAL_RESERVED_SYMBOLS.has(symbol))
      .filter((symbol) => !stateSymbols.has(symbol))
      .map((symbol) => this.createParameterDefinition(symbol));
    const parameterDefinitions = this.domainRegistry.extractParameters(
      parsed,
      features,
      classification,
      this.deduplicateDefinitions(fallbackParameterDefinitions),
    );

    return {
      formula: parsed.formula,
      normalizedFormula: parsed.normalizedFormula,
      target: parsed.targetInfo.target,
      targetName: parsed.targetInfo.targetName,
      axis: parsed.targetInfo.axis,
      expression: parsed.expression,
      evaluationMode: parsed.targetInfo.evaluationMode,
      particleStrategy: features.particleStrategy,
      classification,
      parameterDefinitions,
      symbols: parsed.symbols,
      functionNames: parsed.functionNames,
      usesTime: features.usesTime,
      usesTrig: features.usesTrig,
      usesState: features.usesState,
      usesInteraction: features.usesInteraction,
    };
  }

  resolveStateSymbols(
    particleStrategy: FormulaScenarioParticleStrategyModel,
  ): Set<string> {
    return this.classifier.resolveStateSymbols(particleStrategy);
  }

  private createParameterDefinition(key: string): FormulaParameterDefinitionModel {
    const defaults: Record<string, FormulaParameterDefinitionModel> = {
      x0: { key: 'x0', label: 'x0', defaultValue: -180 },
      y0: { key: 'y0', label: 'y0', defaultValue: 0 },
      v: { key: 'v', label: 'v', defaultValue: 42 },
      v0: { key: 'v0', label: 'v0', defaultValue: 42 },
      vx0: { key: 'vx0', label: 'vx0', defaultValue: 42 },
      vy0: { key: 'vy0', label: 'vy0', defaultValue: 0 },
      deltaT: { key: 'deltaT', label: 'deltaT', defaultValue: 2, min: 0.1, step: 0.1 },
      deltaS: { key: 'deltaS', label: 'deltaS', defaultValue: 20, step: 1 },
      deltaX: { key: 'deltaX', label: 'deltaX', defaultValue: 20, step: 1 },
      deltaY: { key: 'deltaY', label: 'deltaY', defaultValue: 20, step: 1 },
      a: { key: 'a', label: 'a', defaultValue: 8 },
      ax0: { key: 'ax0', label: 'ax0', defaultValue: 0 },
      ay0: { key: 'ay0', label: 'ay0', defaultValue: -9.81 },
      g: { key: 'g', label: 'g', defaultValue: 9.81 },
      A: { key: 'A', label: 'A', defaultValue: 140 },
      w: { key: 'w', label: 'w', defaultValue: 1.4 },
      G: { key: 'G', label: 'G', defaultValue: 1000 },
      k: { key: 'k', label: 'k', defaultValue: 0.8 },
      q: { key: 'q', label: 'q', defaultValue: 1 },
      q1: { key: 'q1', label: 'q1', defaultValue: 1.6 },
      q2: { key: 'q2', label: 'q2', defaultValue: -1.2 },
      c: { key: 'c', label: 'c', defaultValue: 0.2 },
      m: { key: 'm', label: 'm', defaultValue: 10, min: 0.0000001 },
      mass: { key: 'mass', label: 'mass', defaultValue: 10, min: 0.0000001 },
      m1: { key: 'm1', label: 'm1', defaultValue: 36, min: 0.0000001 },
      m2: { key: 'm2', label: 'm2', defaultValue: 12, min: 0.0000001 },
    };

    if (defaults[key]) {
      return defaults[key];
    }

    if (/^m\d*$/i.test(key) || /^mass\d*$/i.test(key)) {
      return {
        key,
        label: key,
        defaultValue: 10,
        min: 0.0000001,
      };
    }

    if (/^x\d*0?$/i.test(key)) {
      return {
        key,
        label: key,
        defaultValue: -180,
      };
    }

    if (/^y\d*0?$/i.test(key)) {
      return {
        key,
        label: key,
        defaultValue: 0,
      };
    }

    if (/^v/i.test(key)) {
      return {
        key,
        label: key,
        defaultValue: 24,
      };
    }

    if (/^a/i.test(key)) {
      return {
        key,
        label: key,
        defaultValue: 6,
      };
    }

    if (/^delta/i.test(key)) {
      return {
        key,
        label: key,
        defaultValue: /t$/i.test(key) ? 2 : 20,
        min: /t$/i.test(key) ? 0.1 : undefined,
        step: /t$/i.test(key) ? 0.1 : 1,
      };
    }

    if (/^q\d*$/i.test(key)) {
      return {
        key,
        label: key,
        defaultValue: key.toLowerCase().endsWith('2') ? -1.2 : 1.6,
      };
    }

    return {
      key,
      label: key,
      defaultValue: 1,
    };
  }

  private deduplicateDefinitions(
    definitions: FormulaParameterDefinitionModel[],
  ): FormulaParameterDefinitionModel[] {
    const seen = new Set<string>();

    return definitions.filter((definition) => {
      if (seen.has(definition.key)) {
        return false;
      }

      seen.add(definition.key);
      return true;
    });
  }
}
