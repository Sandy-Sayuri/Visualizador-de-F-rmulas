import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SimulationCardComponent } from '../../components/simulation-card/simulation-card.component';
import { PhysicsDomainModel } from '../../models/formula-engine.model';
import { SimulationLibraryItemModel } from '../../models/simulation-library-item.model';
import { SimulationsFacade } from '../../services/simulations.facade';
import { SimulationLibraryViewService } from '../../services/simulation-library-view.service';

type LibraryDomainFilter = 'all' | 'manual' | PhysicsDomainModel;

interface LibraryDomainOption {
  value: LibraryDomainFilter;
  label: string;
}

@Component({
  selector: 'app-simulation-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SimulationCardComponent],
  templateUrl: './simulation-list-page.component.html',
  styleUrl: './simulation-list-page.component.scss',
})
export class SimulationListPageComponent implements OnInit {
  readonly facade = inject(SimulationsFacade);
  private readonly libraryView = inject(SimulationLibraryViewService);
  private readonly router = inject(Router);
  readonly searchTerm = signal('');
  readonly selectedDomain = signal<LibraryDomainFilter>('all');
  readonly libraryItems = computed(() =>
    this.libraryView.buildItems(this.facade.simulations()),
  );
  readonly summary = computed(() => {
    const items = this.libraryItems();
    const formulaItems = items.filter((item) => item.source === 'formula');
    const manualItems = items.filter((item) => item.source === 'manual');
    const activeDomains = new Set(
      formulaItems
        .map((item) => item.domain)
        .filter((domain): domain is PhysicsDomainModel => domain !== null),
    );

    return {
      total: items.length,
      formulas: formulaItems.length,
      manual: manualItems.length,
      domains: activeDomains.size,
      guided: formulaItems.filter((item) => item.isGuided).length,
    };
  });
  readonly domainOptions = computed<LibraryDomainOption[]>(() => {
    const items = this.libraryItems();
    const manualItems = items.some((item) => item.source === 'manual');
    const domainMap = new Map<PhysicsDomainModel, string>();

    items.forEach((item) => {
      if (item.domain) {
        domainMap.set(item.domain, item.domainLabel);
      }
    });

    const options: LibraryDomainOption[] = [{ value: 'all', label: 'Todos' }];

    [...domainMap.entries()]
      .sort((left, right) => left[1].localeCompare(right[1]))
      .forEach(([value, label]) => options.push({ value, label }));

    if (manualItems) {
      options.push({ value: 'manual', label: 'Manuais' });
    }

    return options;
  });
  readonly filteredItems = computed<SimulationLibraryItemModel[]>(() => {
    const normalizedSearch = this.searchTerm().trim().toLocaleLowerCase();
    const selectedDomain = this.selectedDomain();

    return this.libraryItems().filter((item) => {
      const matchesSearch =
        !normalizedSearch || item.searchText.includes(normalizedSearch);
      const matchesDomain =
        selectedDomain === 'all'
          ? true
          : selectedDomain === 'manual'
            ? item.source === 'manual'
            : item.domain === selectedDomain;

      return matchesSearch && matchesDomain;
    });
  });

  ngOnInit(): void {
    this.facade.loadSimulations();
  }

  updateSearch(term: string): void {
    this.searchTerm.set(term);
  }

  selectDomain(domain: LibraryDomainFilter): void {
    this.selectedDomain.set(domain);
  }

  openDetails(id: string): void {
    void this.router.navigate(['/simulations', id]);
  }

  removeSimulation(id: string): void {
    const shouldDelete = window.confirm(
      'Deseja remover este experimento do OrbitLab?',
    );

    if (!shouldDelete) {
      return;
    }

    this.facade.deleteSimulation(id).subscribe();
  }
}
