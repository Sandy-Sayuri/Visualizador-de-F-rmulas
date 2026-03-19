import { Injectable } from '@angular/core';
import { EvalFunction, compile } from 'mathjs';

import {
  FormulaEvaluationScopeModel,
  FormulaSimulationConfigModel,
} from '../models/formula-simulation-config.model';
import { Vector2Model } from '../models/vector2.model';

export interface FormulaProgram {
  evaluate(scope: FormulaEvaluationScopeModel): Vector2Model;
}

@Injectable({
  providedIn: 'root',
})
export class FormulaInterpreterService {
  compileProgram(
    config: Pick<
      FormulaSimulationConfigModel,
      'accelerationXFormula' | 'accelerationYFormula'
    > &
      Partial<
        Pick<
          FormulaSimulationConfigModel,
          'initialPosition' | 'initialVelocity' | 'mass'
        >
      >,
  ): FormulaProgram {
    const compiledX = this.compileExpression(
      config.accelerationXFormula,
      'aceleracao X',
    );
    const compiledY = this.compileExpression(
      config.accelerationYFormula,
      'aceleracao Y',
    );

    const defaultScope = this.createValidationScope(config);
    this.evaluateExpression(compiledX, defaultScope, 'aceleracao X');
    this.evaluateExpression(compiledY, defaultScope, 'aceleracao Y');

    return {
      evaluate: (scope) => ({
        x: this.evaluateExpression(compiledX, scope, 'aceleracao X'),
        y: this.evaluateExpression(compiledY, scope, 'aceleracao Y'),
      }),
    };
  }

  private compileExpression(expression: string, label: string): EvalFunction {
    try {
      return compile(expression);
    } catch {
      throw new Error(`Nao foi possivel interpretar a formula de ${label}.`);
    }
  }

  private evaluateExpression(
    expression: EvalFunction,
    scope: FormulaEvaluationScopeModel,
    label: string,
  ): number {
    try {
      const result = Number(expression.evaluate(scope));

      if (!Number.isFinite(result)) {
        throw new Error();
      }

      return result;
    } catch {
      throw new Error(`A formula de ${label} retornou um valor invalido.`);
    }
  }

  private createValidationScope(
    config: Partial<
      Pick<FormulaSimulationConfigModel, 'initialPosition' | 'initialVelocity' | 'mass'>
    >,
  ): FormulaEvaluationScopeModel {
    const initialPosition = config.initialPosition ?? { x: 1, y: 1 };
    const initialVelocity = config.initialVelocity ?? { x: 0, y: 0 };

    return {
      t: 0,
      dt: 0.016,
      x: initialPosition.x,
      y: initialPosition.y,
      vx: initialVelocity.x,
      vy: initialVelocity.y,
      mass: config.mass ?? 10,
      speed: Math.hypot(initialVelocity.x, initialVelocity.y),
      pi: Math.PI,
      e: Math.E,
    };
  }
}
