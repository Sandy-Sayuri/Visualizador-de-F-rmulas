import { CanvasDecorationModel, CanvasLegendItemModel } from './canvas-decoration.model';
import { RuntimeBodyModel } from './runtime-body.model';

export type FormulaScenarioTargetModel = 'x' | 'y' | 'force';

export type FormulaScenarioCategoryModel =
  | 'uniform-motion'
  | 'uniform-acceleration'
  | 'vertical-launch'
  | 'harmonic-oscillation'
  | 'two-body-gravity';

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
  expression: string;
  category: FormulaScenarioCategoryModel;
  parameterDefinitions: FormulaParameterDefinitionModel[];
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
