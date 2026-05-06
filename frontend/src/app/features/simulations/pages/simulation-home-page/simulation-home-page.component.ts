import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FormulaScenarioBuilderComponent } from '../../components/formula-scenario-builder/formula-scenario-builder.component';
import {
  FORMULA_SCENARIO_PRESETS,
  FormulaPresetModel,
} from '../../formula/formula-scenario-presets';

@Component({
  selector: 'app-simulation-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormulaScenarioBuilderComponent],
  templateUrl: './simulation-home-page.component.html',
  styleUrl: './simulation-home-page.component.scss',
})
export class SimulationHomePageComponent {
  @ViewChild(FormulaScenarioBuilderComponent)
  private builder?: FormulaScenarioBuilderComponent;

  readonly presets: FormulaPresetModel[] = FORMULA_SCENARIO_PRESETS;

  applyPreset(preset: FormulaPresetModel): void {
    this.builder?.loadPreset(preset);
  }
}
