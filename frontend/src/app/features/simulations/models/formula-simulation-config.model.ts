import { CreateSimulationPayload } from './create-simulation.model';
import { Vector2Model } from './vector2.model';

export interface FormulaSimulationConfigModel {
  objectName: string;
  color: string;
  mass: number;
  radius: number;
  initialPosition: Vector2Model;
  initialVelocity: Vector2Model;
  accelerationXFormula: string;
  accelerationYFormula: string;
}

export interface FormulaEvaluationScopeModel {
  t: number;
  dt: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  speed: number;
  pi: number;
  e: number;
}

export interface FormulaSimulationStateModel {
  time: number;
  acceleration: Vector2Model;
  body: CreateSimulationPayload['bodies'][number] & {
    id: string;
    force: Vector2Model;
    speed: number;
    kineticEnergy: number;
    potentialEnergy: number;
    totalEnergy: number;
    trail: Vector2Model[];
  };
}
