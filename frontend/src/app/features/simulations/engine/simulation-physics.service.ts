import { Injectable } from '@angular/core';

import { BodyModel } from '../models/body.model';
import { RuntimeBodyModel } from '../models/runtime-body.model';
import { Vector2Model } from '../models/vector2.model';

interface PairForceContribution {
  sourceId: string;
  targetId: string;
  magnitude: number;
}

@Injectable({
  providedIn: 'root',
})
export class SimulationPhysicsService {
  private readonly gravitationalConstant = 80;
  private readonly softening = 140;
  private readonly maxTrailPoints = 180;

  initializeBodies(bodies: BodyModel[]): RuntimeBodyModel[] {
    return this.enrichBodies(
      bodies.map((body) => ({
        ...body,
        position: { ...body.position },
        velocity: { ...body.velocity },
        force: { x: 0, y: 0 },
        speed: this.magnitude(body.velocity),
        kineticEnergy: 0,
        potentialEnergy: 0,
        totalEnergy: 0,
        trail: [{ ...body.position }],
      })),
    );
  }

  step(bodies: RuntimeBodyModel[], deltaTime: number): RuntimeBodyModel[] {
    if (!bodies.length) {
      return [];
    }

    const pairwise = this.computePairwiseData(bodies);

    const advancedBodies = bodies.map((body) => {
      const acceleration = {
        x: pairwise.forceMap.get(body.id)!.x / body.mass,
        y: pairwise.forceMap.get(body.id)!.y / body.mass,
      };

      const velocity = {
        x: body.velocity.x + acceleration.x * deltaTime,
        y: body.velocity.y + acceleration.y * deltaTime,
      };

      const position = {
        x: body.position.x + velocity.x * deltaTime,
        y: body.position.y + velocity.y * deltaTime,
      };

      return {
        ...body,
        position,
        velocity,
        trail: this.appendTrailPoint(body.trail, position),
      };
    });

    return this.enrichBodies(advancedBodies);
  }

  enrichBodies(bodies: RuntimeBodyModel[]): RuntimeBodyModel[] {
    const pairwise = this.computePairwiseData(bodies);

    return bodies.map((body) => {
      const force = pairwise.forceMap.get(body.id) ?? { x: 0, y: 0 };
      const speed = this.magnitude(body.velocity);
      const kineticEnergy = 0.5 * body.mass * speed * speed;
      const potentialEnergy = pairwise.potentialMap.get(body.id) ?? 0;

      return {
        ...body,
        force,
        speed,
        kineticEnergy,
        potentialEnergy,
        totalEnergy: kineticEnergy + potentialEnergy,
      };
    });
  }

  computeTotalEnergy(bodies: RuntimeBodyModel[]): number {
    return bodies.reduce((total, body) => total + body.totalEnergy, 0);
  }

  buildExplanation(
    bodies: RuntimeBodyModel[],
    selectedBodyId: string | null,
  ): string {
    if (!bodies.length) {
      return 'Adicione corpos para ver a gravidade agir no canvas.';
    }

    if (bodies.length === 1) {
      return 'Com apenas um corpo, nao ha forca gravitacional externa: ele segue em linha reta ou permanece parado.';
    }

    const selectedBody =
      bodies.find((body) => body.id === selectedBodyId) ?? bodies[0];
    const strongestInteraction = this.computeStrongestInteraction(bodies, selectedBody.id);
    const speed = selectedBody.speed.toFixed(2);
    const force = this.magnitude(selectedBody.force).toFixed(2);
    const energy = selectedBody.totalEnergy.toFixed(2);

    if (!strongestInteraction) {
      return `${selectedBody.name} esta se movendo a ${speed} u/s com energia ${energy}, mas a interacao gravitacional ainda e fraca.`;
    }

    const target = bodies.find((body) => body.id === strongestInteraction.targetId);

    return `${selectedBody.name} acelera em direcao a ${target?.name ?? 'outro corpo'}: a seta azul mostra a velocidade, a dourada mostra a forca gravitacional. Velocidade ${speed} u/s, forca ${force} N, energia ${energy}.`;
  }

  getDefaultOrbitalSpeed(distance: number, centralMass: number): number {
    return Math.sqrt((this.gravitationalConstant * centralMass) / distance);
  }

  private appendTrailPoint(
    trail: Vector2Model[],
    position: Vector2Model,
  ): Vector2Model[] {
    const nextTrail = [...trail, { ...position }];

    if (nextTrail.length <= this.maxTrailPoints) {
      return nextTrail;
    }

    return nextTrail.slice(nextTrail.length - this.maxTrailPoints);
  }

  private computeStrongestInteraction(
    bodies: RuntimeBodyModel[],
    bodyId: string,
  ): PairForceContribution | null {
    const pairwise = this.computePairwiseData(bodies);
    const relatedForces = pairwise.pairContributions.filter(
      (item) => item.sourceId === bodyId || item.targetId === bodyId,
    );

    if (!relatedForces.length) {
      return null;
    }

    const strongest = relatedForces.reduce((current, next) =>
      next.magnitude > current.magnitude ? next : current,
    );

    if (strongest.sourceId === bodyId) {
      return strongest;
    }

    return {
      sourceId: strongest.targetId,
      targetId: strongest.sourceId,
      magnitude: strongest.magnitude,
    };
  }

  private computePairwiseData(bodies: RuntimeBodyModel[]): {
    forceMap: Map<string, Vector2Model>;
    potentialMap: Map<string, number>;
    pairContributions: PairForceContribution[];
  } {
    const forceMap = new Map<string, Vector2Model>();
    const potentialMap = new Map<string, number>();
    const pairContributions: PairForceContribution[] = [];

    for (const body of bodies) {
      forceMap.set(body.id, { x: 0, y: 0 });
      potentialMap.set(body.id, 0);
    }

    for (let index = 0; index < bodies.length; index += 1) {
      for (let nestedIndex = index + 1; nestedIndex < bodies.length; nestedIndex += 1) {
        const source = bodies[index];
        const target = bodies[nestedIndex];
        const delta = {
          x: target.position.x - source.position.x,
          y: target.position.y - source.position.y,
        };
        const distanceSquared =
          delta.x * delta.x + delta.y * delta.y + this.softening;
        const distance = Math.sqrt(distanceSquared);
        const magnitude =
          (this.gravitationalConstant * source.mass * target.mass) / distanceSquared;
        const direction = {
          x: delta.x / distance,
          y: delta.y / distance,
        };
        const force = {
          x: magnitude * direction.x,
          y: magnitude * direction.y,
        };
        const potentialEnergy =
          -(this.gravitationalConstant * source.mass * target.mass) / distance;

        forceMap.set(source.id, this.addVectors(forceMap.get(source.id)!, force));
        forceMap.set(target.id, this.addVectors(forceMap.get(target.id)!, this.scaleVector(force, -1)));

        potentialMap.set(
          source.id,
          (potentialMap.get(source.id) ?? 0) + potentialEnergy / 2,
        );
        potentialMap.set(
          target.id,
          (potentialMap.get(target.id) ?? 0) + potentialEnergy / 2,
        );

        pairContributions.push({
          sourceId: source.id,
          targetId: target.id,
          magnitude,
        });
      }
    }

    return {
      forceMap,
      potentialMap,
      pairContributions,
    };
  }

  private magnitude(vector: Vector2Model): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  }

  private scaleVector(vector: Vector2Model, factor: number): Vector2Model {
    return {
      x: vector.x * factor,
      y: vector.y * factor,
    };
  }

  private addVectors(first: Vector2Model, second: Vector2Model): Vector2Model {
    return {
      x: first.x + second.x,
      y: first.y + second.y,
    };
  }
}
