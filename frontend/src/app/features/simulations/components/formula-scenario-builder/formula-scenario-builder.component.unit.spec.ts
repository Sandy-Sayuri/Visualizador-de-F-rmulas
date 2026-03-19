import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulaScenarioBuilderComponent } from './formula-scenario-builder.component';

describe('FormulaScenarioBuilderComponent', () => {
  let fixture: ComponentFixture<FormulaScenarioBuilderComponent>;
  let component: FormulaScenarioBuilderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulaScenarioBuilderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormulaScenarioBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('detects dynamic parameters from the formula', () => {
    component.form.controls.formula.setValue('x = x0 + v*t');
    component.detectParameters(true);
    fixture.detectChanges();

    expect(component.parameterDefinitions().map((parameter) => parameter.key)).toEqual([
      'x0',
      'v',
    ]);
  });

  it('accepts multiple equations and shows the resolved simulation formula', () => {
    component.form.controls.formula.setValue('F = m*a\na = g*sin(theta)');
    component.detectParameters(true);
    fixture.detectChanges();

    expect(component.analysis()?.target).toBe('ax');
    expect(component.parameterDefinitions().map((parameter) => parameter.key)).toEqual([
      'g',
      'theta',
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="resolved-formula-card"]'),
    ).not.toBeNull();
  });

  it('emits the draft when saving a valid formula scenario', () => {
    spyOn(component.saved, 'emit');

    component.form.controls.simulationName.setValue('Formula Demo');
    component.form.controls.formula.setValue('x = x0 + v*t');
    component.detectParameters(true);
    component.applyPreview();
    component.save();

    expect(component.saved.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        simulationName: 'Formula Demo',
        config: jasmine.objectContaining({
          formula: 'x = x0 + v*t',
        }),
      }),
    );
  });

  it('increases the runner time scale from the speed button', () => {
    component.increaseTimeScale();
    expect(component.runner.timeScale()).toBe(2);

    component.increaseTimeScale();
    expect(component.runner.timeScale()).toBe(4);
  });

  it('decreases the runner time scale from the speed button', () => {
    component.runner.setTimeScale(8);
    component.decreaseTimeScale();
    expect(component.runner.timeScale()).toBe(4);

    component.decreaseTimeScale();
    expect(component.runner.timeScale()).toBe(2);
  });

  it('switches to a guided optical preset without exposing the formula textarea', () => {
    const opticsPreset = component.presets.find((preset) => preset.id === 'optics-reflection');

    component.loadPreset(opticsPreset!);
    fixture.detectChanges();

    expect(component.isGuidedPreset()).toBeTrue();
    expect(component.analysis()?.classification.domain).toBe('optics');
    expect(component.parameterDefinitions().map((parameter) => parameter.key)).toEqual([
      'angleDeg',
      'sourceX',
      'sourceY',
    ]);
    const activeButton = fixture.nativeElement.querySelector(
      '.chip-button-active',
    ) as HTMLButtonElement | null;
    expect(activeButton?.textContent?.trim()).toBe('Reflexao');
  });

  it('loads the guided electromagnetism field preset with dynamic parameters', () => {
    const fieldPreset = component.presets.find((preset) => preset.id === 'electro-field');

    component.loadPreset(fieldPreset!);
    fixture.detectChanges();

    expect(component.isGuidedPreset()).toBeTrue();
    expect(component.analysis()?.classification.domain).toBe('electromagnetism');
    expect(component.parameterDefinitions().map((parameter) => parameter.key)).toEqual([
      'q1',
      'q2',
      'k',
      'x1',
      'y1',
      'x2',
      'y2',
    ]);
    expect(component.parameterControl('q1').value).toBe(2.4);
    expect(component.parameterControl('x2').value).toBe(210);
  });

  it('loads the guided inclined-plane preset with live decomposition values', () => {
    const inclinePreset = component.presets.find((preset) => preset.id === 'dynamics-incline');

    component.loadPreset(inclinePreset!);
    fixture.detectChanges();

    expect(component.isGuidedPreset()).toBeTrue();
    expect(component.analysis()?.classification.family).toBe('inclined-plane');
    expect(component.parameterDefinitions().map((parameter) => parameter.key)).toEqual([
      'mass',
      'angleDeg',
      'g',
    ]);
    expect(component.inclinedPlaneSnapshot()?.weightMagnitude).toBeCloseTo(117.72, 2);
    expect(
      fixture.nativeElement.querySelector('[data-testid="inclined-plane-insights"]'),
    ).not.toBeNull();
  });

  it('applies different defaults for Coulomb, Cargas e Campo', () => {
    const coulombPreset = component.presets.find((preset) => preset.id === 'electro-coulomb');
    const chargesPreset = component.presets.find((preset) => preset.id === 'electro-guided');
    const fieldPreset = component.presets.find((preset) => preset.id === 'electro-field');

    component.loadPreset(coulombPreset!);
    expect(component.parameterControl('q2').value).toBe(-1.2);
    expect(component.form.controls.primaryColor.getRawValue()).toBe('#ffb36c');

    component.loadPreset(chargesPreset!);
    expect(component.parameterControl('q2').value).toBe(1.2);
    expect(component.form.controls.secondaryColor.getRawValue()).toBe('#ffd166');

    component.loadPreset(fieldPreset!);
    expect(component.parameterControl('x1').value).toBe(0);
    expect(component.parameterControl('y2').value).toBe(70);
  });

  it('loads the thermodynamics gas preset with slider parameters', () => {
    const gasPreset = component.presets.find((preset) => preset.id === 'thermo-gas');

    component.loadPreset(gasPreset!);
    fixture.detectChanges();

    expect(component.isGuidedPreset()).toBeTrue();
    expect(component.analysis()?.classification.domain).toBe('thermodynamics');
    expect(component.parameterDefinitions().map((parameter) => parameter.key)).toEqual([
      'temperature',
      'volume',
      'particleCount',
    ]);
    expect(component.parameterDefinitions().every((parameter) => parameter.inputMode === 'range')).toBeTrue();
    expect(component.parameterControl('temperature').value).toBe(420);

    const activeButton = fixture.nativeElement.querySelector(
      '.chip-button-active',
    ) as HTMLButtonElement | null;
    expect(activeButton?.textContent?.trim()).toBe('Gas');
  });
});
