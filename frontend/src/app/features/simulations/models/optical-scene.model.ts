import { Vector2Model } from './vector2.model';

export type OpticalScenarioKindModel = 'reflection' | 'refraction' | 'lens';

export interface OpticalLineModel {
  from: Vector2Model;
  to: Vector2Model;
  color: string;
  width: number;
  opacity: number;
  dashed?: boolean;
}

export interface OpticalArcModel {
  center: Vector2Model;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
  width: number;
  opacity: number;
  dashed?: boolean;
}

export interface OpticalPointModel {
  position: Vector2Model;
  color: string;
  radius: number;
  opacity: number;
  ringRadius?: number;
}

export interface OpticalSceneSnapshotModel {
  scenario: OpticalScenarioKindModel;
  lines: OpticalLineModel[];
  arcs: OpticalArcModel[];
  points: OpticalPointModel[];
  hasTransmission?: boolean;
}
