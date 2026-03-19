import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SimulationHomePageComponent } from './simulation-home-page.component';

describe('SimulationHomePageComponent integration', () => {
  let fixture: ComponentFixture<SimulationHomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationHomePageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SimulationHomePageComponent);
    fixture.detectChanges();
  });

  it('renders the formula-first home without any save action', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Entrada principal');
    expect(element.textContent).not.toContain('Formulas fisicas que viram movimento');
    expect(element.textContent).not.toContain('100% local no navegador');
    expect(element.textContent).not.toContain('Formulas prontas');
    expect(element.querySelector('[data-testid="save-formula-scenario"]')).toBeNull();
  });

  it('keeps the local builder interactive on the home screen', () => {
    const element: HTMLElement = fixture.nativeElement;
    const formulaInput = element.querySelector(
      '[data-testid="formula-main-input"]',
    ) as HTMLTextAreaElement;
    const analyzeButton = element.querySelector(
      '[data-testid="detect-formula-parameters"]',
    ) as HTMLButtonElement;

    formulaInput.value = 'F = G * (m1 * m2) / r^2';
    formulaInput.dispatchEvent(new Event('input'));
    analyzeButton.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Interacao gravitacional');
    expect(
      element.querySelector('[data-testid="formula-param-G"]'),
    ).not.toBeNull();
  });
});
