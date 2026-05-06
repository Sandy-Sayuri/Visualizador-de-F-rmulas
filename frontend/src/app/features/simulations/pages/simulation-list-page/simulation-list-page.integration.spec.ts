import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/config/api.config';
import { SimulationListPageComponent } from './simulation-list-page.component';

describe('SimulationListPageComponent integration', () => {
  let fixture: ComponentFixture<SimulationListPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationListPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost:3000/api',
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SimulationListPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads simulations and renders the list through facade + service', () => {
    fixture.detectChanges();

    const request = httpMock.expectOne('http://localhost:3000/api/simulations');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 'sim-42',
        name: 'Formula Lab',
        description:
          'Movimento em linha reta\n\n[OrbitLab:FormulaScenario] {"version":1,"config":{"formula":"x = x0 + v*t","parameterValues":{"x0":-180,"v":42},"primaryLabel":"Particula","secondaryLabel":"Referencia","primaryColor":"#7ce6ff","secondaryColor":"#f4c66a","particleRadius":8,"visualParticleCount":8}}',
        bodies: [],
        createdAt: '2026-03-19T00:00:00.000Z',
        updatedAt: '2026-03-19T00:00:00.000Z',
      },
      {
        id: 'sim-21',
        name: 'Manual Sandbox',
        description: 'Cena criada manualmente',
        bodies: [],
        createdAt: '2026-03-18T00:00:00.000Z',
        updatedAt: '2026-03-18T00:00:00.000Z',
      },
    ]);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Formula Lab');
    expect(element.textContent).toContain('Manual Sandbox');
    expect(element.textContent).toContain('x = x0 + v*t');
    expect(element.textContent).toContain('Cinematica');
    expect(element.textContent).not.toContain('[OrbitLab:FormulaScenario]');
    expect(element.querySelectorAll('app-simulation-card').length).toBe(2);

    const searchInput = element.querySelector(
      '[data-testid="library-search"]',
    ) as HTMLInputElement;
    searchInput.value = 'manual';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(element.textContent).toContain('Manual Sandbox');
    expect(element.textContent).not.toContain('Formula Lab');
    expect(element.querySelectorAll('app-simulation-card').length).toBe(1);
  });
});
