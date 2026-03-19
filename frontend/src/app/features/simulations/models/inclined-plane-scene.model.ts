import { Vector2Model } from './vector2.model';

export interface InclinedPlaneSceneSnapshotModel {
  angleDeg: number;
  gravity: number;
  mass: number;
  acceleration: number;
  planeLength: number;
  topPoint: Vector2Model;
  bottomPoint: Vector2Model;
  tangent: Vector2Model;
  outwardNormal: Vector2Model;
  weightMagnitude: number;
  parallelMagnitude: number;
  perpendicularMagnitude: number;
}
