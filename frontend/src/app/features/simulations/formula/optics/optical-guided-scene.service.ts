import { Injectable } from '@angular/core';

import { OpticalSceneSnapshotModel } from '../../models/optical-scene.model';
import { FormulaScenarioConfigModel } from '../../models/formula-scenario.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';
import { Vector2Model } from '../../models/vector2.model';
import { FormulaScenarioSolverSupportService } from '../solvers/formula-scenario-solver-support.service';

type OpticalFamily = 'reflection' | 'refraction' | 'lens';

interface PulseTraceResult {
  position: Vector2Model;
  velocity: Vector2Model;
}

@Injectable({
  providedIn: 'root',
})
export class OpticalGuidedSceneService {
  private readonly raySpeed = 180;
  private readonly rayLength = 280;
  private readonly interfaceHalfWidth = 340;
  private readonly lensHalfHeight = 170;
  private readonly lensSampleY = [-92, 0, 92];

  constructor(private readonly support: FormulaScenarioSolverSupportService) {}

  buildState(
    family: OpticalFamily,
    config: FormulaScenarioConfigModel,
    time: number,
  ): {
    bodies: RuntimeBodyModel[];
    sceneData: { optical: OpticalSceneSnapshotModel };
  } {
    switch (family) {
      case 'reflection':
        return this.buildReflectionState(config, time);
      case 'refraction':
        return this.buildRefractionState(config, time);
      case 'lens':
        return this.buildLensState(config, time);
    }
  }

  private buildReflectionState(
    config: FormulaScenarioConfigModel,
    time: number,
  ): {
    bodies: RuntimeBodyModel[];
    sceneData: { optical: OpticalSceneSnapshotModel };
  } {
    const angle = this.toRadians(this.clamp(config.parameterValues['angleDeg'] ?? 34, 5, 75));
    const source = {
      x: config.parameterValues['sourceX'] ?? -210,
      y: Math.max(60, Math.abs(config.parameterValues['sourceY'] ?? 170)),
    };
    const incidentDirection = {
      x: Math.sin(angle),
      y: -Math.cos(angle),
    };
    const impactDistance = source.y / Math.max(0.15, Math.cos(angle));
    const impact = {
      x: source.x + incidentDirection.x * impactDistance,
      y: 0,
    };
    const reflectedDirection = {
      x: incidentDirection.x,
      y: -incidentDirection.y,
    };
    const reflectedEnd = this.add(impact, this.scale(reflectedDirection, this.rayLength));
    const pulse = this.tracePath(
      [
        { from: source, to: impact },
        { from: impact, to: reflectedEnd },
      ],
      time,
      this.raySpeed,
    );
    const sceneData: OpticalSceneSnapshotModel = {
      scenario: 'reflection',
      lines: [
        {
          from: { x: -this.interfaceHalfWidth, y: 0 },
          to: { x: this.interfaceHalfWidth, y: 0 },
          color: '#f5f1e6',
          width: 2,
          opacity: 0.58,
        },
        {
          from: { x: impact.x, y: -180 },
          to: { x: impact.x, y: 180 },
          color: '#9dc7ff',
          width: 1,
          opacity: 0.35,
          dashed: true,
        },
        {
          from: source,
          to: impact,
          color: '#ffd166',
          width: 2.6,
          opacity: 0.98,
        },
        {
          from: impact,
          to: reflectedEnd,
          color: '#ff9d5c',
          width: 2.6,
          opacity: 0.98,
        },
      ],
      arcs: [
        {
          center: impact,
          radius: 42,
          startAngle: Math.PI / 2,
          endAngle: this.vectorAngle(this.scale(incidentDirection, -1)),
          color: '#ffd166',
          width: 1.8,
          opacity: 0.9,
        },
        {
          center: impact,
          radius: 42,
          startAngle: this.vectorAngle(reflectedDirection),
          endAngle: Math.PI / 2,
          color: '#ff9d5c',
          width: 1.8,
          opacity: 0.9,
        },
      ],
      points: [],
      hasTransmission: false,
    };

    return {
      bodies: [
        this.createPulseBody('optics-reflection-ray', 'Raio', '#ffd166', pulse),
        this.createSourceBody(config.primaryLabel || 'Fonte', config.primaryColor, source),
      ],
      sceneData: { optical: sceneData },
    };
  }

  private buildRefractionState(
    config: FormulaScenarioConfigModel,
    time: number,
  ): {
    bodies: RuntimeBodyModel[];
    sceneData: { optical: OpticalSceneSnapshotModel };
  } {
    const angle = this.toRadians(this.clamp(config.parameterValues['angleDeg'] ?? 30, 5, 72));
    const source = {
      x: config.parameterValues['sourceX'] ?? -210,
      y: Math.max(60, Math.abs(config.parameterValues['sourceY'] ?? 170)),
    };
    const n1 = Math.max(1, config.parameterValues['n1'] ?? 1);
    const n2 = Math.max(1, config.parameterValues['n2'] ?? 1.33);
    const incidentDirection = {
      x: Math.sin(angle),
      y: -Math.cos(angle),
    };
    const impactDistance = source.y / Math.max(0.15, Math.cos(angle));
    const impact = {
      x: source.x + incidentDirection.x * impactDistance,
      y: 0,
    };
    const snellRatio = (n1 / n2) * Math.sin(angle);
    const hasTransmission = Math.abs(snellRatio) <= 1;
    const refractedAngle = hasTransmission
      ? Math.asin(snellRatio)
      : Math.PI / 2 - 0.04;
    const refractedDirection = {
      x: Math.sign(incidentDirection.x || 1) * Math.sin(refractedAngle),
      y: -Math.cos(refractedAngle),
    };
    const refractedEnd = this.add(impact, this.scale(refractedDirection, this.rayLength));
    const pulse = this.tracePath(
      [
        { from: source, to: impact },
        { from: impact, to: refractedEnd },
      ],
      time,
      this.raySpeed,
    );
    const sceneData: OpticalSceneSnapshotModel = {
      scenario: 'refraction',
      lines: [
        {
          from: { x: -this.interfaceHalfWidth, y: 0 },
          to: { x: this.interfaceHalfWidth, y: 0 },
          color: '#f5f1e6',
          width: 2,
          opacity: 0.58,
        },
        {
          from: { x: impact.x, y: -180 },
          to: { x: impact.x, y: 180 },
          color: '#9dc7ff',
          width: 1,
          opacity: 0.35,
          dashed: true,
        },
        {
          from: source,
          to: impact,
          color: '#ffd166',
          width: 2.6,
          opacity: 0.98,
        },
        {
          from: impact,
          to: refractedEnd,
          color: '#7ce6ff',
          width: 2.6,
          opacity: 0.98,
        },
      ],
      arcs: [
        {
          center: impact,
          radius: 42,
          startAngle: Math.PI / 2,
          endAngle: this.vectorAngle(this.scale(incidentDirection, -1)),
          color: '#ffd166',
          width: 1.8,
          opacity: 0.9,
        },
        {
          center: impact,
          radius: 42,
          startAngle: -Math.PI / 2,
          endAngle: this.vectorAngle(refractedDirection),
          color: '#7ce6ff',
          width: 1.8,
          opacity: 0.9,
        },
      ],
      points: [],
      hasTransmission,
    };

    return {
      bodies: [
        this.createPulseBody('optics-refraction-ray', 'Raio', '#ffd166', pulse),
        this.createSourceBody(config.primaryLabel || 'Fonte', config.primaryColor, source),
      ],
      sceneData: { optical: sceneData },
    };
  }

  private buildLensState(
    config: FormulaScenarioConfigModel,
    time: number,
  ): {
    bodies: RuntimeBodyModel[];
    sceneData: { optical: OpticalSceneSnapshotModel };
  } {
    const focalLength = this.clamp(config.parameterValues['focalLength'] ?? 120, 40, 240);
    const source = {
      x: -Math.max(120, Math.abs(config.parameterValues['sourceX'] ?? 240)),
      y: this.clamp(config.parameterValues['sourceY'] ?? 70, -140, 140),
    };
    const objectDistance = Math.max(40, Math.abs(source.x));
    const denominator = (1 / focalLength) - (1 / objectDistance);
    const imageDistance =
      Math.abs(denominator) < 0.0001 ? 900 : 1 / denominator;
    const imagePoint =
      imageDistance > 0
        ? {
            x: imageDistance,
            y: -(imageDistance / objectDistance) * source.y,
          }
        : {
            x: imageDistance,
            y: -(imageDistance / objectDistance) * source.y,
          };
    const lines = [
      {
        from: { x: -this.interfaceHalfWidth, y: 0 },
        to: { x: this.interfaceHalfWidth, y: 0 },
        color: '#9dc7ff',
        width: 1,
        opacity: 0.28,
        dashed: true,
      },
      {
        from: { x: 0, y: -this.lensHalfHeight },
        to: { x: 0, y: this.lensHalfHeight },
        color: '#7ce6ff',
        width: 3,
        opacity: 0.8,
      },
    ];
    const pulses: RuntimeBodyModel[] = [];

    this.lensSampleY.forEach((lensY, index) => {
      const lensPoint = { x: 0, y: lensY };
      const outgoingTarget =
        imageDistance > 0
          ? imagePoint
          : this.add(
              lensPoint,
              this.scale(
                this.normalize({
                  x: lensPoint.x - imagePoint.x,
                  y: lensPoint.y - imagePoint.y,
                }),
                this.rayLength,
              ),
            );

      lines.push(
        {
          from: source,
          to: lensPoint,
          color: '#ffd166',
          width: 2.2,
          opacity: 0.92,
        },
        {
          from: lensPoint,
          to: outgoingTarget,
          color: '#7ce6ff',
          width: 2.2,
          opacity: 0.92,
        },
      );

      const pulse = this.tracePath(
        [
          { from: source, to: lensPoint },
          { from: lensPoint, to: outgoingTarget },
        ],
        time,
        this.raySpeed,
        index * 45,
      );

      pulses.push(
        this.createPulseBody(`optics-lens-ray-${index}`, `R${index + 1}`, '#ffd166', pulse),
      );
    });

    const sceneData: OpticalSceneSnapshotModel = {
      scenario: 'lens',
      lines,
      arcs: [],
      points: [
        {
          position: { x: -focalLength, y: 0 },
          color: '#f4c66a',
          radius: 5,
          opacity: 0.95,
          ringRadius: 12,
        },
        {
          position: { x: focalLength, y: 0 },
          color: '#f4c66a',
          radius: 5,
          opacity: 0.95,
          ringRadius: 12,
        },
      ],
      hasTransmission: true,
    };

    return {
      bodies: [
        ...pulses,
        this.createSourceBody(config.primaryLabel || 'Fonte', config.primaryColor, source),
      ],
      sceneData: { optical: sceneData },
    };
  }

  private createSourceBody(
    label: string,
    color: string,
    position: Vector2Model,
  ): RuntimeBodyModel {
    return this.support.createRuntimeBody({
      id: `${label.toLowerCase().replace(/\s+/g, '-')}-source`,
      name: label,
      color,
      mass: 1,
      radius: 7,
      position,
      velocity: { x: 0, y: 0 },
      force: { x: 0, y: 0 },
      trail: [],
    });
  }

  private createPulseBody(
    id: string,
    label: string,
    color: string,
    pulse: PulseTraceResult,
  ): RuntimeBodyModel {
    return this.support.createRuntimeBody({
      id,
      name: label,
      color,
      mass: 1,
      radius: 4.5,
      position: pulse.position,
      velocity: pulse.velocity,
      force: { x: 0, y: 0 },
      trail: [],
    });
  }

  private tracePath(
    segments: Array<{ from: Vector2Model; to: Vector2Model }>,
    time: number,
    speed: number,
    phaseOffset = 0,
  ): PulseTraceResult {
    const lengths = segments.map((segment) => this.distance(segment.from, segment.to));
    const totalLength = lengths.reduce((sum, length) => sum + length, 0);
    let progress = (time * speed + phaseOffset) % totalLength;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const length = lengths[index];

      if (progress <= length) {
        const direction = this.normalize({
          x: segment.to.x - segment.from.x,
          y: segment.to.y - segment.from.y,
        });

        return {
          position: {
            x: segment.from.x + direction.x * progress,
            y: segment.from.y + direction.y * progress,
          },
          velocity: {
            x: direction.x * speed,
            y: direction.y * speed,
          },
        };
      }

      progress -= length;
    }

    const lastSegment = segments[segments.length - 1];
    const direction = this.normalize({
      x: lastSegment.to.x - lastSegment.from.x,
      y: lastSegment.to.y - lastSegment.from.y,
    });

    return {
      position: { ...lastSegment.to },
      velocity: {
        x: direction.x * speed,
        y: direction.y * speed,
      },
    };
  }

  private add(left: Vector2Model, right: Vector2Model): Vector2Model {
    return { x: left.x + right.x, y: left.y + right.y };
  }

  private scale(vector: Vector2Model, factor: number): Vector2Model {
    return { x: vector.x * factor, y: vector.y * factor };
  }

  private normalize(vector: Vector2Model): Vector2Model {
    const length = Math.max(0.0001, Math.hypot(vector.x, vector.y));

    return {
      x: vector.x / length,
      y: vector.y / length,
    };
  }

  private distance(left: Vector2Model, right: Vector2Model): number {
    return Math.hypot(right.x - left.x, right.y - left.y);
  }

  private vectorAngle(vector: Vector2Model): number {
    return Math.atan2(vector.y, vector.x);
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
