import type { LineData } from "./Line";
import type { PointData } from "./Point";
import type { ImageData } from './Image';
import type { Settings } from "./Settings";

export interface Project {
  id: number | null;
  name: string;
  version: number;
  isPublic?: boolean;

  points: PointData[];
  lines: LineData[];
  images: ImageData[];
  settings: Settings;
}