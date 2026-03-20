import { Injectable } from '@angular/core';

import { CanvasDecorationModel } from '../models/canvas-decoration.model';
import { RuntimeBodyModel } from '../models/runtime-body.model';
import { Vector2Model } from '../models/vector2.model';

interface SceneScale {
  range: number;
  scale: number;
}

type CanvasViewMode = '2d' | '3d';

@Injectable({
  providedIn: 'root',
})
export class SimulationCanvasRendererService {
  render(
    canvas: HTMLCanvasElement,
    scene: {
      bodies: RuntimeBodyModel[];
      selectedBodyId: string | null;
      decorations: CanvasDecorationModel[];
      showVectors: boolean;
      showTrails: boolean;
      viewMode: CanvasViewMode;
    },
  ): void {
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const scale = this.computeScale(scene.bodies, scene.decorations, width, height);

    context.clearRect(0, 0, width, height);
    this.drawBackground(context, width, height, scene.viewMode);
    this.drawGrid(context, width, height, scene.viewMode);
    this.drawDecorations(
      context,
      width,
      height,
      scale,
      scene.decorations,
      scene.viewMode,
    );
    this.drawBodies(
      context,
      width,
      height,
      scale,
      scene.bodies,
      scene.selectedBodyId,
      scene.showVectors,
      scene.showTrails,
      scene.viewMode,
    );
  }

  pickBody(
    pointer: { x: number; y: number },
    scene: {
      bodies: RuntimeBodyModel[];
      decorations: CanvasDecorationModel[];
      viewMode: CanvasViewMode;
    },
    canvas: HTMLCanvasElement,
  ): RuntimeBodyModel | undefined {
    const scale = this.computeScale(
      scene.bodies,
      scene.decorations,
      canvas.width,
      canvas.height,
    );

    return scene.bodies.find((body) => {
      const point = this.toCanvasPoint(
        body.position,
        canvas.width,
        canvas.height,
        scale,
        scene.viewMode,
      );
      const radius = Math.max(4, Math.min(28, body.radius)) + 8;

      return Math.hypot(pointer.x - point.x, pointer.y - point.y) <= radius;
    });
  }

  private drawBackground(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    viewMode: CanvasViewMode,
  ): void {
    if (viewMode === '3d') {
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#02050f');
      gradient.addColorStop(0.45, '#091729');
      gradient.addColorStop(1, '#142b42');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const glow = context.createRadialGradient(
        width / 2,
        height * 0.18,
        12,
        width / 2,
        height * 0.18,
        width * 0.55,
      );
      glow.addColorStop(0, 'rgba(124, 230, 255, 0.24)');
      glow.addColorStop(1, 'rgba(124, 230, 255, 0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      return;
    }

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#020817');
    gradient.addColorStop(1, '#13233d');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  private drawGrid(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    viewMode: CanvasViewMode,
  ): void {
    if (viewMode === '3d') {
      const horizonY = height * 0.22;
      const floorY = height * 0.94;
      const vanishingX = width / 2;

      context.save();
      context.strokeStyle = 'rgba(157, 199, 255, 0.12)';
      context.lineWidth = 1;

      for (let index = 0; index <= 10; index += 1) {
        const startX = (width / 10) * index;
        context.beginPath();
        context.moveTo(startX, floorY);
        context.lineTo(vanishingX, horizonY);
        context.stroke();
        context.closePath();
      }

      for (let index = 0; index <= 6; index += 1) {
        const depth = index / 6;
        const y = horizonY + (floorY - horizonY) * depth * depth;
        const inset = width * 0.44 * (1 - depth);
        context.beginPath();
        context.moveTo(inset, y);
        context.lineTo(width - inset, y);
        context.stroke();
        context.closePath();
      }

      context.strokeStyle = 'rgba(244, 198, 106, 0.24)';
      context.beginPath();
      context.moveTo(0, horizonY);
      context.lineTo(width, horizonY);
      context.stroke();
      context.closePath();
      context.restore();
      return;
    }

    context.strokeStyle = 'rgba(157, 199, 255, 0.08)';
    context.lineWidth = 1;

    for (let x = 0; x <= width; x += 40) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
      context.closePath();
    }

    for (let y = 0; y <= height; y += 40) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
      context.closePath();
    }

    context.strokeStyle = 'rgba(244, 198, 106, 0.28)';
    context.beginPath();
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2, height);
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();
    context.closePath();
  }

  private drawDecorations(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: SceneScale,
    decorations: CanvasDecorationModel[],
    viewMode: CanvasViewMode,
  ): void {
    for (const decoration of decorations) {
      if (decoration.kind === 'line') {
        const from = this.toCanvasPoint(decoration.from, width, height, scale, viewMode);
        const to = this.toCanvasPoint(decoration.to, width, height, scale, viewMode);
        context.save();
        context.globalAlpha = decoration.opacity;
        context.strokeStyle = decoration.color;
        context.lineWidth = decoration.width;
        context.setLineDash(decoration.dashed ? [8, 8] : []);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.closePath();
        context.restore();
        continue;
      }

      if (decoration.kind === 'arrow') {
        const from = this.toCanvasPoint(decoration.from, width, height, scale, viewMode);
        const to = this.toCanvasPoint(decoration.to, width, height, scale, viewMode);
        context.save();
        context.globalAlpha = decoration.opacity;
        context.strokeStyle = decoration.color;
        context.fillStyle = decoration.color;
        context.lineWidth = decoration.width;
        context.setLineDash(decoration.dashed ? [8, 8] : []);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.closePath();

        const angle = Math.atan2(from.y - to.y, to.x - from.x);
        const headLength = 9;
        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(
          to.x - headLength * Math.cos(angle - Math.PI / 6),
          to.y + headLength * Math.sin(angle - Math.PI / 6),
        );
        context.lineTo(
          to.x - headLength * Math.cos(angle + Math.PI / 6),
          to.y + headLength * Math.sin(angle + Math.PI / 6),
        );
        context.closePath();
        context.fill();
        context.restore();
        continue;
      }

      if (decoration.kind === 'path' && decoration.points.length > 1) {
        context.save();
        context.globalAlpha = decoration.opacity;
        context.strokeStyle = decoration.color;
        context.lineWidth = decoration.width;
        context.setLineDash(decoration.dashed ? [6, 8] : []);
        context.beginPath();

        decoration.points.forEach((point, index) => {
          const canvasPoint = this.toCanvasPoint(point, width, height, scale, viewMode);
          if (index === 0) {
            context.moveTo(canvasPoint.x, canvasPoint.y);
          } else {
            context.lineTo(canvasPoint.x, canvasPoint.y);
          }
        });

        context.stroke();
        context.closePath();
        context.restore();
        continue;
      }

      if (decoration.kind === 'dot') {
        const point = this.toCanvasPoint(
          decoration.position,
          width,
          height,
          scale,
          viewMode,
        );
        context.save();
        context.globalAlpha = decoration.opacity;
        context.fillStyle = decoration.color;
        context.beginPath();
        context.arc(point.x, point.y, decoration.radius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
        context.restore();
        continue;
      }

      if (decoration.kind === 'ring') {
        const center = this.toCanvasPoint(decoration.center, width, height, scale, viewMode);
        context.save();
        context.globalAlpha = decoration.opacity;
        context.strokeStyle = decoration.color;
        context.lineWidth = decoration.width;
        context.setLineDash(decoration.dashed ? [6, 8] : []);
        context.beginPath();
        if (viewMode === '3d') {
          context.ellipse(
            center.x,
            center.y,
            decoration.radius,
            decoration.radius * 0.58,
            0,
            0,
            Math.PI * 2,
          );
        } else {
          context.arc(center.x, center.y, decoration.radius, 0, Math.PI * 2);
        }
        context.stroke();
        context.closePath();
        context.restore();
        continue;
      }

      if (decoration.kind === 'arc') {
        const center = this.toCanvasPoint(decoration.center, width, height, scale, viewMode);
        const radius = decoration.radius * scale.scale;
        context.save();
        context.globalAlpha = decoration.opacity;
        context.strokeStyle = decoration.color;
        context.lineWidth = decoration.width;
        context.setLineDash(decoration.dashed ? [6, 8] : []);
        context.beginPath();
        if (viewMode === '3d') {
          context.ellipse(
            center.x,
            center.y,
            radius,
            radius * 0.58,
            0,
            -decoration.startAngle,
            -decoration.endAngle,
            true,
          );
        } else {
          context.arc(
            center.x,
            center.y,
            radius,
            -decoration.startAngle,
            -decoration.endAngle,
            true,
          );
        }
        context.stroke();
        context.closePath();
        context.restore();
      }
    }
  }

  private drawBodies(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: SceneScale,
    bodies: RuntimeBodyModel[],
    selectedBodyId: string | null,
    showVectors: boolean,
    showTrails: boolean,
    viewMode: CanvasViewMode,
  ): void {
    for (const body of bodies) {
      const point = this.toCanvasPoint(body.position, width, height, scale, viewMode);
      const radius = Math.max(4, Math.min(28, body.radius));
      const isSelected = body.id === selectedBodyId;

      context.save();

      if (showTrails && body.trail.length > 1) {
        context.beginPath();
        context.strokeStyle = `${body.color}88`;
        context.lineWidth = isSelected ? 2.4 : 1.2;

        for (let index = 0; index < body.trail.length; index += 1) {
          const trailPoint = this.toCanvasPoint(
            body.trail[index],
            width,
            height,
            scale,
            viewMode,
          );

          if (index === 0) {
            context.moveTo(trailPoint.x, trailPoint.y);
          } else {
            context.lineTo(trailPoint.x, trailPoint.y);
          }
        }

        context.stroke();
        context.closePath();
      }

      if (viewMode === '3d') {
        this.drawGroundShadow(context, point, radius);
      }

      context.beginPath();
      context.fillStyle = body.color;
      context.shadowBlur = isSelected ? 22 : 14;
      context.shadowColor = body.color;
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();
      context.closePath();

      if (viewMode === '3d') {
        this.drawSphereHighlight(context, point, radius);
      }

      if (isSelected) {
        context.beginPath();
        context.strokeStyle = '#f5f1e6';
        context.lineWidth = 2;
        context.arc(point.x, point.y, radius + 6, 0, Math.PI * 2);
        context.stroke();
        context.closePath();

        if (showVectors) {
          this.drawVector(
            context,
            body.position,
            body.velocity,
            scale.scale * 0.8,
            '#7ce6ff',
            width,
            height,
            scale,
            viewMode,
          );
          this.drawVector(
            context,
            body.position,
            body.force,
            scale.scale * 0.03,
            '#f4c66a',
            width,
            height,
            scale,
            viewMode,
          );
        }
      }

      context.shadowBlur = 0;

      if (body.name) {
        context.fillStyle = '#f5f1e6';
        context.font = '12px Georgia';
        context.fillText(body.name, point.x + radius + 6, point.y - radius - 4);
      }

      context.restore();
    }
  }

  private drawVector(
    context: CanvasRenderingContext2D,
    origin: Vector2Model,
    vector: Vector2Model,
    scale: number,
    color: string,
    width: number,
    height: number,
    sceneScale: SceneScale,
    viewMode: CanvasViewMode,
  ): void {
    const start = this.toCanvasPoint(origin, width, height, sceneScale, viewMode);
    const projectedVector = this.projectVector(vector, scale, viewMode);
    const endX = start.x + projectedVector.x;
    const endY = start.y + projectedVector.y;

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.moveTo(start.x, start.y);
    context.lineTo(endX, endY);
    context.stroke();
    context.closePath();

    const angle = Math.atan2(start.y - endY, endX - start.x);
    const headLength = 8;

    context.beginPath();
    context.fillStyle = color;
    context.moveTo(endX, endY);
    context.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY + headLength * Math.sin(angle - Math.PI / 6),
    );
    context.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY + headLength * Math.sin(angle + Math.PI / 6),
    );
    context.closePath();
    context.fill();
  }

  private drawGroundShadow(
    context: CanvasRenderingContext2D,
    point: { x: number; y: number },
    radius: number,
  ): void {
    context.save();
    context.globalAlpha = 0.24;
    context.fillStyle = '#010509';
    context.beginPath();
    context.ellipse(
      point.x + radius * 0.3,
      point.y + radius * 1.35,
      radius * 1.32,
      Math.max(3, radius * 0.42),
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.closePath();
    context.restore();
  }

  private drawSphereHighlight(
    context: CanvasRenderingContext2D,
    point: { x: number; y: number },
    radius: number,
  ): void {
    context.save();
    context.globalAlpha = 0.36;
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(
      point.x - radius * 0.28,
      point.y - radius * 0.32,
      Math.max(2, radius * 0.28),
      0,
      Math.PI * 2,
    );
    context.fill();
    context.closePath();
    context.restore();
  }

  private projectVector(
    vector: Vector2Model,
    scale: number,
    viewMode: CanvasViewMode,
  ): { x: number; y: number } {
    if (viewMode === '3d') {
      return {
        x: (vector.x + vector.y * 0.36) * scale,
        y: -(vector.y * 0.76 - vector.x * 0.14) * scale,
      };
    }

    return {
      x: vector.x * scale,
      y: -vector.y * scale,
    };
  }

  private computeScale(
    bodies: RuntimeBodyModel[],
    decorations: CanvasDecorationModel[],
    width: number,
    height: number,
  ): SceneScale {
    const coordinates: number[] = [];

    bodies.forEach((body) => {
      coordinates.push(Math.abs(body.position.x), Math.abs(body.position.y));
      body.trail.forEach((point) => coordinates.push(Math.abs(point.x), Math.abs(point.y)));
    });

    decorations.forEach((decoration) => {
      if (decoration.kind === 'line') {
        coordinates.push(
          Math.abs(decoration.from.x),
          Math.abs(decoration.from.y),
          Math.abs(decoration.to.x),
          Math.abs(decoration.to.y),
        );
        return;
      }

      if (decoration.kind === 'arrow') {
        coordinates.push(
          Math.abs(decoration.from.x),
          Math.abs(decoration.from.y),
          Math.abs(decoration.to.x),
          Math.abs(decoration.to.y),
        );
        return;
      }

      if (decoration.kind === 'path') {
        decoration.points.forEach((point) =>
          coordinates.push(Math.abs(point.x), Math.abs(point.y)),
        );
        return;
      }

      if (decoration.kind === 'dot') {
        coordinates.push(Math.abs(decoration.position.x), Math.abs(decoration.position.y));
        return;
      }

      if (decoration.kind === 'arc') {
        coordinates.push(
          Math.abs(decoration.center.x) + decoration.radius,
          Math.abs(decoration.center.y) + decoration.radius,
        );
        return;
      }

      coordinates.push(Math.abs(decoration.center.x), Math.abs(decoration.center.y));
    });

    const range = Math.max(50, ...coordinates);

    return {
      range,
      scale: Math.min(width, height) / (range * 2.6),
    };
  }

  private toCanvasPoint(
    point: Vector2Model,
    width: number,
    height: number,
    scale: SceneScale,
    viewMode: CanvasViewMode,
  ): { x: number; y: number } {
    if (viewMode === '3d') {
      return {
        x: width / 2 + (point.x + point.y * 0.36) * scale.scale,
        y: height * 0.56 - (point.y * 0.76 - point.x * 0.14) * scale.scale,
      };
    }

    return {
      x: width / 2 + point.x * scale.scale,
      y: height / 2 - point.y * scale.scale,
    };
  }
}
