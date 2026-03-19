import { Vector2Model } from './vector2.model';

export type ElectromagnetismScenarioKindModel = 'coulomb' | 'field';

export interface ElectromagnetismLineModel {
  from: Vector2Model;
  to: Vector2Model;
  color: string;
  width: number;
  opacity: number;
  dashed?: boolean;
}

export interface ElectromagnetismPathModel {
  points: Vector2Model[];
  color: string;
  width: number;
  opacity: number;
  dashed?: boolean;
}

export interface ElectromagnetismArrowModel {
  from: Vector2Model;
  to: Vector2Model;
  color: string;
  width: number;
  opacity: number;
  dashed?: boolean;
}

export interface ElectromagnetismPointModel {
  position: Vector2Model;
  color: string;
  radius: number;
  opacity: number;
  ringRadius?: number;
}

export interface ElectromagnetismSceneSnapshotModel {
  scenario: ElectromagnetismScenarioKindModel;
  lines: ElectromagnetismLineModel[];
  paths: ElectromagnetismPathModel[];
  arrows: ElectromagnetismArrowModel[];
  points: ElectromagnetismPointModel[];
  repulsive: boolean;
}
