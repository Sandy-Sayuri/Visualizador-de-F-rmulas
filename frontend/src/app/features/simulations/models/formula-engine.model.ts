import type { MathNode } from 'mathjs';

import type {
  FormulaParameterDefinitionModel,
  FormulaScenarioAnalysisModel,
  FormulaScenarioAxisModel,
  FormulaScenarioConfigModel,
  FormulaScenarioEvaluationModeModel,
  FormulaScenarioParticleStrategyModel,
  FormulaScenarioStateModel,
  FormulaScenarioTargetModel,
} from './formula-scenario.model';
import type { FormulaScenarioVisualSceneModel } from './formula-scenario.model';

export type PhysicsDomainModel =
  | 'kinematics'
  | 'dynamics'
  | 'oscillation'
  | 'gravitation'
  | 'waves'
  | 'thermodynamics'
  | 'optics'
  | 'electromagnetism'
  | 'generic';

export type PhysicsSupportStatusModel = 'implemented' | 'planned';

export type FormulaSolverStrategyModel =
  | 'direct-expression'
  | 'single-state-integration'
  | 'pair-force-integration'
  | 'guided-dynamics'
  | 'electromagnetic-interaction'
  | 'thermodynamics-particles'
  | 'wave-sampling'
  | 'optical-guided'
  | 'equation-system'
  | 'ode-system';

export type FormulaVisualStrategyModel =
  | 'particle'
  | 'trajectory'
  | 'inclined-plane'
  | 'oscillation-pattern'
  | 'pair-interaction'
  | 'optical-rays'
  | 'thermodynamics-box'
  | 'graph'
  | 'wave'
  | 'field';

export interface ParsedFormulaTargetInfoModel {
  target: FormulaScenarioTargetModel;
  targetName: string;
  axis: FormulaScenarioAxisModel;
  evaluationMode: FormulaScenarioEvaluationModeModel;
}

export interface ParsedFormulaModel {
  formula: string;
  normalizedFormula: string;
  resolvedFormula: string;
  leftSide: string;
  expression: string;
  expressionNode: MathNode;
  symbols: string[];
  functionNames: string[];
  targetInfo: ParsedFormulaTargetInfoModel;
  equationCount: number;
  dependentVariables: string[];
  resolutionSteps: string[];
}

export interface FormulaScenarioFeatureModel {
  particleStrategy: FormulaScenarioParticleStrategyModel;
  usesTime: boolean;
  usesTrig: boolean;
  usesState: boolean;
  usesInteraction: boolean;
  symbols: string[];
  functionNames: string[];
}

export interface FormulaScenarioClassificationModel {
  moduleId: string;
  domain: PhysicsDomainModel;
  family: string;
  displayLabel: string;
  solverStrategy: FormulaSolverStrategyModel;
  visualStrategy: FormulaVisualStrategyModel;
  supportStatus: PhysicsSupportStatusModel;
  confidence: number;
  reasons: string[];
}

export interface PhysicsDomainModuleModel {
  id: string;
  descriptor: PhysicsDomainDescriptorModel;
  canHandle(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): boolean;
  classify(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
  ): FormulaScenarioClassificationModel | null;
  extractParameters(
    parsed: ParsedFormulaModel,
    features: FormulaScenarioFeatureModel,
    fallbackDefinitions: FormulaParameterDefinitionModel[],
  ): FormulaParameterDefinitionModel[];
}

export type FormulaDomainModuleModel = PhysicsDomainModuleModel;

export interface FormulaScenarioProgramContract {
  analysis: FormulaScenarioAnalysisModel;
  evaluateScalar(scope: Record<string, number>): number;
}

export interface FormulaScenarioSolverContextModel {
  validationDeltaTime: number;
  maxTrailPoints: number;
  maxAbsoluteCoordinate: number;
}

export interface FormulaScenarioSolverModel {
  id: string;
  supports(analysis: FormulaScenarioAnalysisModel): boolean;
  createValidationScope(
    analysis: FormulaScenarioAnalysisModel,
    config: FormulaScenarioConfigModel,
    context: FormulaScenarioSolverContextModel,
  ): Record<string, number>;
  createInitialState(
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel;
  step(
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    program: FormulaScenarioProgramContract,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel;
}

export interface FormulaSceneVisualizerModel {
  id: string;
  supports(analysis: FormulaScenarioAnalysisModel): boolean;
  buildScene(
    analysis: FormulaScenarioAnalysisModel,
    state: FormulaScenarioStateModel,
  ): FormulaScenarioVisualSceneModel;
}

export interface PhysicsDomainDescriptorModel {
  domain: PhysicsDomainModel;
  label: string;
  status: PhysicsSupportStatusModel;
  notes: string;
}

export interface PhysicsGuidedScenarioDescriptorModel {
  id: string;
  domain: Extract<
    PhysicsDomainModel,
    'dynamics' | 'optics' | 'electromagnetism' | 'thermodynamics'
  >;
  label: string;
  notes: string;
}

export interface PhysicsDomainRegistryModel {
  getDomains(): readonly PhysicsDomainDescriptorModel[];
}

export const FORMULA_ENGINE_DOMAIN_CATALOG: PhysicsDomainDescriptorModel[] = [
  {
    domain: 'kinematics',
    label: 'Cinematica',
    status: 'implemented',
    notes: 'Formulas diretas de posicao, velocidade e trajetorias simples.',
  },
  {
    domain: 'dynamics',
    label: 'Dinamica',
    status: 'implemented',
    notes: 'Aceleracao, forca e integracao numerica de um corpo.',
  },
  {
    domain: 'oscillation',
    label: 'Oscilacao',
    status: 'implemented',
    notes: 'Movimentos periodicos e sistemas com padrao oscilatorio.',
  },
  {
    domain: 'gravitation',
    label: 'Gravitacao',
    status: 'implemented',
    notes: 'Interacao simples entre dois corpos com lei de forca.',
  },
  {
    domain: 'generic',
    label: 'Expressoes genericas',
    status: 'implemented',
    notes: 'Fallback seguro para formulas fora dos dominios especializados.',
  },
  {
    domain: 'waves',
    label: 'Ondas',
    status: 'implemented',
    notes: 'Ondas viajantes simples com propagacao, amplitude e frequencia.',
  },
  {
    domain: 'thermodynamics',
    label: 'Termodinamica',
    status: 'implemented',
    notes: 'Gas ideal simples e compressao visual com particulas em recipiente.',
  },
  {
    domain: 'optics',
    label: 'Optica',
    status: 'implemented',
    notes: 'Cenarios guiados de reflexao, refracao e lente convergente simples.',
  },
  {
    domain: 'electromagnetism',
    label: 'Eletromagnetismo',
    status: 'implemented',
    notes: 'Lei de Coulomb, campo eletrico simples, vetores e linhas de campo.',
  },
];

export const PHYSICS_GUIDED_SCENARIO_CATALOG: PhysicsGuidedScenarioDescriptorModel[] = [
  {
    id: 'dynamics-incline',
    domain: 'dynamics',
    label: 'Plano inclinado',
    notes: 'Peso total e componentes paralela e perpendicular no plano.',
  },
  {
    id: 'optics-reflection',
    domain: 'optics',
    label: 'Reflexao',
    notes: 'Raio incidente, normal e angulo refletido.',
  },
  {
    id: 'optics-refraction',
    domain: 'optics',
    label: 'Refracao',
    notes: 'Mudanca de meio e desvio do raio.',
  },
  {
    id: 'optics-lens',
    domain: 'optics',
    label: 'Lente simples',
    notes: 'Convergencia e divergencia de raios.',
  },
  {
    id: 'electro-coulomb',
    domain: 'electromagnetism',
    label: 'Lei de Coulomb',
    notes: 'Forca eletrica entre duas cargas.',
  },
  {
    id: 'electro-field',
    domain: 'electromagnetism',
    label: 'Campo eletrico',
    notes: 'Vetores de campo em torno de cargas.',
  },
  {
    id: 'thermo-gas',
    domain: 'thermodynamics',
    label: 'Gas ideal',
    notes: 'Relacao simplificada entre pressao, volume e temperatura.',
  },
  {
    id: 'thermo-compression',
    domain: 'thermodynamics',
    label: 'Compressao',
    notes: 'Recipiente e densidade variando no tempo.',
  },
];
