export interface FormulaPresetModel {
  id: string;
  label: string;
  simulationName: string;
  formula: string;
  heroText?: string;
  guided?: boolean;
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
  {
    id: 'wave',
    label: 'Onda',
    simulationName: 'Onda viajante',
    formula: 'y = A*sin(k*x - w*t)',
    primaryLabel: 'Frente de onda',
    secondaryLabel: 'Eixo',
    summary: 'Uma onda periodica se propaga no espaco com amplitude e frequencia.',
  },
  {
    id: 'optics-reflection',
    label: 'Reflexao',
    simulationName: 'Reflexao plana',
    formula: 'optics_reflection = 0',
    heroText: 'Optica: reflexao',
    guided: true,
    primaryLabel: 'Fonte',
    secondaryLabel: 'Superficie',
    summary: 'Um raio incide em uma superficie plana e reflete com angulos simetricos.',
  },
  {
    id: 'optics-refraction',
    label: 'Refracao',
    simulationName: 'Refracao simples',
    formula: 'optics_refraction = 0',
    heroText: 'Optica: refracao',
    guided: true,
    primaryLabel: 'Fonte',
    secondaryLabel: 'Interface',
    summary: 'O raio muda de direcao ao cruzar uma interface com indices diferentes.',
  },
  {
    id: 'optics-lens',
    label: 'Lente',
    simulationName: 'Lente convergente',
    formula: 'optics_lens = 0',
    heroText: 'Optica: lente',
    guided: true,
    primaryLabel: 'Fonte',
    secondaryLabel: 'Lente',
    summary: 'Raios atravessam uma lente convergente e se aproximam do foco.',
  },
];
