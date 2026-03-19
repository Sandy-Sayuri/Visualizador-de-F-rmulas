import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { FormulaSimulationConfigModel } from '../../models/formula-simulation-config.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';

type FormulaInputFormGroup = FormGroup<{
  objectName: FormControl<string>;
  color: FormControl<string>;
  mass: FormControl<number>;
  radius: FormControl<number>;
  positionX: FormControl<number>;
  positionY: FormControl<number>;
  velocityX: FormControl<number>;
  velocityY: FormControl<number>;
  accelerationXFormula: FormControl<string>;
  accelerationYFormula: FormControl<string>;
}>;

@Component({
  selector: 'app-formula-input-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formula-input-panel.component.html',
  styleUrl: './formula-input-panel.component.scss',
})
export class FormulaInputPanelComponent implements OnChanges {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  @Input() config: FormulaSimulationConfigModel | null = null;
  @Input() selectedBody: RuntimeBodyModel | null = null;
  @Input() errorMessage: string | null = null;
  @Input() isRunning = false;
  @Input() elapsedSeconds = 0;

  @Output() applyRequested = new EventEmitter<FormulaSimulationConfigModel>();
  @Output() toggleRequested = new EventEmitter<void>();
  @Output() resetRequested = new EventEmitter<void>();
  @Output() saveRequested = new EventEmitter<FormulaSimulationConfigModel>();

  readonly form: FormulaInputFormGroup = this.formBuilder.group({
    objectName: this.formBuilder.control('Formula Probe', {
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    color: this.formBuilder.control('#7ce6ff', {
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    mass: this.formBuilder.control(12, {
      validators: [Validators.required, Validators.min(0.0000001)],
    }),
    radius: this.formBuilder.control(8, {
      validators: [Validators.required, Validators.min(0.0000001)],
    }),
    positionX: this.formBuilder.control(140),
    positionY: this.formBuilder.control(0),
    velocityX: this.formBuilder.control(0),
    velocityY: this.formBuilder.control(18),
    accelerationXFormula: this.formBuilder.control('-0.08 * x - 0.12 * vx', {
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    accelerationYFormula: this.formBuilder.control('-0.08 * y - 0.12 * vy', {
      validators: [Validators.required, Validators.maxLength(120)],
    }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.form.patchValue({
        objectName: this.config.objectName,
        color: this.config.color,
        mass: this.config.mass,
        radius: this.config.radius,
        positionX: this.config.initialPosition.x,
        positionY: this.config.initialPosition.y,
        velocityX: this.config.initialVelocity.x,
        velocityY: this.config.initialVelocity.y,
        accelerationXFormula: this.config.accelerationXFormula,
        accelerationYFormula: this.config.accelerationYFormula,
      });
    }
  }

  submitApply(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.applyRequested.emit(this.toConfig());
  }

  submitSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saveRequested.emit(this.toConfig());
  }

  forceMagnitude(body: RuntimeBodyModel | null): number {
    if (!body) {
      return 0;
    }

    return Math.hypot(body.force.x, body.force.y);
  }

  private toConfig(): FormulaSimulationConfigModel {
    const value = this.form.getRawValue();

    return {
      objectName: value.objectName.trim(),
      color: value.color.trim(),
      mass: value.mass,
      radius: value.radius,
      initialPosition: {
        x: value.positionX,
        y: value.positionY,
      },
      initialVelocity: {
        x: value.velocityX,
        y: value.velocityY,
      },
      accelerationXFormula: value.accelerationXFormula.trim(),
      accelerationYFormula: value.accelerationYFormula.trim(),
    };
  }
}
