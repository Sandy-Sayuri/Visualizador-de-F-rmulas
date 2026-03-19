import { Injectable } from '@angular/core';
import { MathNode, parse } from 'mathjs';

import {
  ParsedFormulaModel,
  ParsedFormulaTargetInfoModel,
} from '../models/formula-engine.model';
import {
  FormulaScenarioAxisModel,
  FormulaScenarioEvaluationModeModel,
  FormulaScenarioTargetModel,
} from '../models/formula-scenario.model';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioParserService {
  parseFormula(formula: string): ParsedFormulaModel {
    const rawFormula = formula.trim();

    if (!rawFormula) {
      throw new Error('Informe uma formula para iniciar a simulacao.');
    }

    const normalizedFormula = this.normalizeFormula(rawFormula);
    const segments = normalizedFormula.split('=');

    if (segments.length !== 2) {
      throw new Error('Use o formato variavel = expressao.');
    }

    const leftSide = segments[0].trim();
    const expression = segments[1].trim();

    if (!leftSide || !expression) {
      throw new Error('A formula precisa ter variavel e expressao.');
    }

    const targetInfo = this.resolveTarget(leftSide);
    const expressionNode = this.parseExpression(expression);
    const metadata = this.extractMetadata(expressionNode);

    return {
      formula: rawFormula,
      normalizedFormula,
      leftSide,
      expression,
      expressionNode,
      symbols: metadata.symbols,
      functionNames: metadata.functionNames,
      targetInfo,
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

  private parseExpression(expression: string): MathNode {
    try {
      return parse(expression);
    } catch {
      throw new Error('Nao foi possivel interpretar a formula.');
    }
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
