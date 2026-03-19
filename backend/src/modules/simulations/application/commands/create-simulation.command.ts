export interface CreateSimulationBodyCommand {
  name: string;
  mass: number;
  radius: number;
  color: string;
  position: {
    x: number;
    y: number;
  };
  velocity: {
    x: number;
    y: number;
  };
}

export interface CreateSimulationCommand {
  name: string;
  description: string | null;
  bodies: CreateSimulationBodyCommand[];
}
