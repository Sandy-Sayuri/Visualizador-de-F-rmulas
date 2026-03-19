import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormulaInputPanelComponent } from './formula-input-panel.component';

describe('FormulaInputPanelComponent', () => {
  let fixture: ComponentFixture<FormulaInputPanelComponent>;
  let component: FormulaInputPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulaInputPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormulaInputPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits a formula config when the user applies the form', () => {
    spyOn(component.applyRequested, 'emit');

    component.form.controls.objectName.setValue('Spring Probe');
    component.form.controls.accelerationXFormula.setValue('-0.4 * x - 0.1 * vx');
    component.form.controls.accelerationYFormula.setValue('0');

    component.submitApply();

    expect(component.applyRequested.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        objectName: 'Spring Probe',
        accelerationXFormula: '-0.4 * x - 0.1 * vx',
        accelerationYFormula: '0',
      }),
    );
  });
});
