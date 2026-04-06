import type { LineData } from "./Line";
import type { PointData } from "./Point";
import type { ImageData } from "./Image";

/**
 * Manages the internal current State of the Project
 */
export class SceneModel {
  /** current PointData */
  points = new Map<string, PointData>();
  /** current LineData */
  lines = new Map<string, LineData>();
  /** current ImageData */
  images = new Map<string, ImageData>();
}
