import { Injectable } from '@angular/core';

import { FormulaScenarioSolverContextModel } from '../../models/formula-engine.model';
import {
  FormulaScenarioConfigModel,
  FormulaScenarioStateModel,
} from '../../models/formula-scenario.model';
import {
  ThermodynamicsContainerBoundsModel,
  ThermodynamicsSceneSnapshotModel,
  ThermodynamicsScenarioKindModel,
} from '../../models/thermodynamics-scene.model';
import { RuntimeBodyModel } from '../../models/runtime-body.model';
import { Vector2Model } from '../../models/vector2.model';
import { FormulaScenarioSolverSupportService } from '../solvers/formula-scenario-solver-support.service';

type ThermodynamicsFamily = 'gas' | 'compression';

@Injectable({
  providedIn: 'root',
})
export class ThermodynamicsParticleSceneService {
  private readonly chamber = {
    minX: -220,
    minY: -150,
    maxHeight: 300,
    minWidth: 180,
    maxWidth: 440,
  };

  constructor(private readonly support: FormulaScenarioSolverSupportService) {}

  createInitialState(
    family: ThermodynamicsFamily,
    config: FormulaScenarioConfigModel,
  ): FormulaScenarioStateModel {
    const parameterValues = config.parameterValues;
    const targetVolume = this.resolveVolume(parameterValues['volume']);
    const currentVolume = family === 'compression' ? 0.72 : targetVolume;
    const bounds = this.createBounds(currentVolume);
    const temperature = this.resolveTemperature(parameterValues['temperature']);
    const particleCount = this.resolveParticleCount(parameterValues['particleCount']);
    const bodies = this.createBodies(
      particleCount,
      temperature,
      bounds,
      config,
    );

    return {
      time: 0,
      bodies,
      sceneData: {
        thermodynamics: this.buildSnapshot(
          family,
          targetVolume,
          currentVolume,
          temperature,
          particleCount,
          bounds,
          0,
        ),
      },
    };
  }

  stepState(
    family: ThermodynamicsFamily,
    state: FormulaScenarioStateModel,
    config: FormulaScenarioConfigModel,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
  ): FormulaScenarioStateModel {
    const parameterValues = config.parameterValues;
    const temperature = this.resolveTemperature(parameterValues['temperature']);
    const targetVolume = this.resolveVolume(parameterValues['volume']);
    const particleCount = this.resolveParticleCount(parameterValues['particleCount']);
    const currentVolume =
      state.sceneData?.thermodynamics?.currentVolume ?? (family === 'compression' ? 0.72 : targetVolume);
    const nextVolume =
      family === 'compression'
        ? this.moveTowards(currentVolume, targetVolume, deltaTime * 0.24)
        : targetVolume;
    const previousBounds =
      state.sceneData?.thermodynamics?.bounds ?? this.createBounds(currentVolume);
    const nextBounds = this.createBounds(nextVolume);
    const pistonVelocity =
      deltaTime > 0 ? (nextBounds.maxX - previousBounds.maxX) / deltaTime : 0;
    const nextBodies = this.advanceBodies(
      state.bodies,
      particleCount,
      temperature,
      previousBounds,
      nextBounds,
      pistonVelocity,
      deltaTime,
      context,
      config,
    );

    return {
      time: state.time + deltaTime,
      bodies: nextBodies,
      sceneData: {
        thermodynamics: this.buildSnapshot(
          family,
          targetVolume,
          nextVolume,
          temperature,
          particleCount,
          nextBounds,
          pistonVelocity,
        ),
      },
    };
  }

  private createBodies(
    particleCount: number,
    temperature: number,
    bounds: ThermodynamicsContainerBoundsModel,
    config: FormulaScenarioConfigModel,
  ): RuntimeBodyModel[] {
    return Array.from({ length: particleCount }, (_, index) => {
      const seed = index + 1;
      const radius = Math.max(2.8, config.particleRadius * 0.42);
      const position = {
        x: this.seedBetween(seed * 1.17, bounds.minX + radius + 4, bounds.maxX - radius - 4),
        y: this.seedBetween(seed * 2.13, bounds.minY + radius + 4, bounds.maxY - radius - 4),
      };
      const direction = this.seedBetween(seed * 0.73, 0, Math.PI * 2);
      const speed = this.resolveParticleSpeed(temperature) * this.seedBetween(seed * 0.41, 0.82, 1.18);

      return this.support.createRuntimeBody({
        id: `thermo-particle-${index}`,
        name: '',
        color: this.resolveParticleColor(temperature),
        mass: 1,
        radius,
        position,
        velocity: {
          x: Math.cos(direction) * speed,
          y: Math.sin(direction) * speed,
        },
        force: { x: 0, y: 0 },
        trail: [],
      });
    });
  }

  private advanceBodies(
    currentBodies: RuntimeBodyModel[],
    particleCount: number,
    temperature: number,
    previousBounds: ThermodynamicsContainerBoundsModel,
    nextBounds: ThermodynamicsContainerBoundsModel,
    pistonVelocity: number,
    deltaTime: number,
    context: FormulaScenarioSolverContextModel,
    config: FormulaScenarioConfigModel,
  ): RuntimeBodyModel[] {
    const stepTime = deltaTime === 0 ? context.validationDeltaTime : deltaTime;
    const existingBodies =
      currentBodies.length === particleCount
        ? currentBodies
        : this.createBodies(particleCount, temperature, nextBounds, config);
    const targetSpeed = this.resolveParticleSpeed(temperature);

    return existingBodies.map((body, index) => {
      const tunedVelocity = this.scaleToSpeed(body.velocity, targetSpeed);
      let position = {
        x: body.position.x + tunedVelocity.x * stepTime,
        y: body.position.y + tunedVelocity.y * stepTime,
      };
      let velocity = { ...tunedVelocity };
      const radius = body.radius;

      if (position.x - radius <= nextBounds.minX) {
        position = {
          ...position,
          x: nextBounds.minX + radius,
        };
        velocity = { ...velocity, x: Math.abs(velocity.x) };
      }

      if (position.x + radius >= nextBounds.maxX) {
        position = {
          ...position,
          x: nextBounds.maxX - radius,
        };
        velocity = {
          ...velocity,
          x: -Math.abs(velocity.x) + 2 * pistonVelocity,
        };
      }

      if (position.y - radius <= nextBounds.minY) {
        position = {
          ...position,
          y: nextBounds.minY + radius,
        };
        velocity = { ...velocity, y: Math.abs(velocity.y) };
      }

      if (position.y + radius >= nextBounds.maxY) {
        position = {
          ...position,
          y: nextBounds.maxY - radius,
        };
        velocity = { ...velocity, y: -Math.abs(velocity.y) };
      }

      const safeVelocity = this.limitVector(velocity, 180);
      const safePosition = {
        x: Math.min(nextBounds.maxX - radius, Math.max(nextBounds.minX + radius, position.x)),
        y: Math.min(nextBounds.maxY - radius, Math.max(nextBounds.minY + radius, position.y)),
      };

      this.support.ensureFiniteVector(safePosition, context.maxAbsoluteCoordinate);
      this.support.ensureFiniteVector(safeVelocity, context.maxAbsoluteCoordinate);

      return this.support.createRuntimeBody({
        id: body.id,
        name: body.name || '',
        color: this.resolveParticleColor(temperature, index),
        mass: body.mass,
        radius: body.radius,
        position: safePosition,
        velocity: safeVelocity,
        force: {
          x: pistonVelocity * 0.28,
          y: 0,
        },
        trail: [],
      });
    });
  }

  private buildSnapshot(
    family: ThermodynamicsFamily,
    targetVolume: number,
    currentVolume: number,
    temperature: number,
    particleCount: number,
    bounds: ThermodynamicsContainerBoundsModel,
    pistonVelocity: number,
  ): ThermodynamicsSceneSnapshotModel {
    const pressure =
      (particleCount * (temperature / 300)) /
      Math.max(0.1, currentVolume);
    const gaugeHeight = this.clamp(pressure * 18, 18, 110);

    return {
      scenario: family,
      bounds,
      targetVolume,
      currentVolume,
      temperature,
      pressure,
      particleCount,
      pistonVelocity,
      pistonPosition: bounds.maxX,
      gaugePoints: [
        { x: bounds.maxX + 34, y: bounds.minY + 10 },
        { x: bounds.maxX + 34, y: bounds.minY + 10 + gaugeHeight },
      ],
    };
  }

  private createBounds(volume: number): ThermodynamicsContainerBoundsModel {
    const width =
      this.chamber.minWidth +
      (this.chamber.maxWidth - this.chamber.minWidth) * volume;

    return {
      minX: this.chamber.minX,
      maxX: this.chamber.minX + width,
      minY: this.chamber.minY,
      maxY: this.chamber.minY + this.chamber.maxHeight,
    };
  }

  private resolveVolume(value: number | undefined): number {
    const nextValue = value ?? 0.82;
    return this.clamp(nextValue / 100, 0.4, 1);
  }

  private resolveTemperature(value: number | undefined): number {
    return this.clamp(value ?? 420, 180, 900);
  }

  private resolveParticleCount(value: number | undefined): number {
    return Math.round(this.clamp(value ?? 24, 8, 40));
  }

  private resolveParticleSpeed(temperature: number): number {
    return 14 + Math.sqrt(temperature) * 1.35;
  }

  private resolveParticleColor(temperature: number, index = 0): string {
    if (temperature < 320) {
      return index % 3 === 0 ? '#8fe6ff' : '#7ce6ff';
    }

    if (temperature < 520) {
      return index % 4 === 0 ? '#ffd166' : '#ffb36c';
    }

    return index % 3 === 0 ? '#ff8f70' : '#ff9d5c';
  }

  private scaleToSpeed(vector: Vector2Model, targetSpeed: number): Vector2Model {
    const currentSpeed = Math.max(0.0001, Math.hypot(vector.x, vector.y));
    const factor = targetSpeed / currentSpeed;

    return {
      x: vector.x * factor,
      y: vector.y * factor,
    };
  }

  private limitVector(vector: Vector2Model, maxMagnitude: number): Vector2Model {
    const magnitude = Math.hypot(vector.x, vector.y);

    if (magnitude <= maxMagnitude) {
      return vector;
    }

    const factor = maxMagnitude / magnitude;

    return {
      x: vector.x * factor,
      y: vector.y * factor,
    };
  }

  private moveTowards(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }

    return current + Math.sign(target - current) * maxDelta;
  }

  private seedBetween(seed: number, min: number, max: number): number {
    const normalized = Math.sin(seed * 91.183) * 43758.5453;
    const fraction = normalized - Math.floor(normalized);
    return min + (max - min) * fraction;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
