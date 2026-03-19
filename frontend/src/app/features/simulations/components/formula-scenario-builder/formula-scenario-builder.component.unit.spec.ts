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
});
