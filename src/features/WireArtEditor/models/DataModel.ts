import type { Settings } from './Settings';

export interface Project {
  id: string | null;
  name: string;
  version: number;
  isPublic?: boolean;

  settings: Settings;

  points: PointData[];
  lines: LineData[];
  images: ImageData[];
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

export interface ImageData {
  id: string;
  url: string;
  x: number;
  y: number;
  rotation: number;
  height: number;
}

export class DataModel {
  points = new Map<string, PointData>();
  lines = new Map<string, LineData>();
  images = new Map<string, ImageData>();
}
