import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';

import { CanvasDecorationModel, CanvasLegendItemModel } from '../../models/canvas-decoration.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';
import { SimulationCanvasRendererService } from '../../rendering/simulation-canvas-renderer.service';

const DEFAULT_LEGEND_ITEMS: CanvasLegendItemModel[] = [
  { key: 'velocity', tone: 'velocity', label: 'Velocidade' },
  { key: 'force', tone: 'force', label: 'Forca' },
  { key: 'trail', tone: 'trail', label: 'Rastro' },
];

type SimulationCanvasViewMode = '2d' | '3d';

@Component({
  selector: 'app-simulation-canvas',
  standalone: true,
  templateUrl: './simulation-canvas.component.html',
  styleUrl: './simulation-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulationCanvasComponent implements AfterViewInit, OnChanges {
  private readonly renderer = inject(SimulationCanvasRendererService);

  @Input() bodies: RuntimeBodyModel[] = [];
  @Input() selectedBodyId: string | null = null;
  @Input() decorations: CanvasDecorationModel[] = [];
  @Input() legendItems: CanvasLegendItemModel[] = DEFAULT_LEGEND_ITEMS;
  @Input() minimalChrome = false;
  @Input() allowViewToggle = false;
  @Input() emptyMessage = 'Adicione elementos para visualizar a cena fisica.';
  @Input() showVectors = true;
  @Input() showTrails = true;

  @Output() bodySelected = new EventEmitter<string>();

  @ViewChild('sceneCanvas')
  private canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly viewMode = signal<SimulationCanvasViewMode>('2d');

  ngAfterViewInit(): void {
    this.renderScene();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['bodies'] ||
      changes['selectedBodyId'] ||
      changes['decorations'] ||
      changes['showVectors'] ||
      changes['showTrails'] ||
      changes['allowViewToggle']
    ) {
      this.renderScene();
    }
  }

  toggleViewMode(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.viewMode.update((currentMode) => (currentMode === '2d' ? '3d' : '2d'));
    this.renderScene();
  }

  selectBody(event: MouseEvent): void {
    if (!this.canvasRef) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const nearestBody = this.renderer.pickBody(
      { x: pointerX, y: pointerY },
      {
        bodies: this.bodies,
        decorations: this.decorations,
        viewMode: this.viewMode(),
      },
      canvas,
    );

    if (nearestBody) {
      this.bodySelected.emit(nearestBody.id);
    }
  }

  resolveLegendLabel(item: CanvasLegendItemModel): string {
    if (item.label) {
      return item.label;
    }

    switch (item.tone) {
      case 'ray':
        return this.minimalChrome ? 'Raio' : 'Raios';
      case 'field':
        return this.minimalChrome ? 'Campo' : 'Campo';
      case 'velocity':
        return this.minimalChrome ? 'Vel' : 'Velocidade';
      case 'force':
        return this.minimalChrome ? 'Forca' : 'Forca';
      case 'trail':
        return 'Rastro';
      case 'prediction':
        return this.minimalChrome ? 'Prev' : 'Previsao';
      case 'pulse':
        return this.minimalChrome ? 'Pulso' : 'Pulso';
      case 'wake':
        return this.minimalChrome ? 'Fluxo' : 'Fluxo';
      case 'anchor':
        return this.minimalChrome ? 'Centro' : 'Centro';
      case 'comparison':
        return this.minimalChrome ? 'Comp' : 'Comparacao';
      case 'interaction':
        return this.minimalChrome ? 'Corpos' : 'Interacao';
      case 'pattern':
        return this.minimalChrome ? 'Padrao' : 'Padrao';
      default:
        return 'Cena';
    }
  }

  private renderScene(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    this.renderer.render(canvas, {
      bodies: this.bodies,
      selectedBodyId: this.selectedBodyId,
      decorations: this.decorations,
      showVectors: this.showVectors,
      showTrails: this.showTrails,
      viewMode: this.viewMode(),
    });
  }
}
