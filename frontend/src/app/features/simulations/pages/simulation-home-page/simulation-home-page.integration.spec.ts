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

    expect(element.textContent).toContain('Digite a formula e veja o movimento');
    expect(element.textContent).toContain('100% local');
    expect(element.textContent).not.toContain('Formulas prontas');
    expect(element.querySelector('[data-testid="save-formula-scenario"]')).toBeNull();
  });

  it('keeps the local builder interactive on the home screen', () => {
    const element: HTMLElement = fixture.nativeElement;
    const formulaInput = element.querySelector(
      '[data-testid="formula-main-input"]',
    ) as HTMLTextAreaElement;
    const startButton = element.querySelector(
      '[data-testid="toggle-formula-scenario"]',
    ) as HTMLButtonElement;

    formulaInput.value = 'F = G * (m1 * m2) / r^2';
    formulaInput.dispatchEvent(new Event('input'));
    startButton.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Gravitacao');
    expect(
      element.querySelector('[data-testid="formula-param-G"]'),
    ).not.toBeNull();
  });

  it('loads a preset when the top example chip is clicked', () => {
    const element: HTMLElement = fixture.nativeElement;
    const gravityChip = [...element.querySelectorAll('.preset-chip')].find((chip) =>
      chip.textContent?.includes('G * (m1 * m2) / r^2'),
    ) as HTMLButtonElement | undefined;

    gravityChip?.click();
    fixture.detectChanges();

    const formulaInput = element.querySelector(
      '[data-testid="formula-main-input"]',
    ) as HTMLTextAreaElement;

    expect(formulaInput.value).toContain('F = G * (m1 * m2) / r^2');
    expect(element.textContent).toContain('Gravitacao');
  });

  it('does not render separate analyze or simulate buttons in the form area', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelector('[data-testid="detect-formula-parameters"]'),
    ).toBeNull();
    expect(
      element.querySelector('[data-testid="apply-formula-scenario"]'),
    ).toBeNull();
  });
});
