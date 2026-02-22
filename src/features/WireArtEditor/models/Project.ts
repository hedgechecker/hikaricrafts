export interface Project {
  id: string;
  name: string;
  version: number;

  backgroundImage?: string;

  points: PointData[];
  lines: LineData[];
}

export interface PointData {
  id: string;
  x: number;
  y: number;
}

export interface LineData {
  id: string;
  startPointId: string;
  endPointId: string;
}
