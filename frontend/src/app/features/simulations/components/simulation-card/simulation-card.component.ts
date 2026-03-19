import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SimulationModel } from '../../models/simulation.model';

@Component({
  selector: 'app-simulation-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './simulation-card.component.html',
  styleUrl: './simulation-card.component.scss',
})
export class SimulationCardComponent {
  @Input({ required: true }) simulation!: SimulationModel;

  @Output() viewRequested = new EventEmitter<string>();
  @Output() deleteRequested = new EventEmitter<string>();

  requestView(): void {
    this.viewRequested.emit(this.simulation.id);
  }

  requestDelete(): void {
    this.deleteRequested.emit(this.simulation.id);
  }
}
