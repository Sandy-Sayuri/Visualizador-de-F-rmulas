import { Vector2Model } from './vector2.model';

export interface CreateBodyPayload {
  name: string;
  mass: number;
  radius: number;
  color: string;
  position: Vector2Model;
  velocity: Vector2Model;
}

export interface CreateSimulationPayload {
  name: string;
  description: string | null;
  bodies: CreateBodyPayload[];
}
