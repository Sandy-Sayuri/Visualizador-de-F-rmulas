import { Injectable } from '@angular/core';

import { FormulaMotionService } from './formula-motion.service';
import { FormulaProgram } from './formula-interpreter.service';
import {
  FormulaEvaluationScopeModel,
  FormulaSimulationConfigModel,
  FormulaSimulationStateModel,
} from '../models/formula-simulation-config.model';
import {
  FormulaVisualDecisionModel,
  FormulaVisualSceneModel,
  FormulaVisualTraitsModel,
} from '../models/formula-visualization.model';
import { CanvasDecorationModel, CanvasLegendItemModel } from '../models/canvas-decoration.model';
import { RuntimeBodyModel } from '../models/runtime-body.model';
import { Vector2Model } from '../models/vector2.model';

interface FuturePatternSample {
  points: Vector2Model[];
}

@Injectable({
  providedIn: 'root',
})
export class FormulaVisualizationService {
  constructor(private readonly motion: FormulaMotionService) {}

  buildScene(
    config: FormulaSimulationConfigModel,
    state: FormulaSimulationStateModel,
    program: FormulaProgram,
  ): FormulaVisualSceneModel {
    const traits = this.analyze(config);
    const decision = this.decideVisualization(traits);
    const primaryBody = this.cloneBody(state.body);
    const bodies = this.composeBodies(config, state, program, decision, primaryBody);
    const decorations: CanvasDecorationModel[] = [];
    const legendItems: CanvasLegendItemModel[] = [];
    const futurePattern =
      decision.showPrediction || decision.showPattern
        ? this.sampleFuturePoints(config, state, program)
        : null;

    if (decision.showTrails) {
      legendItems.push({ key: 'trail', tone: 'trail' });
    }

    if (decision.showVectors) {
      legendItems.push({ key: 'velocity', tone: 'velocity' });
      legendItems.push({ key: 'force', tone: 'force' });
    }

    if (decision.showAnchor) {
      decorations.push(...this.createAnchorGuides(primaryBody.position, traits));
      legendItems.push({ key: 'anchor', tone: 'anchor' });
    }

    if (decision.showWake) {
      decorations.push(...this.createWakeParticles(state, traits));
      legendItems.push({ key: 'wake', tone: 'wake' });
    }

    if (decision.showPulse) {
      decorations.push(...this.createPulseGuides(primaryBody.position, state.time));
      legendItems.push({ key: 'pulse', tone: 'pulse' });
    }

    if (decision.showComparison) {
      decorations.push(...this.createComparisonGuides(config));
      legendItems.push({ key: 'comparison', tone: 'comparison' });
    }

    if (decision.showInteractionBodies) {
      decorations.push(...this.createInteractionFieldGuides());
      legendItems.push({ key: 'interaction', tone: 'interaction' });
    }

    if (decision.showPrediction && futurePattern) {
      decorations.push(...this.createPredictionScene(futurePattern.points));
      legendItems.push({ key: 'prediction', tone: 'prediction' });
    }

    if (decision.showPattern && futurePattern) {
      decorations.push(...this.createPatternGuides(primaryBody.position, futurePattern.points));
      legendItems.push({ key: 'pattern', tone: 'pattern' });
    }

    return {
      bodies,
      decorations,
      legendItems: this.deduplicateLegend(legendItems),
      decision,
    };
  }

  analyze(config: FormulaSimulationConfigModel): FormulaVisualTraitsModel {
    const ax = config.accelerationXFormula;
    const ay = config.accelerationYFormula;
    const expression = `${ax} ${ay}`;
    const uniqueSymbols = new Set<string>();

    const register = (input: string, symbol: string): boolean => {
      const found = new RegExp(`(^|[^A-Za-z0-9_])${symbol}([^A-Za-z0-9_]|$)`).test(input);
      if (found) {
        uniqueSymbols.add(symbol);
      }
      return found;
    };

    const usesPositionX = register(ax, 'x') || register(ay, 'x');
    const usesPositionY = register(ax, 'y') || register(ay, 'y');
    const usesVelocityX = register(ax, 'vx') || register(ay, 'vx');
    const usesVelocityY = register(ax, 'vy') || register(ay, 'vy');
    const usesTime = register(ax, 't') || register(ay, 't');
    const usesSpeed = register(ax, 'speed') || register(ay, 'speed');
    const usesMass = register(ax, 'mass') || register(ay, 'mass');
    const usesDivision = ax.includes('/') || ay.includes('/');
    const usesPower =
      ax.includes('^') || ay.includes('^') || /\b(sqrt|pow)\b/.test(expression);
    const hasTrig = /\b(sin|cos|tan)\b/.test(expression);
    const crossAxisCoupling =
      register(ax, 'y') || register(ax, 'vy') || register(ay, 'x') || register(ay, 'vx');
    const radialField = usesPositionX && usesPositionY && (usesDivision || usesPower);
    const springLikeMotion =
      (usesPositionX || usesPositionY) &&
      (usesVelocityX || usesVelocityY) &&
      !usesDivision &&
      !radialField;
    const periodicMotion =
      hasTrig || (usesTime && (usesPositionX || usesPositionY)) || springLikeMotion;
    const comparisonCandidate = usesMass && !radialField;
    const interactionCandidate =
      radialField || ((usesPositionX || usesPositionY) && crossAxisCoupling && usesDivision);

    const functionCount = (ax.match(/\b(sin|cos|tan|sqrt|abs|log|exp|min|max)\b/g) ?? [])
      .length +
      (ay.match(/\b(sin|cos|tan|sqrt|abs|log|exp|min|max)\b/g) ?? []).length;
    const operatorCount =
      (ax.match(/[+\-*/^]/g) ?? []).length + (ay.match(/[+\-*/^]/g) ?? []).length;

    return {
      usesPositionX,
      usesPositionY,
      usesVelocityX,
      usesVelocityY,
      usesTime,
      usesSpeed,
      usesMass,
      usesDivision,
      usesPower,
      crossAxisCoupling,
      periodicMotion,
      springLikeMotion,
      radialField,
      comparisonCandidate,
      interactionCandidate,
      complexityScore: uniqueSymbols.size + functionCount + Math.min(3, operatorCount),
    };
  }

  private decideVisualization(
    traits: FormulaVisualTraitsModel,
  ): FormulaVisualDecisionModel {
    const mode = traits.interactionCandidate
      ? 'interaction-field'
      : traits.comparisonCandidate
        ? 'mass-comparison'
        : traits.periodicMotion || traits.crossAxisCoupling
          ? 'pattern'
          : 'single-particle';

    const showVectors =
      mode === 'mass-comparison' ||
      mode === 'interaction-field' ||
      traits.usesVelocityX ||
      traits.usesVelocityY ||
      traits.usesMass ||
      traits.radialField;
    const showTrails =
      mode !== 'single-particle' ||
      traits.periodicMotion ||
      traits.radialField ||
      traits.usesSpeed;

    return {
      mode,
      showVectors,
      showTrails,
      showAnchor:
        mode !== 'interaction-field' && (traits.usesPositionX || traits.usesPositionY),
      showWake: traits.usesVelocityX || traits.usesVelocityY,
      showPulse: traits.periodicMotion,
      showPrediction:
        mode !== 'single-particle' ||
        traits.crossAxisCoupling ||
        traits.usesSpeed ||
        traits.complexityScore >= 5,
      showPattern: mode === 'pattern',
      showComparison: mode === 'mass-comparison',
      showInteractionBodies: mode === 'interaction-field',
    };
  }

  private composeBodies(
    config: FormulaSimulationConfigModel,
    state: FormulaSimulationStateModel,
    program: FormulaProgram,
    decision: FormulaVisualDecisionModel,
    primaryBody: RuntimeBodyModel,
  ): RuntimeBodyModel[] {
    if (decision.mode === 'mass-comparison') {
      return [
        ...this.createMassComparisonBodies(config, state, program),
        primaryBody,
      ];
    }

    if (decision.mode === 'interaction-field') {
      return [
        this.createInteractionSourceBody(config),
        ...this.createInteractionProbeBodies(config, state),
        primaryBody,
      ];
    }

    return [primaryBody];
  }

  private createMassComparisonBodies(
    config: FormulaSimulationConfigModel,
    state: FormulaSimulationStateModel,
    program: FormulaProgram,
  ): RuntimeBodyModel[] {
    return [
      this.createMassVariantBody(config, state, program, {
        id: 'formula-mass-light',
        name: 'm-',
        massFactor: 0.55,
        offsetX: -190,
        color: '#8ff7c1',
        radiusFactor: 0.9,
      }),
      this.createMassVariantBody(config, state, program, {
        id: 'formula-mass-heavy',
        name: 'm+',
        massFactor: 1.65,
        offsetX: 190,
        color: '#ffb36c',
        radiusFactor: 1.08,
      }),
    ];
  }

  private createMassVariantBody(
    config: FormulaSimulationConfigModel,
    state: FormulaSimulationStateModel,
    program: FormulaProgram,
    variant: {
      id: string;
      name: string;
      massFactor: number;
      offsetX: number;
      color: string;
      radiusFactor: number;
    },
  ): RuntimeBodyModel {
    const mass = Math.max(0.0000001, config.mass * variant.massFactor);
    const acceleration = program.evaluate(
      this.createScope(state.time, state.body.position, state.body.velocity, mass),
    );
    const responseFactor = this.clamp(
      Math.hypot(acceleration.x, acceleration.y) /
        Math.max(0.001, Math.hypot(state.acceleration.x, state.acceleration.y)),
      0.75,
      1.35,
    );

    const position = this.translatePoint(
      this.scalePointAround(state.body.position, config.initialPosition, responseFactor),
      { x: variant.offsetX, y: 0 },
    );
    const velocity = this.scaleVector(state.body.velocity, responseFactor);
    const trail = state.body.trail.map((point) =>
      this.translatePoint(
        this.scalePointAround(point, config.initialPosition, responseFactor),
        { x: variant.offsetX, y: 0 },
      ),
    );

    return this.createRuntimeBody({
      id: variant.id,
      name: variant.name,
      color: variant.color,
      mass,
      radius: Math.max(3, config.radius * variant.radiusFactor),
      position,
      velocity,
      force: {
        x: acceleration.x * mass,
        y: acceleration.y * mass,
      },
      trail,
    });
  }

  private createInteractionSourceBody(
    config: FormulaSimulationConfigModel,
  ): RuntimeBodyModel {
    return this.createRuntimeBody({
      id: 'formula-source',
      name: '',
      color: '#f4c66a',
      mass: Math.max(config.mass * 12, 1),
      radius: Math.max(12, config.radius * 1.7),
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      force: { x: 0, y: 0 },
      trail: [],
    });
  }

  private createInteractionProbeBodies(
    config: FormulaSimulationConfigModel,
    state: FormulaSimulationStateModel,
  ): RuntimeBodyModel[] {
    const probes = [
      { id: 'formula-probe-a', angle: -0.55, color: '#9dc7ff', scale: 0.92 },
      { id: 'formula-probe-b', angle: 0.55, color: '#ff8f70', scale: 1.08 },
    ];

    return probes.map((probe) => {
      const position = this.scaleVector(this.rotateVector(state.body.position, probe.angle), probe.scale);
      const velocity = this.scaleVector(this.rotateVector(state.body.velocity, probe.angle), probe.scale);
      const force = this.rotateVector(state.body.force, probe.angle);
      const trail = state.body.trail.map((point) =>
        this.scaleVector(this.rotateVector(point, probe.angle), probe.scale),
      );

      return this.createRuntimeBody({
        id: probe.id,
        name: '',
        color: probe.color,
        mass: Math.max(config.mass * 0.42, 0.0000001),
        radius: Math.max(3, config.radius * 0.72),
        position,
        velocity,
        force,
        trail,
      });
    });
  }

  private createAnchorGuides(
    position: Vector2Model,
    traits: FormulaVisualTraitsModel,
  ): CanvasDecorationModel[] {
    const decorations: CanvasDecorationModel[] = [
      {
        kind: 'dot',
        position: { x: 0, y: 0 },
        radius: 6,
        color: '#f4c66a',
        opacity: 0.95,
      },
      {
        kind: 'ring',
        center: { x: 0, y: 0 },
        radius: 24,
        color: '#f4c66a',
        opacity: 0.24,
        width: 1.5,
        dashed: true,
      },
      {
        kind: 'line',
        from: { x: 0, y: 0 },
        to: position,
        color: '#f4c66a',
        width: 1.4,
        opacity: 0.32,
        dashed: true,
      },
    ];

    if (traits.usesPositionX && !traits.usesPositionY) {
      decorations.push({
        kind: 'line',
        from: { x: -360, y: 0 },
        to: { x: 360, y: 0 },
        color: '#9dc7ff',
        width: 1.2,
        opacity: 0.18,
      });
    }

    if (traits.usesPositionY && !traits.usesPositionX) {
      decorations.push({
        kind: 'line',
        from: { x: 0, y: -240 },
        to: { x: 0, y: 240 },
        color: '#9dc7ff',
        width: 1.2,
        opacity: 0.18,
      });
    }

    return decorations;
  }

  private createWakeParticles(
    state: FormulaSimulationStateModel,
    traits: FormulaVisualTraitsModel,
  ): CanvasDecorationModel[] {
    const decorations: CanvasDecorationModel[] = [];
    const velocity = state.body.velocity;
    const speed = Math.max(1, Math.hypot(velocity.x, velocity.y));
    const direction = {
      x: velocity.x / speed,
      y: velocity.y / speed,
    };
    const dotProduct =
      velocity.x * state.acceleration.x + velocity.y * state.acceleration.y;
    const wakeColor = dotProduct <= 0 ? '#ff8f70' : '#7ce6ff';

    const primaryAxis =
      traits.usesVelocityX && !traits.usesVelocityY
        ? { x: direction.x === 0 ? 1 : Math.sign(direction.x), y: 0 }
        : traits.usesVelocityY && !traits.usesVelocityX
          ? { x: 0, y: direction.y === 0 ? 1 : Math.sign(direction.y) }
          : direction;

    for (let index = 1; index <= 5; index += 1) {
      decorations.push({
        kind: 'dot',
        position: {
          x: state.body.position.x - primaryAxis.x * index * 14,
          y: state.body.position.y - primaryAxis.y * index * 14,
        },
        radius: Math.max(2, 6 - index),
        color: wakeColor,
        opacity: 0.36 - index * 0.05,
      });
    }

    return decorations;
  }

  private createPulseGuides(
    position: Vector2Model,
    time: number,
  ): CanvasDecorationModel[] {
    const pulseRadius = 28 + Math.abs(Math.sin(time * 2.2)) * 22;
    const angle = time * 3;

    return [
      {
        kind: 'ring',
        center: position,
        radius: pulseRadius,
        color: '#d8b4ff',
        opacity: 0.26,
        width: 1.5,
      },
      {
        kind: 'dot',
        position: {
          x: position.x + Math.cos(angle) * pulseRadius,
          y: position.y + Math.sin(angle) * pulseRadius,
        },
        radius: 5,
        color: '#d8b4ff',
        opacity: 0.9,
      },
    ];
  }

  private createPredictionScene(points: Vector2Model[]): CanvasDecorationModel[] {
    const decorations: CanvasDecorationModel[] = [
      {
        kind: 'path',
        points,
        color: '#ffffff',
        width: 1.2,
        opacity: 0.16,
        dashed: true,
      },
    ];

    for (let index = 0; index < points.length; index += 3) {
      decorations.push({
        kind: 'dot',
        position: points[index],
        radius: 3,
        color: '#ffffff',
        opacity: 0.28 + index * 0.01,
      });
    }

    return decorations;
  }

  private createPatternGuides(
    origin: Vector2Model,
    points: Vector2Model[],
  ): CanvasDecorationModel[] {
    const sampledPoints = points.filter((_, index) => index % 4 === 0);

    return [
      {
        kind: 'path',
        points: [origin, ...sampledPoints],
        color: '#d6f0ff',
        width: 1.4,
        opacity: 0.18,
      },
      ...sampledPoints.map((point, index) => ({
        kind: 'dot' as const,
        position: point,
        radius: Math.max(2, 5 - index * 0.6),
        color: '#d6f0ff',
        opacity: 0.4 - index * 0.04,
      })),
    ];
  }

  private createComparisonGuides(
    config: FormulaSimulationConfigModel,
  ): CanvasDecorationModel[] {
    const laneOffsets = [
      { x: -190, color: '#8ff7c1' },
      { x: 0, color: '#7ce6ff' },
      { x: 190, color: '#ffb36c' },
    ];

    return laneOffsets.flatMap((lane, index) => {
      const lanePosition = this.translatePoint(config.initialPosition, { x: lane.x, y: 0 });

      return [
        {
          kind: 'ring' as const,
          center: lanePosition,
          radius: 12 + index * 2,
          color: lane.color,
          opacity: 0.16,
          width: 1,
          dashed: true,
        },
        {
          kind: 'dot' as const,
          position: lanePosition,
          radius: 3.5,
          color: lane.color,
          opacity: 0.48,
        },
      ];
    });
  }

  private createInteractionFieldGuides(): CanvasDecorationModel[] {
    return [
      {
        kind: 'ring',
        center: { x: 0, y: 0 },
        radius: 44,
        color: '#f4c66a',
        opacity: 0.16,
        width: 1.2,
        dashed: true,
      },
      {
        kind: 'ring',
        center: { x: 0, y: 0 },
        radius: 88,
        color: '#f4c66a',
        opacity: 0.08,
        width: 1,
      },
    ];
  }

  private sampleFuturePoints(
    config: FormulaSimulationConfigModel,
    state: FormulaSimulationStateModel,
    program: FormulaProgram,
  ): FuturePatternSample {
    const points: Vector2Model[] = [];
    let simulatedState = this.cloneState(state);

    for (let stepIndex = 0; stepIndex < 18; stepIndex += 1) {
      simulatedState = this.motion.step(simulatedState, config, program, 0.05);
      points.push({ ...simulatedState.body.position });
    }

    return { points };
  }

  private createRuntimeBody(input: {
    id: string;
    name: string;
    color: string;
    mass: number;
    radius: number;
    position: Vector2Model;
    velocity: Vector2Model;
    force: Vector2Model;
    trail: Vector2Model[];
  }): RuntimeBodyModel {
    const speed = Math.hypot(input.velocity.x, input.velocity.y);
    const kineticEnergy = 0.5 * input.mass * speed * speed;

    return {
      id: input.id,
      name: input.name,
      color: input.color,
      mass: input.mass,
      radius: input.radius,
      position: input.position,
      velocity: input.velocity,
      force: input.force,
      speed,
      kineticEnergy,
      potentialEnergy: 0,
      totalEnergy: kineticEnergy,
      trail: input.trail,
    };
  }

  private createScope(
    time: number,
    position: Vector2Model,
    velocity: Vector2Model,
    mass: number,
  ): FormulaEvaluationScopeModel {
    return {
      t: time,
      dt: 0.016,
      x: position.x,
      y: position.y,
      vx: velocity.x,
      vy: velocity.y,
      mass,
      speed: Math.hypot(velocity.x, velocity.y),
      pi: Math.PI,
      e: Math.E,
    };
  }

  private rotateVector(point: Vector2Model, angle: number): Vector2Model {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos,
    };
  }

  private scaleVector(point: Vector2Model, factor: number): Vector2Model {
    return {
      x: point.x * factor,
      y: point.y * factor,
    };
  }

  private scalePointAround(
    point: Vector2Model,
    center: Vector2Model,
    factor: number,
  ): Vector2Model {
    return {
      x: center.x + (point.x - center.x) * factor,
      y: center.y + (point.y - center.y) * factor,
    };
  }

  private translatePoint(point: Vector2Model, offset: Vector2Model): Vector2Model {
    return {
      x: point.x + offset.x,
      y: point.y + offset.y,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private deduplicateLegend(items: CanvasLegendItemModel[]): CanvasLegendItemModel[] {
    const seen = new Set<string>();

    return items.filter((item) => {
      if (seen.has(item.key)) {
        return false;
      }

      seen.add(item.key);
      return true;
    });
  }

  private cloneBody(body: RuntimeBodyModel): RuntimeBodyModel {
    return {
      ...body,
      position: { ...body.position },
      velocity: { ...body.velocity },
      force: { ...body.force },
      trail: body.trail.map((point) => ({ ...point })),
    };
  }

  private cloneState(
    state: FormulaSimulationStateModel,
  ): FormulaSimulationStateModel {
    return {
      time: state.time,
      acceleration: { ...state.acceleration },
      body: this.cloneBody(state.body),
    };
  }
}
