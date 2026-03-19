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
        name: 'Orbit Sandbox',
        description: 'Integration flow',
        bodies: [],
        createdAt: '2026-03-19T00:00:00.000Z',
        updatedAt: '2026-03-19T00:00:00.000Z',
      },
    ]);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Orbit Sandbox');
    expect(element.querySelectorAll('app-simulation-card').length).toBe(1);
  });
});
