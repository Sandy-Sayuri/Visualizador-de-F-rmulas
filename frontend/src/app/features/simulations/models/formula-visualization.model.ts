import { CanvasDecorationModel, CanvasLegendItemModel } from './canvas-decoration.model';
import { RuntimeBodyModel } from './runtime-body.model';

export type FormulaVisualMode =
  | 'single-particle'
  | 'mass-comparison'
  | 'interaction-field'
  | 'pattern';

export interface FormulaVisualTraitsModel {
  usesPositionX: boolean;
  usesPositionY: boolean;
  usesVelocityX: boolean;
  usesVelocityY: boolean;
  usesTime: boolean;
  usesSpeed: boolean;
  usesMass: boolean;
  usesDivision: boolean;
  usesPower: boolean;
  crossAxisCoupling: boolean;
  periodicMotion: boolean;
  springLikeMotion: boolean;
  radialField: boolean;
  comparisonCandidate: boolean;
  interactionCandidate: boolean;
  complexityScore: number;
}

export interface FormulaVisualDecisionModel {
  mode: FormulaVisualMode;
  showVectors: boolean;
  showTrails: boolean;
  showAnchor: boolean;
  showWake: boolean;
  showPulse: boolean;
  showPrediction: boolean;
  showPattern: boolean;
  showComparison: boolean;
  showInteractionBodies: boolean;
}

export interface FormulaVisualSceneModel {
  bodies: RuntimeBodyModel[];
  decorations: CanvasDecorationModel[];
  legendItems: CanvasLegendItemModel[];
  decision: FormulaVisualDecisionModel;
}
