import { TestBed } from '@angular/core/testing';

import { FormulaMetadataService } from './formula-metadata.service';

describe('FormulaMetadataService', () => {
  let service: FormulaMetadataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormulaMetadataService],
    });

    service = TestBed.inject(FormulaMetadataService);
  });

  it('embeds and extracts formula config from the description', () => {
    const description = service.embedConfig('Descricao base', {
      objectName: 'Probe',
      color: '#7ce6ff',
      mass: 10,
      radius: 6,
      initialPosition: { x: 20, y: 10 },
      initialVelocity: { x: 1, y: 3 },
      accelerationXFormula: '-0.2 * x',
      accelerationYFormula: '-0.3 * y',
    });

    const extracted = service.extractConfig(description);

    expect(extracted.cleanDescription).toBe('Descricao base');
    expect(extracted.config?.objectName).toBe('Probe');
    expect(extracted.config?.accelerationYFormula).toBe('-0.3 * y');
  });
});
