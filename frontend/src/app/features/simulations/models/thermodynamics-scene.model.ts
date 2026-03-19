import { Vector2Model } from './vector2.model';

export type ThermodynamicsScenarioKindModel = 'gas' | 'compression';

export interface ThermodynamicsContainerBoundsModel {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ThermodynamicsSceneSnapshotModel {
  scenario: ThermodynamicsScenarioKindModel;
  bounds: ThermodynamicsContainerBoundsModel;
  targetVolume: number;
  currentVolume: number;
  temperature: number;
  pressure: number;
  particleCount: number;
  pistonVelocity: number;
  pistonPosition: number;
  gaugePoints: Vector2Model[];
}
