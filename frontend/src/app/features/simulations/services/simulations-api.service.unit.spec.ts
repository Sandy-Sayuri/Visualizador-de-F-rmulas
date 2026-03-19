import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { SimulationsApiService } from './simulations-api.service';

describe('SimulationsApiService', () => {
  let service: SimulationsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SimulationsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost:3000/api',
        },
      ],
    });

    service = TestBed.inject(SimulationsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists simulations from the backend API', () => {
    service.list().subscribe((simulations) => {
      expect(simulations).toHaveSize(1);
      expect(simulations[0].name).toBe('Solar Lab');
    });

    const request = httpMock.expectOne('http://localhost:3000/api/simulations');
    expect(request.request.method).toBe('GET');

    request.flush([
      {
        id: 'sim-1',
        name: 'Solar Lab',
        description: 'Demo',
        bodies: [],
        createdAt: '2026-03-19T00:00:00.000Z',
        updatedAt: '2026-03-19T00:00:00.000Z',
      },
    ]);
  });
});
