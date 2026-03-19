import { Injectable, inject } from '@angular/core';
import { MathNode } from 'mathjs';

import {
  ParsedFormulaModel,
  ParsedFormulaTargetInfoModel,
} from '../models/formula-engine.model';
import {
  FormulaScenarioAxisModel,
  FormulaScenarioEvaluationModeModel,
  FormulaScenarioTargetModel,
} from '../models/formula-scenario.model';
import { PhysicsEquationEngineService } from './physics-equation-engine.service';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioParserService {
  private readonly equationEngine = inject(PhysicsEquationEngineService);

  parseFormula(formula: string): ParsedFormulaModel {
    const rawFormula = formula.trim();

    if (!rawFormula) {
      throw new Error('Informe uma formula para iniciar a simulacao.');
    }

    const resolution = this.equationEngine.resolveFormula(rawFormula);
    const leftSide = resolution.leftSide;
    const expression = resolution.expression;

    const targetInfo = this.resolveTarget(leftSide);
    const metadata = this.extractMetadata(resolution.expressionNode);

    return {
      formula: rawFormula,
      normalizedFormula: resolution.normalizedInput,
      resolvedFormula: resolution.resolvedFormula,
      leftSide,
      expression,
      expressionNode: resolution.expressionNode,
      symbols: metadata.symbols,
      functionNames: metadata.functionNames,
      targetInfo,
      equationCount: resolution.equationCount,
      dependentVariables: resolution.dependentVariables,
      resolutionSteps: resolution.resolutionSteps,
    };
  }

  private resolveTarget(leftSide: string): ParsedFormulaTargetInfoModel {
    const compactTarget = leftSide.replace(/\s+/g, '');
    const targetMatch = /^([A-Za-z_][A-Za-z0-9_]*)(?:\(([^)]*)\))?$/.exec(
      compactTarget,
    );

    if (!targetMatch) {
      throw new Error('Use um alvo valido como x, y, vx, vy, ax, ay ou F.');
    }

    const targetName = targetMatch[1];
    const targetKey = targetName.toLowerCase();
    const targetArguments =
      targetMatch[2]
        ?.split(',')
        .map((argument) => argument.trim().toLowerCase())
        .filter(Boolean) ?? [];

    switch (targetKey) {
      case 'x':
        return this.createTargetInfo('x', targetName, 'x', 'position');
      case 'y':
        return this.createTargetInfo('y', targetName, 'y', 'position');
      case 'v':
        return this.createTargetInfo('vx', targetName, 'x', 'velocity');
      case 'vx':
        return this.createTargetInfo('vx', targetName, 'x', 'velocity');
      case 'vy':
        return this.createTargetInfo('vy', targetName, 'y', 'velocity');
      case 'a':
      case 'ax':
        return this.createTargetInfo('ax', targetName, 'x', 'acceleration');
      case 'ay':
        return this.createTargetInfo('ay', targetName, 'y', 'acceleration');
      case 'f':
      case 'force':
        return this.createTargetInfo('force', targetName, 'x', 'force');
      default:
        return this.createTargetInfo(
          'scalar',
          targetName,
          this.inferAxis(targetKey, targetArguments),
          'scalar',
        );
    }
  }

  private normalizeFormula(formula: string): string {
    return formula
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[−–—]/g, '-')
      .replace(/[×·]/g, '*')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/[Δδ]\s*([A-Za-z_][A-Za-z0-9_]*)/g, (_match, symbol: string) =>
        `delta${symbol.charAt(0).toUpperCase()}${symbol.slice(1)}`,
      )
      .trim();
  }

  private createTargetInfo(
    target: FormulaScenarioTargetModel,
    targetName: string,
    axis: FormulaScenarioAxisModel,
    evaluationMode: FormulaScenarioEvaluationModeModel,
  ): ParsedFormulaTargetInfoModel {
    return {
      target,
      targetName,
      axis,
      evaluationMode,
    };
  }

  private inferAxis(
    targetKey: string,
    targetArguments: string[],
  ): FormulaScenarioAxisModel {
    if (targetKey.includes('y') || targetArguments.includes('y')) {
      return 'y';
    }

    return 'x';
  }

  private extractMetadata(expressionNode: MathNode): {
    symbols: string[];
    functionNames: string[];
  } {
    const symbols = new Set<string>();
    const functionNames = new Set<string>();

    expressionNode.traverse((node, path, parent) => {
      if (node.type !== 'SymbolNode' || !('name' in node)) {
        return;
      }

      const symbolName = String(node.name);

      if (parent?.type === 'FunctionNode' && path === 'fn') {
        functionNames.add(symbolName.toLowerCase());
        return;
      }

      symbols.add(symbolName);
    });

    return {
      symbols: [...symbols],
      functionNames: [...functionNames],
    };
  }
}
