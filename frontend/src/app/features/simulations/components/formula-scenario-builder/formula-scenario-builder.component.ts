import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormRecord,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { SimulationCanvasComponent } from '../simulation-canvas/simulation-canvas.component';
import { FormulaScenarioAnalyzerService } from '../../formula/formula-scenario-analyzer.service';
import {
  FORMULA_ENGINE_DOMAIN_CATALOG,
  PHYSICS_GUIDED_SCENARIO_CATALOG,
  PhysicsGuidedScenarioDescriptorModel,
  PhysicsDomainDescriptorModel,
} from '../../models/formula-engine.model';
import {
  FORMULA_SCENARIO_PRESETS,
  FormulaPresetModel,
} from '../../formula/formula-scenario-presets';
import {
  FormulaScenarioAnalysisModel,
  FormulaScenarioConfigModel,
  FormulaScenarioDraftModel,
} from '../../models/formula-scenario.model';
import { FormulaScenarioRunnerService } from '../../services/formula-scenario-runner.service';

type FormulaScenarioBuilderFormGroup = FormGroup<{
  simulationName: FormControl<string>;
  description: FormControl<string>;
  formula: FormControl<string>;
  primaryLabel: FormControl<string>;
  secondaryLabel: FormControl<string>;
  primaryColor: FormControl<string>;
  secondaryColor: FormControl<string>;
  particleRadius: FormControl<number>;
  parameters: FormRecord<FormControl<number>>;
}>;

@Component({
  selector: 'app-formula-scenario-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SimulationCanvasComponent],
  templateUrl: './formula-scenario-builder.component.html',
  styleUrl: './formula-scenario-builder.component.scss',
  providers: [FormulaScenarioRunnerService],
})
export class FormulaScenarioBuilderComponent implements OnChanges {
  readonly speedSteps = [1, 2, 4, 8];
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly analyzer = inject(FormulaScenarioAnalyzerService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() initialDraft: FormulaScenarioDraftModel | null = null;
  @Input() submitting = false;
  @Input() allowSave = true;
  @Input() saveLabel = 'Salvar simulacao';

  @Output() saved = new EventEmitter<FormulaScenarioDraftModel>();

  readonly runner = inject(FormulaScenarioRunnerService);

  readonly analysis = signal<FormulaScenarioAnalysisModel | null>(null);
  readonly formulaError = signal<string | null>(null);
  readonly parameterDefinitions = computed(
    () => this.analysis()?.parameterDefinitions ?? [],
  );
  readonly speedLabel = computed(() => `${this.runner.timeScale()}x`);
  readonly categoryLabel = computed(() => {
    const analysis = this.analysis();

    if (!analysis) {
      return 'Analise pendente';
    }

    return analysis.classification.displayLabel;
  });

  readonly presets: FormulaPresetModel[] = FORMULA_SCENARIO_PRESETS;
  readonly supportedDomains: PhysicsDomainDescriptorModel[] =
    FORMULA_ENGINE_DOMAIN_CATALOG.filter((domain) => domain.status === 'implemented');
  readonly plannedDomains: PhysicsDomainDescriptorModel[] =
    FORMULA_ENGINE_DOMAIN_CATALOG.filter((domain) => domain.status === 'planned');
  readonly guidedScenarios: PhysicsGuidedScenarioDescriptorModel[] =
    PHYSICS_GUIDED_SCENARIO_CATALOG;
  readonly supportedShapes = [
    'x = x0 + v*t',
    'y = v0*t - (g*t^2)/2',
    'ax = -k*x/m',
    'x = A*cos(w*t)',
    'F = G*(m1*m2)/r^2',
    'y = A*sin(k*x - w*t)',
  ];

  readonly form: FormulaScenarioBuilderFormGroup = this.formBuilder.group({
    simulationName: this.formBuilder.control('Novo experimento fisico', {
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: this.formBuilder.control('', {
      validators: [Validators.maxLength(500)],
    }),
    formula: this.formBuilder.control('x = x0 + v*t', {
      validators: [Validators.required, Validators.maxLength(220)],
    }),
    primaryLabel: this.formBuilder.control('Particula', {
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    secondaryLabel: this.formBuilder.control('Corpo 2', {
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    primaryColor: this.formBuilder.control('#7ce6ff', {
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    secondaryColor: this.formBuilder.control('#f4c66a', {
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    particleRadius: this.formBuilder.control(8, {
      validators: [Validators.required, Validators.min(1)],
    }),
    parameters: new FormRecord<FormControl<number>>({}),
  });

  constructor() {
    this.form.controls.formula.valueChanges
      .pipe(
        debounceTime(180),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.detectParameters(true));

    this.loadPreset(this.presets[0]);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialDraft'] && this.initialDraft) {
      this.patchDraft(this.initialDraft);
    }
  }

  loadPreset(preset: FormulaPresetModel): void {
    this.form.patchValue({
      simulationName: preset.simulationName,
      formula: preset.formula,
      primaryLabel: preset.primaryLabel,
      secondaryLabel: preset.secondaryLabel,
    });
    this.preparePreview();
  }

  detectParameters(skipPreview = false): void {
    const formula = this.form.controls.formula.getRawValue();

    try {
      const analysis = this.analyzer.analyze(formula);
      this.analysis.set(analysis);
      this.formulaError.set(null);
      this.syncParameterControls(analysis, this.form.controls.parameters.getRawValue());

      if (!skipPreview) {
        this.applyPreview();
      }
    } catch (error) {
      this.analysis.set(null);
      this.syncParameterControls(null, {});
      this.formulaError.set(error instanceof Error ? error.message : 'Formula invalida.');
    }
  }

  applyPreview(): boolean {
    const config = this.toConfig();

    if (!config) {
      return false;
    }

    this.runner.loadConfig(config);
    return !this.runner.errorMessage();
  }

  startOrPause(): void {
    if (this.runner.isRunning()) {
      this.runner.pause();
      return;
    }

    if (!this.preparePreview()) {
      return;
    }

    this.runner.play();
  }

  save(): void {
    const draft = this.toDraft();

    if (!draft) {
      this.form.markAllAsTouched();
      return;
    }

    this.preparePreview();

    if (!this.runner.errorMessage()) {
      this.saved.emit(draft);
    }
  }

  isGravityCategory(): boolean {
    return this.analysis()?.particleStrategy === 'pair';
  }

  parameterControl(key: string): FormControl<number> {
    return this.form.controls.parameters.controls[key];
  }

  increaseTimeScale(): void {
    const currentScale = this.runner.timeScale();
    const nextScale =
      this.speedSteps.find((speed) => speed > currentScale) ?? currentScale;

    this.runner.setTimeScale(nextScale);
  }

  decreaseTimeScale(): void {
    const currentScale = this.runner.timeScale();
    const nextScale =
      [...this.speedSteps]
        .reverse()
        .find((speed) => speed < currentScale) ?? currentScale;

    this.runner.setTimeScale(nextScale);
  }

  private patchDraft(draft: FormulaScenarioDraftModel): void {
    this.form.patchValue({
      simulationName: draft.simulationName,
      description: draft.description ?? '',
      formula: draft.config.formula,
      primaryLabel: draft.config.primaryLabel,
      secondaryLabel: draft.config.secondaryLabel,
      primaryColor: draft.config.primaryColor,
      secondaryColor: draft.config.secondaryColor,
      particleRadius: draft.config.particleRadius,
    });
    this.detectParameters(true);
    this.syncParameterControls(
      this.analysis(),
      draft.config.parameterValues,
    );
    this.preparePreview();
  }

  private syncParameterControls(
    analysis: FormulaScenarioAnalysisModel | null,
    currentValues: Record<string, number>,
  ): void {
    const parametersGroup = this.form.controls.parameters;
    const nextKeys = new Set(analysis?.parameterDefinitions.map((parameter) => parameter.key) ?? []);

    Object.keys(parametersGroup.controls).forEach((key) => {
      if (!nextKeys.has(key)) {
        parametersGroup.removeControl(key);
      }
    });

    analysis?.parameterDefinitions.forEach((parameter) => {
      const nextValue = currentValues[parameter.key] ?? parameter.defaultValue;
      const existingControl = parametersGroup.controls[parameter.key];

      if (existingControl) {
        existingControl.setValue(nextValue);
        return;
      }

      parametersGroup.addControl(
        parameter.key,
        this.formBuilder.control(nextValue, {
          validators: [Validators.required],
        }),
      );
    });
  }

  private toConfig(): FormulaScenarioConfigModel | null {
    if (!this.analysis()) {
      return null;
    }

    return {
      formula: this.form.controls.formula.getRawValue().trim(),
      parameterValues: this.form.controls.parameters.getRawValue(),
      primaryLabel: this.form.controls.primaryLabel.getRawValue().trim(),
      secondaryLabel: this.form.controls.secondaryLabel.getRawValue().trim(),
      primaryColor: this.form.controls.primaryColor.getRawValue().trim(),
      secondaryColor: this.form.controls.secondaryColor.getRawValue().trim(),
      particleRadius: this.form.controls.particleRadius.getRawValue(),
    };
  }

  private toDraft(): FormulaScenarioDraftModel | null {
    const config = this.toConfig();

    if (!config || this.form.invalid) {
      return null;
    }

    return {
      simulationName: this.form.controls.simulationName.getRawValue().trim(),
      description: this.form.controls.description.getRawValue().trim() || null,
      config,
    };
  }

  private preparePreview(): boolean {
    this.detectParameters(true);

    const config = this.toConfig();

    if (!config) {
      return false;
    }

    if (this.isLoadedConfig(config)) {
      return true;
    }

    return this.applyPreview();
  }

  private isLoadedConfig(config: FormulaScenarioConfigModel): boolean {
    const loadedConfig = this.runner.config();

    if (!loadedConfig) {
      return false;
    }

    return (
      loadedConfig.formula === config.formula &&
      loadedConfig.primaryLabel === config.primaryLabel &&
      loadedConfig.secondaryLabel === config.secondaryLabel &&
      loadedConfig.primaryColor === config.primaryColor &&
      loadedConfig.secondaryColor === config.secondaryColor &&
      loadedConfig.particleRadius === config.particleRadius &&
      this.haveSameParameters(
        loadedConfig.parameterValues,
        config.parameterValues,
      )
    );
  }

  private haveSameParameters(
    left: Record<string, number>,
    right: Record<string, number>,
  ): boolean {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && left[key] === right[key],
    );
  }
}
