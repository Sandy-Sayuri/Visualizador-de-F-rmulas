import { computed, inject, Injectable, signal } from '@angular/core';

import { SimulationPhysicsService } from '../engine/simulation-physics.service';
import { SimulationRandomizerService } from '../engine/simulation-randomizer.service';
import { BodyModel } from '../models/body.model';
import { CreateBodyPayload } from '../models/create-simulation.model';
import { RuntimeBodyModel } from '../models/runtime-body.model';
import { SimulationModel } from '../models/simulation.model';
import { Vector2Model } from '../models/vector2.model';

@Injectable({
  providedIn: 'root',
})
export class SimulationRunnerService {
  private readonly physics = inject(SimulationPhysicsService);
  private readonly randomizer = inject(SimulationRandomizerService);

  private readonly timeScale = 0.9;
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;
  private initialBodiesSnapshot: RuntimeBodyModel[] = [];

  readonly runtimeBodies = signal<RuntimeBodyModel[]>([]);
  readonly selectedBodyId = signal<string | null>(null);
  readonly isRunning = signal(false);
  readonly elapsedSeconds = signal(0);

  readonly selectedBody = computed(() => {
    const bodies = this.runtimeBodies();
    const selectedId = this.selectedBodyId();
    return bodies.find((body) => body.id === selectedId) ?? bodies[0] ?? null;
  });

  readonly totalEnergy = computed(() =>
    this.physics.computeTotalEnergy(this.runtimeBodies()),
  );

  readonly explanation = computed(() =>
    this.physics.buildExplanation(
      this.runtimeBodies(),
      this.selectedBody()?.id ?? null,
    ),
  );

  loadSimulation(simulation: SimulationModel): void {
    this.pause();
    const initializedBodies = this.physics.initializeBodies(simulation.bodies);
    this.initialBodiesSnapshot = this.cloneBodies(initializedBodies);
    this.runtimeBodies.set(initializedBodies);
    this.selectedBodyId.set(initializedBodies[0]?.id ?? null);
    this.elapsedSeconds.set(0);
  }

  play(): void {
    if (this.isRunning() || !this.runtimeBodies().length) {
      return;
    }

    this.isRunning.set(true);
    this.lastTimestamp = null;
    this.animationFrameId = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  pause(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.lastTimestamp = null;
    this.isRunning.set(false);
  }

  reset(): void {
    this.pause();
    const resetBodies = this.cloneBodies(this.initialBodiesSnapshot);
    this.runtimeBodies.set(this.physics.enrichBodies(resetBodies));
    this.selectedBodyId.set(resetBodies[0]?.id ?? null);
    this.elapsedSeconds.set(0);
  }

  selectBody(bodyId: string): void {
    this.selectedBodyId.set(bodyId);
  }

  updateMass(bodyId: string, mass: number): void {
    if (mass <= 0) {
      return;
    }

    this.runtimeBodies.update((bodies) =>
      this.physics.enrichBodies(
        bodies.map((body) =>
          body.id === bodyId
            ? {
                ...body,
                mass,
              }
            : body,
        ),
      ),
    );
  }

  updateVelocity(bodyId: string, velocity: Vector2Model): void {
    this.runtimeBodies.update((bodies) =>
      this.physics.enrichBodies(
        bodies.map((body) =>
          body.id === bodyId
            ? {
                ...body,
                velocity: { ...velocity },
              }
            : body,
        ),
      ),
    );
  }

  addBody(payload: CreateBodyPayload): void {
    const nextBody: BodyModel = {
      id: crypto.randomUUID(),
      name: payload.name,
      mass: payload.mass,
      radius: payload.radius,
      color: payload.color,
      position: { ...payload.position },
      velocity: { ...payload.velocity },
    };

    this.runtimeBodies.update((bodies) =>
      this.physics.enrichBodies([
        ...bodies,
        ...this.physics.initializeBodies([nextBody]),
      ]),
    );
    this.selectedBodyId.set(nextBody.id);
  }

  removeBody(bodyId: string): void {
    this.runtimeBodies.update((bodies) =>
      this.physics.enrichBodies(bodies.filter((body) => body.id !== bodyId)),
    );

    if (this.selectedBodyId() === bodyId) {
      this.selectedBodyId.set(this.runtimeBodies()[0]?.id ?? null);
    }
  }

  generateRandomSystem(): void {
    this.pause();
    const randomBodies = this.randomizer.generateRandomBodies().map((body) => ({
      id: crypto.randomUUID(),
      ...body,
    }));
    const initializedBodies = this.physics.initializeBodies(randomBodies);
    this.initialBodiesSnapshot = this.cloneBodies(initializedBodies);
    this.runtimeBodies.set(initializedBodies);
    this.selectedBodyId.set(initializedBodies[0]?.id ?? null);
    this.elapsedSeconds.set(0);
  }

  destroy(): void {
    this.pause();
  }

  private tick(timestamp: number): void {
    if (!this.isRunning()) {
      return;
    }

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      this.animationFrameId = requestAnimationFrame((frame) => this.tick(frame));
      return;
    }

    const deltaTime = Math.min(0.03, (timestamp - this.lastTimestamp) / 1000) * this.timeScale;
    this.lastTimestamp = timestamp;

    this.runtimeBodies.update((bodies) => this.physics.step(bodies, deltaTime));
    this.elapsedSeconds.update((value) => value + deltaTime);
    this.animationFrameId = requestAnimationFrame((frame) => this.tick(frame));
  }

  private cloneBodies(bodies: RuntimeBodyModel[]): RuntimeBodyModel[] {
    return bodies.map((body) => ({
      ...body,
      position: { ...body.position },
      velocity: { ...body.velocity },
      force: { ...body.force },
      trail: body.trail.map((point) => ({ ...point })),
    }));
  }
}
