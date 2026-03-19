export interface BodyRecord {
  id: string;
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
