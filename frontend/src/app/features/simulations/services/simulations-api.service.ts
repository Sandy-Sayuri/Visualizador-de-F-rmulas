import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateSimulationPayload } from '../models/create-simulation.model';
import { SimulationModel } from '../models/simulation.model';

@Injectable({
  providedIn: 'root',
})
export class SimulationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(): Observable<SimulationModel[]> {
    return this.http.get<SimulationModel[]>(`${this.apiBaseUrl}/simulations`);
  }

  getById(id: string): Observable<SimulationModel> {
    return this.http.get<SimulationModel>(`${this.apiBaseUrl}/simulations/${id}`);
  }

  create(payload: CreateSimulationPayload): Observable<SimulationModel> {
    return this.http.post<SimulationModel>(
      `${this.apiBaseUrl}/simulations`,
      payload,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/simulations/${id}`);
  }
}
