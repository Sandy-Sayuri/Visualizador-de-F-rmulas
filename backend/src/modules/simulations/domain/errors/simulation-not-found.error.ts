export class SimulationNotFoundError extends Error {
  constructor(simulationId: string) {
    super(`Simulation with id "${simulationId}" was not found.`);
    this.name = 'SimulationNotFoundError';
  }
}
