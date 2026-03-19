import { Vector2Model } from './vector2.model';

export type CanvasDecorationModel =
  | {
      kind: 'line';
      from: Vector2Model;
      to: Vector2Model;
      color: string;
      width: number;
      opacity: number;
      dashed?: boolean;
    }
  | {
      kind: 'path';
      points: Vector2Model[];
      color: string;
      width: number;
      opacity: number;
      dashed?: boolean;
    }
  | {
      kind: 'arrow';
      from: Vector2Model;
      to: Vector2Model;
      color: string;
      width: number;
      opacity: number;
      dashed?: boolean;
    }
  | {
      kind: 'dot';
      position: Vector2Model;
      radius: number;
      color: string;
      opacity: number;
    }
  | {
      kind: 'ring';
      center: Vector2Model;
      radius: number;
      color: string;
      opacity: number;
      width: number;
      dashed?: boolean;
    }
  | {
      kind: 'arc';
      center: Vector2Model;
      radius: number;
      startAngle: number;
      endAngle: number;
      color: string;
      opacity: number;
      width: number;
      dashed?: boolean;
    };

export interface CanvasLegendItemModel {
  key: string;
  tone:
    | 'ray'
    | 'field'
    | 'velocity'
    | 'force'
    | 'trail'
    | 'prediction'
    | 'pulse'
    | 'wake'
    | 'anchor'
    | 'comparison'
    | 'interaction'
    | 'pattern';
  label?: string;
}
