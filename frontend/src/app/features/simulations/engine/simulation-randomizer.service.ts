import { Injectable } from '@angular/core';

import { CreateBodyPayload } from '../models/create-simulation.model';
import { SimulationPhysicsService } from './simulation-physics.service';

@Injectable({
  providedIn: 'root',
})
export class SimulationRandomizerService {
  private readonly palette = ['#f4c66a', '#7ce6ff', '#ff8f70', '#a6ff96', '#d8b4ff'];

  constructor(private readonly physics: SimulationPhysicsService) {}

  generateRandomBodies(): CreateBodyPayload[] {
    const centralMass = 1200;
    const centralBody: CreateBodyPayload = {
      name: 'Helios',
      mass: centralMass,
      radius: 24,
      color: '#f4c66a',
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
    };

    const orbiters = Array.from({ length: 3 }).map((_, index) => {
      const distance = 120 + index * 60;
      const angle = Math.random() * Math.PI * 2;
      const orbitalSpeed =
        this.physics.getDefaultOrbitalSpeed(distance, centralMass) *
        (0.88 + Math.random() * 0.24);

      return {
        name: `Orbiter ${index + 1}`,
        mass: 14 + Math.random() * 42,
        radius: 8 + Math.random() * 8,
        color: this.palette[(index + 1) % this.palette.length],
        position: {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
        },
        velocity: {
          x: -Math.sin(angle) * orbitalSpeed,
          y: Math.cos(angle) * orbitalSpeed,
        },
      };
    });

    return [centralBody, ...orbiters];
  }
}
