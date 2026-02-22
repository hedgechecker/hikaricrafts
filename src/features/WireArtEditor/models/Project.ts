export interface Project {
  id: string;
  name: string;
  version: number;

  backgroundImage?: string;

  points: Map<string, PointData>;
  lines: Map<string, LineData>;
}

export interface PointData {
  x: number;
  y: number;
}

export interface LineData {
  startPointId: string;
  endPointId: string;
}
