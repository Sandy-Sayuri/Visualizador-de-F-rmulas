import { TestBed } from '@angular/core/testing';

import { PhysicsDomainRegistryService } from './physics-domain-registry.service';

describe('PhysicsDomainRegistryService', () => {
  let service: PhysicsDomainRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PhysicsDomainRegistryService],
    });

    service = TestBed.inject(PhysicsDomainRegistryService);
  });

  it('registers implemented and planned domains for future expansion', () => {
    const domains = service.getDomains().map((domain) => ({
      key: domain.domain,
      status: domain.status,
    }));

    expect(domains).toContain(jasmine.objectContaining({ key: 'waves', status: 'implemented' }));
    expect(domains).toContain(
      jasmine.objectContaining({ key: 'optics', status: 'implemented' }),
    );
    expect(domains).toContain(
      jasmine.objectContaining({
        key: 'electromagnetism',
        status: 'implemented',
      }),
    );
    expect(domains).toContain(
      jasmine.objectContaining({
        key: 'thermodynamics',
        status: 'implemented',
      }),
    );
  });
});
