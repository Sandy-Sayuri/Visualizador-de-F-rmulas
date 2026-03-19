import { CanvasDecorationModel, CanvasLegendItemModel } from './canvas-decoration.model';
import { ElectromagnetismSceneSnapshotModel } from './electromagnetism-scene.model';
import { InclinedPlaneSceneSnapshotModel } from './inclined-plane-scene.model';
import { OpticalSceneSnapshotModel } from './optical-scene.model';
import { ThermodynamicsSceneSnapshotModel } from './thermodynamics-scene.model';
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
  max?: number;
  step?: number;
  inputMode?: 'number' | 'range';
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

export interface FormulaScenarioStateSceneDataModel {
  electromagnetism?: ElectromagnetismSceneSnapshotModel;
  inclinedPlane?: InclinedPlaneSceneSnapshotModel;
  optical?: OpticalSceneSnapshotModel;
  thermodynamics?: ThermodynamicsSceneSnapshotModel;
}

export interface FormulaScenarioStateModel {
  time: number;
  bodies: RuntimeBodyModel[];
  sceneData?: FormulaScenarioStateSceneDataModel;
}

export type FormulaSceneModeModel =
  | 'single-particle'
  | 'single-trajectory'
  | 'inclined-plane'
  | 'oscillation'
  | 'wave-field'
  | 'pair-interaction'
  | 'electric-field'
  | 'thermo-chamber'
  | 'optical-rays';

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
