import { CanvasDecorationModel, CanvasLegendItemModel } from './canvas-decoration.model';
import type { FormulaScenarioClassificationModel } from './formula-engine.model';
import { RuntimeBodyModel } from './runtime-body.model';

export type FormulaScenarioTargetModel =
  | 'x'
  | 'y'
  | 'vx'
  | 'vy'
  | 'ax'
  | 'ay'
  | 'force'
  | 'scalar';

export type FormulaScenarioAxisModel = 'x' | 'y';

export type FormulaScenarioEvaluationModeModel =
  | 'position'
  | 'velocity'
  | 'acceleration'
  | 'force'
  | 'scalar';

export type FormulaScenarioParticleStrategyModel = 'single' | 'pair';

export interface FormulaParameterDefinitionModel {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  step?: number;
}

export interface FormulaScenarioAnalysisModel {
  formula: string;
  normalizedFormula: string;
  target: FormulaScenarioTargetModel;
  targetName: string;
  axis: FormulaScenarioAxisModel;
  expression: string;
  evaluationMode: FormulaScenarioEvaluationModeModel;
  particleStrategy: FormulaScenarioParticleStrategyModel;
  classification: FormulaScenarioClassificationModel;
  parameterDefinitions: FormulaParameterDefinitionModel[];
  symbols: string[];
  functionNames: string[];
  usesTime: boolean;
  usesTrig: boolean;
  usesState: boolean;
  usesInteraction: boolean;
}

export interface FormulaScenarioConfigModel {
  formula: string;
  parameterValues: Record<string, number>;
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor: string;
  secondaryColor: string;
  particleRadius: number;
}

export interface FormulaScenarioDraftModel {
  simulationName: string;
  description: string | null;
  config: FormulaScenarioConfigModel;
}

export interface FormulaScenarioStateModel {
  time: number;
  bodies: RuntimeBodyModel[];
}

export type FormulaSceneModeModel =
  | 'single-particle'
  | 'single-trajectory'
  | 'oscillation'
  | 'wave-field'
  | 'pair-interaction';

export interface FormulaSceneDecisionModel {
  mode: FormulaSceneModeModel;
  particleCount: number;
  showVectors: boolean;
  showTrails: boolean;
  showPatterns: boolean;
}

export interface FormulaScenarioVisualSceneModel {
  bodies: RuntimeBodyModel[];
  decorations: CanvasDecorationModel[];
  legendItems: CanvasLegendItemModel[];
  decision: FormulaSceneDecisionModel;
}
