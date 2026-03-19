import { Injectable } from '@angular/core';
import { EvalFunction, compile } from 'mathjs';

@Injectable({
  providedIn: 'root',
})
export class FormulaScenarioEvaluatorService {
  compileExpression(expression: string): EvalFunction {
    try {
      return compile(expression);
    } catch {
      throw new Error('Nao foi possivel interpretar a formula.');
    }
  }

  evaluateScalar(
    compiledExpression: EvalFunction,
    scope: Record<string, number>,
  ): number {
    try {
      const result = Number(compiledExpression.evaluate(scope));

      if (!Number.isFinite(result)) {
        throw new Error();
      }

      return result;
    } catch {
      throw new Error('A formula retornou um valor invalido.');
    }
  }
}
