import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulationControlPanelComponent } from './simulation-control-panel.component';

describe('SimulationControlPanelComponent', () => {
  let fixture: ComponentFixture<SimulationControlPanelComponent>;
  let component: SimulationControlPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationControlPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SimulationControlPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('runtimeBodies', []);
    fixture.detectChanges();
  });

  it('emits a new body payload from the live edit form', () => {
    spyOn(component.bodyAdded, 'emit');

    component.addBodyForm.controls.name.setValue('Late Moon');
    component.addBodyForm.controls.mass.setValue(16);
    component.addBodyForm.controls.radius.setValue(6);
    component.addBodyForm.controls.color.setValue('#a6ff96');
    component.addBodyForm.controls.positionX.setValue(180);
    component.addBodyForm.controls.positionY.setValue(10);
    component.addBodyForm.controls.velocityX.setValue(-2);
    component.addBodyForm.controls.velocityY.setValue(14);

    component.submitNewBody();

    expect(component.bodyAdded.emit).toHaveBeenCalledWith({
      name: 'Late Moon',
      mass: 16,
      radius: 6,
      color: '#a6ff96',
      position: { x: 180, y: 10 },
      velocity: { x: -2, y: 14 },
    });
  });
});
