export interface Project {
  id: string;
  name: string;
  version: number;

  background?: string;

  points: PointData[];
  lines: LineData[];
}

export interface PointData {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface LineData {
  id: string;
  startPointId: string;
  endPointId: string;
}

export class DataModel {
  points = new Map<string, PointData>();
  lines = new Map<string, LineData>();
}
