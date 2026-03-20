import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimulationCanvasComponent } from './simulation-canvas.component';

describe('SimulationCanvasComponent', () => {
  let fixture: ComponentFixture<SimulationCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationCanvasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SimulationCanvasComponent);
  });

  it('shows an empty-state message when there are no bodies', () => {
    fixture.componentRef.setInput('bodies', []);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain(
      'Adicione elementos para visualizar a cena fisica.',
    );
  });

  it('toggles the canvas into 3d mode when enabled', () => {
    fixture.componentRef.setInput('allowViewToggle', true);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector(
      '[data-testid="canvas-view-toggle"]',
    ) as HTMLButtonElement | null;

    expect(toggle).not.toBeNull();
    toggle?.click();
    fixture.detectChanges();

    expect(element.querySelector('.canvas-shell')?.classList.contains('mode-3d')).toBeTrue();
  });
});
