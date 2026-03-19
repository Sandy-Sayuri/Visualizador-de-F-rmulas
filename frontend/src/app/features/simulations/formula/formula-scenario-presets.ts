export interface FormulaPresetModel {
  id: string;
  label: string;
  simulationName: string;
  formula: string;
  primaryLabel: string;
  secondaryLabel: string;
  summary: string;
}

export const FORMULA_SCENARIO_PRESETS: FormulaPresetModel[] = [
  {
    id: 'uniform-motion',
    label: 'MRU',
    simulationName: 'Movimento uniforme',
    formula: 'x = x0 + v*t',
    primaryLabel: 'Particula',
    secondaryLabel: 'Referencia',
    summary: 'Uma particula segue em linha reta com velocidade constante.',
  },
  {
    id: 'vertical-launch',
    label: 'Queda livre',
    simulationName: 'Lancamento vertical',
    formula: 'y = v0*t - (g*t^2)/2',
    primaryLabel: 'Corpo',
    secondaryLabel: 'Solo',
    summary: 'Altura e aceleracao gravitam para uma unica trajetoria vertical.',
  },
  {
    id: 'harmonic',
    label: 'Oscilacao',
    simulationName: 'Oscilacao harmonica',
    formula: 'x = A*cos(w*t)',
    primaryLabel: 'Oscilador',
    secondaryLabel: 'Centro',
    summary: 'O sistema alterna entre extremos e revela um padrao periodico.',
  },
  {
    id: 'gravity',
    label: 'Gravidade',
    simulationName: 'Dois corpos gravitacionais',
    formula: 'F = G * (m1 * m2) / r^2',
    primaryLabel: 'Corpo 1',
    secondaryLabel: 'Corpo 2',
    summary: 'Duas particulas interagem e mostram forca, rastro e aproximacao.',
  },
];
