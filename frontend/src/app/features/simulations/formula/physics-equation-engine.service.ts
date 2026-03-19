import { Injectable } from '@angular/core';
import { MathNode, parse, simplify } from 'mathjs';

interface ParsedEquationLineModel {
  order: number;
  normalizedEquation: string;
  leftSide: string;
  rightSide: string;
  leftNode: MathNode;
  rightNode: MathNode;
  leftSymbol: string | null;
}

interface EquationExpressionSourceModel {
  symbol: string;
  expressionNode: MathNode;
  originEquation: string;
  order: number;
  sourceType: 'direct' | 'isolated';
}

interface TargetDescriptorModel {
  outputTarget: string;
  priority: number;
}

interface TargetCandidateModel {
  symbol: string;
  descriptor: TargetDescriptorModel;
  order: number;
  sourceType: 'direct' | 'isolated';
}

export interface ResolvedFormulaInputModel {
  normalizedInput: string;
  resolvedFormula: string;
  leftSide: string;
  expression: string;
  expressionNode: MathNode;
  equationCount: number;
  dependentVariables: string[];
  resolutionSteps: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PhysicsEquationEngineService {
  private readonly targetDescriptors = new Map<string, TargetDescriptorModel>([
    ['x', { outputTarget: 'x', priority: 0 }],
    ['y', { outputTarget: 'y', priority: 0 }],
    ['v', { outputTarget: 'vx', priority: 1 }],
    ['vx', { outputTarget: 'vx', priority: 1 }],
    ['vy', { outputTarget: 'vy', priority: 1 }],
    ['a', { outputTarget: 'ax', priority: 2 }],
    ['ax', { outputTarget: 'ax', priority: 2 }],
    ['ay', { outputTarget: 'ay', priority: 2 }],
    ['f', { outputTarget: 'force', priority: 3 }],
    ['force', { outputTarget: 'force', priority: 3 }],
  ]);

  resolveFormula(input: string): ResolvedFormulaInputModel {
    const rawInput = input.trim();

    if (!rawInput) {
      throw new Error('Informe uma formula para iniciar a simulacao.');
    }

    const dependentVariables = this.collectDependentVariables(rawInput);
    const normalizedInput = this.normalizeInput(rawInput);
    const equations = this.parseEquations(normalizedInput);
    const directSources = this.collectDirectSources(equations);
    const isolatedSources = new Map<string, EquationExpressionSourceModel | null>();
    const resolvedCache = new Map<string, MathNode>();
    const resolutionSteps: string[] = [];
    const candidate = this.selectTargetCandidate(equations, directSources, isolatedSources);

    if (!candidate) {
      return this.buildFallbackResolution(equations, normalizedInput, dependentVariables);
    }

    const source = this.resolveSourceForSymbol(
      candidate.symbol,
      equations,
      directSources,
      isolatedSources,
    );

    if (!source) {
      throw new Error('Nao foi possivel gerar uma forma executavel para simular.');
    }

    const resolvedExpressionNode = this.resolveExpressionNode(
      source,
      equations,
      directSources,
      isolatedSources,
      resolvedCache,
      new Set<string>([candidate.symbol]),
      resolutionSteps,
    );
    const simplifiedExpression = this.simplifyNode(resolvedExpressionNode);
    const expression = simplifiedExpression.toString();

    return {
      normalizedInput,
      resolvedFormula: `${candidate.descriptor.outputTarget} = ${expression}`,
      leftSide: candidate.descriptor.outputTarget,
      expression,
      expressionNode: simplifiedExpression,
      equationCount: equations.length,
      dependentVariables,
      resolutionSteps,
    };
  }

  private buildFallbackResolution(
    equations: ParsedEquationLineModel[],
    normalizedInput: string,
    dependentVariables: string[],
  ): ResolvedFormulaInputModel {
    if (equations.length !== 1 || !equations[0].leftSymbol) {
      throw new Error('Nao foi possivel gerar uma forma executavel para simular.');
    }

    const equation = equations[0];
    const expressionNode = this.simplifyNode(equation.rightNode);
    const expression = expressionNode.toString();

    return {
      normalizedInput,
      resolvedFormula: `${equation.leftSide} = ${expression}`,
      leftSide: equation.leftSide,
      expression,
      expressionNode,
      equationCount: 1,
      dependentVariables,
      resolutionSteps: [],
    };
  }

  private parseEquations(input: string): ParsedEquationLineModel[] {
    const lines = input
      .split(/\r?\n|;/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      throw new Error('Informe uma formula para iniciar a simulacao.');
    }

    return lines.map((line, order) => this.parseEquation(line, order));
  }

  private parseEquation(
    equation: string,
    order: number,
  ): ParsedEquationLineModel {
    const segments = equation.split('=');

    if (segments.length !== 2) {
      throw new Error('Use o formato variavel = expressao.');
    }

    const leftSide = segments[0].trim();
    const rightSide = segments[1].trim();

    if (!leftSide || !rightSide) {
      throw new Error('A formula precisa ter variavel e expressao.');
    }

    const leftNode = this.parseNode(leftSide);
    const rightNode = this.parseNode(rightSide);

    return {
      order,
      normalizedEquation: `${leftSide} = ${rightSide}`,
      leftSide,
      rightSide,
      leftNode,
      rightNode,
      leftSymbol: this.extractSimpleSymbol(leftNode),
    };
  }

  private collectDirectSources(
    equations: ParsedEquationLineModel[],
  ): Map<string, EquationExpressionSourceModel> {
    const directSources = new Map<string, EquationExpressionSourceModel>();

    equations.forEach((equation) => {
      if (!equation.leftSymbol) {
        return;
      }

      if (directSources.has(equation.leftSymbol)) {
        throw new Error(`A variavel "${equation.leftSymbol}" foi definida mais de uma vez.`);
      }

      directSources.set(equation.leftSymbol, {
        symbol: equation.leftSymbol,
        expressionNode: equation.rightNode,
        originEquation: equation.normalizedEquation,
        order: equation.order,
        sourceType: 'direct',
      });
    });

    return directSources;
  }

  private selectTargetCandidate(
    equations: ParsedEquationLineModel[],
    directSources: Map<string, EquationExpressionSourceModel>,
    isolatedSources: Map<string, EquationExpressionSourceModel | null>,
  ): TargetCandidateModel | null {
    const directCandidates = this.collectDirectCandidates(equations);

    if (directCandidates.length) {
      const sortedDirectCandidates = this.sortCandidates(directCandidates);
      const bestDirectCandidate = sortedDirectCandidates[0];

      if (bestDirectCandidate.descriptor.outputTarget !== 'force') {
        return bestDirectCandidate;
      }

      const isolatedCandidates = this
        .collectIsolatedCandidates(equations, directSources, isolatedSources)
        .filter((candidate) => candidate.descriptor.priority < bestDirectCandidate.descriptor.priority);

      return this.sortCandidates([bestDirectCandidate, ...isolatedCandidates])[0];
    }

    if (equations.length === 1 && equations[0].leftSymbol) {
      return null;
    }

    return this.sortCandidates(
      this.collectIsolatedCandidates(equations, directSources, isolatedSources),
    )[0] ?? null;
  }

  private resolveSourceForSymbol(
    symbol: string,
    equations: ParsedEquationLineModel[],
    directSources: Map<string, EquationExpressionSourceModel>,
    isolatedSources: Map<string, EquationExpressionSourceModel | null>,
  ): EquationExpressionSourceModel | null {
    const directSource = directSources.get(symbol);

    if (directSource) {
      return directSource;
    }

    if (isolatedSources.has(symbol)) {
      return isolatedSources.get(symbol) ?? null;
    }

    for (const equation of equations) {
      const isolatedSource = this.tryCreateIsolatedSource(equation, symbol);

      if (isolatedSource) {
        isolatedSources.set(symbol, isolatedSource);
        return isolatedSource;
      }
    }

    isolatedSources.set(symbol, null);
    return null;
  }

  private tryCreateIsolatedSource(
    equation: ParsedEquationLineModel,
    symbol: string,
  ): EquationExpressionSourceModel | null {
    const leftHasSymbol = this.containsSymbol(equation.leftNode, symbol);
    const rightHasSymbol = this.containsSymbol(equation.rightNode, symbol);

    if (leftHasSymbol === rightHasSymbol) {
      return null;
    }

    const isolatedNode = leftHasSymbol
      ? this.isolateSymbol(equation.leftNode, equation.rightNode, symbol)
      : this.isolateSymbol(equation.rightNode, equation.leftNode, symbol);

    if (!isolatedNode) {
      return null;
    }

    return {
      symbol,
      expressionNode: this.simplifyNode(isolatedNode),
      originEquation: equation.normalizedEquation,
      order: equation.order,
      sourceType: 'isolated',
    };
  }

  private resolveExpressionNode(
    source: EquationExpressionSourceModel,
    equations: ParsedEquationLineModel[],
    directSources: Map<string, EquationExpressionSourceModel>,
    isolatedSources: Map<string, EquationExpressionSourceModel | null>,
    resolvedCache: Map<string, MathNode>,
    stack: Set<string>,
    resolutionSteps: string[],
  ): MathNode {
    const cachedExpression = resolvedCache.get(source.symbol);

    if (cachedExpression) {
      return cachedExpression;
    }

    if (source.sourceType === 'isolated') {
      const isolationStep = `Isolando ${source.symbol} em ${source.originEquation}`;

      if (!resolutionSteps.includes(isolationStep)) {
        resolutionSteps.push(isolationStep);
      }
    }

    const substitutedExpression = source.expressionNode.transform((node, path, parent) => {
      if (
        !this.isSymbolNode(node) ||
        (parent?.type === 'FunctionNode' && path === 'fn') ||
        stack.has(node.name)
      ) {
        return node;
      }

      const nextSource = this.resolveSourceForSymbol(
        node.name,
        equations,
        directSources,
        isolatedSources,
      );

      if (!nextSource || nextSource.sourceType !== 'direct') {
        return node;
      }

      if (
        source.sourceType === 'isolated' &&
        nextSource.originEquation === source.originEquation
      ) {
        return node;
      }

      return this.resolveExpressionNode(
        nextSource,
        equations,
        directSources,
        isolatedSources,
        resolvedCache,
        new Set([...stack, node.name]),
        resolutionSteps,
      );
    });
    const simplifiedExpression = this.simplifyNode(substitutedExpression);

    resolvedCache.set(source.symbol, simplifiedExpression);
    return simplifiedExpression;
  }

  private isolateSymbol(
    nodeWithSymbol: MathNode,
    otherSide: MathNode,
    symbol: string,
  ): MathNode | null {
    if (this.isSymbolNode(nodeWithSymbol) && nodeWithSymbol.name === symbol) {
      return otherSide;
    }

    if (nodeWithSymbol.type === 'ParenthesisNode') {
      return this.isolateSymbol(
        (nodeWithSymbol as MathNode & { content: MathNode }).content,
        otherSide,
        symbol,
      );
    }

    if (nodeWithSymbol.type !== 'OperatorNode') {
      return null;
    }

    const operatorNode = nodeWithSymbol as MathNode & {
      op: string;
      args: MathNode[];
    };

    if (operatorNode.args.length === 1 && operatorNode.op === '-') {
      return this.isolateSymbol(
        operatorNode.args[0],
        this.parseNode(`-(${otherSide.toString()})`),
        symbol,
      );
    }

    if (operatorNode.args.length < 2) {
      return null;
    }

    const [leftArgument, rightArgument] = operatorNode.args;
    const leftHasSymbol = this.containsSymbol(leftArgument, symbol);
    const rightHasSymbol = this.containsSymbol(rightArgument, symbol);

    if (leftHasSymbol && rightHasSymbol) {
      return null;
    }

    switch (operatorNode.op) {
      case '+':
        if (leftHasSymbol) {
          return this.isolateSymbol(
            leftArgument,
            this.parseNode(`(${otherSide.toString()}) - (${rightArgument.toString()})`),
            symbol,
          );
        }

        if (rightHasSymbol) {
          return this.isolateSymbol(
            rightArgument,
            this.parseNode(`(${otherSide.toString()}) - (${leftArgument.toString()})`),
            symbol,
          );
        }

        return null;
      case '-':
        if (leftHasSymbol) {
          return this.isolateSymbol(
            leftArgument,
            this.parseNode(`(${otherSide.toString()}) + (${rightArgument.toString()})`),
            symbol,
          );
        }

        if (rightHasSymbol) {
          return this.isolateSymbol(
            rightArgument,
            this.parseNode(`(${leftArgument.toString()}) - (${otherSide.toString()})`),
            symbol,
          );
        }

        return null;
      case '*':
        if (leftHasSymbol) {
          return this.isolateSymbol(
            leftArgument,
            this.parseNode(`(${otherSide.toString()}) / (${rightArgument.toString()})`),
            symbol,
          );
        }

        if (rightHasSymbol) {
          return this.isolateSymbol(
            rightArgument,
            this.parseNode(`(${otherSide.toString()}) / (${leftArgument.toString()})`),
            symbol,
          );
        }

        return null;
      case '/':
        if (leftHasSymbol) {
          return this.isolateSymbol(
            leftArgument,
            this.parseNode(`(${otherSide.toString()}) * (${rightArgument.toString()})`),
            symbol,
          );
        }

        if (rightHasSymbol) {
          return this.isolateSymbol(
            rightArgument,
            this.parseNode(`(${leftArgument.toString()}) / (${otherSide.toString()})`),
            symbol,
          );
        }

        return null;
      default:
        return null;
    }
  }

  private resolveTargetDescriptor(symbol: string): TargetDescriptorModel | null {
    if (this.targetDescriptors.has(symbol)) {
      return this.targetDescriptors.get(symbol) ?? null;
    }

    if (symbol === 'F') {
      return this.targetDescriptors.get('force') ?? null;
    }

    const normalizedSymbol = symbol.toLowerCase();

    if (symbol === normalizedSymbol) {
      return this.targetDescriptors.get(normalizedSymbol) ?? null;
    }

    return null;
  }

  private rankSourceType(sourceType: 'direct' | 'isolated'): number {
    return sourceType === 'direct' ? 0 : 1;
  }

  private normalizeInput(input: string): string {
    return input
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[−–—âˆ’â€“â€”]/g, '-')
      .replace(/[×·Ã—Â·]/g, '*')
      .replace(/[²Â²]/g, '^2')
      .replace(/[³Â³]/g, '^3')
      .replace(/[πΠ]/g, 'pi')
      .replace(/[θΘ]/g, 'theta')
      .replace(/[ωΩ]/g, 'omega')
      .replace(/\bsen\s*\(/gi, 'sin(')
      .replace(/[ΔδÎ”Î´]\s*([A-Za-z_][A-Za-z0-9_]*)/g, (_match, symbol: string) =>
        `delta${symbol.charAt(0).toUpperCase()}${symbol.slice(1)}`,
      )
      .replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*t\s*\)/g, '$1')
      .split(/\r?\n|;/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');
  }

  private collectDependentVariables(input: string): string[] {
    const matches = [...input.normalize('NFKC').matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*t\s*\)/g)];
    const symbols = new Set<string>();

    matches.forEach((match) => symbols.add(match[1]));

    return [...symbols];
  }

  private simplifyNode(node: MathNode): MathNode {
    return simplify(node) as MathNode;
  }

  private parseNode(expression: string): MathNode {
    try {
      return parse(expression);
    } catch {
      throw new Error('Nao foi possivel interpretar a formula.');
    }
  }

  private extractSimpleSymbol(node: MathNode): string | null {
    return this.isSymbolNode(node) ? node.name : null;
  }

  private extractSymbols(...nodes: MathNode[]): string[] {
    const symbols = new Set<string>();

    nodes.forEach((node) => {
      node.traverse((candidate, path, parent) => {
        if (
          !this.isSymbolNode(candidate) ||
          (parent?.type === 'FunctionNode' && path === 'fn')
        ) {
          return;
        }

        symbols.add(candidate.name);
      });
    });

    return [...symbols];
  }

  private collectDirectCandidates(
    equations: ParsedEquationLineModel[],
  ): TargetCandidateModel[] {
    return equations.flatMap((equation) => {
      if (!equation.leftSymbol) {
        return [];
      }

      const descriptor = this.resolveTargetDescriptor(equation.leftSymbol);

      if (!descriptor) {
        return [];
      }

      return [
        {
          symbol: equation.leftSymbol,
          descriptor,
          order: equation.order,
          sourceType: 'direct' as const,
        },
      ];
    });
  }

  private collectIsolatedCandidates(
    equations: ParsedEquationLineModel[],
    directSources: Map<string, EquationExpressionSourceModel>,
    isolatedSources: Map<string, EquationExpressionSourceModel | null>,
  ): TargetCandidateModel[] {
    const candidates: TargetCandidateModel[] = [];
    const seen = new Set<string>();

    equations.forEach((equation) => {
      this.extractSymbols(equation.leftNode, equation.rightNode).forEach((symbol) => {
        if (seen.has(symbol)) {
          return;
        }

        seen.add(symbol);

        const descriptor = this.resolveTargetDescriptor(symbol);

        if (!descriptor || directSources.has(symbol)) {
          return;
        }

        const source = this.resolveSourceForSymbol(
          symbol,
          equations,
          directSources,
          isolatedSources,
        );

        if (!source || source.sourceType !== 'isolated') {
          return;
        }

        candidates.push({
          symbol,
          descriptor,
          order: equation.order,
          sourceType: 'isolated',
        });
      });
    });

    return candidates;
  }

  private sortCandidates(
    candidates: TargetCandidateModel[],
  ): TargetCandidateModel[] {
    return [...candidates].sort((left, right) =>
      left.descriptor.priority - right.descriptor.priority ||
      this.rankSourceType(left.sourceType) - this.rankSourceType(right.sourceType) ||
      left.order - right.order,
    );
  }

  private containsSymbol(node: MathNode, symbol: string): boolean {
    let hasSymbol = false;

    node.traverse((candidate, path, parent) => {
      if (
        !this.isSymbolNode(candidate) ||
        (parent?.type === 'FunctionNode' && path === 'fn')
      ) {
        return;
      }

      if (candidate.name === symbol) {
        hasSymbol = true;
      }
    });

    return hasSymbol;
  }

  private isSymbolNode(
    node: MathNode,
  ): node is MathNode & {
    name: string;
  } {
    return node.type === 'SymbolNode' && 'name' in node;
  }
}
