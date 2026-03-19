import { inject, Injectable } from '@angular/core';

import {
  FormulaScenarioClassificationModel,
  FormulaScenarioFeatureModel,
  ParsedFormulaModel,
} from '../models/formula-engine.model';
import { FormulaScenarioParticleStrategyModel } from '../models/formula-scenario.model';
import { DynamicsFormulaModuleService } from './modules/dynamics-formula-module.service';
import { GenericFormulaModuleService } from './modules/generic-formula-module.service';
import { GravitationFormulaModuleService } from './modules/gravitation-formula-module.service';
import { KinematicsFormulaModuleService } from './modules/kinematics-formula-module.service';
import { OscillationFormulaModuleService } from './modules/oscillation-formula-module.service';

const TRIG_FUNCTIONS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan']);
const SINGLE_STATE_SYMBOLS = new Set([
  'x',
  'y',
  'vx',
  'vy',
  'ax',
  'ay',
  'speed',
  'force',
  'distance',
  'r',
  'dx',
  'dy',
]);
const PAIR_STATE_SYMBOLS = new Set([
  ...SINGLE_STATE_SYMBOLS,
  'x1',
  'y1',
  'x2',
  'y2',
  'vx1',
  'vy1',
  'vx2',
  'vy2',
  'ax1',
  'ay1',
  'ax2',
  'ay2',
]);
const INTERACTION_HINTS = new Set([
  'm1',
  'm2',
  'x1',
  'x2',
  'y1',
  'y2',
  'vx1',
  'vx2',
  'vy1',
  'vy2',
  'ax1',
  'ax2',
  'ay1',
  'ay2',
  'dx',
  'dy',
  'r',
  'distance',
]);

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioClassifierService {
  private readonly modules = [
    inject(GravitationFormulaModuleService),
    inject(OscillationFormulaModuleService),
    inject(DynamicsFormulaModuleService),
    inject(KinematicsFormulaModuleService),
    inject(GenericFormulaModuleService),
  ];

  classify(parsed: ParsedFormulaModel): {
    classification: FormulaScenarioClassificationModel;
    features: FormulaScenarioFeatureModel;
  } {
    const particleStrategy = this.resolveParticleStrategy(parsed);
    const stateSymbols = this.resolveStateSymbols(particleStrategy);
    const features: FormulaScenarioFeatureModel = {
      particleStrategy,
      usesTime: parsed.symbols.includes('t'),
      usesTrig: parsed.functionNames.some((name) => TRIG_FUNCTIONS.has(name)),
      usesState: parsed.symbols.some((symbol) => stateSymbols.has(symbol)),
      usesInteraction:
        particleStrategy === 'pair' ||
        parsed.symbols.some((symbol) => INTERACTION_HINTS.has(symbol)),
      symbols: parsed.symbols,
      functionNames: parsed.functionNames,
    };

    const classification =
      this.modules
        .map((moduleRef) => moduleRef.classify(parsed, features))
        .filter((match): match is FormulaScenarioClassificationModel => !!match)
        .sort((left, right) => right.confidence - left.confidence)[0] ??
      this.modules[this.modules.length - 1].classify(parsed, features)!;

    return {
      classification,
      features,
    };
  }

  resolveStateSymbols(
    particleStrategy: FormulaScenarioParticleStrategyModel,
  ): Set<string> {
    return particleStrategy === 'pair' ? PAIR_STATE_SYMBOLS : SINGLE_STATE_SYMBOLS;
  }

  private resolveParticleStrategy(
    parsed: ParsedFormulaModel,
  ): FormulaScenarioParticleStrategyModel {
    if (parsed.targetInfo.evaluationMode !== 'force') {
      return 'single';
    }

    const symbolSet = new Set(parsed.symbols.map((symbol) => symbol.toLowerCase()));
    const hasMassPair = symbolSet.has('m1') && symbolSet.has('m2');
    const hasDistanceState =
      symbolSet.has('r') ||
      symbolSet.has('distance') ||
      (symbolSet.has('dx') && symbolSet.has('dy'));
    const hasIndexedCoordinates =
      (symbolSet.has('x1') && symbolSet.has('x2')) ||
      (symbolSet.has('y1') && symbolSet.has('y2'));
    const hasIndexedPair = this.hasIndexedPair(parsed.symbols);

    if (hasMassPair || hasDistanceState || hasIndexedCoordinates || hasIndexedPair) {
      return 'pair';
    }

    return 'single';
  }

  private hasIndexedPair(symbols: string[]): boolean {
    const groupedPrefixes = new Map<string, Set<string>>();

    symbols.forEach((symbol) => {
      const match = /^([A-Za-z_]+)(\d+)$/.exec(symbol);

      if (!match) {
        return;
      }

      const prefix = match[1].toLowerCase();
      const index = match[2];
      const bucket = groupedPrefixes.get(prefix) ?? new Set<string>();
      bucket.add(index);
      groupedPrefixes.set(prefix, bucket);
    });

    return [...groupedPrefixes.values()].some((indexes) => indexes.size >= 2);
  }
}
