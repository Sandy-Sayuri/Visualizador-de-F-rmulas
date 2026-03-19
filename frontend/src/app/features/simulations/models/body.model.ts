import { Vector2Model } from './vector2.model';

export interface BodyModel {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
  position: Vector2Model;
  velocity: Vector2Model;
}
