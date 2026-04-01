import { BodyModel } from './body.model';
import { Vector2Model } from './vector2.model';

export interface RuntimeBodyModel extends BodyModel {
  force: Vector2Model;
  speed: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  trail: Vector2Model[];
  visualOnly?: boolean;
}
