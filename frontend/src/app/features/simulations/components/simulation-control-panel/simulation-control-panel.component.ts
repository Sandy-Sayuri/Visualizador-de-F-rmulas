import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CreateSimulationPayload } from '../../models/create-simulation.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';
import { Vector2Model } from '../../models/vector2.model';

type AddBodyFormGroup = FormGroup<{
  name: FormControl<string>;
  mass: FormControl<number>;
  radius: FormControl<number>;
  color: FormControl<string>;
  positionX: FormControl<number>;
  positionY: FormControl<number>;
  velocityX: FormControl<number>;
  velocityY: FormControl<number>;
}>;

@Component({
  selector: 'app-simulation-control-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './simulation-control-panel.component.html',
  styleUrl: './simulation-control-panel.component.scss',
})
export class SimulationControlPanelComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  @Input({ required: true }) runtimeBodies: RuntimeBodyModel[] = [];
  @Input() selectedBody: RuntimeBodyModel | null = null;
  @Input() isRunning = false;
  @Input() elapsedSeconds = 0;
  @Input() totalEnergy = 0;
  @Input() explanation = '';

  @Output() toggleRequested = new EventEmitter<void>();
  @Output() resetRequested = new EventEmitter<void>();
  @Output() randomRequested = new EventEmitter<void>();
  @Output() bodySelected = new EventEmitter<string>();
  @Output() massChanged = new EventEmitter<{ bodyId: string; mass: number }>();
  @Output() velocityChanged = new EventEmitter<{
    bodyId: string;
    velocity: Vector2Model;
  }>();
  @Output() bodyAdded = new EventEmitter<CreateSimulationPayload['bodies'][number]>();
  @Output() bodyRemoved = new EventEmitter<string>();

  readonly addBodyForm: AddBodyFormGroup = this.formBuilder.group({
    name: this.formBuilder.control('Nova orbita', {
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    mass: this.formBuilder.control(18, {
      validators: [Validators.required, Validators.min(0.0000001)],
    }),
    radius: this.formBuilder.control(8, {
      validators: [Validators.required, Validators.min(0.0000001)],
    }),
    color: this.formBuilder.control('#7ce6ff', {
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    positionX: this.formBuilder.control(160),
    positionY: this.formBuilder.control(0),
    velocityX: this.formBuilder.control(0),
    velocityY: this.formBuilder.control(18),
  });

  requestMassUpdate(bodyId: string, mass: number): void {
    if (Number.isFinite(mass) && mass > 0) {
      this.massChanged.emit({ bodyId, mass });
    }
  }

  requestVelocityUpdate(bodyId: string, nextVelocity: Vector2Model): void {
    this.velocityChanged.emit({
      bodyId,
      velocity: nextVelocity,
    });
  }

  submitNewBody(): void {
    if (this.addBodyForm.invalid) {
      this.addBodyForm.markAllAsTouched();
      return;
    }

    const value = this.addBodyForm.getRawValue();
    this.bodyAdded.emit({
      name: value.name.trim(),
      mass: value.mass,
      radius: value.radius,
      color: value.color.trim(),
      position: {
        x: value.positionX,
        y: value.positionY,
      },
      velocity: {
        x: value.velocityX,
        y: value.velocityY,
      },
    });
  }

  forceMagnitude(body: RuntimeBodyModel): number {
    return Math.hypot(body.force.x, body.force.y);
  }
}
