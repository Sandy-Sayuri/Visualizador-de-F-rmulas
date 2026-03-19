import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { FormulaScenarioBuilderComponent } from '../../components/formula-scenario-builder/formula-scenario-builder.component';

@Component({
  selector: 'app-simulation-home-page',
  standalone: true,
  imports: [CommonModule, FormulaScenarioBuilderComponent],
  templateUrl: './simulation-home-page.component.html',
  styleUrl: './simulation-home-page.component.scss',
})
export class SimulationHomePageComponent {}
