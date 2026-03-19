import { Injectable } from '@angular/core';

import {
  FormulaParameterDefinitionModel,
  FormulaScenarioAnalysisModel,
  FormulaScenarioCategoryModel,
  FormulaScenarioTargetModel,
} from '../models/formula-scenario.model';

const RESERVED_SYMBOLS = new Set([
  't',
  'r',
  'pi',
  'e',
  'sin',
  'cos',
  'tan',
  'sqrt',
  'log',
  'abs',
  'exp',
  'min',
  'max',
  'pow',
]);

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioAnalyzerService {
  analyze(formula: string): FormulaScenarioAnalysisModel {
    const normalizedFormula = formula.trim();

    if (!normalizedFormula) {
      throw new Error('Informe uma formula para iniciar a simulacao.');
    }

    const segments = normalizedFormula.split('=');

    if (segments.length !== 2) {
      throw new Error('Use o formato variavel = expressao.');
    }

    const leftSide = segments[0].trim();
    const expression = segments[1].trim();

    if (!leftSide || !expression) {
      throw new Error('A formula precisa ter variavel e expressao.');
    }

    const target = this.resolveTarget(leftSide);
    const symbols = this.extractSymbols(expression);
    const category = this.resolveCategory(target, expression, symbols);
    const parameterDefinitions = symbols
      .filter((symbol) => !RESERVED_SYMBOLS.has(symbol))
      .map((symbol) => this.createParameterDefinition(symbol, category));

    return {
      formula: normalizedFormula,
      normalizedFormula,
      target,
      expression,
      category,
      parameterDefinitions: this.deduplicateDefinitions(parameterDefinitions),
    };
  }

  private resolveTarget(leftSide: string): FormulaScenarioTargetModel {
    const normalizedTarget = leftSide.replace(/\s+/g, '').toLowerCase();

    if (normalizedTarget === 'x' || normalizedTarget === 'x(t)') {
      return 'x';
    }

    if (normalizedTarget === 'y' || normalizedTarget === 'y(t)') {
      return 'y';
    }

    if (normalizedTarget === 'f' || normalizedTarget === 'f(r)') {
      return 'force';
    }

    throw new Error('Use x, y ou F como variavel principal.');
  }

  private resolveCategory(
    target: FormulaScenarioTargetModel,
    expression: string,
    symbols: string[],
  ): FormulaScenarioCategoryModel {
    if (target === 'force') {
      return 'two-body-gravity';
    }

    const symbolSet = new Set(symbols);
    const hasTrig = /\b(sin|cos)\b/.test(expression);
    const hasTimeSquared = /t\s*\^\s*2/.test(expression) || /t\s*\*\s*t/.test(expression);

    if (hasTrig) {
      return 'harmonic-oscillation';
    }

    if (target === 'y' && (symbolSet.has('g') || hasTimeSquared)) {
      return 'vertical-launch';
    }

    if (symbolSet.has('a') || hasTimeSquared) {
      return 'uniform-acceleration';
    }

    return 'uniform-motion';
  }

  private extractSymbols(expression: string): string[] {
    const matches = expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
    const seen = new Set<string>();

    return matches.filter((symbol) => {
      if (seen.has(symbol)) {
        return false;
      }

      seen.add(symbol);
      return true;
    });
  }

  private createParameterDefinition(
    key: string,
    category: FormulaScenarioCategoryModel,
  ): FormulaParameterDefinitionModel {
    const defaults: Record<string, FormulaParameterDefinitionModel> = {
      x0: {
        key: 'x0',
        label: 'x0',
        defaultValue: -180,
      },
      y0: {
        key: 'y0',
        label: 'y0',
        defaultValue: 0,
      },
      v: {
        key: 'v',
        label: 'v',
        defaultValue: 42,
      },
      v0: {
        key: 'v0',
        label: 'v0',
        defaultValue: 54,
      },
      a: {
        key: 'a',
        label: 'a',
        defaultValue: 8,
      },
      g: {
        key: 'g',
        label: 'g',
        defaultValue: 9.81,
      },
      A: {
        key: 'A',
        label: 'A',
        defaultValue: 140,
      },
      w: {
        key: 'w',
        label: 'w',
        defaultValue: 1.4,
      },
      G: {
        key: 'G',
        label: 'G',
        defaultValue: 1000,
      },
      m1: {
        key: 'm1',
        label: 'm1',
        defaultValue: 36,
        min: 0.0000001,
      },
      m2: {
        key: 'm2',
        label: 'm2',
        defaultValue: 12,
        min: 0.0000001,
      },
      mass: {
        key: 'mass',
        label: 'mass',
        defaultValue: category === 'two-body-gravity' ? 20 : 1,
        min: 0.0000001,
      },
      m: {
        key: 'm',
        label: 'm',
        defaultValue: 1,
        min: 0.0000001,
      },
    };

    return (
      defaults[key] ?? {
        key,
        label: key,
        defaultValue: 1,
      }
    );
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
