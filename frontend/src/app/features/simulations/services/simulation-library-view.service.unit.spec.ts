import { TestBed } from '@angular/core/testing';

import { SimulationModel } from '../models/simulation.model';
import { SimulationLibraryViewService } from './simulation-library-view.service';

describe('SimulationLibraryViewService', () => {
  let service: SimulationLibraryViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimulationLibraryViewService);
  });

  it('cleans embedded formula metadata and enriches the library item', () => {
    const simulation: SimulationModel = {
      id: 'sim-1',
      name: 'Formula Lab',
      description:
        'Movimento em linha reta\n\n[OrbitLab:FormulaScenario] {"version":1,"config":{"formula":"x = x0 + v*t","parameterValues":{"x0":-180,"v":42},"primaryLabel":"Particula","secondaryLabel":"Referencia","primaryColor":"#7ce6ff","secondaryColor":"#f4c66a","particleRadius":8,"visualParticleCount":8}}',
      bodies: [],
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:00:00.000Z',
    };

    const [item] = service.buildItems([simulation]);

    expect(item.description).toBe('Movimento em linha reta');
    expect(item.formulaPreview).toBe('x = x0 + v*t');
    expect(item.domain).toBe('kinematics');
    expect(item.domainLabel).toBe('Cinematica');
    expect(item.parameterCount).toBe(2);
    expect(item.searchText).not.toContain('[orbitlab:formulascenario]');
  });

  it('keeps manual simulations readable without formula metadata', () => {
    const simulation: SimulationModel = {
      id: 'sim-2',
      name: 'Manual Sandbox',
      description: 'Cena criada manualmente',
      bodies: [],
      createdAt: '2026-03-18T00:00:00.000Z',
      updatedAt: '2026-03-18T00:00:00.000Z',
    };

    const [item] = service.buildItems([simulation]);

    expect(item.source).toBe('manual');
    expect(item.domain).toBeNull();
    expect(item.domainLabel).toBe('Manual');
    expect(item.formulaPreview).toBeNull();
  });
});
